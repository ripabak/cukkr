# Cukkr — QA End-to-End Test Scenarios

Aplikasi ini punya 4 jenis user: **Owner/Admin**, **Member** (barber), dan **Customer** (public). Testing mencakup app staff (Expo) dan public booking page (Next.js).

> **Cara baca:** Setiap grup adalah satu alur end-to-end. Error case didahulukan, baru happy path. Pastikan semua side effect (email, notif, push, SSE, UI) terjadi bersamaan.

---

## 1. Registrasi & Onboarding Owner

| # | Langkah | Cek |
|---|---------|-----|
| 1 | Register dengan format email tidak valid → error | [ ] |
| 2 | Register dengan password < 8 karakter → error | [ ] |
| 3 | Register dengan email valid, submit → cek email OTP verifikasi masuk | [ ] |
| 4 | Masukkan OTP salah → error, bisa retry | [ ] |
| 5 | OTP expired → request ulang, email OTP baru masuk | [ ] |
| 6 | Masukkan OTP benar → akun aktif | [ ] |
| 7 | Login dengan password salah → error, tidak bisa masuk | [ ] |
| 8 | Login dengan akun yang sudah diverifikasi → masuk onboarding | [ ] |
| 9 | Onboarding splash screen muncul → bisa skip | [ ] |
| 10 | Forgot password → email reset masuk → reset berhasil → login pakai password baru | [ ] |
| 11 | Wizard buat barbershop: isi nama & slug → cek real-time availability | [ ] |
| 12 | Wizard: upload logo, tambah service pertama (nama, harga, durasi) | [ ] |
| 13 | Wizard: invite barber via email → cek email undangan masuk ke penerima | [ ] |
| 14 | Wizard: atur jam operasional per hari → next | [ ] |
| 15 | Wizard selesai → masuk dashboard | [ ] |
| 16 | Keluar di tengah wizard → login lagi → wizard lanjut dari step terakhir (data tersimpan) | [ ] |

---

## 2. Staff Membuat Walk-In Booking

| # | Langkah | Cek |
|---|---------|-----|
| 1 | Field nama kosong, submit → toast error "Please enter name" | [ ] |
| 2 | Service belum dipilih, submit → toast error "Please select service" | [ ] |
| 3 | Jika customer email diisi & belum verified: setelah submit → cek email **identity verification** masuk ke customer | [ ] |
| 4 | Jika customer email tidak diisi: tidak ada email terkirim | [ ] |
| 5 | Isi nama, pilih service, pilih barber → submit → toast "Create Success" | [ ] |
| 6 | Booking muncul di Schedule status **Waiting** | [ ] |
| 7 | Dashboard: summary card "Walk-In" bertambah 1 | [ ] |
| 8 | Notifikasi: semua org member dapat `walk_in_arrival` (in-app + push) | [ ] |
| 9 | SSE: buka device lain → booking muncul otomatis tanpa refresh | [ ] |

---

## 3. Staff Membuat Appointment Booking

| # | Langkah | Cek |
|---|---------|-----|
| 1 | Tanggal & jam belum dipilih, submit → toast error "Please select date time" | [ ] |
| 2 | Field nama kosong, submit → toast error "Please enter name" | [ ] |
| 3 | Service belum dipilih, submit → toast error "Please select service" | [ ] |
| 4 | Jam di luar operasional → tidak muncul di grid / tidak bisa dipilih | [ ] |
| 5 | Jam yang sudah lewat (hari ini) → tidak muncul di grid | [ ] |
| 6 | Isi nama, email, service, barber, tanggal & jam (valid) → submit → toast "Create Success" | [ ] |
| 7 | Booking muncul di Schedule status **Waiting** (langsung waiting, bukan requested) | [ ] |
| 8 | Dashboard: summary card "Appointment" bertambah 1 | [ ] |
| 9 | Jika customer email belum verified: cek email **identity verification** masuk | [ ] |
| 10 | Notifikasi: semua org member dapat `appointment_requested` (in-app + push) | [ ] |
| 11 | SSE: device lain langsung muncul | [ ] |

---

## 4. Customer Walk-In via Public Page

| # | Langkah | Cek |
|---|---------|-----|
| 1 | Buka `/<slug>/booking` → pilih "Walk-In" | [ ] |
| 2 | Masukkan PIN salah → error merah "Invalid PIN" | [ ] |
| 3 | Masukkan PIN yang sudah di-regenerate staff → invalid (tidak bisa dipakai) | [ ] |
| 4 | Field nama kosong, lanjut → tidak bisa (wajib) | [ ] |
| 5 | Service tidak dipilih, lanjut → tidak bisa (wajib) | [ ] |
| 6 | Masukkan PIN benar → lanjut ke step service | [ ] |
| 7 | Pilih service (min 1), barber (opsional) → "Continue" | [ ] |
| 8 | Isi nama (wajib), email (opsional) → "Continue" | [ ] |
| 9 | Review recap → "Confirm Walk-In" → loading "Checking In..." → success page (centang hijau) | [ ] |
| 10 | Booking muncul di Schedule staff status **Waiting** | [ ] |
| 11 | Notifikasi staff: semua member dapat `walk_in_arrival` (in-app + push) | [ ] |
| 12 | Jika email diisi & belum verified: cek email **identity verification** masuk ke customer | [ ] |
| 13 | Jika email tidak diisi: tidak ada email | [ ] |
| 14 | SSE: muncul di device staff lain tanpa refresh | [ ] |

