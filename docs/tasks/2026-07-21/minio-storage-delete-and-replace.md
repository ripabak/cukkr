# Cukkr Backlog Tasks

> Last updated: 2026-07-21

---

## TASK-014 · MinIO Storage Utility — Delete & Replace Images

**Description:**
The current `StorageClient` in `cukkr-backend/src/lib/storage.ts` only supports `upload()` and `getPublicUrl()`. When a user uploads a new image (logo, service image, or avatar), the old file remains in MinIO indefinitely — consuming storage space with orphaned objects that no database record references. Additionally, the new image gets a fresh `nanoid()`-based key, so the URL changes and browser cache is naturally busted, but the old file is never cleaned up. This task extends the `StorageClient` interface with a `delete()` method, implements it in both `S3CompatibleStorageClient` (using `DeleteObjectCommand`) and `TestStorageClient` (no-op), adds a helper `extractStorageKey()` to parse the object key from a stored URL, and modifies the three existing upload methods to delete the previous image file after a successful new upload. No shared validation utility, image processing, or dedicated delete API endpoints are included in this scope.

**Implementation Plan:**
- [x] Add `delete(key: string): Promise<void>` to the `StorageClient` interface in `cukkr-backend/src/lib/storage.ts`.
- [x] Implement `delete()` in `S3CompatibleStorageClient` using `DeleteObjectCommand` from `@aws-sdk/client-s3`, matching the existing bucket and client setup.
- [x] Implement `delete()` in `TestStorageClient` as a no-op (void the key parameter to avoid lint warnings).
- [x] Import `DeleteObjectCommand` at the top of `cukkr-backend/src/lib/storage.ts`.
- [x] Add a helper function `extractStorageKey(url: string): string | null` in `cukkr-backend/src/lib/storage.ts` that parses a MinIO URL of the form `{endpoint}/{bucket}/{key}` and returns the `key` portion, or `null` if the URL is empty or not parseable.
- [x] In `BarbershopService.uploadLogo()` (`cukkr-backend/src/modules/barbershop/service.ts`), after the new upload succeeds: query the current `logoUrl` from `barbershopSettings`, call `extractStorageKey(oldLogoUrl)`, and if a key is returned, `await storageClient.delete(oldKey)`.
- [x] In `ServiceService.uploadServiceImage()` (`cukkr-backend/src/modules/services/service.ts`), after the new upload succeeds: read the current `imageUrl` from the fetched service row, call `extractStorageKey(oldImageUrl)`, and if a key is returned, `await storageClient.delete(oldKey)`.
- [x] In `UserProfileService.uploadAvatar()` (`cukkr-backend/src/modules/user-profile/service.ts`), after the new upload succeeds: read the current `image` from the user row (already fetched via `returning`), call `extractStorageKey(oldImage)`, and if a key is returned, `await storageClient.delete(oldKey)`.
- [x] Run `bun run lint:fix && bun run format` in `cukkr-backend/`.
- [x] Run `bun test --env-file=.env` in `cukkr-backend/` and verify all existing upload tests still pass.
- [x] Files to modify: `cukkr-backend/src/lib/storage.ts`, `cukkr-backend/src/modules/barbershop/service.ts`, `cukkr-backend/src/modules/services/service.ts`, `cukkr-backend/src/modules/user-profile/service.ts`.

**Manual Verification (Human Checklist):**
- [ ] Start the backend dev server (`bun run dev` in `cukkr-backend/`) with MinIO running and configured in `.env`.
- [ ] Upload a logo via `POST /api/barbershop/logo`, then upload a different logo — verify the MinIO bucket only contains the latest logo file (the old one is deleted).
- [ ] Upload a service image via `POST /api/services/:id/image`, then upload a different image — verify the old service image is deleted from MinIO.
- [ ] Upload an avatar via `POST /api/me/avatar`, then upload a different avatar — verify the old avatar is deleted from MinIO.
- [ ] Check the test suite (`bun test --env-file=.env`) still passes with no failures related to upload or storage.

**Tags:** `cukkr-backend`
