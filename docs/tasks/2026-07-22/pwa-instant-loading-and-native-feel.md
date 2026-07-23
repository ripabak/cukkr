# Cukkr Backlog Tasks

> Last updated: 2026-07-22

---

## TASK-019 · PWA Instant Loading & Native Feel — Service Worker Cache + App Shell Splash

**Description:**
Saat ini PWA Cukkr terasa lama saat dibuka karena setiap visit mendownload ulang seluruh JS bundle, CSS, dan font dari network tanpa caching. Service worker (`public/sw.js`) yang ada hanya menangani push notification dan tidak memiliki cache strategy sama sekali. Selain itu, `public/index.html` hanya berisi `<div id="root"></div>` kosong, sehingga user melihat layar putih selama 3–20 detik sampai Metro bundle selesai di-load oleh browser. Kombinasi dua masalah ini membuat PWA terasa jauh dari native — repeat visit pun tidak ada percepatan. Task ini menambahkan (1) service worker dengan stale-while-revalidate cache strategy untuk JS/CSS/font, dan (2) inline splash screen di `index.html` bergaya brand Cukkr yang langsung tampil sebelum React mount, lalu menghilang begitu app siap.

**Implementation Plan:**
- [x] Tambahkan event `install` di `public/sw.js` untuk precache aset statis: JS bundle chunks, favicon, manifest, dan icon PWA ke `CacheStorage`.
- [x] Tambahkan event `activate` di `public/sw.js` untuk membersihkan cache versi lama (cache busting via cache name versioning).
- [x] Tambahkan event `fetch` di `public/sw.js` dengan strategi **stale-while-revalidate**: serve dari cache dulu, lalu fetch network di background untuk update cache — untuk request JS, CSS, font, dan gambar.
- [x] Update `public/sw.js` untuk skip waiting (`self.skipWaiting()`) di event `install` agar SW baru langsung aktif tanpa perlu tutup semua tab.
- [x] Di `public/index.html`, tambahkan inline `<style>` dan `<div id="splash">` di atas `<div id="root">` dengan desain:
  - Background: putih (`#ffffff`)
  - Logo app (gunakan `/cukkr-logo-trans.png` atau fallback teks "Cukkr")
  - App name "Cukkr" dengan font sistem (sans-serif), weight bold, warna brand `#ffc81e`
  - Subtle loading indicator di bawah logo (pulsing dot atau CSS spinner tipis)
  - Semua inline CSS — tidak ada file eksternal
- [x] Tambahkan script inline di bawah splash untuk menghapus `#splash` setelah React mount (via `DOMContentLoaded` + `requestAnimationFrame` + fallback timeout 8 detik sebagai safety net).
- [x] Verifikasi struktur `public/index.html` tetap kompatibel dengan Expo web build (`npx expo export --platform web`).
- [x] Files to modify: `public/sw.js`, `public/index.html`.

**Manual Verification (Human Checklist):**
- [ ] Buka app di browser web, lalu install sebagai PWA ("Add to Home Screen").
- [ ] Buka PWA dari home screen — pastikan splash screen muncul seketika (logo Cukkr + loading indicator), lalu menghilang saat app siap.
- [ ] Tutup PWA dan buka lagi — pastikan splash tetap muncul instan dan app load dalam <1 detik (diambil dari SW cache).
- [ ] Di Chrome DevTools > Application > Cache Storage, pastikan ada entry untuk JS bundle dan aset lainnya.
- [ ] Di Chrome DevTools > Application > Service Workers, pastikan SW status "activated and is running".
- [ ] Lakukan hard refresh (Ctrl+Shift+R) untuk memaksa download ulang — pastikan splash muncul dan app tetap load dengan benar.
- [ ] Buka Network tab, centang "Offline", lalu buka PWA — pastikan app masih bisa dibuka dari cache.
- [ ] Buka PWA di iOS Safari, tambahkan ke home screen, buka — pastikan splash screen muncul dengan benar (iOS menggunakan `apple-mobile-web-app-capable`).

**Tags:** `cukkr-frontend`
