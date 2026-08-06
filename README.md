# Cukkr — Barbershop Management SaaS

Cukkr is a barbershop management platform built as a monorepo with four sub-projects.

## Sub-projects

| Project | Stack | Purpose |
|---|---|---|
| `cukkr-backend` | Bun · Elysia · Drizzle ORM · PostgreSQL · Better Auth | REST API, auth, multi-tenant barbershop management |
| `cukkr-frontend` | Expo · React Native · TanStack Query · Eden Treaty | Mobile/web app for barbershop owners and staff |
| `cukkr-strapi` | Strapi 5 · PostgreSQL | Headless CMS for content management |
| `cukkr-web` | Next.js 16 · React 19 · Eden Treaty | Marketing website & customer booking |

## Directory Structure

```
cukkr/
├── cukkr-backend/       # API server
├── cukkr-frontend/      # Mobile & web app
├── cukkr-strapi/        # Headless CMS
├── cukkr-web/           # Landing page & booking site
├── docker-compose.yml   # Unified Docker Compose
├── scripts/             # Docker entrypoint helpers
└── .env.example         # Template for root .env (secrets)
```

## Quick Start — Docker Compose

Semua service bisa dijalankan dengan satu perintah:

```bash
# 1. Setup env (generate semua secret otomatis)
bash scripts/setup.sh

# 2. Build & jalankan
docker compose up --build
```

### Service URLs

| Service | URL |
|---|---|
| Backend API | `http://localhost:3000` |
| Web (Next.js) | `http://localhost:3001` |
| Frontend (Expo) | `http://localhost:8080` |
| Strapi CMS | `http://localhost:1337` |

### Environment Variables

Semua variable bisa dioverride via root `.env`. Default sudah aman untuk development, kecuali:

| Variable | Wajib | Keterangan |
|---|---|---|
| `BETTER_AUTH_SECRET` | Ya | Secret untuk Better Auth |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Ya | Encryption key untuk Next.js server actions |
| `VAPID_PUBLIC_KEY` | Tidak | Web Push — kosong aman untuk dev |
| `VAPID_PRIVATE_KEY` | Tidak | Web Push — kosong aman untuk dev |
| `SMTP_USER` | Tidak | Email — kosong aman untuk dev |
| `SMTP_PASS` | Tidak | Email — kosong aman untuk dev |
| `STRAPI_API_TOKEN` | Tidak | Token untuk web akses Strapi |
| `STORAGE_ENDPOINT` | Tidak | S3 storage — default `http://localhost:9000` |
| `STORAGE_ACCESS_KEY` | Tidak | S3 access key |
| `STORAGE_SECRET_KEY` | Tidak | S3 secret key |

### Port Mapping

Semua port bisa dioverride di `.env`:

| Variable | Default | Service |
|---|---|---|
| `BACKEND_PORT` | 3000 | Backend API |
| `WEB_PORT` | 3001 | Next.js web |
| `FRONTEND_PORT` | 8080 | Expo frontend |
| `STRAPI_PORT` | 1337 | Strapi CMS |
| `DB_PORT` | 5432 | PostgreSQL |

## Development Lokal

Setiap sub-project bisa jalan sendiri tanpa Docker:

```bash
# Backend
cd cukkr-backend && bun run dev

# Frontend (Expo)
cd cukkr-frontend && npx expo start

# Web
cd cukkr-web && bun run dev

# Strapi
cd cukkr-strapi && npm run develop
```

Lihat `AGENTS.md` di masing-masing sub-project untuk panduan lengkap.

## Type Sync

Setelah ada perubahan endpoint di backend, sync types ke frontend:

```bash
cd cukkr-frontend
bunx type-share-eden-elysia sync http://localhost:3000/types/app.d.ts
```
