# Cukkr Backlog Tasks

> Last updated: 2026-07-22

---

## TASK-018 · Tampilkan Gambar Barber & Layanan di Booking Flow

**Description:**
Pada halaman `NewWalkInScreen` dan `NewAppointmentScreen`, gambar (avatar barber dan thumbnail layanan) tidak ditampilkan di manapun di booking flow — baik di screen pemilihan (`SelectBarberScreen`, `SelectServicesScreen`) maupun di form summary (`BookingForm` → `ServiceSelectionCard` + `SelectorInput` barber). Padahal backend sudah mengembalikan `avatarUrl` (barber) dan `imageUrl` / `imageThumb` (layanan) di response API yang dikonsumsi oleh `useScheduleBarbers` dan `useScheduleServices`. Halaman manajemen seperti `BarbersManagementScreen` (via `MemberCard`) dan `ServicesManagementScreen` (via `ServiceCard`) sudah menampilkan gambar dengan benar — booking flow harus mengikuti pola yang sama: render `<Image source={{ uri }} />` jika URL tersedia, fallback ke ikon/default jika tidak.

**Implementation Plan:**
- [x] Di `cukkr-frontend/src/features/schedule/context/NewBookingContext.tsx`: tambahkan `imageThumb?: string | null` ke interface `SelectedService` (line 4-8). Tambahkan `barberAvatarUrl?: string | null` ke `NewBookingFormData` (line 10-19). Ubah signature `setBarber` menjadi `(id: string, name: string, avatarUrl?: string | null)` dan simpan ke `barberAvatarUrl` (line 55-57).
- [x] Di `cukkr-frontend/src/features/schedule/screens/SelectBarberScreen.tsx`: di baris 55, ganti `<Ionicons name="person" ...>` dengan conditional render mengikuti pola `MemberCard` — jika `item.avatarUrl` ada, render `<Image source={{ uri: item.avatarUrl }} style={styles.avatarImage} />`, jika tidak render `<Ionicons name="person-outline" size={24} color={Colors.icon.muted} />`. Di baris 28-29, update `handleSelect` dan panggil `setBarber(id, name, item.avatarUrl ?? null)`. Tambahkan import `Image` dari `react-native` dan style `avatarImage` (width 48, height 48, borderRadius 24, resizeMode "cover").
- [x] Di `cukkr-frontend/src/features/schedule/screens/SelectServicesScreen.tsx`: di `ServiceCard` (baris 95-100), tambahkan prop `imageUri={item.imageThumb ?? undefined}`. Di `handleConfirm` (baris 48-53), tambahkan `imageThumb: s.imageThumb` ke object hasil `.map()`.
- [x] Di `cukkr-frontend/src/features/schedule/components/ServiceSelectionCard.tsx`: tambahkan `imageThumb?: string | null` ke local `ServiceItem` interface (baris 13-17). Di baris 60, ganti `<View style={styles.imagePlaceholder} />` dengan conditional render — jika `svc.imageThumb` ada, render `<Image source={{ uri: svc.imageThumb }} style={styles.serviceImage} />`, jika tidak render placeholder. Tambahkan import `Image` dari `react-native` dan style `serviceImage` (width 48, height 48, borderRadius 8, resizeMode "cover").
- [x] Di `cukkr-frontend/src/features/schedule/components/BookingForm.tsx`: tambahkan `imageThumb?: string | null` ke local `ServiceItem` interface (baris 8-12). Tambahkan prop `selectedBarberAvatarUrl?: string | null` ke `Props` (baris 14-28). Di `SelectorInput` barber (baris 63-69), tambahkan prop `leftElement` — jika `selectedBarberAvatarUrl` ada, render `<Image source={{ uri }} />` dalam circle (size 24); jika tidak, tetap gunakan `iconName`.
- [x] Di `cukkr-frontend/src/features/schedule/components/SelectorInput.tsx`: tambahkan prop opsional `leftElement?: React.ReactNode` ke interface `Props`. Di render (baris 39-46), ganti icon conditional menjadi `{leftElement ?? (iconName ? <Ionicons ... /> : null)}`.
- [x] Di `cukkr-frontend/src/features/schedule/screens/NewWalkInScreen.tsx`: tambahkan prop `selectedBarberAvatarUrl={formData.barberAvatarUrl ?? undefined}` ke `<BookingForm>` (baris 98-108).
- [x] Di `cukkr-frontend/src/features/schedule/screens/NewAppointmentScreen.tsx`: tambahkan prop `selectedBarberAvatarUrl={formData.barberAvatarUrl ?? undefined}` ke `<BookingForm>` (baris 205-217).
- [x] Jalankan `npx tsc --noEmit` di `cukkr-frontend/` dan perbaiki type error yang muncul.

**Manual Verification (Human Checklist):**
- [ ] Buka halaman New Walk-In → tap "Select Barber" — pastikan setiap barber menampilkan avatar (foto) jika ada, atau ikon `person` fallback jika tidak ada. Tap salah satu barber lalu pastikan avatar muncul di sebelah nama barber di BookingForm.
- [ ] Di halaman yang sama → tap "Select Services" — pastikan setiap layanan menampilkan thumbnail (foto) di `ServiceCard` jika ada, atau ikon `cut-outline` fallback jika tidak ada. Pilih beberapa layanan lalu tap confirm — pastikan thumbnail muncul di `ServiceSelectionCard` di BookingForm.
- [ ] Ulangi langkah yang sama dari halaman New Appointment (toggled ke Appointment).
- [ ] Pastikan layanan tanpa gambar (baru dibuat tanpa upload) tetap menampilkan placeholder tanpa error.
- [ ] Pastikan barber tanpa avatar tetap menampilkan ikon `person` tanpa error.

**Tags:** `cukkr-frontend`
