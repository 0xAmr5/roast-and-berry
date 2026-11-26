import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCCp7WLSDOQMRjFxBU9xRQA57u9tb1T77g",
  authDomain: "cafe-qr-menu-5027e.firebaseapp.com",
databaseURL: "https://cafe-qr-menu-5027e-default-rtdb.europe-west1.firebasedatabase.app" ,
  projectId: "cafe-qr-menu-5027e",
  storageBucket: "cafe-qr-menu-5027e.firebasestorage.app",
  messagingSenderId: "283561741310",
  appId: "1:283561741310:web:f36ece4a2ca9305e9b8eaf"
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const auth = getAuth(app);

export const CAFE_INFO = {
  nameAr: "روست آند بيري كافيه",
  taglineAr: "قهوة مختصة • فطار • سلطات • أطباق رئيسية • عصائر فريش وحلويات",
  addressAr: "الشروق، القاهرة",
  hotline: "",
  whatsapp: "",
  facebook: "",
  instagram: "",
  tiktok: "",
  logoUrl: ""
};

export const cleanCafeInfo = { ...CAFE_INFO, addressAr: "الشروق، القاهرة" };