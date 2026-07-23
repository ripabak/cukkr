# TASK-019 · Booking Window Limits

> Last updated: 2026-07-22

---

## Problem

Saat ini customer dapat membuat booking (appointment) dari `cukkr-web /slug` dan `cukkr-frontend` (staff-side) tanpa batasan seberapa dekat atau seberapa jauh dari waktu sekarang. Customer bisa booking 2 bulan, 3 bulan, bahkan setahun ke depan. Semakin jauh waktunya, semakin kecil kemungkinan kehadiran. Tidak ada mekanisme bagi pemilik barbershop untuk membatasi booking window.

---

## Decisions

| Item | Choice | Notes |
|------|--------|-------|
| Booking window parameters | Min advance (jam) + Max advance (hari) | Keduanya bisa dikonfigurasi |
| Staff vs public | Aturan sama | Validasi backend berlaku untuk semua source |
| Storage | 2 kolom baru di `barbershop_settings` | `min_advance_hours`, `max_advance_days` |
| Default values | min = 2 jam, max = 30 hari | Langsung berlaku untuk semua org tanpa perlu setup |
| Validation | Reject saat creation (HTTP 400) | Backend langsung validasi di `validateScheduledAt` |
| Stale cron | Tidak berubah (tetap 1 jam hardcoded) | Cron untuk `requested`/`waiting` yang `scheduledAt` sudah lewat 1 jam |
| Owner config UI | Halaman terpisah "Booking Preferences" di `cukkr-frontend` | Hanya `owner`/`admin` yang bisa akses |
| Walk-in | Tidak terpengaruh | Walk-in tidak punya `scheduledAt` |
| Min advance unit | Integer jam (1, 2, 3, ..., 168) | Contoh: 2 = customer harus booking minimal 2 jam sebelum appointment |
| Max advance unit | Integer hari (1, 7, 14, 30, 60, 90, 180, 365) | Contoh: 30 = customer hanya bisa booking maksimal 30 hari ke depan |
| `cukkr-web` date/time picker | Filter di UI | Date picker: hanya sampai `today + maxAdvanceDays`. Time slot: hanya jam `>= now + minAdvanceHours` |

---

## Database Changes

### Schema: `cukkr-backend/src/modules/barbershop/schema.ts`

Add 2 columns to `barbershopSettings` table:

```typescript
minAdvanceHours: integer('min_advance_hours')
    .default(2)
    .notNull(),
maxAdvanceDays: integer('max_advance_days')
    .default(30)
    .notNull(),
```

### Migration

```bash
bunx drizzle-kit generate --name add-booking-window-to-barbershop-settings
```

---

## Backend Implementation

### 1. Schema (`barbershop/schema.ts`)

- [x] Add `minAdvanceHours` and `maxAdvanceDays` columns to `barbershopSettings`
- [x] Run migration

### 2. Model (`barbershop/model.ts`)

- [x] Add `BookingWindowInput` DTO (for update endpoint):

```typescript
export const BookingWindowInput = t.Object({
    minAdvanceHours: t.Number({ minimum: 1, maximum: 168 }),
    maxAdvanceDays: t.Number({ minimum: 1, maximum: 365 }),
}, { additionalProperties: false })
```

- [x] Add booking window fields to `SettingsResponse` type
- [x] Add booking window fields to `SettingsInput` (optional — PATCH)

### 3. Service (`barbershop/service.ts`)

- [x] Ensure `getSettings()` returns `minAdvanceHours` and `maxAdvanceDays`
- [x] Ensure `updateSettings()` accepts and stores `minAdvanceHours` and `maxAdvanceDays`
- [x] Add validation: `maxAdvanceDays * 24` must be `> minAdvanceHours` (otherwise reject)

### 4. Booking Validation (`bookings/service.ts`)

- [x] Add `validateBookingWindow()` method to `BookingService`
- [x] Call `validateBookingWindow()` inside `validateScheduledAt()` after existing checks (after `validateOpenHours`)
- [x] Logic:

```typescript
private static async validateBookingWindow(
    organizationId: string,
    scheduledAt: Date
): Promise<void> {
    // Fetch org's booking window settings (with defaults)
    const settings = await db.query.barbershopSettings.findFirst({
        where: eq(barbershopSettings.organizationId, organizationId),
        columns: { minAdvanceHours: true, maxAdvanceDays: true }
    })

    const minAdvanceHours = settings?.minAdvanceHours ?? 2
    const maxAdvanceDays = settings?.maxAdvanceDays ?? 30
    const now = new Date()

    // Minimum advance: scheduledAt must be >= now + minAdvanceHours
    const minAllowed = new Date(now.getTime() + minAdvanceHours * 60 * 60 * 1000)
    if (scheduledAt.getTime() < minAllowed.getTime()) {
        throw new AppError(
            `Appointment must be booked at least ${minAdvanceHours} hour(s) in advance`,
            'BAD_REQUEST'
        )
    }

    // Maximum advance: scheduledAt must be <= now + maxAdvanceDays
    const maxAllowed = new Date(now.getTime() + maxAdvanceDays * 24 * 60 * 60 * 1000)
    if (scheduledAt.getTime() > maxAllowed.getTime()) {
        throw new AppError(
            `Appointment can only be booked up to ${maxAdvanceDays} day(s) in advance`,
            'BAD_REQUEST'
        )
    }
}
```

