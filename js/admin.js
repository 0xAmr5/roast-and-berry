import { ref, onValue, set, update, remove, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { db, seedDatabaseIfEmpty } from "./firebase-config.js";

let categories = [];
let menuItems = [];
let activeTabs = {};
let waiterCalls = {};
let completedSales = [];
let settings = {
  pin: "1234",
  totalTables: 20,
  taxEnabled: true,
  prepMinutes: 15,
  acceptingOrders: true,
  nameAr: "روست آند بيري كافيه",
  hotline: "01009694831",
  wifiName: "RoastBerry_5G",
  wifiPass: "RB@2026#Cafe",
  taglineAr: "قهوة مختصة • فطار • أطباق عالمية • عصائر فريش",
  addressAr: "شارع التسعين الشمالي، التجمع الخامس، القاهرة",
  logoUrl: ""
};
let design = {
  layout: "editorial",
  primaryColor: "#2c221e",
  theme: "light",
  bgColor: "#faf8f5",
  cardBg: "#ffffff",
  fontFamily: "Cairo",
  fontScale: "1",
  titleSize: "1.08rem",
  radius: "14px",
  imgHeight: "170px",
  mobileCols: "1",
  showImages: true,
  showDesc: true,
  showBadges: true
};
let lastAlertStamp = Date.now();
let targetPosTable = null;
let selectedQrTables = new Set();
let currentReportPeriod = "today";
let filteredReportSales = [];

function playBellSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [
      { freq: 987.77, start: 0, duration: 0.45 },
      { freq: 1318.51, start: 0.16, duration: 0.65 }
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(n.freq, ctx.currentTime + n.start);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + n.start);
      gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + n.start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.start + n.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + n.start);
      osc.stop(ctx.currentTime + n.start + n.duration);
    });
  } catch (e) {}
}

document.getElementById("loginBtn").addEventListener("click", () => {
  const val = document.getElementById("pinInput").value.trim();
  if (val === (settings.pin || "1234")) {
    sessionStorage.setItem("rb_pos_auth", "1");
    startAdminApp();
  } else {
    showToast("الرقم السري غير صحيح");
  }
});

document.getElementById("pinInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("loginBtn").click();
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem("rb_pos_auth");
  location.reload();
});

async function boot() {
  await seedDatabaseIfEmpty();

  onValue(ref(db, "settings"), (snap) => {
    if (snap.exists()) {
      settings = { ...settings, ...snap.val() };
      populateSettingsForm();
      renderTablesDeck();
      const qrCountEl = document.getElementById("qrCountInput");
      if (qrCountEl && !qrCountEl.dataset.touched) {
        qrCountEl.value = settings.totalTables || 20;
      }
      renderAdminQRs();
      updateKPIs();
    }
  });

  if (sessionStorage.getItem("rb_pos_auth") === "1") {
    startAdminApp();
  }
  if (window.lucide) lucide.createIcons();
}

