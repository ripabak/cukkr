# Cukkr Backlog Tasks

> Last updated: 2026-07-21

---

## TASK-001 · UI Consistency & Display Polish

**Description:**
Several screens across `cukkr-frontend` need visual adjustments to improve consistency and polish. The create barbershop logo upload currently uses a rectangular `ImageUploadBox` (full-width, height 60) — it should be a large square where the preview height matches the width (`aspectRatio: 1`). The user profile page shows initials as a placeholder when no avatar is set — it should use the same camera-icon placeholder as `ServiceDetailScreen` to signal that an upload is possible. The `ServiceDetailScreen` overflow menu currently has an "Edit Service" option that navigates to a full-form `AddOrEditServiceScreen` — this should be replaced with inline editing via `InfoRow` onPress (same pattern as `BarbershopSettingsScreen` → `EditBarbershopInfoScreen`), and `AddOrEditServiceScreen` should become add-only. The add-service button icon in `ServicesManagementScreen` is too small (36×36) compared to the back button (40×40). The notification and profile buttons in `HomeDashboardScreen` are undersized (34×34), and the header typography feels flat — it needs larger font sizes and letterSpacing.

**Implementation Plan:**

### A. Create Barbershop Logo Upload — Square Preview
- [x] In `cukkr-frontend/src/features/workspace/screens/CreateBarbershopNameLogoScreen.tsx`, remove the `<ImageUploadBox>` usage and replace it with a custom square `TouchableOpacity` using `width: '100%'` and `aspectRatio: 1` (or `height` dynamically set to match measured width).
- [x] When no image is selected (`logoPreviewUri` is undefined), show a placeholder with a camera icon (`Ionicons` `camera-outline`, size 24) centered in a bordered square — same style as `serviceImagePlaceholder` in `ServiceDetailScreen`.
- [x] When an image is selected, show the preview via `<Image source={{ uri: logoPreviewUri }}>` filling the square with `contentFit="cover"` and `borderRadius: 16`.
- [x] Keep the `label` text above the image picker as-is.

### B. Profile Page — Camera Icon Placeholder
- [x] In `cukkr-frontend/src/features/profile/screens/UserProfileScreen.tsx`, change the avatar placeholder (currently initials in a circle) to match the `serviceImagePlaceholder` from `ServiceDetailScreen`: an 80×80 box with `borderRadius: 16`, `backgroundColor: Colors.bg.surface`, `borderWidth: 1.5`, `borderColor: Colors.border.default`, containing a centered `<Ionicons name="camera-outline" size={24} color={Colors.icon.muted} />`.
- [x] The existing `avatarImage` style (80×80, currently `borderRadius: 60`) should also change to `borderRadius: 16` to match the placeholder shape.

### C. Service Detail — Inline Editing (Remove Edit from Overflow Menu)
- [x] Create `cukkr-frontend/src/features/barbershop/screens/EditServiceInfoScreen.tsx` following the exact pattern of `EditBarbershopInfoScreen.tsx`. Accept a `mode` query param: `"name"`, `"description"`, `"price"`, `"duration"`, `"discount"`. Use `useServiceById(serviceId)` for initial data and `useUpdateService()` for saving. Wrap save with `<Permission roles={["owner", "admin"]}>`. Include `EditFieldHeader` and `HelperCopy` for each mode.
- [x] Create route `cukkr-frontend/app/d/(barbershop)/edit-service-info.tsx` that renders `EditServiceInfoScreen`. Pass `mode` and `serviceId` via query params.
- [x] In `cukkr-frontend/src/features/barbershop/screens/ServiceDetailScreen.tsx`:
  - [x] Remove the "Edit Service" item from the `OverflowMenu` — keep only "Delete".
  - [x] Change `InfoRow` for name (`t("services.serviceName")`) to add an `onPress` that navigates to `/d/edit-service-info` with `{ mode: "name", serviceId }`.
  - [x] Change `InfoRow` for description to add an `onPress` that navigates with `{ mode: "description", serviceId }`.
  - [x] Change `InfoRow` for duration to add an `onPress` that navigates with `{ mode: "duration", serviceId }`.
  - [x] Change `InfoRow` for price to add an `onPress` that navigates with `{ mode: "price", serviceId }`.
  - [x] Change `InfoRow` for discount to add an `onPress` that navigates with `{ mode: "discount", serviceId }`.
  - [x] All new `onPress` handlers must be wrapped with `<Permission roles={["owner", "admin"]}>` — pass `onPress={canManage ? handleEdit... : undefined}`.

