# Cukkr Backlog Tasks

> Last updated: 2026-07-20

---

## TASK-013 · Identity Verification Two-Step Confirmation & Booking Email Detail

**Description:**
Saat ini halaman identity verification (`/{slug}/identity/verify?token=XYZ`) langsung otomatis memverifikasi identitas customer begitu halaman dibuka — `IdentityVerifyClient` langsung memanggil `verifyIdentity()` di dalam `useEffect`. Customer tidak punya kesempatan untuk mengonfirmasi bahwa itu memang dirinya. Perubahan yang diinginkan adalah two-step flow: halaman menampilkan nama customer (dari token) dan tombol "Ya, ini saya", lalu verifikasi hanya dilakukan setelah customer mengklik tombol tersebut. Untuk mendapatkan nama customer tanpa memverifikasi, perlu endpoint baru `GET /:slug/identity/check?token=...` di backend yang mengembalikan info customer berdasarkan token tanpa mengubah status verifikasi.

Selain itu, email `sendBookingAcceptedEmail` yang dikirim ke customer saat booking diterima saat ini hanya menampilkan `referenceNumber` tanpa detail booking lainnya (layanan, jadwal, barber, durasi). Perubahan juga diterapkan ke `sendBookingDeclinedEmail` agar kedua email menampilkan informasi booking yang lengkap: nama layanan, harga, durasi per layanan, total durasi, nama barber, dan jadwal (tanggal & jam).

**Implementation Plan:**
- [x] Di `cukkr-backend/src/modules/public-booking/service.ts`, tambahkan method `checkIdentityToken(token: string)` yang mencari customer berdasarkan `emailVerificationToken`, mengembalikan `{ valid: boolean, customerName: string | null }`. Tidak mengubah status verifikasi.
- [x] Di `cukkr-backend/src/modules/public-booking/handler.ts`, tambahkan endpoint `GET /:slug/identity/check` yang menerima query `token`, memanggil `checkIdentityToken`, dan mengembalikan response dengan model `t.Object({ valid: t.Boolean(), customerName: t.Nullable(t.String()) })`.
- [x] Di `cukkr-web/src/public-booking/actions/booking.actions.ts`, tambahkan `checkIdentity(slug, token)` server action yang memanggil `GET /api/public/booking/{slug}/identity/check?token={token}`.
- [x] Di `cukkr-web/app/[slug]/identity/verify/IdentityVerifyClient.tsx`, tambahkan state `confirm` sebagai initial state. Saat mount, panggil `checkIdentity(slug, token)` untuk mendapatkan `customerName`. Tampilkan halaman konfirmasi dengan nama customer dan tombol "Ya, ini saya" / "Yes, it's me" baru panggil `verifyIdentity()` saat tombol diklik. State flow: `confirm` → `loading` → `success`/`alreadyVerified`/`error`. Jika token invalid dari check, langsung tampilkan error.
- [x] Di `cukkr-web/src/lib/i18n/id.ts` bagian `booking.identity`, tambahkan key: `confirmTitle: 'Konfirmasi Identitas'`, `confirmHeading: 'Apakah ini kamu, {customerName}?'`, `confirmBody: 'Klik tombol di bawah untuk mengonfirmasi bahwa ini memang kamu.'`, `confirmCta: 'Ya, ini saya'`.
- [x] Di `cukkr-web/src/lib/i18n/en.ts` bagian `booking.identity`, tambahkan key: `confirmTitle: 'Confirm Identity'`, `confirmHeading: 'Is this you, {customerName}?'`, `confirmBody: 'Click the button below to confirm this is you.'`, `confirmCta: 'Yes, it\'s me'`.
- [x] Di `cukkr-backend/src/lib/mail.ts` function `sendBookingAcceptedEmail`, tambahkan parameter: `services: Array<{ name: string; price: number; duration: number }>`, `scheduledAt: string | null`, `barberName: string | null`, `totalDuration: number`. Render detail booking di HTML: nama layanan beserta harga dan durasi, nama barber, jadwal (tanggal + jam) di bawah reference number box. Gunakan `formatBookingDate` helper untuk memformat `scheduledAt` menjadi string tanggal & jam yang readable (gunakan `Intl.DateTimeFormat` sesuai `language`).
- [x] Di `cukkr-backend/src/lib/mail.ts` function `sendBookingDeclinedEmail`, tambahkan parameter yang sama seperti `sendBookingAcceptedEmail` dan render detail booking yang sama di HTML.
- [x] Di `cukkr-backend/src/modules/bookings/service.ts` method `acceptBooking` (sekitar baris 1040), update pemanggilan `sendBookingAcceptedEmail` dengan menambahkan: `services: result.services.map(s => ({ name: s.serviceName, price: s.price, duration: s.duration }))`, `scheduledAt: result.scheduledAt`, `barberName: result.requestedBarber?.name ?? null`, `totalDuration: result.totalDuration`.
- [x] Di `cukkr-backend/src/modules/bookings/service.ts` method `declineBooking`, lakukan hal yang sama untuk pemanggilan `sendBookingDeclinedEmail`.
- [x] Di `cukkr-backend/src/lib/i18n/locales/id.ts` bagian `email.bookingAccepted` dan `email.bookingDeclined`, tambahkan key: `servicesLabel: 'Layanan'`, `serviceLabel: 'Layanan'`, `priceLabel: 'Harga'`, `durationLabel: 'Durasi'`, `totalDurationLabel: 'Total Durasi'`, `minuteUnit: 'menit'`, `barberLabel: 'Barber'`, `scheduleLabel: 'Jadwal'`.
- [x] Di `cukkr-backend/src/lib/i18n/locales/en.ts` bagian `email.bookingAccepted` dan `email.bookingDeclined`, tambahkan key: `servicesLabel: 'Services'`, `serviceLabel: 'Service'`, `priceLabel: 'Price'`, `durationLabel: 'Duration'`, `totalDurationLabel: 'Total Duration'`, `minuteUnit: 'min'`, `barberLabel: 'Barber'`, `scheduleLabel: 'Schedule'`.
- [x] Jalankan `bun run lint:fix && bun run format` di `cukkr-backend/`.
- [x] Jalankan `bun test --env-file=.env` di `cukkr-backend/` untuk memastikan tidak ada regresi test.

