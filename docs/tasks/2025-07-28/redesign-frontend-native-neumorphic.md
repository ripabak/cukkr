# Redesign: Cukkr Frontend — Native App Feel with Neumorphism

## Objective
Redesign the entire `cukkr-frontend` so it feels like a modern native mobile app rather than a mobile web view. Apply a consistent neumorphic design language with subtle gradients, depth, and tactile interactivity. Fix booking status colors to be more appropriate and consistent across all screens.

## Scope
- All screens and shared components in `cukkr-frontend/src` and `cukkr-frontend/app`.
- Color palette, typography, spacing, shadows, and interactive states.
- Native app patterns: bottom sheet, floating cards, bottom tab, tactile buttons, status badges.
- Status booking color consistency.

## Design Decisions
- Background: soft cool gray (`#f0f2f5`) for neumorphic depth.
- Surfaces: slightly lighter `#f7f9fc` with raised/inset shadows instead of flat borders.
- Brand: desaturated amber (`#f5b923`) for CTAs and accents.
- Status colors:
  - waiting: amber `#f59e0b`
  - in_progress: blue `#3b82f6`
  - completed: emerald `#10b981`
  - cancelled: red `#ef4444`
  - requested: indigo `#6366f1`
- Typography: use the existing Plus Jakarta Sans family but tighten headings, improve scale, and add line-height.
- Interactivity: spring/tactile press states, smooth shadows, and visible focus/active feedback.
- Components: remove heavy borders where possible; use colored/tinted shadows and soft gradients.

## Implementation Steps
1. Update `src/theme/colors.ts` with the new palette and status tokens.
2. Update `src/app-theme.ts` typography and spacing scale.
3. Create `src/theme/styles.ts` with reusable neumorphic shadow utilities and status style helpers.
4. Update shared components: AppText, BottomTabBar, ScreenHeader, BookingCard, PrimaryButton, SecondaryButton, LabeledInput, ConfirmationModal, NewBookBottomSheet, InProgressFloatingCard, OverflowMenu, StatusBadge, ServiceCard, InfoRow, SearchInput, FilterPicker, ToggleSwitch, ScreenShell, MobileFrame, AppHeader.
5. Update feature components: SegmentedTabs, ToggleRow, IconActionButton, FloatingActionButton, OperationRow, MemberCard, CustomerCard, BookingDetailCard, BookingTimelinePreview, DayChipRow, DateSelectorPill, ServiceSelectionCard, HistoryBookingRow, SwipeConfirmationModal, DeclineReasonModal, DualActionFooter, StickyCta, FormShell, SelectorInput, CalendarModal, BookingTypeToggle, ActivityCard, QueueStatCard, MetricCard, ShortcutTile, BarbershopSwitcherModal, WorkspacePill.
6. Update key screens: HomeDashboardScreen, ServicesManagementScreen, ServiceDetailScreen, BarbershopSettingsScreen, BookingDetailScreen, ScheduleActiveBookingsScreen, BookingRequestsScreen, HistoryBookingsScreen, NewAppointmentScreen, NewWalkInScreen, SelectServicesScreen, SelectBarberScreen, AnalyticsOverviewScreen, CustomerManagementScreen, BarbersManagementScreen, OpenHoursScreen, BookingPreferencesScreen, UserProfileScreen, auth screens, onboarding screens, workspace screens.
7. Run `npx tsc --noEmit` and fix any type errors.
8. Verify visually by running the web dev server and checking major flows.

## Status
- [x] Color tokens updated
- [x] Typography scale updated
- [x] Neumorphic style utilities created
- [x] Shared components updated
- [x] Feature components updated
- [x] Screens updated
- [x] TypeScript check passed
- [ ] Visual review completed
