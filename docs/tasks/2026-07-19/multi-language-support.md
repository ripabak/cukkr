# Cukkr Backlog Tasks

> Last updated: 2026-07-19

---

## TASK-001 · Multi-Language Support (id / en)

**Description:**
Cukkr saat ini seluruh UI, email, dan notifikasi ditulis hardcode dalam bahasa Inggris. Karena target pasar utama adalah Indonesia, perlu ditambahkan dukungan dua bahasa: Indonesia (`id`) sebagai default dan Inggris (`en`) sebagai alternatif. Bahasa pengguna disimpan sebagai field `language` pada tabel `user` via Better Auth `additionalFields`. Pengguna dapat mengganti bahasa melalui `authClient.updateUser()` langsung dari frontend tanpa perlu endpoint Elysia baru. Backend akan menerjemahkan email dan push notification berdasarkan `user.language`. Frontend akan menerjemahkan seluruh UI — screen, label, placeholder, toast message — dengan utility function + React Context sederhana, tanpa library i18n tambahan. Beberapa istilah yang lebih cocok dalam bahasa Inggris (misal istilah teknis barbershop) boleh dipertahankan dalam bahasa Inggris. Copywriting harus rapi, konsisten, dan mudah dipahami barber/pemilik barbershop.

**Implementation Plan:**

### Backend — Schema & Database
- [x] Di `cukkr-backend/src/modules/auth/schema.ts`, tambahkan kolom `language` ke tabel `user` (setelah `bio` di line 18):
  ```ts
  language: text('language').default('id'),
  ```
- [x] Di `cukkr-backend/src/lib/auth.ts`, tambahkan field `language` ke `user.additionalFields` di samping `phone` dan `bio`:
  ```ts
  language: { type: 'string', required: false, defaultValue: 'id' }
  ```
- [x] Jalankan `bunx drizzle-kit generate --name add-user-language` dari `cukkr-backend/` untuk generate migration.
- [ ] ~~Jalankan `bunx drizzle-kit migrate` untuk apply migration ke database.~~ *(skipped: database not running locally, run manually)*

### Backend — i18n Utility Module
- [x] Buat direktori `cukkr-backend/src/lib/i18n/`.
- [x] Buat `cukkr-backend/src/lib/i18n/locales/id.ts` — semua string bahasa Indonesia untuk email dan notifikasi (OTP, invitation, appointment verification, identity verification, booking accepted/declined/expired, notifikasi booking baru, notifikasi walk-in). Gunakan fungsi factory yang menerima params (nama customer, nama barbershop, dsb) dan return string.
- [x] Buat `cukkr-backend/src/lib/i18n/locales/en.ts` — versi bahasa Inggris dari semua string di atas.
- [x] Buat `cukkr-backend/src/lib/i18n/index.ts` — export fungsi `t(language: 'id' | 'en', key: string, params?: Record<string, string>): string` yang melakukan lookup ke locale yang sesuai, fallback ke `id` jika key tidak ditemukan atau language tidak dikenal.
- [x] Export tipe `Language = 'id' | 'en'` dari modul i18n.

### Backend — Refactor Email Templates
- [x] Di `cukkr-backend/src/lib/mail.ts`, refactor `sendOtpEmail`: tambahkan parameter `language?: Language`, gunakan `t(language, ...)` untuk subject dan body text.
- [x] Di `cukkr-backend/src/lib/mail.ts`, refactor `sendOrganizationInvitation`: tambahkan parameter `language?: Language`, gunakan `t()` untuk subject, title, body HTML, dan text.
- [x] Di `cukkr-backend/src/lib/mail.ts`, refactor `sendAppointmentVerificationEmail`: tambahkan parameter `language?: Language`, gunakan `t()`.
- [x] Di `cukkr-backend/src/lib/mail.ts`, refactor `sendIdentityVerificationEmail`: tambahkan parameter `language?: Language`, gunakan `t()`.
- [x] Di `cukkr-backend/src/lib/mail.ts`, refactor `sendBookingAcceptedEmail`: tambahkan parameter `language?: Language`, gunakan `t()`.
- [x] Di `cukkr-backend/src/lib/mail.ts`, refactor `sendBookingDeclinedEmail`: tambahkan parameter `language?: Language`, gunakan `t()`.
- [x] Di `cukkr-backend/src/lib/mail.ts`, refactor `sendBookingExpiredEmail`: tambahkan parameter `language?: Language`, gunakan `t()`.
- [x] Update semua caller fungsi email di `cukkr-backend/src/lib/auth.ts` (OTP, invitation, change email confirmation) dan `cukkr-backend/src/modules/bookings/service.ts` (accept/decline/expired, verification) untuk meneruskan `language` yang didapat dari query `user.language`.

