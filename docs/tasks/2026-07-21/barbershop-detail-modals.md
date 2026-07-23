# Cukkr Backlog Tasks

> Last updated: 2026-07-21

---

## TASK-016 · Barbershop Detail Modals — Service & Barber Info Enrichment

**Description:**
The public barbershop landing page at `/[slug]` currently shows only minimal info for services (name, duration, price) and barbers (name, avatar) inside the `BarbershopTabs` component. The backend already returns richer data — service `description` and `imageUrl`, and barber `bio` (on the `user` table) — but neither is displayed to the customer. Two new modal components (`ServiceDetailModal` and `BarberDetailModal`) should present the full detail for each service and barber when their card is clicked. Each modal includes a CTA button that pre-selects the service or barber into `PublicBookingContext` and navigates to the booking page at `/${slug}/booking` so the customer can proceed directly. The modals use `<dialog>` with Tailwind styling, support Escape/backdrop-click/X-button to close, and animate with a fade+scale CSS transition. The tab cards themselves are redesigned to include thumbnail images and truncated descriptions, using a responsive 2-column grid.

**Implementation Plan:**
- [x] In `cukkr-backend/src/modules/public/model.ts`, add `bio: t.Nullable(t.String())` to `PublicBarberItem`.
- [x] In `cukkr-backend/src/modules/public/service.ts`, map `user.bio` in both `getPublicBarbershop()` barbers mapper and `getWalkInFormData()` barbers mapper: `bio: m.user.bio ?? null`.
- [x] In `cukkr-web/src/public-booking/actions/booking.actions.ts`, add `bio?: string | null` to the `PublicBarber` interface.
- [x] In `cukkr-web/src/lib/i18n/id.ts`, add new keys inside `barbershopPage`: `bookService`, `bookWithBarber`, `serviceDescription`, `closeModal`, `noDescription`, `noBio`.
- [x] In `cukkr-web/src/lib/i18n/en.ts`, add the same new keys inside `barbershopPage` with English translations.
- [x] Create `cukkr-web/src/public-booking/components/ServiceDetailModal.tsx` — a `"use client"` component accepting `service: PublicService`, `slug: string`, `dict: unknown`, `onClose`:
  - Render `<dialog>` with backdrop (`bg-black/50`), centered card (`bg-[var(--paper)] rounded-2xl`), fade+scale animation.
  - Image section: if `imageUrl` exists, use Next `<Image>` with `aspect-video w-full object-cover rounded-t-2xl`; otherwise show a placeholder div (`aspect-video bg-[var(--accent)]`) with a scissors SVG icon.
  - Content area: service name as `<h2>`, description paragraph (fallback to `noDescription` dict key), info row with duration (e.g. "30 min") and price (with `discount` strikethrough when `discount > 0`).
  - CTA button "Book this service" calling `usePublicBooking().setServices([...])` then `router.push(\`/${slug}/booking\`)`.
  - Close via X button (top-right absolute), backdrop click (`onClick` on backdrop overlay), and Escape key (native `<dialog>` behavior).
- [x] Create `cukkr-web/src/public-booking/components/BarberDetailModal.tsx` — same `<dialog>` pattern as `ServiceDetailModal`, accepting `barber: PublicBarber`, `slug: string`, `dict: unknown`, `onClose`:
  - Large avatar image (or initial-based fallback) centered in the card.
  - Barber name as `<h2>`.
  - Full `bio` text (fallback to `noBio` dict key).
  - CTA button "Book with this barber" calling `usePublicBooking().setBarber(barber.id, barber.name)` then `router.push(\`/${slug}/booking\`)`.
  - Same close mechanics (X, backdrop, Escape) and animation.
- [x] In `cukkr-web/src/public-booking/components/BarbershopTabs.tsx`, add state: `const [modalService, setModalService] = useState<PublicService | null>(null)` and `const [modalBarber, setModalBarber] = useState<PublicBarber | null>(null)`.
- [x] Redesign the Services tab in `BarbershopTabs.tsx`: change list items to a responsive grid (`grid grid-cols-1 md:grid-cols-2 gap-3`), each card showing thumbnail image (or placeholder), name, truncated description (`line-clamp-2`), and duration/price row. Card `onClick` calls `setModalService(service)`.
- [x] Redesign the Barbers tab in `BarbershopTabs.tsx`: change to responsive grid (`grid grid-cols-1 md:grid-cols-2 gap-3`), each card showing avatar (left, `w-12 h-12`) and name + truncated bio (`line-clamp-2`). Card `onClick` calls `setModalBarber(barber)`.
- [x] Render both modals conditionally at the bottom of `BarbershopTabs.tsx` using the state variables and pass `onClose` to reset state to `null`.
- [x] In `cukkr-web/app/[slug]/page.tsx`, import `PublicBookingProvider` from `@/src/public-booking/context/PublicBookingContext` and wrap `BarbershopTabs` with it so modal CTAs can access booking context.
- [x] Run `bun run lint:fix` and `bun run format` in `cukkr-backend/`.
- [x] Run `npm run build` (or equivalent typecheck) in `cukkr-web/` to verify no type errors.

**Manual Verification (Human Checklist):**
- [ ] Navigate to any existing barbershop landing page (`/[slug]`) in a browser — confirm the Services tab shows a responsive grid of cards with thumbnail images (or brand-colored placeholder + scissors icon), service name, truncated description, and duration/price.
- [ ] Click a service card — confirm `ServiceDetailModal` opens with full image (or placeholder), service name, full description, duration, price (with discount strikethrough if applicable), and a "Book this service" / "Booking layanan ini" button.
- [ ] Click the CTA button in the modal — confirm it navigates to `/${slug}/booking` with the service pre-selected in the booking flow.
- [ ] Close the modal via X button, clicking backdrop, and pressing Escape key — confirm all three methods work and the modal animates out.
- [ ] Switch to the Barbers tab — confirm cards show avatar (left) and name + truncated bio (1-2 lines) in a responsive grid.
- [ ] Click a barber card — confirm `BarberDetailModal` opens with large avatar, full name, full bio (or "Belum ada informasi." fallback), and a "Book with this barber" / "Booking dengan barber ini" button.
- [ ] Click the CTA button in the barber modal — confirm it navigates to `/${slug}/booking` with the barber pre-selected.
- [ ] Test on a mobile viewport (375px) — confirm cards stack in single column and modals remain usable at narrow widths.
- [ ] Test on a barbershop with no services (shows "Layanan segera hadir.") and no barbers (shows "Detail tim segera hadir.") — confirm the tabs still render correctly and no modals can open.

**Tags:** `cukkr-backend`, `cukkr-web`