function startAdminApp() {
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("adminApp").style.display = "grid";

  onValue(ref(db, "categories"), (snap) => {
    if (snap.exists()) {
      categories = Object.values(snap.val());
      populateCategorySelect();
      renderItemsTable();
    }
  });

  onValue(ref(db, "menuItems"), (snap) => {
    if (snap.exists()) {
      menuItems = Object.values(snap.val());
      renderItemsTable();
    }
  });

  onValue(ref(db, "activeTabs"), (snap) => {
    activeTabs = snap.exists() ? snap.val() : {};
    let maxStamp = lastAlertStamp;
    Object.values(activeTabs).forEach((tab) => {
      if (tab.status === "open" && tab.alertTimestamp > maxStamp) {
        maxStamp = tab.alertTimestamp;
        playBellSound();
        showToast(`طلب جديد على ترابيزة ${tab.tableNumber}`);
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

  initQrSelection();
  renderAdminQRs();
  if (window.lucide) lucide.createIcons();
}

const viewHeadings = {
  viewOrders: ["الطلبات الواردة والحسابات المفتوحة", "متابعة حية لجميع الترابيزات والطلبات داخل الكافيه"],
  viewTables: ["ترابيزات الصالة", "مراقبة حالة كل ترابيزة وإضافة أصناف أو تحصيل الحساب"],
  viewItems: ["إدارة المنيو والأصناف", "إضافة أصناف جديدة أو تعديل الأسعار وتوفر الأصناف"],
  viewReports: ["الجرد والحسابات والتقارير", "سجل المبيعات اليومي والأسبوعي والشهري وتصدير Excel و PDF"],
  viewQr: ["أكواد QR الترابيزات", "توليد وطباعة كروت QR ديناميكية للترابيزات المحددة"],
  viewDesign: ["تصميم المنيو المتقدم", "تخصيص الألوان والخطوط والأحجام وشكل عرض المنيو للعملاء"],
  viewSettings: ["إعدادات الكافيه", "بيانات الكافيه، الضريبة، Wi-Fi وعدد الترابيزات"]
};

document.querySelectorAll(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".view-panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    const target = btn.dataset.view;
    document.getElementById(target).classList.add("active");
    if (viewHeadings[target]) {
      document.getElementById("viewHeading").textContent = viewHeadings[target][0];
      document.getElementById("viewSubheading").textContent = viewHeadings[target][1];
    }
    if (target === "viewQr") renderAdminQRs();
    if (target === "viewReports") renderReports();
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

  document.getElementById("chipTotalTables").textContent = `إجمالي الترابيزات: ${totalTables}`;
  document.getElementById("chipFreeTables").textContent = `🟢 متاحة: ${freeCount}`;
  document.getElementById("chipOccupiedTables").textContent = `🔴 مشغولة: ${occupiedCount}`;
}

function renderAlerts() {
  const stack = document.getElementById("alertsStack");
  const activeCalls = Object.values(waiterCalls).filter((c) => c && c.status === "active");
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

window.dismissCall = async (id) => {
  await remove(ref(db, `waiterCalls/${id}`));
};

function renderOrdersDeck() {
  const container = document.getElementById("ordersContainer");
  const openTabs = Object.values(activeTabs).filter((t) => t && t.status === "open");

  if (!openTabs.length) {
    container.innerHTML = `<div class="surface-card" style="grid-column:1/-1;text-align:center;color:var(--muted);padding:48px 16px;">لا توجد حسابات مفتوحة على الترابيزات حالياً</div>`;
    return;
  }

  container.innerHTML = openTabs
    .map(
      (tab) => `
      <div class="ticket-card">
        <div class="ticket-head">
          <span class="ticket-badge">ترابيزة ${tab.tableNumber}</span>
          <span style="font-size:0.78rem;color:var(--muted);">فُتحت: ${tab.openedAt || ""}</span>
        </div>
        <ul class="ticket-items">
          ${(tab.items || [])
            .map(
              (i) => `
              <li style="display:flex;justify-content:space-between;">
                <span><strong>${i.qty}×</strong> ${i.nameAr} ${i.sizeAr ? `(${i.sizeAr})` : ""}${i.note ? `<small>📝 ${i.note}</small>` : ""}</span>
                <span>${i.totalPrice} ج.م</span>
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
          <button class="btn-mini green" onclick="window.addItemToTable('${tab.tableNumber}')">+ إضافة صنف</button>
          <button class="btn-mini" onclick="window.printThermalReceipt('${tab.tableNumber}')">🖨️ طباعة الإيصال</button>
          <button class="btn-mini gold" style="margin-inline-start:auto;" onclick="window.settleTableTab('${tab.tableNumber}')">✔ تحصيل وإخلاء</button>
        </div>
      </div>
    `
    )
    .join("");
}

function renderTablesDeck() {
  const grid = document.getElementById("tablesGrid");
  const totalTables = Number(settings.totalTables) || 20;
  let html = "";

  for (let i = 1; i <= totalTables; i++) {
    const tab = activeTabs[`table_${i}`];
    const isBusy = tab && tab.status === "open";
    html += `
      <div class="table-tile ${isBusy ? "busy" : "free"}">
        <h3>ترابيزة ${i}</h3>
        <span class="status-pill">${isBusy ? "مشغولة" : "متاحة"}</span>
        <div class="tile-meta">
          ${isBusy ? `الحساب الحالي: <strong>${tab.total} ج.م</strong> (${tab.items?.length || 0} أصناف)` : "جاهزة لاستقبال عملاء"}
        </div>
        <div class="tile-btns">
          <button class="btn-mini green" onclick="window.addItemToTable('${i}')">+ إضافة صنف</button>
          ${
            isBusy
              ? `<button class="btn-mini" onclick="window.printThermalReceipt('${i}')">🖨️ إيصال</button>
                 <button class="btn-mini gold" onclick="window.settleTableTab('${i}')">تحصيل</button>`
              : ""
          }
        </div>
      </div>
    `;
  }
  grid.innerHTML = html;
}

window.addItemToTable = (tableNum) => {
  if (!menuItems.length) return showToast("لا توجد أصناف في المنيو");
  targetPosTable = String(tableNum);
  document.getElementById("quickAddModalTitle").textContent = `إضافة صنف على ترابيزة ${targetPosTable}`;
  document.getElementById("quickPosSearchInput").value = "";
  renderQuickPosGrid("");
  document.getElementById("quickAddPosModal").classList.add("open");
};

function renderQuickPosGrid(query) {
  const grid = document.getElementById("quickPosItemsGrid");
  const q = query.trim().toLowerCase();
  const list = menuItems.filter(
    (m) => m.available !== false && ((m.nameAr || "").toLowerCase().includes(q) || (m.nameEn || "").toLowerCase().includes(q))
  );

  if (!list.length) {
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--muted);padding:24px 0;">لا توجد أصناف مطابقة</p>`;
    return;
  }

  grid.innerHTML = list
    .map((m) => {
      const price = m.sizes?.length ? m.sizes[0].price : m.price;
      const sizeLabel = m.sizes?.length ? ` (${m.sizes[0].nameAr})` : "";
      return `
        <button type="button" class="quick-pos-card" onclick="window.confirmQuickPosItem('${m.id}')">
          <div class="quick-pos-top">
            <img src="${m.image}" alt="" />
            <strong>${m.nameAr}${sizeLabel}</strong>
          </div>
          <span class="quick-pos-price">+ ${price} ج.م</span>
        </button>
      `;
    })
    .join("");
}

window.confirmQuickPosItem = async (itemId) => {
  if (!targetPosTable) return;
  const chosen = menuItems.find((m) => m.id === itemId);
  if (!chosen) return;

  const price = chosen.sizes?.length ? Number(chosen.sizes[0].price) : Number(chosen.price);
  const nowStr = new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
  const tabRef = ref(db, `activeTabs/table_${targetPosTable}`);
  const snap = await get(tabRef);
  const existing = snap.exists() && snap.val().status === "open" ? snap.val() : null;

  const newItem = {
    id: chosen.id || "",
    nameAr: chosen.nameAr || "",
    nameEn: chosen.nameEn || "",
    sizeAr: chosen.sizes?.length ? chosen.sizes[0].nameAr || "" : "",
    sizeEn: chosen.sizes?.length ? chosen.sizes[0].nameEn || "" : "",
    addons: [],
    note: "إضافة من الكاشير",
    qty: 1,
    unitPrice: price,
    totalPrice: price
  };

  const existingItems = existing && Array.isArray(existing.items) ? existing.items : [];
  const items = JSON.parse(JSON.stringify([...existingItems, newItem]));
  const subtotal = items.reduce((s, i) => s + (Number(i.totalPrice) || 0), 0);
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
    estimatedReadyAt: existing?.estimatedReadyAt || Date.now() + 15 * 60000,
    alertTimestamp: Date.now()
  });

  showToast(`تم إضافة "${chosen.nameAr}" على ترابيزة ${targetPosTable}`);
};

document.getElementById("quickPosSearchInput").addEventListener("input", (e) => {
  renderQuickPosGrid(e.target.value);
});

document.getElementById("closeQuickAddPosBtn").addEventListener("click", () => {
  document.getElementById("quickAddPosModal").classList.remove("open");
});

window.settleTableTab = async (tableNum) => {
  const tab = activeTabs[`table_${tableNum}`];
  if (!tab) return;
  if (!confirm(`تأكيد تحصيل مبلغ ${tab.total} ج.م وإخلاء ترابيزة ${tableNum}؟`)) return;

  const now = new Date();
  const saleId = `sale_${Date.now()}`;
  const dateISO = now.toISOString().split("T")[0];

  await set(ref(db, `completedSales/${saleId}`), {
    ...tab,
    saleId,
    status: "closed",
    dateISO,
    closedTimestamp: now.getTime(),
    closedAt: now.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
  });
  await remove(ref(db, `activeTabs/table_${tableNum}`));
  showToast(`تم تحصيل الحساب وإخلاء ترابيزة ${tableNum}`);
};

window.printThermalReceipt = (tableNum) => {
  const tab = activeTabs[`table_${tableNum}`];
  if (!tab) return;
  const area = document.getElementById("thermalPrintArea");
  area.innerHTML = `
    <div style="text-align:center;border-bottom:1px dashed #000;padding-bottom:6px;margin-bottom:6px;">
      <strong>${settings.nameAr}</strong><br/>
      <small>${settings.addressAr}</small><br/>
      <small>ترابيزة رقم: ${tableNum} | ${new Date().toLocaleString("ar-EG")}</small>
    </div>
    ${(tab.items || [])
      .map((i) => `<div style="display:flex;justify-content:space-between;"><span>${i.qty}× ${i.nameAr}</span><span>${i.totalPrice}</span></div>`)
      .join("")}
    <div style="border-top:1px dashed #000;margin-top:6px;padding-top:6px;">
      <div style="display:flex;justify-content:space-between;"><span>المجموع الفرعي:</span><span>${tab.subtotal} ج.م</span></div>
      <div style="display:flex;justify-content:space-between;"><span>الضريبة (14%):</span><span>${tab.tax} ج.م</span></div>
      <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:14px;"><span>الإجمالي:</span><span>${tab.total} ج.م</span></div>
    </div>
    <div style="text-align:center;margin-top:8px;"><small>شكراً لزيارتكم ☕</small></div>
  `;
  window.print();
};

function populateCategorySelect() {
  const sel = document.getElementById("fCategory");
  sel.innerHTML = categories
    .filter((c) => c.id !== "all")
    .map((c) => `<option value="${c.id}">${c.nameAr}</option>`)
    .join("");
}

function renderItemsTable() {
  const tbody = document.getElementById("itemsTableBody");
  tbody.innerHTML = menuItems
    .map((item) => {
      const cat = categories.find((c) => c.id === item.category);
      const price = item.sizes?.length ? item.sizes[0].price : item.price;
      return `
        <tr>
          <td><img src="${item.image}" class="thumb-img" alt="" /></td>
          <td><strong>${item.nameAr}</strong><br/><small style="color:var(--muted);">${item.nameEn}</small></td>
          <td>${cat ? cat.nameAr : item.category}</td>
          <td><strong>${price} ج.م</strong></td>
          <td>
            <button class="btn-mini ${item.available !== false ? "green" : "red"}" onclick="window.toggleItemAvail('${item.id}', ${item.available !== false})">
              ${item.available !== false ? "متاح" : "غير متاح"}
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

window.toggleItemAvail = async (id, current) => {
  await update(ref(db, `menuItems/${id}`), { available: !current });
};

window.deleteMenuItem = async (id) => {
  if (!confirm("هل تريد حذف هذا الصنف نهائياً؟")) return;
  await remove(ref(db, `menuItems/${id}`));
  showToast("تم حذف الصنف");
};

document.getElementById("openNewItemBtn").addEventListener("click", () => {
  document.getElementById("itemForm").reset();
  document.getElementById("editItemId").value = "";
  document.getElementById("itemModalHeading").textContent = "إضافة صنف جديد";
  document.getElementById("itemModal").classList.add("open");
});

window.editMenuItem = (id) => {
  const item = menuItems.find((i) => i.id === id);
  if (!item) return;
  document.getElementById("editItemId").value = item.id;
  document.getElementById("fNameAr").value = item.nameAr;
  document.getElementById("fNameEn").value = item.nameEn;
  document.getElementById("fCategory").value = item.category;
  document.getElementById("fPrice").value = item.sizes?.length ? item.sizes[0].price : item.price;
  document.getElementById("fImage").value = item.image;
  document.getElementById("fDescAr").value = item.descAr || "";
  document.getElementById("fDescEn").value = item.descEn || "";
  document.getElementById("itemModalHeading").textContent = "تعديل الصنف";
  document.getElementById("itemModal").classList.add("open");
};

document.getElementById("closeItemModalBtn").addEventListener("click", () => {
  document.getElementById("itemModal").classList.remove("open");
});

document.getElementById("fImageFile").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    document.getElementById("fImage").value = reader.result;
  };
  reader.readAsDataURL(file);
});

document.getElementById("itemForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("editItemId").value || `item_${Date.now()}`;
  await set(ref(db, `menuItems/${id}`), {
    id,
    nameAr: document.getElementById("fNameAr").value.trim(),
    nameEn: document.getElementById("fNameEn").value.trim(),
    category: document.getElementById("fCategory").value,
    price: Number(document.getElementById("fPrice").value),
    image: document.getElementById("fImage").value.trim(),
    descAr: document.getElementById("fDescAr").value.trim(),
    descEn: document.getElementById("fDescEn").value.trim(),
    available: true
  });
  document.getElementById("itemModal").classList.remove("open");
  showToast("تم حفظ الصنف بنجاح");
});

document.getElementById("exportFullMenuPdfBtn").addEventListener("click", () => {
  const wrapper = document.createElement("div");
  wrapper.style.padding = "20px";
  wrapper.style.fontFamily = "Cairo, sans-serif";
  wrapper.dir = "rtl";
  wrapper.innerHTML = `
    <h1 style="text-align:center;margin-bottom:6px;">${settings.nameAr}</h1>
    <p style="text-align:center;color:#666;margin-bottom:20px;">${settings.taglineAr}</p>
    ${menuItems
      .map(
        (m) => `
      <div style="display:flex;justify-content:space-between;border-bottom:1px solid #eee;padding:8px 0;">
        <div><strong>${m.nameAr}</strong><br/><small style="color:#666;">${m.descAr || ""}</small></div>
        <strong>${m.sizes?.length ? m.sizes[0].price : m.price} ج.م</strong>
      </div>
    `
      )
      .join("")}
  `;
  html2pdf().from(wrapper).save(`${settings.nameAr}-Menu.pdf`);
});

/* ==================== INVENTORY & ACCOUNTING REPORTS ==================== */
function renderReports() {
  const tbody = document.getElementById("reportsTableBody");
  if (!tbody) return;

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const weekAgoMs = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const currentMonthPrefix = todayStr.slice(0, 7);

  const fromInput = document.getElementById("repFromDate")?.value;
  const toInput = document.getElementById("repToDate")?.value;

  filteredReportSales = completedSales.filter((sale) => {
    const saleDate = sale.dateISO || (sale.closedTimestamp ? new Date(sale.closedTimestamp).toISOString().split("T")[0] : todayStr);
    const saleMs = sale.closedTimestamp || now.getTime();

    if (currentReportPeriod === "today") return saleDate === todayStr;
    if (currentReportPeriod === "week") return saleMs >= weekAgoMs;
    if (currentReportPeriod === "month") return saleDate.startsWith(currentMonthPrefix);
    if (currentReportPeriod === "custom") {
      if (fromInput && saleDate < fromInput) return false;
      if (toInput && saleDate > toInput) return false;
      return true;
    }
    return true;
  });

  const count = filteredReportSales.length;
  const subTotal = filteredReportSales.reduce((s, o) => s + (Number(o.subtotal) || 0), 0);
  const taxTotal = filteredReportSales.reduce((s, o) => s + (Number(o.tax) || 0), 0);
  const grandTotal = filteredReportSales.reduce((s, o) => s + (Number(o.total) || 0), 0);

  document.getElementById("repOrdersCount").textContent = count;
  document.getElementById("repSubTotal").textContent = `${subTotal} ج.م`;
  document.getElementById("repTaxTotal").textContent = `${taxTotal} ج.م`;
  document.getElementById("repGrandTotal").textContent = `${grandTotal} ج.م`;

  document.getElementById("repFooterCount").textContent = `${count} فاتورة`;
  document.getElementById("repFooterSub").textContent = `${subTotal} ج.م`;
  document.getElementById("repFooterTax").textContent = `${taxTotal} ج.م`;
  document.getElementById("repFooterGrand").textContent = `${grandTotal} ج.م`;

  if (document.getElementById("reportPrintDateStamp")) {
    document.getElementById("reportPrintDateStamp").textContent = `${settings.nameAr} — تاريخ التقرير: ${todayStr}`;
  }

  if (count > 0) {
    const firstOrder = filteredReportSales[filteredReportSales.length - 1];
    const lastOrder = filteredReportSales[0];
    document.getElementById("repShiftTimeRange").textContent = `أول أوردر: ${firstOrder.openedAt || firstOrder.closedAt || "--"} | آخر أوردر: ${lastOrder.closedAt || "--"}`;
  } else {
    document.getElementById("repShiftTimeRange").textContent = "أول أوردر: -- | آخر أوردر: --";
  }

  if (!count) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:24px;">لا توجد فواتير محصلة في هذه الفترة</td></tr>`;
    return;
  }

  tbody.innerHTML = filteredReportSales
    .map((s, idx) => {
      const itemsText = (s.items || []).map((i) => `${i.qty}× ${i.nameAr}`).join(" ، ");
      const dStr = s.dateISO || todayStr;
      return `
        <tr>
          <td><strong>#${count - idx}</strong></td>
          <td><span class="ticket-badge" style="font-size:0.75rem;">ترابيزة ${s.tableNumber}</span></td>
          <td>${dStr}</td>
          <td>${s.openedAt || "--"} ➔ ${s.closedAt || "--"}</td>
          <td style="max-width:240px;white-space:normal;">${itemsText}</td>
          <td>${s.subtotal || 0} ج.م</td>
          <td>${s.tax || 0} ج.م</td>
          <td><strong style="color:var(--green);">${s.total || 0} ج.م</strong></td>
        </tr>
      `;
    })
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

document.getElementById("applyCustomDateBtn")?.addEventListener("click", () => {
  document.querySelectorAll("[data-period]").forEach((b) => b.classList.remove("active-filter"));
  currentReportPeriod = "custom";
  renderReports();
});

document.getElementById("exportExcelBtn")?.addEventListener("click", () => {
  if (!filteredReportSales.length) return showToast("لا توجد بيانات للتصدير في هذه الفترة");
  if (typeof XLSX === "undefined") return showToast("مكتبة Excel قيد التحميل، حاول مرة أخرى");

  const rows = filteredReportSales.map((s, idx) => ({
    "رقم الفاتورة": filteredReportSales.length - idx,
    "رقم الترابيزة": s.tableNumber,
    "التاريخ": s.dateISO || new Date().toISOString().split("T")[0],
    "وقت الفتح": s.openedAt || "",
    "وقت التحصيل": s.closedAt || "",
    "الأصناف": (s.items || []).map((i) => `${i.qty}x ${i.nameAr}`).join(" | "),
    "الصافي (ج.م)": Number(s.subtotal) || 0,
    "الضريبة (ج.م)": Number(s.tax) || 0,
    "الإجمالي (ج.م)": Number(s.total) || 0
  }));

  const totalSum = filteredReportSales.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  rows.push({
    "رقم الفاتورة": "الإجمالي الكلي",
    "رقم الترابيزة": "",
    "التاريخ": "",
    "وقت الفتح": "",
    "وقت التحصيل": "",
    "الأصناف": `عدد الفواتير: ${filteredReportSales.length}`,
    "الصافي (ج.م)": filteredReportSales.reduce((sum, o) => sum + (Number(o.subtotal) || 0), 0),
    "الضريبة (ج.م)": filteredReportSales.reduce((sum, o) => sum + (Number(o.tax) || 0), 0),
    "الإجمالي (ج.م)": totalSum
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "تقرير المبيعات");
  XLSX.writeFile(wb, `RoastBerry-Sales-${currentReportPeriod}-${new Date().toISOString().split("T")[0]}.xlsx`);
  showToast("تم تحميل شيت Excel بنجاح 📊");
});

document.getElementById("exportReportPdfBtn")?.addEventListener("click", () => {
  if (!filteredReportSales.length) return showToast("لا توجد بيانات للتصدير في هذه الفترة");
  const area = document.getElementById("reportPrintableArea");
  html2pdf()
    .set({
      margin: 8,
      filename: `RoastBerry-Report-${new Date().toISOString().split("T")[0]}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, backgroundColor: "#ffffff" },
      jsPDF: { unit: "mm", format: "a4", orientation: "landscape" }
    })
    .from(area)
    .save();
});

/* ==================== DYNAMIC QR GENERATOR WITH SELECTIVE PRINT ==================== */
function initQrSelection() {
  const count = Number(document.getElementById("qrCountInput")?.value) || Number(settings.totalTables) || 20;
  selectedQrTables.clear();
  for (let i = 1; i <= count; i++) selectedQrTables.add(i);
}

function updateQrSelectionUI() {
  const counterEl = document.getElementById("qrSelectedCounter");
  if (counterEl) {
    const sorted = Array.from(selectedQrTables).sort((a, b) => a - b);
    counterEl.textContent = sorted.length
      ? `الترابيزات المحددة للطباعة (${sorted.length}): ${sorted.join(" ، ")}`
      : "لم يتم تحديد أي ترابيزة للطباعة";
  }

  document.querySelectorAll(".qr-select-card").forEach((card) => {
    const num = Number(card.dataset.table);
    const isSel = selectedQrTables.has(num);
    card.classList.toggle("selected", isSel);
    const cb = card.querySelector("input[type='checkbox']");
    if (cb) cb.checked = isSel;
  });
}

function renderAdminQRs() {
  const grid = document.getElementById("adminQrGrid");
  const baseInput = document.getElementById("qrBaseUrlInput");
  const countInput = document.getElementById("qrCountInput");
  if (!grid || !baseInput || typeof QRCode === "undefined") return;

  const cleanBase = baseInput.value.trim().replace(/\/+$/, "") || window.location.origin;
  const totalTables = Math.min(100, Math.max(1, Number(countInput?.value) || Number(settings.totalTables) || 20));
  if (selectedQrTables.size === 0) {
    for (let i = 1; i <= totalTables; i++) selectedQrTables.add(i);
  }

  grid.innerHTML = "";

  for (let i = 1; i <= totalTables; i++) {
    const tableUrl = `${cleanBase}/?table=${i}`;
    const card = document.createElement("div");
    card.className = `qr-select-card ${selectedQrTables.has(i) ? "selected" : ""}`;
    card.dataset.table = String(i);
    card.innerHTML = `
      <label class="qr-check-label">
        <input type="checkbox" ${selectedQrTables.has(i) ? "checked" : ""} onchange="window.toggleQrTable(${i}, this.checked)" />
        <span>تحديد</span>
      </label>
      <strong style="font-size:0.9rem;color:var(--primary);margin-top:18px;">${settings.nameAr || "روست آند بيري كافيه"}</strong>
      <div id="qrCanvas_${i}" style="padding:8px;background:#fff;border:1px solid var(--border);border-radius:10px;"></div>
      <span class="ticket-badge">ترابيزة ${i}</span>
      <small style="font-size:0.66rem;color:var(--muted);direction:ltr;word-break:break-all;">${tableUrl}</small>
    `;
    grid.appendChild(card);

    new QRCode(document.getElementById(`qrCanvas_${i}`), {
      text: tableUrl,
      width: 130,
      height: 130,
      colorDark: "#111827",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
  }
  updateQrSelectionUI();
}

window.toggleQrTable = (num, checked) => {
  if (checked) selectedQrTables.add(num);
  else selectedQrTables.delete(num);
  updateQrSelectionUI();
};

document.getElementById("qrCountInput")?.addEventListener("input", (e) => {
  e.target.dataset.touched = "1";
  initQrSelection();
  renderAdminQRs();
});

document.getElementById("refreshQrBtn")?.addEventListener("click", renderAdminQRs);

document.getElementById("selectAllQrBtn")?.addEventListener("click", () => {
  initQrSelection();
  updateQrSelectionUI();
});

document.getElementById("clearQrSelectBtn")?.addEventListener("click", () => {
  selectedQrTables.clear();
  updateQrSelectionUI();
});

document.getElementById("applySpecificQrBtn")?.addEventListener("click", () => {
  const raw = document.getElementById("qrSpecificInput").value.trim();
  if (!raw) return showToast("اكتب أرقام الترابيزات مثل: 5, 7, 9");

  const maxTables = Number(document.getElementById("qrCountInput").value) || 20;
  const parsed = new Set();

  raw.split(/[,،\s]+/).forEach((part) => {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map(Number);
      if (start && end && end >= start) {
        for (let n = start; n <= Math.min(end, maxTables); n++) parsed.add(n);
      }
    } else {
      const num = Number(part);
      if (num >= 1 && num <= maxTables) parsed.add(num);
    }
  });

  if (!parsed.size) return showToast("أرقام الترابيزات غير صحيحة");
  selectedQrTables = parsed;
  updateQrSelectionUI();
  showToast(`تم تحديد ${parsed.size} ترابيزة للطباعة`);
});

document.getElementById("printSelectedQrBtn")?.addEventListener("click", () => {
  const tablesToPrint = Array.from(selectedQrTables).sort((a, b) => a - b);
  if (!tablesToPrint.length) return showToast("حدد ترابيزة واحدة على الأقل للطباعة");

  const cleanBase = document.getElementById("qrBaseUrlInput").value.trim().replace(/\/+$/, "");
  const printWin = window.open("", "_blank");
  if (!printWin) return showToast("يرجى السماح بالنوافذ المنبثقة للطباعة");

  let cardsHtml = "";
  tablesToPrint.forEach((i) => {
    const qrImg = document.querySelector(`#qrCanvas_${i} img`)?.src || document.querySelector(`#qrCanvas_${i} canvas`)?.toDataURL() || "";
    cardsHtml += `
      <div class="qr-print-card">
        <h4>${settings.nameAr || "روست آند بيري كافيه"}</h4>
        <p>امسح الكود لفتح المنيو والطلب</p>
        <img src="${qrImg}" />
        <div class="badge">ترابيزة ${i}</div>
        <small>${cleanBase}/?table=${i}</small>
      </div>
    `;
  });

  printWin.document.write(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8" />
      <title>طباعة QR الترابيزات المحددة</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@700;800&display=swap" rel="stylesheet" />
      <style>
        body { font-family: 'Cairo', sans-serif; margin: 10mm; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8mm; }
        .qr-print-card { border: 1.5px dashed #94a3b8; border-radius: 14px; padding: 12px; text-align: center; page-break-inside: avoid; }
        .qr-print-card h4 { margin: 0 0 2px; font-size: 14px; }
        .qr-print-card p { margin: 0 0 8px; font-size: 11px; color: #64748b; }
        .qr-print-card img { width: 130px; height: 130px; display: block; margin: 0 auto 8px; }
        .badge { display: inline-block; background: #111827; color: #fff; padding: 3px 16px; border-radius: 99px; font-size: 13px; font-weight: 800; }
        small { display: block; margin-top: 5px; font-size: 9px; color: #64748b; direction: ltr; }
      </style>
    </head>
    <body>
      <div class="grid">${cardsHtml}</div>
      <script>window.onload = () => { setTimeout(() => { window.print(); }, 400); };<\/script>
    </body>
    </html>
  `);
  printWin.document.close();
});

/* ==================== ADVANCED MENU DESIGN CUSTOMIZER ==================== */
function syncDesignUI() {
  document.querySelectorAll(".layout-choice").forEach((el) => {
    el.classList.toggle("active", el.dataset.layout === design.layout);
  });
  document.querySelectorAll(".c-dot").forEach((el) => {
    el.classList.toggle("active", el.dataset.color === design.primaryColor);
  });
  if (document.getElementById("designCustomColor")) document.getElementById("designCustomColor").value = design.primaryColor || "#2c221e";
  if (document.getElementById("designBgColor")) document.getElementById("designBgColor").value = design.bgColor || "#faf8f5";
  if (document.getElementById("designCardBg")) document.getElementById("designCardBg").value = design.cardBg || "#ffffff";
  document.getElementById("designTheme").value = design.theme || "light";
  document.getElementById("designFontFamily").value = design.fontFamily || "Cairo";
  document.getElementById("designFontScale").value = design.fontScale || "1";
  document.getElementById("designTitleSize").value = design.titleSize || "1.08rem";
  document.getElementById("designRadius").value = design.radius || "14px";
  if (document.getElementById("designImgHeight")) document.getElementById("designImgHeight").value = design.imgHeight || "170px";
  document.getElementById("designMobileCols").value = design.mobileCols || "1";
  document.getElementById("designShowImages").value = String(design.showImages !== false);
  document.getElementById("designShowDesc").value = String(design.showDesc !== false);
  if (document.getElementById("designShowBadges")) document.getElementById("designShowBadges").value = String(design.showBadges !== false);
}

document.querySelectorAll(".layout-choice").forEach((el) => {
  el.addEventListener("click", () => {
    design.layout = el.dataset.layout;
    syncDesignUI();
  });
});

document.querySelectorAll(".c-dot").forEach((el) => {
  el.addEventListener("click", () => {
    design.primaryColor = el.dataset.color;
    syncDesignUI();
  });
});

document.getElementById("designCustomColor")?.addEventListener("input", (e) => {
  design.primaryColor = e.target.value;
  document.querySelectorAll(".c-dot").forEach((el) => el.classList.remove("active"));
});

document.getElementById("saveDesignBtn").addEventListener("click", async () => {
  design.theme = document.getElementById("designTheme").value;
  design.bgColor = document.getElementById("designBgColor").value;
  design.cardBg = document.getElementById("designCardBg").value;
  design.fontFamily = document.getElementById("designFontFamily").value;
  design.fontScale = document.getElementById("designFontScale").value;
  design.titleSize = document.getElementById("designTitleSize").value;
  design.radius = document.getElementById("designRadius").value;
  design.imgHeight = document.getElementById("designImgHeight").value;
  design.mobileCols = document.getElementById("designMobileCols").value;
  design.showImages = document.getElementById("designShowImages").value === "true";
  design.showDesc = document.getElementById("designShowDesc").value === "true";
  design.showBadges = document.getElementById("designShowBadges").value === "true";

  await set(ref(db, "design"), design);
  showToast("تم تطبيق وحفظ التصميم على منيو العملاء فوراً");
});

/* ==================== SETTINGS & FAVICON ==================== */
function populateSettingsForm() {
  document.getElementById("adminCafeName").textContent = settings.nameAr || "روست آند بيري";
  document.getElementById("setAccepting").value = String(settings.acceptingOrders !== false);
  document.getElementById("setTotalTables").value = settings.totalTables || 20;
  document.getElementById("setTaxEnabled").value = String(settings.taxEnabled !== false);
  document.getElementById("setPrepMinutes").value = settings.prepMinutes || 15;
  document.getElementById("setNameAr").value = settings.nameAr || "";
  document.getElementById("setHotline").value = settings.hotline || "01009694831";
  document.getElementById("setWifiName").value = settings.wifiName || "";
  document.getElementById("setWifiPass").value = settings.wifiPass || "";
  document.getElementById("setAdminPin").value = settings.pin || "1234";
  document.getElementById("setTaglineAr").value = settings.taglineAr || "";
  document.getElementById("setAddressAr").value = settings.addressAr || "";

  if (settings.logoUrl) {
    document.getElementById("sidebarLogoWrap").innerHTML = `<img src="${settings.logoUrl}" alt="Logo" />`;
    const fav = document.getElementById("dynamicFavicon");
    if (fav) fav.href = settings.logoUrl;
  }
}

document.getElementById("setLogoFile").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    settings.logoUrl = reader.result;
  };
  reader.readAsDataURL(file);
});

document.getElementById("settingsForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const updated = {
    ...settings,
    acceptingOrders: document.getElementById("setAccepting").value === "true",
    totalTables: Number(document.getElementById("setTotalTables").value) || 20,
    taxEnabled: document.getElementById("setTaxEnabled").value === "true",
    prepMinutes: Number(document.getElementById("setPrepMinutes").value) || 15,
    nameAr: document.getElementById("setNameAr").value.trim(),
    hotline: document.getElementById("setHotline").value.trim(),
    wifiName: document.getElementById("setWifiName").value.trim(),
    wifiPass: document.getElementById("setWifiPass").value.trim(),
    pin: document.getElementById("setAdminPin").value.trim() || "1234",
    taglineAr: document.getElementById("setTaglineAr").value.trim(),
    addressAr: document.getElementById("setAddressAr").value.trim()
  };
  await set(ref(db, "settings"), updated);
  showToast("تم حفظ الإعدادات وتحديث الترابيزات والمنيو");
});

document.getElementById("seedDefaultsBtn").addEventListener("click", async () => {
  if (!confirm("هل تريد استعادة قائمة الأصناف الافتراضية؟")) return;
  await remove(ref(db, "menuItems"));
  await seedDatabaseIfEmpty();
  showToast("تم استعادة القائمة الافتراضية");
});

document.getElementById("testBellBtn").addEventListener("click", () => {
  playBellSound();
  showToast("صوت الجرس يعمل بنجاح");
});

function showToast(msg) {
  const bar = document.getElementById("toastBar");
  bar.textContent = msg;
  bar.classList.add("show");
  setTimeout(() => bar.classList.remove("show"), 3000);
}

boot();