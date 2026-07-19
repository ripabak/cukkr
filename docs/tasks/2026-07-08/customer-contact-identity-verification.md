# Customer Contact Identity Verification

## Summary

Replace the current `isVerified` boolean on the customer table with per-channel verification columns (`email_verified`, `phone_verified`). Add identity verification flow that is triggered from staff bookings and walk-in PIN bookings. Public appointment booking verification automatically marks the customer's email as verified.

---

## Decisions Recap

| # | Item | Choice |
|---|------|--------|
| 1 | Table structure | Columns directly on `customer` table |
| 2 | Columns added | `email_verified` (bool) + `phone_verified` (bool) + `email_verified_at` + `phone_verified_at` + `email_verification_token` + `phone_verification_token` |
| 3 | Old column | Remove `is_verified` |
| 4 | Token storage | On customer table (`email_verification_token`, `phone_verification_token`) |
| 5 | Token expiry | No expiry — valid until used |
| 6 | Migration data | Reset all: `email_verified = false`, `phone_verified = false` |
| 7 | Public appointment → customer verify | Auto-verify: when booking is verified, customer.email_verified = true |
| 8 | Staff booking for already-verified contact | Skip — don't resend verification |
| 9 | Staff booking for unverified contact | Send identity verification email (behind the scenes) |
| 10 | Walk-in PIN → identity verification | Fire & forget async, triggered inside `createWalkInBooking` |
| 11 | Identity verification sending location | Inside `doCreateBooking` |
| 12 | Repeat verification (pending token) | Always resend on new booking — generate new token, invalidate old |
| 13 | Verify success redirect | Redirect to public booking page `{baseUrl}/{slug}` |
| 14 | Verification email template | Similar to appointment verification, different content, English |
| 15 | hasContact filter | Has ANY verified contact: `(email IS NOT NULL AND email_verified = true) OR (phone IS NOT NULL AND phone_verified = true)` |
| 16 | Frontend UI | Filter only, no badge |
| 17 | Phone verification | Defer — add columns but no implementation yet |
| 18 | Skip identity verification | Skip for `source = 'customer' AND type = 'appointment'` (handled by booking verification flow) |

---

## Implementation Plan

- [x] **1. Database Migration** — Add `email_verified`, `phone_verified`, `email_verified_at`, `phone_verified_at`, `email_verification_token`, `phone_verification_token`; drop `is_verified` (`drizzle/20260708140000_add-customer-contact-verification.sql`)
- [x] **2. Schema Update** — Replace `isVerified` with new columns in `cukkr-backend/src/modules/bookings/schema.ts`
- [x] **3. Identity Verification Email Template** — Add `sendIdentityVerificationEmail` in `cukkr-backend/src/lib/mail.ts`
- [x] **4. Update `doCreateBooking`** — Remove `isVerified` on customer insert; add identity verification trigger after booking creation (`cukkr-backend/src/modules/bookings/service.ts`)
- [x] **5. Update `verifyAppointmentEmail`** — Auto-verify customer email when booking is verified (`cukkr-backend/src/modules/bookings/service.ts`)
- [x] **6. Identity Verification Public Endpoint** — Add `GET /:slug/identity/verify` route (`cukkr-backend/src/modules/public-booking/handler.ts`)
- [x] **7. Update Customer List `hasContact` Filter** — Filter by verified email/phone instead of just presence (`cukkr-backend/src/modules/customer-management/service.ts`)
- [x] **8. Sync Frontend Types** — Run `bunx type-share-eden-elysia sync` from `cukkr-frontend/`
- [x] **9. Frontend — Update Customer Types** — Update `CustomerDetailScreen.tsx` verified indicator to use new fields; update customer management model/service fields
- [x] **10. Tests** — Update existing test assertions for new fields (`customer-management.test.ts`, `bookings.test.ts`, `analytics.test.ts`, `analytics-detail.test.ts`, `barbers.test.ts`); update seed script

---

## Verification Checklist

- [x] Migration runs without errors
- [x] `is_verified` column removed, new columns present
- [x] All existing customers have `email_verified = false`, `phone_verified = false`
- [x] Staff creates booking → identity verification email sent if customer email unverified
- [x] Staff creates booking for verified customer → no email sent
- [x] Public appointment booking → customer auto-verified when booking confirmed
- [x] Public appointment booking → identity verification NOT sent separately (no duplicate)
- [x] Walk-in PIN booking with email → identity verification email sent (fire & forget)
- [x] Walk-in PIN booking without email → no error, no email
- [ ] Identity verification link clicked → redirect to booking page
- [ ] Identity verification link with invalid token → redirect with error param
- [x] Customer list `hasContact=true` shows only verified contacts
- [x] Customer list `hasContact=false` shows unverified + no-contact customers
- [x] Frontend types synced
- [x] `bun run lint:fix` passes
- [x] `bun run format` passes
- [x] All tests pass (370/370)
