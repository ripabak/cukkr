# TASK-020 · Post-Selection Booking Window Validation on Mobile

> Last updated: 2026-07-23

---

## Description

The `minAdvanceHours` and `maxAdvanceDays` booking window limits (TASK-019) are already enforced on desktop browsers via the `<input type="date" min={...} max={...}>` HTML attributes in `cukkr-web/src/public-booking/components/AppointmentBooking.tsx` and via `DateTimePicker.minimumDate`/`maximumDate` props in `cukkr-frontend/src/features/schedule/screens/NewAppointmentScreen.tsx`. However, on iOS mobile Safari and native iOS date pickers, these `min`/`max` constraints are not reliably enforced — users can pick any date, time slots still render based on open hours, and submission fails with a booking window error at the final step. On `cukkr-web` this is especially jarring because the flow requires multiple steps before reaching the submit error. The fix adds a post-selection validation step in both codebases: after the user picks a date, the selected date is compared against the booking window (`minAdvanceHours` and `maxAdvanceDays`). If the date falls outside the window, time slots are suppressed and a contextual message is shown explaining why (e.g., "Must book at least X hours ahead" or "Can only book up to X days ahead"). The web validation uses browser-local `Date.now()` (consistent with the existing `minDate`/`maxDate` computation); the frontend validation uses the same device-local `now` variable already computed for the date picker bounds. No backend changes are required — the backend already rejects out-of-window bookings with proper error messages from TASK-019.

---

## Implementation Plan

### 1. `cukkr-web` — Add post-selection date validation in `AppointmentBooking.tsx`

- [x] In `cukkr-web/src/public-booking/components/AppointmentBooking.tsx`, add a `outOfWindowReason` state variable typed as `'tooEarly' | 'tooLate' | null`, initialized to `null`.
- [x] Refactor `handleDateChange` to validate the selected date string against the booking window **before** calling `getDateAvailability`. Parse `date + 'T00:00:00'` and compare its `.getTime()` against `minDate.getTime()` (extracted from `new Date(minDateStr + 'T00:00:00')`) and `maxDate.getTime()`. If out of window, set `outOfWindowReason` to `'tooEarly'` or `'tooLate'`, set `availability` to `null`, and `return` early (skip the availability API call).
- [x] Reset `outOfWindowReason` to `null` at the top of `handleDateChange` (alongside `setTimeValue('')` and `setAvailability(null)`) so it clears when a new valid date is selected.
- [x] In the time-slot section (after `isLoadingAvailability` spinner), render a new error block when `outOfWindowReason` is set. Use the same red-bordered box style as the "closed on date" block (`bg-[#fef2f2] border-[#fecaca] text-[#b91c1c]`):
  - If `'tooEarly'`: render `t(dict, 'booking.steps.outsideWindowMin', { hours: String(bw?.minAdvanceHours ?? 2) })`.
  - If `'tooLate'`: render `t(dict, 'booking.steps.outsideWindowMax', { days: String(bw?.maxAdvanceDays ?? 30) })`.
