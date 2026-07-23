# Cukkr Backlog Tasks

> Last updated: 2026-07-21

---

## TASK-015 · Frontend Image Upload Integration — Logo, Service Image & Avatar

**Description:**
The backend already exposes three image upload endpoints — `POST /api/barbershop/logo`, `POST /api/services/:id/image`, and `POST /api/me/avatar` — all of which accept a `{ file: File }` body and return the uploaded image URL. However, the frontend has no image picker library installed and none of the upload flows are wired end-to-end. `BarbershopSettingsScreen` shows a camera badge that triggers an `Alert.alert` "coming soon" placeholder. `CreateBarbershopNameLogoScreen` renders an `ImageUploadBox` with a `console.log("TODO")` no-op. `AddOrEditServiceScreen` passes `onImagePress={() => {}}` (empty). `ServiceDetailScreen` shows a decorative camera badge with no handler. `UserProfileScreen` has a camera badge with no `onPress` and never displays `avatarUrl`. Only the profile mutation hook (`useUploadAvatar`) and service function (`profileService.uploadAvatar`) are already written; the service image upload function exists in the workspace feature but is unused in the barbershop feature. This task installs `react-native-image-picker`, creates a shared `pickImage()` utility and a shared `useImagePicker()` hook, adds per-feature upload service functions and TanStack Query mutation hooks, wires all five affected screens, updates i18n strings to remove "coming soon" placeholders, and ensures every upload flow shows toast feedback on success or error.

**Implementation Plan:**
- [x] Install `react-native-image-picker` in `cukkr-frontend/`: `npm install react-native-image-picker` (note: this project uses npm, not bun — see `package-lock.json`).
- [x] Add iOS permissions to `cukkr-frontend/app.json` (or `app.config.js`): `NSCameraUsageDescription` and `NSPhotoLibraryUsageDescription` with appropriate description strings.
- [x] Create `cukkr-frontend/src/utils/pick-image.ts` with a function `pickImage(maxSizeBytes: number): Promise<{ uri: string; fileName: string; type: string }>` that calls `launchImageLibrary` with `mediaType: 'photo'`, validates the selected asset size against `maxSizeBytes`, rejects oversized files with a descriptive error, and returns the asset's `uri`, `fileName`, and `type`.
- [x] Create `cukkr-frontend/src/hooks/useImagePicker.ts` with a function `useImagePicker(maxSizeBytes: number)` that wraps `pickImage()` and returns `{ pickAndGetFile, isPicking, pickError }` — where `pickAndGetFile()` triggers the picker and returns the file-like object or `null` if cancelled.
- [x] In `cukkr-frontend/src/features/barbershop/services/barbershop.service.ts`, add `uploadLogo(file: { uri: string; fileName: string; type: string }): Promise<{ logoUrl: string }>` that calls `app.api.barbershop.logo.post({ file })` with proper error handling (extract `error?.value?.message`).
- [x] In `cukkr-frontend/src/features/barbershop/hooks/index.ts`, add `useUploadLogo()` mutation hook using `useMutation` from TanStack Query — calls `barbershopService.uploadLogo()`, on success invalidates barbershop queries, returns `{ mutate, isPending, error }`.
- [x] In `cukkr-frontend/src/features/barbershop/screens/BarbershopSettingsScreen.tsx`, import `useImagePicker` and `useUploadLogo`, replace the `handleCameraBadge` `Alert.alert` placeholder with: call `pickAndGetFile()`, if file obtained call `mutate(file)`, show toast on success/error. Use `isPending` to disable the camera badge during upload.
- [x] In `cukkr-frontend/src/features/workspace/services/barbershop-create.service.ts` (or the appropriate workspace service), add `uploadLogo(file)` using the same pattern — or if no dedicated service file exists, add to the workspace service file that handles barbershop creation.
- [x] In `cukkr-frontend/src/features/workspace/screens/CreateBarbershopNameLogoScreen.tsx`, import `useImagePicker`, replace the `console.log("TODO")` `onPress` with actual picker logic that gets the file and stores it in `CreateBarbershopContext` (logo field already defined in context type).
- [x] In `cukkr-frontend/src/features/barbershop/services/services.service.ts`, add `uploadImage(serviceId: string, file: { uri: string; fileName: string; type: string }): Promise<{ imageUrl: string }>` that calls `app.api.services({ id: serviceId }).image.post({ file })`.
- [x] In `cukkr-frontend/src/features/barbershop/hooks/index.ts`, add `useUploadServiceImage(serviceId: string)` mutation hook — calls `uploadImage()`, on success invalidates service queries.
- [x] In `cukkr-frontend/src/features/barbershop/screens/AddOrEditServiceScreen.tsx`, import `useImagePicker` and `useUploadServiceImage`, replace `onImagePress={() => {}}` with actual pick + upload flow. Show toast feedback. Disable image press during upload.
- [x] In `cukkr-frontend/src/features/barbershop/screens/ServiceDetailScreen.tsx`, import `useImagePicker` and `useUploadServiceImage`, add `onPress` handler to the camera badge (line 128-132) that picks and uploads. Also render `service.imageUrl` inside the `serviceImage` view (replacing the always-gray placeholder) when an image URL is present.
- [x] In `cukkr-frontend/src/features/profile/screens/UserProfileScreen.tsx`, import `useImagePicker` from shared hooks, use the already-existing `useUploadAvatar()` mutation, add `onPress` to the camera badge (line 85). Also render `profile.avatarUrl` in the avatar circle when available (currently only shows initials fallback).
- [x] Update `cukkr-frontend/src/lib/i18n/locales/id.ts` and `cukkr-frontend/src/lib/i18n/locales/en.ts`:
  - Remove or replace `barbershop.logoComingSoon` key (no longer needed).
  - Add success toast keys: `toast.logoUploadSuccess`, `toast.imageUploadSuccess`, `toast.avatarUploadSuccess`.
  - Add error toast keys: `toast.imageTooLarge`, `toast.imageInvalidType`, `toast.imageUploadFailed`.
