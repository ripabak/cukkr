# Role & Permission System — Comprehensive Findings

> Riset menyeluruh terhadap **semua aktivitas pengguna**, **frontend routing**, **backend security**, dan **Better Auth built-in permissions**. Mencakup cukkr-backend, cukkr-frontend, dan Better Auth source code.
>
> **Last updated:** Setelah semua fix diterapkan.

---

## 1. Ringkasan

| Status | Kategori | Detail |
|--------|----------|--------|
| ✅ Sudah optimal | Service CRUD, barbershop settings, open hours, barber management, accept/decline booking, analytics, notification security | 25+ endpoint & UI |
| ⚠️ Backend only | Reassign booking, customer notes edit | 2 endpoint (tidak ada UI frontend) |
| 🔶 Privacy | listMembers exposes emails & roles to all members | 1 endpoint |
| 🔶 Routing | 6 route group tanpa ProtectedRoute | Frontend |

---

## 2. Complete Activity Map

### 2.1 Barbershop Management

| Aktivitas | Backend | Frontend | owner | admin | member | Status |
|-----------|---------|----------|:-----:|:-----:|:------:|--------|
| Lihat profil barbershop | `requireOrganization` | - | ✅ | ✅ | ✅ | OK |
| Edit nama/deskripsi/alamat | `requireRoles: ['owner']` | ✅ `hideSave` + `editable` | ✅ | ❌ | ❌ | ✅ |
| Edit booking URL | `requireRoles: ['owner']` | ✅ `hideSave` + `editable` | ✅ | ❌ | ❌ | ✅ |
| Edit timezone | `requireRoles: ['owner']` | ❌ no UI | ✅ | ❌ | ❌ | OK |
| Upload logo | `requireRoles: ['owner']` | ❌ placeholder | ✅ | ❌ | ❌ | ⚠️ |
| Delete barbershop | Better Auth `org:["delete"]` | role-aware | ✅ | ❌ | ❌ | ✅ |
| Leave barbershop | Better Auth `leave` | role-aware | ✅ | ✅ | ✅ | ✅ |

### 2.2 Service Management

| Aktivitas | Backend | Frontend | owner | admin | member | Status |
|-----------|---------|----------|:-----:|:-----:|:------:|--------|
| Lihat services | `requireOrganization` | - | ✅ | ✅ | ✅ | OK |
| Lihat detail service | `requireOrganization` | - | ✅ | ✅ | ✅ | OK |
| Tambah service | `['owner','admin']` | ✅ Permission | ✅ | ✅ | ❌ | ✅ |
| Edit service | `['owner','admin']` | ✅ Permission | ✅ | ✅ | ❌ | ✅ |
| Delete service | `['owner','admin']` | ✅ Permission | ✅ | ✅ | ❌ | ✅ |
| Toggle active | `['owner','admin']` | ✅ Permission | ✅ | ✅ | ❌ | ✅ |
| Set default | `['owner','admin']` | ✅ Permission | ✅ | ✅ | ❌ | ✅ |
| Upload image | `['owner']` | ❌ no UI | ✅ | ❌ | ❌ | OK |

### 2.3 Open Hours

| Aktivitas | Backend | Frontend | owner | admin | member | Status |
|-----------|---------|----------|:-----:|:-----:|:------:|--------|
| Lihat jadwal | `+org` | - | ✅ | ✅ | ✅ | OK |
| Edit jadwal | `['owner', 'admin']` | ✅ `editable` + hide save | ✅ | ✅ | ❌ | ✅ |

### 2.4 Barber (Member) Management

| Aktivitas | Backend | Frontend | owner | admin | member | Status |
|-----------|---------|----------|:-----:|:-----:|:------:|--------|
| Lihat daftar barber | Better Auth `listMembers` | - | ✅ | ✅ | ✅ | 🔶 privasi |
| Lihat invitations | Better Auth `listInvitations` | - | ✅ | ✅ | ✅ | 🔶 privasi |
| Invite barber | Better Auth `invitation:["create"]` | ✅ `Permission` + `editable` | ✅ | ✅ | ❌ | ✅ |
| Cancel invitation | Better Auth `invitation:["cancel"]` | ✅ `canManage` conditional | ✅ | ✅ | ❌ | ✅ |
| Remove member | Better Auth `member:["delete"]` | ✅ `canManage` conditional | ✅ | ✅ | ❌ | ✅ |
| Update role | Better Auth `member:["update"]` | ❌ no UI | ✅ | ✅ | ❌ | missing fitur |

### 2.5 Booking Operations

