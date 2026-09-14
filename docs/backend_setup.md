# Backend setup

Photography portfolio CMS for BXTXM: Postgres, admin auth, direct-to-object-storage uploads, albums/tags, and a public Work gallery. Built so a backend resume bullet is defensible in an interview.

Recruiters care about data modeling, locking down mutations, storing files correctly, and tradeoffs — not extra frameworks. Microservices, GraphQL, and Kafka are out of scope.

Init commit `dd3c7f7` is a pattern for Prisma, Auth.js, presigned S3, Zod, and `src/proxy.ts`. Copy the architecture, not the tutorial comments. Keep the current BXTXM hero and About. CSS stays in `src/styles/`.

---

## Resume bullets (only after it ships)

- Designed a PostgreSQL schema for photos, albums, and tags (1:N and N:N), with indexes on list queries and explicit `onDelete` (album delete does not wipe photos).
- Built admin APIs with Auth.js sessions and bcrypt; every mutation calls `requireAdmin()` in the handler, not only behind `/admin` UI protection.
- Implemented direct-to-object-storage uploads via short-lived presigned URLs so the Next.js server never proxies image bytes; public URLs are derived from a stored key, not a hardcoded bucket URL.
- Validated all API input with Zod; paginated the public photo list.

Do not list “used Prisma” with nothing behind it. Do not claim Work or Contact until those sections read from the database.

---

## Architecture

```mermaid
flowchart LR
  Browser -->|GET pages| RSC[Server Components]
  Browser -->|POST mutations| API[Route Handlers]
  RSC --> DB[(PostgreSQL)]
  API --> Auth[Auth.js session]
  API --> DB
  Browser -->|"PUT file"| S3[S3 or R2]
  API -->|"presign URL"| S3
```

- **Public pages:** Server Components query Prisma in `src/lib/queries.ts` — no HTTP hop for first paint.
- **Mutations:** Route Handlers, each gated by `requireAdmin()`.
- **Uploads:** the browser `PUT`s to a 60s presigned URL; then `POST /api/photos` stores metadata.
- **Defense in depth:** `src/proxy.ts` guards `/admin` and `/api/upload`; write handlers still check the session. Do not put `GET /api/photos` in the matcher (public reads).

### Data model

`User`, `Album`, `Photo`, `Tag`, `PhotoTag`.

| Model | Rules |
| --- | --- |
| `User` | One admin. `passwordHash` (bcrypt), unique email. |
| `Album` | `title`, unique `slug`, optional `coverPhotoId`. |
| `Photo` | Unique `storageKey` (object path, not a full URL), `width` / `height`, optional `blurDataUrl` (`@db.Text`), `featured`, optional `albumId` with `onDelete: SetNull`. Indexes on `albumId` and `createdAt`. |
| `Tag` + `PhotoTag` | Many-to-many. |

Public image URL is derived: `` `${CDN_BASE}/${storageKey}` ``.

### Target layout

```
prisma/
  schema.prisma
  seed.ts
src/
  proxy.ts
  lib/
    prisma.ts
    auth.ts
    require-admin.ts
    validations.ts
    slug.ts
    s3.ts
    queries.ts
  app/
    api/auth/[...nextauth]/route.ts
    api/upload/route.ts
    api/photos/route.ts
    api/photos/[id]/route.ts
    api/albums/route.ts
    api/albums/[id]/route.ts
    api/tags/route.ts
    admin/login/page.tsx
    admin/(dashboard)/...
    albums/page.tsx
    albums/[slug]/page.tsx
    page.tsx          # existing hero + about; add #work
```

### Out of scope

JSON-as-a-database, files in `/public`, GraphQL, a separate Express service, a contact form, restoring the old Tailwind homepage. The hero in `src/app/page.tsx` stays.

---

## Implementation steps

Follow in order.

### 0. Keep the current site

Do not replace the hero or About. Navbar Work (`#work` in `src/components/Navbar.tsx`) jumps to a new section once photos exist. `src/app/Work.tsx` can be that section component.

### 1. Dependencies and scripts

Add:

- `prisma`, `@prisma/client`
- `next-auth` (Auth.js v5)
- `bcryptjs`
- `zod`
- `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`
- `tsx` (dev) for the seed script
- `vitest` (dev) for unit tests

Scripts in `package.json`:

```json
{
  "db:generate": "prisma generate",
  "db:migrate": "prisma migrate dev",
  "db:migrate:deploy": "prisma migrate deploy",
  "db:seed": "tsx prisma/seed.ts",
  "db:studio": "prisma studio",
  "test": "vitest run"
}
```

Point Prisma seed at `prisma/seed.ts`.

### 2. Env

