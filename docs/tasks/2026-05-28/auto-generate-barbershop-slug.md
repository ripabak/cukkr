# Cukkr Backlog Tasks

> Last updated: 2026-05-28

---

## TASK-003 · Auto-Generate Barbershop Slug on Creation

**Description:**
When a user creates a new barbershop, the current flow requires the frontend to generate a slug from the barbershop name using `generateSlug()` in `cukkr-frontend/src/features/workspace/utils/slug-generator.ts`, display it to the user, check its availability via `GET /api/barbershop/slug-check`, and then pass both `name` and `slug` to `authClient.organization.create()`. This is unfair because a user who picks a common name like "Barber Jakarta" can lock the clean slug `barber-jakarta` while others cannot. The desired behavior is for the backend to always auto-generate the slug in the format `<kebab-name>-<5-char-random-code>` (e.g., `barber-jakarta-k3f9x`) so that every barbershop gets a unique, unpredictable slug on creation. In the future, premium users will be allowed to set a custom slug via the existing `PATCH /api/barbershop/settings` endpoint — this task does not change that endpoint. According to the Better Auth organization plugin docs (https://better-auth.com/docs/plugins/organization#create-an-organization), the correct server-side hook to intercept organization creation is `beforeCreateOrganization` inside the `organization()` plugin options — not `databaseHooks`. Note that Better Auth requires `slug` to be provided by the client; `beforeCreateOrganization` runs on the server and overwrites whatever slug arrives from the client with the auto-generated one. This means the frontend must still pass a `slug` field to satisfy Better Auth's TypeScript type, but it sends a simple sanitized version of the name (no random code, no availability check, not shown in the UI) — the backend hook always replaces it. The generation logic belongs in `BarbershopService.generateUniqueSlug()` (`cukkr-backend/src/modules/barbershop/service.ts`), keeping business logic out of `auth.ts`.

**Implementation Plan:**
- [x] In `cukkr-backend/src/modules/barbershop/service.ts`, add a `static async generateUniqueSlug(name: string): Promise<string>` method. The method converts `name` to lowercase kebab-case (replace spaces and non-alphanumeric chars), appends `-` and a 5-character random code using `customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 5)` from `nanoid`, then queries the `organization` table to verify uniqueness — retry up to 5 times if a collision is found.
- [x] In `cukkr-backend/src/lib/auth.ts`, add a `beforeCreateOrganization` option to the `organization()` plugin config. The hook receives the organization data, calls `BarbershopService.generateUniqueSlug(data.name)`, and returns the data with the overridden `slug`, check also if the  `slug` available before implement it.
- [x] In `cukkr-backend/src/modules/barbershop/model.ts`, update `CreateBarbershopInput` to remove the `slug` field — the new shape is `{ name, description?, address? }` only.
- [x] In `cukkr-backend/src/modules/barbershop/handler.ts`, update the `POST /barbershop` handler to remove `slug: body.slug` from the `auth.api.createOrganization` call body — the `beforeCreateOrganization` hook generates it.
- [x] Add or update `cukkr-backend/tests/modules/barbershop.test.ts` to verify that `POST /api/barbershop` with only `{ name: "Test Barber" }` returns `201` and that the returned `slug` matches the pattern `/^test-barber-[a-z0-9]{5}$/`.
- [x] Run `bun run lint:fix && bun run format` in `cukkr-backend/` and verify `bun test --env-file=.env` passes.
- [ ] Run `bunx type-share-eden-elysia sync http://localhost:3000/types/app.d.ts` from `cukkr-frontend/` to pull the updated `CreateBarbershopInput` type (no `slug` field). *(skipped: requires running backend; frontend calls authClient.organization.create() directly, not the Elysia POST /api/barbershop endpoint — sync not critical for this task)*
- [x] In `cukkr-frontend/src/features/workspace/context/CreateBarbershopContext.tsx`, remove the `slug` field from the `CreateBarbershopFormData` interface.
- [x] In `cukkr-frontend/src/features/workspace/screens/CreateBarbershopNameLogoScreen.tsx`, remove the `useBarbershopSlugCheck` import and usage, the `debouncedSlug`/`isTyping`/`isAvailable`/`isCheckingSlug`/`error`/`slugMessage`/`messageColor` variables, and the slug info `<View>` block. Update `handleCreate` to call `updateFormData({ name })` without a `slug` key. Update the `isValid` guard to only check `validation.isValid`. Keep `generateSlug` import — it is still used to silently compute the slug for `authClient.organization.create` in the next step.
- [x] In `cukkr-frontend/src/features/workspace/services/organization.service.ts`, keep `slug` in the parameter type (Better Auth requires it) but document with a comment that the backend hook will override it. No other changes here.
- [x] In `cukkr-frontend/src/features/workspace/screens/CreateBarbershopFirstServiceScreen.tsx`, update the `createOrg` call to pass `slug: generateSlug(formData.name!)` (a simple sanitized name, no random code) instead of `slug: formData.slug!`. Remove the dependency on `formData.slug`.
- [x] Run `npx tsc --noEmit` in `cukkr-frontend/` and fix any TypeScript errors.

**Manual Verification (Human Checklist):**
- [ ] Open the app and navigate to the create barbershop flow. On the name screen, type a barbershop name (e.g., "Barber Jakarta"). Verify that no slug preview or "URL: ..." info is shown — the screen should only show the name field and logo picker.
- [ ] Complete the full creation wizard (name → first service → invite barber). After creation, go to the barbershop settings screen (`/d/barbershop-settings`) and verify the `slug` field shows a value matching the pattern `barber-jakarta-XXXXX` (5 random alphanumeric characters at the end).
- [ ] Create a second barbershop with the same name "Barber Jakarta" and verify its slug is different from the first one (both end with different 5-char codes).
- [ ] Verify the public booking URL uses the auto-generated slug correctly by navigating to the barbershop's booking page.

**Tags:** `cukkr-backend`, `cukkr-frontend`