### Backend — Refactor Notification Strings
- [x] Di `cukkr-backend/src/modules/notifications/service.ts`, method `createBookingNotifications` (~line 897-901): ganti string hardcode title/body dengan `t(language, ...)`. Ambil `language` dari user recipient (query `user.language` untuk setiap `recipientUserId`). Jika user tidak ditemukan, fallback ke `'id'`.
- [x] Di `cukkr-backend/src/lib/auth.ts`, invitation notification creation (~line 100-110): ganti string hardcode title/body menjadi `t(language, ...)`. Ambil `language` dari `inviteeUser.language`.
- [x] Di `cukkr-backend/src/modules/notifications/service.ts`, `createNotificationsForRecipients` dan `dispatchPushNotifications`: pastikan title/body yang diterima sudah dalam bahasa yang sesuai (seharusnya sudah handled oleh caller yang sudah memakai `t()`).

### Backend — Tests
- [x] Buat atau update test di `cukkr-backend/tests/modules/auth.test.ts` — verifikasi field `language` tersedia di session user, default value `'id'`.
- [x] Buat test `cukkr-backend/tests/lib/i18n.test.ts` — verifikasi `t()` return string yang benar untuk kedua bahasa, test fallback, test missing key.
- [ ] ~~Update test di `cukkr-backend/tests/modules/bookings.test.ts` — verifikasi email dipanggil dengan parameter language yang sesuai (mock `sendEmail` dan assert subject/body mengandung teks berbahasa Indonesia saat `user.language = 'id'`).~~ *(skipped: existing tests don't mock email, would require major test refactor)*

### Backend — Lint & Format
- [x] Jalankan `bun run lint:fix` dari `cukkr-backend/`.
- [x] Jalankan `bun run format` dari `cukkr-backend/`.

### Frontend — Infer Additional Fields
- [x] Di `cukkr-frontend/src/lib/auth-client.ts`, import `inferAdditionalFields` dari `better-auth/client/plugins` dan `type { auth }` dari backend (atau definisikan tipe `user.language` secara manual). Tambahkan plugin `inferAdditionalFields` agar `authClient.useSession().user.language` ter-infer dengan benar.
- [x] Jika backend di MonoRepo tidak bisa di-import langsung, definisikan manual di `authClient`:
  ```ts
  import { inferAdditionalFields } from "better-auth/client/plugins";
  // tambahkan ke plugins array:
  inferAdditionalFields({
    user: { language: { type: "string" } }
  })
  ```

### Frontend — i18n Core Module
- [x] Buat direktori `cukkr-frontend/src/lib/i18n/`.
- [x] Buat `cukkr-frontend/src/lib/i18n/locales/id.ts` — berisi satu object `id` dengan key terstruktur (berdasarkan screen/feature) dan value string bahasa Indonesia. Contoh struktur:
  ```ts
  export const id = {
    common: { save: 'Simpan', cancel: 'Batal', delete: 'Hapus', ... },
    auth: { login: 'Masuk', register: 'Daftar', ... },
    home: { greeting: 'Halo, {name}', ... },
    schedule: { title: 'Jadwal', ... },
    ...
  }
  ```
- [x] Buat `cukkr-frontend/src/lib/i18n/locales/en.ts` — versi bahasa Inggris.
- [x] Buat `cukkr-frontend/src/lib/i18n/index.ts` — export tipe `Language = 'id' | 'en'`, tipe `LocaleKeys` (recursive key path types), object `SUPPORTED_LANGUAGES`, dan fungsi utilitas `resolveKey(obj, path)`.
- [x] Buat `cukkr-frontend/src/lib/i18n/provider.tsx` — `I18nProvider` berbasis React Context:
  - Terima `language` dari `authClient.useSession()?.user?.language` (default `'id'`).
  - Sediakan fungsi `t(key, params?)` via context.
  - `t()` melakukan deep lookup ke locale object berdasarkan dot-notated key (`'auth.login'`), interpolasi `{param}` dalam string, fallback ke `'id'` jika key tidak ditemukan.
- [x] Buat hook `useI18n()` di `cukkr-frontend/src/lib/i18n/hooks.ts` — return `{ t, language, setLanguage }`.
- [x] Buat service `cukkr-frontend/src/services/language.service.ts` — export fungsi `updateLanguage(language: Language)` yang memanggil `authClient.updateUser({ language })`. Throw error jika gagal.

### Frontend — Language Switcher UI
- [x] Buat komponen `LanguageSwitcher` di `cukkr-frontend/src/components/LanguageSwitcher.tsx` — tampilkan dua opsi bendera/teks (Indonesia, English), panggil `languageService.updateLanguage()` saat dipilih, tampilkan loading state, toast success/error.
- [x] Integrasikan `LanguageSwitcher` ke Settings screen (`cukkr-frontend/src/features/workspace/` atau screen settings yang relevan).

### Frontend — Wrap App dengan I18nProvider
- [x] Di `cukkr-frontend/app/_layout.tsx`, bungkus seluruh app tree dengan `<I18nProvider>`.
- [x] Ambil `language` dari `authClient.useSession()`, teruskan ke provider.

### Frontend — Translate Semua Screen
Lakukan translate di semua screen dan komponen. Petakan semua string UI ke locale files. Berikut daftar screen/feature yang perlu di-translate:

- [x] **Auth screens** (`cukkr-frontend/src/features/auth/`): login, register, forgot-password, create-password, verify-otp, verify-account. Semua label field, button text, error message toast, header, hint text, link text.
- [x] **Home / Dashboard** (`cukkr-frontend/src/features/workspace/`): greeting dengan nama user, quick action labels, stat label, booking list labels.
- [x] **Schedule** (`cukkr-frontend/src/features/schedule/`): header, date labels, booking status labels (`waiting`, `in_progress`, `completed`, `cancelled`, `requested`), empty state messages, filter labels, barber name labels.
- [x] **Bookings detail** (`cukkr-frontend/src/features/schedule/`): status label, action button text (Accept, Decline, Start, Complete, Cancel, Reassign), customer info labels, service info labels, empty state, confirmation modal text.
- [x] **Customers** (`cukkr-frontend/src/features/barbershop/`): list title, search placeholder, customer detail labels (name, phone, email, notes), booking history labels, empty state.
- [x] **Services** (`cukkr-frontend/src/features/barbershop/`): management screen title, service card placeholder (name, price, duration), add/edit form labels, active/inactive toggle label, image upload label, default service label, delete confirmation.
- [x] **Barbershop settings** (`cukkr-frontend/src/features/barbershop/`): settings form labels (name, address, phone, timezone, slug), open hours labels (day names, open/close, add hours), logo upload, delete barbershop confirmation.
- [x] **Notifications** (`cukkr-frontend/src/features/notifications/`): screen title, empty state, notification type labels (appointment request, walk-in, invitation), action text (accepted, declined), relative time labels (just now, minutes ago, hours ago, days ago sudah disediakan `formatRelativeTime` dari `src/utils/date.ts`).
- [x] **Create barbershop flow** (`cukkr-frontend/src/features/workspace/`): semua step label, form field label, button text, success message.
- [x] **Shared components**: `ConfirmationModal`, `EmptyState`, `ErrorState`, `LoadingState`, `Permission` fallback text, `IconActionButton` accessibility labels.
- [x] **Tab bar labels** (`cukkr-frontend/app/_layout.tsx`): Home, Schedule, Analytics, Settings.
- [x] **Toast messages** di semua operasi CRUD: "Berhasil disimpan", "Berhasil dihapus", "Gagal memuat data", dsb.
- [x] **Analytics screens** (5 screens)
- [x] **Onboarding screens** (3 screens with strings)
- [x] **Profile screens** (EditUserProfileFieldsScreen)
- [x] **WalkInQr screen**

### Frontend — Copywriting Guidelines (ID)

> **Prinsip utama: terjemahkan rasa, bukan kata.** Literal translation sering menghasilkan teks yang kaku, aneh, dan sulit dipahami. Tulis ulang dengan emosi dan konteks yang sesuai — seolah-olah naskah aslinya memang ditulis dalam bahasa Indonesia.

#### Pola Umum

| Konteks | Hindari (literal/kaku) | Gunakan (natural/beremosi) |
|---|---|---|
| **Sapaan** | "Selamat datang kembali" | "Halo lagi, Budi" |
| **Empty state** | "Tidak ada data" | "Belum ada booking nih" |
| **Error** | "Terjadi kesalahan" | "Wah, ada yang error. Coba lagi ya." |
| **Sukses** | "Data berhasil disimpan" | "Sudah tersimpan!" |
| **Konfirmasi hapus** | "Apakah anda yakin ingin menghapus?" | "Yakin hapus layanan ini? Nanti gabisa dikembalikan lho." |
| **Loading** | "Memuat..." | "Sebentar ya..." |
| **Warning/hati-hati** | "Perhatian: tindakan ini tidak dapat dibatalkan" | "Hati-hati — setelah ini gabisa diulang lagi." |

#### Contoh Per-Konteks

**Login Screen:**
| English (source) | ID Jelek (literal) | ID Bagus |
|---|---|---|
| "Sign in to your account" | "Masuk ke akun anda" | "Masuk dulu, yuk" |
| "Forgot password?" | "Lupa kata sandi?" | "Lupa password?" |
| "Invalid email or password" | "Email atau kata sandi tidak valid" | "Email atau passwordnya salah nih" |

**Schedule / Booking:**
| English (source) | ID Jelek (literal) | ID Bagus |
|---|---|---|
| "No bookings for today" | "Tidak ada pemesanan untuk hari ini" | "Hari ini lagi sepi, belum ada booking" |
| "Booking accepted" | "Pemesanan diterima" | "Booking diterima!" |
| "Booking declined" | "Pemesanan ditolak" | "Booking ditolak" |
| "Start service" | "Mulai layanan" | "Mulai potong" (konteks: barber mulai layanan) |
| "Complete" | "Selesai" | "Selesai" (sudah bagus) |

**Error Messages:**
| English (source) | ID Jelek (literal) | ID Bagus |
|---|---|---|
| "Network error. Please check your connection." | "Kesalahan jaringan. Mohon periksa koneksi anda." | "Kayaknya internetnya bermasalah. Coba cek koneksi kamu." |
| "You don't have permission to do this" | "Anda tidak memiliki izin" | "Kamu gabisa akses ini. Cuma owner/admin yang bisa." |
| "Something went wrong" | "Terjadi sesuatu yang salah" | "Waduh, ada yang error. Coba lagi ya." |

**Notifications (Push / In-App):**
| English (source) | ID Jelek (literal) | ID Bagus |
|---|---|---|
| "Budi requested an appointment." | "Budi meminta janji temu." | "Budi minta booking nih. Cek yuk!" |
| "Siti has arrived as a walk-in customer." | "Siti telah tiba sebagai pelanggan walk-in." | "Siti udah datang (walk-in). Siap-siap ya." |
| "Andi invited you to join Barbershop XYZ" | "Andi mengundang anda bergabung" | "Andi ngajakin kamu gabung ke Barbershop XYZ" |

#### Aturan Tambahan

- [ ] **Sapaan**: gunakan "kamu" (bukan "Anda") untuk user — lebih akrab, cocok dengan tone casual barbershop.
- [ ] **Kalimat pendek**: maksimal 10-12 kata. Kalau terlalu panjang, pecah jadi dua kalimat atau pendekin.
- [ ] **Partikel santai**: `nih`, `ya`, `lho`, `dong`, `deh`, `kok`, `sih` boleh dipakai secukupnya untuk memberi rasa — tapi jangan berlebihan sampai terkesan lebay.
- [ ] **Kata seru**: `Wah`, `Waduh`, `Nah`, `Hmm` boleh dipakai untuk pembuka error/empty state.
- [ ] **Istilah teknis tetap Inggris**: `booking`, `walk-in`, `schedule`, `timezone`, `slug`, `OTP`, `PIN` — karena lebih familiar daripada terjemahan Indonesianya.
- [ ] **Angka & mata uang**: format Indonesia — Rp50.000 (bukan IDR 50,000), 09:30 (bukan 9:30 AM).
- [ ] **Nama hari**: pakai Indonesia — Senin, Selasa, ... , Minggu.
- [ ] **Review semua string di locale file** setelah translate: baca dengan suara keras — kalau terdengar aneh atau kaku, tulis ulang.

### Sync Types
- [ ] ~~Jalankan backend dev server: `bun run dev` dari `cukkr-backend/`.~~ *(skipped: need running DB)*
- [ ] ~~Jalankan type sync dari `cukkr-frontend/`: `bunx type-share-eden-elysia sync http://localhost:3000/types/app.d.ts`.~~ *(skipped: need running backend)*

### Frontend — Lint & Type Check
- [x] Jalankan `npx tsc --noEmit` dari `cukkr-frontend/` dan perbaiki type errors.
- [ ] ~~Jalankan `npx expo start` lalu Ctrl+C untuk generate Expo routing types (jika muncul error type routing).~~ *(skipped: no type routing errors)*
- [ ] ~~Jalankan linter frontend (jika ada — cek `package.json`).~~ *(skipped: no lint script in frontend)*

**Manual Verification (Human Checklist):**
- [ ] Di aplikasi, login sebagai user baru. Buka Settings dan verifikasi `LanguageSwitcher` menampilkan "Indonesia" sebagai default (selected).
- [ ] Switch ke English. Verifikasi seluruh UI berubah ke bahasa Inggris — mulai dari tab bar, home screen greeting, schedule labels, dsb.
- [ ] Tutup dan buka kembali aplikasi. Verifikasi bahasa tetap English (persisted di user record).
- [ ] Switch kembali ke Indonesia. Verifikasi semua kembali ke bahasa Indonesia.
- [ ] Kirim OTP saat login. Verifikasi email OTP diterima dalam bahasa Indonesia (default) — subject dan body menggunakan teks bahasa Indonesia.
- [ ] Lakukan booking walk-in. Verifikasi push notification yang diterima member barbershop lain menggunakan bahasa yang sesuai dengan `user.language` masing-masing recipient.
- [ ] Accept/decline booking. Verifikasi email konfirmasi ke customer menggunakan bahasa Indonesia (default `'id'` untuk non-user).
- [ ] Invite member baru ke barbershop. Verifikasi email undangan ke non-user menggunakan bahasa Indonesia. Jika invitee sudah punya akun dan languagenya `'en'`, verifikasi email dalam bahasa Inggris.
- [ ] Verifikasi tidak ada teks hardcode yang tertinggal dalam bahasa Inggris di UI (cek login screen, home, schedule, services, settings).
- [ ] Verifikasi tidak ada error/console.error saat switch bahasa.
- [ ] Verifikasi copywriting Indonesia mudah dibaca dan dipahami, tidak ada kalimat aneh atau terlalu kaku.

**Tags:** `cukkr-backend`, `cukkr-frontend`
