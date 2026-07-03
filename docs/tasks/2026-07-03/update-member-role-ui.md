# Cukkr Backlog Tasks

> Last updated: 2026-07-03

---

## TASK-007 · Update Member Role — Frontend UI

**Description:**
The BarbersManagementScreen currently shows a `StatusBadge` ("Active" / "Pending") and a static role text for each team member. The backend already supports `member:["update"]` via Better Auth's built-in `POST /organization/update-member-role` endpoint, but there is no frontend UI to trigger it. A new UX is needed: the "Active" badge on team member cards is replaced by the role text rendered as a tappable modern button. Tapping it opens a confirmation modal with a role toggle (member ↔ admin). Owner role is protected — cannot be changed from the UI, and a user cannot change their own role. Pending invitations keep the existing layout unchanged.

**Implementation Plan:**
- [x] In `cukkr-frontend/src/features/barbershop/services/barbers.service.ts`, add `updateMemberRole(memberId: string, role: 'admin' | 'member')` method using `authClient.organization.updateMemberRole`.
- [x] In `cukkr-frontend/src/features/barbershop/hooks/useBarbersMutations.ts`, add `useUpdateMemberRole()` mutation that calls `barbersService.updateMemberRole` and invalidates `BARBERS_QUERY_KEYS.all` on success.
- [x] Export `useUpdateMemberRole` from `cukkr-frontend/src/features/barbershop/hooks/index.ts`.
- [x] In `cukkr-frontend/src/features/barbershop/components/MemberCard.tsx`:
  - Add `onRoleChange?: () => void` prop and `roleChangeable?: boolean` prop.
  - When `roleChangeable` is true, replace the `StatusBadge` with a tappable pill button showing the role text (capitalized). Style it as an interactive element (chevron or subtle border) to indicate it's tappable.
  - When `roleChangeable` is false, keep the existing `StatusBadge` and role text layout (for pending invitations).
- [x] Create new component `cukkr-frontend/src/features/barbershop/components/RoleChangeModal.tsx`:
  - Uses React Native `Modal` with `transparent` + `animationType="fade"` (matching `ConfirmationModal` pattern).
  - Shows member name, current role, and two selectable pill options: "Admin" and "Member" (with the current role pre-selected).
  - Has "Save" (confirm) and "Cancel" buttons.
  - Props: `visible`, `memberName`, `currentRole`, `onSave(newRole)`, `onCancel`.
- [x] In `cukkr-frontend/src/features/barbershop/screens/BarbersManagementScreen.tsx`:
  - Import and use `useUpdateMemberRole` mutation.
  - Add `roleChangeTarget` state ( `{ memberId: string; name: string; currentRole: string } | null` ).
  - On non-owner, non-self members, pass `onRoleChange` to `MemberCard` that sets `roleChangeTarget`.
  - Pass `roleChangeable` to MemberCard when the member is not owner and not self.
  - Render `RoleChangeModal` with the target's data. On save, call `updateMemberRole` mutation. On success, clear target and show toast.
- [x] Run `npx tsc --noEmit` from `cukkr-frontend/` and fix any type errors.

**Manual Verification (Human Checklist):**
- [ ] Log in as barbershop **owner**. Navigate to Barbers Management screen. Verify non-owner members show role as a tappable button (no "Active" badge). Tap the role — modal appears with current role selected. Switch to the other role and save — toast appears and list refreshes.
- [ ] Log in as **admin**. Verify the same behavior: can change other members' roles (member ↔ admin). Verify own role text is NOT tappable.
- [ ] Log in as **member**. Verify role text is displayed statically (not tappable) and no "Active" badge shows.
- [ ] Log in as **owner**. Verify the owner's own card shows role statically (not tappable). Verify owner can still be identified by "(You)" label.
- [ ] Verify pending invitations section is unchanged: shows "Pending" badge and email, no role change option.
- [ ] After changing a member from admin to member, verify that member's UI permissions update (e.g., analytics tab disappears, invite button hidden).

**Tags:** `cukkr-frontend`