| Aktivitas | Backend | Frontend | owner | admin | member | Status |
|-----------|---------|----------|:-----:|:-----:|:------:|--------|
| Lihat bookings | `+org` | - | ✅ | ✅ | ✅ | OK |
| Buat booking | `+org` | - | ✅ | ✅ | ✅ | OK |
| Update status (all) | `+org` + service check | - | ✅ | ✅ | ✅ | OK |
| Accept booking | `+org` | - | ✅ | ✅ | ✅ | OK (by design) |
| Decline booking | `+org` | - | ✅ | ✅ | ✅ | OK (by design) |
| Reassign booking | `+org` | - (tidak ada UI) | ✅ | ✅ | ✅ | ⚠️ Backend only |

### 2.6 Customer Management

| Aktivitas | Backend | Frontend | owner | admin | member | Status |
|-----------|---------|----------|:-----:|:-----:|:------:|--------|
| Lihat customers | `+org` | - | ✅ | ✅ | ✅ | OK |
| Lihat detail customer | `+org` | - | ✅ | ✅ | ✅ | OK |
| Lihat history booking | `+org` | - | ✅ | ✅ | ✅ | OK |
| Edit notes customer | `+org` | - (tidak ada UI) | ✅ | ✅ | ✅ | ⚠️ Backend only |

### 2.7 Walk-In PIN

| Aktivitas | Backend | Frontend | owner | admin | member | Status |
|-----------|---------|----------|:-----:|:-----:|:------:|--------|
| Lihat PIN | `+org` | - | ✅ | ✅ | ✅ | OK |
| Generate PIN | `+org` | - | ✅ | ✅ | ✅ | OK (by design) |

### 2.8 Analytics

| Aktivitas | Backend | Frontend | owner | admin | member | Status |
|-----------|---------|----------|:-----:|:-----:|:------:|--------|
| Overview | `['owner', 'admin']` | ✅ tab hidden + layout redirect + Permission | ✅ | ✅ | ❌ | ✅ |
| Revenue | `['owner', 'admin']` | ✅ layout redirect | ✅ | ✅ | ❌ | ✅ |
| Customers | `['owner', 'admin']` | ✅ layout redirect | ✅ | ✅ | ❌ | ✅ |
| Barbers | `['owner', 'admin']` | ✅ layout redirect | ✅ | ✅ | ❌ | ✅ |
| Services | `['owner', 'admin']` | ✅ layout redirect | ✅ | ✅ | ❌ | ✅ |

### 2.9 Notifications

| Aktivitas | Backend | owner | admin | member | Status |
|-----------|---------|:-----:|:-----:|:------:|--------|
| Lihat notifikasi | `requireAuth` | ✅ | ✅ | ✅ | OK |
| Mark read | `requireAuth` | ✅ | ✅ | ✅ | OK |
| Accept booking via notification | `requireAuth` + service verify membership | ✅ | ✅ | ✅ | ✅ |
| Decline booking via notification | `requireAuth` + service verify membership | ✅ | ✅ | ✅ | ✅ |
| Accept invitation via notification | `requireAuth` + email check + expiry + email verified + membership limit | ✅ | ✅ | ✅ | ✅ |
| Decline invitation via notification | `requireAuth` + email check | ✅ | ✅ | ✅ | OK |

---

## 3. Fixed Issues Summary

### 3.1 Notification Stale Booking Access (Security Fix)

**Lokasi:** `notifications/service.ts:541-570`

**Problem:** Route `POST /api/notifications/:id/actions/accept` dan `decline` untuk booking menggunakan `notif.organizationId` tanpa mengecek apakah user masih anggota organisasi. User yang sudah di-remove dari org masih bisa accept/decline booking via notifikasi lama.

**Fix:** Tambah verifikasi membership (`db.query.member`) di `executeAcceptAction` dan `executeDeclineAction` sebelum memanggil `BookingService.acceptBooking()`/`declineBooking()`. Kalau user bukan anggota organisasi lagi, throw `FORBIDDEN`.

> Tidak bisa pakai `requireOrganization` di handler karena route juga handle invitation acceptance (user belum punya active org).

### 3.2 Notification Invitation Acceptance (Validation Enhancement)

**Lokasi:** `notifications/service.ts:571-618`

**Problem:** Custom code di `executeAcceptAction` untuk invitation tidak memiliki validasi yang sama dengan Better Auth `acceptInvitation`.

**Fix:** Tambah validasi yang sebelumnya hilang:
- ✅ Invitation expiry check — `inv.expiresAt < new Date()`
- ✅ Email verification check — `!inviteeUser.emailVerified`
- ✅ Membership limit check — count members ≤ 100

### 3.3 ASSIGNABLE_MEMBER_ROLES — Admin (Consistency Fix)