---

## 5. Customer Appointment via Public Page

| # | Langkah | Cek |
|---|---------|-----|
| 1 | Buka `/<slug>/booking` → pilih "Appointment" | [ ] |
| 2 | Email tidak diisi → tidak bisa lanjut (wajib untuk appointment) | [ ] |
| 3 | Service tidak dipilih → tidak bisa lanjut | [ ] |
| 4 | Pilih tanggal → jika barbershop tutup → kotak merah "Closed" muncul, tidak bisa pilih jam | [ ] |
| 5 | Jam di luar operasional → tidak bisa dipilih | [ ] |
| 6 | Token verifikasi expired → halaman verify tampil silang merah "Invalid Link" | [ ] |
| 7 | Klik link verifikasi dua kali → halaman "Already Verified" (ikon info biru) | [ ] |
| 8 | Pilih service, barber (opsional), tanggal & jam valid → "Continue" | [ ] |
| 9 | Isi nama & email → "Continue" | [ ] |
| 10 | Review recap → "Confirm Appointment" → loading "Submitting..." → success page (centang hijau) | [ ] |
| 11 | **Cek email customer:** email **Appointment Verification** masuk → klik link-nya | [ ] |
| 12 | Link verifikasi → loading "Verifying..." → success (centang hijau) | [ ] |
| 13 | **Setelah verify:** booking muncul di Schedule staff status **Requested** | [ ] |
| 14 | Notifikasi staff: semua member dapat `appointment_requested` dengan tombol Accept/Decline (in-app + push) | [ ] |
| 15 | SSE: device staff lain langsung muncul | [ ] |

---

## 6. Staff Accept Appointment

| # | Langkah | Cek |
|---|---------|-----|
| 1 | Di Schedule, buka booking status **Requested** | [ ] |
| 2 | Tekan "Accept" → modal konfirmasi → "Confirm Accept" | [ ] |
| 3 | Toast "Booking Accepted" → status berubah ke **Waiting** | [ ] |
| 4 | **Cek email customer:** email **Booking Accepted** masuk (dengan reference number) | [ ] |
| 5 | Notifikasi: notif `appointment_requested` sekarang status "Accepted" | [ ] |
| 6 | Accept via Notifications tab: tekan "Accept" di notif appointment → booking detail → same flow | [ ] |

---

## 7. Staff Decline Appointment

| # | Langkah | Cek |
|---|---------|-----|
| 1 | Di Schedule, buka booking status **Requested** | [ ] |
| 2 | Tekan "Decline" → modal input alasan | [ ] |
| 3 | Isi alasan → "Send" → toast "Booking Declined" → status **Cancelled**, notes=alasan | [ ] |
| 4 | **Cek email customer:** email **Booking Declined** masuk (dengan reference number & alasan) | [ ] |
| 5 | Decline tanpa isi alasan → tetap bisa, email tetap terkirim (tanpa alasan) | [ ] |
| 6 | Notifikasi: notif `appointment_requested` sekarang status "Declined" | [ ] |
| 7 | Decline via Notifications tab: tekan "Decline" di notif appointment → booking detail → same flow | [ ] |

---

## 8. Staff Start & Complete Booking

| # | Langkah | Cek |
|---|---------|-----|
| 1 | Barber A start booking, masih in-progress → barber B coba start booking kedua → error 409 Conflict | [ ] |
| 2 | Member (barber) coba complete booking yang bukan dia yang handle → error Forbidden | [ ] |
| 3 | Buka booking **Waiting** → tekan "Handle This" / "Take Over" → modal → "Confirm" | [ ] |
| 4 | Toast "Booking Started" → status **In Progress**, kolom "Handled by" muncul | [ ] |
| 5 | Swipe/complete → modal swipe → toast "Booking Completed" → status **Completed** | [ ] |
| 6 | Owner/Admin complete booking siapa pun via overflow "Mark as Completed" | [ ] |
| 7 | SSE: status berubah di device lain tanpa refresh | [ ] |

---

## 9. Staff Cancel Booking

| # | Langkah | Cek |
|---|---------|-----|
| 1 | Buka booking **Completed** → overflow menu tidak muncul (tidak bisa cancel) | [ ] |
| 2 | Buka booking **Waiting** / **In Progress** → overflow → "Cancel" → modal → "Confirm" | [ ] |
| 3 | Toast "Booking Cancelled" → status **Cancelled**, `cancelledAt` terisi | [ ] |
| 4 | SSE: status berubah di device lain | [ ] |

---

## 10. Booking Auto-Cancel (Cron — Stale Appointment)

