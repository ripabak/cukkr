# Cukkr Backlog Tasks

> Last updated: 2026-05-28

---

## TASK-004 · Fix Notification Appointment Action Bugs & Improve UX

**Description:**
Ada tiga bug terkait yang perlu diselesaikan bersamaan. Pertama, tombol Decline untuk appointment di halaman notifikasi selalu gagal dengan error 400 karena backend `NotificationService.executeDeclineAction` mengharuskan field `reason` sementara frontend tidak pernah mengirimkannya — hal yang sama berlaku untuk `BookingService.declineBooking` di layer booking. `reason` harus dijadikan opsional di seluruh stack. Kedua, setelah tombol Accept atau Decline ditekan dari notification card, action buttons tidak pernah hilang karena `actionType` di-derive murni dari tipe notifikasi (`appointment_requested`) dan tidak pernah berubah — tidak ada field yang menyimpan apakah notifikasi sudah diproses. Bug ini diselesaikan dengan menambahkan kolom `actionedAs` (nullable `'accepted' | 'declined'`) ke tabel `notification` dan mengisinya saat action dieksekusi. Ketiga, semua aksi accept/decline appointment dipindahkan ke halaman `BookingDetailScreen` — tombol pada notification card kini hanya berfungsi sebagai navigasi ke booking-detail (dengan param `action=accept` atau `action=decline`), bukan melakukan API call langsung, sehingga alur keputusan terpusat di satu tempat. Halaman booking-detail mendapat modal decline baru yang memungkinkan barber menambahkan alasan (opsional) sebelum mengirim, dengan tombol Send dan Cancel. Notifikasi yang sudah diproses tetap muncul di list dengan badge status "Accepted" (hijau) atau "Declined" (merah) tanpa action buttons, dan card masih bisa diklik untuk melihat detail booking.

**Implementation Plan:**

**Backend:**
- [ ] Di `cukkr-backend/src/modules/bookings/model.ts`, ubah `BookingDeclineInput.reason` dari `t.String({ minLength: 1, maxLength: 500 })` menjadi `t.Optional(t.String({ maxLength: 500 }))`.
- [ ] Di `cukkr-backend/src/modules/bookings/service.ts` method `declineBooking`, ubah `notes: input.reason` menjadi `notes: input.reason ?? null` agar tidak crash ketika reason tidak dikirim.
- [ ] Di `cukkr-backend/src/modules/notifications/schema.ts`, tambahkan kolom `actionedAs: text('actioned_as')` (nullable, default null) ke tabel `notification`.
- [ ] Di `cukkr-backend/src/modules/notifications/model.ts`, tambahkan field `actionedAs: t.Nullable(t.Union([t.Literal('accepted'), t.Literal('declined')]))` ke `NotificationListItem`.
- [ ] Di `cukkr-backend/src/modules/notifications/service.ts` method `toNotificationListItem`, include `actionedAs: row.actionedAs as ...` dari row database.
- [ ] Di `cukkr-backend/src/modules/notifications/service.ts` method `executeAcceptAction` (blok `booking`), setelah `BookingService.acceptBooking` berhasil, update `notification.actionedAs = 'accepted'` untuk notification row yang bersangkutan.
- [ ] Di `cukkr-backend/src/modules/notifications/service.ts` method `executeDeclineAction` (blok `booking`), hapus baris `if (!reason) throw new AppError(...)`, jadikan reason opsional, dan setelah `BookingService.declineBooking` berhasil update `notification.actionedAs = 'declined'`.
- [ ] Generate dan jalankan migrasi Drizzle: dari `cukkr-backend/`, jalankan `bunx drizzle-kit generate` lalu `bunx drizzle-kit migrate`.

**Type Sync:**
- [ ] Jalankan backend dev server (`bun run dev` dari `cukkr-backend/`), lalu sync frontend types: dari `cukkr-frontend/`, jalankan `bunx type-share-eden-elysia sync http://localhost:3000/types/app.d.ts`.

