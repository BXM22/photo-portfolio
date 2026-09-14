# BXTXM

A photography portfolio for landscape and travel work — long horizons, low light, and still frames shot on location.

Built as a fast, accessible one-page site in **Next.js 16**, **React 19**, and **TypeScript**.

<img src="src/assets/hero.jpg" alt="People standing on a still salt lake, with mountains reflected in the water" width="960">

## Overview

BXTXM is a personal photography site with a full-viewport hero, in-page navigation, and an about section that links out to [Instagram](https://www.instagram.com/bxtxm_photos/). The layout is image-first: type is kept quiet so the photograph can carry the page.

Work and Contact sections are wired in the nav and will land as the archive grows.

## Highlights

- Full-bleed hero using `next/image` with blur placeholder, eager load, and high fetch priority for LCP
- CSS Modules plus Tailwind v4 design tokens (color, type, easing) instead of utility-heavy markup
- `next/font` loading for Archivo Black (display) and Space Grotesk (UI)
- In-page hash nav with smooth scroll, skipped when the user prefers reduced motion
- Skip link, named landmarks, visible focus rings, and 44px tap targets
- GitHub Actions CI for lint, typecheck, and production build

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

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |

## Structure

```
src/
  app/          Routes and layout
  components/   Navbar
  styles/       Global tokens and CSS modules
  assets/       Hero photograph
```

## License

[MIT](LICENSE)
