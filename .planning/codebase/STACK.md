# Stack

> Generated: 2026-05-21

## Languages & Runtime

- **JavaScript (ES2020+)** — all source code. No TypeScript.
- **Node.js** — dev/build toolchain only.
- **Browser** — target runtime (Chrome, Firefox, Safari).

## Framework

- **React 19** (`19.2.0`) — UI library. Function components + hooks.
- **Vite 7** (`7.3.1`) — bundler, dev server, HMR.
- **@vitejs/plugin-react** — Babel-based Fast Refresh.

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `framer-motion` | ^11.18.2 | Animated transitions between screens |
| `gsap` | ^3.12.5 | GSAP animation library (badge + game animations) |
| `animejs` | ^3.2.2 | Alternative animation library |
| `lottie-react` | ^2.4.1 | After Effects animation renderer |
| `matter-js` | ^0.19.0 | 2D physics engine |
| `papaparse` | ^5.5.3 | CSV parsing for email datasets |

### Animation Assets

- 10 Lottie `.json` files in `src/assets/animation/` (one per badge)
- CSS keyframe animations in `src/styles/animations.css`
- GSAP planned upgrade documented in `ANIMATION_BRIEF.md`

## Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `eslint` | ^9.39.1 | Linter (flat config) |
| `@eslint/js` | ^9.39.1 | ESLint recommended rules |
| `eslint-plugin-react-hooks` | ^7.0.1 | React Hooks lint rules |
| `eslint-plugin-react-refresh` | ^0.4.24 | HMR-safe exports lint |
| `globals` | ^16.5.0 | Browser globals for ESLint |
| `playwright` | ^1.59.1 | Headless browser screenshots + layout audit |
| `vite` | ^7.3.1 | Bundler |
| `@vitejs/plugin-react` | ^5.1.1 | Vite React plugin |
| `@types/react` | ^19.2.7 | Type stubs (not used in code) |
| `@types/react-dom` | ^19.2.3 | Type stubs |

## Configuration

- `vite.config.js` — base path `/flagmail1/`, React plugin
- `eslint.config.js` — flat config, JSX, browser globals, `no-unused-vars` error
- `.gitignore` — standard Vite ignores + `*.local`, editor dirs

## Build & Serve

```
npm run dev      → vite dev server
npm run build    → vite build → dist/
npm run preview  → vite preview (used by Playwright audit)
npm run lint     → eslint .
```

## Notable Absences

- **No TypeScript** — all `.js` / `.jsx` with JSDoc-style comments
- **No CSS framework** — plain CSS with CSS variables
- **No state management library** — `useState`/`useCallback` only
- **No router** — custom screen state machine in `useGameState`
- **No testing framework** — no Jest, Vitest, or React Testing Library
