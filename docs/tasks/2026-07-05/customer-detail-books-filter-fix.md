# Cukkr Backlog Tasks

> Last updated: 2026-07-05

---

## TASK-008 · Fix Customer Detail Books Tab — Status Filter Not Working

**Description:**
On `CustomerDetailScreen` (`cukkr-frontend/src/features/barbershop/screens/CustomerDetailScreen.tsx`), the Books tab has a `StatusFilterMenu` dropdown that lets users filter bookings by status (All, Waiting, In Progress, Completed, Cancelled). Changing the filter does nothing — the booking list never updates. The root cause is in `useCustomerBookings` (`useCustomersQueries.ts:54-60`): the TanStack Query `queryKey` is `['barbershop-customers', 'bookings', id]` regardless of the selected status. Because the global `staleTime` is 5 minutes (`query-client.tsx:8`), the cached data stays fresh and TanStack Query never refetches when the filter changes. Additionally, `SCHEDULE_STATUS_OPTIONS` in `StatusFilterMenu.tsx` only lists 5 statuses, omitting `pending` and `requested` — both are valid backend query values and should be filterable. After this fix, selecting a different status filter immediately refetches the customer's bookings scoped to that status, and all 7 backend-supported statuses appear in the dropdown.

**Implementation Plan:**
- [x] In `cukkr-frontend/src/features/barbershop/hooks/useCustomersQueries.ts`, update the `bookings` query key factory to include status: `bookings: (id: string, status?: string) => [...CUSTOMERS_QUERY_KEYS.all, "bookings", id, status ?? "all"]`.
- [x] In the same file, update `useCustomerBookings` to pass `options?.status` into the query key: `queryKey: CUSTOMERS_QUERY_KEYS.bookings(id, options?.status)`.
- [x] In `cukkr-frontend/src/components/StatusFilterMenu.tsx`, add `{ label: "Pending", value: "pending", color: Colors.status.warning }` and `{ label: "Requested", value: "requested" }` to `SCHEDULE_STATUS_OPTIONS`, maintaining the existing option ordering.
- [x] Files to modify: `cukkr-frontend/src/features/barbershop/hooks/useCustomersQueries.ts`, `cukkr-frontend/src/components/StatusFilterMenu.tsx`.

**Manual Verification (Human Checklist):**
- [ ] Open the app, navigate to `/d/customer-detail-books?customerId=<id>` (or tap a customer row from the Customers list to reach the detail screen).
- [ ] Switch to the Books tab — confirm all bookings are listed initially (filter shows "All").
- [ ] Open the status filter dropdown and confirm both "Pending" and "Requested" now appear alongside the existing options (All, Waiting, In Progress, Completed, Cancelled).
- [ ] Select "Waiting" — confirm the booking list refreshes to show only `waiting` bookings without a manual pull-to-refresh.
- [ ] Select "Completed" — confirm the list updates to show only `completed` bookings.
- [ ] Select "All" — confirm all bookings reappear.
- [ ] Switch back to the General tab, then return to Books — confirm the filter label still shows "All" and the full list loads.

**Tags:** `cukkr-frontend`
