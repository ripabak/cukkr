# Role-Based Access Control — Audit & Documentation

> **Last updated:** 2026-06-30  
> **Audit scope:** Backend handlers (`requireRoles` / `requireAuth` / `requireOrganization` macros) dan frontend guards (`<Permission>` / `useMemberRole` / inline checks)

---

## 1. Role Hierarchy

| Role | Level | Deskripsi |
|------|-------|-----------|
| `owner` | Full Control | Buat/hapus barbershop, invite/remove barber, kelola layanan, jam operasional, analytics, semua operasi booking |
| `admin` | Management | Semua operasi owner **kecuali**: hapus barbershop, upload logo/image, ganti timezone. Bisa CRUD layanan, kelola jam operasional, lihat analytics, accept/decline booking |
| `member` | Staff (Barber) | View-only services & analytics. Bisa buat booking, update status booking (start/complete/cancel), lihat info customer, generate walk-in PIN, lihat jam operasional |

### Macro Backend

| Macro | Enforce | Context |
|-------|---------|---------|
| `requireAuth: true` | Session valid (user login) | `user` |
| `requireOrganization: true` | Active organization + auth | `activeOrganizationId` |
| `requireRoles: ['owner'\|'admin'\|'member']` | Auth + org + role DB check | `user`, `activeOrganizationId` |

> **Catatan:** `requireOrganization` tanpa `requireAuth` eksplisit tetap melakukan auth check secara implisit — bedanya hanya semantik: `requireOrganization` = "semua member organisasi", `requireRoles` = "role spesifik".

---

## 2. Tabel Per Endpoint

### 2.1 Services (`/api/services`)

| # | Endpoint | Method | Backend Macro | Backend Role | Frontend Guard | Frontend Role | Status |
|---|----------|--------|---------------|-------------|----------------|---------------|--------|
| 1 | `/api/services/` | `POST` | `requireRoles` | `owner, admin` | `<Permission roles={["owner","admin"]}>` on Add (+) button<br>`services-management-screen.tsx:74` | `owner, admin` | ✅ |
| 2 | `/api/services/` | `GET` | `requireOrganization` | semua member | Tidak ada (semua bisa lihat) | semua | ✅ |
| 3 | `/api/services/:id` | `GET` | `requireOrganization` | semua member | Tidak ada (semua bisa lihat) | semua | ✅ |
| 4 | `/api/services/:id` | `PATCH` | `requireRoles` | `owner, admin` | `<Permission roles={["owner","admin"]}>` on overflow menu (Edit)<br>`service-detail-screen.tsx:103` | `owner, admin` | ✅ |
| 5 | `/api/services/:id` | `DELETE` | `requireRoles` | `owner, admin` | `<Permission roles={["owner","admin"]}>` on overflow menu (Delete)<br>`service-detail-screen.tsx:103` | `owner, admin` | ✅ |
| 6 | `/api/services/:id/toggle-active` | `PATCH` | `requireRoles` | `owner, admin` | `<Permission roles={["owner","admin"]}>` on Operational Details card<br>`canManage` → `onToggleActive={undefined}` for barber<br>`service-detail-screen.tsx:167`, `services-management-screen.tsx:39,137` | `owner, admin` | ✅ |
| 7 | `/api/services/:id/set-default` | `PATCH` | `requireRoles` | `owner, admin` | `<Permission roles={["owner","admin"]}>` on Operational Details card<br>`service-detail-screen.tsx:167` | `owner, admin` | ✅ |
| 8 | `/api/services/:id/image` | `POST` | `requireRoles` | `owner` only | ❌ **Tidak ada guard** | — | 🔴 |

### 2.2 Barbershop (`/api/barbershop`)

