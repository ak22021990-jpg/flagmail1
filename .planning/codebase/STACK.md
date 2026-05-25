# Technology Stack

**Analysis Date:** 2026-05-25

## Languages

**Primary:**
- JavaScript (ES2020+) — All source code in `src/` uses JSX syntax with ES modules. No TypeScript.
- CSS3 — Custom properties in `src/index.css`, keyframe animations in `src/styles/animations.css`

**Secondary:**
- HTML5 — Entry point at `index.html`

## Runtime

**Environment:**
- Node.js 20 (CI) / 22+ (local dev via `engines` not specified)
- Browser (SPA — all logic runs client-side)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React 19.2.0 — UI framework, no Next.js or SSR. Pure client-side SPA.
- React DOM 19.2.0 — Renderer

**Animation:**
- framer-motion 11.18.2 — Component-level animations (`motion.div`, `AnimatePresence`). Used in ~20 components.
- GSAP 3.12.5 — Scroll-linked animations in `GameRound.jsx`
- animejs 3.2.2 — Declared dependency; usage TBD
- lottie-react 2.4.1 — Lottie JSON animation player for badge celebrations (`ResultsScreen.jsx`)
- matter-js 0.19.0 — 2D physics engine; declared but usage not confirmed

**Testing:**
- Vitest 4.1.7 — Unit test runner. Config at `vitest.config.js`
- Playwright 1.59.1 — E2E/visual audit script at `scripts/playwright-audit.mjs`

**Build/Dev:**
- Vite 7.3.1 — Bundler and dev server. Config at `vite.config.js`
- ESLint 9.39.1 — Linting with `@eslint/js`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`. Config at `eslint.config.js`

## Key Dependencies

**Critical:**
- `react` + `react-dom` ^19.2.0 — Core UI framework
- `framer-motion` ^11.18.2 — Primary animation engine used in almost every component

**Utilities:**
- `papaparse` ^5.5.3 — CSV parsing (for `email_dataset.csv`)
- `prop-types` ^15.8.1 — Runtime type checking for component props

**Data:**
- `src/data/emails.js` — Inline email dataset (742 lines, 15 emails with clues and classifications)
- `src/data/socQuestions.js` — SOC assessment questions (356 lines, 6 questions)
- `src/data/email_dataset.csv` — Raw CSV source (not imported directly in code)

## Configuration

**Environment:**
- No `.env` files. No `import.meta.env` usage.
- Configuration managed through `src/config.js` (Google Apps Script URL)
- Game constants in `src/config/game.js` (timers, durations)
- Design tokens in `src/styles/tokens.js` (glass surface, scores, zone metadata)
- CSS custom properties in `src/index.css` (colors, backgrounds)

**Build:**
- `vite.config.js` — `base: '/flagmail1/'` for GitHub Pages subpath deployment
- `eslint.config.js` — Flat config format, extends `js/recommended` + `react-hooks` + `react-refresh`

## Platform Requirements

**Development:**
- Node.js >= 18 (Vite 7 requirement)
- npm
- Browser with ES module support

**Production:**
- Static file hosting (GitHub Pages)
- No server-side runtime required

---

*Stack analysis: 2026-05-25*