| # | Langkah | Cek |
|---|---------|-----|
| 1 | Buat appointment `scheduledAt` < 1 jam lalu → jangan action → tunggu cron (max 5 menit) | [ ] |
| 2 | Status jadi **Cancelled**, notes: "Booking expired — appointment time has passed without action" | [ ] |
| 3 | **Cek email customer:** email **Booking Expired** masuk (dengan reference number) | [ ] |
| 4 | SSE: perubahan muncul di device lain | [ ] |

---

## 11. Invite Barber

| # | Langkah | Cek |
|---|---------|-----|
| 1 | Invite dengan email yang sudah jadi member barbershop ini → error | [ ] |
| 2 | Di Barbers Management → invite barber via email → submit | [ ] |
| 3 | **Cek email penerima:** email undangan masuk dengan link accept | [ ] |
| 4 | Penerima klik link → set password → login → masuk barbershop | [ ] |

---

## 12. Notifikasi (End-to-End)

| # | Langkah | Cek |
|---|---------|-----|
| 1 | Tab Notifications: semua notif tampil, unread ada badge di bell icon home | [ ] |
| 2 | Notif appointment: tombol Accept/Decline inline → berfungsi | [ ] |
| 3 | Notif invitation: tap card → modal Accept/Decline → berfungsi | [ ] |
| 4 | Notif booking: tap card → navigasi ke booking detail | [ ] |
| 5 | Mark all read (otomatis saat buka tab) → badge hilang | [ ] |
| 6 | Push notification (Expo) muncul saat app di background | [ ] |
| 7 | Web push notification muncul di browser (PWA) | [ ] |

---

## 13. Analytics (Owner/Admin Only)

| # | Langkah | Cek |
|---|---------|-----|
| 1 | Login sebagai member → tab Stats **tidak muncul** di bottom nav | [ ] |
| 2 | Tab Stats: overview stat cards (total sales, total customers, walk-ins, appointments) — 4 cards | [ ] |
| 3 | Period-over-period change tampil, angkanya masuk akal (bukan NaN/minus aneh) | [ ] |
| 4 | Chart revenue & customers tampil (bar chart) | [ ] |
| 5 | Top barber & top service highlight tampil | [ ] |
| 6 | Ganti range (24h → week → month → 6m → 1y) → data berubah | [ ] |
| 7 | Revenue tab: breakdown & booking list tampil | [ ] |
| 8 | Customers tab: stats & list tampil | [ ] |
| 9 | Services tab: performance stats & list tampil | [ ] |
| 10 | Barbers tab: performance stats & chart tampil | [ ] |

---

## 14. Manajemen Services & Open Hours

| # | Langkah | Cek |
|---|---------|-----|
| 1 | Login sebagai member → tidak bisa CRUD service, tidak bisa edit open hours | [ ] |
| 2 | Hapus service yang sudah pernah dipakai booking → error (tidak bisa) | [ ] |
| 3 | Jam tutup < jam buka → error validasi | [ ] |
| 4 | CRUD service (buat, edit, hapus) → berfungsi | [ ] |
| 5 | Toggle active/inactive → service inactive tidak muncul di booking | [ ] |
| 6 | Set default → service auto-select saat buat booking | [ ] |
| 7 | Edit open hours per hari → berfungsi | [ ] |
| 8 | Toggle hari libur → public page muncul "Closed" | [ ] |

---

## 15. Customer Management

| # | Langkah | Cek |
|---|---------|-----|
| 1 | Search customer by nama/email/phone → hasil sesuai | [ ] |
| 2 | Tap customer → detail tampil (info, statistik total spend/bookings/walk-in/appointment, riwayat booking) | [ ] |
| 3 | Chart bulanan booking tampil | [ ] |
| 4 | Tap customer name dari booking detail → navigasi ke customer detail | [ ] |

---

## 16. Barbershop Settings & Profile

| # | Langkah | Cek |
|---|---------|-----|
| 1 | Admin: upload service image, hapus barbershop → tidak bisa | [ ] |
| 2 | Session expired → redirect login, bukan crash | [ ] |
| 3 | Edit nama, deskripsi, alamat barbershop → tersimpan | [ ] |
| 4 | Edit slug → cek ketersediaan real-time → public page via slug baru | [ ] |
| 5 | Edit profil user: nama, bio → tersimpan | [ ] |
| 6 | Ganti password → berfungsi | [ ] |
| 7 | Switch organisasi → data berubah sesuai | [ ] |
| 8 | Logout → redirect login, session terhapus | [ ] |

---

## 17. Non-Functional

| # | Langkah | Cek |
|---|---------|-----|
| 1 | Form validasi: field wajib kosong, format email/phone salah → error jelas | [ ] |
| 2 | Koneksi internet mati → error state + tombol retry, bukan blank screen | [ ] |
| 3 | Rate limit: spam slug check / PIN validation → error 429 | [ ] |
| 4 | Setiap aksi async ada loading (spinner/skeleton) | [ ] |
| 5 | Empty state: saat tidak ada data tampil pesan informatif, bukan layar kosong | [ ] |
| 6 | i18n: ganti bahasa (ID ↔ EN) → app & public page berubah | [ ] |
| 7 | Public page responsive: desktop, tablet, mobile | [ ] |
