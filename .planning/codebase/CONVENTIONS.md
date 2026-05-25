# Coding Conventions

**Analysis Date:** 2026-05-25

## Language & Runtime

**Language:** JavaScript (ES2020+) with JSX — no TypeScript used.
**Module system:** ES modules (`"type": "module"` in `package.json`), all imports use explicit `.js` / `.jsx` extensions.
**Runtime:** Browser (Vite-bundled SPA).

## Naming Patterns

**Files:**
- `kebab-case.js` / `kebab-case.jsx`: Component files (`game-round.jsx` → `GameRound.jsx`): PascalCase file name matches default export name.
- `camelCase.js`: Utility files (`scoreSoc.js`, `validateSpl.js`, `shuffle.js`, `competency.js`, `confetti.js`)
- `camelCase.js`: Hook files (`useGameState.js`, `useScoring.js`, `useBadges.js`)
- `camelCase.js`: Config and data files (`game.js`, `emails.js`, `socQuestions.js`, `tokens.js`)
- `PascalCase.jsx`: React component files (`GameRound.jsx`, `BadgeToast.jsx`, `ErrorBoundary.jsx`, `EmailCard.jsx`)
- `.test.js` suffix for test files, co-located with source

**Functions:**
- `camelCase` for all functions and methods (e.g., `scaleSocScore`, `validateSpl`, `scoreSocRound`, `submitSocRound`)
- `handle*` for event handler callbacks (`handleSubmit`, `handleTimeout`, `handleNext`, `handleSocSubmit`)
- `on*` for callback props passed downwards (`onSubmit`, `onNext`, `onDismiss`)
- `render*` for internal render helper functions within components (`renderBody` in `EmailCard.jsx`)

**Variables:**
- `camelCase` throughout
- `UPPER_SNAKE_CASE` for module-level constants (`SOC_RAW_MAX`, `SCREENS`, `ROUND_DURATION_SECONDS`, `L1_HELP`, `BADGES`)
- Boolean prefixes: `is*`/**`has`**/**`can`**/**`all`**/**`show`** (e.g., `isCompound`, `allStrong`, `canSubmit`, `showResults`, `hasMoreQuestions`)
- Ref suffix: `Ref` for `useRef` bindings (`roundRef`, `scoreDisplayRef`, `canvasRef`)

**Types/Classes:**
- `PascalCase` for class components (only `ErrorBoundary` in `src/components/ErrorBoundary.jsx`)
- All components are `PascalCase` default exports

**Hooks:**
- `use*` prefix for custom hooks (`useGameState`, `useScoring`, `useBadges`, `useTimer`, `useProctoring`, `useSocState`, `useLeaderboard`)

## Code Style

**Formatting:** No Prettier config detected. Code is hand-formatted.

**Linting:**
- **ESLint v9** with flat config (`eslint.config.js`)
- Extends: `@eslint/js` recommended, `eslint-plugin-react-hooks` flat recommended, `eslint-plugin-react-refresh` Vite config
- Custom rule: `no-unused-vars: ['error', { varsIgnorePattern: '^[A-Z_]' }]` — allows unused uppercase constants
- Targets `**/*.{js,jsx}` files, ignores `dist/`

**Run command:**
```bash
npm run lint       # eslint .
```

## Import Organization

**Order observed:**
1. React / framework imports (`import { useState } from 'react'`)
2. Third-party library imports (`import { motion } from 'framer-motion'`, `import Lottie from 'lottie-react'`)
3. Asset imports (JSON animation files, CSS files)
4. Internal module imports — relative paths with explicit extensions

**Pattern (from `GameRound.jsx`):**
```jsx
import PropTypes from 'prop-types';
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { useTimer } from '../hooks/useTimer.js';
import { useProctoring } from '../hooks/useProctoring.js';
import TimerBar from './TimerBar.jsx';
```

**Path Conventions:**
- All imports use relative paths (no path aliases configured)
- Extensions always explicit: `.js`, `.jsx`, `.css`, `.json`

## Error Handling

**Strategy:** Try/catch for async operations; ErrorBoundary for React render errors; silent degradation for non-critical failures.

**Patterns:**

1. **Async failure — silent degrade:**
```jsx
// useGameState.js — leaderboard submission
try {
  await fetch(LEADERBOARD_URL, { ... });
} catch (err) {
  console.warn('Score submit failed:', err);
}
```
Used in: `submitToSheet` in `useGameState.js:142`, `submitFinal` in `useSocState.js:170`, `submitScore` in `useLeaderboard.js:12`