| # | Endpoint | Method | Backend Macro | Backend Role | Frontend Guard | Frontend Role | Status |
|---|----------|--------|---------------|-------------|----------------|---------------|--------|
| 1 | `/api/barbershop/` | `GET` | `requireOrganization` | semua member | Tidak ada (semua bisa lihat) | semua | ✅ |
| 2 | `/api/barbershop/settings` | `PATCH` | `requireRoles` | `owner` only | ❌ **Tidak ada guard** — `EditBarbershopInfoScreen` bisa diakses semua role, tombol save selalu tampil | — | 🔴 |
| 3 | `/api/barbershop/timezone` | `PATCH` | `requireRoles` | `owner` only | ❌ **Tidak ada guard** | — | 🔴 |
| 4 | `/api/barbershop/logo` | `POST` | `requireRoles` | `owner` only | ❌ **Tidak ada guard** — camera badge di `BarbershopSettingsScreen` tampil untuk semua role (alert: "soon") | — | 🔴 |
| 5 | `/api/barbershop/:orgId/leave` | `DELETE` | `requireAuth` | semua (user-scoped) | `isOwner` → delete (owner) vs leave (non-owner)<br>`barbershop-settings-screen.tsx:25,34` | `owner` vs lainnya | ✅ |
| 6 | `/api/barbershop/slug-check/` | `GET` | *(public)* | public | N/A (public endpoint) | — | ✅ |

### 2.3 Open Hours (`/api/open-hours`)

| # | Endpoint | Method | Backend Macro | Backend Role | Frontend Guard | Frontend Role | Status |
|---|----------|--------|---------------|-------------|----------------|---------------|--------|
| 1 | `/api/open-hours/` | `GET` | `requireAuth` + `requireOrganization` | semua member | Tidak ada (semua bisa lihat) | semua | ✅ |
| 2 | `/api/open-hours/` | `PUT` | `requireRoles` | `owner` only | ❌ **Tidak ada guard** — tombol "Save Hours" tampil & aktif untuk semua role di `OpenHoursScreen` | — | 🔴 |

> ⚠️ **Discrepancy:** AGENTS.md backend menyebut admin bisa *"manage open hours"*, tapi backend membatasi ke `owner` saja dengan `requireRoles: ['owner']`. Perlu klarifikasi apakah seharusnya `['owner', 'admin']`.

### 2.4 Analytics (`/api/analytics`)

| # | Endpoint | Method | Backend Macro | Backend Role | Frontend Guard | Frontend Role | Status |
|---|----------|--------|---------------|-------------|----------------|---------------|--------|
| 1 | `/api/analytics/` | `GET` | `requireAuth` + `requireOrganization` | semua member | Tidak ada | semua | ✅ |
| 2 | `/api/analytics/revenue` | `GET` | `requireAuth` + `requireOrganization` | semua member | Tidak ada | semua | ✅ |
| 3 | `/api/analytics/revenue/bookings` | `GET` | `requireAuth` + `requireOrganization` | semua member | Tidak ada | semua | ✅ |
| 4 | `/api/analytics/customers` | `GET` | `requireAuth` + `requireOrganization` | semua member | Tidak ada | semua | ✅ |
| 5 | `/api/analytics/customers/list` | `GET` | `requireAuth` + `requireOrganization` | semua member | Tidak ada | semua | ✅ |
| 6 | `/api/analytics/barbers` | `GET` | `requireAuth` + `requireOrganization` | semua member | Tidak ada | semua | ✅ |
| 7 | `/api/analytics/barbers/list` | `GET` | `requireAuth` + `requireOrganization` | semua member | Tidak ada | semua | ✅ |
| 8 | `/api/analytics/services` | `GET` | `requireAuth` + `requireOrganization` | semua member | Tidak ada | semua | ✅ |
| 9 | `/api/analytics/services/list` | `GET` | `requireAuth` + `requireOrganization` | semua member | Tidak ada | semua | ✅ |

> **Catatan:** AGENTS.md backend menyebut `member`: *"View-only for services & analytics"*. Karena semua 9 endpoint analytics adalah `GET` (read-only), maka `requireAuth + requireOrganization` sudah tepat — semua role boleh **melihat** analytics. **Bukan gap.**

### 2.5 Bookings (`/api/bookings`)