- [x] Add a fallback "no slots available" block when `availability` exists, `availability.isOpen` is true, and `timeSlots.length === 0` (all today's slots are before `minAdvanceHours`). Use the same red box style and render `t(dict, 'booking.steps.noSlots')`. This prevents the UI from silently showing nothing when no slots pass the advance filter.
- [x] Files to modify: `cukkr-web/src/public-booking/components/AppointmentBooking.tsx`.

### 2. `cukkr-web` — Add i18n keys for out-of-window messages

- [x] In `cukkr-web/src/lib/i18n/id.ts`, under `booking.steps`, add:
  - `outsideWindowMin: 'Harus booking minimal {hours} jam dari sekarang.',`
  - `outsideWindowMax: 'Maksimal booking {days} hari ke depan.',`
- [x] In `cukkr-web/src/lib/i18n/en.ts`, under `booking.steps`, add:
  - `outsideWindowMin: 'Must book at least {hours}h in advance.',`
  - `outsideWindowMax: 'Can only book up to {days} days ahead.',`
- [x] Files to modify: `cukkr-web/src/lib/i18n/id.ts`, `cukkr-web/src/lib/i18n/en.ts`.

### 3. `cukkr-frontend` — Add post-selection date validation in `NewAppointmentScreen.tsx`

- [x] In `cukkr-frontend/src/features/schedule/screens/NewAppointmentScreen.tsx`, add a `outOfWindowReason` state variable typed as `'tooEarly' | 'tooLate' | null`, initialized to `null`.
- [x] In `handleDateSelect`, after computing `dayAvailability` from `openHoursData`, validate the selected date against `minDateStr` and `maxDateStr` (these are already computed as `toDateInputValue(minDate)` and `toDateInputValue(maxDate)` at lines 90–91). Convert `date` to `toDateInputValue(date)` for string comparison:
  - If `selectedStr > maxDateStr`: set `outOfWindowReason` to `'tooLate'`, set `dayAvailability` to `null` to suppress time slots, set `selectedDate` and clear `selectedTimeSlot`/`displayDateTime`/`updateFormData`, and `return`.
  - If `selectedStr < minDateStr`: set `outOfWindowReason` to `'tooEarly'`, apply the same cleanup, and `return`.
  - Otherwise: set `outOfWindowReason` to `null` and proceed with setting `dayAvailability` as normal.
- [x] In the time section JSX (lines 335–371), add a new condition block **before** the `dayAvailability && !dayAvailability.isOpen` check. When `outOfWindowReason` is not `null`, render a warning box using the same `styles.closedBox` / `styles.closedText` style:
  - If `'tooEarly'`: render `t("schedule.outsideWindowMin", { hours: String(minAdvanceHours) })`.
  - If `'tooLate'`: render `t("schedule.outsideWindowMax", { days: String(maxAdvanceDays) })`.
- [x] Add a fallback "no slots" block in the time section for when `dayAvailability?.isOpen` is true but `timeSlots.length === 0`. Use the `styles.closedBox` style and render `t("schedule.noSlotsAvailable")`. This handles the edge case where all today's slots are before the `minAdvanceHours` cut-off.
- [x] Files to modify: `cukkr-frontend/src/features/schedule/screens/NewAppointmentScreen.tsx`.

### 4. `cukkr-frontend` — Add i18n keys for schedule out-of-window messages

- [x] In `cukkr-frontend/src/lib/i18n/locales/id.ts`, under `schedule`, add:
  - `outsideWindowMin: 'Harus booking minimal {hours} jam dari sekarang.',`
  - `outsideWindowMax: 'Maksimal booking {days} hari ke depan.',`
  - `noSlotsAvailable: 'Tidak ada slot tersedia untuk tanggal ini.',`
- [x] In `cukkr-frontend/src/lib/i18n/locales/en.ts`, under `schedule`, add:
  - `outsideWindowMin: 'Must book at least {hours}h in advance.',`
  - `outsideWindowMax: 'Can only book up to {days} days ahead.',`
  - `noSlotsAvailable: 'No time slots available for this date.',`
- [x] Files to modify: `cukkr-frontend/src/lib/i18n/locales/id.ts`, `cukkr-frontend/src/lib/i18n/locales/en.ts`.

---

## Manual Verification (Human Checklist)

- [ ] **cukkr-web mobile**: Open the booking page (`/<slug>/booking/appointment`) on iPhone Safari or Chrome. The date input may be an iOS native wheel picker that ignores `min`/`max`. Pick a date beyond `maxAdvanceDays` (e.g., 60 days from now). Confirm no time slots appear and a red message reads "Maksimal booking 30 hari ke depan" (id) or "Can only book up to 30 days ahead" (en). Then pick a valid date within the window — confirm time slots load normally.
- [ ] **cukkr-web mobile — today edge case**: On mobile, pick today's date. If all time slots have already passed (e.g., it's 10 PM and `minAdvanceHours` is 2), confirm the red "no slots" message appears instead of an empty grid.
- [ ] **cukkr-web desktop**: On desktop Chrome/Safari, the `min`/`max` attributes should still disable out-of-window dates. But if the user somehow bypasses (e.g., keyboard entry), picking an out-of-window date should also show the red message and no time slots.
- [ ] **cukkr-frontend iOS**: Open the app on an iPhone, navigate to Schedule → New Appointment (Janji Baru). The iOS date picker (spinner) may allow selecting dates outside the window. Pick a date beyond `maxAdvanceDays` — confirm no time slots appear and a red message explains the limit. Pick a valid date — confirm time slots load normally.
- [ ] **cukkr-frontend Android**: Open the app on an Android device, navigate to Schedule → New Appointment. Pick a date outside the booking window — confirm the red warning message appears and no time slots are shown. Pick a valid date — confirm time slots appear.
- [ ] **cukkr-frontend today edge case**: On any platform, if today is the earliest valid date but the current time plus `minAdvanceHours` leaves no remaining time slots, confirm the "no slots available" message appears.
- [ ] **cukkr-frontend barbershop closed**: Verify the existing "barbershop closed on this date" message still works when a valid in-window date is chosen but the shop is closed on that day of week.

---

**Tags:** `cukkr-frontend`, `cukkr-web`
