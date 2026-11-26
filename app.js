import { ref, onValue, set, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { db } from "./firebase-config.js";
import * as MenuDataModule from "./menu-data.js?v=99";

const urlParams = new URLSearchParams(window.location.search);
const currentTable = (urlParams.get("table") || "").replace(/\D/g, "");
const isTableMode = Boolean(currentTable);

const FALLBACK_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%232c1d13'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='56' fill='%23d4a373'%3E☕%3C/text%3E%3C/svg%3E";

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
let cart = [];
let activeCategory = "all";
let searchQuery = "";
let selectedProduct = null;
let selectedSizeIndex = 0;
let currentOpenTab = null;
let isSubmittingOrder = false;

let settings = {
  nameAr: "روست آند بيري كافيه",
  taglineAr: "قهوة مختصة • فطار • سلطات • أطباق رئيسية • عصائر فريش وحلويات",
  addressAr: "القاهرة، مصر",
  hotline: "",
  whatsapp: "",
  facebook: "",
  instagram: "",
  tiktok: "",
  taxEnabled: true,
  acceptingOrders: true,
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

function bootApp() {
  configureViewMode();
  renderCategories();
  renderMenuGrid();
  applyBrandSettings();

  onValue(ref(db, "settings"), (snap) => {
    if (snap.exists()) {
      settings = { ...settings, ...snap.val() };
      applyBrandSettings();
      renderCart();
      renderCustomerReceipt();
    }
  });

  onValue(ref(db, "design"), (snap) => {
    if (snap.exists()) {
      design = { ...design, ...snap.val() };
      applyDesignTheme();
      renderMenuGrid();
    }
  });

  onValue(ref(db, "categories"), (snap) => {
    if (snap.exists()) {
      const val = Array.isArray(snap.val()) ? snap.val() : Object.values(snap.val());
      if (val.length) {
        categories = val;
        renderCategories();
      }
    }
  });

  onValue(ref(db, "menuItems"), (snap) => {
    if (snap.exists()) {
      const val = Object.values(snap.val());
      if (val.length) {
        menuItems = val;
        renderMenuGrid();
      }
    }
  });

  if (isTableMode) {
    listenToActiveTableTab(currentTable);
  }
}

function configureViewMode() {
  const tablePill = document.getElementById("tableBadgePill");
  const tableText = document.getElementById("tableBadgeText");
  const drawerSub = document.getElementById("drawerTableSubtitle");
  const bellBtn = document.getElementById("callWaiterBtn");
  const cartBtn = document.getElementById("openCartBtn");
  const homeNavBtn = document.getElementById("homeNavBtn");
  const exportPublicPdfBtn = document.getElementById("exportPublicPdfBtn");
  const modalAddBtn = document.getElementById("modalAddToCartBtn");

  if (isTableMode) {
    if (tablePill) tablePill.style.display = "inline-flex";
    if (tableText) tableText.textContent = `ترابيزة ${currentTable}`;
    if (drawerSub) drawerSub.textContent = `طلب مباشر — ترابيزة ${currentTable}`;
    if (bellBtn) bellBtn.style.display = "inline-flex";
    if (cartBtn) cartBtn.style.display = "inline-flex";
    if (homeNavBtn) homeNavBtn.style.display = "none";
    if (exportPublicPdfBtn) exportPublicPdfBtn.style.display = "none";
    if (modalAddBtn) modalAddBtn.style.display = "inline-block";
  } else {
    if (tablePill) tablePill.style.display = "none";
    if (bellBtn) bellBtn.style.display = "none";
    if (cartBtn) cartBtn.style.display = "none";
    if (homeNavBtn) homeNavBtn.style.display = "inline-flex";
    if (exportPublicPdfBtn) exportPublicPdfBtn.style.display = "inline-flex";
    if (modalAddBtn) modalAddBtn.style.display = "none";
  }
}

function normalizeWhatsappUrl(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("01") && digits.length === 11) return `https://wa.me/2${digits}`;
  return `https://wa.me/${digits}`;
}

function sanitizeExternalUrl(url) {
  const trimmed = String(url || "").trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function applyBrandSettings() {
  document.title = `${settings.nameAr} | المنيو الرقمي`;
  const titleEl = document.getElementById("cafeNameHeader");
  const tagEl = document.getElementById("cafeTaglineHeader");
  if (titleEl) titleEl.textContent = settings.nameAr;
  if (tagEl) tagEl.textContent = settings.taglineAr;

  const addrEl = document.getElementById("footerAddressText");
  if (addrEl) {
    const parts = [settings.addressAr || "القاهرة، مصر"];
    if (settings.hotline) parts.push(`هاتف: ${settings.hotline}`);
    addrEl.textContent = parts.join(" • ");
  }

  const socialRow = document.getElementById("socialLinksRow");
  if (socialRow) {
    const links = [];
    const waUrl = normalizeWhatsappUrl(settings.whatsapp);
    const fbUrl = sanitizeExternalUrl(settings.facebook);
    const igUrl = sanitizeExternalUrl(settings.instagram);
    const ttUrl = sanitizeExternalUrl(settings.tiktok);

    if (waUrl) links.push(`<a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="social-chip">💬 واتساب</a>`);
    if (fbUrl) links.push(`<a href="${fbUrl}" target="_blank" rel="noopener noreferrer" class="social-chip">📘 فيسبوك</a>`);
    if (igUrl) links.push(`<a href="${igUrl}" target="_blank" rel="noopener noreferrer" class="social-chip">📸 إنستجرام</a>`);
    if (ttUrl) links.push(`<a href="${ttUrl}" target="_blank" rel="noopener noreferrer" class="social-chip">🎵 تيك توك</a>`);

    socialRow.innerHTML = links.join("");
    socialRow.style.display = links.length ? "flex" : "none";
  }

  if (settings.logoUrl) {
    const logoWrap = document.getElementById("headerLogoWrap");
    if (logoWrap) logoWrap.innerHTML = `<img src="${settings.logoUrl}" alt="Logo" style="width:100%;height:100%;object-fit:cover;" />`;
    const fav = document.getElementById("dynamicFavicon");
    if (fav) fav.href = settings.logoUrl;
  }
}

function applyDesignTheme() {
  const root = document.documentElement;
  const isDark = design.theme === "dark" || design.layout === "darkgold";
  root.style.setProperty("--primary", design.primaryColor || "#a65e2e");
  root.style.setProperty("--gold", design.primaryColor || "#a65e2e");
  root.style.setProperty("--bg", isDark ? "#12100e" : (design.bgColor || "#f6f1eb"));
  root.style.setProperty("--card-bg", isDark ? "#1c1815" : (design.cardBg || "#fffdf9"));
  root.style.setProperty("--text", isDark ? "#f5efe8" : "#1c1917");
  root.style.setProperty("--muted", isDark ? "#a89f96" : "#6b645e");
  root.style.setProperty("--border", isDark ? "#2e2722" : "#e5ddd3");

  document.body.style.fontFamily = `"${design.fontFamily || "Cairo"}", sans-serif`;
  document.body.style.background = isDark ? "#12100e" : (design.bgColor || "#f6f1eb");
  document.body.style.color = isDark ? "#f5efe8" : "#1c1917";
  document.body.setAttribute("data-theme", isDark ? "dark" : "light");

  const themeBtn = document.getElementById("themeToggleBtn");
  if (themeBtn) themeBtn.textContent = isDark ? "☀️ نهاري" : "🌙 ليلي";
}

document.getElementById("themeToggleBtn")?.addEventListener("click", () => {
  const isCurrentlyDark = document.body.getAttribute("data-theme") === "dark";
  design.theme = isCurrentlyDark ? "light" : "dark";
  applyDesignTheme();
  renderMenuGrid();
});

document.getElementById("exportPublicPdfBtn")?.addEventListener("click", () => {
  if (typeof html2pdf === "undefined") return showToast("جاري تحميل أداة الطباعة...");
  showToast(`جاري تجهيز كتالوج المنيو (${menuItems.length} صنف) PDF...`);

  const wrapper = document.createElement("div");
  wrapper.style.padding = "18px";
  wrapper.style.fontFamily = "Arial, Tahoma, sans-serif";
  wrapper.dir = "rtl";
  wrapper.style.background = "#ffffff";
  wrapper.style.color = "#1c1917";

  let sectionsHtml = `
    <div style="text-align:center;border-bottom:3px solid #a65e2e;padding-bottom:12px;margin-bottom:18px;">
      <h1 style="color:#23150d;font-size:22px;margin-bottom:4px;">${settings.nameAr}</h1>
      <p style="color:#57534e;font-size:12px;margin-bottom:3px;">${settings.taglineAr}</p>
      <p style="color:#a65e2e;font-size:11px;">${settings.addressAr || "القاهرة، مصر"} ${settings.hotline ? `| هاتف: ${settings.hotline}` : ""}</p>
    </div>
  `;

  categories
    .filter((c) => c.id !== "all")
    .forEach((cat) => {
      const catItems = menuItems.filter((m) => m.category === cat.id && m.available !== false);
      if (!catItems.length) return;
      sectionsHtml += `
        <div style="margin-bottom:18px;">
          <div style="background:#23150d;color:#ffffff;padding:7px 14px;border-radius:8px;font-size:14px;font-weight:bold;margin-bottom:10px;">
            ${cat.nameAr} (${catItems.length} أصناف)
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:11.5px;">
            <tbody>
              ${catItems
                .map(
                  (m) => `
                <tr style="border-bottom:1px solid #e5ddd3;page-break-inside:avoid;">
                  <td style="padding:7px 6px;width:54px;">
                    <img src="${m.image}" onerror="this.src='${FALLBACK_IMG}'" style="width:46px;height:46px;border-radius:8px;object-fit:cover;display:block;" crossorigin="anonymous" />
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
      filename: `${settings.nameAr}-Menu-${menuItems.length}.pdf`,
      html2canvas: { scale: 2, useCORS: true, letterRendering: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    })
    .from(wrapper)
    .save();
});

function renderCategories() {
  const container = document.getElementById("categoriesBar");
  if (!container) return;
  const list = [{ id: "all", nameAr: "الكل", icon: "✨" }, ...categories.filter((c) => c.id !== "all")];
  container.innerHTML = list
    .map(
      (cat) => `
      <button type="button" class="cat-pill ${activeCategory === cat.id ? "active" : ""}"
        style="${activeCategory === cat.id ? `background:${design.primaryColor || "#a65e2e"};color:#fff;border-color:${design.primaryColor || "#a65e2e"};` : ""}"
        onclick="window.selectCategory('${cat.id}')">
        <span>${cat.icon || ""}</span>
        <span>${cat.nameAr}</span>
      </button>
    `
    )
    .join("");
}

window.selectCategory = (catId) => {
  activeCategory = catId;
  renderCategories();
  renderMenuGrid();
};

function renderMenuGrid() {
  const grid = document.getElementById("menuGrid");
  if (!grid) return;

  const searchInp = document.getElementById("searchInput");
  if (searchInp) searchInp.placeholder = `ابحث في قائمة المشروبات والمأكولات (${menuItems.length} صنف)...`;

  const normalizeAr = (str) =>
    (str || "")
      .toLowerCase()
      .replace(/[أإآ]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه");

  const words = normalizeAr(searchQuery).trim().split(/\s+/).filter(Boolean);

  const filtered = menuItems.filter((item) => {
    if (item.available === false) return false;
    const matchCat = activeCategory === "all" || item.category === activeCategory;
    if (!matchCat) return false;
    if (!words.length) return true;

    const fullText = normalizeAr(`${item.nameAr || ""} ${item.nameEn || ""} ${item.descAr || ""}`);
    return words.every((w) => fullText.includes(w));
  });

  const layout = design.layout || "luxury";
  const brandColor = design.primaryColor || "#a65e2e";
  const isDark = design.theme === "dark" || layout === "darkgold";
  const cardBg = isDark ? "#1c1815" : (design.cardBg || "#fffdf9");
  const borderCol = isDark ? "#2e2722" : "#e5ddd3";

  if (layout === "compact" || layout === "editorial" || layout === "classic_text") {
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(320px, 1fr))";
    grid.style.gap = "12px";
  } else if (layout === "grid2" || design.mobileCols === "2") {
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(165px, 1fr))";
    grid.style.gap = "12px";
  } else {
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(275px, 1fr))";
    grid.style.gap = "16px";
  }

  if (!filtered.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px 16px;color:var(--muted);">لا توجد أصناف مطابقة للبحث</div>`;
    return;
  }

  grid.innerHTML = filtered
    .map((item) => {
      const price = item.sizes?.length ? item.sizes[0].price : item.price;
      const hasSizes = item.sizes && item.sizes.length > 0;
      const imgTag = `<img src="${item.image}" onerror="this.onerror=null;this.src='${FALLBACK_IMG}'" alt="${item.nameAr}" loading="lazy"`;

      const actionButtonHtml = isTableMode
        ? `<button type="button" onclick="event.stopPropagation();window.quickAddToCart('${item.id}')" style="background:${brandColor};color:#fff;border:none;padding:6px 14px;border-radius:${layout === "pill" ? "99px" : "10px"};font-size:0.8rem;font-weight:800;font-family:inherit;cursor:pointer;">
            ${hasSizes ? "الأحجام" : "+ أضف"}
           </button>`
        : `<span style="font-size:0.75rem;color:var(--muted);font-weight:700;">${hasSizes ? "متعدد الأحجام" : ""}</span>`;

      if (layout === "classic_text") {
        return `
          <div onclick="window.openItemModal('${item.id}')" style="background:${cardBg};border:1px solid ${borderCol};border-radius:14px;padding:14px 16px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:12px;">
            <div style="flex:1;">
              <strong style="font-size:0.96rem;display:block;margin-bottom:3px;">${item.nameAr}</strong>
              <small style="color:var(--muted);font-size:0.78rem;display:block;">${item.descAr || ""}</small>
            </div>
            <div style="text-align:left;flex-shrink:0;">
              <strong style="color:${brandColor};font-size:0.95rem;display:block;margin-bottom:5px;">${price} ج.م</strong>
              ${actionButtonHtml}
            </div>
          </div>
        `;
      }

      if (layout === "compact" || layout === "editorial") {
        const imgSize = layout === "editorial" ? "96px" : "74px";
        return `
          <div onclick="window.openItemModal('${item.id}')" style="background:${cardBg};border:1px solid ${borderCol};border-radius:15px;padding:11px;cursor:pointer;display:flex;align-items:center;gap:12px;">
            ${imgTag} style="width:${imgSize};height:${imgSize};border-radius:12px;object-fit:cover;flex-shrink:0;" />
            <div style="flex:1;min-width:0;">
              <strong style="font-size:0.92rem;display:block;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.nameAr}</strong>
              <small style="color:var(--muted);font-size:0.75rem;display:block;margin-bottom:7px;line-height:1.4;">${item.descAr || ""}</small>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <strong style="color:${brandColor};font-size:0.92rem;">${price} ج.م</strong>
                ${actionButtonHtml}
              </div>
            </div>
          </div>
        `;
      }

      if (layout === "cinema") {
        return `
          <div onclick="window.openItemModal('${item.id}')" style="position:relative;height:230px;border-radius:18px;overflow:hidden;cursor:pointer;border:1px solid ${borderCol};">
            ${imgTag} style="width:100%;height:100%;object-fit:cover;" />
            <div style="position:absolute;inset:0;background:linear-gradient(to top, rgba(0,0,0,0.88) 15%, rgba(0,0,0,0.15) 70%);display:flex;flex-direction:column;justify-content:flex-end;padding:14px;color:#fff;">
              <strong style="font-size:1rem;margin-bottom:3px;">${item.nameAr}</strong>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">
                <strong style="color:#fbbf24;font-size:0.98rem;">${price} ج.م</strong>
                ${actionButtonHtml}
              </div>
            </div>
          </div>
        `;
      }

      const radius = layout === "pill" ? "26px" : layout === "minimal" ? "10px" : "18px";
      const imgHeight = layout === "poster" ? "220px" : layout === "grid2" ? "135px" : "175px";
      const borderStyle = layout === "spotlight" ? `2px solid ${brandColor}` : layout === "minimal" ? "none" : `1px solid ${borderCol}`;

      return `
        <div onclick="window.openItemModal('${item.id}')" style="background:${cardBg};border:${borderStyle};border-radius:${radius};overflow:hidden;cursor:pointer;display:flex;flex-direction:column;box-shadow:${layout === "minimal" ? "none" : "0 4px 14px rgba(0,0,0,0.04)"};">
          <div style="position:relative;">
            ${imgTag} style="width:100%;height:${imgHeight};object-fit:cover;display:block;" />
            ${item.badge ? `<span style="position:absolute;top:10px;right:10px;background:${brandColor};color:#fff;padding:3px 10px;border-radius:99px;font-size:0.7rem;font-weight:800;">${item.badge}</span>` : ""}
          </div>
          <div style="padding:13px;display:flex;flex-direction:column;flex:1;justify-content:space-between;gap:8px;">
            <div>
              <strong style="font-size:0.95rem;display:block;margin-bottom:3px;">${item.nameAr}</strong>
              <small style="color:var(--muted);font-size:0.76rem;display:block;line-height:1.45;">${item.descAr || ""}</small>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding-top:6px;">
              <strong style="color:${brandColor};font-size:0.98rem;">${price} ج.م</strong>
              ${actionButtonHtml}
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

window.openItemModal = (itemId) => {
  const item = menuItems.find((m) => m.id === itemId);
  if (!item) return;

  selectedProduct = item;
  selectedSizeIndex = 0;

  const modal = document.getElementById("productModal");
  if (!modal) return;

  const imgEl = document.getElementById("modalImg");
  imgEl.onerror = () => { imgEl.src = FALLBACK_IMG; };
  imgEl.src = item.image;
  document.getElementById("modalTitle").textContent = item.nameAr;
  document.getElementById("modalDesc").textContent = item.descAr || "";

  const sizesWrap = document.getElementById("modalSizesWrap");
  if (sizesWrap) {
    if (item.sizes && item.sizes.length) {
      sizesWrap.style.display = "flex";
      sizesWrap.innerHTML = item.sizes
        .map(
          (s, idx) => `
          <button type="button" class="size-chip ${idx === 0 ? "active" : ""}" onclick="window.selectModalSize(${idx})">
            ${s.nameAr} — ${s.price} ج.م
          </button>
        `
        )
        .join("");
    } else {
      sizesWrap.style.display = "none";
      sizesWrap.innerHTML = "";
    }
  }

  updateModalPrice();
  modal.classList.add("open");
};

window.selectModalSize = (idx) => {
  selectedSizeIndex = idx;
  document.querySelectorAll(".size-chip").forEach((el, i) => el.classList.toggle("active", i === idx));
  updateModalPrice();
};

function updateModalPrice() {
  if (!selectedProduct) return;
  const price = selectedProduct.sizes?.length
    ? selectedProduct.sizes[selectedSizeIndex].price
    : selectedProduct.price;
  const priceEl = document.getElementById("modalPrice");
  if (priceEl) priceEl.textContent = `${price} ج.م`;
}

window.quickAddToCart = (itemId) => {
  if (!isTableMode) return;
  const item = menuItems.find((m) => m.id === itemId);
  if (!item) return;
  if (item.sizes && item.sizes.length > 1) {
    window.openItemModal(itemId);
    return;
  }
  const sizeObj = item.sizes?.length ? item.sizes[0] : null;
  addItemToCart(item, sizeObj, 1);
};

function addItemToCart(item, sizeObj, qty = 1) {
  if (!isTableMode) return;
  const unitPrice = sizeObj ? Number(sizeObj.price) : Number(item.price);
  const sizeAr = sizeObj ? sizeObj.nameAr : "";
  const cartKey = `${item.id}_${sizeAr}`;

  const existing = cart.find((c) => c.cartKey === cartKey);
  if (existing) {
    existing.qty += qty;
    existing.totalPrice = existing.qty * existing.unitPrice;
  } else {
    cart.push({
      cartKey,
      id: item.id,
      nameAr: item.nameAr,
      image: item.image,
      sizeAr,
      qty,
      unitPrice,
      totalPrice: unitPrice * qty
    });
  }
  renderCart();
  showToast(`تم إضافة "${item.nameAr}" للسلة`);
}

function renderCart() {
  const countBadge = document.getElementById("cartCountBadge");
  const listEl = document.getElementById("cartItemsList");
  const subEl = document.getElementById("cartSubtotal");
  const taxEl = document.getElementById("cartTax");
  const totalEl = document.getElementById("cartGrandTotal");

  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  if (countBadge) countBadge.textContent = totalQty;

  const subtotal = cart.reduce((s, i) => s + i.totalPrice, 0);
  const tax = settings.taxEnabled !== false ? Math.round(subtotal * 0.14) : 0;
  const grandTotal = subtotal + tax;

  if (subEl) subEl.textContent = `${subtotal} ج.م`;
  if (taxEl) taxEl.textContent = `${tax} ج.م`;
  if (totalEl) totalEl.textContent = `${grandTotal} ج.م`;

  if (!listEl) return;
  if (!cart.length) {
    listEl.innerHTML = `
      <div style="text-align:center;color:var(--muted);padding:55px 16px;">
        <div style="font-size:2.6rem;margin-bottom:8px;">🛒</div>
        <strong style="display:block;font-size:1rem;margin-bottom:4px;">سلة طلباتك فارغة</strong>
        <small>اختر مشروبك أو طبقك المفضل من المنيو لإضافته</small>
      </div>
    `;
    return;
  }

  listEl.innerHTML = cart
    .map(
      (item, idx) => `
      <div style="display:flex;align-items:center;gap:11px;background:var(--bg);border:1px solid var(--border);border-radius:14px;padding:10px;margin-bottom:10px;">
        <img src="${item.image || FALLBACK_IMG}" onerror="this.src='${FALLBACK_IMG}'" alt="" style="width:54px;height:54px;border-radius:11px;object-fit:cover;flex-shrink:0;" />
        <div style="flex:1;min-width:0;">
          <strong style="font-size:0.88rem;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.nameAr}</strong>
          ${item.sizeAr ? `<small style="color:var(--muted);display:block;font-size:0.74rem;">الحجم: ${item.sizeAr}</small>` : ""}
          <strong style="color:var(--primary);font-size:0.86rem;">${item.totalPrice} ج.م</strong>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <button type="button" onclick="window.changeCartQty(${idx}, -1)" style="width:27px;height:27px;border-radius:8px;border:1px solid var(--border);background:var(--card-bg);color:inherit;font-weight:900;cursor:pointer;">−</button>
          <strong style="min-width:18px;text-align:center;font-size:0.88rem;">${item.qty}</strong>
          <button type="button" onclick="window.changeCartQty(${idx}, 1)" style="width:27px;height:27px;border-radius:8px;border:1px solid var(--border);background:var(--card-bg);color:inherit;font-weight:900;cursor:pointer;">+</button>
          <button type="button" onclick="window.changeCartQty(${idx}, -999)" style="width:27px;height:27px;border-radius:8px;border:1px solid #fecaca;background:#fee2e2;color:#dc2626;font-size:0.76rem;cursor:pointer;">🗑</button>
        </div>
      </div>
    `
    )
    .join("");
}

window.changeCartQty = (idx, delta) => {
  if (!cart[idx]) return;
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  else cart[idx].totalPrice = cart[idx].qty * cart[idx].unitPrice;
  renderCart();
};

async function submitOrderToKitchen() {
  if (!isTableMode || isSubmittingOrder) return;
  if (!cart.length) return showToast("السلة فارغة!");
  if (settings.acceptingOrders === false) return showToast("عذراً، استقبال الطلبات متوقف حالياً");

  const confirmBtn = document.getElementById("confirmOrderBtn");
  isSubmittingOrder = true;
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.style.opacity = "0.7";
    confirmBtn.textContent = "جاري الإرسال...";
  }

  try {
    const tabKey = `table_${currentTable}`;
    const tabRef = ref(db, `activeTabs/${tabKey}`);
    const snap = await get(tabRef);
    const existing = snap.exists() && snap.val().status === "open" ? snap.val() : null;

    const mergedItems = existing && Array.isArray(existing.items) ? JSON.parse(JSON.stringify(existing.items)) : [];

    cart.forEach((newItem) => {
      const foundIdx = mergedItems.findIndex((m) => m.id === newItem.id && (m.sizeAr || "") === (newItem.sizeAr || ""));
      if (foundIdx > -1) {
        mergedItems[foundIdx].qty += newItem.qty;
        mergedItems[foundIdx].totalPrice = mergedItems[foundIdx].qty * mergedItems[foundIdx].unitPrice;
      } else {
        mergedItems.push({
          id: newItem.id,
          nameAr: newItem.nameAr,
          sizeAr: newItem.sizeAr || "",
          qty: newItem.qty,
          unitPrice: newItem.unitPrice,
          totalPrice: newItem.totalPrice
        });
      }
    });

    const subtotal = mergedItems.reduce((s, i) => s + Number(i.totalPrice), 0);
    const tax = settings.taxEnabled !== false ? Math.round(subtotal * 0.14) : 0;
    const nowTs = Date.now();
    const orderNumber = existing?.orderNumber || String(nowTs).slice(-5);
    const nowStr = new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });

    await set(tabRef, {
      orderNumber,
      tableNumber: String(currentTable),
      status: "open",
      items: mergedItems,
      subtotal,
      tax,
      total: subtotal + tax,
      openedAt: existing?.openedAt || nowStr,
      lastUpdatedAt: nowStr,
      alertTimestamp: nowTs
    });

    cart = [];
    renderCart();
    document.getElementById("cartDrawer")?.classList.remove("open");

    const banner = document.getElementById("orderConfirmBanner");
    const bannerText = document.getElementById("orderConfirmText");
    if (banner && bannerText) {
      bannerText.textContent = `✅ تم استلام طلبك بنجاح! رقم الطلب: #${orderNumber} (ترابيزة ${currentTable})`;
      banner.classList.add("show");
    }
    showToast(`✅ تم إرسال الطلب #${orderNumber} للكاشير`);
  } catch (err) {
    showToast("حدث خطأ أثناء إرسال الطلب، حاول مرة أخرى.");
  } finally {
    isSubmittingOrder = false;
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.style.opacity = "1";
      confirmBtn.textContent = "✔ تأكيد وإرسال الطلب للكاشير";
    }
  }
}

function listenToActiveTableTab(tableNum) {
  const tabKey = `table_${tableNum}`;
  onValue(ref(db, `activeTabs/${tabKey}`), (snap) => {
    const billPill = document.getElementById("openBillModalBtn");
    if (!billPill) return;

    if (!snap.exists() || snap.val().status !== "open") {
      currentOpenTab = null;
      billPill.style.display = "none";
      document.getElementById("customerBillModal")?.classList.remove("open");
      return;
    }
    currentOpenTab = snap.val();
    billPill.style.display = "inline-flex";
    const totalEl = document.getElementById("activeTabTotalText");
    if (totalEl) totalEl.textContent = `${currentOpenTab.total} ج.م`;
    renderCustomerReceipt();
  });
}

function buildCustomerReceiptHtml(tab) {
  const invNo = tab.orderNumber || String(tab.alertTimestamp || Date.now()).slice(-5);
  return `
    <div style="border:2px solid #000;border-radius:8px;padding:8px;background:#fff;color:#000;font-family:'Cairo',sans-serif;box-sizing:border-box;">
      <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:6px;margin-bottom:6px;">
        <div style="font-size:15px;font-weight:900;">☕ ${settings.nameAr}</div>
        <div style="font-size:9px;color:#333;margin-top:2px;">${settings.addressAr || "القاهرة، مصر"}</div>
        ${settings.hotline ? `<div style="font-size:9px;color:#333;">هاتف: ${settings.hotline}</div>` : ""}
      </div>

      <div style="display:flex;justify-content:space-between;background:#f3f4f6;padding:4px 6px;border-radius:4px;font-size:10px;font-weight:800;margin-bottom:4px;">
        <span>فاتورة #${invNo}</span>
        <span>ترابيزة: ${tab.tableNumber}</span>
      </div>

      <div style="text-align:center;font-size:9px;color:#444;margin-bottom:6px;">
        ${new Date().toLocaleDateString("ar-EG")} • وقت الفتح: ${tab.openedAt || ""}
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:10px;margin-bottom:7px;">
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
              <tr style="border-bottom:1px dashed #999;">
                <td style="padding:4px;font-weight:700;">${i.nameAr} ${i.sizeAr ? `(${i.sizeAr})` : ""}</td>
                <td style="text-align:center;padding:4px;font-weight:800;">${i.qty}</td>
                <td style="text-align:left;padding:4px;font-weight:800;">${i.totalPrice}</td>
              </tr>
            `
            )
            .join("")}
        </tbody>
      </table>

      <div style="border-top:1.5px solid #000;padding-top:5px;font-size:10px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
          <span>المجموع الفرعي:</span>
          <strong>${tab.subtotal} ج.م</strong>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
          <span>ضريبة القيمة المضافة (14%):</span>
          <strong>${tab.tax} ج.م</strong>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:12.5px;font-weight:900;border:2px solid #000;padding:4px 7px;border-radius:5px;background:#f5f5f5;">
          <span>الإجمالي المستحق:</span>
          <span>${tab.total} ج.م</span>
        </div>
      </div>

      <div style="text-align:center;margin-top:8px;border-top:1px dashed #000;padding-top:5px;font-size:10px;font-weight:800;">
        شرفتونا في ${settings.nameAr} ☕<br/>
        <span style="font-size:8.5px;font-weight:600;color:#444;">الأسعار شاملة ضريبة القيمة المضافة</span>
      </div>
    </div>
  `;
}

function renderCustomerReceipt() {
  const box = document.getElementById("customerReceiptPrintable");
  if (!box || !currentOpenTab) return;
  box.innerHTML = buildCustomerReceiptHtml(currentOpenTab);
}

async function sendWaiterAlert(type = "waiter") {
  if (!isTableMode) return;
  const total = type === "bill" && currentOpenTab ? Number(currentOpenTab.total || 0) : 0;

  const callId = `call_${Date.now()}`;
  await set(ref(db, `waiterCalls/${callId}`), {
    id: callId,
    table: String(currentTable),
    type,
    total,
    status: "active",
    createdAt: Date.now(),
    timeFormatted: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
  });

  showToast(type === "bill" ? "🧾 تم إرسال طلب الحساب للكاشير" : "🔔 تم استدعاء الويتر لترابيزتك");
}

document.getElementById("searchInput")?.addEventListener("input", (e) => {
  searchQuery = e.target.value;
  renderMenuGrid();
});

document.getElementById("modalAddToCartBtn")?.addEventListener("click", () => {
  if (!selectedProduct || !isTableMode) return;
  const sizeObj = selectedProduct.sizes?.length ? selectedProduct.sizes[selectedSizeIndex] : null;
  addItemToCart(selectedProduct, sizeObj, 1);
  document.getElementById("productModal")?.classList.remove("open");
});

document.getElementById("closeProductModalBtn")?.addEventListener("click", () => {
  document.getElementById("productModal")?.classList.remove("open");
});

document.getElementById("openCartBtn")?.addEventListener("click", () => {
  if (!isTableMode) return;
  document.getElementById("cartDrawer")?.classList.add("open");
});

document.getElementById("closeCartBtn")?.addEventListener("click", () => {
  document.getElementById("cartDrawer")?.classList.remove("open");
});

document.getElementById("openBillModalBtn")?.addEventListener("click", () => {
  if (!currentOpenTab) return;
  renderCustomerReceipt();
  document.getElementById("customerBillModal")?.classList.add("open");
});

document.getElementById("closeCustomerBillBtn")?.addEventListener("click", () => {
  document.getElementById("customerBillModal")?.classList.remove("open");
});

document.getElementById("printCustomerReceiptBtn")?.addEventListener("click", () => {
  if (!currentOpenTab) return;
  const printArea = document.getElementById("customerThermalPrintArea");
  if (printArea) {
    printArea.innerHTML = buildCustomerReceiptHtml(currentOpenTab);
  }
  window.print();
});

document.getElementById("confirmOrderBtn")?.addEventListener("click", submitOrderToKitchen);
document.getElementById("callWaiterBtn")?.addEventListener("click", () => sendWaiterAlert("waiter"));
document.getElementById("requestBillBtn")?.addEventListener("click", () => {
  sendWaiterAlert("bill");
  document.getElementById("customerBillModal")?.classList.remove("open");
});

function showToast(msg) {
  const bar = document.getElementById("toastBar");
  if (!bar) return;
  bar.textContent = msg;
  bar.classList.add("show");
  setTimeout(() => bar.classList.remove("show"), 3000);
}

bootApp();