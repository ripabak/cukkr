# Cukkr Backlog Tasks

> Last updated: 2026-07-05

---

## TASK-009 · Auto-Cancel Stale Booking Requests (Cron)

**Description:**
Booking dengan status `requested` (pelanggan minta appointment tapi staff belum accept/decline) dan `waiting` (sudah di-accept tapi belum mulai dilayani) bisa mangkrak tanpa ada yang menangani. Saat ini tidak ada mekanisme otomatis untuk membatalkan booking yang `scheduledAt`-nya sudah lama terlewat. Akibatnya booking-book tersebut tetap muncul di list dan memperburuk kualitas data. Task ini menambahkan cron job yang setiap 5 menit mengecek booking dengan status `requested` atau `waiting` yang `scheduledAt`-nya sudah lewat lebih dari 1 jam, lalu otomatis mengubah statusnya menjadi `cancelled` dengan alasan yang konsisten dan mengirim email pemberitahuan ke customer.

**Implementation Plan:**
- [x] Buat method static `cancelStaleBookings()` di `cukkr-backend/src/modules/bookings/service.ts`. Gunakan satu bulk `UPDATE` query dengan `WHERE status IN ('requested', 'waiting') AND scheduledAt < (NOW() - INTERVAL '1 hour') AND scheduledAt IS NOT NULL` lalu `RETURNING id, organizationId, customerId, referenceNumber`. Set status ke `cancelled`, isi `cancelledAt = now`, dan `notes = 'Booking expired — appointment time has passed without action'`.
- [x] Kelompokkan hasil `RETURNING` per `organizationId`, lalu panggil `bookingEventBus.notify(organizationId)` untuk setiap organization yang terdampak agar UI real-time terupdate.
- [x] Untuk setiap booking yang di-cancel, kirim email ke customer. Buat fungsi baru `sendBookingExpiredEmail` di `cukkr-backend/src/lib/mail.ts` dengan subject/pesan yang sesuai untuk booking yang expired otomatis (bukan karena staff menolak), lalu panggil dari `cancelStaleBookings()`.
- [x] Tidak perlu iterasi per organization untuk update — cukup satu query cross-organization. Index `booking_organizationId_status_idx` dan `booking_organizationId_scheduledAt_idx` memastikan query tetap cepat.
- [x] Daftarkan cron di `cukkr-backend/src/app.ts` menggunakan `@elysiajs/cron` dengan nama `stale-booking-cancellation` dan pattern `*/5 * * * *`, memanggil `BookingService.cancelStaleBookings()`.
- [x] Tambahkan test di `cukkr-backend/tests/modules/bookings.test.ts`: buat booking `requested` dengan `scheduledAt` di masa lalu (>1 jam), panggil `cancelStaleBookings()`, lalu assert booking berubah ke `cancelled` dengan `notes` yang sesuai dan `cancelledAt` terisi. Ulangi untuk status `waiting`. Pastikan booking `requested`/`waiting` yang `scheduledAt`-nya masih <1 jam tidak ikut ter-cancel.
- [x] Run `bun run lint:fix` dan `bun run format` di `cukkr-backend/`.

**Manual Verification (Human Checklist):**
- [ ] Di database, buat booking dengan status `requested` dan `scheduledAt` diatur ke 2 jam yang lalu. Tunggu hingga cron berjalan (maksimal 5 menit), lalu cek di database bahwa status booking berubah menjadi `cancelled` dan `notes` berisi alasan kadaluarsa.
- [ ] Di database, buat booking dengan status `waiting` dan `scheduledAt` diatur ke 2 jam yang lalu. Cek setelah cron berjalan bahwa booking ikut ter-cancel.
- [ ] Di database, buat booking `requested` dengan `scheduledAt` 30 menit yang lalu (masih dalam grace period 1 jam). Cek booking **tidak** ikut ter-cancel.
- [ ] Cek inbox email customer (bisa pakai Mailpit/Ethereal) bahwa email pemberitahuan booking expired terkirim.

**Tags:** `cukkr-backend`
