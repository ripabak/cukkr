# Cukkr Backlog Tasks

> Last updated: 2026-07-22

---

## TASK-017 · General QR Screen Redesign — Rebrand from Walk-In to Barbershop QR Banner

**Description:**
The current `WalkInQrScreen` (`cukkr-frontend/src/features/home/screens/WalkInQrScreen.tsx`) is misleadingly named and scoped — it displays a walk-in PIN QR code when the screen is actually a general barbershop QR that simplifies direct link access for customers. The screen also includes a PIN row and walk-in-specific hint text that no longer apply. The goal is to rename and restyle this screen into a general-purpose **Barbershop QR Banner** — a printable, shareable banner inspired by QRIS Indonesia's layout. The new design removes the PIN display, replaces the walk-in description with a neutral explanation, adds **Print** and **Share as Image** buttons (both using `react-native-view-shot` to capture the banner view as a PNG), and applies a branded banner layout with brand accent shapes. The route path also changes from `/d/walkin-qr` to `/d/barbershop-qr`.

**Implementation Plan:**
- [x] Install `react-native-view-shot` in `cukkr-frontend/` (`bun add react-native-view-shot`).
- [x] Rename `cukkr-frontend/src/features/home/screens/WalkInQrScreen.tsx` to `BarbershopQrScreen.tsx` and rename the component export from `WalkInQrScreen` to `BarbershopQrScreen`.
- [x] Rename `cukkr-frontend/app/d/(barbershop)/walkin-qr.tsx` to `barbershop-qr.tsx` and update its import to `BarbershopQrScreen`.
- [x] Remove `useCurrentPin` import and all PIN-related code (the `pinData?.pin` conditional, the `pinRow`/`pinLabel`/`pinValue` styles, and the PIN appended to `qrUrl` — the QR should now simply encode `baseUrl`).
- [x] Remove the old `walkIn.hint` description text and its `hint` style.
- [x] Build the new banner-style layout inside `BarbershopQrScreen`:
  - Wrap the banner content in a `<View ref={bannerRef}>` for `react-native-view-shot` capture.
  - **Top boundary strip** (a thin colored bar or decorative line separating the banner header from the edge).
  - **Header row**: on the left, a large "QR" text (bold, ~28px, brand color). To the right of "QR", a two-line description explaining the QR's purpose. On the far right, the transparent Cukkr logo (`public/cukkr-logo-trans.png`).
  - **Body**: barbershop name (from `barbershop?.name`), the barbershop booking link (from `baseUrl`), and the QR code (using `react-native-qrcode-svg`, size ~200).
  - **Footer**: "Printed on" / "Dicetak pada" date label with formatted date using `formatDateTime` from `@/src/utils/date`.
  - **Bottom boundary strip** (mirroring the top strip).
  - **Brand accent shapes**: absolute-positioned thick L-shaped lines in brand color at the top-left and bottom-right corners (partial border lines that don't wrap fully — just thick segments ~30–40px long, ~3–4px thick).
- [x] Add two buttons below the banner:
  - **Print QR** button (`PrimaryButton`): uses `react-native-view-shot` to capture `bannerRef` as a PNG, then shares via `expo-sharing` (or `Share.share` with the image URI).
  - **Share as Image** button (`PrimaryButton`, outlined/secondary style): same capture + share flow, labeled "Share" / "Bagikan".
- [x] Add new i18n keys in `cukkr-frontend/src/lib/i18n/locales/id.ts` and `cukkr-frontend/src/lib/i18n/locales/en.ts` under a new `barbershopQr` top-level key:
  - `title`: "QR Barbershop" (id) / "Barbershop QR" (en)
  - `descriptionLine1`: "Scan QR ini untuk langsung" (id) / "Scan this QR to directly" (en)
  - `descriptionLine2`: "mengakses halaman booking" (id) / "access the booking page" (en)
  - `printedOn`: "Dicetak pada" (id) / "Printed on" (en)
  - `printQr`: "Cetak QR" (id) / "Print QR" (en)
  - `shareQr`: "Bagikan" (id) / "Share" (en)
  - `captureFailed`: "Gagal mengambil gambar QR" (id) / "Failed to capture QR image" (en)
- [x] Update `ScreenHeader` title to use `t("barbershopQr.title")` instead of `t("home.walkIn")`.
- [x] Run `npx tsc --noEmit` in `cukkr-frontend/` to verify no TypeScript errors.
- [x] Files to modify: `cukkr-frontend/src/features/home/screens/WalkInQrScreen.tsx` (rename + rewrite), `cukkr-frontend/app/d/(barbershop)/walkin-qr.tsx` (rename + update import), `cukkr-frontend/src/lib/i18n/locales/id.ts`, `cukkr-frontend/src/lib/i18n/locales/en.ts`.

**Manual Verification (Human Checklist):**
- [ ] In the app, log in as any barbershop member and navigate to the new `/d/barbershop-qr` screen (ensure the old `/d/walkin-qr` route is no longer reachable).
- [ ] Verify the PIN row is no longer visible on the QR screen.
- [ ] Verify the banner shows: large "QR" text, two-line description, Cukkr logo, barbershop name, booking link, QR code, and print date.
- [ ] Verify brand accent shapes appear at top-left and bottom-right corners in brand yellow (`Colors.brand.primary`).
- [ ] Tap "Cetak QR" / "Print QR" — verify the banner is captured as an image and the share sheet opens with the image.
- [ ] Tap "Bagikan" / "Share" — verify the banner is captured as an image and the share sheet opens with the image.
- [ ] Scan the QR code with a phone camera — confirm it opens the barbershop booking page.
- [ ] Switch app language between Indonesian and English — confirm all labels and descriptions update correctly.

**Tags:** `cukkr-frontend`
