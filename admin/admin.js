import { ref, onValue, set, update, remove, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { db, sha256Hex, DEFAULT_ADMIN_PHONE, DEFAULT_ADMIN_PASS } from "../firebase-config.js";
import * as MenuDataModule from "../menu-data.js?v=99";

const EGYPT_PHONE_REGEX = /^01[0125][0-9]{8}$/;
const IDLE_TIMEOUT_MS = 5 * 60 * 1000;

function extractMenuDataFromModule(mod) {
  const src = mod?.default && typeof mod.default === "object" ? mod.default : mod || {};
  const rawCats = src.INITIAL_CATEGORIES || src.CATEGORIES || src.categories || [];
  const rawItems = src.INITIAL_MENU_ITEMS || src.MENU_ITEMS || src.menuItems || [];

  const catsArray = Array.isArray(rawCats) ? rawCats : Object.values(rawCats);
  const itemsArray = (Array.isArray(rawItems) ? rawItems : Object.values(rawItems)).map((item, idx) => {
    const cleanItem = {
      id: `rb_item_${idx + 1}`,
      category: item.category || "hot_coffee",
      nameAr: item.nameAr || `صنف ${idx + 1}`,
      nameEn: item.nameEn || "",
      descAr: item.descAr || "",
      price: Number(item.price) || (item.sizes?.[0]?.price ? Number(item.sizes[0].price) : 0),
      image: item.image || "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600",
      badge: item.badge || "",
      available: item.available !== false
    };
    if (Array.isArray(item.sizes) && item.sizes.length > 0) {
      cleanItem.sizes = item.sizes;
    }
    return cleanItem;
  });

  return { catsArray, itemsArray };
}
const { catsArray: LOCAL_CATEGORIES, itemsArray: LOCAL_MENU_ITEMS } = extractMenuDataFromModule(MenuDataModule);

let categories = [...LOCAL_CATEGORIES];
let menuItems = [...LOCAL_MENU_ITEMS];
let activeTabs = {};
let waiterCalls = {};
let completedSales = [];
let lastAlertStamp = Date.now();
let lastCallStamp = Date.now();
let targetPosTable = null;
let targetTabKey = null;
let selectedQrTables = new Set();
let currentReportPeriod = "today";
let filteredReportSales = [];
let idleTimer = null;

let settings = {
  totalTables: 20,
  taxEnabled: true,
  acceptingOrders: true,
  nameAr: "روست آند بيري كافيه",
  wifiName: "RoastBerry_5G",
  wifiPass: "RB@2026#Cafe",
  wifiChargeEnabled: false,
  wifiPrice: 15,
  wifiPermissions: {},
  taglineAr: "قهوة مختصة • فطار • سلطات • أطباق رئيسية • عصائر فريش وحلويات",
  addressAr: "شارع التسعين الشمالي، التجمع الخامس، القاهرة",
  hotline: "01018622861",
  logoUrl: ""
};

let design = {
  layout: "luxury",
  primaryColor: "#a65e2e",
  theme: "light",
  bgColor: "#f6f1eb",
  cardBg: "#fffdf9",
  fontFamily: "Cairo",
  mobileCols: "1"
};

async function verifySessionOrRedirect() {
  const raw = sessionStorage.getItem("rb_admin_session");
  if (!raw) {
    window.location.href = "../login/login.html";
    return false;
  }

  try {
    const parsed = JSON.parse(raw);
    let storedPhone = DEFAULT_ADMIN_PHONE;
    let storedHash = await sha256Hex(DEFAULT_ADMIN_PASS);

    try {
      const authSnap = await get(ref(db, "adminAuth"));
      if (authSnap.exists() && authSnap.val().phone && authSnap.val().passwordHash) {
        storedPhone = authSnap.val().phone;
        storedHash = authSnap.val().passwordHash;
      }
    } catch {}

    const expectedSig = await sha256Hex(`${storedPhone}|${storedHash}|RB_SESSION_2026`);
    if (parsed.phone !== storedPhone || parsed.sig !== expectedSig) {
      sessionStorage.removeItem("rb_admin_session");
      window.location.href = "../login/login.html";
      return false;
    }
    return true;
  } catch {
    sessionStorage.removeItem("rb_admin_session");
    window.location.href = "../login/login.html";
    return false;
  }
}

function setupIdleLock() {
  const resetTimer = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      sessionStorage.removeItem("rb_admin_session");
      window.location.href = "../login/login.html";
    }, IDLE_TIMEOUT_MS);
  };
  ["mousemove", "keydown", "click", "touchstart"].forEach((ev) => window.addEventListener(ev, resetTimer));
  resetTimer();
}

document.getElementById("logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem("rb_admin_session");
  window.location.href = "../login/login.html";
});

function playBellSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [
      { freq: 987.77, start: 0, dur: 0.4 },
      { freq: 1318.51, start: 0.15, dur: 0.6 }
    ].forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(n.freq, ctx.currentTime + n.start);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + n.start);
      gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + n.start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.start + n.dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + n.start);
      osc.stop(ctx.currentTime + n.start + n.dur);
    });
  } catch {}
}

async function syncMenuFromLocalData(forceOverwrite = false) {
  try {
    if (LOCAL_CATEGORIES.length) {
      categories = [...LOCAL_CATEGORIES];
      populateCategorySelect();
    }
    if (LOCAL_MENU_ITEMS.length) {
      menuItems = [...LOCAL_MENU_ITEMS];
      renderItemsTable();
      updateLivePreview();
    }

    const itemsRef = ref(db, "menuItems");
    const snap = await get(itemsRef);
    const dbCount = snap.exists() ? Object.keys(snap.val()).length : 0;

    if ((forceOverwrite || dbCount !== LOCAL_MENU_ITEMS.length) && LOCAL_MENU_ITEMS.length > 0) {
      if (LOCAL_CATEGORIES.length) {
        await set(ref(db, "categories"), LOCAL_CATEGORIES);
      }
      const itemsMap = {};
      LOCAL_MENU_ITEMS.forEach((item) => {
        itemsMap[item.id] = item;
      });
      await set(itemsRef, itemsMap);
    }
  } catch (err) {
    console.error("Sync menu-data error:", err);
  }
}

