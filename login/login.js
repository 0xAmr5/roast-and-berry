import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { auth } from "../firebase-config.js";

const EGYPT_PHONE_REGEX = /^01[0125][0-9]{8}$/;
const AUTH_DOMAIN_SUFFIX = "@roastberry.app";

const phoneInput = document.getElementById("phoneInput");
const passwordInput = document.getElementById("passwordInput");
const phoneError = document.getElementById("phoneError");
const passError = document.getElementById("passError");
const globalError = document.getElementById("globalError");
const submitBtn = document.getElementById("loginSubmitBtn");

onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "../admin/admin.html";
  }
});

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
  const password = passwordInput.value;

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
    const mappedEmail = `${phone}${AUTH_DOMAIN_SUFFIX}`;
    await signInWithEmailAndPassword(auth, mappedEmail, password);
    window.location.href = "../admin/admin.html";
  } catch (err) {
    const code = err?.code || "";
    if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
      globalError.textContent = "رقم الهاتف أو كلمة المرور غير صحيحة.";
    } else if (code === "auth/too-many-requests") {
      globalError.textContent = "تم حظر المحاولات مؤقتاً لكثرة الأخطاء، حاول لاحقاً.";
    } else {
      globalError.textContent = "تعذر تسجيل الدخول، تأكد من الاتصال بالإنترنت.";
    }
    globalError.classList.add("show");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span>تسجيل الدخول للداشبورد</span><i data-lucide="arrow-left" style="width:18px;height:18px;"></i>`;
    if (window.lucide) lucide.createIcons();
  }
});

if (window.lucide) lucide.createIcons();