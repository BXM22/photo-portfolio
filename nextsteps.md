# Next steps

Where this repo is today, how to host it, and upgrades that are worth doing later. Local setup stays in `README.md`. Day-to-day CMS notes stay in local `ADMIN.md`.

## Hosting

A defensible production shape for this app is **Vercel** (Next.js) + **Neon** (Postgres) + **Cloudflare R2 or AWS S3** (uploads) + a **public CDN origin**. Do not run Postgres on the laptop for production. Do not proxy image bytes through the Next.js server.

### 1. Database (Neon or similar)

1. Create a Postgres 16 database.
2. Copy the pooled connection string into `DATABASE_URL`.
3. On first deploy (or a one-off job):

```bash
npx prisma migrate deploy
npx prisma db seed
```

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the host env **before** seed. Re-seed after a password change.

Add a Vercel build command that generates the client, and a release step that only runs `migrate deploy` (not `migrate dev`).

Suggested Vercel build:

```bash
prisma generate && next build
```

Run migrations separately (Vercel deploy hook, GitHub Action, or `vercel` CLI) so a failed migrate does not leave a half-built site.

### 2. App (Vercel)

1. Import the GitHub repo.
2. Framework preset: Next.js. Node 22.
3. Env vars (Production + Preview):

| Variable | Production |
| --- | --- |
| `DATABASE_URL` | Neon URL |
| `AUTH_SECRET` | `openssl rand -base64 32` — unique per environment |
| `AUTH_URL` | Canonical site URL, e.g. `https://bxtxm.example` (Auth.js) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seed + login only; not needed at runtime after seed |
| `AWS_REGION` | `us-east-1` or R2 `auto` |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | IAM user or R2 API token |
| `AWS_S3_BUCKET_NAME` | Bucket |
| `AWS_S3_ENDPOINT` | R2: `https://<accountid>.r2.cloudflarestorage.com` |
| `NEXT_PUBLIC_CDN_URL` | Public origin that actually serves objects, no trailing slash |

`NEXT_PUBLIC_*` is baked into the client at **build**. Redeploy after changing the CDN host. `next.config.ts` uses it for `images.remotePatterns`; a placeholder CloudFront hostname that does not resolve will blank **uploaded** photos (`seed/` keys stay on this origin).

4. Custom domain → set `AUTH_URL` to that domain. Do not mix `www` and apex for login cookies.

### 3. Object storage

Uploads are browser `PUT` to a 60s presigned URL (`src/lib/s3.ts`). Production needs:

- Private bucket (no public list)
- Public read via CDN / custom domain, **or** R2 public bucket + custom domain
- CORS allowing `PUT` from the site origin with header `Content-Type`

Example CORS (adjust origins):

```json
[
  {
    "AllowedOrigins": ["https://your-domain", "http://localhost:3000"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 60
  }
]
```

Seeded Grand Tetons / Japan files live in `public/seed/` and ship with the Vercel deployment. New Work sets must land in the bucket; their `storageKey` looks like `photos/YYYY/MM/<uuid>.ext`.

### 4. After go-live

- Open `/admin/login`, create one new set, confirm the homepage scroller shows it.
- Confirm unauthenticated `POST /api/photos` still returns 401 from the public URL.
- Turn off Vercel deployment protection on the public site; keep `/admin` behind Auth.js (already gated in `src/proxy.ts` and `requireAdmin()`).
- Point CI at the same Node 22 as production. Current GitHub Actions: lint, typecheck, test, build — it does **not** migrate or deploy.

### 5. Cost / ops (small site)

| Piece | Typical |
| --- | --- |
| Vercel hobby | Fine for a portfolio until traffic or build minutes hurt |
| Neon free/launch | Enough; enable backups when it is the live CMS |
| R2 | Cheap egress vs S3; S3 + CloudFront is the AWS-native pair |
| Secrets | Host dashboard only — never commit `.env` |

---

## Possible upgrades

Ordered by usefulness for this repo, not by novelty. Skip GraphQL, microservices, and Kafka.

### Near-term (ship or harden)

- **Real CDN** — Replace any placeholder `NEXT_PUBLIC_CDN_URL` with a hostname that resolves. Upload the six seed files to the bucket if you want one origin for every photo.
- **Delete objects** — Album delete already `SetNull`s `albumId`. Add an optional “delete file from bucket” using `DeleteObject` when a photo row is removed.
- **Blur placeholders** — `Photo.blurDataUrl` exists on the schema; fill it at upload (lqip / blurhash) so Work frames do not pop in empty.
- **Rate-limit auth** — Credentials login is a public POST. Add a coarse limiter (Vercel WAF, or a tiny token bucket on `/api/auth`).
- **Migrate in CI** — A `main` job that runs `prisma migrate deploy` against a staging Neon branch, then production, with a hold for review.

### Product

- **`/albums` and `/albums/[slug]`** — Optional archive; homepage scroller stays the product.
- **Tags in admin** — API and `PhotoTag` exist; the set form does not. Only add UI if you will filter Work by tag.
- **Hero / About in CMS** — Out of scope for v1 on purpose. If you ever CMS them, keep the existing layout modules; do not restyle.
- **Contact form** — Still out of scope. Instagram orbit is the contact surface.

### Quality

- **Playwright** — One flow: login → new set (mock or MinIO) → homepage shows the slide. Skip until uploads against a real bucket are stable.
- **EXIF / color profile** — Strip GPS on upload; keep orientation. Nice for a photography CMS resume bullet if you actually implement it.
- **`next/image` sizes** — Recheck `sizes` on Work frames after you add a third location set.
- **Accessibility pass** — Dialog, scroller, and dots were built with that in mind; re-test keyboard + screen reader after any Work CSS change.

### Later / only if needed

- MinIO in `docker-compose.yml` so uploads work with zero cloud account.
- Object lifecycle (delete unused keys older than N days).
- Read replica / ISR for the homepage if traffic actually warrants it (`page.tsx` is already `force-dynamic`).
- 2FA for the single admin — overkill until the site is a target.

---

## Done when hosted

- Custom domain loads the one-pager; Work still uses the three-up scroller and `PhotoDialog`.
- Admin login works on that domain; a new set’s files exist in the bucket and appear on `#work`.
- Seeded sets still render if the CDN is down (`seed/` is local).
- `AUTH_SECRET` and DB credentials are not in git.
