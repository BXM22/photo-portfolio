# BXTXM

A photography portfolio for landscape and travel work — long horizons, low light, and still frames shot on location.

Built as a one-page site in **Next.js 16**, **React 19**, and **TypeScript**, with a Postgres-backed Work CMS.

<img src="src/assets/hero.jpg" alt="People standing on a still salt lake, with mountains reflected in the water" width="960">

## Overview

BXTXM is a personal photography site: full-viewport hero, About, a horizontal Work scroller of location sets, and an Instagram orbit. The photograph leads; type and chrome stay quiet.

Work slides (title, year, left / center / right) come from PostgreSQL. Hero, About, and Instagram stay static. Editing Work sets happens at `/admin` — see the local `ADMIN.md` file for that flow (gitignored; copy from this README’s CMS section if you do not have one). Hosting and later upgrades: [nextsteps.md](nextsteps.md).

## Prerequisites

- **Node.js 22** and npm
- **Docker** (local PostgreSQL 16 on port `5433`)
- An S3-compatible bucket only if you want to **upload new photos** (AWS S3, Cloudflare R2, or MinIO). Seeded Grand Tetons and Japan images live under `public/seed/` and work without a bucket.

## Full local setup

```bash
npm run setup
npm run dev
```

That installs packages, creates `.env` if needed, fills `AUTH_SECRET` and local admin defaults when those fields are empty, starts Postgres, then generates / migrates / seeds the database.

Flags:

```bash
bash scripts/setup.sh --dev       # setup, then start the Next.js server
bash scripts/setup.sh --verify    # also run lint, typecheck, and tests
```

Or step through it by hand:

### 1. Install

```bash
npm install
```

### 2. Environment

```bash
cp .env.example .env
```

Fill `.env` (never commit it):

| Variable | Required for | Notes |
| --- | --- | --- |
| `DATABASE_URL` | App + Prisma | Default matches Compose: `postgresql://postgres:postgres@localhost:5433/photo_portfolio` |
| `AUTH_SECRET` | Login / sessions | `openssl rand -base64 32` |
| `ADMIN_EMAIL` | Seed + login | Unique admin user |
| `ADMIN_PASSWORD` | Seed + login | Hashed with bcrypt on `npm run db:seed` |
| `AWS_REGION` | New uploads | e.g. `us-east-1`; R2 often uses `auto` |
| `AWS_ACCESS_KEY_ID` | New uploads | IAM or R2 API token |
| `AWS_SECRET_ACCESS_KEY` | New uploads | |
| `AWS_S3_BUCKET_NAME` | New uploads | Bucket name |
| `NEXT_PUBLIC_CDN_URL` | Showing uploaded files | Public origin, no trailing slash. Empty uses site-relative URLs (`/seed/...` for seeded keys). |
| `AWS_S3_ENDPOINT` | Optional | Set for R2 or MinIO (path-style). |

`next/image` reads `NEXT_PUBLIC_CDN_URL` at build/dev start for `images.remotePatterns`. Restart `npm run dev` after changing it.

### 3. Database

```bash
docker compose up -d
npm run db:generate
npm run db:migrate
npm run db:seed
```

Compose maps host **5433** → container **5432**. Wait until Postgres is healthy (`docker compose ps`) before migrate.

- `db:migrate` — local (can prompt for a migration name)
- `db:migrate:deploy` — apply existing migrations only (CI / prod)
- `db:seed` — upserts the admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` and the Grand Tetons + Japan sets
- `db:studio` — Prisma Studio

Re-seed after changing the admin password in `.env`.

### 4. Dev server

```bash
npm run dev
```

| Surface | URL |
| --- | --- |
| Public site | [http://localhost:3000](http://localhost:3000) |
| Admin login | [http://localhost:3000/admin/login](http://localhost:3000/admin/login) |

### 5. Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Next.js development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest |
| `npm run setup` | Full local setup (deps, `.env`, Docker Postgres, migrate, seed) |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:migrate:deploy` | `prisma migrate deploy` |
| `npm run db:seed` | Seed admin + v1 Work sets |
| `npm run db:studio` | Prisma Studio |

