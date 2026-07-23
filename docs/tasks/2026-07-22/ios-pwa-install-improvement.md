# iOS PWA Install Experience Improvement

**Description:**
Saat ini PWA Cukkr sudah bisa diinstall di iOS lewat Safari, tetapi panduan install yang ada (IOSInstallModal) masih kurang informatif. User sering kesulitan karena:
- Tidak semua user pakai Safari (ada yang pakai Chrome/Firefox)
- Flow Safari berbeda antar versi iOS (ada yang langsung lihat Share button, ada yang harus tekan ikon titik tiga dulu)
- "Add to Home Screen" tidak langsung terlihat di share sheet — perlu scroll ke bawah
- Tidak ada visual aid (screenshot) yang menunjukkan letak tombol
- Tidak ada konfirmasi setelah install berhasil

Task ini memperbaiki IOSInstallModal agar lebih informatif dengan screenshot mockup, panduan yang mencakup variasi flow iOS, dan konfirmasi post-install.

---

## Implementation Plan

### 1. Update IOSInstallModal — Enhanced Design

**Single-screen enhanced modal** (tetap satu layar, bukan wizard) dengan:

- **Header**: Icon app + "Install Cukkr ke Home Screen"
- **Safari reminder note**: Di bagian atas modal, tampilkan catatan: *"Pastikan kamu menggunakan Safari browser untuk menginstall."* (hanya hint, tidak blocking)
- **3 steps with screenshot mockups:**
  - **Step 1**: "Tap Share button"
    - Screenshot mockup Safari dengan anotasi panah ke Share button (kotak + panah)
    - Varian note kecil: *"Jika tidak melihat ikon Share, ketuk ikon titik tiga (...) terlebih dahulu"*
  - **Step 2**: "Add to Home Screen"
    - Screenshot mockup share sheet dengan anotasi panah ke "Add to Home Screen"
    - Varian note kecil: *"Gulir ke bawah jika tidak langsung terlihat, lalu ketuk 'Add to Home Screen' dan selesaikan prosesnya"*
  - **Step 3**: "Buka dari Home Screen"
    - Screenshot mockup iOS home screen dengan icon Cukkr muncul
    - Teks: *"App sudah ditambahkan ke Home Screen. Silakan buka app dari sana."*
- **"Got it" button** — dismiss modal
- **Dismiss state**: Tetap pakai localStorage key `pwa_install_banner_dismissed`

### 2. Update usePWAInstall Hook

- Tambahkan deteksi apakah user sedang di Safari browser atau bukan (via user agent)
- Ekspos `isSafari` flag untuk digunakan banner/modal menampilkan Safari reminder
- Tambahkan state `justInstalled` yang di-set true setelah iOS install flow selesai (user menekan Got It)
- Tambahkan `postInstallMessage` yang muncul sebagai toast: *"Cukkr sudah terinstall! Buka dari Home Screen untuk akses cepat."*

### 3. Update PWAInstallBanner

- Pass `isSafari` ke IOSInstallModal untuk menampilkan Safari reminder
- Setelah modal di-close dan user sudah melalui flow, tampilkan toast konfirmasi post-install

### 4. Mockup Screenshots (Assets)

- Buat 3 screenshot mockup di `public/screenshots/ios-install/`:
  - `step1-share.png` — Safari browser + Share button annotation
  - `step2-add-to-home.png` — Share sheet + Add to Home Screen annotation  
  - `step3-home-screen.png` — iOS home screen with Cukkr icon
- Mockup bisa dibuat sementara dari desain atau screenshot asli yang diedit
- Format PNG, resolusi 390×844 (iPhone 14 size) atau aspect ratio sesuai
- Fallback: Jika gambar tidak ada, tetap tampilkan teks + icon seperti sekarang

### 5. i18n Strings Update

**Indonesian (`id.ts`):**
```
pwaInstall: {
  // existing keys preserved
  safariNote: 'Pastikan kamu menggunakan Safari browser untuk hasil terbaik',
  step1Title: 'Ketuk tombol Bagikan',
  step1Desc: 'Ketuk ikon Bagikan (kotak dengan panah ke atas) di bagian bawah Safari.',
  step1Variant: 'Jika tidak melihat ikon Bagikan, ketuk ikon titik tiga (...) terlebih dahulu',
  step2Title: 'Cari "Add to Home Screen"',
  step2Desc: 'Gulir ke bawah di menu yang muncul, lalu ketuk "Add to Home Screen" dan selesaikan prosesnya.',
  step2Variant: 'Tombol "Add to Home Screen" mungkin perlu di-scroll ke bawah',
  step3Title: 'Buka dari Home Screen',
  step3Desc: 'App sudah ditambahkan ke Home Screen. Silakan buka app dari sana.',
  installSuccess: 'Cukkr sudah terinstall! Buka dari Home Screen untuk akses cepat.',
}
```

