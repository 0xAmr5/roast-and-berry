import { ref, get, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { db, sha256Hex, DEFAULT_ADMIN_PHONE, DEFAULT_ADMIN_PASS } from "../firebase-config.js";

const EGYPT_PHONE_REGEX = /^01[0125][0-9]{8}$/;
const phoneInput = document.getElementById("phoneInput");
const passwordInput = document.getElementById("passwordInput");
const phoneError = document.getElementById("phoneError");
const passError = document.getElementById("passError");
const globalError = document.getElementById("globalError");
const submitBtn = document.getElementById("loginSubmitBtn");

phoneInput.addEventListener("input", () => {
  phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 11);
  phoneInput.classList.remove("is-invalid");
  phoneError.classList.remove("visible");
});

passwordInput.addEventListener("input", () => {
  passwordInput.classList.remove("is-invalid");
  passError.classList.remove("visible");
});

document.getElementById("togglePassBtn").addEventListener("click", () => {
  const isPass = passwordInput.type === "password";
  passwordInput.type = isPass ? "text" : "password";
  document.getElementById("eyeIcon").setAttribute("data-lucide", isPass ? "eye-off" : "eye");
  if (window.lucide) lucide.createIcons();
});

document.getElementById("adminLoginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  globalError.classList.remove("show");

  const phone = phoneInput.value.trim();
  const password = passwordInput.value.trim();

  if (!EGYPT_PHONE_REGEX.test(phone)) {
    phoneInput.classList.add("is-invalid");
    phoneError.classList.add("visible");
    return;
  }
  if (password.length < 6) {
    passwordInput.classList.add("is-invalid");
    passError.classList.add("visible");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span>جاري الدخول...</span>`;

  try {
    const inputHash = await sha256Hex(password);
    const defaultHash = await sha256Hex(DEFAULT_ADMIN_PASS);

    let isValid = false;
    let activeHash = defaultHash;

    // 1. التحقق المباشر من البيانات المعتمدة 01018622861 / 20268855
    if (phone === DEFAULT_ADMIN_PHONE && password === DEFAULT_ADMIN_PASS) {
      isValid = true;
      try {
        await set(ref(db, "adminAuth"), {
          phone: DEFAULT_ADMIN_PHONE,
          passwordHash: defaultHash,
          updatedAt: Date.now()
        });
      } catch {}
    } else {
      // 2. التحقق من أي بيانات محدثة من داخل الداشبورد
      try {
        const authSnap = await get(ref(db, "adminAuth"));
        if (authSnap.exists()) {
          const data = authSnap.val();
          if (phone === data.phone && inputHash === data.passwordHash) {
            isValid = true;
            activeHash = data.passwordHash;
          }
        }
      } catch {}
    }

    if (isValid) {
      const sig = await sha256Hex(`${phone}|${activeHash}|RB_SESSION_2026`);
      sessionStorage.setItem(
        "rb_admin_session",
        JSON.stringify({ phone, sig, loginAt: Date.now() })
      );
      window.location.href = "../admin/admin.html";
    } else {
      globalError.textContent = "رقم الهاتف أو كلمة المرور غير صحيحة.";
      globalError.classList.add("show");
    }
  } catch (err) {
    globalError.textContent = "حدث خطأ أثناء تسجيل الدخول، حاول مرة أخرى.";
    globalError.classList.add("show");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span>تسجيل الدخول للداشبورد</span><i data-lucide="arrow-left" style="width:18px;height:18px;"></i>`;
    if (window.lucide) lucide.createIcons();
  }
});

if (window.lucide) lucide.createIcons();