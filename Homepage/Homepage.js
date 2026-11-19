import { ref, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { db } from "../firebase-config.js";

async function initHomepage() {
  try {
    const snap = await get(ref(db, "settings"));
    if (snap.exists()) {
      const s = snap.val();
      if (s.nameAr) {
        document.getElementById("homeBrandName").textContent = s.nameAr;
        document.getElementById("footerCafeName").textContent = s.nameAr;
      }
      if (s.addressAr) {
        document.getElementById("homeAddress").textContent = s.addressAr;
        const encodedAddr = encodeURIComponent(s.addressAr);
        document.getElementById("googleMapEmbed").src = `https://maps.google.com/maps?q=${encodedAddr}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
        document.getElementById("googleMapsDirBtn").href = `https://www.google.com/maps/search/?api=1&query=${encodedAddr}`;
      }
      if (s.hotline) {
        const cleanPhone = String(s.hotline).replace(/\D/g, "");
        document.getElementById("homePhoneLink").textContent = s.hotline;
        document.getElementById("homePhoneLink").href = `tel:${cleanPhone}`;
        document.getElementById("homeWhatsappLink").href = `https://wa.me/2${cleanPhone}`;
      }
    }
  } catch {}

  if (window.lucide) lucide.createIcons();
}

initHomepage();