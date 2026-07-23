# Image Compression Upload

> **Status:** pending  
> **Created:** 2026-07-21  
> **Scope:** cukkr-backend + cukkr-frontend

## Overview

Terapkan compression image di frontend (client-side) dan backend (server-side) untuk upload gambar logo barbershop, photo user profile (avatar), dan service image.

Saat ini gambar diupload apa adanya tanpa resize/compress. Foto kamera 4000x3000px dikirim utuh ke server.

---

## Decisions Summary

### Core Architecture

| Item | Choice |
|---|---|
| Compression location | Both (Frontend + Backend) |
| Output format | Always WebP |
| Backend library | `sharp` |
| Frontend library | `expo-image-manipulator` (new API: `useImageManipulator` / `ImageManipulator.manipulate()`) |

### Compression Parameters

| Item | Service Image | Logo | Avatar |
|---|---|---|---|
| Thumbnail | 200px | 150px | 48px |
| Medium | 600px | 300px | 150px |
| Full | 1200px | 600px | 400px |
| Backend quality | 80 | 80 | 80 |
| Frontend max resize | 1200px (longest side) | 1200px | 1200px |
| Frontend max file size | 1 MB | 1 MB | 1 MB |
| Frontend compress value | 0.8 | 0.8 | 0.8 |

### Storage & DB

| Item | Choice |
|---|---|
| Storage key convention | `{nanoid}_thumb.webp`, `{nanoid}_med.webp`, `{nanoid}_full.webp` |
| DB schema | 3 kolom per gambar: `*_thumb`, `*_med`, `*_full` |
| Keep original file | No |
| Backfill existing images | No |
| S3 Metadata | `Cache-Control: public, max-age=31536000, immutable` |

### UX

| Item | Choice |
|---|---|
| Upload flow | Pick → resize & compress otomatis → upload langsung |
| New dependency | `expo-image-manipulator` (SDK 55, support Web + WebP) |

---

## Implementation Steps

### Step 1: Install Dependencies

**Backend:**
```bash
cd cukkr-backend && bun add sharp
```

**Frontend:**
```bash
cd cukkr-frontend && npx expo install expo-image-manipulator
```

---

### Step 2: Backend — Image Processing Service

Buat shared image processing module di backend:

**`cukkr-backend/src/lib/image-processor.ts`**

- `generateVariants(buffer: Uint8Array, sizes: SizeConfig[]): Promise<ImageVariant[]>`
  - Input: raw image buffer
  - Resize ke 3 ukuran dengan sharp `.resize({ width, height, fit: 'inside', withoutEnlargement: true })`
  - Output: WebP quality 80 dengan `.webp({ quality: 80 })`
  - Return array of `{ buffer, width, height, suffix }`

- `SizeConfig` type:
  ```ts
  type SizeConfig = { suffix: string; width: number; height?: number };
  ```

- `IMAGE_VARIANTS` config per image type:
  - `service`: `[{ suffix: 'thumb', width: 200 }, { suffix: 'med', width: 600 }, { suffix: 'full', width: 1200 }]`
  - `logo`: `[{ suffix: 'thumb', width: 150 }, { suffix: 'med', width: 300 }, { suffix: 'full', width: 600 }]`
  - `avatar`: `[{ suffix: 'thumb', width: 48 }, { suffix: 'med', width: 150 }, { suffix: 'full', width: 400 }]`

---

### Step 3: Backend — Storage Client Update

Modify `cukkr-backend/src/lib/storage.ts`:

- Tambah `options?: { cacheControl?: string }` ke method `upload()`
- Set `CacheControl: 'public, max-age=31536000, immutable'` di S3 PutObject command

---

### Step 4: Backend — Update Upload Services

Modify 3 service method:
- `cukkr-backend/src/modules/services/service.ts` → `uploadServiceImage()`
- `cukkr-backend/src/modules/barbershop/service.ts` → `uploadLogo()`
- `cukkr-backend/src/modules/user-profile/service.ts` → `uploadAvatar()`

Perubahan pada masing-masing:

1. Generate storage key untuk 3 variant: `services/{orgId}/{serviceId}/{nanoid}_thumb.webp`, `_med.webp`, `_full.webp`
2. Panggil `generateVariants(buffer, IMAGE_VARIANTS.service | logo | avatar)`
3. Upload semua 3 variant ke S3
4. Update DB dengan 3 kolom (lihat step 5)
5. Cleanup old images — `extractStorageKey` lalu delete semua 3 variant lama