- [x] This validation applies to **both** `createBooking()` (staff) and `createAppointmentRequest()` (public customer)

### 5. Barbershop API (`barbershop/handler.ts`)

- [x] Add endpoint `PATCH /api/barbershop/settings/booking-window`:

```typescript
.patch('/settings/booking-window', async ({ body, activeOrganizationId, path }) => {
    const data = await BarbershopService.updateBookingWindow(activeOrganizationId, body)
    return formatResponse({ path, data })
}, {
    requireRoles: ['owner', 'admin'],
    body: BarbershopModel.BookingWindowInput,
})
```

### 6. Public Booking API

- [x] No handler changes needed — validation happens in `BookingService.validateScheduledAt()` which is called by `doCreateBooking()`
- [x] Existing `POST /api/public/booking/:slug/appointment` will automatically enforce window limits

### 7. Public Booking Service

- [x] Ensure `getFormData()` returns booking window settings so cukkr-web can filter UI:

```typescript
// Add to FormDataResponse:
bookingWindow: {
    minAdvanceHours: number
    maxAdvanceDays: number
}
```

### 8. Tests (`tests/modules/bookings.test.ts`)

- [x] Test: appointment with `scheduledAt` only 30 minutes from now should fail (min default = 2 hours)
- [x] Test: appointment with `scheduledAt` 3 hours from now should succeed (within min advance)
- [x] Test: appointment with `scheduledAt` 40 days from now should fail (max default = 30 days)
- [x] Test: appointment with `scheduledAt` 20 days from now should succeed (within max advance)
- [x] Test: staff-created appointment also respects window limits
- [x] Test: update booking window settings via API, verify new limits are enforced
- [x] Test: walk-in is **not** affected by window limits
- [x] Test: stale cron is **not** changed — still cancels 1-hour stale bookings

---

## Frontend Implementation (`cukkr-frontend`)

### 1. New Screen: BookingPreferencesScreen

- [x] Path: `src/features/barbershop/screens/BookingPreferencesScreen.tsx`
- [x] Route: Part of `app/(barbershop)/` or `app/d/` structure (TBD based on existing barbershop settings routing)
- [x] UI:
  - Header: "Booking Preferences"
  - Section "Booking Window":
    - Field 1: "Minimum Advance" — number input (hours), min 1, max 168
    - Field 2: "Maximum Advance" — number input (days), min 1, max 365
    - Helper text: "Customers must book at least X hours before and no more than Y days ahead"
  - Validation: max days * 24 must be > min hours (inline error message)
  - Save button
- [x] Access: Only `owner`/`admin` (use `<Permission>`)
- [x] Navigation: Link from Barbershop Settings screen or tab bar

### 2. Service

- [x] `src/features/barbershop/services/booking-preferences.service.ts`:
  - `getBookingWindow()` — GET (or reuse existing getSettings and extract fields)
  - `updateBookingWindow(orgId, data)` — PATCH `/api/barbershop/settings/booking-window`

### 3. Hooks

- [x] `useBookingWindow()` — GET query hook
- [x] `useUpdateBookingWindow()` — PATCH mutation hook with query invalidation

### 4. i18n

- [x] Add new keys to `src/lib/i18n/locales/{id,en}.ts`:
  - `bookingPreferences.title`
  - `bookingPreferences.minAdvance`
  - `bookingPreferences.maxAdvance`
  - `bookingPreferences.helperText`
  - `bookingPreferences.validationHoursGreater`
  - `toast.bookingWindowUpdateSuccess`

---

## Web Landing Implementation (`cukkr-web`)

### 1. Public Booking Components

- [x] Update `src/public-booking/actions/booking.actions.ts`:
  - `getFormData()` already receives booking window from backend (via updated `getFormData` response)
- [x] Update `src/public-booking/context/PublicBookingContext.tsx`:
  - Add `bookingWindow` to shared state
- [x] Update date picker in `AppointmentBooking.tsx`:
  - Disable dates beyond `today + maxAdvanceDays`
  - Only show dates from today up to `today + maxAdvanceDays - 1`
- [x] Update time slot grid in `AppointmentBooking.tsx`:
  - Only show time slots where `slot time >= now + minAdvanceHours`
  - For dates that are NOT today: show all slots (min advance already satisfied by date being in future)
  - For today's date: filter out slots before `now + minAdvanceHours`

### 2. i18n

- [x] Add new keys to `src/lib/i18n/{id,en}.ts`:
  - `booking.datePicker.noSlotsAvailable`
  - `booking.datePicker.outsideWindow`

---

## Implementation Order

1. **Database**: Add columns + migration
2. **Backend**: Schema → Model → Service (barbershop) → Service (bookings validation) → Handler → Tests
3. **Frontend**: Sync types → Service → Hooks → BookingPreferencesScreen
4. **Web**: Update form data response → Context → Date picker filter → Time slot filter
5. **Verify end-to-end**: Create appointment from cukkr-web within/outside window, verify rejection

---

## Notes

- Existing open hours validation remains unchanged and runs BEFORE booking window validation
- Error messages must use i18n (`t()` function) via user's language preference
- When owner updates booking window, existing bookings are NOT affected — only new bookings are validated against the new window
- If `minAdvanceHours` is increased, bookings that were valid before still stay valid
- The stale cron (1-hour cancellation) is NOT configurable and stays separate from this feature

**Tags:** `cukkr-backend` `cukkr-frontend` `cukkr-web`
