# Cukkr Backlog Tasks

> Last updated: 2026-07-20

---

## TASK-011 · Customer Language Based on Last Verified Booking

**Description:**
Saat ini `customer.language` hanya diset sekali saat customer pertama kali dibuat melalui `doCreateBooking()` di `bookings/service.ts:638`. Jika customer yang sudah ada melakukan booking baru dengan bahasa yang berbeda (misalnya pertama booking pakai bahasa Indonesia, lalu booking lagi pakai bahasa Inggris), `customer.language` tidak pernah diupdate — customer tetap menggunakan bahasa dari booking pertamanya. Selain itu, flow walk-in (`WalkInPinService.createWalkInBooking()` di `walk-in-pin/service.ts:135`) tidak melempar `lang` ke `BookingService.createBooking()`, sehingga selalu default `'id'`. Akibatnya, email yang dikirim ke customer (accept, decline, expired, identity verification) menggunakan bahasa yang mungkin sudah tidak relevan dengan preferensi terbaru customer. Solusinya adalah: (1) tambah kolom `language` di tabel `booking` untuk menyimpan bahasa per-booking, (2) update `customer.language` hanya saat booking benar-benar "verified" — untuk appointment saat `verifyAppointmentEmail()` dipanggil (booking diverifikasi via email), untuk walk-in customer (public flow, `source === 'customer'`) saat booking dibuat (karena walk-in langsung masuk status `waiting` tanpa verifikasi), (3) perbaiki walk-in flow supaya `lang` diteruskan ke `doCreateBooking()`, dan (4) pastikan staff-created bookings (`source === 'staff'`) tidak mengubah `customer.language` secara otomatis karena staff tidak tahu preferensi bahasa customer.

**Implementation Plan:**
- [x] Di `cukkr-backend/src/modules/bookings/schema.ts`, tambahkan kolom `language` ke tabel `booking` (setelah `notes` di baris ~83): `language: text('language').default('id')`.
- [x] Di `cukkr-backend/src/modules/bookings/model.ts`, jika diperlukan tambahkan field `language` ke response DTO `BookingDetailResponse`. *(skipped: not needed — `BookingDetailResponse.customer` already includes `language` via `CustomerResponse`)*
- [x] Generate migration: jalankan `bunx drizzle-kit generate --name add-booking-language` dari `cukkr-backend/`.
- [x] Di `cukkr-backend/src/modules/bookings/service.ts` method `doCreateBooking()` (~line 677-696), di dalam `tx.insert(booking).values({...})`, tambahkan `language: lang` (setelah `notes: input.notes ?? null`) ke booking INSERT record, sehingga bahasa per-booking tersimpan.
- [x] Di `cukkr-backend/src/modules/bookings/service.ts` method `doCreateBooking()` (~line 627-644), untuk kasus `existingCustomer` (bukan first-time), update `customer.language` dengan `lang` jika `source === 'customer'` DAN tipe booking adalah `walk_in` (walk-in langsung "masuk" tanpa verifikasi, dan hanya dari public flow). Gunakan `tx.update(customer).set({ language: lang, updatedAt: now })`. Staff-created bookings (`source: 'staff'`) tidak mengubah `customer.language`.
- [x] Di `cukkr-backend/src/modules/bookings/service.ts` method `verifyAppointmentEmail()` (~line 1328-1345), setelah customer update `.set({ emailVerified: true, ... })`, tambahkan `language: existing.language` — field ini otomatis tersedia dari `findFirst` (Drizzle return semua kolom tanpa `columns` filter). Public appointment selalu `source === 'customer'`, jadi ini aman — staff-created appointments tidak melalui verify flow.
- [x] Di `cukkr-backend/src/modules/walk-in-pin/model.ts`, tambahkan field `lang: t.Optional(t.String({ default: 'id' }))` ke `WalkInBookingBody`. Ini diperlukan karena `PublicBookingService.createWalkIn` menggunakan tipe `Omit<WalkInPinModel.WalkInBookingBody, 'validationToken'>` — tanpa field ini, `input.lang` tidak dikenali TypeScript meskipun runtime value sudah ada dari `PublicBookingModel.WalkInBookingBody` (yang sudah punya `lang`).
- [x] Di `cukkr-backend/src/modules/walk-in-pin/service.ts` method `createWalkInBooking()` (~line 135), passing `input.lang` ke `BookingService.createBooking()` sebagai parameter `lang`. Tambahkan `input.lang` sebagai argumen ke-6 di pemanggilan `BookingService.createBooking()`.
- [x] Jalankan `bun run lint:fix` dan `bun run format` dari `cukkr-backend/`.
- [x] Buat atau update test di `cukkr-backend/tests/modules/bookings.test.ts` — verifikasi `customer.language` diupdate saat walk-in dibuat, dan saat appointment diverifikasi. *(added to tests/modules/walk-in-pin.test.ts and tests/modules/public-barbershop.test.ts)*
- [x] Jalankan `bun test --env-file=.env` dari `cukkr-backend/` untuk memastikan semua test passing.
- [ ] Start backend dev server (`bun run dev` dari `cukkr-backend/`), lalu dari `cukkr-frontend/` jalankan: `bunx type-share-eden-elysia sync http://localhost:3000/types/app.d.ts` untuk sync tipe. *(skipped: backend needs running database, no new API endpoints added)*

**Manual Verification (Human Checklist):**
- [ ] Buka halaman booking publik di `cukkr-web` untuk suatu barbershop (misal `/{slug}/booking/appointment`).
- [ ] Booking dengan bahasa Inggris (pilih English via LanguageSwitcher). Submit booking dan verifikasi email.
- [ ] Di database, cek tabel `customer` — pastikan `language` customer tersebut berisi `'en'`.
- [ ] Booking lagi dengan bahasa Indonesia (switch ke Indonesia). Submit dan verifikasi email.
- [ ] Di database, cek `customer.language` — pastikan berubah menjadi `'id'`.
- [ ] Lakukan walk-in booking dengan PIN, pilih bahasa Inggris. Cek `customer.language` berisi `'en'`.
- [ ] Lakukan walk-in booking lagi dengan bahasa Indonesia. Cek `customer.language` berubah menjadi `'id'`.
- [ ] Verifikasi email yang diterima customer (accept/decline/expired) menggunakan bahasa yang sesuai dengan `customer.language` terbaru.
- [ ] Di aplikasi frontend (staff app), buat booking baru untuk customer yang sudah punya preferensi English. Pastikan `customer.language` tetap `'en'` (tidak berubah jadi `'id'` karena staff-created booking default `lang='id'`).

**Tags:** `cukkr-backend`