**Lokasi:** `bookings/service.ts:61` — **SUDAH DI-FIX**

`ASSIGNABLE_MEMBER_ROLES` sekarang `['owner', 'admin', 'member']`. Admin bisa start/complete booking, konsisten dengan cancel.

### 3.4 Admin Notifikasi Booking (Fix)

**Lokasi:** `notifications/service.ts:441` — **SUDAH DI-FIX**

`getOrganizationRecipientUserIds()` sekarang fetch `['owner', 'admin', 'member']`. Admin mendapat notifikasi push/in-app saat booking baru dibuat.

---

## 4. Privacy & Data Exposure

### 4.1 listMembers — Semua Anggota Bisa Lihat Data Anggota Lain

**Lokasi:** Better Auth `crud-members.mjs:381-425`

Better Auth `listMembers` hanya check membership (bukan `hasPermission`). Seorang **barber (member)** bisa melihat nama, email, foto, dan role semua anggota (termasuk owner/admin). 

### 4.2 listInvitations — Semua Anggota Bisa Lihat Undangan Pending

**Lokasi:** Better Auth `crud-invites.mjs:469-487`

Sama seperti `listMembers`, endpoint ini hanya check membership. Member bisa lihat siapa saja yang diundang.

---

## 5. Frontend Routing Gaps

### 5.1 Route Groups Tanpa ProtectedRoute

| Route Group | Layout Protection | Dampak |
|-------------|-------------------|--------|
| `(analytics)/` | `WorkspaceRoute` + `AnalyticsGuard` | ✅ Sudah di-guard role |
| `(schedule)/` | `WorkspaceRoute` only | Tidak redirect ke login, blank screen |
| `(barbershop)/` | `WorkspaceRoute` only | Sama |
| `(workspace)/` | **None** | Create barbershop tanpa auth |
| `(onboarding)/` | **None** | Onboarding tanpa auth |
| `accept-invitation/` | **None** | Accept invitation tanpa auth |

### 5.2 WorkspaceRoute Tidak Redirect ke Login

Saat user tidak login, `WorkspaceRoute` redirect ke `/d/create-barbershop-name-logo` yang tidak terproteksi, bukan ke login.

---

## 6. Anomali & Edge Cases

### 6.1 Notification Invitation — Dua Jalur Acceptance Terpisah

Terdapat **2 jalur** invitation acceptance yang tidak terintegrasi:

```
Invitasi dibuat
    │
    ├──► Email link → AcceptInvitationScreen → Better Auth acceptInvitation (full validation)
    │
    └──► In-app notification → NotificationService.executeAcceptAction (custom code)
```

Jalur notifikasi menggunakan custom code di `NotificationService` yang memanipulasi DB langsung (update invitation, insert member) tanpa melalui Better Auth. Idealnya jalur notifikasi redirect ke Better Auth flow, atau menggunakan Better Auth client.

### 6.2 Reassign Booking — Backend Only

`PATCH /bookings/:id/reassign` mengganti `handledByBarberId` tanpa mengubah status. Tidak ada UI frontend.
- Hanya tolak terminal state (completed/cancelled)
- Tidak ada role check pada caller
- Tidak ada state machine validation

### 6.3 Customer Notes Edit — Backend Only

`PATCH /customers/:id/notes` mengedit catatan customer. Tidak ada UI frontend (baik untuk view maupun edit).

### 6.4 Dead Code: `canManage` di ServiceDetailScreen

Variabel `canManage` di-assign tapi tidak pernah digunakan — `Permission` component sudah handle hiding.

---

## 7. Frontend-Guarded UI Changes Summary

| Screen | Elemen | Mekanisme |
|--------|--------|-----------|
| `EditBarbershopInfoScreen` | Save button + input | `hideSave` + `editable={isOwner}` |
| `EditBookingUrlScreen` | Save button + input | `hideSave` + `editable={isOwner}` |
| `OpenHoursScreen` | Toggle + time picker + save button | `editable={canManage}` + hide button |
| `InviteBarberScreen` | Send button + input | hide rightAction + `editable={canInvite}` |
| `BarbersManagementScreen` | Invite, cancel, remove buttons | `Permission` + `canManage` conditional |
| `ServiceDetailScreen` | Camera badge + operational section | `canManage` + `Permission` |
| `BottomTabBar` | Stats tab | `visibleTabs` filter based on role |
| `(analytics)/_layout` | Analytics screen access | `AnalyticsGuard` redirect member |
| `AnalyticsOverviewScreen` | Content wrapper | `Permission roles={["owner","admin"]}` |

### Component Additions

