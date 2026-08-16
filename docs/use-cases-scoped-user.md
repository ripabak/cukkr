# Use Cases per Role — Scoped User

> **Status:** Draft — item yang perlu diubah  
> **Last updated:** 2026-07-02  
> **Source:** Role-based Access Control Audit (`docs/role-based-access-control.md`)

---

## Changes Needed

### 1. Analytics — Member (Barber) lihat data diri sendiri saja

**Keputusan:** Barber cuma bisa lihat analytics diri sendiri (booking & revenue pribadi), bukan data seluruh tim.

Yang perlu diubah:
- Backend: filter analytics endpoints — kalo role `member`, cuma return data milik barber ybs
- Frontend: sesuaikan tampilan analytics untuk member

### 2. Open Hours — Admin manage jam operasional

**Keputusan:** Backend fix — ganti `requireRoles: ['owner']` jadi `['owner', 'admin']`.

Yang perlu diubah:
- Backend: `cukkr-backend/src/modules/open-hours/handler.ts:55` — tambah `'admin'`
- Frontend: OpenHoursScreen — tambah guard untuk owner & admin

---

## Use Cases per Role (Final)

### 1. Role: Owner

| Use Case | Scope |
|---|---|
| Membuat & menghapus barbershop | ✅ |
| Invite & remove barber | ✅ |
| CRUD layanan | ✅ |
| Upload logo & image layanan | ✅ |
| Ganti timezone | ✅ |
| Manage jam operasional | ✅ |
| Lihat analytics | Full (semua data) |
| Booking — semua operasi | ✅ |
| Walk-in PIN | ✅ |
| Customer management | ✅ |
| Update profil sendiri | ✅ |
| Leave barbershop | ✅ |

### 2. Role: Admin

| Use Case | Scope |
|---|---|
| CRUD layanan | ✅ |
| Manage jam operasional | ✅ |
| Lihat analytics | Full (semua data) |
| Booking — semua operasi | ✅ |
| Walk-in PIN | ✅ |
| Customer management | ✅ |
| Upload logo & image layanan | ❌ |
| Ganti timezone | ❌ |
| Hapus barbershop | ❌ |
| Invite & remove barber | ❌ |
| Update profil sendiri | ✅ |
| Leave barbershop | ✅ |

### 3. Role: Member (Barber)

| Use Case | Scope |
|---|---|
| Lihat layanan & jam operasional | ✅ (read-only) |
| Lihat analytics | ✅ Hanya data diri sendiri |
| Booking — semua operasi | ✅ |
| Walk-in PIN | ✅ |
| Customer management — lihat & edit notes | ✅ |
| CRUD layanan | ❌ |
| Manage jam operasional | ❌ |
| Upload logo & image | ❌ |
| Invite & remove barber | ❌ |
| Update profil sendiri | ✅ |
| Leave barbershop | ✅ |

### 3. Frontend Gaps — Semua Guard

**Keputusan:** Benerin semua 5 titik frontend (E1). Pasang guard buat masing-masing area.

| Area | Aktivitas | Guard |
|---|---|---|
| Edit barbershop info | Update name, deskripsi, alamat | `<Permission roles={["owner"]}>` |
| Open Hours screen | Save hours | `<Permission roles={["owner","admin"]}>` |
| Upload logo barbershop | Camera badge | `<Permission roles={["owner"]}>` |
| Upload image layanan | Tombol kamera di detail service | `<Permission roles={["owner"]}>` |
| Invite barber | Tombol invite | `<Permission roles={["owner"]}>` |
| Remove barber | Tombol remove | `<Permission roles={["owner"]}>` |

### 4. Timezone UI (F3) — Catatan

Belum ada UI di frontend. Nanti kalau dibuat, guard `<Permission roles={["owner"]}>`.

---

## Ringkasan Semua Perubahan

| # | Area | Perubahan | Prioritas |
|---|---|---|---|
| 1 | Backend: Open Hours handler | `requireRoles` tambah `'admin'` | Tinggi |
| 2 | Backend: Analytics | Filter by barber sendiri kalo role `member` | Tinggi |
| 3 | Frontend: Edit barbershop info | Guard `<Permission roles={["owner"]}>` | Tinggi |
| 4 | Frontend: Open Hours screen | Guard `<Permission roles={["owner","admin"]}>` | Tinggi |
| 5 | Frontend: Upload logo | Guard `<Permission roles={["owner"]}>` | Sedang |
| 6 | Frontend: Upload image layanan | Guard `<Permission roles={["owner"]}>` | Sedang |
| 7 | Frontend: Invite barber | Guard `<Permission roles={["owner"]}>` | Sedang |
| 8 | Frontend: Remove barber | Guard `<Permission roles={["owner"]}>` | Sedang |

---

## Test Scenarios

*To be filled after all rounds complete.*