async function bootAdmin() {
  const isAuth = await verifySessionOrRedirect();
  if (!isAuth) return;

  document.getElementById("adminApp").style.display = "grid";
  setupIdleLock();

  populateCategorySelect();
  renderItemsTable();
  await syncMenuFromLocalData(false);

  onValue(ref(db, "settings"), (snap) => {
    if (snap.exists()) {
      settings = { ...settings, ...snap.val() };
      if (!settings.wifiPermissions) settings.wifiPermissions = {};
      populateSettingsForm();
      renderTablesDeck();
      renderOrdersDeck();
      renderAdminQRs();
      updateKPIs();
    }
  });

  onValue(ref(db, "categories"), (snap) => {
    if (snap.exists()) {
      const val = Array.isArray(snap.val()) ? snap.val() : Object.values(snap.val());
      if (val.length) {
        categories = val;
        populateCategorySelect();
        renderItemsTable();
      }
    }
  });

  onValue(ref(db, "menuItems"), (snap) => {
    if (snap.exists()) {
      const val = Object.values(snap.val());
      if (val.length) {
        menuItems = val;
        renderItemsTable();
        updateLivePreview();
      }
    }
  });

  onValue(ref(db, "activeTabs"), (snap) => {
    activeTabs = snap.exists() ? snap.val() : {};
    let maxStamp = lastAlertStamp;
    Object.values(activeTabs).forEach((tab) => {
      if (tab.status === "open" && tab.alertTimestamp > maxStamp) {
        maxStamp = tab.alertTimestamp;
        playBellSound();
        showToast(`🔔 طلب جديد على ترابيزة ${tab.tableNumber}`);
      }
    });
    lastAlertStamp = maxStamp;
    renderOrdersDeck();
    renderTablesDeck();
    updateKPIs();
  });

  onValue(ref(db, "waiterCalls"), (snap) => {
    waiterCalls = snap.exists() ? snap.val() : {};
    renderAlerts();
  });

  onValue(ref(db, "completedSales"), (snap) => {
    completedSales = snap.exists() ? Object.entries(snap.val()).map(([k, v]) => ({ saleKey: k, ...v })) : [];
    completedSales.sort((a, b) => (b.closedTimestamp || 0) - (a.closedTimestamp || 0));
    updateKPIs();
    renderReports();
  });

  onValue(ref(db, "design"), (snap) => {
    if (snap.exists()) {
      design = { ...design, ...snap.val() };
      syncDesignUI();
    }
  });

  document.getElementById("authNewPhone").value = DEFAULT_ADMIN_PHONE;
  initQrSelection();
  renderAdminQRs();
  syncDesignUI();
  if (window.lucide) lucide.createIcons();
}

document.querySelectorAll(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".view-panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    const target = btn.dataset.view;
    document.getElementById(target).classList.add("active");
    if (target === "viewQr") renderAdminQRs();
    if (target === "viewReports") renderReports();
    if (target === "viewDesign") updateLivePreview();
  });
});

function updateKPIs() {
  const totalTables = Number(settings.totalTables) || 20;
  const openTabsList = Object.values(activeTabs).filter((t) => t && t.status === "open");
  const occupiedCount = openTabsList.length;
  const freeCount = Math.max(0, totalTables - occupiedCount);
  const totalSalesSum = completedSales.reduce((s, o) => s + (Number(o.total) || 0), 0);

  document.getElementById("kpiTotalOrders").textContent = completedSales.length;
  document.getElementById("kpiTotalSales").textContent = `${totalSalesSum} ج.م`;
  document.getElementById("kpiFreeTables").textContent = `${freeCount} / ${totalTables}`;
  document.getElementById("kpiOccupiedTables").textContent = occupiedCount;
  document.getElementById("navOpenBadge").textContent = occupiedCount;
}

function renderAlerts() {
  const stack = document.getElementById("alertsStack");
  const activeCalls = Object.values(waiterCalls).filter((c) => c && c.status === "active");

  let maxCallTime = lastCallStamp;
  activeCalls.forEach((c) => {
    const t = Number(c.createdAt || String(c.id || "").replace(/\D/g, "")) || 0;
    if (t > maxCallTime) {
      maxCallTime = t;
      playBellSound();
      showToast(c.type === "bill" ? `🧾 ترابيزة ${c.table} تطلب الحساب!` : `🔔 ترابيزة ${c.table} تنادي الويتر!`);
    }
  });
  lastCallStamp = maxCallTime;

  if (!activeCalls.length) {
    stack.innerHTML = "";
    return;
  }
  stack.innerHTML = activeCalls
    .map(
      (c) => `
      <div class="alert-card">
        <span>🔔 ${c.type === "bill" ? `ترابيزة ${c.table} تطلب الحساب (${c.total} ج.م)` : `ترابيزة ${c.table} تنادي الويتر`} — ${c.timeFormatted || ""}</span>
        <button class="btn-mini gold" onclick="window.dismissCall('${c.id}')">تم الاستجابة ✔</button>
      </div>
    `
    )
    .join("");
}

window.dismissCall = async (id) => remove(ref(db, `waiterCalls/${id}`));

/* ==================== WIFI PERMISSION & BILLING ==================== */
function isWifiAllowedForTable(tableNum) {
  const key = `table_${tableNum}`;
  return Boolean(settings.wifiPermissions && settings.wifiPermissions[key] === true);
}

window.toggleTableWifi = async (tableNum) => {
  try {
    const cleanNum = String(tableNum).replace(/\D/g, "") || String(tableNum);
    const tabKey = `table_${cleanNum}`;
    const curAllowed = isWifiAllowedForTable(cleanNum);
    const nextState = !curAllowed;

    if (!settings.wifiPermissions) settings.wifiPermissions = {};
    settings.wifiPermissions[tabKey] = nextState;

    await update(ref(db, "settings/wifiPermissions"), {
      [tabKey]: nextState
    });

    if (nextState && settings.wifiChargeEnabled && Number(settings.wifiPrice) > 0) {
      const wifiFee = Number(settings.wifiPrice);
      const tabRef = ref(db, `activeTabs/${tabKey}`);
      const snap = await get(tabRef);
      const existing = snap.exists() && snap.val().status === "open" ? snap.val() : null;
      const items = existing && Array.isArray(existing.items) ? JSON.parse(JSON.stringify(existing.items)) : [];

      if (!items.some((i) => i.id === "wifi_service")) {
        items.push({
          id: "wifi_service",
          nameAr: "خدمة الإنترنت (Wi-Fi)",
          sizeAr: "",
          qty: 1,
          unitPrice: wifiFee,
          totalPrice: wifiFee
        });
        const subtotal = items.reduce((s, i) => s + Number(i.totalPrice), 0);
        const tax = settings.taxEnabled !== false ? Math.round(subtotal * 0.14) : 0;
        const nowStr = new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });

        await set(tabRef, {
          tableNumber: cleanNum,
          status: "open",
          items,
          subtotal,
          tax,
          total: subtotal + tax,
          openedAt: existing?.openedAt || nowStr,
          lastUpdatedAt: nowStr,
          alertTimestamp: existing?.alertTimestamp || Date.now()
        });
      }
    }

    renderOrdersDeck();
    renderTablesDeck();
    showToast(nextState ? `📶 تم تفعيل Wi-Fi لترابيزة ${cleanNum}` : `🔒 تم إخفاء Wi-Fi عن ترابيزة ${cleanNum}`);
  } catch (err) {
    console.error("WiFi Toggle Error:", err);
    showToast("❌ حدث خطأ أثناء تحديث إذن Wi-Fi: " + (err.message || ""));
  }
};

