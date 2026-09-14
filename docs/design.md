# Design

Visual source of truth for BXTXM. The photograph leads; type, chrome, and motion stay quiet.

Inspiration lives in `inspo/`. Take structure from those references (full-bleed hero, oversized overlay wordmark, split About). Do not take their orange CTAs, stat counters, or card-heavy project grids.

---

## Principles

1. **Image first.** Layout exists to hold a frame, not to decorate around it.
2. **Still, not loud.** No accent orange, no pills, no drop shadows. Cream on ink.
3. **One page, one scroll.** About / Work / Contact are sections, not a marketing site with five products.         
4. **Type is a caption.** Archivo Black for display; Space Grotesk for everything you tap or read as copy.
5. **Same tokens everywhere.** Public site and a future `/admin` share the CSS variables in `src/styles/globals.css`.

---

## Brand

| | |
| --- | --- |
| Name | BXTXM |
| Voice | Short, literal, unstaged. Landscape and travel. |
| Tagline | Still water / Still light |
| Instagram | [bxtxm_photos](https://www.instagram.com/bxtxm_photos/) |

Do not add a logo mark. The word **BXTXM** in Archivo Black is the mark.

---

## Color

Defined in `src/styles/globals.css`. Use the variables, not hex in new CSS.

| Token | Value | Use |
| --- | --- | --- |
| `--background` / `--ink` | `#0c1014` | Page, About, future Work/Contact |
| `--foreground` | `#f4f3ef` | Headings, nav, primary links |
| `--foreground-soft` | cream @ 82% | Hero lead |
| `--foreground-muted` | cream @ 75% | Body copy |
| `--foreground-subtle` | cream @ 50% | Section labels (`ABOUT`) |
| `--cream` | cream @ 94% | Skip-link fill only |
| `--ink` | `#0c1014` | Skip-link text |

Hero overlay (keep as-is):

```css
linear-gradient(
  180deg,
  rgba(10, 14, 18, 0.35) 0%,
  rgba(10, 14, 18, 0.15) 40%,
  rgba(8, 11, 15, 0.75) 100%
)
```

No second palette for admin. Dark page, cream type.

---

## Type

Loaded in `src/app/layout.tsx` via `next/font`.

| Role | Face | Where |
| --- | --- | --- |
| Display | Archivo Black | Brand, hero title, huge wordmark, section titles |
| UI / body | Space Grotesk | Nav, lead, about copy, links, labels |

| Style | Size | Tracking | Line | Notes |
| --- | --- | --- | --- | --- |
| Wordmark | `clamp(72px, 17vw, 220px)` | `-0.02em` | 0.82 | Overlay + `mix-blend-mode: overlay` |
| Section title | `clamp(28px, 4vw, 44px)` | `-0.01em` | 1.1 | About heading |
| Hero title | `clamp(20px, 2.4vw, 28px)` | `0.01em` | 1.15 | Uppercase, max 320px |
| Brand (nav) | 22px | `0.02em` | — | Top left |
| Body | 16px | — | 1.7 | About |
| Lead | 13.5px | — | 1.6 | Hero right column; right-align from 640px |
| Nav / text link | 13px, weight 600 | `0.02em` | — | No background |
| Label | 12px | `0.14em` | — | Uppercase, `--foreground-subtle` |

Body stays Space Grotesk. Never put Archivo Black on nav links or paragraph copy.

---

## Layout

- Horizontal padding: `5vw` on hero and sections.
- About inner: `max-width: 1200px`, two columns, `gap: 4rem`, wrap.
- Copy column max width: `460px`.
- Hero: `min-height: 100dvh`, image `object-position: center 30%`.
- Tap targets: `min-height: 2.75rem` (44px) on nav and links.
- Focus: `2px solid var(--foreground)`, offset `3px` (`:focus-visible` only).

Page order:

1. Hero (`#` top)
2. About (`#about`)
3. Work (`#work`) — not built
4. Contact (`#contact`) — not built

---

## Motion

`--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`

- Hero enter: 400ms fade + 8px rise, delays 0 / 50 / 100 / 150ms.
- Links: 160ms opacity to 0.75 on fine pointer hover only.
- Instagram text link: also `scale(0.97)` on active.
- Smooth scroll on `html`, off when `prefers-reduced-motion: reduce`.
- Reduced motion: no translate on hero enter; opacity only, 200ms.

Do not add parallax, marquee, or hover-zoom on photos.

---

## Components

**Skip link** — cream pill, ink text. Visible only on `:focus-visible`. Target `#about` until Work exists.

**Nav** — transparent, no bar, no blur. Brand left, About / Work / Contact right. Lives in the hero; it scrolls away with the photo.

**Text link** — underline via `border-bottom` at 40% foreground (Instagram). Nav links have no underline.

**Photos** — `next/image`, real `alt`. Reserve ratio from stored width/height when the CMS lands. Blur placeholder on the hero; same idea for gallery thumbs.

---

## Work (next)

`src/app/Work.tsx` + `#work` on the homepage.

- Same About rhythm: small uppercase label, display title, then images.
- Grid, not masonry cards with captions stacked under every thumb. One label for the section is enough; album name can sit under a group.
- Full-bleed or `5vw` gutters — match About, do not inset into a white card.
- No orange “View project” buttons. A text link is enough (“See album”).
- Admin UI for upload/list should look like a quiet tool on the same ink background, not a dashboard kit.

---

## Do / don’t

**Do**

- Use tokens from `globals.css`
- Put new section CSS in `src/styles/` (page module or a Work module)
- Keep copy short
- Respect reduced motion and 44px targets

**Don’t**

- Add a brand orange or a second font
- Put a background, border, or blur on the nav
- Restore the old Tailwind gallery as the homepage
- Use Archivo Black for UI chrome
- Ship Work/Contact looking like the `inspo/` agency templates

---

## Files

| File | Role |
| --- | --- |
| `src/styles/globals.css` | Tokens, document, focus, smooth scroll |
| `src/styles/page.module.css` | Hero, About |
| `src/styles/Navbar.module.css` | Nav links |
| `src/app/layout.tsx` | Fonts |
| `src/assets/hero.jpg` | Hero frame |
| `inspo/` | Layout references only |
