# Cukkr Backlog Tasks

> Last updated: 2026-07-22

---

## TASK-001 · Book URL Change Cooldown (3-Day Restriction)

**Description:**
Currently, barbershop owners can update their book URL (`slug` field on the `organization` table) via `PATCH /api/barbershop/settings` without any cooldown restriction. This allows unlimited URL changes, which can cause confusion for customers, break shared links, and degrade SEO. The task adds a **3-day cooldown** after each slug change — the first slug change after barbershop creation is exempt, but every subsequent change starts a 72-hour timer before the slug can be changed again. The backend must enforce this cooldown with a new `last_slug_changed_at` column on `barbershop_settings` and return the cooldown status in the settings response. The frontend `EditBookingUrlScreen` must show a confirmation modal when the user attempts to save (reminding them they can't change again for 3 days) and a rejection modal with the next available date/time when the cooldown is still active.

**Implementation Plan:**
- [x] Add `last_slug_changed_at` column to `barbershop_settings` table in `cukkr-backend/src/modules/barbershop/schema.ts`: `timestamp('last_slug_changed_at', { withTimezone: true })`.
- [x] Generate a Drizzle migration: run `bunx drizzle-kit generate --name add-last-slug-changed-at` from `cukkr-backend/`.
- [x] In `cukkr-backend/src/modules/barbershop/model.ts`, add `lastSlugChangedAt: t.Optional(t.Union([t.String(), t.Null()]))` to `BarbershopResponse` (or a `Date` equivalent) so the frontend receives the cooldown timestamp.
- [x] In `cukkr-backend/src/modules/barbershop/service.ts` `updateSettings()`, before the existing `validateAndCheckSlug` call (line 224-225), add a cooldown check:
  - Query `barbershop_settings.last_slug_changed_at` for the current org.
  - If `lastSlugChangedAt` is `null` (first change ever), allow the change — skip cooldown.
  - If `lastSlugChangedAt` is not null, compute `lastSlugChangedAt + 72 hours` and compare to `new Date()`. If the cooldown is still active, throw `AppError` with status `TOO_MANY_REQUESTS` (429) and message including the next available date in ISO 8601 format.
- [x] After a successful slug update, also update `barbershop_settings.last_slug_changed_at` to `new Date()` in the same transaction/queries block (around line 258-263).
- [x] In `cukkr-backend/src/modules/barbershop/service.ts` `getSettings()` (or wherever `BarbershopResponse` is built), include `lastSlugChangedAt` in the response so the frontend always knows the cooldown status.
- [x] Add or update tests in `cukkr-backend/tests/modules/barbershop.test.ts`:
  - Test that the first slug change succeeds and sets `lastSlugChangedAt`.
  - Test that a second change within 72 hours returns 429 with cooldown info.
  - Test that a change after 72 hours succeeds.
- [x] Run `bun run lint:fix` and `bun run format` in `cukkr-backend/`.
- [x] Start `cukkr-backend/` dev server and run: `bunx type-share-eden-elysia sync http://localhost:3000/types/app.d.ts` from `cukkr-frontend/`.
- [x] In `cukkr-frontend/src/features/barbershop/screens/EditBookingUrlScreen.tsx`:
  - Read `lastSlugChangedAt` from the barbershop data (via `useBarbershopCurrent()` or hook).
  - Compute `canChangeAt = lastSlugChangedAt + 72 hours`. Display a countdown or the next available date (`formatDateTime(canChangeAt)`) as an info message below the slug input when cooldown is active — e.g., "Tidak bisa mengganti URL hingga [date]".
  - Add a `ConfirmationModal` (reuse `src/components/ConfirmationModal.tsx`) that appears when the user taps Save and the cooldown is **not** active. Title: "Yakin ubah tautan booking?", description: "Setelah disimpan, Anda tidak bisa mengganti tautan lagi selama 3 hari." Confirm saves, cancel dismisses.
  - Add a **rejection modal** (also `ConfirmationModal`, single-button "Mengerti"/"Tutup") that appears when the user taps Save but the cooldown **is** still active. Description includes the next available date.
  - The `canSave` condition (lines 101-108) should also exclude saving when cooldown is active.
- [x] Add new i18n keys to `cukkr-frontend/src/lib/i18n/locales/id.ts` and `cukkr-frontend/src/lib/i18n/locales/en.ts`:
  - `barbershop.urlCooldownConfirmTitle`, `barbershop.urlCooldownConfirmDesc`
  - `barbershop.urlCooldownActiveTitle`, `barbershop.urlCooldownActiveDesc` (with `{date}` interpolation)
  - `barbershop.urlCooldownLabel` (the info text showing when edit is allowed again)
- [x] Run `npx tsc --noEmit` in `cukkr-frontend/` to verify no type errors.

**Manual Verification (Human Checklist):**
- [ ] Login sebagai owner barbershop, buka Settings → Booking Web → tap link untuk masuk ke halaman Edit Booking URL.
- [ ] Ganti slug ke nilai baru (belum pernah ganti) → pastikan modal konfirmasi muncul dengan teks peringatan 3 hari.
- [ ] Konfirmasi → pastikan slug berhasil tersimpan dan muncul toast sukses.
- [ ] Segera coba ganti lagi → pastikan saat tap Save, **modal penolakan muncul** dengan info tanggal/jam kapan bisa ganti lagi.
- [ ] Tutup modal penolakan → pastikan slug tidak berubah.
- [ ] Perhatikan info teks di bawah input: pastikan menampilkan kapan bisa edit lagi (format tanggal + jam yang bisa dibaca).
- [ ] Logout dan login kembali → buka halaman edit booking URL → pastikan info cooldown dan status tetap muncul dengan benar (data dari API).

**Tags:** `cukkr-backend`, `cukkr-frontend`
