# Cukkr Backlog Tasks

> Last updated: 2026-05-28

---

## TASK-005 · Home Quick Actions: Add Open Hours Tile + New Book Bottom Sheet

**Description:**
Currently the Home Dashboard quick action section has 4 shortcut tiles in a single horizontal row — Barbers, Customers, Services, and New Book — where tapping "New Book" navigates directly to the walk-in flow (`/d/new-walk-in`). Two improvements are needed. First, an "Open Hours" shortcut should be added so barbershop owners can quickly reach operating hours configuration without navigating through the Barbershop settings tab (3+ taps away). Second, the "New Book" tile should no longer navigate directly to walk-in; instead it opens a bottom sheet presenting two large horizontal buttons — "Walk-In" and "Appointment" — each with a centered icon and label, allowing the user to choose the correct booking type before proceeding. To fit 5 tiles cleanly, the shortcut row is reorganized into two rows: the first row holds Barbers, Customers, Services (3 tiles at `width: "33.33%"` each), and the second row holds Open Hours and New Book (2 tiles centered). A new `NewBookBottomSheet` component is created in the home feature's components directory, following the same `Modal` + `Animated` + `useFrame()` pattern as `BarbershopSwitcherModal`.

**Implementation Plan:**
- [x] In `src/features/home/screens/HomeDashboardScreen.tsx`, add `"openHours"` entry to `SHORTCUT_COLORS` with an appropriate `bg` and `icon` color (e.g., `bg: "#fce7f3"`, `icon: "#db2777"`).
- [x] Add `newBookVisible` boolean state (`useState(false)`) in `HomeDashboardScreen`.
- [x] Change the `shortcutsRow` container style to `flexWrap: "wrap"` and set each `ShortcutTile` to `style={{ width: "33.33%" }}` for the first 3 tiles (Barbers, Customers, Services) to form row 1.
- [x] Add the Open Hours tile and New Book tile as the 4th and 5th `ShortcutTile`, each with `style={{ width: "50%" }}` so they center in row 2.
- [x] Wire Open Hours tile `onPress` to `router.push("/d/open-hours")`.
- [x] Wire New Book tile `onPress` to `() => setNewBookVisible(true)` (no direct navigation).
- [x] Create `src/features/home/components/NewBookBottomSheet.tsx`:
  - `Props: { visible: boolean; onClose: () => void }`
  - Use `Modal` (`transparent`, `statusBarTranslucent`, `animationType="none"`) from React Native.
  - Animate the panel sliding up from the bottom using `Animated.spring` on a `translateY` value (from `panelHeight` to `0` on open, reverse on close), driven by a `useEffect` watching `visible`.
  - Use `useFrame()` from `@/src/components/FrameContext` and `useWindowDimensions()` to compute `frameOffset = (viewportWidth - frameWidth) / 2`; apply `left: frameOffset, right: frameOffset` on the panel so it stays within the mobile frame on desktop.
  - Use `useSafeAreaInsets()` and apply `paddingBottom: insets.bottom + 16` to the panel.
  - Tap-to-close `TouchableWithoutFeedback` backdrop with semi-transparent `Colors.bg.overlay` background.
  - Panel interior: drag handle (36×4 rounded pill, `Colors.border.default`), a title text "New Booking", then a horizontal row of two large buttons side by side with `gap: 12`.
  - Each button is a `TouchableOpacity` (`flex: 1`, `borderRadius: 20`, `paddingVertical: 28`, `alignItems: "center"`, `gap: 10`, `backgroundColor: Colors.bg.surface`, `borderWidth: 1.5`, `borderColor: Colors.border.default`):
    - Walk-In button: `Ionicons name="walk-outline"` size 36, label "Walk-In" below.
    - Appointment button: `Ionicons name="calendar-outline"` size 36, label "Appointment" below.
  - Walk-In button `onPress`: calls `onClose()` then `router.push("/d/new-walk-in")`.
  - Appointment button `onPress`: calls `onClose()` then `router.push("/d/new-appointment")`.
  - Import `useRouter` from `expo-router`.
- [x] In `HomeDashboardScreen.tsx`, import `NewBookBottomSheet` and mount it inside the root `View` alongside existing modals. Pass `visible={newBookVisible}` and `onClose={() => setNewBookVisible(false)}`.
- [x] Update `docs/track_pages_and_components.md` to record the new `NewBookBottomSheet` component.

**Manual Verification (Human Checklist):**
- [ ] Open the app and navigate to the Home Dashboard tab. Confirm the shortcut row now shows 5 tiles arranged in two rows: Barbers, Customers, Services on the first row, and Open Hours, New Book on the second row, all visually balanced.
- [ ] Tap the "Open Hours" tile. Confirm it navigates to the Open Hours configuration screen (`/d/open-hours`) showing the day-by-day hours editor.
- [ ] Tap the "New Book" tile. Confirm a bottom sheet slides up from the bottom of the screen with a drag handle, a "New Booking" title, and two side-by-side buttons — "Walk-In" (with walk icon) and "Appointment" (with calendar icon).
- [ ] Tap the backdrop outside the bottom sheet. Confirm it dismisses smoothly with a slide-down animation.
- [ ] Tap "Walk-In" inside the bottom sheet. Confirm the sheet closes and the app navigates to the walk-in booking flow (`/d/new-walk-in`).
- [ ] Tap "Appointment" inside the bottom sheet. Confirm the sheet closes and the app navigates to the appointment booking flow (`/d/new-appointment`).
- [ ] On desktop (browser width ≥ 1024px), open the bottom sheet. Confirm the panel is constrained within the 390px mobile frame and does not span the full viewport width.

**Tags:** `cukkr-frontend`
