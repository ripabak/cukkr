# Cukkr Backlog Tasks

> Last updated: 2026-06-29

---

## TASK-006 · Add Open Hours Step to Barbershop Creation Wizard

**Description:**
The barbershop creation wizard currently has 3 steps: Step 1 (Name/Logo), Step 2 (First Service + Create Organization), and Step 3 (Invite Barbers). After completing the wizard, owners must navigate to Barbershop Settings > Open Hours to configure operating hours, requiring 3+ additional taps. This task inserts a new open hours step between Step 2 (First Service) and Step 3 (Invite Barbers), making the wizard 4 steps total. The new step reuses the same day-of-week toggle + time picker UI pattern from the existing `OpenHoursScreen` (`src/features/barbershop/screens/OpenHoursScreen.tsx`). The backend `PUT /api/open-hours` endpoint already supports owner-level access and requires no changes — the user is already an owner after organization creation in Step 2.

**Implementation Plan:**
- [x] Move `src/features/barbershop/components/DayHoursRow.tsx` to `src/components/DayHoursRow.tsx`. Update the import in `src/features/barbershop/screens/OpenHoursScreen.tsx` to reference the new shared location.
- [x] Move `src/features/barbershop/utils/time-format.ts` to `src/utils/time-format.ts`. Update the import in `src/features/barbershop/screens/OpenHoursScreen.tsx` to reference the new shared location.
- [x] Create `src/features/workspace/services/open-hours.service.ts` with an `update(days)` method that calls `app.api["open-hours"].put({ days })` via Eden Treaty (following the pattern in `src/features/barbershop/services/open-hours.service.ts`). Export from `src/features/workspace/services/index.ts`.
- [x] Create `src/features/workspace/screens/CreateBarbershopOpenHoursScreen.tsx`: a new screen file that renders `WizardProgress` with `totalSteps={4} currentStep={2}`, a title ("Set Open Hours"), subtitle, a card with 7 `DayHoursRow` rows (Mon-Sun) using the shared component, and a "Save & Continue" `PrimaryButton`. Default day state: Mon-Sat enabled with open `09:00 AM` / close `09:00 PM`, Sunday disabled with open `09:00 AM` / close `09:00 PM`. Reuse the `TimeValue` type and `timeToString`/`stringToTime` utilities from the shared `src/utils/time-format.ts`. The save handler maps day state to the `UpdateOpenHoursBody` format, calls `openHoursService.update(payload)`, and on success navigates to `/d/create-barbershop-invite-barber-empty`. Show `toast.error()` on failure.
- [x] Export `CreateBarbershopOpenHoursScreen` from `src/features/workspace/index.tsx`.
- [x] Create route file `app/d/(workspace)/create-barbershop-open-hours.tsx` that renders `CreateBarbershopOpenHoursScreen`.
- [x] In `src/features/workspace/screens/CreateBarbershopNameLogoScreen.tsx`: change `WizardProgress` prop `totalSteps` from `3` to `4`.
- [x] In `src/features/workspace/screens/CreateBarbershopFirstServiceScreen.tsx`: change `WizardProgress` prop `totalSteps` from `3` to `4`. Change the `router.push` target on line 90 from `"/d/create-barbershop-invite-barber-empty"` to `"/d/create-barbershop-open-hours"`.
- [x] In `src/features/workspace/screens/CreateBarbershopInviteBarberEmptyScreen.tsx`: change `WizardProgress` prop `totalSteps` from `3` to `4` and `currentStep` from `2` to `3`.
- [x] In `src/features/workspace/screens/CreateBarbershopInviteBarberFilledScreen.tsx`: change `WizardProgress` prop `totalSteps` from `3` to `4` and `currentStep` from `2` to `3`.
- [x] Run `npx tsc --noEmit` in `cukkr-frontend/` to verify no TypeScript errors.
- [x] No backend changes required — the existing `PUT /api/open-hours` endpoint is already guarded with `requireRoles: ['owner']` and the user is owner after `organization.create()` in Step 2.

**Manual Verification (Human Checklist):**
- [ ] Start or reset the app. Register a new account, go through onboarding, and login. Start creating a new barbershop. Confirm the wizard progress bar shows 4 dots on Step 1 (Name/Logo).
- [ ] Enter a barbershop name, tap Next. On Step 2 (First Service), confirm wizard shows step 2 of 4. Enter a service name, price, and duration. Tap "Finish Setup".
- [ ] After organization and service creation, confirm you land on the new Open Hours screen. Verify wizard progress shows step 3 of 4. Verify all 7 days are displayed (Mon-Sun), Mon-Sat are enabled with 09:00 AM - 09:00 PM, Sunday is disabled.
- [ ] Toggle a few days on/off, change some open/close times using the time picker. Tap "Save & Continue". Verify navigation proceeds to the Invite Barber screen (step 4 of 4).
- [ ] Complete or skip invite barbers, finish the wizard. Navigate to Barbershop Settings > Open Hours. Verify the hours set during creation are persisted and match what you entered.
- [ ] The existing Open Hours settings screen at `/d/open-hours` (accessible from home dashboard shortcut and barbershop settings) must still work exactly as before — data saved from the wizard should be loadable and editable there.
- [ ] Repeat the creation flow but on the Open Hours step, leave all defaults unchanged and tap "Save & Continue". Verify the defaults (Mon-Sat 09:00-19:00, Sun closed) are persisted correctly.

**Tags:** `cukkr-frontend`
