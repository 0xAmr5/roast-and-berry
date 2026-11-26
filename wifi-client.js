import { ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { db } from "./firebase-config.js";

const style = document.createElement("style");
style.textContent = `
  @keyframes rbSpin { to { transform: rotate(360deg); } }
  .rb-spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.35);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: rbSpin 0.7s linear infinite;
    vertical-align: middle;
    flex-shrink: 0;
  }
  .rb-wifi-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 7px 12px;
    border-radius: 99px;
    font-family: "Cairo", sans-serif;
    font-size: 0.8rem;
    font-weight: 800;
    cursor: pointer;
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    white-space: nowrap;
    line-height: 1.1;
    touch-action: manipulation;
  }
  .rb-wifi-pill.pending {
    background: rgba(245, 158, 11, 0.22);
    border-color: rgba(245, 158, 11, 0.5);
    color: #fcd34d;
  }
  .rb-wifi-pill.active {
    background: rgba(34, 197, 94, 0.24);
    border-color: rgba(34, 197, 94, 0.55);
    color: #86efac;
  }
  .rb-wifi-popover {
    position: fixed;
    top: 70px;
    left: 16px;
    z-index: 9999;
    background: #1c1613;
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 16px;
    padding: 14px 16px;
    width: min(290px, calc(100vw - 32px));
    box-shadow: 0 14px 32px rgba(0, 0, 0, 0.45);
    font-family: "Cairo", sans-serif;
    direction: rtl;
    display: none;
  }
  .rb-wifi-popover.open { display: block; }

  @media (max-width: 480px) {
    .rb-wifi-pill {
      padding: 6px 10px;
      font-size: 0.74rem;
      gap: 4px;
    }
    .rb-wifi-popover {
      top: auto;
      bottom: 80px;
      left: 16px;
      right: 16px;
      width: auto;
    }
  }
`;
document.head.appendChild(style);

let rafScheduled = false;
const observer = new MutationObserver(() => {
  if (rafScheduled) return;
  rafScheduled = true;
  requestAnimationFrame(() => {
    rafScheduled = false;
    document.querySelectorAll("button").forEach((btn) => {
      if (!btn.dataset.spinnerApplied && btn.textContent.includes("جار") && btn.textContent.includes("الإرسال")) {
        btn.dataset.spinnerApplied = "true";
        btn.innerHTML = `<span class="rb-spinner" aria-label="جارٍ الإرسال"></span>`;
      }
    });
  });
});
observer.observe(document.body, { childList: true, subtree: true });

const params = new URLSearchParams(window.location.search);
const tableNum = params.get("table");

if (tableNum && /^\d+$/.test(tableNum)) {
  let wifiSsid = "RoastBerry_Guest";
  let wifiPass = "rb@2026";
  let isAllowed = false;
  let requestSent = false;

  const btnMount = document.createElement("span");
  btnMount.style.display = "inline-flex";

  const popover = document.createElement("div");
  popover.className = "rb-wifi-popover";
  document.body.appendChild(popover);

  const placeNextToWaiter = () => {
    const waiterBtn = Array.from(document.querySelectorAll("header button")).find((b) =>
      b.textContent.includes("نداء الويتر")
    );
    if (waiterBtn && waiterBtn.parentElement) {
      waiterBtn.parentElement.style.flexWrap = "wrap";
      waiterBtn.parentElement.style.gap = "6px";
      waiterBtn.parentElement.insertBefore(btnMount, waiterBtn);
    }
  };

  const renderUI = () => {
    if (isAllowed) {
      btnMount.innerHTML = `<button type="button" id="headerWifiBtn" class="rb-wifi-pill active">📶 الواي فاي</button>`;
      popover.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <strong style="font-size:0.86rem;color:#86efac;">بيانات الواي فاي — ترابيزة ${tableNum}</strong>
          <button type="button" id="closeWifiPopBtn" style="background:none;border:none;color:#a8a29e;cursor:pointer;font-weight:900;font-size:1rem;">✕</button>
        </div>
        <div style="font-size:0.82rem;line-height:1.8;margin-bottom:10px;background:rgba(255,255,255,0.06);padding:8px 10px;border-radius:10px;">
          <div>الشبكة: <strong style="color:#fbbf24;">${wifiSsid}</strong></div>
          <div>الباسورد: <strong style="user-select:all;">${wifiPass}</strong></div>
        </div>
        <button type="button" id="copyHeaderWifiBtn" style="width:100%;background:#a65e2e;color:#fff;border:none;padding:9px;border-radius:10px;font-family:inherit;font-size:0.82rem;font-weight:800;cursor:pointer;">نسخ الباسورد</button>
      `;
      document.getElementById("headerWifiBtn")?.addEventListener("click", () => popover.classList.toggle("open"));
      document.getElementById("closeWifiPopBtn")?.addEventListener("click", () => popover.classList.remove("open"));
      document.getElementById("copyHeaderWifiBtn")?.addEventListener("click", () => {
        navigator.clipboard?.writeText(wifiPass);
        const cBtn = document.getElementById("copyHeaderWifiBtn");
        cBtn.textContent = "تم النسخ ✔";
        setTimeout(() => (cBtn.textContent = "نسخ الباسورد"), 2000);
      });
    } else {
      popover.classList.remove("open");
      btnMount.innerHTML = `
        <button type="button" id="headerWifiBtn" class="rb-wifi-pill ${requestSent ? "pending" : ""}" ${requestSent ? "disabled" : ""}>
          ${requestSent ? `<span class="rb-spinner"></span><span>بانتظار الكاشير</span>` : `📶 الواي فاي`}
        </button>
      `;
      document.getElementById("headerWifiBtn")?.addEventListener("click", async () => {
        if (requestSent) return;
        const btn = document.getElementById("headerWifiBtn");
        btn.disabled = true;
        btn.innerHTML = `<span class="rb-spinner"></span>`;
        try {
          const now = Date.now();
          const callId = `wifi_${tableNum}_${now}`;
          await set(ref(db, `waiterCalls/${callId}`), {
            id: callId,
            table: String(tableNum),
            type: "wifi",
            status: "active",
            createdAt: now,
            timeFormatted: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
          });
          requestSent = true;
          renderUI();
        } catch (err) {
          alert("تعذر الإرسال: " + err.message);
          btn.disabled = false;
          renderUI();
        }
      });
    }
  };

  placeNextToWaiter();
  renderUI();

  onValue(ref(db, "settings"), (snap) => {
    if (snap.exists()) {
      const data = snap.val();
      if (data.wifiSsid) wifiSsid = data.wifiSsid;
      if (data.wifiPass) wifiPass = data.wifiPass;
      renderUI();
    }
  });

  onValue(ref(db, `wifiPermissions/table_${tableNum}`), (snap) => {
    const allowedNow = snap.exists() && snap.val() === true;
    if (allowedNow && !isAllowed) {
      isAllowed = true;
      requestSent = false;
      renderUI();
      popover.classList.add("open");
    } else {
      isAllowed = allowedNow;
      renderUI();
    }
  });
}