## How the app is put together

- **Public pages** are React Server Components. The homepage queries complete albums (`src/lib/queries.ts`) and passes `Location[]` into the client `Work` scroller.
- **Mutations** are Route Handlers. Each write calls `requireAdmin()`; `src/proxy.ts` also guards `/admin` and `/api/upload`.
- **Uploads:** admin browser `POST /api/upload` → short-lived presigned `PUT` to the bucket → `POST`/`PATCH /api/albums` with metadata only. The Next.js server never proxies image bytes.
- **Public image URL:** `` `${NEXT_PUBLIC_CDN_URL}/${storageKey}` ``, or `/${storageKey}` when the CDN env is empty.

### API

| Route | Access |
| --- | --- |
| `GET /api/photos` | Public (paginated; `tag`, `album`, `q`) |
| `POST /api/photos` | Admin |
| `PATCH` / `DELETE /api/photos/[id]` | Admin |
| `GET /api/albums` | Public |
| `POST /api/albums` | Admin |
| `PATCH` / `DELETE /api/albums/[id]` | Admin |
| `GET /api/tags` | Public |
| `POST /api/tags` | Admin |
| `POST /api/upload` | Admin |
| `GET` / `POST /api/auth/[...nextauth]` | Auth.js |

Album create/patch requires `title`, `year`, and exactly three photos with distinct slots (`left`, `center`, `right`). Deleting an album sets `photo.albumId` to null; files in the bucket are not deleted.

## CMS (short)

1. Open `/admin/login` with the seeded email and password.
2. **New set:** title, year, Left / Center / Right files, alt per photo. Save uploads then writes the album.
3. Reorder with Up / Down. Edit to replace a slot or copy. Delete set does not delete stored objects.

Day-to-day operator notes (credentials, CORS, bucket CORS, troubleshooting) belong in local **`ADMIN.md`**, which is gitignored.

## Stack

### Frontend

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| UI | React 19 |
| Language | TypeScript |
| Styling | CSS Modules, Tailwind CSS v4 tokens |
| Type | `next/font` (Archivo Black, Space Grotesk) |
| Images | `next/image` |
| CI | GitHub Actions |

### Backend

| Layer | Choice |
| --- | --- |
| Runtime | Next.js Route Handlers and Server Components |
| Database | PostgreSQL 16 (Docker Compose locally) |
| ORM | Prisma |
| Auth | Auth.js (NextAuth v5), bcrypt |
| Validation | Zod |
| Storage | S3-compatible object storage (AWS S3 or R2) with presigned uploads |
| Tests | Vitest |

## Highlights

- Full-bleed hero using `next/image` with blur placeholder, eager load, and high fetch priority for LCP
- CSS Modules plus Tailwind v4 design tokens instead of utility-heavy markup
- In-page hash nav with smooth scroll, skipped when the user prefers reduced motion
- Skip link, named landmarks, visible focus rings, and 44px tap targets
- Work CMS: unique `(albumId, slot)`, Auth.js on every mutation, presigned uploads, Zod at API boundaries

## Structure

```
src/
  app/          Public pages, Work, Contact, admin, API
  components/   Navbar, PhotoDialog
  lib/          Prisma, Auth.js, Zod, S3, queries
  styles/       Global tokens and CSS modules
  assets/       Photographs
prisma/         Schema, migrations, seed
public/seed/    Seeded Work images (no bucket required)
```

## Resume bullets

- Designed a PostgreSQL schema for Work location sets: an album is title + year + exactly three photos (`left` / `center` / `right`), with a unique `(albumId, slot)` constraint and `onDelete: SetNull` so deleting a set does not wipe files.
- Built admin APIs with Auth.js sessions and bcrypt; every mutation calls `requireAdmin()` in the handler, not only behind `/admin` UI protection.
- Implemented direct-to-object-storage uploads via short-lived presigned URLs so the Next.js server never proxies image bytes; public URLs are derived from a stored key, not a hardcoded bucket URL.
- Validated all API input with Zod; paginated the public photo list.

## License

[MIT](LICENSE)
