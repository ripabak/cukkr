# Cukkr Backlog Tasks

> Last updated: 2026-05-28

---

## TASK-005 · Implement Automatic Notification Cleanup (30-Day TTL + Daily Cron)

**Description:**
Tabel `notification` di database saat ini tidak pernah dibersihkan — notifikasi terakumulasi selamanya. Seiring pertumbuhan pengguna, hal ini akan membebani performa query dan storage. Solusinya adalah mengimplementasikan automatic cleanup yang menghapus notifikasi yang lebih dari 30 hari setiap hari pada tengah malam menggunakan Elysia cron plugin (`@elysiajs/cron`). Ini adalah solusi yang clean dan proper mengikuti pattern Elysia untuk scheduling tasks.

**Implementation Plan:**
- [x] Install dependency: `bun add @elysiajs/cron` dari `cukkr-backend/`.
- [x] Di `cukkr-backend/src/modules/notifications/service.ts`, tambahkan import `lt` dari `drizzle-orm` ke baris import yang ada.
- [x] Di `cukkr-backend/src/modules/notifications/service.ts`, tambahkan static method `cleanupOldNotifications()` di akhir class `NotificationService` yang: menghitung cutoff date (30 hari lalu), execute `db.delete(notification).where(lt(notification.createdAt, cutoff))`, return count notifikasi terhapus, dan log hasilnya ke console dengan format `[Notifications] Cleanup: deleted X notifications older than 30 days`.
- [x] Di `cukkr-backend/src/app.ts`, tambahkan import `import { cron } from '@elysiajs/cron'` dan `import { NotificationService } from './modules/notifications/service'`.
- [x] Di `cukkr-backend/src/app.ts`, daftarkan cron job setelah `.use(CustomError)` dengan: name `notification-cleanup`, pattern `0 0 * * *` (daily at midnight), dan run function yang execute `NotificationService.cleanupOldNotifications()` dengan error handling.
- [x] Verifikasi TypeScript compile tanpa error: jalankan `bunx tsc --noEmit` dari `cukkr-backend/`.

**Manual Verification (Human Checklist):**
- [ ] Jalankan dev server: `bun run dev` di `cukkr-backend/`.
- [ ] Verifikasi server starts tanpa error dan cron job registered.
- [ ] Buka database (psql atau Drizzle Studio) dan insert beberapa dummy notification dengan `createdAt` lebih dari 30 hari lalu (gunakan SQL).
- [ ] Ubah cron pattern sementara ke `*/1 * * * *` (every minute) untuk testing, restart server, dan tunggu cleanup execute.
- [ ] Verifikasi dummy notification terhapus dari database dan log `[Notifications] Cleanup: deleted X notifications older than 30 days` muncul di console.
- [ ] Kembalikan cron pattern ke `0 0 * * *` (daily at midnight) untuk production.
- [ ] Pastikan notification yang lebih baru dari 30 hari tidak terhapus (insert dummy dengan `createdAt` hari ini dan verify masih ada setelah cleanup).
- [ ] Jalankan `bun run build` untuk memastikan tidak ada TypeScript atau build error di production compile.

**Tags:** `cukkr-backend`
