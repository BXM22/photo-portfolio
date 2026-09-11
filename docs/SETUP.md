# Setup guide

Step-by-step instructions for getting this project running locally and in production. If you're new to any of these services (Postgres, S3, CloudFront), follow along in order — each step explains *why*, not just *what to click*.

## 1. Prerequisites

- Node.js 20.9 or later (`node -v` to check) — required by Next.js 16.
- Docker (optional, but the easiest way to get a local Postgres database — see step 2).
- An AWS account (free tier covers this project comfortably).
- A GitHub account, if you want CI and Vercel deployment.

## 2. Clone and install

```bash
git clone <your-fork-url>
cd photo-portfolio
npm install
cp .env.example .env
```

You'll fill in `.env` as you go through the rest of this guide.

## 3. Database (PostgreSQL)

**Option A — Docker (recommended for local dev):**

```bash
docker compose up -d
```

This starts a local Postgres instance matching the `DATABASE_URL` already in `.env.example` (`postgresql://postgres:postgres@localhost:5432/photo_portfolio`) — no changes needed.

**Option B — a free hosted database (recommended once you deploy):**

[Neon](https://neon.tech) and [Supabase](https://supabase.com) both offer a free Postgres tier that works well with serverless platforms like Vercel. Create a project, copy the connection string they give you, and paste it into `DATABASE_URL` in `.env`.

**Apply the schema:**

```bash
npm run db:generate   # generates the typed Prisma Client from prisma/schema.prisma
npm run db:migrate    # creates the actual tables in your database
```

`db:migrate` will prompt you for a migration name the first time (e.g. `init`) — this creates a file under `prisma/migrations/` that's checked into git, so every environment (your laptop, CI, production) applies the exact same schema changes in the exact same order.

## 4. Create your admin account

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`, then:

```bash
npm run db:seed
```

This is the only account the site needs — see `prisma/schema.prisma`'s comments on the `User` model for why.

## 5. AWS S3 (photo storage)

1. **Create a bucket**: AWS Console → S3 → Create bucket. Pick a globally-unique name and a region close to you (remember the region — you'll need it below). Leave "Block all public access" **checked** — the bucket itself stays private; photos are served through CloudFront instead (step 6), not directly from S3.

2. **Set a CORS policy** on the bucket (S3 Console → your bucket → Permissions → Cross-origin resource sharing) so the browser is allowed to `PUT` uploads directly from your site's origin:

   ```json
   [
     {
       "AllowedOrigins": ["http://localhost:3000", "https://your-production-domain.com"],
       "AllowedMethods": ["PUT"],
       "AllowedHeaders": ["*"]
     }
   ]
   ```

3. **Create an IAM user** dedicated to this app (AWS Console → IAM → Users → Create user). Attach an inline policy scoped to only what this app needs — resist the urge to attach `AmazonS3FullAccess`:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
         "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
       }
     ]
   }
   ```

   Create an access key for this user (Security credentials tab → Create access key → "Application running outside AWS"). Put the resulting key ID/secret into `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` in `.env`, along with `AWS_REGION` and `AWS_S3_BUCKET_NAME`.

## 6. CloudFront (CDN)

Fronting the S3 bucket with CloudFront gets you edge caching (photos load fast worldwide) without exposing the bucket itself publicly.

1. AWS Console → CloudFront → Create distribution.
2. **Origin domain**: select your S3 bucket.
3. **Origin access**: choose "Origin access control settings (recommended)" and create a new OAC — this is what lets CloudFront read the bucket while it stays otherwise private. AWS will show you a bucket policy to paste in; do that (S3 Console → your bucket → Permissions → Bucket policy).
4. **Viewer protocol policy**: "Redirect HTTP to HTTPS."
5. Leave the rest as defaults and create the distribution. It takes a few minutes to deploy.
6. Copy the distribution's domain name (looks like `d1234abcd.cloudfront.net`) into `NEXT_PUBLIC_CDN_URL` in `.env` as `https://d1234abcd.cloudfront.net`.

Until you've done this, `publicUrlForKey()` in `src/lib/s3.ts` falls back to serving images straight from S3 — fine for early local development, not recommended for production.

## 7. Run it

```bash
npm run dev
```

Visit `http://localhost:3000` for the public gallery and `http://localhost:3000/admin/login` to sign in with the admin credentials you seeded in step 4.

## 8. Testing

```bash
npm run lint        # ESLint
npm run typecheck   # TypeScript
npm test            # Vitest unit tests
npm run test:e2e    # Playwright end-to-end tests (builds and boots the app first)
```

## 9. Deploying

**Vercel (recommended — built by the makers of Next.js, zero-config for this stack):**

1. Push your repo to GitHub.
2. [Import the project on Vercel](https://vercel.com/new).
3. Add every variable from your `.env` file as a Vercel Environment Variable (Project → Settings → Environment Variables).
4. Deploy. Vercel runs `npm run build` automatically.
5. Run migrations against your production database once, from your machine:
   ```bash
   DATABASE_URL="<your production connection string>" npm run db:migrate:deploy
   ```
   (`migrate:deploy` — not `migrate:dev` — applies existing migrations without prompting for a name or generating new ones; it's the command meant for CI/production.)
6. Seed the production admin user the same way:
   ```bash
   DATABASE_URL="<production>" ADMIN_EMAIL="..." ADMIN_PASSWORD="..." npm run db:seed
   ```

**GitHub Actions CI** (`.github/workflows/ci.yml`) runs automatically on every pull request — lint, type-check, unit tests, a production build, and Playwright smoke tests against a throwaway Postgres instance. No setup needed beyond pushing to GitHub.
