import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, get, set, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
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

export const DEFAULT_ADMIN_PHONE = "01018622861";
export const DEFAULT_ADMIN_PASS = "20268855";

export async function sha256Hex(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(String(text));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function seedDatabaseIfEmpty(forceMenuReset = false) {
  try {
    const expectedHash = await sha256Hex(DEFAULT_ADMIN_PASS);
    const authRef = ref(db, "adminAuth");
    const authSnap = await get(authRef);
    if (!authSnap.exists() || !authSnap.val().customUpdated) {
      await set(authRef, {
        phone: DEFAULT_ADMIN_PHONE,
        passwordHash: expectedHash,
        updatedAt: Date.now()
      });
    }

    const menuRef = ref(db, "menuItems");
    const snapshot = await get(menuRef);
    const val = snapshot.exists() ? snapshot.val() : {};
    const validKeys = Object.keys(val).filter((k) => k && k !== "undefined");

    if (forceMenuReset || validKeys.length !== INITIAL_MENU_ITEMS.length) {
      const itemsObject = {};
      INITIAL_MENU_ITEMS.forEach((item, idx) => {
        const id = item.id || `rb_item_${idx + 1}`;
        itemsObject[id] = {
          available: true,
          ...item,
          id
        };
      });

      const settingsSnap = await get(ref(db, "settings"));
      if (!settingsSnap.exists()) {
        await set(ref(db, "settings"), {
          totalTables: 20,
          taxEnabled: true,
          acceptingOrders: true,
          wifiChargeEnabled: false,
          wifiPrice: 15,
          ...CAFE_INFO
        });
      } else {
        await update(ref(db, "settings"), CAFE_INFO);
      }

      await set(ref(db, "categories"), CATEGORIES);
      await set(ref(db, "menuItems"), itemsObject);
    }
  } catch (error) {
    console.warn("Firebase init note:", error.message);
  }
}