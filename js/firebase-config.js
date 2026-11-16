import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { CAFE_INFO, CATEGORIES, INITIAL_MENU_ITEMS } from "./menu-data.js";

const firebaseConfig = {
  apiKey: "AIzaSyCCp7WLSDOQMRjFxBU9xRQA57u9tb1T77g",
  authDomain: "cafe-qr-menu-5027e.firebaseapp.com",
  databaseURL: "https://cafe-qr-menu-5027e-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "cafe-qr-menu-5027e",
  storageBucket: "cafe-qr-menu-5027e.firebasestorage.app",
  messagingSenderId: "283561741310",
  appId: "1:283561741310:web:f36ece4a2ca9305e9b8eaf"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

export async function seedDatabaseIfEmpty() {
  try {
    const menuRef = ref(db, "menuItems");
    const snapshot = await get(menuRef);

    if (!snapshot.exists()) {
      const itemsObject = {};
      INITIAL_MENU_ITEMS.forEach((item) => {
        itemsObject[item.id] = item;
      });

      await set(ref(db, "settings"), CAFE_INFO);
      await set(ref(db, "categories"), CATEGORIES);
      await set(ref(db, "menuItems"), itemsObject);
      console.log("تم رفع داتا الكافيه بنجاح على Firebase!");
    }
  } catch (error) {
    console.error("خطأ في الاتصال بـ Firebase:", error);
  }
}