/* ==================== ORDERS & TABLES ==================== */
function renderOrdersDeck() {
  const container = document.getElementById("ordersContainer");
  const openEntries = Object.entries(activeTabs).filter(([, t]) => t && t.status === "open");

  if (!openEntries.length) {
    container.innerHTML = `<div class="surface-card" style="grid-column:1/-1;text-align:center;color:var(--muted);padding:48px 16px;">لا توجد حسابات مفتوحة حالياً</div>`;
    return;
  }

  container.innerHTML = openEntries
    .map(([tabKey, tab]) => {
      const wifiActive = isWifiAllowedForTable(tab.tableNumber);
      return `
        <div class="ticket-card">
          <div class="ticket-head">
            <span class="ticket-badge">ترابيزة ${tab.tableNumber}</span>
            <button type="button" class="btn-mini ${wifiActive ? "blue" : ""}" onclick="window.toggleTableWifi('${tab.tableNumber}')">
              ${wifiActive ? "📶 Wi-Fi مفعّل" : "🔒 تفعيل Wi-Fi"}
            </button>
          </div>
          <ul class="ticket-items">
            ${(tab.items || [])
              .map(
                (i, idx) => `
                <li class="ticket-item-row">
                  <div style="flex:1;min-width:0;">
                    <strong>${i.nameAr}</strong> ${i.sizeAr ? `<small>(${i.sizeAr})</small>` : ""}
                    <div style="font-size:0.76rem;color:var(--muted);">${i.totalPrice} ج.م</div>
                  </div>
                  <div class="qty-controls">
                    <button type="button" class="qty-btn" onclick="window.adjustTabItemQty('${tabKey}', ${idx}, -1)">−</button>
                    <strong style="min-width:18px;text-align:center;">${i.qty}</strong>
                    <button type="button" class="qty-btn" onclick="window.adjustTabItemQty('${tabKey}', ${idx}, 1)">+</button>
                    <button type="button" class="qty-btn del" onclick="window.adjustTabItemQty('${tabKey}', ${idx}, -999)">🗑</button>
                  </div>
                </li>
              `
              )
              .join("")}
          </ul>
          <div class="ticket-total">
            <span>المجموع (${tab.subtotal}) + ضريبة (${tab.tax})</span>
            <span style="color:var(--green);">${tab.total} ج.م</span>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;">
            <button class="btn-mini green" onclick="window.addItemToTable('${tab.tableNumber}', '${tabKey}')">+ صنف</button>
            <button class="btn-mini" onclick="window.printThermalReceipt('${tabKey}')">🖨️ ريسيت</button>
            <button class="btn-mini gold" style="margin-inline-start:auto;" onclick="window.settleTableTab('${tabKey}')">✔ تحصيل وإخلاء</button>
          </div>
        </div>
      `;
    })
    .join("");
}

window.adjustTabItemQty = async (tabKey, itemIndex, delta) => {
  const tab = activeTabs[tabKey];
  if (!tab || !Array.isArray(tab.items)) return;

  const items = JSON.parse(JSON.stringify(tab.items));
  if (!items[itemIndex]) return;

  items[itemIndex].qty += delta;
  if (items[itemIndex].qty <= 0) {
    items.splice(itemIndex, 1);
  } else {
    items[itemIndex].totalPrice = items[itemIndex].qty * Number(items[itemIndex].unitPrice);
  }

  if (items.length === 0) {
    await remove(ref(db, `activeTabs/${tabKey}`));
    await update(ref(db, "settings/wifiPermissions"), { [tabKey]: false });
    showToast("تم إغلاق الحساب وإلغاء إذن Wi-Fi");
    return;
  }

  const subtotal = items.reduce((s, i) => s + Number(i.totalPrice), 0);
  const tax = settings.taxEnabled !== false ? Math.round(subtotal * 0.14) : 0;

  await update(ref(db, `activeTabs/${tabKey}`), { items, subtotal, tax, total: subtotal + tax });
};

function renderTablesDeck() {
  const grid = document.getElementById("tablesGrid");
  const totalTables = Number(settings.totalTables) || 20;
  let html = "";

  for (let i = 1; i <= totalTables; i++) {
    const tabKey = `table_${i}`;
    const tab = activeTabs[tabKey];
    const isBusy = tab && tab.status === "open";
    const wifiActive = isWifiAllowedForTable(i);

    html += `
      <div class="table-tile ${isBusy ? "busy" : "free"}">
        <h3>ترابيزة ${i}</h3>
        <span class="status-pill">${isBusy ? "مشغولة" : "متاحة"}</span>
        <div style="font-size:0.8rem;color:var(--muted);min-height:24px;">
          ${isBusy ? `الحساب: <strong>${tab.total} ج.م</strong>` : "جاهزة"}
        </div>
        <div style="display:flex;gap:5px;justify-content:center;flex-wrap:wrap;">
          <button class="btn-mini green" onclick="window.addItemToTable('${i}', '${tabKey}')">+ صنف</button>
          <button class="btn-mini ${wifiActive ? "blue" : ""}" onclick="window.toggleTableWifi('${i}')">
            ${wifiActive ? "📶 Wi-Fi" : "🔒 Wi-Fi"}
          </button>
          ${isBusy ? `<button class="btn-mini gold" onclick="window.settleTableTab('${tabKey}')">تحصيل</button>` : ""}
        </div>
      </div>
    `;
  }
  grid.innerHTML = html;
}

window.addItemToTable = (tableLabel, tabKey = null) => {
  targetPosTable = String(tableLabel);
  targetTabKey = tabKey || `table_${tableLabel}`;
  document.getElementById("quickAddModalTitle").textContent = `إضافة صنف على ترابيزة ${targetPosTable}`;
  document.getElementById("quickPosSearchInput").value = "";
  renderQuickPosGrid("");
  document.getElementById("quickAddPosModal").classList.add("open");
  setTimeout(() => document.getElementById("quickPosSearchInput").focus(), 100);
};

function renderQuickPosGrid(query) {
  const grid = document.getElementById("quickPosItemsGrid");
  const q = query.trim().toLowerCase();
  const list = menuItems.filter(
    (m) => m.available !== false && ((m.nameAr || "").toLowerCase().includes(q) || (m.nameEn || "").toLowerCase().includes(q))
  );

  grid.innerHTML = list
    .map((m) => {
      const price = m.sizes?.length ? m.sizes[0].price : m.price;
      return `
        <button type="button" class="quick-pos-card" onclick="window.confirmQuickPosItem('${m.id}')">
          <div style="display:flex;align-items:center;gap:8px;font-size:0.82rem;">
            <img src="${m.image}" style="width:36px;height:36px;border-radius:8px;object-fit:cover;" />
            <strong>${m.nameAr}</strong>
          </div>
          <span style="font-weight:800;color:var(--green);font-size:0.82rem;">+ ${price} ج.م</span>
        </button>
      `;
    })
    .join("");
}

