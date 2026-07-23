# Cukkr Backlog Tasks

> Last updated: 2026-07-22

---

## TASK-019 · Halaman Khusus Booking Requests + Preview Posisi Schedule

**Description:**
Saat ini booking yang `requested` hanya bisa diakses dari:
1. Halaman notifikasi (`NotificationCard` → click → detail → accept/decline)
2. Schedule page (`ScheduleActiveBookingsScreen`) — `RequestCard` horizontal scroll di bagian atas, tapi hanya menampilkan request untuk tanggal yang sedang dipilih

Masalah: Jika booking dijadwalkan jauh (misal 2 minggu lagi), staff harus scroll kalender ke tanggal tersebut dulu untuk melihat request-nya di schedule.

Solusi:
1. **Halaman khusus Booking Requests** — route `app/d/(schedule)/booking-requests` — menampilkan SEMUA booking `requested` dari hari ini ke depan, dikelompokkan per tanggal. Tidak ada inline actions (accept/decline) di list — tap item navigasi ke `BookingDetailScreen`.
2. **Preview Timeline di Booking Detail** — untuk booking `requested`, ditampilkan section collapsible yang menunjukkan posisi booking tersebut di schedule hari itu (sebelum/sesudah siapa).

### UI/UX Summary (dari diskusi)

| Item | Keputusan |
|---|---|
| **Page structure** | Route di dalam schedule scope: `app/d/(schedule)/booking-requests` |
| **List type** | Grouped by date, urut dari hari ini ke depan |
| **Date range** | Semua masa depan (dari hari ini) |
| **Role access** | Semua role (owner, admin, member) bisa lihat & accept |
| **Entry point** | Button "Requests" di header schedule page, dengan badge count |
| **Badge** | Ya, tampilkan jumlah pending requests di tombol |
| **List interaction** | Info only — tap untuk navigate ke detail |
| **Preview trigger** | Collapsible section inline di detail page |
| **Preview scope** | Semua booking di hari tsb (semua barber), highlighted posisi booking requested |
| **Conflict handling** | First-come-first-serve (existing behavior) |
| **RequestCard existing** | Tetap dipertahankan di schedule untuk quick access hari ini |

---

### Implementation Plan

#### Backend (No changes needed)
- `GET /api/bookings/requests` — sudah ada, mengembalikan `BookingSummaryResponse[]`
- `GET /api/bookings/?date=YYYY-MM-DD` — sudah ada, untuk preview timeline
- `POST /api/bookings/:id/accept` — sudah ada
- `POST /api/bookings/:id/decline` — sudah ada

#### Frontend — Files to Create

- [x] `cukkr-frontend/src/features/schedule/screens/BookingRequestsScreen.tsx`
  - Screen utama untuk halaman booking requests
  - Fetch `listRequestedBookings` dengan `dateFrom = today` (no dateTo = infinite future)
  - Group bookings by `scheduledAt` date
  - Render date section headers + item list
  - Setiap item: nama customer, time, barber, services, status badge. Tap → navigate ke `/d/booking-detail`
  - Pull-to-refresh
  - Loading state, empty state

- [x] `cukkr-frontend/app/d/(schedule)/booking-requests.tsx`
  - Route wrapper yang render `BookingRequestsScreen`

- [x] `cukkr-frontend/src/features/schedule/components/BookingTimelinePreview.tsx`
  - Props: `scheduledAt: string`, `bookingId: string`
  - Collapsible component
  - Compact state: menampilkan booking ybs (highlighted) + 1 booking sebelumnya + 1 booking sesudahnya
  - Expanded state: full day timeline (semua booking di hari tsb, urut waktu)
  - Menggunakan `useBookings(date)` untuk fetch data schedule hari tsb
  - Highlight booking saat ini dengan style berbeda (brand color / "Booking Ini" label)

#### Frontend — Files to Modify

- [x] `cukkr-frontend/src/features/schedule/services/bookings.service.ts`
  - Tambah method `getRequestedBookings(dateFrom?: string, dateTo?: string)` — panggil `GET /api/bookings/requests`

- [x] `cukkr-frontend/src/features/schedule/hooks/useBookingsQueries.ts`
  - Tambah `requests` key di `BOOKINGS_QUERY_KEYS`
  - Tambah `useRequestedBookings(dateFrom, dateTo?)` — query hook

- [x] `cukkr-frontend/src/features/schedule/hooks/useBookingsMutations.ts`
  - Tidak perlu perubahan — `useAcceptBooking` dan `useDeclineBooking` sudah invalidate `BOOKINGS_QUERY_KEYS.all` yang mencakup semua sub-query termasuk `requests`

- [x] `cukkr-frontend/src/features/schedule/screens/ScheduleActiveBookingsScreen.tsx`
  - Tambah button "Requests" di header (`topBar` area, sebelah kanan DateSelectorPill)
  - Badge count dari `useRequestedBookings`
  - Navigasi ke `/d/booking-requests` saat di-tap
  - RequestCard section tetap dipertahankan untuk quick access

- [x] `cukkr-frontend/src/features/schedule/screens/BookingDetailScreen.tsx`
  - Untuk booking dengan status `requested`:
    - Tambah `BookingTimelinePreview` di antara `BookingDetailCard` dan `DualActionFooter`
    - Jika booking tidak punya `scheduledAt`, jangan render timeline preview

- [x] `cukkr-frontend/src/lib/i18n/locales/id.ts`
  - Tambah keys baru di scope `schedule`/`bookings`:
    - `schedule.requestsButton` = "Requests"
    - `bookings.previewScheduleCompact` = "Antrian hari ini"
    - `bookings.timelineYouAreHere` = "Booking Ini"
    - `bookings.noRequests` = "Tidak ada permintaan booking"
    - `bookings.requestsTitle` = "Permintaan Booking"
    - `bookings.before/after/more` untuk truncated hint

- [x] `cukkr-frontend/src/lib/i18n/locales/en.ts`
  - Tambah keys yang sama dalam English:
    - `schedule.requestsButton` = "Requests"
    - `bookings.previewScheduleCompact` = "Today's queue"
    - `bookings.timelineYouAreHere` = "This Booking"
    - `bookings.noRequests` = "No booking requests"
    - `bookings.requestsTitle` = "Booking Requests"
    - `bookings.before/after/more` untuk truncated hint

#### Test

- [x] Jalankan `npx tsc --noEmit` di `cukkr-frontend/` — lulus tanpa error

**Manual Verification (Human Checklist):**
- [ ] Buka Schedule tab → lihat tombol "Requests" di header dengan badge count
- [ ] Tap tombol → navigate ke halaman Booking Requests
- [ ] List menampilkan request dari hari ini ke depan, grouped by date
- [ ] Tap item → navigate ke BookingDetailScreen
- [ ] Di BookingDetailScreen untuk requested booking, lihat preview timeline collapsible
- [ ] Compact: tampilkan booking ini + 1 sebelum + 1 sesudah
- [ ] Tap expand → tampilkan full day timeline
- [ ] Accept booking → redirect ke schedule, request hilang dari list
- [ ] Decline booking → request hilang dari list

**Tags:** `cukkr-frontend`
