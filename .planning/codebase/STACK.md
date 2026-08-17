# Technology Stack

**Analysis Date:** 2026-06-08

## Languages

**Primary:**
- JavaScript (ES2020+) — All source in `src/` uses JSX with ES modules. No TypeScript. `ecmaVersion: 2020` in `eslint.config.js`.
- CSS3 — Custom properties in `src/index.css`, keyframe animations in `src/styles/animations.css`

**Secondary:**
- HTML5 — Entry point at `index.html` (single `#root` div)
- Google Apps Script (V8 runtime, ES5-style `var`) — Backend at `google-apps-script.js`

## Runtime

**Environment:**
- Node.js 20 (CI via `actions/setup-node@v4`) / 22+ acceptable locally (no `engines` field in `package.json`)
- Browser — Pure client-side SPA. All game logic, scoring, and validation run in-browser.

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React 19.2.0 — UI framework (`src/main.jsx` → `src/App.jsx`). No Next.js, no SSR, no router library.
- React DOM 19.2.0 — DOM renderer

**Animation (hybrid approach — four separate systems in use):**
- framer-motion 11.18.2 — Component-level enter/exit animations (`motion.div`, `AnimatePresence`). Used across ~20+ components throughout `src/components/`.
- GSAP 3.12.5 — Imperative timeline animations. Confirmed import in `src/components/GameRound.jsx:4`.
- lottie-react 2.4.1 — JSON Lottie animation player. Used in `src/components/BadgeToast.jsx`, `src/components/BadgeCollection.jsx`, `src/components/ResultsScreen.jsx`. JSON files in `src/assets/animation/` (10 badge/celebration animations).
- animejs 3.2.2 — Declared in `package.json` but **no confirmed import** in `src/`. Unused dependency.
- matter-js 0.19.0 — Declared in `package.json` but **no confirmed import** in `src/`. Unused dependency.

**Testing:**
- Vitest 4.1.7 — Unit test runner. Config at `vitest.config.js`. Includes `src/**/*.test.js`.
- Playwright 1.59.1 — Visual/E2E audit script at `scripts/playwright-audit.mjs`. Not part of CI pipeline.

**Build/Dev:**
- Vite 7.3.1 — Bundler and dev server. Config at `vite.config.js`. Base path: `/flagmail1/`.
- `@vitejs/plugin-react` 5.1.1 — Babel-based JSX transform plugin for Vite.
- ESLint 9.39.1 — Flat config format at `eslint.config.js`. Extends `@eslint/js` recommended + `eslint-plugin-react-hooks` flat recommended + `eslint-plugin-react-refresh` Vite config.

## Key Dependencies

**Critical:**
- `react` + `react-dom` ^19.2.0 — Core UI framework
- `framer-motion` ^11.18.2 — Primary animation engine; removing it would break almost every component

**Data Handling:**
- `papaparse` ^5.5.3 — CSV parsing. Present in `package.json` but `src/data/email_dataset.csv` is **not** imported at runtime; data is inlined in `src/data/emails.js`. Papaparse may be unused in production bundle.
- `prop-types` ^15.8.1 — Runtime prop type checking on all components (no TypeScript)

**Utilities (internal, no npm dependency):**
- `src/utils/scoreSoc.js` — SPL scoring logic (pure function, keyword matching)
- `src/utils/validateSpl.js` — SPL query validation (required/optional/blocked terms)
- `src/utils/shuffle.js` — Array shuffle utility
- `src/utils/competency.js` — Competency band calculation
- `src/utils/confetti.js` — Canvas-based confetti renderer
- `src/utils/exportCsv.js` — Client-side CSV download (`Blob` + `URL.createObjectURL`)

**Static Assets:**
- `src/assets/animation/` — 10 Lottie JSON files (badge + celebration animations)
- `src/assets/DisplayFont.ttf`, `src/assets/Loverine.otf` — Custom fonts
- `src/assets/images/` — 4 background images (`images_page-000*.jpg`)

## Configuration

**Environment:**
- No `.env` files. No `import.meta.env` usage anywhere in `src/`.
- External service URL: `src/config.js` — exports `LEADERBOARD_URL` (Google Apps Script endpoint, hardcoded string)
- Game timing constants: `src/config/game.js` — `ROUND_DURATION_SECONDS`, `LIGHTNING_READ_SECONDS`, `SNIPER_SECONDS`, `BEAT_THE_CLOCK_SECONDS`
- Design tokens: `src/styles/tokens.js` — glass surface styles, score colours, zone metadata
- CSS custom properties: `src/index.css` — colour palette, backgrounds

**Build:**
- `vite.config.js` — `base: '/flagmail1/'` for GitHub Pages subpath deployment
- `eslint.config.js` — Flat config; custom rule: `no-unused-vars` ignores `^[A-Z_]` pattern (allows uppercase constants)
- `vitest.config.js` — Includes `src/**/*.test.js`

## Browser Storage

- `sessionStorage` — Used in `src/hooks/useSocState.js:165` as SOC submission failover (stores payload if fetch fails)
- `localStorage` — Used in `src/components/LandingScreen.jsx:34,65` to track re-attempt state (key: `ATTEMPT_KEY`)
- No IndexedDB, no service worker, no persistent game state

## Platform Requirements

**Development:**
- Node.js >= 18 (Vite 7 minimum requirement)
- npm
- Browser with ES module support

**Production:**
- Static file hosting (GitHub Pages at `https://<org>.github.io/flagmail1/`)
- No server-side runtime required
- Google Apps Script web app deployed separately (standalone GAS project)

## Scripts

```bash
npm run dev        # Vite dev server
npm run build      # Production build → dist/
npm run preview    # Preview production build locally
npm run test       # vitest run (single pass, no watch)
npm run lint       # eslint .
```

---

*Stack analysis: 2026-06-08*