window.confirmQuickPosItem = async (itemId) => {
  if (!targetTabKey) return;
  const chosen = menuItems.find((m) => m.id === itemId);
  if (!chosen) return;

  const price = chosen.sizes?.length ? Number(chosen.sizes[0].price) : Number(chosen.price);
  const nowStr = new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
  const tabRef = ref(db, `activeTabs/${targetTabKey}`);
  const snap = await get(tabRef);
  const existing = snap.exists() && snap.val().status === "open" ? snap.val() : null;

  const items = existing && Array.isArray(existing.items) ? JSON.parse(JSON.stringify(existing.items)) : [];
  const sameIdx = items.findIndex((i) => i.id === chosen.id);

  if (sameIdx > -1) {
    items[sameIdx].qty += 1;
    items[sameIdx].totalPrice = items[sameIdx].qty * items[sameIdx].unitPrice;
  } else {
    items.push({
      id: chosen.id,
      nameAr: chosen.nameAr,
      sizeAr: chosen.sizes?.length ? chosen.sizes[0].nameAr : "",
      qty: 1,
      unitPrice: price,
      totalPrice: price
    });
  }

  const subtotal = items.reduce((s, i) => s + Number(i.totalPrice), 0);
  const tax = settings.taxEnabled !== false ? Math.round(subtotal * 0.14) : 0;

  await set(tabRef, {
    tableNumber: targetPosTable,
    status: "open",
    items,
    subtotal,
    tax,
    total: subtotal + tax,
    openedAt: existing?.openedAt || nowStr,
    lastUpdatedAt: nowStr,
    alertTimestamp: Date.now()
  });

  showToast(`تم إضافة "${chosen.nameAr}"`);
};

document.getElementById("quickPosSearchInput").addEventListener("input", (e) => renderQuickPosGrid(e.target.value));
document.getElementById("closeQuickAddPosBtn").addEventListener("click", () => {
  document.getElementById("quickAddPosModal").classList.remove("open");
});

window.settleTableTab = async (tabKey) => {
  const tab = activeTabs[tabKey];
  if (!tab) return;
  if (!confirm(`تأكيد تحصيل مبلغ ${tab.total} ج.م وإخلاء الترابيزة وإيقاف Wi-Fi؟`)) return;

  const now = new Date();
  const saleId = `sale_${Date.now()}`;
  await set(ref(db, `completedSales/${saleId}`), {
    ...tab,
    saleId,
    status: "closed",
    dateISO: now.toISOString().split("T")[0],
    closedTimestamp: now.getTime(),
    closedAt: now.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
  });

  await remove(ref(db, `activeTabs/${tabKey}`));
  await update(ref(db, "settings/wifiPermissions"), { [tabKey]: false });
  showToast("تم التحصيل وإخلاء الترابيزة وإيقاف Wi-Fi تلقائياً");
};

/* ==================== الريسيت الحراري (ورقة واحدة 80mm) ==================== */
window.printThermalReceipt = (tabKey) => {
  const tab = activeTabs[tabKey];
  if (!tab) return;
  const receiptNo = String(Date.now()).slice(-5);
  const area = document.getElementById("thermalPrintArea");

  area.innerHTML = `
    <div style="border:2px solid #000;border-radius:8px;padding:8px;background:#fff;color:#000;box-sizing:border-box;">
      <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:6px;margin-bottom:6px;">
        <div style="font-size:16px;font-weight:900;">☕ ${settings.nameAr}</div>
        <div style="font-size:9.5px;margin-top:2px;">${settings.addressAr}</div>
        <div style="font-size:9.5px;margin-top:1px;">هاتف: ${settings.hotline || "01018622861"}</div>
      </div>

      <div style="display:flex;justify-content:space-between;background:#eee;padding:4px 6px;border-radius:4px;font-size:10.5px;font-weight:800;margin-bottom:4px;">
        <span>فاتورة #${receiptNo}</span>
        <span>ترابيزة: ${tab.tableNumber}</span>
      </div>

      <div style="font-size:9.5px;text-align:center;margin-bottom:6px;font-weight:600;">
        ${new Date().toLocaleDateString("ar-EG")} • ${new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:10.5px;margin-bottom:7px;">
        <thead>
          <tr style="background:#000;color:#fff;">
            <th style="text-align:right;padding:4px 5px;">الصنف</th>
            <th style="text-align:center;padding:4px 4px;">الكمية</th>
            <th style="text-align:left;padding:4px 5px;">السعر</th>
          </tr>
        </thead>
        <tbody>
          ${(tab.items || [])
            .map(
              (i) => `
              <tr style="border-bottom:1px dashed #888;">
                <td style="padding:4px;font-weight:700;">${i.nameAr} ${i.sizeAr ? `(${i.sizeAr})` : ""}</td>
                <td style="text-align:center;padding:4px;font-weight:800;">${i.qty}</td>
                <td style="text-align:left;padding:4px;font-weight:800;">${i.totalPrice}</td>
              </tr>
            `
            )
            .join("")}
        </tbody>
      </table>

      <div style="border-top:1.5px solid #000;padding-top:5px;font-size:10.5px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
          <span>المجموع الفرعي:</span>
          <strong>${tab.subtotal} ج.م</strong>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
          <span>ضريبة القيمة المضافة (14%):</span>
          <strong>${tab.tax} ج.م</strong>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:900;border:2px solid #000;padding:4px 7px;border-radius:5px;background:#f5f5f5;">
          <span>الإجمالي المطلوب:</span>
          <span>${tab.total} ج.م</span>
        </div>
      </div>

      <div style="text-align:center;margin-top:8px;border-top:1px dashed #000;padding-top:5px;font-size:10.5px;font-weight:800;">
        شرفتونا في ${settings.nameAr} ☕<br/>
        <span style="font-size:8.5px;font-weight:600;">الأسعار شاملة الضريبة</span>
      </div>
    </div>
  `;
  window.print();
};

/* ==================== MENU ITEMS CRUD & PDF ==================== */
function populateCategorySelect() {
  const sel = document.getElementById("fCategory");
  if (!sel) return;
  sel.innerHTML = categories
    .filter((c) => c.id !== "all")
    .map((c) => `<option value="${c.id}">${c.nameAr}</option>`)
    .join("");
}

function renderItemsTable() {
  const tbody = document.getElementById("itemsTableBody");
  if (!tbody) return;
  tbody.innerHTML = menuItems
    .map((item) => {
      const cat = categories.find((c) => c.id === item.category);
      const price = item.sizes?.length ? item.sizes[0].price : item.price;
      return `
        <tr>
          <td><img src="${item.image}" class="thumb-img" alt="" /></td>
          <td><strong>${item.nameAr}</strong></td>
          <td>${cat ? cat.nameAr : item.category}</td>
          <td><strong>${price} ج.م</strong></td>
          <td>
            <button class="btn-mini ${item.available !== false ? "green" : "red"}" onclick="window.toggleItemAvail('${item.id}', ${item.available !== false})">
              ${item.available !== false ? "متاح" : "نفذ"}
            </button>
          </td>
          <td>
            <button class="btn-mini" onclick="window.editMenuItem('${item.id}')">تعديل</button>
            <button class="btn-mini red" onclick="window.deleteMenuItem('${item.id}')">حذف</button>
          </td>
        </tr>
      `;
    })
    .join("");
}

window.toggleItemAvail = async (id, cur) => update(ref(db, `menuItems/${id}`), { available: !cur });
window.deleteMenuItem = async (id) => {
  if (confirm("حذف الصنف نهائياً؟")) await remove(ref(db, `menuItems/${id}`));
};

document.getElementById("openNewItemBtn").addEventListener("click", () => {
  document.getElementById("itemForm").reset();
  document.getElementById("editItemId").value = "";
  document.getElementById("itemModal").classList.add("open");
});