**Manual Verification (Human Checklist):**
- [ ] **Two-step identity verify:** Kirim test booking untuk customer dengan email belum verified (via staff booking). Buka link identity verification dari email. Halaman menampilkan nama customer dan tombol "Ya, ini saya" — belum terjadi verifikasi otomatis. Klik "Ya, ini saya" → muncul spinner → kemudian tampil halaman sukses dengan centang hijau.
- [ ] **Two-step identity verify — invalid token:** Buka `/{slug}/identity/verify?token=invalid123`. Halaman langsung menampilkan error "Invalid verification token" tanpa perlu klik apa pun.
- [ ] **Two-step identity verify — already verified:** Gunakan token customer yang sudah verified. Halaman menampilkan nama dan tombol. Klik "Ya, ini saya" → tampil info "Identity was already verified".
- [ ] **Booking accepted email detail:** Sebagai staff, accept sebuah booking appointment. Buka email yang diterima customer — pastikan email menampilkan: reference number, nama layanan beserta harga & durasi, total durasi, nama barber (jika ada), dan jadwal (tanggal + jam).
- [ ] **Booking declined email detail:** Sebagai staff, decline sebuah booking appointment. Buka email yang diterima customer — pastikan email menampilkan detail booking yang sama seperti email accepted, plus alasan penolakan jika diisi.
- [ ] **Booking accepted email — walk-in (tanpa jadwal & barber):** Accept walk-in booking yang tidak punya `scheduledAt` dan `requestedBarber`. Email tetap terkirim tanpa error, menampilkan layanan dan durasi tapi tanpa section jadwal dan barber.

**Tags:** `cukkr-backend`, `cukkr-web`
