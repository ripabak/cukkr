# Cukkr Backlog Tasks — Example Reference

> This file is an example of the task format used in `docs/tasks/`. Use it as a reference when reading or writing task files.

---

## TASK-001 · Booking Status Not Updating After Barber Accepts on Schedule Screen

**Description:**
On the schedule screen (`cukkr-frontend/src/features/schedule/`), booking cards continue to show `waiting` status even after a barber accepts the booking via the `POST /api/bookings/:id/accept` endpoint. The root cause is that the `useBookings` query hook is not invalidating its cache after the `useAcceptBooking` mutation succeeds — `queryClient.invalidateQueries` is called with the wrong query key (`['bookings']` instead of `BOOKING_QUERY_KEYS.list()`). As a result, the UI only refreshes when the user pulls to refresh or navigates away and back. The expected behavior is that booking status updates immediately after the mutation resolves, with no manual refresh required.

**Implementation Plan:**
- [ ] In `cukkr-frontend/src/features/schedule/hooks/index.ts`, locate `useAcceptBooking` and verify the `onSuccess` invalidation key matches `BOOKING_QUERY_KEYS.list()`.
- [ ] Fix the `queryClient.invalidateQueries` call to use the correct key from `BOOKING_QUERY_KEYS`.
- [ ] Also invalidate `BOOKING_QUERY_KEYS.detail(bookingId)` if a detail query exists, so the detail screen also updates.
- [ ] In `cukkr-backend/src/modules/bookings/handler.ts`, confirm the `accept` endpoint returns the updated booking object so the frontend can use `setQueryData` as an optional optimistic update.
- [ ] Add or update tests in `cukkr-backend/tests/modules/bookings.test.ts` to assert the response shape of `POST /api/bookings/:id/accept`.

**Manual Verification (Human Checklist):**
- [ ] In the app, log in as a barbershop owner or staff member and navigate to the Schedule screen.
- [ ] Create a test booking (walk-in or online) so that a `waiting` booking appears on the schedule.
- [ ] Tap the booking card and press "Accept" — confirm the card's status label updates to `in_progress` immediately without a pull-to-refresh.
- [ ] Navigate away and return to the Schedule screen — confirm the accepted booking still shows `in_progress`.
- [ ] Repeat the test for "Decline" to ensure that mutation also triggers a re-fetch.

**Tags:** `cukkr-backend`, `cukkr-frontend`

---

## TASK-002 · Inactive Service Still Appears in Public Booking Flow

**Description:**
When a barbershop owner deactivates a service via `PATCH /api/services/:id/toggle-active`, the service is correctly marked as `isActive: false` in the database. However, the public booking screen (`cukkr-frontend/src/features/workspace/`) still displays the deactivated service in the service selection list because the `GET /api/public/:slug/services` endpoint does not filter by `isActive`. Customers can select and attempt to book an inactive service, which then fails at the confirmation step with an opaque server error. The fix requires filtering inactive services in the backend query and confirming the public endpoint response type is re-synced to the frontend.

**Implementation Plan:**
- [ ] In `cukkr-backend/src/modules/public/service.ts` (or `public-booking/service.ts`), find the query that fetches services for the public booking flow and add a `where(eq(services.isActive, true))` filter.
- [ ] In `cukkr-backend/tests/modules/public-booking.test.ts`, add a test case that verifies deactivated services are excluded from the public services list.
- [ ] Run `bun run lint:fix` and `bun run format` in `cukkr-backend/` after changes.
- [ ] Start `cukkr-backend/` dev server and run: `bunx type-share-eden-elysia sync http://localhost:3000/types/app.d.ts` from `cukkr-frontend/` to sync updated types.
- [ ] In `cukkr-frontend/src/features/workspace/services/index.ts` (or the relevant public service file), confirm the service list call uses the updated type and no stale `isActive` field assumptions remain.

**Manual Verification (Human Checklist):**
- [ ] In the app, log in as a barbershop owner and go to Services — toggle one service to inactive.
- [ ] Open the public booking screen (via the barbershop's public slug) and confirm the deactivated service does NOT appear in the service selection list.
- [ ] Complete a booking with an active service to confirm the flow still works end-to-end.
- [ ] Re-activate the service and confirm it reappears on the public booking screen after a page refresh.

**Tags:** `cukkr-backend`, `cukkr-frontend`

---

> **Format key:**
> - `- [ ]` = step not yet implemented
> - `- [x]` = step completed and merged
> - A task is considered **fully done** when all `- [ ]` items in `Implementation Plan` become `- [x]`.
