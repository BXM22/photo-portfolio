# Photo Portfolio

A full-stack photo portfolio site: a public gallery with albums, tags, and search, plus a password-protected admin dashboard for uploading and organizing photos. Built to be both a real, deployable app and a guided example of a modern full-stack TypeScript stack — every file has comments explaining *why* it's built the way it is, not just what it does.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) | Server Components fetch data directly from the database with no separate API layer needed for reads; Route Handlers provide a real REST-ish API for mutations. |
| Language | TypeScript | End-to-end type safety, including types inferred straight from the database schema via Prisma. |
| Database | PostgreSQL | A relational database is the right fit for photos/albums/tags, which have real relationships (one-to-many, many-to-many). |
| ORM | [Prisma](https://prisma.io) | Type-safe queries generated from a single schema file, plus tracked SQL migrations. |
| Auth | [NextAuth.js (Auth.js) v5](https://authjs.dev) | Credentials-based admin login with JWT sessions — no third-party OAuth needed for a single-admin site. |
| File storage | AWS S3 + CloudFront | Photos upload directly from the browser to S3 via presigned URLs (the server never touches image bytes) and are served worldwide through a CloudFront CDN. |
| Styling | Tailwind CSS | Utility-first styling, no separate CSS files to maintain. |
| Validation | [Zod](https://zod.dev) | Every API route validates its input at runtime, not just at compile time. |
| Testing | Vitest (unit) + Playwright (E2E) | Fast unit tests for business logic, browser-driven smoke tests for critical user flows. |
| CI/CD | GitHub Actions → Vercel | Lint/typecheck/test/build on every PR; deploy on merge. |

## Features

- **Public gallery** — a responsive masonry grid of photos with a full-screen lightbox (keyboard navigation included).
- **Albums** — group photos into named collections with their own detail pages.
- **Tags** — assign multiple tags per photo; filter the gallery by tag or free-text search, both reflected in the URL so views are shareable.
- **Admin dashboard** (`/admin`, behind login) — upload photos (drag in multiple files, tag/album them inline), manage/delete existing photos and albums, and mark photos as "featured."
- **Real cloud storage** — presigned-URL uploads straight to S3, not routed through the app server; images served through a CloudFront CDN.

## Project structure

```
prisma/
  schema.prisma        # database schema (see its comments for the full data model walkthrough)
  seed.ts               # creates the one admin user from env vars
src/
  app/
    page.tsx             # public gallery (Server Component)
    albums/, tags/        # public album/tag pages
    admin/                 # password-protected dashboard (login, upload, manage photos/albums)
    api/                    # Route Handlers: /api/upload, /api/photos, /api/albums, /api/tags, NextAuth
  components/             # public-facing UI (PhotoGrid, Lightbox, TagFilter, SearchBar, ...)
  components/admin/        # admin-only UI (UploadForm, PhotoAdminRow, AlbumAdminRow)
  lib/
    prisma.ts               # Prisma Client singleton (see its comments on the hot-reload problem it solves)
    auth.ts                  # NextAuth configuration
    s3.ts                     # presigned-upload-URL helpers
    queries.ts                 # shared read queries, used by both Server Components and public API routes
    validations.ts               # Zod schemas for every API input
  proxy.ts                # route protection for /admin (Next.js 16's renamed "middleware")
tests/e2e/                # Playwright smoke tests
.github/workflows/ci.yml  # lint, typecheck, unit tests, build, E2E — on every PR
docs/SETUP.md             # detailed setup instructions (database, S3, CloudFront, deployment)
```

## Quick start

See **[docs/SETUP.md](docs/SETUP.md)** for the full walkthrough (database, AWS S3, CloudFront, deployment). The short version:

```bash
npm install
cp .env.example .env        # then fill in the values — see docs/SETUP.md
docker compose up -d        # local Postgres
npm run db:generate
npm run db:migrate
npm run db:seed             # creates your admin login from ADMIN_EMAIL/ADMIN_PASSWORD in .env
npm run dev
```

Visit `http://localhost:3000` for the gallery, `http://localhost:3000/admin/login` for the dashboard.

## How data flows (the short version)

- **Public pages are Server Components.** `src/app/page.tsx` and friends call functions in `src/lib/queries.ts` directly — no HTTP request to the app's own API, no client-side loading spinner for the first render.
- **Client-side interactivity (tag filter, search) calls the same query logic through a public API route** (`GET /api/photos`, etc.), because code running in the browser can't call a database function directly — it has to go over HTTP.
- **Admin mutations (upload, edit, delete) go through Route Handlers** (`POST /api/photos`, `PATCH /api/photos/:id`, ...), each gated by `requireAdmin()` (`src/lib/require-admin.ts`) in addition to the broader `/admin` route protection in `src/proxy.ts` — a deliberate "defense in depth" instead of relying on just one auth check.
- **Uploads never pass through the Next.js server.** The browser asks the server for a short-lived, cryptographically-signed S3 URL (`POST /api/upload`), then uploads the raw file directly to S3 using that URL. See the comments in `src/lib/s3.ts` for the full explanation.

## Testing

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm test            # Vitest unit tests (src/lib/__tests__/)
npm run test:e2e    # Playwright E2E smoke tests (tests/e2e/)
```

All four run automatically on every pull request via GitHub Actions (`.github/workflows/ci.yml`), against a real, ephemeral Postgres instance.

## Possible next steps

Left as deliberate follow-ups rather than built-in, so there's room to extend the project yourself:

- Generate a real blur placeholder (`blurDataUrl`) server-side at upload time (e.g. with `sharp` or `plaiceholder`) instead of leaving it empty.
- Delete the underlying S3 object when a photo is deleted (currently only the database row is removed — see the `TODO` in `src/app/api/photos/[id]/route.ts`).
- Image resizing/optimization pipeline (e.g. a Lambda triggered on S3 upload) instead of relying solely on `next/image`'s on-the-fly optimization.
- Drag-and-drop reordering of photos within an album.
- Rate limiting on the public API routes.

## License

MIT — do whatever you'd like with this as a learning resource or a starting point for your own portfolio.