- [x] Run `npx tsc --noEmit` in `cukkr-frontend/` and fix any TypeScript errors.
- [x] Files to create: `cukkr-frontend/src/utils/pick-image.ts`, `cukkr-frontend/src/hooks/useImagePicker.ts`.
- [x] Files to modify: `cukkr-frontend/src/features/barbershop/services/barbershop.service.ts`, `cukkr-frontend/src/features/barbershop/services/services.service.ts`, `cukkr-frontend/src/features/barbershop/hooks/index.ts`, `cukkr-frontend/src/features/barbershop/screens/BarbershopSettingsScreen.tsx`, `cukkr-frontend/src/features/barbershop/screens/AddOrEditServiceScreen.tsx`, `cukkr-frontend/src/features/barbershop/screens/ServiceDetailScreen.tsx`, `cukkr-frontend/src/features/workspace/screens/CreateBarbershopNameLogoScreen.tsx`, `cukkr-frontend/src/features/profile/screens/UserProfileScreen.tsx`, `cukkr-frontend/src/lib/i18n/locales/id.ts`, `cukkr-frontend/src/lib/i18n/locales/en.ts`.

**Manual Verification (Human Checklist):**
- [ ] Start the backend dev server (`bun run dev` in `cukkr-backend/`) with MinIO running and configured.
- [ ] Start the frontend dev server (`npx expo start` in `cukkr-frontend/`).
- [ ] Navigate to Settings (gear icon) > tap the camera badge on the logo circle > pick an image from gallery > verify the logo updates in-place and shows success toast.
- [ ] During barbershop creation flow > Name & Logo step > tap the ImageUploadBox > pick an image > verify the preview shows the selected image.
- [ ] Navigate to Services > tap a service to edit or create a new service > tap the image upload box > pick an image > verify the image preview updates.
- [ ] Navigate to Service Detail screen > tap the camera badge on the service image > pick an image > verify the image displays and success toast appears.
- [ ] Navigate to User Profile screen > tap the camera badge on the avatar > pick an image > verify the avatar updates and appears in the circle (replacing initials).
- [ ] Try picking a file that exceeds 5MB — verify the picker rejects it with an appropriate toast/message.

**Tags:** `cukkr-frontend`
