# Coding Conventions

**Analysis Date:** 2026-06-08

## Language & Runtime

**Language:** JavaScript (ES2020+) with JSX — no TypeScript used anywhere in `src/`.
**Module system:** ES modules (`"type": "module"` in `package.json`). All imports require explicit `.js` / `.jsx` extensions.
**Runtime:** Browser (Vite-bundled SPA). No SSR. No Node runtime at play time.

---

## Naming Patterns

**Files:**
- `PascalCase.jsx` — React component files. File name matches default export name exactly.
  - Examples: `GameRound.jsx`, `SocRound.jsx`, `CandidateList.jsx`, `AdminPanel.jsx`
- `camelCase.js` — Utility files, hook files, config files, and data files.
  - Utils: `scoreSoc.js`, `validateSpl.js`, `shuffle.js`, `competency.js`, `confetti.js`, `exportCsv.js`
  - Hooks: `useGameState.js`, `useScoring.js`, `useSocState.js`, `useBadges.js`, `useTimer.js`, `useProctoring.js`, `useLeaderboard.js`
  - Config: `game.js`, `config.js`
  - Data: `emails.js`, `socQuestions.js`
- `camelCase.test.js` — Test files co-located with source in `src/utils/`.
  - Examples: `scoreSoc.test.js`, `validateSpl.test.js`

**Functions:**
- `camelCase` for all functions: `scaleSocScore`, `validateSpl`, `scoreSocRound`, `generateCompetency`, `escapeCsvField`, `downloadCsv`
- `handle*` for event handlers defined inside components or hooks: `handleSubmit`, `handleTimeout`, `handleNext`, `handleSocSubmit`, `handleLogin`
- `on*` for callback props received from parent: `onSubmit`, `onNext`, `onDismiss`, `onBack`, `onViolationChange`, `onSetPrimary`, `onSetSplText`
- `render*` for internal JSX helper functions within components: `renderBody` in `EmailCard.jsx`
- `use*` for all custom hooks: `useGameState`, `useScoring`, `useSocState`, `useBadges`, `useTimer`, `useProctoring`, `useLeaderboard`, `useAdmin`

**Variables:**
- `camelCase` throughout for local variables and state: `currentIndex`, `showResults`, `emailPool`
- `UPPER_SNAKE_CASE` for module-level constants: `SOC_RAW_MAX`, `SOC_SCALED_MAX`, `ZONES_RAW_MAX`, `SCREENS`, `ZONE_EMAIL_COUNTS`, `QUESTION_SCORE_MAP`, `TIER_FILTERS`, `PROCTOR_FILTERS`
- Boolean variable prefixes: `is*` / `has*` / `can*` / `all*` / `show*`
  - Examples: `isCompound`, `allStrong`, `allWeak`, `canSubmit`, `showResults`, `hasClassification`, `hasMoreQuestions`
- `*Ref` suffix for `useRef` bindings: `roundRef`, `scoreDisplayRef`, `canvasRef`

**Classes:**
- `PascalCase` — only `ErrorBoundary` is a class component (`src/components/ErrorBoundary.jsx`). All other components are function components.

---

## Code Style

**Formatting:** No Prettier config. Code is hand-formatted. No enforced line width or indent style beyond ESLint.

**Linting:** ESLint v9 (`^9.39.1`) with flat config at `eslint.config.js`.
- Extends: `@eslint/js` recommended, `eslint-plugin-react-hooks` flat recommended, `eslint-plugin-react-refresh` Vite config
- `ecmaVersion: 2020`, `sourceType: 'module'`, `ecmaFeatures: { jsx: true }`
- Globals: `globals.browser`
- Custom rule: `no-unused-vars: ['error', { varsIgnorePattern: '^[A-Z_]' }]` — uppercase module constants (e.g., `SCREENS`, `SOC_RAW_MAX`) are exempt from unused-variable errors
- Ignores: `dist/`

```bash
npm run lint       # runs: eslint .
```

---

## Import Organization

**Observed order in components:**
1. React / framework: `import { useState, useCallback } from 'react'`
2. Third-party libraries: `import { motion, AnimatePresence } from 'framer-motion'`, `import PropTypes from 'prop-types'`
3. Internal hooks: `import { useProctoring } from '../hooks/useProctoring.js'`
4. Internal components: `import TimerBar from './TimerBar.jsx'`
5. Data / utils / config: `import { SOC_QUESTIONS } from '../data/socQuestions.js'`
6. CSS / assets: `import './styles/animations.css'`