| # | Endpoint | Method | Backend Macro | Backend Role | Frontend Guard | Frontend Role | Status |
|---|----------|--------|---------------|-------------|----------------|---------------|--------|
| 1 | `/api/bookings/` | `POST` | `requireAuth` + `requireOrganization` | semua member | Tidak ada | semua | ✅ |
| 2 | `/api/bookings/summary` | `GET` | `requireAuth` + `requireOrganization` | semua member | Tidak ada | semua | ✅ |
| 3 | `/api/bookings/date-markers` | `GET` | `requireAuth` + `requireOrganization` | semua member | Tidak ada | semua | ✅ |
| 4 | `/api/bookings/requests` | `GET` | `requireAuth` + `requireOrganization` | semua member | Tidak ada | semua | ✅ |
| 5 | `/api/bookings/` | `GET` | `requireAuth` + `requireOrganization` | semua member | Tidak ada | semua | ✅ |
| 6 | `/api/bookings/events` | `GET` | `requireAuth` + `requireOrganization` | semua member | Tidak ada | semua | ✅ |
| 7 | `/api/bookings/in-progress` | `GET` | `requireAuth` + `requireOrganization` | semua member | Tidak ada | semua | ✅ |
| 8 | `/api/bookings/:id` | `GET` | `requireAuth` + `requireOrganization` | semua member | Tidak ada | semua | ✅ |
| 9 | `/api/bookings/:id/status` | `PATCH` | `requireAuth` + `requireOrganization` | semua member | Tidak ada | semua | ✅ |
| 10 | `/api/bookings/:id/accept` | `POST` | `requireAuth` + `requireOrganization` | semua member | Tidak ada | semua | ✅ |
| 11 | `/api/bookings/:id/decline` | `POST` | `requireAuth` + `requireOrganization` | semua member | Tidak ada | semua | ✅ |
| 12 | `/api/bookings/:id/reassign` | `PATCH` | `requireAuth` + `requireOrganization` | semua member | Tidak ada | semua | ✅ |

> **Catatan:** Sesuai AGENTS.md, semua role bisa melakukan operasi booking. Tidak ada gap.

### 2.6 Barbers (`/api/barbers`)

| # | Endpoint | Method | Backend Macro | Backend Role | Frontend Guard | Frontend Role | Status |
|---|----------|--------|---------------|-------------|----------------|---------------|--------|
| 1 | `/api/barbers/` | `GET` | `requireAuth` + `requireOrganization` | semua member | Tidak ada (semua bisa lihat) | semua | ✅ |
| — | **Invite Barber** | *(Better Auth)* | — | *(owner only per spec)* | ❌ **Tidak ada guard** — tombol "Invite Barber" di `BarbersManagementScreen` tampil untuk semua role | — | 🔴 |
| — | **Remove Barber** | *(Better Auth)* | — | *(owner only per spec)* | `isOwner` check per-member → hide remove button untuk owner dirinya sendiri<br>`barbers-management-screen.tsx:116` | Owner tidak bisa remove diri sendiri | 🟡 |

### 2.7 Customer Management (`/api/customers`)

| # | Endpoint | Method | Backend Macro | Backend Role | Frontend Guard | Frontend Role | Status |
|---|----------|--------|---------------|-------------|----------------|---------------|--------|
| 1 | `/api/customers/` | `GET` | `requireAuth` + `requireOrganization` | semua member | Tidak ada | semua | ✅ |
| 2 | `/api/customers/:id` | `GET` | `requireAuth` + `requireOrganization` | semua member | Tidak ada | semua | ✅ |
| 3 | `/api/customers/:id/bookings` | `GET` | `requireAuth` + `requireOrganization` | semua member | Tidak ada | semua | ✅ |
| 4 | `/api/customers/:id/notes` | `PATCH` | `requireAuth` + `requireOrganization` | semua member | Tidak ada | semua | ✅ |

### 2.8 Walk-In PIN (`/api/pin`)

| # | Endpoint | Method | Backend Macro | Backend Role | Frontend Guard | Frontend Role | Status |
|---|----------|--------|---------------|-------------|----------------|---------------|--------|
| 1 | `/api/pin/generate` | `POST` | `requireAuth` + `requireOrganization` | semua member | Tidak ada | semua | ✅ |
| 2 | `/api/pin/current` | `GET` | `requireAuth` + `requireOrganization` | semua member | Tidak ada | semua | ✅ |

### 2.9 Notifications (`/api/notifications`)

| # | Endpoint | Method | Backend Macro | Backend Role | Frontend Guard | Status |
|---|----------|--------|---------------|-------------|----------------|--------|
| 1–10 | Semua endpoint notifikasi | GET/POST/PATCH/DELETE | `requireAuth` | User-scoped | N/A (data milik user sendiri) | ✅ |
| — | `/api/notifications/vapid-public-key` | `GET` | *(public)* | public | N/A | ✅ |

### 2.10 User Profile (`/api/me`)