### D. AddOrEditServiceScreen → AddServiceScreen (Add-Only)
- [x] In `cukkr-frontend/src/features/barbershop/screens/AddOrEditServiceScreen.tsx`:
  - [x] Remove all edit-mode logic: remove `isEdit` state, `useServiceById()`, `useUpdateService()`, `useEffect` for initialization, and the edit branch in `handleSubmit`.
  - [x] Remove `ServiceForm` and replace the image upload section with the same 80×80 square placeholder as `ServiceDetailScreen` (camera icon, `borderRadius: 16`). When an image is uploaded, show the preview at the same 80×80 size.
  - [x] Add form fields directly: `TextInputField` for name, `MultilineInputField` for description, `PriceInput` for price, `LabeledInput` for duration, and `ToggleRow` for active.
  - [x] The screen title should be `t("services.addService")`.
  - [x] Keep `useUploadServiceImage` — but note it requires a `serviceId` which doesn't exist yet at add time. Move the image upload to happen after the service is created (upload in `onSuccess` of `createService`), or defer: store the picked file in a ref and upload after service creation succeeds.
- [x] Remove the `ServiceForm` component if it is no longer used anywhere else. Check that `CreateBarbershopFirstServiceScreen` in `workspace/` does not import `ServiceForm`.

### E. ServicesManagementScreen — Add Button Icon Size
- [x] In `cukkr-frontend/src/features/barbershop/screens/ServicesManagementScreen.tsx`, change `IconActionButton` `size` prop from `36` to `40` so it matches the back button (40×40) and filter button (40×40).

### F. HomeDashboardScreen — Button Sizes & Header Typography
- [x] In `cukkr-frontend/src/features/home/screens/HomeDashboardScreen.tsx`:
  - [x] Change `notifBtn` style: `width`/`height` from `34` to `40`, `borderRadius` from `17` to `20`. Increase the `Ionicons` size from `18` to `20`.
  - [x] Change `profileBtn` style: `width`/`height` from `34` to `40`, `borderRadius` from `17` to `20`.
  - [x] Change `profileAvatar` style: `width`/`height` from `34` to `40`, `borderRadius` from `17` to `20`.
  - [x] Change `profileInitials` font size from `12` to `14`.
  - [x] Improve typography: increase `greetingName` `fontSize` from `18` to `22` and add `letterSpacing: -0.5`. Increase `shopName` `fontSize` from `13` to `14` and `fontWeight` from `"600"` to `"700"`, add `letterSpacing: -0.3`.
  - [x] Change `greetingSmall` `fontSize` from `12` to `13`.
  - [x] Change `openHoursTitle` `fontSize` from `11` to `12` and `fontWeight` from `"500"` to `"600"`.

**Manual Verification (Human Checklist):**
- [ ] Open the create barbershop flow (`/d/create-barbershop-name-logo`). Verify the logo upload area is a full-width square. Tap it and select a photo — verify the uploaded photo fills the square.
- [ ] Navigate to Profile (`/d/user-profile`). Without an avatar, verify the placeholder shows a camera icon in a square box (not initials). Upload an avatar and verify it displays as a square preview.
- [ ] Navigate to Services Management (`/d/services-management`). Verify the add (+) button is the same size as the back button and filter button, and the icon is well-proportioned.
- [ ] Tap a service to open Service Detail. Verify the 3-dot overflow menu no longer shows "Edit Service" — only "Delete". Verify tapping each field row (name, description, price, duration, discount) navigates to an edit screen. Edit a value, save, and return — verify the detail screen reflects the change.
- [ ] Tap the + button to add a new service. Verify the image picker matches the Service Detail style (80×80 square with camera icon). Verify the form fields work and creating a service succeeds.
- [ ] Open the Home Dashboard. Verify the notification bell and profile avatar buttons are larger (40×40, matching the back button size). Verify the greeting text ("Halo, ...") is larger and feels more prominent. Verify the barbershop name in the header is bolder and has better spacing.

**Tags:** `cukkr-frontend`