**Pattern from `SocRound.jsx`:**
```jsx
import PropTypes from "prop-types";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { useProctoring } from "../hooks/useProctoring.js";
```

**Pattern from `App.jsx`:**
```jsx
import { useCallback, useState, useEffect, lazy, Suspense } from 'react';
import { scaleSocScore } from './utils/scoreSoc.js';
import { SOC_QUESTIONS } from './data/socQuestions.js';
import './styles/animations.css';

import { useGameState, SCREENS } from './hooks/useGameState.js';
import { useScoring } from './hooks/useScoring.js';
// ...
```

**Path conventions:**
- All imports use relative paths — no path aliases (`@/`, `~`) configured in Vite or ESLint.
- Extensions always explicit: `.js`, `.jsx`, `.css`, `.json`
- No barrel files (`index.js`) — import directly from the file that defines the symbol.

**Lazy loading:**
- `AdminPanel` is lazy-loaded in `App.jsx` via `lazy(() => import('./components/AdminPanel.jsx'))` — the only dynamically-imported component.

---

## Error Handling

**Strategy:** Try/catch for async operations; React ErrorBoundary for render errors; silent degradation for non-critical failures.

**Pattern 1 — Async silent degrade with console.warn:**
```js
// useLeaderboard.js, useGameState.js, useSocState.js
try {
  await fetch(LEADERBOARD_URL, { method: 'POST', ... });
} catch (err) {
  console.warn('Score submit failed:', err);
}
```
Files: `src/hooks/useGameState.js`, `src/hooks/useSocState.js`, `src/hooks/useLeaderboard.js`

**Pattern 2 — Silent catch with blank variable (swallowed error):**
```js
// useSocState.js
} catch (_) {}
```
This pattern appears in SOC final submission — error is completely suppressed.

**Pattern 3 — React ErrorBoundary (class component):**
```jsx
// src/components/ErrorBoundary.jsx
static getDerivedStateFromError(error) { return { hasError: true, error }; }
componentDidCatch(error, info) { console.warn('ErrorBoundary caught:', error, info); }
```
Wraps entire app tree in both `src/main.jsx` and `src/App.jsx`.

**Pattern 4 — Null / guard returns:**
```js
if (!email) return null;                                             // EmailCard.jsx
if (!LEADERBOARD_URL || LEADERBOARD_URL === 'YOUR_APPS_SCRIPT_URL') return;  // useLeaderboard.js
const clueCount = Array.isArray(email?.clues) ? email.clues.length : 0;  // GameRound.jsx
if (!rows || rows.length === 0) return;                              // exportCsv.js
```

**Pattern 5 — Empty-state fallback strings (data layer):**
```js
// competency.js
if (categories.length === 0) {
  return 'Complete more emails to receive your competency summary.';
}
```

No centralized error handling layer — every module handles its own errors.

---

## Logging

**Framework:** `console.warn` only. No structured logger, no log levels, no log aggregation.

**Observed usages:**
- `console.warn('Score submit failed:', err)` — fetch failure in async submission hooks
- `console.warn('ErrorBoundary caught:', error, info)` — React render errors
- Silent swallow `catch (_) {}` — SOC final submission path in `useSocState.js`

**No info/debug/error level differentiation.** All operational errors use `console.warn`.

---

## Comments

**JSDoc — used for public utility functions:**
```js
// src/utils/scoreSoc.js
/**
 * Scale socTotal (0-112 raw) to 40 points and compute the combined final score.
 * @param {number} socTotal  Raw SOC score (sum of per-question result.score.total)
 * @param {number} zonesRaw  Zones 1-3 raw total (0-60)
 * @returns {{ socScaled: number, finalScore: number }}
 */
export function scaleSocScore(socTotal, zonesRaw) { ... }
```

**JSDoc — used for hook public interfaces:**
```js
// src/hooks/useProctoring.js
/**
 * useProctoring — detect and count discrete tab/window departures during an active round.
 * @param {object} options
 * @param {boolean} options.active
 * @returns {{ violations: number, switchedAway: boolean, reset: function }}
 */
```