| Component | New Prop |
|-----------|----------|
| `EditFieldHeader` | `hideSave?: boolean` |
| `TextInputField` | `editable?: boolean` |
| `MultilineInputField` | `editable?: boolean` |
| `PrefixedInputField` | `editable?: boolean` |
| `ToggleSwitch` | `disabled?: boolean` |
| `DayHoursRow` | `editable?: boolean` |

---

## 8. Backend Changes Summary

| File | Change |
|------|--------|
| `bookings/service.ts:61` | `ASSIGNABLE_MEMBER_ROLES` tambah `'admin'` |
| `notifications/service.ts:441` | `getOrganizationRecipientUserIds` tambah `'admin'` |
| `notifications/service.ts:541-650` | Tambah membership verification untuk booking accept/decline |
| `notifications/service.ts:571-618` | Tambah expiry, email verified, membership limit untuk invitation acceptance |
| `open-hours/handler.ts:55` | `requireRoles: ['owner']` → `requireRoles: ['owner', 'admin']` |
| `analytics/handler.ts` | Semua 9 endpoint: `requireAuth + requireOrganization` → `requireRoles: ['owner', 'admin']` |
| `AGENTS.md` | Admin role description diperbarui |

---

## 9. Remaining Items

| Prioritas | Item | Tipe |
|:---------:|------|------|
| 🔶 P3 | listMembers — member lihat email/role semua anggota | Privacy |
| 🔶 P3 | Frontend routing — 5 route group tanpa ProtectedRoute | Routing |
| ⚠️ P4 | Booking reassign — endpoint tanpa role check (tidak ada UI frontend) | Backend only |
| ⚠️ P4 | Customer notes edit — endpoint tanpa role check (tidak ada UI frontend) | Backend only |
| ⚠️ P4 | Upload logo — frontend placeholder | Missing UI |
| ⚠️ P4 | Update member role — tidak ada UI frontend | Missing fitur |
| 💡 P5 | Notification invitation acceptance — custom code, idealnya redirect ke Better Auth flow | Refactor |

---

## 10. File-File Kunci

| File | Path |
|------|------|
| Auth middleware | `cukkr-backend/src/middleware/auth-middleware.ts` |
| Better Auth permissions | `node_modules/better-auth/dist/plugins/organization/access/statement.mjs` |
| Better Auth invite route | `node_modules/better-auth/dist/plugins/organization/routes/crud-invites.mjs` |
| Better Auth member routes | `node_modules/better-auth/dist/plugins/organization/routes/crud-members.mjs` |
| Better Auth org routes | `node_modules/better-auth/dist/plugins/organization/routes/crud-org.mjs` |
| Better Auth config | `cukkr-backend/src/lib/auth.ts` |
| Notification service (stale access + invitation validations) | `cukkr-backend/src/modules/notifications/service.ts` |
| Notification handler | `cukkr-backend/src/modules/notifications/handler.ts` |
| Booking service (ASSIGNABLE_MEMBER_ROLES) | `cukkr-backend/src/modules/bookings/service.ts` |
| Booking handler | `cukkr-backend/src/modules/bookings/handler.ts` |
| Analytics handler | `cukkr-backend/src/modules/analytics/handler.ts` |
| Open hours handler | `cukkr-backend/src/modules/open-hours/handler.ts` |
| Customer handler | `cukkr-backend/src/modules/customer-management/handler.ts` |
| Walk-in PIN handler | `cukkr-backend/src/modules/walk-in-pin/handler.ts` |
| Barbershop handler | `cukkr-backend/src/modules/barbershop/handler.ts` |
| Public service | `cukkr-backend/src/modules/public/service.ts` |
| Backend AGENTS.md | `cukkr-backend/AGENTS.md` |
| Frontend Permission component | `cukkr-frontend/src/components/Permission.tsx` |
| Frontend useMemberRole hook | `cukkr-frontend/src/hooks/useMemberRole.ts` |
| Frontend BottomTabBar (Stats hidden for member) | `cukkr-frontend/src/components/BottomTabBar.tsx` |
| Frontend EditFieldHeader (hideSave prop) | `cukkr-frontend/src/components/EditFieldHeader.tsx` |
| Frontend ToggleSwitch (disabled prop) | `cukkr-frontend/src/components/ToggleSwitch.tsx` |
| Frontend DayHoursRow (editable prop) | `cukkr-frontend/src/components/DayHoursRow.tsx` |
| Frontend analytics layout (AnalyticsGuard) | `cukkr-frontend/app/d/(analytics)/_layout.tsx` |
| Frontend barbers service | `cukkr-frontend/src/features/barbershop/services/barbers.service.ts` |
| Frontend AGENTS.md | `cukkr-frontend/AGENTS.md` |
