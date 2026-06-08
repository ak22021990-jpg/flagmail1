<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **flagmail1** (1152 symbols, 1467 relationships, 15 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/flagmail1/context` | Codebase overview, check index freshness |
| `gitnexus://repo/flagmail1/clusters` | All functional areas |
| `gitnexus://repo/flagmail1/processes` | All execution flows |
| `gitnexus://repo/flagmail1/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

<!-- GSD:project-start source:PROJECT.md -->
## Project

**FlagMail — SOC Investigation Level**

FlagMail (flagmail1) is a browser-based security-awareness training game where players
classify suspicious emails — phishing, BEC, spam, malware — across three escalating zones,
using progressive clues, a countdown timer, badges, and a leaderboard. This milestone adds
a **fourth zone: a SOC Investigation level** where candidates go beyond classification to
write **Splunk SPL queries** and explanations against log evidence, scored automatically and
surfaced to a reviewer. It turns FlagMail from a classification quiz into an entry-level
SOC-analyst assessment tool.

**Core Value:** A candidate can complete a realistic SOC investigation — classify the threat, write a
working SPL query, and explain their reasoning — and get an automatic, defensible score
plus feedback that a reviewer can trust.

### Constraints

- **Tech stack**: Stay within React 19 + Vite + plain JS — no new framework, router, or
  state library; match existing hook/component conventions.
- **Backend**: Reuse the existing Google Apps Script + Sheets integration — no new backend service.
- **Compatibility**: The existing three zones and their scoring/badges/leaderboard must keep working unchanged.
- **Validation**: SPL and explanation scoring must be deterministic (keyword/concept matching) — no external API dependency at grade time.
- **Auth**: Reviewer access is a shared passcode only — no identity provider.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- JavaScript (ES2020+) — All source code in `src/` uses JSX syntax with ES modules. No TypeScript.
- CSS3 — Custom properties in `src/index.css`, keyframe animations in `src/styles/animations.css`
- HTML5 — Entry point at `index.html`
## Runtime
- Node.js 20 (CI) / 22+ (local dev via `engines` not specified)
- Browser (SPA — all logic runs client-side)
- npm
- Lockfile: `package-lock.json` present
## Frameworks
- React 19.2.0 — UI framework, no Next.js or SSR. Pure client-side SPA.
- React DOM 19.2.0 — Renderer
- framer-motion 11.18.2 — Component-level animations (`motion.div`, `AnimatePresence`). Used in ~20 components.
- GSAP 3.12.5 — Scroll-linked animations in `GameRound.jsx`
- animejs 3.2.2 — Declared dependency; usage TBD
- lottie-react 2.4.1 — Lottie JSON animation player for badge celebrations (`ResultsScreen.jsx`)
- matter-js 0.19.0 — 2D physics engine; declared but usage not confirmed
- Vitest 4.1.7 — Unit test runner. Config at `vitest.config.js`
- Playwright 1.59.1 — E2E/visual audit script at `scripts/playwright-audit.mjs`
- Vite 7.3.1 — Bundler and dev server. Config at `vite.config.js`
- ESLint 9.39.1 — Linting with `@eslint/js`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`. Config at `eslint.config.js`
## Key Dependencies
- `react` + `react-dom` ^19.2.0 — Core UI framework
- `framer-motion` ^11.18.2 — Primary animation engine used in almost every component
- `papaparse` ^5.5.3 — CSV parsing (for `email_dataset.csv`)
- `prop-types` ^15.8.1 — Runtime type checking for component props
- `src/data/emails.js` — Inline email dataset (742 lines, 15 emails with clues and classifications)
- `src/data/socQuestions.js` — SOC assessment questions (356 lines, 6 questions)
- `src/data/email_dataset.csv` — Raw CSV source (not imported directly in code)
## Configuration
- No `.env` files. No `import.meta.env` usage.
- Configuration managed through `src/config.js` (Google Apps Script URL)
- Game constants in `src/config/game.js` (timers, durations)
- Design tokens in `src/styles/tokens.js` (glass surface, scores, zone metadata)
- CSS custom properties in `src/index.css` (colors, backgrounds)
- `vite.config.js` — `base: '/flagmail1/'` for GitHub Pages subpath deployment
- `eslint.config.js` — Flat config format, extends `js/recommended` + `react-hooks` + `react-refresh`
## Platform Requirements
- Node.js >= 18 (Vite 7 requirement)
- npm
- Browser with ES module support
- Static file hosting (GitHub Pages)
- No server-side runtime required
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Language & Runtime
## Naming Patterns
- `kebab-case.js` / `kebab-case.jsx`: Component files (`game-round.jsx` → `GameRound.jsx`): PascalCase file name matches default export name.
- `camelCase.js`: Utility files (`scoreSoc.js`, `validateSpl.js`, `shuffle.js`, `competency.js`, `confetti.js`)
- `camelCase.js`: Hook files (`useGameState.js`, `useScoring.js`, `useBadges.js`)
- `camelCase.js`: Config and data files (`game.js`, `emails.js`, `socQuestions.js`, `tokens.js`)
- `PascalCase.jsx`: React component files (`GameRound.jsx`, `BadgeToast.jsx`, `ErrorBoundary.jsx`, `EmailCard.jsx`)
- `.test.js` suffix for test files, co-located with source
- `camelCase` for all functions and methods (e.g., `scaleSocScore`, `validateSpl`, `scoreSocRound`, `submitSocRound`)
- `handle*` for event handler callbacks (`handleSubmit`, `handleTimeout`, `handleNext`, `handleSocSubmit`)
- `on*` for callback props passed downwards (`onSubmit`, `onNext`, `onDismiss`)
- `render*` for internal render helper functions within components (`renderBody` in `EmailCard.jsx`)
- `camelCase` throughout
- `UPPER_SNAKE_CASE` for module-level constants (`SOC_RAW_MAX`, `SCREENS`, `ROUND_DURATION_SECONDS`, `L1_HELP`, `BADGES`)
- Boolean prefixes: `is*`/**`has`**/**`can`**/**`all`**/**`show`** (e.g., `isCompound`, `allStrong`, `canSubmit`, `showResults`, `hasMoreQuestions`)
- Ref suffix: `Ref` for `useRef` bindings (`roundRef`, `scoreDisplayRef`, `canvasRef`)
- `PascalCase` for class components (only `ErrorBoundary` in `src/components/ErrorBoundary.jsx`)
- All components are `PascalCase` default exports
- `use*` prefix for custom hooks (`useGameState`, `useScoring`, `useBadges`, `useTimer`, `useProctoring`, `useSocState`, `useLeaderboard`)
## Code Style
- **ESLint v9** with flat config (`eslint.config.js`)
- Extends: `@eslint/js` recommended, `eslint-plugin-react-hooks` flat recommended, `eslint-plugin-react-refresh` Vite config
- Custom rule: `no-unused-vars: ['error', { varsIgnorePattern: '^[A-Z_]' }]` — allows unused uppercase constants
- Targets `**/*.{js,jsx}` files, ignores `dist/`
## Import Organization
- All imports use relative paths (no path aliases configured)
- Extensions always explicit: `.js`, `.jsx`, `.css`, `.json`
## Error Handling
## Logging
- `console.warn('Score submit failed:', err)` — async fetch failures
- `console.warn('ErrorBoundary caught:', error, info)` — React errors
- Errors swallowed silently in Soc submission (`catch (_) {}`)
- No info/debug/error level differentiation
## Comments
- Used sparingly for public utility functions
- Used for hook docs:
## Component Design
## Module Design
- Named exports for utility functions and constants (`export function scaleSocScore`, `export const SOC_RAW_MAX`)
- Default exports for components (`export default function GameRound`)
- Mixed exports in hook files (`export const SCREENS = { ... }; export function useGameState() { ... }`)
## Styling Conventions
## Data Conventions
- `src/data/emails.js` — `EMAIL_POOL` array
- `src/data/socQuestions.js` — `SOC_QUESTIONS` array
- `src/config/game.js` — timing constants
- `src/config.js` — external service URLs (root level, singular)
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## System Overview
```text
```
## Component Responsibilities
| Component | Responsibility | File |
|-----------|----------------|------|
| `App` | Screen router — renders 1 of 11 screens based on `gs.screen` | `src/App.jsx` |
| `useGameState` | Screen state machine, player data, email pool, zone/round progression | `src/hooks/useGameState.js` |
| `useScoring` | Score calculation per email/zone/total + category tracking | `src/hooks/useScoring.js` |
| `useSocState` | SOC quiz state (answers, SPL validation, scoring, final submission) | `src/hooks/useSocState.js` |
| `useBadges` | Badge unlock conditions (10 badge types) | `src/hooks/useBadges.js` |
| `useTimer` | Countdown timer with green/amber/red phase | `src/hooks/useTimer.js` |
| `useProctoring` | Tab-switch detection via visibilitychange + blur/focus | `src/hooks/useProctoring.js` |
| `useLeaderboard` | GET/POST to Google Apps Script leaderboard | `src/hooks/useLeaderboard.js` |
| `ErrorBoundary` | Class component — catches render errors, shows reload UI | `src/components/ErrorBoundary.jsx` |
## Pattern Overview
- Single-page app — no router library. Screen transitions via `SCREENS` enum and `setScreen()`
- State colocated in custom hooks (not global store) — `useGameState`, `useScoring`, `useSocState`, `useBadges`
- `App.jsx` is orchestrator — instantiates hooks, wires callbacks, renders active screen
- Components receive state + callbacks as props — no prop drilling beyond 1 level deep
- Two independent scoring tracks converge at end: zones (1-3) + SOC (zone 4)
- Data layer is entirely static (JS modules) until final result submission to Google Sheets
## Layers
- Purpose: Render UI screens and components
- Location: `src/components/*.jsx`
- Contains: 32 React components (screens, cards, UI elements)
- Depends on: Props from `App.jsx`, shared style tokens from `src/styles/tokens.js`
- Used by: `App.jsx` (renders one screen at a time)
- Purpose: Encapsulate all mutable game state and actions
- Location: `src/hooks/*.js`
- Contains: 7 custom hooks — `useGameState`, `useScoring`, `useSocState`, `useBadges`, `useTimer`, `useLeaderboard`, `useProctoring`
- Depends on: `src/data/` for static datasets, `src/config/` for constants, `src/utils/` for scoring/validation
- Used by: `App.jsx`
- Purpose: Static datasets and game configuration
- Location: `src/data/`, `src/config/`, `src/config.js`
- Contains: `emails.js` (15 emails), `socQuestions.js` (6 SOC questions), game timers, Google Script URL
- Depends on: Nothing
- Used by: hooks layer
- Purpose: Pure functions for scoring, validation, shuffling, confetti rendering
- Location: `src/utils/*.js`
- Contains: `scoreSoc.js`, `validateSpl.js`, `shuffle.js`, `competency.js`, `confetti.js`
- Depends on: Nothing (pure functions)
- Used by: hooks layer
- Purpose: Server-side data persistence and deployment
- Location: `google-apps-script.js`, `.github/workflows/deploy.yml`
- Contains: Google Apps Script web app (writes to Google Sheets), GitHub Pages deployment
- Depends on: `src/config.js` (LEADERBOARD_URL)
## Data Flow
### Primary Request Path (Email Classification)
### Proctoring Data Flow
### Leaderboard/Sheet Submission Flow
- All state lives in `useState` inside custom hooks — no global store, no context
- `App.jsx` instantiates hooks at top level, passes state + callbacks as props
- No reducers — direct `setState` calls in hooks
## Key Abstractions
- Purpose: Screen identifiers used as state machine transitions
- Location: `src/hooks/useGameState.js:5-18`
- Values: `LANDING`, `TUTORIAL`, `ZONE_INTRO`, `ROUND`, `EXPLANATION`, `ZONE_COMPLETE`, `RESULTS`, `SOC_INTRO`, `SOC_ROUND`, `SOC_EXPLANATION`, `SOC_RESULTS`, `REVIEWER`
- Purpose: Tracks player answers within a single email classification round
- Shape: `{ cluesRevealed, selectedL1, selectedL2, submitted, timedOut, lastRecord }`
- Location: `src/hooks/useGameState.js:22-31`
- Purpose: Per-email scoring result stored in `sc.perEmail[]`
- Shape: `{ emailId, zone, selectedL1, selectedL2, correctL1, correctL2, l1Correct, l2Correct, cluesUsed, timedOut, points, l1Points, l2Points, clueDeduction }`
- Location: `src/hooks/useScoring.js:42-57`
- Purpose: After each round, zone, and game completion — checks earned badges
- Pattern: `checkAfterRound()` → `checkAfterZone()` → `checkAfterGame()`
- Location: `src/hooks/useBadges.js`
- Purpose: Shared visual style used across all screen components
- Pattern: Import `glass` from `src/styles/tokens.js`, clone with per-component overrides
- Location: `src/styles/tokens.js:4-10`
## Entry Points
- Location: `src/main.jsx`
- Triggers: Browser loads `index.html` with `#root` div
- Responsibilities: Mounts React StrictMode → ErrorBoundary → App
- Location: `vite.config.js`
- Base path: `/flagmail1/` (for GitHub Pages)
- Location: `.github/workflows/deploy.yml`
- Triggers: Push to `main` branch
- Pipeline: `npm ci` → `npm run build` → upload `dist/` → deploy to Pages
- Location: `google-apps-script.js`
- Triggers: HTTP POST (doPost) or GET (doGet) to deployed web app URL
## Architectural Constraints
- **State architecture:** No global state store (no Redux/Zustand/Context). All state in `useState` inside custom hooks. State reset on refresh.
- **Navigation:** No React Router. Screen transitions via `setScreen()` on SCREENS enum. Single `App.jsx` conditional render.
- **Data persistence:** Browser memory only until final submission. `sessionStorage` used for SOC submission failover only. No localStorage for game progress.
- **UI rendering:** Full-screen SPA — each screen component is a full viewport view. No nested route layout.
- **External dependency:** Google Apps Script web app has `no-cors` fetch mode — responses are opaque. Error handling is fire-and-forget with `console.warn` on failure.
- **Animation approach:** Hybrid — CSS keyframes (`src/styles/animations.css`), Framer Motion (`motion`/`AnimatePresence`), Lottie (JSON animation files), GSAP (imperative timeline), plus canvas confetti (`src/utils/confetti.js`).
## Anti-Patterns
### Hook-Call Orchestration in App.jsx
### No Separation Between Screen and Shared Components
## Error Handling
- `ErrorBoundary` (class component) wraps entire app — catches render errors, shows reload page
- `fetch` calls to Google Apps Script wrapped in try/catch with `console.warn` only — silent failure
- SOC submission uses `sessionStorage` as fallback if fetch fails
- PropTypes validation on all components (no TypeScript)
## Cross-Cutting Concerns
- `validateSpl.js` — keyword-based SPL query validation (required, optional, blocked terms)
- `validateSpl.test.js` and `scoreSoc.test.js` — unit tests for validation and scoring
- No client-side input validation framework — manual checks in `LandingScreen` (name/email/re-attempt)
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
