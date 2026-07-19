# Barbershop Landing Page Enrichment

**Date:** 2026-07-18
**Status:** implemented

## Goal

Enrich `cukkr-web`'s public barbershop landing page (`[slug]/page.tsx`) to display more information beyond just logo, name, description, address, and a "Book Now" button. The page currently feels empty — most data returned by the backend API is unused.

---

## Current State vs Target

### Before (current)
```
Logo (image or yellow initial circle)
Name
Description
Address card
Book Now button
Powered by cukkr
```

### After (target)
```
Logo (image or polished yellow initial circle)
Name + Open/Closed status badge
Description
Services list (text-only cards, strikethrough discounts)
Barbers grid (2-col avatar cards)
Weekly schedule (7 rows, today highlighted bold+yellow-bg)
Address (plain text)
Sticky bottom: Book Now (full-width yellow)
Powered by cukkr
```

---

## Decisions

| # | Item | Choice | Reason |
|---|------|--------|--------|
| 1 | Section order | Logo → Name+Status → Description → Services → Barbers → Schedule → Address | Booking-focused flow |
| 2 | Logo fallback | Yellow (#ffc81e) circle + bold serif letter + shadow | Polished, minimal, matches brand |
| 3 | Data integration | Extend `getBarbershopInfo()` action | One API call, no redundancy |
| 4 | Discount display | Strikethrough original + discounted price | Clear value proposition |
| 5 | Barber layout | 2-column grid of avatar + name cards | Efficient for 4+ barbers |
| 6 | Schedule API | Add `openHours` to existing `GET /public/barbershop/:slug` | Single API call |
| 7 | Status badge | Green/red badge next to barbershop name | Immediately scannable |
| 8 | Address | Plain text | No external deps |
| 9 | CTA | Full-width Book Now only in sticky bottom bar | Max tap target |
| 10 | Schedule highlight | Bold + subtle yellow bg on today's row | Easy to spot current day |
| 11 | Empty services | "Services coming soon! Please contact the shop directly." | Transparent & helpful |
| 12 | Empty barbers | "Team details coming soon" (muted text) | Acknowledges section |
| 13 | Day labels | English 3-letter (Mon, Tue, Wed...) | Compact, universal |
| 14 | Time format | 24-hour (09:00 - 21:00) | Unambiguous, compact |
| 15 | Currency | Rp XXX.XXX (dot separator) | Localized for target market |
| 16 | Service images | Not shown, text-only | Early-stage shops won't have them |
| 17 | Card style | Neutral white/gray | Clean, consistent |

---

## Implementation Plan

### Step 1: Backend — Add openHours to public barbershop endpoint

**File:** `cukkr-backend/src/modules/public/model.ts`

- Import `OpenHoursModel.OpenHoursDay` from `../open-hours/model`
- Add `openHours: t.Array(OpenHoursModel.OpenHoursDay)` to `PublicBarbershopResponse`

**File:** `cukkr-backend/src/modules/public/service.ts`

- Import `OpenHoursService` from `../open-hours/service`
- In `getPublicBarbershop()`: call `OpenHoursService.getWeeklyScheduleForOrganization(org.id)` and include result as `openHours` in return object

### Step 2: Frontend — Extend action types

**File:** `cukkr-web/src/public-booking/actions/booking.actions.ts`

- Extend `BarbershopInfo` interface:
  ```typescript
  export interface BarbershopInfo {
    name: string;
    description?: string | null;
    address?: string | null;
    logoUrl?: string | null;
    services: PublicService[];
    barbers: PublicBarber[];
    openHours: OpenHoursDay[];
  }
  ```
- Add `OpenHoursDay` interface:
  ```typescript
  export interface OpenHoursDay {
    dayOfWeek: number; // 0=Sunday..6=Saturday
    isOpen: boolean;
    openTime: string | null;
    closeTime: string | null;
  }
  ```

### Step 3: Frontend — Redesign barbershop landing page

**File:** `cukkr-web/app/[slug]/page.tsx`

Rewrite the page with the following sections:

#### 3a. Logo (keep existing, polish fallback)
- Image: 24x24 rounded-3xl with shadow
- Fallback: Yellow (#ffc81e) circle, bold serif letter, subtle shadow + border

#### 3b. Open/Closed status badge (new)
- Next to barbershop name
- Green dot + "Open" text when currently open, red dot + "Closed" when closed
- Compute from `openHours` data: map today's dayOfWeek → check if current time falls within openTime-closeTime
- Note: requires knowing current server time. Use `new Date()` in server component to get today's dayOfWeek

#### 3c. Services section (new — was unused from API)
- Section header: "Services"
- List of text-only cards (white bg, rounded-2xl, subtle shadow/border)
- Each card shows:
  - Service name (bold)
  - Duration (muted) — e.g. "30 min" (only if `duration > 0`)
  - Price: discounted price with strikethrough original if `discount > 0`
    - Discounted: compute `price - (price * discount / 100)` → format as `Rp XXX.XXX`
    - Original: strikethrough, muted
- Empty state: "Services coming soon! Please contact the shop directly."

#### 3d. Barbers section (new — was unused from API)
- Section header: "Our Barbers"
- 2-column grid
- Each card: avatar circle (image or initial fallback) + name below, centered
- Empty state: "Team details coming soon" (muted text)

#### 3e. Weekly schedule (new)
- Section header: "Opening Hours"
- 7 rows, one per day
- Day label: "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
- Time: "09:00 - 21:00" or "Closed" (muted, italic)
- Today's row: bold text + subtle yellow (#fef3c7) background highlight
- Use `dayOfWeek` from `openHours`

#### 3f. Address (keep existing, polish)
- Keep existing address card style

#### 3g. Sticky bottom CTA (replace current inline button)
- Fixed to viewport bottom
- Full-width yellow (#ffc81e) button
- Text: "Book Now"
- Link: `/[slug]/booking`
- White background behind the bar, slight top border/shadow

### Step 4: Type sync (if backend types changed for frontend types)

No TypeScript type sharing between backend/frontend is currently automated — types are defined manually in `booking.actions.ts`. Just update the interfaces as described in Step 2.

---

## Files to Change

| File | Change |
|------|--------|
| `cukkr-backend/src/modules/public/model.ts` | Add `openHours` field to `PublicBarbershopResponse` |
| `cukkr-backend/src/modules/public/service.ts` | Fetch open hours in `getPublicBarbershop()` |
| `cukkr-web/src/public-booking/actions/booking.actions.ts` | Extend `BarbershopInfo` interface, add `OpenHoursDay` |
| `cukkr-web/app/[slug]/page.tsx` | Full page redesign with all sections |

---

## Edge Cases

- **No open hours configured**: Schedule shows all 7 days as "Closed"
- **Barbershop has no barbers**: Show empty state instead of grid
- **Barbershop has no services**: Show empty state instead of list
- **Midnight crossing**: Barbershop open until next day (e.g. 20:00-02:00) — "Open Now" check must handle wrap-around
- **No data at all (API error)**: Already handled — redirects to `notFound()`

---

## Out of Scope (Future)

- Social media links (no database field)
- Google Maps integration (explicitly rejected)
- Photo gallery (no backend support)
- Service images (explicitly rejected for now)
- Reviews/ratings (no database table)
