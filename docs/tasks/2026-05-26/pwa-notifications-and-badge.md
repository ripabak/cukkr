# Cukkr Backlog Tasks

> Last updated: 2026-05-26

---

## TASK-001 · PWA Notifications, Unread Badge, and barbershop_invitation Fix

**Description:**
Several notification-related features are either missing or broken. First, when there are unread notifications, the notification bell icon in the home screen header shows no visual indicator — the existing `useUnreadNotificationsCount()` hook and its backend endpoint (`GET /api/notifications/unread-count`) are already wired up but unused in the home screen. Second, the PWA has no service worker or web push configuration, so push notifications cannot be received on web; the app also cannot set the OS-level app badge even though the Badge API (`navigator.setAppBadge`) is available on supported browsers. Push notification permission should only be requested the first time the user taps the notification bell icon, not on app launch. Third, in the notification list, booking-related notifications (`appointment_requested`, `walk_in_arrival`) are not navigating to the booking detail screen when tapped; only the `barbershop_invitation` type opens a modal. All booking-type notifications should be clickable and navigate to `/d/booking-detail?id=<referenceId>`, while notifications without a booking reference remain non-interactive — this distinction should be communicated implicitly through a subtle chevron on the right side of clickable cards rather than a badge. Fourth, the booking icon in `NotificationCard` for walk-in type uses `people` while `BookingCard` in the schedule screen uses `walk` — these should be unified so walk-in shows `walk` and appointment shows `calendar`. Fifth, the `barbershop_invitation` notification type is fundamentally broken: the backend `executeAcceptAction` and `executeDeclineAction` in `NotificationService` throw `'Action not supported for this notification type'` for the invitation reference type, and no code in the backend actually creates a `barbershop_invitation` notification when an invitation is sent. Finally, notifications should be considered read automatically when the user opens the notification list screen (by calling `PATCH /api/notifications/read-all`), and the app badge should be reset to zero at the same moment — there is no manual mark-as-read flow.

**Implementation Plan:**

**Backend — Fix barbershop_invitation notification creation**
- [x] In `cukkr-backend/src/lib/auth.ts`, inside `sendInvitationEmail`, look up the invitee by email and insert a `barbershop_invitation` notification row directly via Drizzle if the user exists. Wrapped in try-catch so invitation flow is not blocked.
- [x] In `cukkr-backend/src/modules/notifications/service.ts`, extend `executeAcceptAction()`: when `referenceType === 'invitation'` and `type === 'barbershop_invitation'`, verify the invitation via the DB, update status to `'accepted'`, create a `member` record, and mark notification as read.
- [x] In `cukkr-backend/src/modules/notifications/service.ts`, extend `executeDeclineAction()`: when `referenceType === 'invitation'` and `type === 'barbershop_invitation'`, verify the invitation via the DB, update status to `'rejected'`, and mark notification as read.
- [x] Add or update tests in `cukkr-backend/tests/modules/notifications.test.ts` to cover invitation accept and decline actions.
- [x] Run `bun run lint:fix && bun run format` in `cukkr-backend/`.

**Frontend — Unread badge on home screen**
- [x] In `cukkr-frontend/src/features/home/screens/HomeDashboardScreen.tsx`, import `useUnreadNotificationsCount` from the notifications feature hooks and render a small filled dot (8×8, `Colors.brand.primary`) absolutely positioned top-right of the bell button when `count > 0`. Do not show a number — a dot is sufficient.
- [x] The dot should only be visible when `count > 0`; use the existing query hook which polls via TanStack Query's default stale time.

**Frontend — PWA service worker and web push**
- [x] Create `cukkr-frontend/public/sw.js` as a minimal service worker that handles `push` events: parse the event data as JSON and call `self.registration.showNotification(data.title, { body: data.body, icon: '/icons/icon-192.png', badge: '/icons/icon-96.png' })`. Also handle `notificationclick` to `clients.openWindow('/')` or a deep-link URL if provided in the notification data.
- [x] In `cukkr-frontend/public/manifest.json`, ensure `"permissions": ["notifications"]` is present (or is already satisfied by the `notifications` permission in the browser).
- [x] Create `cukkr-frontend/src/services/pwa-notification.service.ts` with methods: `requestPermission()` (asks the browser for push permission, registers the service worker, and returns `'granted' | 'denied' | 'default'`), `getBadgeCount()`, `setBadge(count: number)` (calls `navigator.setAppBadge(count)` with graceful no-op if API unavailable), `clearBadge()` (calls `navigator.clearAppBadge()`). Guard all calls behind `typeof window !== 'undefined'` and feature detection.
- [x] In `cukkr-frontend/src/features/notifications/hooks/useNotificationsQueries.ts`, after the unread count query resolves with a value, call `pwaNotificationService.setBadge(count)` in a `useEffect` so the OS badge stays in sync with the server count.

