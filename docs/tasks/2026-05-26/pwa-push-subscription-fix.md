# Cukkr Backlog Tasks

> Last updated: 2026-05-26

---

## TASK-002 · PWA Push Subscription Fix — Walk-In Notification Not Appearing

**Description:**
Two distinct bugs prevent walk-in arrival notifications from reaching staff. First, when a walk-in or appointment booking is created via the schedule screen, `useCreateBooking.onSuccess` (in `src/features/schedule/hooks/useBookingsMutations.ts`) only invalidates booking and home query keys — it never invalidates `NOTIFICATIONS_QUERY_KEYS.all`. The backend does insert a `walk_in_arrival` notification row for every org member, but the TanStack Query cache for the notification list is stale and the UI never re-fetches it, so the bell icon dot and the notification list appear empty until the user manually refreshes. Second, the PWA web push subscription is never automatically maintained: the bell tap handler in `HomeDashboardScreen.tsx` skips `pwaNotificationService.requestPermission()` entirely when `Notification.permission === 'granted'`, meaning if the subscription was never saved (silent failure on first enable) or has expired, the user gets no OS-level push notification for walk-ins even though the backend calls `dispatchWebPushNotifications`. The study of the working arcius-mobile reference at `temps/arcius-mobile/src/shared/hooks/use-push-notification.ts` confirms the correct pattern: on every bell tap (when status !== 'granted'), call `subscribe()`, which fetches the VAPID key from the backend, requests permission, subscribes the PushManager, and saves the subscription to the backend — all with visible loading/error states. Additionally, `notificationsService.getVapidPublicKey()` in `src/features/notifications/services/notifications.service.ts` reads `response.data.publicKey` but the backend `GET /api/notifications/vapid-public-key` wraps the value as `{ data: { vapidPublicKey: "..." } }` via `formatResponse`, so the field name is wrong. iOS Safari requires the app to be installed as a standalone PWA before web push works; without detecting this, iOS users see a confusing silent failure.

**Implementation Plan:**

**Frontend — Fix notification cache invalidation after booking creation**
- [x] In `cukkr-frontend/src/features/schedule/hooks/useBookingsMutations.ts`, import `NOTIFICATIONS_QUERY_KEYS` from `@/src/features/notifications/hooks/useNotificationsQueries`. In `useCreateBooking.onSuccess`, add `queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEYS.all })` alongside the existing booking and home invalidations. Apply the same invalidation in `useNewAppointmentMutation` if it exists separately.

**Frontend — Fix VAPID key field name bug**
- [x] In `cukkr-frontend/src/features/notifications/services/notifications.service.ts`, in `getVapidPublicKey()`, change `(response.data as { publicKey: string }).publicKey` to `(response.data as { vapidPublicKey: string }).vapidPublicKey` to match the backend's `formatResponse` shape.

**Frontend — Refactor `pwaNotificationService.requestPermission()` to fetch VAPID key from backend**
- [x] In `cukkr-frontend/src/services/pwa-notification.service.ts`, update `requestPermission()` to call `notificationsService.getVapidPublicKey()` instead of reading `process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY`. Import `notificationsService` from `@/src/features/notifications/services/notifications.service`. This ensures the VAPID key is always current and removes dependency on the build-time env var for the subscription step.
- [x] Keep the try-catch but surface a meaningful error: instead of returning `{ permission: 'granted', subscription: null }` silently on subscribe failure, re-throw the error so the caller can handle it.

**Frontend — Add iOS standalone detection**
- [x] In `cukkr-frontend/src/services/pwa-notification.service.ts`, add helper functions `isIos()` and `isStandalone()` matching the arcius pattern (`use-push-notification.ts` lines 13–23). In `requestPermission()`, before requesting browser permission, check `isIos() && !isStandalone()` — if true, throw an `Error('On iOS, install the app to your home screen first to enable notifications.')`.

**Frontend — Fix bell tap to always check and renew subscription**
- [x] In `cukkr-frontend/src/features/home/screens/HomeDashboardScreen.tsx`, change the bell `onPress` handler: instead of showing the consent modal only when `Notification.permission === 'default'`, call `pwaNotificationService.requestPermission()` whenever `Notification.permission !== 'denied'` (i.e., both `'default'` and `'granted'`). On `'granted'`, the call re-checks the existing PushManager subscription and saves it to the backend if not already saved — this is idempotent because `registerWebPushSubscription` uses `onConflictDoUpdate`. Still show the consent modal only on first time (`'default'`); on subsequent visits skip straight to navigation. Show a `toast.error()` if `requestPermission()` throws (e.g., iOS not standalone, subscription failed).

**Frontend — Add subscription auto-check on HomeDashboard mount**
- [x] In `cukkr-frontend/src/features/home/screens/HomeDashboardScreen.tsx`, add a `useEffect(() => { ... }, [])` that runs once on mount: if `typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'`, call `pwaNotificationService.requestPermission()` and if subscription is returned call `notificationsService.registerWebPush(subscription).catch(() => {})`. This silently recovers expired or missing subscriptions without user interaction.

**Frontend — Type sync check**
- [x] Run `npx tsc --noEmit` in `cukkr-frontend/` and fix any TypeScript errors introduced by these changes.

**Manual Verification (Human Checklist):**
- [ ] **In-app notification list refreshes after walk-in**: Log in as a staff member. From the schedule screen, tap "New Walk-In" and create a walk-in booking. Immediately tap the bell icon — confirm the notification list shows a new `walk_in_arrival` notification without needing to manually pull-to-refresh.
- [ ] **In-app notification list refreshes after appointment**: From the public booking flow (or the schedule screen), create an appointment booking. Confirm a new `appointment_requested` notification appears in the in-app list without a full page reload.
- [ ] **Bell dot appears after walk-in creation**: After creating a walk-in, return to the home screen — confirm the yellow dot on the bell icon appears.
- [ ] **Web push on first enable**: On web (browser), clear all notification permissions (`chrome://settings/content/notifications`). Tap the bell → tap "Enable" → grant browser permission → confirm a subscription is saved (check backend DB or network tab for `POST /api/notifications/web-push/subscribe` returning 200). Then trigger a walk-in from the public flow and confirm an OS-level browser notification appears.
- [ ] **Web push subscription renewal on revisit**: Grant permission, close the browser, reopen the app, wait 5 seconds, then trigger a walk-in — confirm the OS notification still arrives (subscription was renewed on mount).
- [ ] **iOS guidance**: Open the app on Safari iPhone in a regular browser tab (not installed). Tap the bell → tap "Enable" → confirm a toast error appears saying to install the app first, and no browser permission prompt appears.
- [ ] **Denied permission**: On a browser where notification permission is already denied, tap the bell — confirm it navigates straight to the notification list without showing the consent modal or calling `requestPermission()`.
- [ ] **No duplicate subscriptions**: Trigger `requestPermission()` multiple times for the same browser — confirm the `web_push_subscription` table has only one row for that `endpoint` (upsert behavior).

**Tags:** `cukkr-frontend`
