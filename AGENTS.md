# Cukkr Monorepo — Agent Guidelines

## Project Overview

Cukkr is a **barbershop management SaaS** built as a monorepo with four sub-projects:

| Sub-project | Stack | Purpose |
|---|---|---|
| `cukkr-backend` | Bun · Elysia · Drizzle ORM · PostgreSQL · Better Auth | REST API, auth, multi-tenant barbershop management |
| `cukkr-frontend` | Expo · React Native · TanStack Query · Eden Treaty | Mobile/web app for barbershop owners and staff |
| `cukkr-strapi` | Strapi 5 · PostgreSQL | Headless CMS for content management for cukkr-web |
| `cukkr-web` | Next.js 16 · React 19 · Eden Treaty | Marketing website & landing page & booking for customer external, generated booking site for customer for each barbershop will be in here |

The backend exposes a fully type-safe Elysia API. The frontend consumes it via **Eden Treaty**, a type-safe HTTP client whose types are auto-generated from the backend's runtime type definitions.

---

## Reading Sub-project AGENTS.md

Every agent working in this monorepo **must read the relevant sub-project `AGENTS.md` before writing any code**. These files are the authoritative source for:

- Coding conventions, style rules, and naming patterns
- Tech stack details and API/client usage patterns
- File structure and module organization
- Exact commands for building, testing, linting, and running each project

| Scope | File to read |
|---|---|
| Backend (API routes, schema, services, tests) | `cukkr-backend/AGENTS.md` |
| Frontend (screens, hooks, services, components) | `cukkr-frontend/AGENTS.md` |
| Strapi CMS (content types, plugins, config) | `cukkr-strapi/AGENTS.md` |
| Web landing (pages, components, SEO, booking site) | `cukkr-web/AGENTS.md` |
| Task touches multiple | Read all relevant |

> If any command needs to be run (dev server, tests, migrations, linting), **always check the sub-project's `AGENTS.md` for the exact command** — never guess or assume the command from memory.

---

## Sync Frontend Types

Whenever the backend adds, changes, or removes an endpoint, run the following command in `cukkr-frontend` to keep Eden/Elysia types in sync:

```bash
bunx type-share-eden-elysia sync http://localhost:3000/types/app.d.ts
```

> Run from the `cukkr-frontend/` root. The backend must already be running (`bun run dev` in `cukkr-backend/`).

After syncing, `cukkr-frontend/src/types/app.d.ts` is automatically updated with all the latest endpoints and types from the backend. Proceed with frontend implementation once the sync succeeds.

---

## Monorepo Structure

```
cukkr/                        # Monorepo root
├── AGENTS.md                 # This file — monorepo overview and cross-project guide
├── cukkr-backend/            # Bun + Elysia API server
│   ├── AGENTS.md             # Backend conventions, commands, module patterns
│   └── src/
│       └── modules/          # Feature modules: auth, bookings, services, barbers, …
├── cukkr-frontend/           # Expo React Native app (mobile + web)
│   ├── AGENTS.md             # Frontend conventions, commands, feature patterns
│   └── src/
│       └── features/         # Feature modules: auth, barbershop, schedule, workspace, …
├── cukkr-strapi/             # Strapi 5 Headless CMS
│   └── src/
│       └── api/              # Strapi content types and plugins
└── cukkr-web/                # Next.js 16 landing page
    ├── AGENTS.md             # Next.js conventions, App Router rules
    └── app/                  # Pages, layouts, and components
```

---

## Cross-Project Tasks

When a task touches both sub-projects, follow this order:

1. Read `cukkr-backend/AGENTS.md` and `cukkr-frontend/AGENTS.md` before starting.
2. Implement backend changes first: schema → migration → service → handler → tests.
3. Run the backend dev server (`bun run dev` in `cukkr-backend/`).
4. Sync frontend types: `bunx type-share-eden-elysia sync http://localhost:3000/types/app.d.ts` (run from `cukkr-frontend/`).
5. Implement frontend changes: service → hook → screen.
6. Verify end-to-end in the running app.

---

## Task Documentation

Structured tasks are stored in `docs/tasks/YYYY-MM-DD/<task-slug>.md` at the monorepo root. Use `/create-task` to write a new task and `/implement-task` to execute a pending one. Both skills read this `AGENTS.md` and the relevant sub-project `AGENTS.md` automatically.