Add `.env.example`. Never commit `.env`.

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/photo_portfolio"
AUTH_SECRET=""
ADMIN_EMAIL=""
ADMIN_PASSWORD=""
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_S3_BUCKET_NAME=""
NEXT_PUBLIC_CDN_URL=""
```

S3-compatible storage is fine: AWS S3, Cloudflare R2, or local MinIO.

Generate `AUTH_SECRET` with `openssl rand -base64 32`.

### 3. Local Postgres

`docker-compose.yml` with Postgres matching `.env.example`:

`postgresql://postgres:postgres@localhost:5432/photo_portfolio`

Optional: MinIO in the same compose file so uploads work without an AWS account.

### 4. Schema and migrate

Write `prisma/schema.prisma` using the data model above.

```bash
npm run db:generate
npm run db:migrate
```

`prisma/seed.ts` hashes `ADMIN_PASSWORD` with bcrypt and upserts the admin user by email.

```bash
npm run db:seed
```

### 5. Prisma client

`src/lib/prisma.ts` — singleton so hot reload does not open a new client every save.

### 6. Auth

- `src/lib/auth.ts` — Credentials provider, bcrypt compare against `User.passwordHash`, JWT session.
- `src/app/api/auth/[...nextauth]/route.ts` — Auth.js route handler.
- `src/lib/require-admin.ts` — `await auth()`; if no session, return `401` JSON.
- `src/proxy.ts` (Next.js 16’s middleware rename):
  - matcher: `["/admin/:path*", "/api/upload/:path*"]`
  - anonymous `/admin` (except `/admin/login`) → redirect to login
  - already logged in on `/admin/login` → redirect to `/admin`

Do not add `GET /api/photos` to the matcher. Public reads must stay public; writes check `requireAdmin()` inside the handler.

### 7. Validation and slugs

- `src/lib/validations.ts` — Zod schemas for upload (content type, size), photo create/patch, album create/patch, tag names. Validate at every API boundary.
- `src/lib/slug.ts` — URL slugs from titles; unique in the database.

### 8. Object storage

`src/lib/s3.ts`:

- `buildStorageKey(originalFilename)` on the **server**: `photos/YYYY/MM/{uuid}.ext`. Never trust a client-supplied path.
- `createPresignedUploadUrl(key, contentType)` — include `ContentType` in the signature so S3 rejects a mismatched header. Expire in 60 seconds.
- `publicUrlForKey(key)` — `` `${process.env.NEXT_PUBLIC_CDN_URL}/${key}` ``.

### 9. Upload API

`POST /api/upload`:

1. `requireAdmin()`
2. Validate content type and size
3. Return `{ key, url }`

Browser `PUT`s the file to `url` with the signed `Content-Type`. Then `POST /api/photos` creates the row (title, dimensions, `storageKey`, album, tags). The Next.js server never receives image bytes.

### 10. Resource APIs

| Route | Access |
| --- | --- |
| `GET /api/photos` | Public. Paginated. Optional `tag`, `album`, search. |
| `POST /api/photos` | Admin |
| `PATCH` / `DELETE /api/photos/[id]` | Admin |
| `GET /api/albums` | Public |
| `POST /api/albums` | Admin |
| `PATCH` / `DELETE /api/albums/[id]` | Admin |
| `GET /api/tags` | Public |
| `POST /api/tags` | Admin |

Shared reads live in `src/lib/queries.ts` so Server Components and GET handlers use the same queries.

### 11. Public Work

- Homepage `#work` section: featured or recent photos from Prisma. Styles in `src/styles/page.module.css` (or a Work CSS module next to `src/app/Work.tsx`).
- `/albums` and `/albums/[slug]` for the archive.
- Contact stays a hash until that section exists.

### 12. Admin UI

Functional, not a second design system. Reuse BXTXM type and color tokens.

- `/admin/login`
- Dashboard
- Photo list
- Multi-file upload: presign → PUT → `POST /api/photos`
- Album CRUD

### 13. Tests and CI

- Unit tests for slug generation and Zod schemas.
- Authz test: unauthenticated `POST /api/photos` (or `/api/upload`) returns 401.
- Add `npm test` to `.github/workflows/ci.yml` next to lint, typecheck, and build.
- Skip Playwright until the gallery is stable.

### 14. README

After it works, add stack rows (Postgres, Prisma, Auth.js, S3/R2, Zod) and the resume bullets above. Link a live deploy only if it exists (Vercel + Neon + R2/S3).

---

## Local run (after steps 1–6)

```bash
cp .env.example .env
docker compose up -d
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

- Public site: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

---

## Done when

- Unauthenticated writes return 401.
- Authenticated upload: file in the bucket, row in `photos`, image on `#work` or `/albums`.
- Deleting an album does not delete its photos (`albumId` set to null).
- `npm run lint`, `typecheck`, `test`, and `build` pass.
