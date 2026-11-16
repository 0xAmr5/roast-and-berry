import { ref, onValue, push, set, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { db, seedDatabaseIfEmpty } from "./firebase-config.js";

let lang = "ar";
let activeCategory = "all";
let searchQuery = "";
let categories = [];
let menuItems = [];
let settings = {
  totalTables: 20,
  taxEnabled: true,
  prepMinutes: 15,
  acceptingOrders: true,
  hotline: "01009694831"
};
let design = {
  layout: "editorial",
  primaryColor: "#2C221E",
  theme: "light",
  radius: "14px",
  fontScale: "1"
};
let cart = [];
let currentActiveTab = null;
let countdownInterval = null;
let unsubscribeTab = null;

let currentItem = null;
let selectedSize = null;
let selectedAddons = [];
let currentQty = 1;

const tableSelect = document.getElementById("tableSelect");
const urlParams = new URLSearchParams(window.location.search);
const lockedTableParam = urlParams.get("table");

async function init() {
  await seedDatabaseIfEmpty();

  onValue(ref(db, "settings"), (snap) => {
    if (snap.exists()) {
      settings = { ...settings, ...snap.val() };
      syncTableOptions();
      updateBrandUI();
    }
  });

  onValue(ref(db, "design"), (snap) => {
    if (snap.exists()) {
      design = { ...design, ...snap.val() };
      applyLiveDesign();
      renderMenu();
    }
  });

  onValue(ref(db, "categories"), (snap) => {
    if (snap.exists()) {
      categories = Object.values(snap.val());
      renderCategories();
    }
  });

  onValue(ref(db, "menuItems"), (snap) => {
    if (snap.exists()) {
      menuItems = Object.values(snap.val());
      renderMenu();
    }
  });

  tableSelect.addEventListener("change", watchCurrentTableTab);
  if (window.lucide) lucide.createIcons();
}

function syncTableOptions() {
  const totalTables = Number(settings.totalTables) || 20;

  if (lockedTableParam) {
    const label = lang === "ar" ? `ترابيزة ${lockedTableParam}` : `Table ${lockedTableParam}`;
    tableSelect.innerHTML = `<option value="${lockedTableParam}" selected>${label}</option>`;
    tableSelect.disabled = true;
  } else {
    const prevVal = tableSelect.value || "1";
    let optionsHtml = "";
    for (let i = 1; i <= totalTables; i++) {
      optionsHtml += `<option value="${i}">${i}</option>`;
    }
    tableSelect.innerHTML = optionsHtml;
    tableSelect.value = Number(prevVal) <= totalTables ? prevVal : "1";
    tableSelect.disabled = false;
  }

  watchCurrentTableTab();
}

function watchCurrentTableTab() {
  if (unsubscribeTab) unsubscribeTab();
  const tableId = tableSelect.value || "1";

  unsubscribeTab = onValue(ref(db, `activeTabs/table_${tableId}`), (snap) => {
    const banner = document.getElementById("liveTabBanner");
    if (snap.exists() && snap.val().status === "open") {
      currentActiveTab = snap.val();
      banner.classList.add("active");
      startLiveCountdown(currentActiveTab.estimatedReadyAt);
    } else {
      currentActiveTab = null;
      banner.classList.remove("active");
      if (countdownInterval) clearInterval(countdownInterval);
    }
  });
}

function startLiveCountdown(targetTimestamp) {
  if (countdownInterval) clearInterval(countdownInterval);
  const desc = document.getElementById("bannerTimerDesc");
  const title = document.getElementById("bannerStatusTitle");

  title.textContent = lang === "ar" ? "طلبك قيد التجهيز الآن" : "Your order is being prepared";

  function tick() {
    if (!targetTimestamp) return;
    const diff = targetTimestamp - Date.now();
    if (diff <= 0) {
      desc.innerHTML =
        lang === "ar"
          ? "طلبك جاهز وينزل على الترابيزة الآن ☕"
          : "Your order is being served now ☕";
      clearInterval(countdownInterval);
      return;
    }

    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    const formatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

    desc.innerHTML =
      lang === "ar"
        ? `الوقت المتبقي لنزول الطلب: <span class="countdown-badge">${formatted}</span>`
        : `Estimated time: <span class="countdown-badge">${formatted}</span>`;
  }

  tick();
  countdownInterval = setInterval(tick, 1000);
}

function applyLiveDesign() {
  if (design.primaryColor) {
    document.documentElement.style.setProperty("--primary", design.primaryColor);
  }
  if (design.theme) {
    document.documentElement.setAttribute("data-theme", design.theme);
  }
  if (design.fontScale) {
    document.documentElement.style.fontSize = `${Number(design.fontScale) * 16}px`;
  }
}

function updateBrandUI() {
  document.getElementById("cafeName").textContent =
    lang === "ar" ? settings.nameAr || "روست آند بيري كافيه" : settings.nameEn || "Roast & Berry Cafe";
  document.getElementById("cafeTagline").textContent =
    lang === "ar" ? settings.taglineAr || "" : settings.taglineEn || "";
  document.getElementById("footerAddress").textContent =
    lang === "ar" ? settings.addressAr || "" : settings.addressEn || "";
  document.getElementById("footerPhone").textContent = `${
    lang === "ar" ? "للحجز والاستفسار:" : "Reservations & Info:"
  } ${settings.hotline || "01009694831"}`;
  document.getElementById("wifiSsid").textContent = settings.wifiName || "RoastBerry_5G";
  document.getElementById("wifiPassword").textContent = settings.wifiPass || "RB@2026#Cafe";

  if (settings.logoUrl) {
    const logoBox = document.querySelector(".logo-svg");
    if (logoBox) {
      logoBox.innerHTML = `<img src="${settings.logoUrl}" alt="Logo" style="width:100%;height:100%;object-fit:cover;border-radius:12px;" />`;
    }
  }
}

function renderCategories() {
  const container = document.getElementById("categoriesContainer");
  container.innerHTML = categories
    .map(
      (cat) => `
      <button class="cat-chip ${activeCategory === cat.id ? "active" : ""}" data-id="${cat.id}">
        <span>${lang === "ar" ? cat.nameAr : cat.nameEn}</span>
      </button>
    `
    )
    .join("");

  container.querySelectorAll(".cat-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.id;
      renderCategories();
      renderMenu();
    });
  });
}

