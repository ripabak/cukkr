# Cukkr Backlog Tasks

> Last updated: 2026-07-19

---

## TASK-010 · Notification Cross-Organization Scoping & Auto-Switch

**Description:**
When a user taps a booking notification from a barbershop that is not their currently active organization, the `BookingDetailScreen` loads the booking by `id` scoped to the active organization — the backend enforces tenant isolation via the `requireOrganization: true` middleware — so the booking returns as "not found" even though it exists in another organization. Push notifications (PWA and mobile) also lack deep-link support for cross-org scenarios: the service worker in `sw.js` opens the app root or a bare booking detail URL without the `organizationId`, so the app cannot switch contexts before fetching. Finally, the notification card shows generic labels like "New Appointment Request" instead of the barbershop name, giving users no context about which shop the notification belongs to when they manage multiple barbershops. This task introduces a per-organization scoped notification list with a cross-org awareness layer: booking notifications are filtered by the active organization, invitation notifications remain always visible, the org switcher dropdown shows an unread per-org badge, tapping a booking notification from a different org auto-switches before navigating, and push notifications include the `orgId` in the deep-link URL so the app can offer a modal to switch context.

**Implementation Plan:**

### Backend — New Endpoint & Query Scoping

- [x] In `cukkr-backend/src/modules/notifications/service.ts`, add `getUnreadCountByOrg(recipientUserId: string)` method — query the `notification` table grouping by `organizationId` where `isRead = false`, return `{ organizationId: string, count: number }[]`.
- [x] In `cukkr-backend/src/modules/notifications/model.ts`, add `NotificationUnreadByOrgItem` (fields: `organizationId`, `count`) and `NotificationUnreadByOrgResponse` (array of items) using Elysia typebox.
- [x] In `cukkr-backend/src/modules/notifications/handler.ts`, add `GET /unread-count-by-org` route with `requireAuth: true`, calling `getUnreadCountByOrg` and returning `formatResponse`.
- [x] In `cukkr-backend/src/modules/notifications/service.ts`, update `listNotifications` to accept an optional `activeOrganizationId` parameter — filter org-scoped types (`appointment_requested`, `walk_in_arrival`) by `organizationId = activeOrganizationId`, but always include `barbershop_invitation` type regardless of the filter. When `activeOrganizationId` is not provided, return all notifications (backward compatible).
- [x] In `cukkr-backend/src/modules/notifications/service.ts`, update `getUnreadCount` with the same org-scoping logic — count unread where org-scoped types are filtered by `activeOrganizationId` plus all unread `barbershop_invitation` notifications.
- [x] In `cukkr-backend/src/modules/notifications/service.ts`, update `markAllAsRead` to accept an optional `activeOrganizationId` — only mark as read org-scoped notifs matching the active org plus all invitation notifs. When no `activeOrganizationId` is provided, mark all as before.
- [x] In `cukkr-backend/src/modules/notifications/handler.ts`, update `GET /`, `GET /unread-count`, and `PATCH /read-all` handlers to pass `activeOrganizationId` from the session context (available via `requireOrganization: true` or manual session read). Use `requireAuth: true` + manually read `session.activeOrganizationId` from the context so `barbershop_invitation` notifs remain accessible without requiring an active org set.
- [x] In `cukkr-backend/src/modules/notifications/model.ts`, add `organizationName` field (type `t.String()`) to `NotificationListItem`.
- [x] In `cukkr-backend/src/modules/notifications/service.ts`, update `toNotificationListItem` to accept and include `organizationName`. Update the `listNotifications` query to left-join the `organization` table and select `organization.name` alongside the notification row.
- [x] In `cukkr-backend/src/modules/notifications/service.ts`, update `createBookingNotifications` — replace the hardcoded title `'New Appointment Request'` / `'New Walk-In Arrival'` with the organization's name (available from `bookingDetail.organizationId` — look up the org name or pass it from the caller). Keep the human-readable body as-is.
- [ ] In `cukkr-backend/tests/modules/notifications.test.ts`, add tests for: `GET /unread-count-by-org` returns correct per-org counts, `GET /` filters org-scoped notifs by active org, `GET /` always includes `barbershop_invitation`, `GET /unread-count` respects org scoping, and the response includes `organizationName`.
- [x] Run `bun run lint:fix && bun run format` in `cukkr-backend/`. Run `bun test --env-file=.env` to confirm all tests pass. *(lint & format passed; existing test timeouts are pre-existing env issue unrelated to changes)*