**Section header comments in hooks — dashed banner style:**
```js
// ── Actions ──────────────────────────────────────────────────────────────
// ── Submit a round ───────────────────────────────────────────────────────
// ── Move to next email ───────────────────────────────────────────────────
```
Used in `src/hooks/useGameState.js` to divide logical sections.

**Inline comments:** Sparse. Used for non-obvious derived state:
```js
// earlyUnlocked derived from consecutivePerfect — no extra state needed
```

---

## Component Design

**Pattern:** Stateless function components (SFC) + custom hooks for all mutable logic.

**Canonical signature structure:**
```jsx
export default function ComponentName({ prop1, prop2, onCallback }) {
  // 1. hook calls at top
  // 2. local state (useState)
  // 3. effects (useEffect)
  // 4. event handlers (handle*)
  // 5. computed values / derived state
  // 6. return JSX
}
ComponentName.propTypes = {
  prop1: PropTypes.string.isRequired,
  onCallback: PropTypes.func,
};
ComponentName.defaultProps = { onCallback: () => {} };
```

**Props validation:** `PropTypes` on every component. Declared as static property after function definition, not inline. No TypeScript.

**Default exports:** All components use `export default function ComponentName`. Never `export default` on an anonymous arrow function.

**State management:** No global store (no Redux, Zustand, or Context). All state lives in `useState` inside custom hooks. `App.jsx` instantiates hooks and passes state + callbacks as props.

**Class components:** Only `ErrorBoundary` is a class component — kept as class because `getDerivedStateFromError` / `componentDidCatch` have no function-component equivalent.

---

## Module Design

**Exports:**
- Named exports for utility functions and constants:
  ```js
  export function scaleSocScore(...) { }
  export const SOC_RAW_MAX = 92;
  export function escapeCsvField(value) { }
  export function downloadCsv(rows, filename) { }
  ```
- Default exports for all components:
  ```js
  export default function GameRound({ ... }) { }
  ```
- Mixed exports in hook files (constants + function from same file):
  ```js
  export const SCREENS = { LANDING: 'landing', ... };   // useGameState.js
  export function useGameState() { ... }
  ```

**Barrel files:** None. No `index.js` in any directory. Always import from the defining file directly:
```js
import { useGameState, SCREENS } from '../hooks/useGameState.js';  // correct
// never: import { useGameState } from '../hooks/index.js'
```

---

## Styling Conventions

**Primary approach:** Inline style objects. No CSS Modules, no Tailwind, no styled-components.

**Style object placement:**
- Module-level `const` for reusable surface styles:
  ```js
  const card = {
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(30px) saturate(165%)",
    borderRadius: 22,
  };
  ```
- Inline for one-off layout:
  ```jsx
  <div style={{ minHeight: "100dvh", padding: "18px clamp(12px, 2.5vw, 24px)" }}>
  ```

**Design tokens** in `src/styles/tokens.js`:
```js
export const glass = { background: 'rgba(255,255,255,0.74)', ... };
export const POINTS_PER_EMAIL = 4;
export const ZONE_META_LIST = [...];
```
Components import `glass` and spread it with overrides rather than duplicating values.

**Global CSS** in `src/index.css` — reset, CSS custom properties, scrollbar styles. Not used for component styles.

**Animation CSS classes** in `src/styles/animations.css` — referenced by `className="anim-glowPulse"` etc. Not CSS Modules — global scope class names.

**CSS injection injection order in `App.jsx`:**
```js
import './styles/animations.css';   // imported once in App.jsx
```

---

## Data Conventions

**Static data arrays** in `src/data/`:
- `src/data/emails.js` — exports `EMAIL_POOL` array (15 email objects with clues and classifications)
- `src/data/socQuestions.js` — exports `SOC_QUESTIONS` array (6 SOC assessment questions)

**Game constants** in `src/config/`:
- `src/config/game.js` — timing constants (`ROUND_DURATION_SECONDS`, etc.)
- `src/config.js` (root level, not in `config/`) — external service URL: `LEADERBOARD_URL`

**Rule:** Config files that reference external services live at root `src/config.js`. Game-internal constants live in `src/config/game.js`.

---

*Convention analysis: 2026-06-08*
