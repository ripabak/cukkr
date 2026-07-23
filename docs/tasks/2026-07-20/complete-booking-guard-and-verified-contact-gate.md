# Cukkr Backlog Tasks

> Last updated: 2026-07-20

---

## TASK-012 · Authorization Fixes: Complete Booking Guard & Verified Contact Message Gate

**Description:**
Saat ini ada dua celah authorization di `cukkr-frontend` dan `cukkr-backend`. Pertama, proses complete booking (`in_progress → completed`) bisa dilakukan oleh barber mana pun — tidak dibatasi hanya pada barber yang tercatat di `handledByBarber`. Backend endpoint `PATCH /api/bookings/:id/status` hanya menggunakan `requireAuth` + `requireOrganization` tanpa membandingkan `userId` pemanggil dengan `handledByBarberId`. Frontend di `BookingDetailScreen` juga tidak mengecek apakah current user adalah handling barber sebelum menampilkan tombol Complete. Selain itu, owner/admin seharusnya tetap bisa complete booking siapa pun, tetapi melalui overflow menu "Mark as Completed" (bukan tombol CTA hijau di bawah), agar alur UI untuk barber dan owner/admin terpisah. Kedua, tombol kirim pesan di `CustomerDetailScreen` dan bulk send di `CustomerManagementScreen` saat ini selalu enabled meskipun kontak customer belum terverifikasi (`emailVerified` maupun `phoneVerified` sama-sama `false`). Fitur send message sendiri masih stub (menampilkan toast "coming soon"), sehingga perbaikan fokus pada UI gate — tombol dikunci sampai customer memiliki setidaknya satu kontak terverifikasi.

**Implementation Plan:**
- [x] Di `cukkr-backend/src/modules/bookings/service.ts` method `updateBookingStatus`, tambahkan blok `if (input.status === 'completed')` setelah `validateStatusTransition` (sekitar baris 907): lookup member via `userId + organizationId`, lalu jika `member.role === 'member'` dan `member.id !== existing.handledByBarberId`, throw `AppError('Only the handling barber can complete this booking', 'FORBIDDEN')`. Owner/admin tetap lanjut tanpa batasan.
- [x] Di `cukkr-frontend/src/features/schedule/screens/BookingDetailScreen.tsx`, dapatkan `memberId` dan `role` current user via `authClient.useActiveMember()` (import dari `@/src/lib/auth-client`). Tambahkan variabel `isHandlingBarber = activeMember?.id === booking.handledByBarber?.memberId`.
- [x] Di `BookingDetailScreen.tsx` bagian `footer` (baris 331-339), ubah logika: untuk `booking.status === "in_progress"`, tampilkan `StickyCta` Complete hanya jika `role === 'member'` dan `isHandlingBarber` bernilai true. Owner/admin tidak melihat tombol Complete di footer.
- [x] Di `BookingDetailScreen.tsx` bagian `overflowItems` (baris 195-212), untuk case `in_progress`, tambahkan item baru `{ label: t("bookings.markAsCompleted"), onPress: () => { setOverflowVisible(false); setSwipeModalVisible(true); } }` hanya jika `role === 'owner' || role === 'admin'`. Letakkan di atas item "Mark as Waiting".
- [x] Di `cukkr-frontend/src/lib/i18n/locales/id.ts` tambahkan key `bookings.markAsCompleted: 'Tandai Selesai'` di section bookings (sekitar baris 246).
- [x] Di `cukkr-frontend/src/lib/i18n/locales/en.ts` tambahkan key `bookings.markAsCompleted: 'Mark as Completed'` di section bookings (sekitar baris 246).
- [x] Di `cukkr-frontend/src/features/barbershop/screens/CustomerDetailScreen.tsx`, bungkus `IconActionButton` send (baris 94-103) dengan kondisional: jika `customer.emailVerified || customer.phoneVerified` bernilai `false`, set `onPress` ke `undefined` dan beri gaya visual disabled (opacity dikurangi atau warna muted).
- [x] Di `cukkr-frontend/src/features/barbershop/screens/CustomerManagementScreen.tsx`, pada tombol bulk send di `SelectionToolbar` atau area seleksi, pastikan tidak bisa diklik jika ada customer terpilih yang `emailVerified` dan `phoneVerified` sama-sama `false`. Jika perlu, filter customer yang bisa diselect hanya yang verified, atau disable tombol send ketika selection mengandung unverified contact.
- [x] Jalankan `bun run lint:fix` di `cukkr-backend/` dan `bun run lint:fix` (atau `npx tsc --noEmit`) di `cukkr-frontend/` untuk memastikan tidak ada error.
- [x] Jalankan `bun test --env-file=.env` di `cukkr-backend/` untuk memastikan tidak ada regresi pada test bookings.

**Manual Verification (Human Checklist):**
- [ ] **Complete booking sebagai barber handling:** Buka `BookingDetailScreen` untuk booking `in_progress` yang `handledByBarberId` cocok dengan current user. Tombol Complete hijau muncul di footer. Swipe to confirm, booking berubah menjadi `completed`.
- [ ] **Complete booking sebagai barber bukan handling:** Buka `BookingDetailScreen` untuk booking `in_progress` milik barber lain (sebagai barber biasa). Tombol Complete hijau tidak muncul. Tidak ada cara complete booking ini dari UI.
- [ ] **Complete booking sebagai owner/admin:** Buka `BookingDetailScreen` untuk booking `in_progress` (milik barber mana pun) sebagai owner/admin. Tombol Complete hijau tidak muncul. Klik titik tiga kanan atas, muncul opsi "Tandai Selesai" / "Mark as Completed". Pilih, swipe to confirm, booking berubah menjadi `completed`.
- [ ] **Send button untuk customer verified:** Buka `CustomerDetailScreen` untuk customer yang memiliki `emailVerified = true` atau `phoneVerified = true`. Tombol send di kanan atas aktif dan bisa diklik (navigate ke send message screen).
- [ ] **Send button untuk customer unverified:** Buka `CustomerDetailScreen` untuk customer yang `emailVerified = false` DAN `phoneVerified = false`. Tombol send di kanan atas disabled (tidak bisa diklik, tampak muted).
- [ ] **Bulk send via selection:** Di `CustomerManagementScreen`, masuk selection mode. Pastikan customer yang belum verified tidak bisa ikut terpilih untuk bulk send, atau tombol send disabled jika ada unverified contact dalam selection.

**Tags:** `cukkr-backend`, `cukkr-frontend`