2. **Error Boundary — class component:**
```jsx
// ErrorBoundary.jsx
static getDerivedStateFromError(error) {
  return { hasError: true, error };
}
componentDidCatch(error, info) {
  console.warn('ErrorBoundary caught:', error, info);
}
```
Wraps entire app tree in `main.jsx` and `App.jsx`.

3. **Null guards on data:**
```jsx
if (!email) return null;                      // EmailCard.jsx
if (!LEADERBOARD_URL || LEADERBOARD_URL === 'YOUR_APPS_SCRIPT_URL') return;  // useLeaderboard.js
const clueCount = Array.isArray(email?.clues) ? email.clues.length : 0;  // GameRound.jsx
```

4. **Empty-state fallback strings:**
```jsx
// competency.js
if (categories.length === 0) {
  return 'Complete more emails to receive your competency summary.';
}
```

**No centralized error handling layer** — errors handled per-module.

## Logging

**Framework:** `console.warn` exclusively. No structured logger.

**Patterns:**
- `console.warn('Score submit failed:', err)` — async fetch failures
- `console.warn('ErrorBoundary caught:', error, info)` — React errors
- Errors swallowed silently in Soc submission (`catch (_) {}`)
- No info/debug/error level differentiation

## Comments

**JSDoc / TSDoc:**
- Used sparingly for public utility functions
```js
// scoreSoc.js
/**
 * Scale socTotal (0-112 raw) to 40 points and compute the combined final score.
 * @param {number} socTotal  Raw SOC score (sum of per-question result.score.total)
 * @param {number} zonesRaw  Zones 1-3 raw total (0-60)
 * @returns {{ socScaled: number, finalScore: number }}
 */
export function scaleSocScore(socTotal, zonesRaw) { ... }
```
- Used for hook docs:
```js
// useProctoring.js
/**
 * useProctoring — detect and count discrete tab/window departures during an active round.
 * ...
 * @param {object} options
 * @param {boolean} options.active
 * @returns {{ violations: number, switchedAway: boolean, reset: function }}
 */
```

**Section headers in components:**
```jsx
// ── Actions ──────────────────────────────────────────────────────────────
// ── Submit a round ───────────────────────────────────────────────────────
// ── Move to next email ───────────────────────────────────────────────────
```

**No inline code comments** beyond section markers and `// eslint-disable-next-line` directives.

## Component Design

**Pattern:** SFC (Stateless Function Components) + custom hooks for state logic.

**Signature structure:**
```jsx
export default function GameRound({ email, zone, onSubmit, ... }) {
  // hooks at top
  // local state
  // effects
  // event handlers
  // computed values
  return (JSX);
}
GameRound.propTypes = { ... };
GameRound.defaultProps = { onViolationChange: () => {} };
```

**Props validation:** `PropTypes` on every component. Used for runtime type checking.

**Default exports:** All components use `export default function`.

**State management:** Custom hooks (`useGameState`, `useScoring`, `useSocState`, `useBadges`) act as state containers. No external state library (Redux, Zustand, etc).

## Module Design

**Exports:**
- Named exports for utility functions and constants (`export function scaleSocScore`, `export const SOC_RAW_MAX`)
- Default exports for components (`export default function GameRound`)
- Mixed exports in hook files (`export const SCREENS = { ... }; export function useGameState() { ... }`)

**Barrel files:** No `index.js` barrel files. All imports go directly to file paths.

## Styling Conventions

**Inline styles dominant** — no CSS Modules, Tailwind, or styled-components.

```jsx
// style objects defined near usage or as const above component
const surface = { ...glass, backdropFilter: 'blur(30px) saturate(165%)', ... };
const sectionLabelStyle = { fontSize: 11, fontWeight: 700, ... };

// or inline:
<div style={{ minHeight: '100dvh', padding: 24 }}>...</div>
```

**Design tokens** in `src/styles/tokens.js` — object exports consumed by components:
```js
// tokens.js
export const glass = { background: 'rgba(255,255,255,0.74)', ... };
export const POINTS_PER_EMAIL = 4;
export const ZONE_META_LIST = [...];
```

**Global CSS** in `src/index.css` — reset, CSS custom properties, scrollbar styles.

**Animation classes** in `src/styles/animations.css` — referenced as `className="anim-glowPulse"` in markup.

## Data Conventions

**Data files** in `src/data/` — static arrays of objects:
- `src/data/emails.js` — `EMAIL_POOL` array
- `src/data/socQuestions.js` — `SOC_QUESTIONS` array

**Config files** in `src/config/` — game constants, separated from app config:
- `src/config/game.js` — timing constants
- `src/config.js` — external service URLs (root level, singular)

---

*Convention analysis: 2026-05-25*