| # | Endpoint | Method | Backend Macro | Backend Role | Frontend Guard | Status |
|---|----------|--------|---------------|-------------|----------------|--------|
| 1 | `/api/me/` | `GET` | `requireAuth` | User-scoped | N/A | ✅ |
| 2 | `/api/me/` | `PATCH` | `requireAuth` | User-scoped | N/A | ✅ |
| 3 | `/api/me/avatar` | `POST` | `requireAuth` | User-scoped | N/A | ✅ |

---

## 3. Ringkasan Gap

### 🔴 Gap Frontend (backend sudah batasi, frontend belum ada guard)

| # | Area | Aktivitas | Backend Role | File Frontend |
|---|------|-----------|-------------|---------------|
| F1 | Services | Upload gambar layanan | `owner` only | Tidak ada guard di `ServiceDetailScreen` — tombol kamera tampil untuk semua |
| F2 | Barbershop | Update settings (name, deskripsi, alamat) | `owner` only | `EditBarbershopInfoScreen` — tombol save tampil untuk semua role |
| F3 | Barbershop | Update timezone | `owner` only | Belum ada screen/timezone UI yang teridentifikasi |
| F4 | Barbershop | Upload logo | `owner` only | Camera badge di `BarbershopSettingsScreen` tampil untuk semua role |
| F5 | Open Hours | Update jam operasional | `owner` only (lihat catatan) | `OpenHoursScreen` — tombol "Save Hours" tampil untuk semua role |
| F6 | Barbers | Invite barber | `owner` only (per AGENTS.md) | `BarbersManagementScreen` — tombol "Invite Barber" tampil untuk semua role |

### 🟡 Discrepancy Backend vs AGENTS.md

| # | Area | Backend | AGENTS.md | Rekomendasi |
|---|------|---------|-----------|-------------|
| D1 | Open Hours PUT | `requireRoles: ['owner']` | Admin bisa *"manage open hours"* | Harusnya `['owner', 'admin']` |

### 🟡 Partial Frontend Guard

| # | Area | Kondisi Saat Ini | Ideal |
|---|------|-----------------|-------|
| P1 | Remove Barber | Owner tidak bisa remove diri sendiri (sudah benar). Tapi admin/member bisa remove orang lain (tidak dicek) | Seharusnya hanya owner yang bisa remove barber manapun |

---

## 4. Ringkasan Statistik

| Kategori | Jumlah |
|----------|--------|
| Total endpoint backend | 72 |
| Endpoint dengan `requireRoles` | 13 |
| Endpoint dengan `requireAuth` + `requireOrganization` | 47 |
| Endpoint dengan `requireAuth` saja | 12 |
| Endpoint public | 3 |
| **Frontend guards (<Permission> + inline checks)** | 9 |
| **Gap frontend (belum ada guard)** | 6 |
| **Discrepancy backend vs AGENTS.md** | 1 |
| **Partial guard** | 1 |

---

## 5. Rekomendasi Perbaikan

### Prioritas Tinggi

1. **F2 — `EditBarbershopInfoScreen`:** Wrap screen atau tombol save dengan `<Permission roles={["owner"]}>`. Member/admin yang mencoba save akan dapat error 403 dari backend, tapi UX lebih baik jika UI-nya tidak menampilkan opsi yang tidak bisa dipakai.

2. **F5 — `OpenHoursScreen`:** Wrap tombol "Save Hours" dengan `<Permission roles={["owner"]}>` (atau `['owner', 'admin']` setelah D1 diklarifikasi).

3. **D1 — Open Hours backend:** Ubah `requireRoles: ['owner']` menjadi `requireRoles: ['owner', 'admin']` di `cukkr-backend/src/modules/open-hours/handler.ts:55` jika memang admin seharusnya bisa manage open hours.

### Prioritas Menengah

4. **F1 — Service image upload:** Wrap tombol kamera/image upload dengan `<Permission roles={["owner"]}>`.

5. **F4 — Barbershop logo upload:** Wrap camera badge dengan `<Permission roles={["owner"]}>`.

6. **F6 — Invite barber:** Wrap tombol "Invite Barber" di `BarbersManagementScreen` dengan `<Permission roles={["owner"]}>`.

7. **P1 — Remove barber:** Sembunyikan tombol remove untuk **semua role kecuali owner**, tidak hanya untuk owner dirinya sendiri.

### Prioritas Rendah

8. **F3 — Timezone:** Belum ada UI timezone di frontend. Saat ditambahkan nanti, beri guard `<Permission roles={["owner"]}>`.