function getItemQtyInCart(itemId) {
  return cart.filter((c) => c.id === itemId).reduce((sum, c) => sum + c.qty, 0);
}

function renderMenu() {
  const grid = document.getElementById("menuGrid");
  const filtered = menuItems.filter((item) => {
    const matchCat = activeCategory === "all" || item.category === activeCategory;
    const name = (lang === "ar" ? item.nameAr : item.nameEn).toLowerCase();
    const desc = (lang === "ar" ? item.descAr : item.descEn).toLowerCase();
    return matchCat && (name.includes(searchQuery) || desc.includes(searchQuery));
  });

  if (!filtered.length) {
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:40px 0;">${
      lang === "ar" ? "لا توجد أصناف مطابقة لبحثك" : "No items match your search"
    }</p>`;
    return;
  }

  const isLuxury = design.layout === "luxury";
  grid.className = isLuxury ? "menu-grid luxury-mode" : "menu-grid editorial-mode";

  grid.innerHTML = filtered
    .map((item) => {
      const title = lang === "ar" ? item.nameAr : item.nameEn;
      const desc = lang === "ar" ? item.descAr : item.descEn;
      const badge = lang === "ar" ? item.badgeAr : item.badgeEn;
      const price = item.sizes?.length ? item.sizes[0].price : item.price;
      const qtyInCart = getItemQtyInCart(item.id);
      const hasOptions = (item.sizes && item.sizes.length > 0) || (item.addons && item.addons.length > 0);

      return `
        <article class="item-card ${item.available === false ? "unavailable" : ""}">
          <div class="item-cover" onclick="window.handleCardClick('${item.id}')">
            <img src="${item.image}" alt="${title}" loading="lazy" />
            ${badge ? `<span class="item-tag">${badge}</span>` : ""}
          </div>
          <div class="item-content">
            <div onclick="window.handleCardClick('${item.id}')" style="cursor:pointer;">
              <h3 class="item-title">${title}</h3>
              <p class="item-desc">${desc}</p>
            </div>
            <div class="item-bottom">
              <span class="item-price">${price} <small>${lang === "ar" ? "ج.م" : "EGP"}</small></span>
              ${
                qtyInCart > 0 && !hasOptions
                  ? `<div class="inline-stepper">
                      <button type="button" onclick="window.quickDec('${item.id}')">−</button>
                      <span>${qtyInCart}</span>
                      <button type="button" onclick="window.quickInc('${item.id}')">+</button>
                    </div>`
                  : `<button type="button" class="order-add-btn" onclick="window.handleAddButton('${item.id}')">
                      <span>${lang === "ar" ? (hasOptions ? "اختيار +" : "أضف +") : hasOptions ? "Select +" : "Add +"}</span>
                    </button>`
              }
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

window.handleAddButton = (itemId) => {
  if (settings.acceptingOrders === false) {
    showToast(lang === "ar" ? "عذراً، استقبال الطلبات متوقف مؤقتاً" : "Orders are temporarily paused");
    return;
  }
  const item = menuItems.find((i) => i.id === itemId);
  if (!item) return;

  const hasOptions = (item.sizes && item.sizes.length > 0) || (item.addons && item.addons.length > 0);
  if (hasOptions) {
    openItemModal(itemId);
  } else {
    window.quickInc(itemId);
    showToast(lang === "ar" ? `تم إضافة ${item.nameAr} للسلة` : `Added ${item.nameEn}`);
  }
};

window.handleCardClick = (itemId) => openItemModal(itemId);

window.quickInc = (itemId) => {
  const item = menuItems.find((i) => i.id === itemId);
  if (!item) return;
  const existing = cart.find((c) => c.id === itemId && !c.sizeAr && (!c.addons || !c.addons.length) && !c.note);
  if (existing) {
    existing.qty += 1;
    existing.totalPrice = existing.unitPrice * existing.qty;
  } else {
    const unitPrice = Number(item.price) || 0;
    cart.push({
      id: item.id,
      nameAr: item.nameAr || "",
      nameEn: item.nameEn || "",
      sizeAr: "",
      sizeEn: "",
      addons: [],
      note: "",
      qty: 1,
      unitPrice,
      totalPrice: unitPrice
    });
  }
  updateCartDock();
  renderMenu();
};

window.quickDec = (itemId) => {
  const idx = cart.findIndex((c) => c.id === itemId);
  if (idx === -1) return;
  if (cart[idx].qty > 1) {
    cart[idx].qty -= 1;
    cart[idx].totalPrice = cart[idx].unitPrice * cart[idx].qty;
  } else {
    cart.splice(idx, 1);
  }
  updateCartDock();
  renderMenu();
};

function openItemModal(itemId) {
  if (settings.acceptingOrders === false) {
    showToast(lang === "ar" ? "عذراً، استقبال الطلبات متوقف مؤقتاً" : "Sorry, orders are temporarily paused");
    return;
  }

  currentItem = menuItems.find((i) => i.id === itemId);
  if (!currentItem) return;

  currentQty = 1;
  selectedAddons = [];
  selectedSize = currentItem.sizes?.length ? currentItem.sizes[0] : null;

  document.getElementById("modalImg").src = currentItem.image;
  document.getElementById("modalTitle").textContent = lang === "ar" ? currentItem.nameAr : currentItem.nameEn;
  document.getElementById("modalDesc").textContent = lang === "ar" ? currentItem.descAr : currentItem.descEn;
  document.getElementById("modalNote").value = "";
  document.getElementById("modalQty").textContent = "1";

  const sizesWrap = document.getElementById("modalSizesWrap");
  const sizesList = document.getElementById("modalSizesList");
  if (currentItem.sizes?.length) {
    sizesWrap.style.display = "block";
    sizesList.innerHTML = currentItem.sizes
      .map(
        (sz, idx) => `
        <label class="opt-row">
          <span><input type="radio" name="sz" value="${idx}" ${idx === 0 ? "checked" : ""} /> ${
          lang === "ar" ? sz.nameAr : sz.nameEn
        }</span>
          <strong>${sz.price} ${lang === "ar" ? "ج.م" : "EGP"}</strong>
        </label>
      `
      )
      .join("");

    sizesList.querySelectorAll("input").forEach((r) =>
      r.addEventListener("change", (e) => {
        selectedSize = currentItem.sizes[Number(e.target.value)];
        updateModalPrice();
      })
    );
  } else {
    sizesWrap.style.display = "none";
  }

  const addonsWrap = document.getElementById("modalAddonsWrap");
  const addonsList = document.getElementById("modalAddonsList");
  if (currentItem.addons?.length) {
    addonsWrap.style.display = "block";
    addonsList.innerHTML = currentItem.addons
      .map(
        (ad, idx) => `
        <label class="opt-row">
          <span><input type="checkbox" value="${idx}" /> ${lang === "ar" ? ad.nameAr : ad.nameEn}</span>
          <strong>+${ad.price} ${lang === "ar" ? "ج.م" : "EGP"}</strong>
        </label>
      `
      )
      .join("");

    addonsList.querySelectorAll("input").forEach((c) =>
      c.addEventListener("change", () => {
        selectedAddons = Array.from(addonsList.querySelectorAll("input:checked")).map(
          (el) => currentItem.addons[Number(el.value)]
        );
        updateModalPrice();
      })
    );
  } else {
    addonsWrap.style.display = "none";
  }

  updateModalPrice();
  document.getElementById("itemModal").classList.add("open");
}

function updateModalPrice() {
  const base = selectedSize ? Number(selectedSize.price) : Number(currentItem.price);
  const addonsSum = selectedAddons.reduce((s, a) => s + Number(a.price || 0), 0);
  const currency = lang === "ar" ? "ج.م" : "EGP";
  document.getElementById("modalItemTotal").textContent = `${(base + addonsSum) * currentQty} ${currency}`;
}

document.getElementById("incQty").addEventListener("click", () => {
  currentQty++;
  document.getElementById("modalQty").textContent = currentQty;
  updateModalPrice();
});

document.getElementById("decQty").addEventListener("click", () => {
  if (currentQty > 1) {
    currentQty--;
    document.getElementById("modalQty").textContent = currentQty;
    updateModalPrice();
  }
});

document.getElementById("confirmAddBtn").addEventListener("click", () => {
  const base = selectedSize ? Number(selectedSize.price) : Number(currentItem.price);
  const addonsSum = selectedAddons.reduce((s, a) => s + Number(a.price || 0), 0);
  const unitPrice = base + addonsSum;

  cart.push({
    id: currentItem.id || "",
    nameAr: currentItem.nameAr || "",
    nameEn: currentItem.nameEn || "",
    sizeAr: selectedSize ? selectedSize.nameAr || "" : "",
    sizeEn: selectedSize ? selectedSize.nameEn || "" : "",
    addons: selectedAddons.map((a) => ({ nameAr: a.nameAr || "", nameEn: a.nameEn || "", price: Number(a.price) || 0 })),
    note: document.getElementById("modalNote").value.trim() || "",
    qty: currentQty,
    unitPrice,
    totalPrice: unitPrice * currentQty
  });

  document.getElementById("itemModal").classList.remove("open");
  updateCartDock();
  renderMenu();
  showToast(lang === "ar" ? "تمت الإضافة للسلة — يمكنك إضافة أصناف أخرى" : "Added — keep browsing or send order");
});

function updateCartDock() {
  const dock = document.getElementById("floatingCart");
  if (!cart.length) {
    dock.style.display = "none";
    return;
  }
  dock.style.display = "block";
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const sub = cart.reduce((s, i) => s + i.totalPrice, 0);
  document.getElementById("cartCount").textContent = count;
  document.getElementById("cartTotal").textContent = `${sub} ${lang === "ar" ? "ج.م" : "EGP"}`;
}

document.getElementById("openCartBtn").addEventListener("click", () => {
  const list = document.getElementById("cartItemsList");
  const tableVal = tableSelect.value || "1";
  document.getElementById("summaryTable").textContent = `${lang === "ar" ? "ترابيزة" : "Table"} ${tableVal}`;

  list.innerHTML = cart
    .map(
      (i, idx) => `
      <div class="bill-line" style="border-bottom:1px solid var(--border);padding:8px 0;align-items:center;">
        <div>
          <strong>${i.qty}× ${lang === "ar" ? i.nameAr : i.nameEn}</strong>
          ${i.sizeAr ? `<span style="font-size:0.78rem;color:var(--text-muted);"> (${lang === "ar" ? i.sizeAr : i.sizeEn})</span>` : ""}
          ${i.note ? `<div style="font-size:0.76rem;color:var(--text-muted);">📝 ${i.note}</div>` : ""}
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <strong>${i.totalPrice} ${lang === "ar" ? "ج.م" : "EGP"}</strong>
          <button type="button" style="color:#c44545;background:none;border:none;cursor:pointer;font-weight:800;font-size:1.1rem;" onclick="window.removeCartIdx(${idx})">×</button>
        </div>
      </div>
    `
    )
    .join("");

  const sub = cart.reduce((s, i) => s + i.totalPrice, 0);
  const tax = settings.taxEnabled !== false ? Math.round(sub * 0.14) : 0;
  document.getElementById("summarySub").textContent = `${sub} ج.م`;
  document.getElementById("summaryTax").textContent = `${tax} ج.م`;
  document.getElementById("summaryTotal").textContent = `${sub + tax} ج.م`;
  document.getElementById("cartModal").classList.add("open");
});

window.removeCartIdx = (idx) => {
  cart.splice(idx, 1);
  updateCartDock();
  renderMenu();
  if (!cart.length) document.getElementById("cartModal").classList.remove("open");
  else document.getElementById("openCartBtn").click();
};

document.getElementById("submitOrderBtn").addEventListener("click", async () => {
  if (!cart.length) return;
  const submitBtn = document.getElementById("submitOrderBtn");
  submitBtn.disabled = true;
  submitBtn.textContent = lang === "ar" ? "جاري إرسال طلبك..." : "Sending order...";

  try {
    const tableId = String(tableSelect.value || lockedTableParam || "1");
    const nowStr = new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
    const prepMins = Number(settings.prepMinutes) || 15;

    const tabRef = ref(db, `activeTabs/table_${tableId}`);
    const snap = await get(tabRef);
    const existing = snap.exists() && snap.val().status === "open" ? snap.val() : null;

    const existingItems = existing && Array.isArray(existing.items) ? existing.items : [];
    const mergedItems = JSON.parse(JSON.stringify([...existingItems, ...cart]));

    const subtotal = mergedItems.reduce((s, i) => s + (Number(i.totalPrice) || 0), 0);
    const tax = settings.taxEnabled !== false ? Math.round(subtotal * 0.14) : 0;

    const payload = {
      tableNumber: tableId,
      status: "open",
      items: mergedItems,
      subtotal,
      tax,
      total: subtotal + tax,
      openedAt: existing && existing.openedAt ? existing.openedAt : nowStr,
      lastUpdatedAt: nowStr,
      estimatedReadyAt: Date.now() + prepMins * 60 * 1000,
      alertTimestamp: Date.now()
    };

    await set(tabRef, payload);

    cart = [];
    updateCartDock();
    renderMenu();
    document.getElementById("cartModal").classList.remove("open");
    showToast(lang === "ar" ? "تم إرسال طلبك للترابيزة بنجاح! ☕" : "Order sent to your table! ☕");
  } catch (err) {
    console.error("Firebase Order Error Details:", err);
    const reason = err?.code === "PERMISSION_DENIED"
      ? "قواعد الأمان في Firebase مقفولة (تأكد من Rules = true)"
      : "تأكد من الاتصال بالإنترنت وحاول مرة أخرى";
    alert(`تعذر إرسال الطلب:\n${reason}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = lang === "ar" ? "إرسال الطلب للترابيزة الآن" : "Send Order to Table";
  }
});

function openBillModal() {
  const tableId = tableSelect.value || "1";
  document.getElementById("billCafeName").textContent = settings.nameAr || "روست آند بيري كافيه";
  document.getElementById("billCafeAddress").textContent = settings.addressAr || "";
  document.getElementById("billCafePhone").textContent = settings.hotline || "01009694831";
  document.getElementById("billTableHeader").textContent = `ترابيزة رقم: ${tableId}`;

  const itemsContainer = document.getElementById("billItemsContainer");
  const totalsContainer = document.getElementById("billTotalsContainer");

  if (!currentActiveTab || !currentActiveTab.items?.length) {
    itemsContainer.innerHTML = `<p style="text-align:center;color:#777;padding:14px 0;">${
      lang === "ar" ? "لا يوجد حساب مفتوح لهذه الترابيزة حالياً" : "No open bill for this table yet"
    }</p>`;
    totalsContainer.innerHTML = "";
  } else {
    itemsContainer.innerHTML = currentActiveTab.items
      .map(
        (i) => `
        <div class="bill-line">
          <span>${i.qty}× ${lang === "ar" ? i.nameAr : i.nameEn} ${i.sizeAr ? `(${lang === "ar" ? i.sizeAr : i.sizeEn})` : ""}</span>
          <strong>${i.totalPrice} ج.م</strong>
        </div>
      `
      )
      .join("");

    totalsContainer.innerHTML = `
      <div class="bill-line"><span>المجموع الفرعي:</span><span>${currentActiveTab.subtotal} ج.م</span></div>
      <div class="bill-line"><span>ضريبة القيمة المضافة (14%):</span><span>${currentActiveTab.tax} ج.م</span></div>
      <div class="bill-line bill-grand"><span>الإجمالي شامل الضريبة:</span><span>${currentActiveTab.total} ج.م</span></div>
    `;
  }

  document.getElementById("billModal").classList.add("open");
}

document.getElementById("openMyBillBtn").addEventListener("click", openBillModal);
document.getElementById("bannerViewBillBtn").addEventListener("click", openBillModal);

document.getElementById("downloadPdfBtn").addEventListener("click", async () => {
  const element = document.getElementById("pdfReceiptContent");
  const tableId = tableSelect.value || "1";

  if (!currentActiveTab || !currentActiveTab.items?.length) {
    showToast(lang === "ar" ? "لا يوجد حساب مفتوح لطباعته حالياً" : "No open bill to print");
    return;
  }

  if (typeof html2pdf !== "undefined") {
    showToast(lang === "ar" ? "جاري تجهيز الإيصال PDF..." : "Generating PDF receipt...");
    await html2pdf()
      .set({
        margin: 8,
        filename: `RoastBerry-Table-${tableId}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, backgroundColor: "#ffffff", useCORS: true },
        jsPDF: { unit: "mm", format: "a5", orientation: "portrait" }
      })
      .from(element)
      .save();
  } else {
    window.print();
  }
});