window.editMenuItem = (id) => {
  const item = menuItems.find((i) => i.id === id);
  if (!item) return;
  document.getElementById("editItemId").value = item.id;
  document.getElementById("fNameAr").value = item.nameAr;
  document.getElementById("fNameEn").value = item.nameEn || "";
  document.getElementById("fCategory").value = item.category;
  document.getElementById("fPrice").value = item.sizes?.length ? item.sizes[0].price : item.price;
  document.getElementById("fImage").value = item.image;
  document.getElementById("fDescAr").value = item.descAr || "";
  document.getElementById("itemModal").classList.add("open");
};

document.getElementById("closeItemModalBtn").addEventListener("click", () => {
  document.getElementById("itemModal").classList.remove("open");
});

document.getElementById("fImageFile").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = () => (document.getElementById("fImage").value = r.result);
  r.readAsDataURL(file);
});

document.getElementById("itemForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("editItemId").value || `rb_item_${Date.now()}`;
  await set(ref(db, `menuItems/${id}`), {
    id,
    nameAr: document.getElementById("fNameAr").value.trim(),
    nameEn: document.getElementById("fNameEn").value.trim(),
    category: document.getElementById("fCategory").value,
    price: Number(document.getElementById("fPrice").value),
    image: document.getElementById("fImage").value.trim(),
    descAr: document.getElementById("fDescAr").value.trim(),
    available: true
  });
  document.getElementById("itemModal").classList.remove("open");
  showToast("تم حفظ الصنف");
});

document.getElementById("exportFullMenuPdfBtn").addEventListener("click", () => {
  const wrapper = document.createElement("div");
  wrapper.style.padding = "18px";
  wrapper.style.fontFamily = "Arial, Tahoma, sans-serif";
  wrapper.style.letterSpacing = "normal";
  wrapper.style.wordSpacing = "normal";
  wrapper.dir = "rtl";
  wrapper.style.background = "#ffffff";
  wrapper.style.color = "#1c1917";

  let sectionsHtml = `
    <div style="text-align:center;border-bottom:3px solid #a65e2e;padding-bottom:12px;margin-bottom:18px;">
      <h1 style="color:#23150d;font-size:22px;margin-bottom:4px;">${settings.nameAr}</h1>
      <p style="color:#57534e;font-size:12px;">${settings.taglineAr}</p>
    </div>
  `;

  categories
    .filter((c) => c.id !== "all")
    .forEach((cat) => {
      const catItems = menuItems.filter((m) => m.category === cat.id);
      if (!catItems.length) return;
      sectionsHtml += `
        <div style="margin-bottom:18px;">
          <div style="background:#23150d;color:#fff;padding:7px 14px;border-radius:8px;font-size:14px;font-weight:bold;margin-bottom:10px;">
            ${cat.nameAr} (${catItems.length})
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:11.5px;">
            <tbody>
              ${catItems
                .map(
                  (m) => `
                <tr style="border-bottom:1px solid #e5ddd3;page-break-inside:avoid;">
                  <td style="padding:7px 6px;width:54px;">
                    <img src="${m.image}" style="width:46px;height:46px;border-radius:8px;object-fit:cover;display:block;" crossorigin="anonymous" />
                  </td>
                  <td style="padding:7px 8px;">
                    <div style="font-weight:bold;font-size:12.5px;color:#1c1917;margin-bottom:2px;">${m.nameAr}</div>
                    <div style="color:#6b645e;font-size:10.5px;line-height:1.4;">${m.descAr || ""}</div>
                  </td>
                  <td style="padding:7px 8px;text-align:left;white-space:nowrap;font-weight:bold;color:#a65e2e;font-size:12.5px;width:75px;">
                    ${m.sizes?.length ? m.sizes[0].price : m.price} ج.م
                  </td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `;
    });

  wrapper.innerHTML = sectionsHtml;
  html2pdf()
    .set({
      margin: 8,
      filename: `${settings.nameAr}-Catalog.pdf`,
      html2canvas: { scale: 2, useCORS: true, letterRendering: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    })
    .from(wrapper)
    .save();
});

/* ==================== REPORTS ==================== */
function renderReports() {
  const tbody = document.getElementById("reportsTableBody");
  if (!tbody) return;

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const weekAgoMs = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const monthPrefix = todayStr.slice(0, 7);

  filteredReportSales = completedSales.filter((s) => {
    const dStr = s.dateISO || todayStr;
    const ms = s.closedTimestamp || now.getTime();
    if (currentReportPeriod === "today") return dStr === todayStr;
    if (currentReportPeriod === "week") return ms >= weekAgoMs;
    if (currentReportPeriod === "month") return dStr.startsWith(monthPrefix);
    return true;
  });

  const count = filteredReportSales.length;
  const subTotal = filteredReportSales.reduce((s, o) => s + (Number(o.subtotal) || 0), 0);
  const taxTotal = filteredReportSales.reduce((s, o) => s + (Number(o.tax) || 0), 0);
  const grandTotal = filteredReportSales.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const avgOrder = count ? Math.round(grandTotal / count) : 0;

  const itemCounts = {};
  filteredReportSales.forEach((s) => {
    (s.items || []).forEach((i) => {
      itemCounts[i.nameAr] = (itemCounts[i.nameAr] || 0) + (Number(i.qty) || 1);
    });
  });
  const topItemEntry = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0];

  document.getElementById("repOrdersCount").textContent = count;
  document.getElementById("repAvgOrder").textContent = `${avgOrder} ج.م`;
  document.getElementById("repTopItem").textContent = topItemEntry ? `${topItemEntry[0]} (${topItemEntry[1]})` : "--";
  document.getElementById("repGrandTotal").textContent = `${grandTotal} ج.م`;

  document.getElementById("repFooterCount").textContent = count;
  document.getElementById("repFooterSub").textContent = `${subTotal} ج.م`;
  document.getElementById("repFooterTax").textContent = `${taxTotal} ج.م`;
  document.getElementById("repFooterGrand").textContent = `${grandTotal} ج.م`;

  if (!count) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--muted);">لا توجد فواتير في هذه الفترة</td></tr>`;
    return;
  }

  tbody.innerHTML = filteredReportSales
    .map(
      (s, idx) => `
      <tr>
        <td><strong>#${count - idx}</strong></td>
        <td>ترابيزة ${s.tableNumber}</td>
        <td>${s.dateISO || todayStr}</td>
        <td>${s.closedAt || ""}</td>
        <td>${(s.items || []).map((i) => `${i.qty}× ${i.nameAr}`).join(" ، ")}</td>
        <td>${s.subtotal || 0} ج.م</td>
        <td>${s.tax || 0} ج.م</td>
        <td><strong style="color:var(--green);">${s.total || 0} ج.م</strong></td>
      </tr>
    `
    )
    .join("");
}

document.querySelectorAll("[data-period]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-period]").forEach((b) => b.classList.remove("active-filter"));
    btn.classList.add("active-filter");
    currentReportPeriod = btn.dataset.period;
    renderReports();
  });
});