**English (`en.ts`):**
```
pwaInstall: {
  // existing keys preserved
  safariNote: 'Make sure you are using Safari browser for the best experience',
  step1Title: 'Tap the Share button',
  step1Desc: 'Tap the Share icon (box with arrow up) at the bottom of Safari.',
  step1Variant: 'If you don\'t see the Share icon, tap the (...) menu icon first',
  step2Title: 'Find "Add to Home Screen"',
  step2Desc: 'Scroll down in the menu that appears, tap "Add to Home Screen", and complete the process.',
  step2Variant: '"Add to Home Screen" may need scrolling down to find',
  step3Title: 'Open from Home Screen',
  step3Desc: 'The app has been added to your Home Screen. Open it from there.',
  installSuccess: 'Cukkr is installed! Open from Home Screen for quick access.',
}
```

### 6. Component Update — IOSInstallModal

- 3 steps (current: 2 steps)
- Tambah screenshot mockup untuk tiap step (gunakan `Image` component)
- Tambah Safari reminder note di atas steps
- Tambah varian text untuk tiap step
- Loading state untuk gambar (fallback ke icon jika gambar belum siap)
- Platform check tetap `Platform.OS !== "web"` return null

### 7. Files to Modify

| File | Change |
|------|--------|
| `src/components/IOSInstallModal.tsx` | Full rewrite — 3 steps, screenshots, Safari note, variants |
| `src/hooks/usePWAInstall.ts` | Add `isSafari`, `justInstalled`, post-install toast trigger |
| `src/components/PWAInstallBanner.tsx` | Pass isSafari, add toast on post-install |
| `src/lib/i18n/locales/id.ts` | Add new pwaInstall strings |
| `src/lib/i18n/locales/en.ts` | Add new pwaInstall strings |

### 8. Files to Create

| File | Purpose |
|------|---------|
| `public/screenshots/ios-install/step1-share.png` | Mockup Safari share button |
| `public/screenshots/ios-install/step2-add-to-home.png` | Mockup share sheet |
| `public/screenshots/ios-install/step3-home-screen.png` | Mockup home screen with icon |

---

## Manual Verification (Human Checklist)

- [ ] Buka app di Safari iOS — banner PWA muncul
- [ ] Tap "Install" di banner — modal muncul dengan 3 steps + screenshot mockup
- [ ] Verifikasi Safari reminder muncul di atas steps
- [ ] Step 1: Screenshot + teks "Tap Share button" + variant untuk titik tiga
- [ ] Step 2: Screenshot + teks "Add to Home Screen" + variant scroll hint
- [ ] Step 3: Screenshot + teks "Buka dari Home Screen"
- [ ] Tap "Got it" — modal close + toast konfirmasi muncul
- [ ] Buka di Chrome iOS — banner tetap muncul dengan Safari reminder
- [ ] Dismiss banner — refresh page banner tidak muncul
- [ ] Install app ke Home Screen, buka dari sana — banner tidak muncul
- [ ] Run `npx tsc --noEmit` di `cukkr-frontend/` — no type errors

---

## Decisions

| Item | Choice | Reason |
|------|--------|--------|
| Trigger timing | Banner (existing) | Konsisten, tidak mengganggu |
| Visual guidance | Screenshots asli (mockup dulu) | Paling jelas untuk user non-teknis |
| Multiple iOS flows | Single generic flow + variant notes | Cover semua versi tanpa kompleksitas berlebih |
| Non-Safari handling | Tetap tampilkan flow + Safari note | Tidak blocking, user bisa switch manual |
| Post-install info | Toast konfirmasi | Cukup, tidak over-engineering |
| Screenshot steps | 3 steps (Share → Add to Home → Done) | Cover end-to-end flow |
| Modal format | Single-screen enhanced | Tidak perlu swipe, langkah cukup 3 |

## Next Steps

- [x] **Buat mockup screenshots** — 3 gambar placeholder untuk step 1, 2, 3 di `public/screenshots/ios-install/`
- [x] **Update i18n strings** — id.ts dan en.ts dengan semua string baru
- [x] **Update usePWAInstall hook** — tambah isSafari, justInstalled
- [x] **Update IOSInstallModal** — rewrite dengan 3 steps + screenshots + Safari note
- [x] **Update PWAInstallBanner** — pass isSafari, trigger post-install toast
- [x] **Type check** — `npx tsc --noEmit` — no errors

**Tags:** `cukkr-frontend`