**Frontend — Permission request on bell icon tap**
- [x] In `cukkr-frontend/src/features/home/screens/HomeDashboardScreen.tsx`, modify the notification bell `onPress` handler: before navigating to `/d/notifications-list`, call `pwaNotificationService.requestPermission()` if `Notification.permission === 'default'` (i.e., not yet asked). Only ask once per tap on the first encounter; subsequent taps skip straight to navigation.

**Frontend — Auto-mark-as-read and badge reset on list open**
- [x] In `cukkr-frontend/src/features/notifications/screens/NotificationsListScreen.tsx`, call the `markAllAsRead` mutation in a `useEffect` that runs once when the screen mounts. On success, calls `pwaNotificationService.clearBadge()`. The existing `onSuccess` in `useMarkAllAsRead` already invalidates all notification queries, refreshing the unread count.
- [x] Remove any existing manual "mark as read" button or action if present.

**Frontend — Clickable booking notifications with implicit distinction**
- [x] In `cukkr-frontend/src/features/notifications/screens/NotificationsListScreen.tsx`, for notifications where `referenceType === 'booking'` and `referenceId` is non-null, set `onPress` to navigate to `{ pathname: '/d/booking-detail', params: { id: referenceId } }`.
- [x] In `cukkr-frontend/src/features/notifications/components/NotificationCard.tsx`, add an optional `isClickable?: boolean` prop. When `true`, render a small `chevron-forward` icon (13px, 0.5 opacity) alongside the timestamp. `activeOpacity` is `0.85` for clickable, `1` for non-clickable.
- [x] Do not add a badge or any colored indicator to distinguish clickable from non-clickable cards — the chevron and touch feedback are the only cues.

**Frontend — Icon consistency with schedule BookingCard**
- [x] In `cukkr-frontend/src/features/notifications/components/NotificationCard.tsx`, update `TYPE_ICON` to use `'walk'` for `'walk-in'` (currently `'people'`) to match `BookingCard` in `src/components/BookingCard.tsx`.

**Frontend — Sync types if backend changed endpoints**
- [ ] Run `bunx type-share-eden-elysia sync http://localhost:3000/types/app.d.ts` from `cukkr-frontend/` after backend changes are deployed locally. *(No new endpoints added — existing endpoints unchanged; sync can be skipped unless other backend changes are pending.)*
- [x] Run `npx tsc --noEmit` in `cukkr-frontend/` and fix any TypeScript errors.

**Manual Verification (Human Checklist):**
- [ ] **Unread badge on home**: Log in, create a new appointment booking from the public booking flow so a `appointment_requested` notification is generated. Open the home screen — confirm a small dot appears on the bell icon. Open the notification list — confirm the dot disappears from the bell icon when you return to home.
- [ ] **PWA push permission**: On web (browser), tap the bell icon for the first time — confirm the browser's native permission prompt appears. Grant permission. Tap the bell again — confirm it navigates directly to the notification list without showing the prompt again.
- [ ] **App badge (web)**: After generating an unread notification and returning to the home tab, check the browser tab's favicon or taskbar/dock badge (if the OS supports it) to confirm the badge shows a count. Open the notification list — confirm the badge clears.
- [ ] **Clickable booking notification**: In the notification list, tap an `appointment_requested` or `walk_in_arrival` notification that has a booking reference — confirm it navigates to the booking detail screen for that booking.
- [ ] **Non-clickable notification (no reference)**: Confirm that a notification without a booking reference (e.g., a general notification) shows no chevron and tapping it produces no navigation.
- [ ] **Chevron vs no-chevron**: Side-by-side in the notification list, confirm that booking notifications show a small subtle chevron on the right and non-booking notifications do not, with no other visual difference.
- [ ] **Icon consistency**: In the notification list, confirm walk-in notifications now show the `walk` icon (same as the schedule screen BookingCard) and appointment notifications show `calendar`.
- [ ] **barbershop_invitation — creation**: Invite a barber by email (when the invited user has an existing account). Log in as the invited user — confirm a `barbershop_invitation` notification appears in their notification list.
- [ ] **barbershop_invitation — accept**: Tap the accept action on the invitation notification as the invited user — confirm the user is added to the barbershop as a member and the notification is marked as read.
- [ ] **barbershop_invitation — decline**: Tap the decline action on the invitation notification — confirm the invitation is rejected and the notification is marked as read.
- [ ] **Auto mark-as-read**: Open the notification list with unread notifications — confirm that after opening the screen, all notifications lose their unread dot and the home screen badge disappears, without any manual action.

**Tags:** `cukkr-backend`, `cukkr-frontend`