document.getElementById("exportExcelBtn").addEventListener("click", () => {
  if (!filteredReportSales.length) return showToast("لا توجد بيانات للتصدير");
  const rows = filteredReportSales.map((s, idx) => ({
    "رقم الفاتورة": filteredReportSales.length - idx,
    "الترابيزة": s.tableNumber,
    "التاريخ": s.dateISO || "",
    "الوقت": s.closedAt || "",
    "الأصناف": (s.items || []).map((i) => `${i.qty}x ${i.nameAr}`).join(" | "),
    "الصافي": Number(s.subtotal) || 0,
    "الضريبة": Number(s.tax) || 0,
    "الإجمالي": Number(s.total) || 0
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "تقرير المبيعات");
  XLSX.writeFile(wb, `RoastBerry-Sales-${currentReportPeriod}.xlsx`);
});

document.getElementById("exportReportPdfBtn").addEventListener("click", () => {
  if (!filteredReportSales.length) return showToast("لا توجد بيانات للتصدير");

  const count = filteredReportSales.length;
  const subTotal = filteredReportSales.reduce((s, o) => s + (Number(o.subtotal) || 0), 0);
  const taxTotal = filteredReportSales.reduce((s, o) => s + (Number(o.tax) || 0), 0);
  const grandTotal = filteredReportSales.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const avgOrder = count ? Math.round(grandTotal / count) : 0;

  const wrapper = document.createElement("div");
  wrapper.dir = "rtl";
  wrapper.style.padding = "20px";
  wrapper.style.fontFamily = "Arial, Tahoma, sans-serif";
  wrapper.style.letterSpacing = "normal";
  wrapper.style.wordSpacing = "normal";
  wrapper.style.background = "#ffffff";
  wrapper.style.color = "#1c1917";

  wrapper.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #a65e2e;padding-bottom:12px;margin-bottom:16px;">
      <div>
        <h2 style="margin:0 0 4px;color:#23150d;font-size:20px;">تقرير المبيعات والحسابات — ${settings.nameAr}</h2>
        <div style="font-size:11.5px;color:#57534e;">${settings.addressAr || ""} | هاتف: ${settings.hotline || "01018622861"}</div>
      </div>
      <div style="text-align:left;font-size:11.5px;color:#57534e;">
        <div><strong>تاريخ التصدير:</strong> ${new Date().toLocaleDateString("ar-EG")}</div>
        <div><strong>عدد الفواتير:</strong> ${count} فاتورة</div>
      </div>
    </div>

    <table style="width:100%;border-collapse:separate;border-spacing:8px 0;margin-bottom:16px;">
      <tr>
        <td style="background:#faf8f5;border:1.5px solid #e5ded5;border-radius:10px;padding:10px;text-align:center;width:25%;">
          <div style="font-size:11px;color:#6e665f;margin-bottom:3px;">عدد الفواتير</div>
          <div style="font-size:17px;font-weight:bold;color:#1c1917;">${count}</div>
        </td>
        <td style="background:#faf8f5;border:1.5px solid #e5ded5;border-radius:10px;padding:10px;text-align:center;width:25%;">
          <div style="font-size:11px;color:#6e665f;margin-bottom:3px;">متوسط الفاتورة</div>
          <div style="font-size:17px;font-weight:bold;color:#a65e2e;">${avgOrder} ج.م</div>
        </td>
        <td style="background:#faf8f5;border:1.5px solid #e5ded5;border-radius:10px;padding:10px;text-align:center;width:25%;">
          <div style="font-size:11px;color:#6e665f;margin-bottom:3px;">إجمالي الضريبة</div>
          <div style="font-size:17px;font-weight:bold;color:#1c1917;">${taxTotal} ج.م</div>
        </td>
        <td style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:10px;padding:10px;text-align:center;width:25%;">
          <div style="font-size:11px;color:#15803d;margin-bottom:3px;">إجمالي الإيرادات</div>
          <div style="font-size:18px;font-weight:bold;color:#15803d;">${grandTotal} ج.م</div>
        </td>
      </tr>
    </table>

    <table style="width:100%;border-collapse:collapse;font-size:11px;">
      <thead>
        <tr style="background:#23150d;color:#ffffff;">
          <th style="padding:8px 6px;border:1px solid #23150d;width:45px;">#</th>
          <th style="padding:8px 6px;border:1px solid #23150d;width:85px;">الترابيزة</th>
          <th style="padding:8px 6px;border:1px solid #23150d;width:130px;">التاريخ والوقت</th>
          <th style="padding:8px 8px;border:1px solid #23150d;text-align:right;">الأصناف المطلوبة</th>
          <th style="padding:8px 6px;border:1px solid #23150d;width:80px;">الصافي</th>
          <th style="padding:8px 6px;border:1px solid #23150d;width:80px;">الضريبة</th>
          <th style="padding:8px 6px;border:1px solid #23150d;width:90px;">الإجمالي</th>
        </tr>
      </thead>
      <tbody>
        ${filteredReportSales
          .map(
            (s, idx) => `
          <tr style="background:${idx % 2 === 0 ? "#ffffff" : "#faf8f5"};page-break-inside:avoid;">
            <td style="padding:7px 6px;border:1px solid #e5ded5;text-align:center;font-weight:bold;">${count - idx}</td>
            <td style="padding:7px 6px;border:1px solid #e5ded5;text-align:center;white-space:nowrap;">ترابيزة ${s.tableNumber}</td>
            <td style="padding:7px 6px;border:1px solid #e5ded5;text-align:center;white-space:nowrap;">${s.dateISO || ""} | ${s.closedAt || ""}</td>
            <td style="padding:7px 8px;border:1px solid #e5ded5;line-height:1.45;">${(s.items || []).map((i) => `${i.qty} × ${i.nameAr}`).join(" ، ")}</td>
            <td style="padding:7px 6px;border:1px solid #e5ded5;text-align:center;white-space:nowrap;">${s.subtotal || 0} ج.م</td>
            <td style="padding:7px 6px;border:1px solid #e5ded5;text-align:center;white-space:nowrap;">${s.tax || 0} ج.م</td>
            <td style="padding:7px 6px;border:1px solid #e5ded5;text-align:center;white-space:nowrap;font-weight:bold;color:#15803d;">${s.total || 0} ج.م</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
      <tfoot>
        <tr style="background:#f3efe9;font-weight:bold;font-size:12px;">
          <td colspan="4" style="padding:9px 8px;border:1px solid #d6ccc2;text-align:right;">الإجمالي الكلي (${count} فاتورة)</td>
          <td style="padding:9px 6px;border:1px solid #d6ccc2;text-align:center;white-space:nowrap;">${subTotal} ج.م</td>
          <td style="padding:9px 6px;border:1px solid #d6ccc2;text-align:center;white-space:nowrap;">${taxTotal} ج.م</td>
          <td style="padding:9px 6px;border:1px solid #d6ccc2;text-align:center;white-space:nowrap;color:#15803d;">${grandTotal} ج.م</td>
        </tr>
      </tfoot>
    </table>
  `;

  html2pdf()
    .set({
      margin: 8,
      filename: `RoastBerry-Sales-${currentReportPeriod}.pdf`,
      html2canvas: { scale: 2, letterRendering: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "landscape" }
    })
    .from(wrapper)
    .save();
});

/* ==================== QR GENERATOR ==================== */
function initQrSelection() {
  const total = Number(settings.totalTables) || 20;
  selectedQrTables.clear();
  for (let i = 1; i <= total; i++) selectedQrTables.add(i);
}

function renderAdminQRs() {
  const grid = document.getElementById("adminQrGrid");
  const base = document.getElementById("qrBaseUrlInput").value.trim().replace(/\/+$/, "");
  const total = Number(settings.totalTables) || 20;
  if (!grid || typeof QRCode === "undefined") return;

  grid.innerHTML = "";
  for (let i = 1; i <= total; i++) {
    const url = `${base}/?table=${i}`;
    const card = document.createElement("div");
    card.className = `qr-select-card ${selectedQrTables.has(i) ? "selected" : ""}`;
    card.innerHTML = `
      <label style="font-size:0.75rem;font-weight:800;cursor:pointer;">
        <input type="checkbox" ${selectedQrTables.has(i) ? "checked" : ""} onchange="window.toggleQrTable(${i}, this.checked)" /> تحديد ترابيزة ${i}
      </label>
      <div id="qrCanvas_${i}" style="padding:6px;background:#fff;border-radius:10px;"></div>
      <span class="ticket-badge">ترابيزة ${i}</span>
    `;
    grid.appendChild(card);
    new QRCode(document.getElementById(`qrCanvas_${i}`), { text: url, width: 120, height: 120 });
  }
  document.getElementById("qrSelectedCounter").textContent = `المحدد للطباعة: ${selectedQrTables.size} ترابيزة`;
}

window.toggleQrTable = (num, checked) => {
  if (checked) selectedQrTables.add(num);
  else selectedQrTables.delete(num);
  renderAdminQRs();
};

document.getElementById("selectAllQrBtn").addEventListener("click", () => {
  initQrSelection();
  renderAdminQRs();
});

document.getElementById("applySpecificQrBtn").addEventListener("click", () => {
  const raw = document.getElementById("qrSpecificInput").value.trim();
  const parsed = new Set();
  raw.split(/[,،\s]+/).forEach((part) => {
    if (part.includes("-")) {
      const [s, e] = part.split("-").map(Number);
      for (let n = s; n <= e; n++) if (n > 0) parsed.add(n);
    } else if (Number(part) > 0) parsed.add(Number(part));
  });
  if (parsed.size) {
    selectedQrTables = parsed;
    renderAdminQRs();
  }
});

document.getElementById("printSelectedQrBtn").addEventListener("click", () => {
  const list = Array.from(selectedQrTables).sort((a, b) => a - b);
  if (!list.length) return showToast("حدد ترابيزة واحدة على الأقل");
  const w = window.open("", "_blank");
  const cards = list
    .map((i) => {
      const src = document.querySelector(`#qrCanvas_${i} img`)?.src || document.querySelector(`#qrCanvas_${i} canvas`)?.toDataURL() || "";
      return `<div style="border:1.5px dashed #999;border-radius:12px;padding:12px;text-align:center;"><h4>${settings.nameAr}</h4><img src="${src}" style="width:120px;height:120px;"/><div style="font-weight:bold;">ترابيزة ${i}</div></div>`;
    })
    .join("");
  w.document.write(`<html dir="rtl"><body style="font-family:Cairo,sans-serif;display:grid;grid-template-columns:repeat(3,1fr);gap:10mm;">${cards}<script>window.onload=()=>window.print()<\/script></body></html>`);
  w.document.close();
});

/* ==================== DESIGN STUDIO ==================== */
function syncDesignUI() {
  document.querySelectorAll(".design-radio-card").forEach((el) => {
    const isMatch = el.dataset.layout === design.layout;
    el.classList.toggle("active", isMatch);
    const radio = el.querySelector("input[type='radio']");
    if (radio) radio.checked = isMatch;
  });
  if (document.getElementById("designCustomColor")) document.getElementById("designCustomColor").value = design.primaryColor || "#a65e2e";
  if (document.getElementById("designBgColor")) document.getElementById("designBgColor").value = design.bgColor || "#f6f1eb";
  if (document.getElementById("designCardBg")) document.getElementById("designCardBg").value = design.cardBg || "#fffdf9";
  if (document.getElementById("designTheme")) document.getElementById("designTheme").value = design.theme || "light";
  if (document.getElementById("designFontFamily")) document.getElementById("designFontFamily").value = design.fontFamily || "Cairo";
  if (document.getElementById("designMobileCols")) document.getElementById("designMobileCols").value = design.mobileCols || "1";
  updateLivePreview();
}

function updateLivePreview() {
  const box = document.getElementById("livePreviewCardBox");
  const badge = document.getElementById("previewLayoutBadge");
  if (!box) return;

  const sample = menuItems[0] || {
    nameAr: "سبانش لاتيه مثلج",
    descAr: "إسبريسو غني مع حليب مكثف محلى وثلج مجروش",
    price: 75,
    image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600"
  };
  const price = sample.sizes?.length ? sample.sizes[0].price : sample.price;
  const brandColor = design.primaryColor || "#f59e0b";
  if (badge) badge.textContent = design.layout;

  if (design.layout === "classic_text") {
    box.innerHTML = `
      <div style="background:#1e2433;border-radius:14px;padding:16px;border:1px solid rgba(255,255,255,0.08);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <strong style="font-size:1rem;">${sample.nameAr}</strong>
          <span style="color:#fbbf24;font-weight:900;">${price} ج.م</span>
        </div>
        <p style="font-size:0.78rem;color:#94a3b8;margin-bottom:12px;">${sample.descAr || ""}</p>
        <button style="background:${brandColor};color:#fff;border:none;padding:7px 16px;border-radius:9px;font-weight:800;font-family:inherit;">+ أضف</button>
      </div>
    `;
    return;
  }

  if (design.layout === "compact" || design.layout === "editorial") {
    box.innerHTML = `
      <div style="background:#1e2433;border-radius:14px;padding:12px;display:flex;align-items:center;gap:12px;border:1px solid rgba(255,255,255,0.08);">
        <img src="${sample.image}" style="width:76px;height:76px;border-radius:12px;object-fit:cover;flex-shrink:0;" />
        <div style="flex:1;">
          <strong style="display:block;font-size:0.95rem;margin-bottom:4px;">${sample.nameAr}</strong>
          <small style="display:block;font-size:0.74rem;color:#94a3b8;margin-bottom:8px;">${sample.descAr || ""}</small>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <strong style="color:#fbbf24;">${price} ج.م</strong>
            <button style="background:${brandColor};color:#fff;border:none;padding:5px 14px;border-radius:8px;font-weight:800;font-family:inherit;">+ أضف</button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  box.innerHTML = `
    <div style="background:#1e2433;border-radius:16px;overflow:hidden;border:1px solid ${design.layout === "spotlight" ? brandColor : "rgba(255,255,255,0.08)"};">
      <div style="position:relative;">
        <img src="${sample.image}" style="width:100%;height:175px;object-fit:cover;display:block;" />
        <span style="position:absolute;top:10px;right:10px;background:#f59e0b;color:#181412;padding:3px 10px;border-radius:8px;font-size:0.72rem;font-weight:900;">الأكثر طلباً</span>
      </div>
      <div style="padding:14px;">
        <h4 style="font-size:1.05rem;font-weight:900;margin-bottom:4px;color:#fff;">${sample.nameAr}</h4>
        <p style="font-size:0.76rem;color:#94a3b8;margin-bottom:12px;line-height:1.5;">${sample.descAr || ""}</p>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <strong style="font-size:1.05rem;color:#fbbf24;">${price} ج.م</strong>
          <button style="background:#f59e0b;color:#181412;border:none;padding:7px 18px;border-radius:10px;font-weight:900;font-family:inherit;">+ أضف</button>
        </div>
      </div>
    </div>
  `;
}

document.querySelectorAll(".design-radio-card").forEach((el) => {
  el.addEventListener("click", () => {
    design.layout = el.dataset.layout;
    syncDesignUI();
  });
});

["designCustomColor", "designBgColor", "designCardBg", "designTheme", "designFontFamily", "designMobileCols"].forEach((id) => {
  document.getElementById(id)?.addEventListener("input", (e) => {
    const map = {
      designCustomColor: "primaryColor",
      designBgColor: "bgColor",
      designCardBg: "cardBg",
      designTheme: "theme",
      designFontFamily: "fontFamily",
      designMobileCols: "mobileCols"
    };
    design[map[id]] = e.target.value;
    updateLivePreview();
  });
});

document.getElementById("resetDesignBtn")?.addEventListener("click", () => {
  design = {
    layout: "luxury",
    primaryColor: "#a65e2e",
    bgColor: "#f6f1eb",
    cardBg: "#fffdf9",
    theme: "light",
    fontFamily: "Cairo",
    mobileCols: "1"
  };
  syncDesignUI();
  showToast("تمت استعادة الإعدادات الافتراضية");
});

document.getElementById("saveDesignBtn").addEventListener("click", async () => {
  await set(ref(db, "design"), design);
  showToast("تم حفظ ونشر التصميم على منيو العملاء");
});

/* ==================== SETTINGS & AUTH ==================== */
function populateSettingsForm() {
  document.getElementById("adminCafeName").textContent = settings.nameAr;
  document.getElementById("setNameAr").value = settings.nameAr;
  document.getElementById("setTotalTables").value = settings.totalTables || 20;
  document.getElementById("setTaxEnabled").value = String(settings.taxEnabled !== false);
  document.getElementById("setAccepting").value = String(settings.acceptingOrders !== false);
  document.getElementById("setWifiName").value = settings.wifiName || "";
  document.getElementById("setWifiPass").value = settings.wifiPass || "";
  document.getElementById("setWifiChargeEnabled").value = String(Boolean(settings.wifiChargeEnabled));
  document.getElementById("setWifiPrice").value = settings.wifiPrice || 15;
  document.getElementById("setAddressAr").value = settings.addressAr || "";
  document.getElementById("setTaglineAr").value = settings.taglineAr || "";
  if (settings.logoUrl) {
    document.getElementById("sidebarLogoWrap").innerHTML = `<img src="${settings.logoUrl}" alt="Logo" />`;
    document.getElementById("dynamicFavicon").href = settings.logoUrl;
  }
}

document.getElementById("setLogoFile").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = () => (settings.logoUrl = r.result);
  r.readAsDataURL(file);
});

document.getElementById("settingsForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  await set(ref(db, "settings"), {
    ...settings,
    nameAr: document.getElementById("setNameAr").value.trim(),
    totalTables: Number(document.getElementById("setTotalTables").value) || 20,
    taxEnabled: document.getElementById("setTaxEnabled").value === "true",
    acceptingOrders: document.getElementById("setAccepting").value === "true",
    wifiName: document.getElementById("setWifiName").value.trim(),
    wifiPass: document.getElementById("setWifiPass").value.trim(),
    wifiChargeEnabled: document.getElementById("setWifiChargeEnabled").value === "true",
    wifiPrice: Number(document.getElementById("setWifiPrice").value) || 0,
    addressAr: document.getElementById("setAddressAr").value.trim(),
    taglineAr: document.getElementById("setTaglineAr").value.trim()
  });
  showToast("تم حفظ الإعدادات");
});

document.getElementById("securityAuthForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const phone = document.getElementById("authNewPhone").value.trim();
  const pass = document.getElementById("authNewPass").value;
  if (!EGYPT_PHONE_REGEX.test(phone)) return showToast("رقم الهاتف المصري يجب أن يكون 11 رقم");
  if (pass.length < 6) return showToast("كلمة المرور 6 أحرف على الأقل");

  const passwordHash = await sha256Hex(pass);
  await set(ref(db, "adminAuth"), { phone, passwordHash, customUpdated: true, updatedAt: Date.now() });

  const sig = await sha256Hex(`${phone}|${passwordHash}|RB_SESSION_2026`);
  sessionStorage.setItem("rb_admin_session", JSON.stringify({ phone, sig, loginAt: Date.now() }));
  document.getElementById("authNewPass").value = "";
  showToast("تم تحديث بيانات الدخول بنجاح");
});

document.getElementById("seedDefaultsBtn").addEventListener("click", async () => {
  if (!confirm("مزامنة القائمة الكاملة من menu-data.js ورفعها لقاعدة البيانات؟")) return;
  await syncMenuFromLocalData(true);
  showToast(`تم تحميل ورفع ${menuItems.length} صنف من menu-data.js`);
});

document.getElementById("testBellBtn").addEventListener("click", playBellSound);

function showToast(msg) {
  const bar = document.getElementById("toastBar");
  bar.textContent = msg;
  bar.classList.add("show");
  setTimeout(() => bar.classList.remove("show"), 3000);
}

/* ==================== MOBILE SIDEBAR DRAWER ==================== */
(function initMobileSidebar() {
  const toggleBtn = document.getElementById("mobileMenuToggleBtn");
  const sidebar = document.querySelector(".sidebar");
  const backdrop = document.getElementById("mobileSidebarBackdrop");
  const activeBadge = document.getElementById("mobileActiveTabBadge");

  if (!toggleBtn || !sidebar) return;

  const closeSidebar = () => {
    sidebar.classList.remove("mobile-open");
    backdrop?.classList.remove("open");
  };

  const openSidebar = () => {
    sidebar.classList.add("mobile-open");
    backdrop?.classList.add("open");
  };

  toggleBtn.addEventListener("click", () => {
    if (sidebar.classList.contains("mobile-open")) closeSidebar();
    else openSidebar();
  });

  backdrop?.addEventListener("click", closeSidebar);

  sidebar.querySelectorAll(".nav-item, button, a").forEach((item) => {
    item.addEventListener("click", () => {
      const label = item.querySelector("span")?.textContent?.trim();
      if (label && activeBadge) activeBadge.textContent = label.slice(0, 18);
      if (window.innerWidth <= 900) closeSidebar();
    });
  });
})();

bootAdmin();