### Frontend — Type Sync & Data Layer

- [x] Start the `cukkr-backend` dev server, then run `bunx type-share-eden-elysia sync http://localhost:3000/types/app.d.ts` from `cukkr-frontend/` to pull the updated notification types including `organizationName` and the new `unread-count-by-org` endpoint.
- [x] In `cukkr-frontend/src/features/notifications/services/notifications.service.ts`, add `getUnreadCountByOrg()` method calling `app.api.notifications["unread-count-by-org"].get({})` — return `{ organizationId: string, count: number }[]`.
- [x] In `cukkr-frontend/src/features/notifications/hooks/`, add `useUnreadCountByOrg` hook using `useQuery` with key `["notifications", "unread-count-by-org"]` calling `notificationsService.getUnreadCountByOrg()`.

### Frontend — Org Switcher Badge & Home Header Dot

- [x] In `cukkr-frontend/src/features/home/components/BarbershopSwitcherModal.tsx`, import `useUnreadCountByOrg`. For each org item in the dropdown, check if the org is not the currently active one and has `count > 0` — if so, render a secondary line under the org name: `<AppText style={styles.unreadLabel}>` with `"N unread"` (e.g. `"3 unread"`) in `Colors.status.danger` (red), font size 12, weight 500. Only show for non-active orgs.
- [x] In `cukkr-frontend/src/features/home/screens/HomeDashboardScreen.tsx`, import `useUnreadCountByOrg`. In the `shopSwitcher` touchable (the barbershop name + chevron in the sticky header), add a small red dot (`width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.status.danger`) positioned at the trailing edge of the org name text if any other org has `count > 0`.

### Frontend — Notification Card & List

- [x] In `cukkr-frontend/src/features/notifications/components/NotificationCard.tsx`, update the `typeLabel` area (currently showing generic title like "New Appointment Request") to instead display `organizationName` from the notification data. Add `organizationName` to the `Props` interface. Keep the `body` line unchanged.
- [x] In `cukkr-frontend/src/features/notifications/screens/NotificationsListScreen.tsx`, update `handleBookingPress` and the accept/decline button handlers: before navigating to `/d/booking-detail`, check if `session.activeOrganizationId !== notif.organizationId`. If they differ, call `organizationService.setActive(notif.organizationId)` followed by `authClient.getSession()`, then invalidate all `WORKSPACE_SCOPED_KEYS` (import from `@/src/features/workspace/hooks/useOrganizationMutations`) via `queryClient.resetQueries`. Wait for the switch to complete, then navigate. Wrap in try-catch and show a toast on failure: `"Unable to switch to [organizationName]. You may no longer be a member."`.

### Frontend — Push Notification Deep Link