document.getElementById("requestCheckBtn").addEventListener("click", async () => {
  const tableId = tableSelect.value || "1";
  const callRef = push(ref(db, "waiterCalls"));
  await set(callRef, {
    id: callRef.key,
    table: tableId,
    type: "bill",
    total: currentActiveTab ? currentActiveTab.total : 0,
    status: "active",
    timeFormatted: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
  });
  document.getElementById("billModal").classList.remove("open");
  showToast(lang === "ar" ? "تم إرسال طلب الحساب للكاشير" : "Check requested from cashier");
});

document.getElementById("callWaiterBtn").addEventListener("click", async () => {
  const tableId = tableSelect.value || "1";
  const callRef = push(ref(db, "waiterCalls"));
  await set(callRef, {
    id: callRef.key,
    table: tableId,
    type: "waiter",
    status: "active",
    timeFormatted: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
  });
  showToast(lang === "ar" ? "تم إرسال ندائك للويتر" : "Waiter has been notified");
});

document.getElementById("searchInput").addEventListener("input", (e) => {
  searchQuery = e.target.value.trim().toLowerCase();
  renderMenu();
});

document.getElementById("langBtn").addEventListener("click", () => {
  lang = lang === "ar" ? "en" : "ar";
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.getElementById("langBtn").textContent = lang === "ar" ? "EN" : "عربي";
  syncTableOptions();
  updateBrandUI();
  renderCategories();
  renderMenu();
  updateCartDock();
});

document.getElementById("themeBtn").addEventListener("click", () => {
  const html = document.documentElement;
  html.setAttribute("data-theme", html.getAttribute("data-theme") === "dark" ? "light" : "dark");
});

document.getElementById("wifiBtn").addEventListener("click", () => document.getElementById("wifiModal").classList.add("open"));
document.getElementById("copyWifiBtn").addEventListener("click", () => {
  navigator.clipboard.writeText(document.getElementById("wifiPassword").textContent);
  showToast(lang === "ar" ? "تم نسخ كلمة المرور" : "Password copied");
});

["closeItemModal", "closeCartModal", "closeBillModal", "closeWifiModal"].forEach((id) => {
  document.getElementById(id).addEventListener("click", () => {
    document.querySelectorAll(".modal-backdrop").forEach((m) => m.classList.remove("open"));
  });
});

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}

init();