**Frontend — NotificationCard:**
- [ ] Di `cukkr-frontend/src/features/notifications/components/NotificationCard.tsx`, tambahkan badge "Accepted" berwarna hijau (gunakan `StatusBadge` dengan variant sesuai atau label `"Accepted"`) di bawah teks notifikasi saat `status === 'accepted'`, sejajar dengan posisi badge "Declined" yang sudah ada.

**Frontend — NotificationsListScreen:**
- [ ] Di `cukkr-frontend/src/features/notifications/screens/NotificationsListScreen.tsx`, ubah logika `status` dari `notif.actionType !== null ? 'pending' : 'accepted'` menjadi `notif.actionedAs === 'accepted' ? 'accepted' : notif.actionedAs === 'declined' ? 'declined' : 'pending'`.
- [ ] Ubah `onAccept` pada `NotificationCard` dari `acceptMutation.mutate(notif.id)` menjadi navigasi ke `"/d/booking-detail"` dengan params `{ id: notif.referenceId, action: "accept" }`.
- [ ] Ubah `onDecline` pada `NotificationCard` dari `declineMutation.mutate(...)` menjadi navigasi ke `"/d/booking-detail"` dengan params `{ id: notif.referenceId, action: "decline" }`.
- [ ] Hapus import `useAcceptNotification` dan `useDeclineNotification` karena tidak lagi digunakan di screen ini.

**Frontend — DeclineReasonModal (komponen baru):**
- [ ] Buat `cukkr-frontend/src/features/schedule/components/DeclineReasonModal.tsx`. Komponen menerima props: `visible: boolean`, `onSend: (reason?: string) => void`, `onCancel: () => void`, `isSending: boolean`. Tampilkan modal/bottomsheet dengan judul "Decline this booking?", subtitle opsional "You can add a reason for the customer (optional).", `MultilineInputField` untuk input reason, tombol "Send" (primary, disabled saat `isSending`) dan tombol "Cancel".

**Frontend — BookingDetailScreen:**
- [ ] Di `cukkr-frontend/src/features/schedule/screens/BookingDetailScreen.tsx`, tambahkan state `const [declineReason, setDeclineReason] = useState('')`.
- [ ] Ganti `ConfirmationModal` dengan `visible={modalType === "decline"}` yang saat ini ada dengan `DeclineReasonModal` yang baru dibuat. Pass `visible={modalType === "decline"}`, `onSend={(reason) => handleDecline(reason)}`, `onCancel={() => setModalType(null)}`, `isSending={isDeclining}`.
- [ ] Update `handleDecline` untuk menerima parameter `reason?: string` dan kirim ke `declineBooking({ id, reason })` — hapus hardcoded `reason: "Declined by barber"`.

**Manual Verification (Human Checklist):**
- [ ] Buka halaman notifikasi. Untuk appointment yang belum diproses: pastikan tombol Accept dan Decline muncul di notification card.
- [ ] Tekan tombol Accept pada notification card → pastikan navigasi menuju `BookingDetailScreen` dan modal konfirmasi "Accept this booking?" muncul otomatis.
- [ ] Tekan tombol Decline pada notification card → pastikan navigasi menuju `BookingDetailScreen` dan modal decline muncul dengan input reason opsional.
- [ ] Di `BookingDetailScreen`, isi reason lalu tekan Send → pastikan booking berhasil di-decline, toast muncul, dan booking status berubah ke cancelled.
- [ ] Di `BookingDetailScreen`, biarkan reason kosong lalu tekan Send → pastikan decline tetap berhasil (reason opsional).
- [ ] Kembali ke halaman notifikasi setelah decline → pastikan notification card menampilkan badge "Declined" (merah) dan tombol Accept/Decline sudah hilang.
- [ ] Ulangi flow Accept dari booking-detail → kembali ke notifikasi → pastikan badge "Accepted" (hijau) muncul dan tombol sudah hilang.
- [ ] Pastikan card notifikasi yang sudah diproses (Accepted/Declined) tetap bisa diklik dan navigasi ke booking-detail dengan benar.
- [ ] Refresh halaman notifikasi → pastikan badge status (Accepted/Declined) tetap muncul dan tidak kembali ke state pending.

**Tags:** `cukkr-backend`, `cukkr-frontend`