---

### Step 5: Backend — Database Schema

**New columns** (migration):

| Table | New Columns | Old Column (kept for now) |
|---|---|---|
| `service` | `image_thumb`, `image_med`, `image_full` | `image_url` (deprecated, keep null) |
| `barbershop_settings` | `logo_thumb`, `logo_med`, `logo_full` | `logo_url` (deprecated, keep null) |
| `organization` | `logo_thumb`, `logo_med`, `logo_full` | `logo` (deprecated, keep null) |
| `user` | `image_thumb`, `image_med`, `image_full` | `image` (deprecated, keep null) |

**Migration:**
```bash
cd cukkr-backend && bun run db:generate
```

**Schema update:** Re-export di `drizzle/schemas.ts` dan update zod model types di masing-masing module.

---

### Step 6: Backend — Update Response Models

Update model response:

```ts
// Before
imageUrl: string | null

// After
imageUrl: string | null   // keep for backward compat (return full variant)
imageThumb: string | null
imageMed: string | null
imageFull: string | null
```

Terapkan ke:
- `cukkr-backend/src/modules/services/model.ts` → `ServiceResponse`
- `cukkr-backend/src/modules/barbershop/model.ts` → `BarbershopResponse`
- `cukkr-backend/src/modules/user-profile/model.ts` → `UserProfileResponse`

---

### Step 7: Backend — Update GET Endpoints

Pastikan endpoints GET return ketiga kolom variant.

---

### Step 8: Backend — Tests

Update test yang sudah ada untuk verify:
- Tiap upload menghasilkan 3 variant di storage
- DB columns terisi 3 URL
- Delete lama menghapus 3 file
- Variant sizes sesuai config

---

### Step 9: Frontend — Image Compression Utility

Buat `cukkr-frontend/src/utils/compress-image.ts`:

```ts
import { ImageManipulator } from 'expo-image-manipulator';

async function compressImage(uri: string): Promise<{ uri: string; width: number; height: number; name: string; type: string }>
```

Logic:
1. `ImageManipulator.manipulate(uri)`
2. `.resize({ width: 1200 })` — resize to max 1200px, auto height based on ratio
3. `.renderAsync()`
4. `.saveAsync({ format: 'webp', compress: 0.8 })`
5. Return result dengan name `image.webp` dan type `image/webp`

Call `compressImage()` di `pickImage()` atau service method sebelum upload.

---

### Step 10: Frontend — Upload Services Update

Update 3 service files di `cukkr-frontend/src/features/`:
- `barbershop/services/barbershop.service.ts` → `uploadLogo()`
- `barbershop/services/services.service.ts` → `uploadImage()`
- `profile/services/profile.service.ts` → `uploadAvatar()`

Tambahkan step `compressImage()` setelah `pickImage()`, sebelum upload. Update handling untuk return type yang punya 3 URL.

---

### Step 11: Frontend — Types Sync

```bash
cd cukkr-frontend && bunx type-share-eden-elysia sync http://localhost:3000/types/app.d.ts
```

Pastikan type Eden Treaty terupdate dengan 3 kolom image.

---

### Step 12: Frontend — UI Component Update

Update `ImageUploadBox` dan screen yang consume image URL untuk menggunakan variant yang tepat:
- List/card view → `_thumb`
- Detail/medium view → `_med`
- Full screen → `_full`

---

### Step 13: Frontend — Cleanup Workspace Duplicates

Hapus atau update dead code di `cukkr-frontend/src/features/workspace/`:
- `services/barbershop.service.ts` — stale uploadLogo
- `services/services.service.ts` — web-only upload
- `components/ImagePickerButton.tsx` — dead component

---

## Verification

- [ ] Backend: `bun test` semua passing
- [ ] Backend: Upload JPEG 4000x3000px → S3 berisi 3 file WebP dengan dimensi sesuai
- [ ] Backend: File di S3 punya header `Cache-Control: public, max-age=31536000, immutable`
- [ ] Frontend: Pick foto dari galeri di mobile → terkirim < 1MB
- [ ] Frontend: Pick foto dari galeri di web → terkirim < 1MB
- [ ] Frontend: Gambar tampil dengan ukuran sesuai di list vs detail
- [ ] Backend: Upload replace (logo/avatar) → old files dihapus dari S3
- [ ] Backend: Upload invalid MIME → 400 error
- [ ] Backend: Upload > 5MB → 413 error