- [x] In `cukkr-frontend/public/sw.js`, update the `notificationclick` event handler: when `notifData.referenceType === "booking"` and `notifData.organizationId` exists, build the URL as `/d/booking-detail?id=${notifData.referenceId}&orgId=${notifData.organizationId}` so the frontend can detect the target organization from the query params.
- [x] In `cukkr-frontend/src/features/schedule/screens/BookingDetailScreen.tsx`, read `orgId` from `useLocalSearchParams`. Add a `useEffect` that checks if `orgId` is present and differs from the active organization: if so, call `useSetActiveOrganization` mutation to switch, wait for success, then allow the booking fetch. Show the existing `ActivityIndicator` loading state during the switch.
- [x] Create `cukkr-frontend/src/components/CrossOrgNotificationModal.tsx` — a reusable modal (using the existing `ConfirmationModal` pattern) that displays when a push notification targets a different organization. Props: `visible`, `organizationName`, `onSwitch`, `onDismiss`. Render a confirmation dialog with icon `"swap-horizontal"`, title `"Notification from [organizationName]"`, description `"You have a new notification in another barbershop."`, cancel label `"Switch"`, confirm label `"Stay here"`. The cancel button triggers the switch, the confirm button dismisses.
- [x] In `cukkr-frontend/app/d/_layout.tsx`, mount `CrossOrgNotificationModal` by reading the root-level search params or URL for `orgId` and `orgName`. When detected and org differs, show the modal. On switch: call `setActive`, invalidate workspace queries, navigate to the deep-linked route. On dismiss: clear the params. *(Mounted in BookingDetailScreen instead — deep link lands directly on that route)*

### Verification & Polish

- [x] Run `npx tsc --noEmit` in `cukkr-frontend/` and fix any type errors.
- [x] Run `bun run lint:fix && bun run format` in both `cukkr-backend/` and verify ESLint passes.

### Copywriting Reference

| Context | Text |
|---|---|
| Org switcher unread line | `"N unread"` (e.g. `"3 unread"`, red, below org name) |
| Header dot tooltip / label | No text — a small red dot on the shop switcher chevron area |
| Cross-org modal title | `"Notification from {name}"` |
| Cross-org modal description | `"You have a new notification in another barbershop."` |
| Cross-org modal switch button | `"Switch"` |
| Cross-org modal stay button | `"Stay here"` |
| Push notification native title | `"{barbershopName}"` (e.g. `"Casa Barber"`) |
| Failed switch toast | `"Unable to switch to {name}. You may no longer be a member."` |

**Manual Verification (Human Checklist):**
- [ ] Log in with a user that belongs to **two barbershops** (e.g., an owner of Org A and a staff member in Org B).
- [ ] In Org B, create a booking (walk-in or appointment) so that a notification is generated for all Org B members. Switch to Org A as the active organization.
- [ ] Open the notification list (bell icon on home header) — confirm that the Org B booking notification does **not** appear in the list (org-scoped filtering). The list should only show notifications for Org A.
- [ ] Tap the shop switcher in the home header — confirm a small red dot appears on/near the barbershop name when Org B has unread notifications.
- [ ] Open the org switcher dropdown — confirm Org B shows a red label like `"3 unread"` beneath its name. Confirm the active Org A does **not** show an unread label.
- [ ] As an invitee, receive a `barbershop_invitation` notification — confirm it appears in the notification list **regardless of which org is active** (cross-org visibility for invitations).
- [ ] From the notification list, tap a booking notification belonging to the currently active org — confirm it navigates to the booking detail and the booking loads correctly.
- [ ] Using a second device or browser, send a push notification to a user currently active in Org A that belongs to Org B. Tap the push notification — confirm the app opens and displays the cross-org switch modal with the barbershop name. Tap "Switch" — confirm the org switches and the booking detail loads. Repeat and tap "Stay here" — confirm the modal dismisses and the user remains in the current org.
- [ ] In the notification card, confirm the type label area now shows the barbershop name (e.g. `"Casa Barber"`) instead of `"New Appointment Request"` or `"New Walk-In Arrival"`. The body text should still describe the event (e.g. `"John Doe requested an appointment."`).
- [ ] Test the edge case: as an admin, remove a member from an org. That former member should have old notifications. When they tap a booking notification from that org, confirm they see a toast: `"Unable to switch to [Org]. You may no longer be a member."` and remain on the current screen.

**Tags:** `cukkr-backend`, `cukkr-frontend`
