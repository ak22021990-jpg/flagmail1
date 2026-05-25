<!-- refreshed: 2026-05-25 -->
# Architecture

**Analysis Date:** 2026-05-25

## System Overview

```text
┌──────────────────────────────────────────────────────────────────┐
│                     Presentation Layer (JSX)                     │
│    src/components/*.jsx  —  32 screen/UI components              │
├──────────────────┬──────────────────┬───────────────────────────┤
│  Screen-Comps    │  UI-Components   │  Layout-Comps             │
│  LandingScreen   │  EmailCard       │  ErrorBoundary            │
│  GameRound       │  Classifier      │  TimerBar                 │
│  ResultsScreen   │  ClueSystem      │  RoundHeader              │
│  SocRound        │  BadgeToast      │  ScoreDisplay             │
│  ReviewerScreen  │  ...             │  ...                      │
└────────┬─────────┴────────┬─────────┴────────┬──────────────────┘
         │                  │                   │
         ▼                  ▼                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                   State-Management Layer (Hooks)                  │
│    src/hooks/*.js  —  7 custom hooks                             │
│                                                                    │
│  useGameState()      — screen machine, player, email pool, zone   │
│  useScoring()        — per-email/zone/total scores                │
│  useSocState(gs)     — SOC classification quiz state              │
│  useBadges()         — badge unlock logic                         │
│  useTimer()          — round countdown timer                      │
│  useLeaderboard()    — leaderboard fetch/submit                   │
│  useProctoring()     — tab-switch violation tracking              │
└───────────────────────┬───────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Utility & Data Layer                           │
│                                                                    │
│  src/data/        — static email pool + SOC questions             │
│  src/utils/       — scoring, shuffle, SPL validation, confetti    │
│  src/config/      — game timers (120s, etc.)                     │
│  src/config.js    — Google Apps Script URL                        │
│  src/styles/      — CSS tokens, glass style, animation keyframes │
└──────────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│                    External Layer                                 │
│                                                                    │
│  Google Apps Script Web App  —  leaderboard sheet (register/     │
│                                  submit/checkEmail)               │
│  google-apps-script.js      —  server-side Apps Script code      │
│  .github/workflows/deploy.yml — CI/CD → GitHub Pages             │
└──────────────────────────────────────────────────────────────────┘
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

**Overall:** Screen-based state machine with custom hook state management.

**Key Characteristics:**
- Single-page app — no router library. Screen transitions via `SCREENS` enum and `setScreen()`
- State colocated in custom hooks (not global store) — `useGameState`, `useScoring`, `useSocState`, `useBadges`
- `App.jsx` is orchestrator — instantiates hooks, wires callbacks, renders active screen
- Components receive state + callbacks as props — no prop drilling beyond 1 level deep
- Two independent scoring tracks converge at end: zones (1-3) + SOC (zone 4)
- Data layer is entirely static (JS modules) until final result submission to Google Sheets

## Layers

**Presentation Layer:**
- Purpose: Render UI screens and components
- Location: `src/components/*.jsx`
- Contains: 32 React components (screens, cards, UI elements)
- Depends on: Props from `App.jsx`, shared style tokens from `src/styles/tokens.js`
- Used by: `App.jsx` (renders one screen at a time)

**State-Management Layer:**
- Purpose: Encapsulate all mutable game state and actions
- Location: `src/hooks/*.js`
- Contains: 7 custom hooks — `useGameState`, `useScoring`, `useSocState`, `useBadges`, `useTimer`, `useLeaderboard`, `useProctoring`
- Depends on: `src/data/` for static datasets, `src/config/` for constants, `src/utils/` for scoring/validation
- Used by: `App.jsx`

**Data Layer:**
- Purpose: Static datasets and game configuration
- Location: `src/data/`, `src/config/`, `src/config.js`
- Contains: `emails.js` (15 emails), `socQuestions.js` (6 SOC questions), game timers, Google Script URL
- Depends on: Nothing
- Used by: hooks layer

**Utility Layer:**
- Purpose: Pure functions for scoring, validation, shuffling, confetti rendering
- Location: `src/utils/*.js`
- Contains: `scoreSoc.js`, `validateSpl.js`, `shuffle.js`, `competency.js`, `confetti.js`
- Depends on: Nothing (pure functions)
- Used by: hooks layer

**External Layer:**
- Purpose: Server-side data persistence and deployment
- Location: `google-apps-script.js`, `.github/workflows/deploy.yml`
- Contains: Google Apps Script web app (writes to Google Sheets), GitHub Pages deployment
- Depends on: `src/config.js` (LEADERBOARD_URL)

## Data Flow

### Primary Request Path (Email Classification)

1. **Landing** — Player enters name + email, `gs.startGame()` shuffles 15 emails into `emailPool`, sets screen to TUTORIAL or ZONE_INTRO
   - `src/App.jsx:138-142`
2. **Zone Intro** — Shows zone details, `gs.startZone()` sets screen to ROUND
   - `src/App.jsx:165-170`
3. **Game Round** — Timer starts (`useTimer`), proctoring activates (`useProctoring`), player classifies email (L1 category + L2 subcategory + optional clues)
   - `src/components/GameRound.jsx` timer fires → `handleSubmit(timeLeft, timedOut)`
4. **Submit** — `handleSubmit` in App calls `sc.scoreRound()` which compares against `email.level1`/`email.level2`, records score per email, updates zone/total scores
   - `src/App.jsx:89-96`, `src/hooks/useScoring.js:17-77`
5. **Explanation** — Shows correctness, reasoning, and score for completed round
   - `src/App.jsx:188-195`
6. **Zone Complete** — Shows zone summary, `handleAdvanceZone` submits to Google Sheet if zone 3
   - `src/App.jsx:107-124`
7. **Zone 4 (SOC)** — After zone 3, 6 SOC classification questions with SPL query writing. Separate scoring via `useSocState`
   - `src/App.jsx:209-246`
8. **Results** — Combined zone + SOC scores, competency summary, badge display
   - `src/App.jsx:248-258`

### Proctoring Data Flow

1. `useProctoring` hook (inside `GameRound` and `SocRound`) listens for `visibilitychange`, `blur`, `focus`
2. Violation count incremented per tab switch — guarded by `lastHiddenRef` to prevent double-count
3. Violation count passed up via `onViolationChange` setter in App
4. Final violation count appended to submission payload

### Leaderboard/Sheet Submission Flow

1. `gs.submitToSheet()` sends player data via `fetch(LEADERBOARD_URL)` in POST `mode: 'no-cors'`
2. Google Apps Script web app (`google-apps-script.js`) processes: doPost() routes to register/submit, doGet() handles checkEmail
3. Data written to Google Sheets (Summary + RawData tabs)

**State Management:**
- All state lives in `useState` inside custom hooks — no global store, no context
- `App.jsx` instantiates hooks at top level, passes state + callbacks as props
- No reducers — direct `setState` calls in hooks

## Key Abstractions

**SCREENS enum:**
- Purpose: Screen identifiers used as state machine transitions
- Location: `src/hooks/useGameState.js:5-18`
- Values: `LANDING`, `TUTORIAL`, `ZONE_INTRO`, `ROUND`, `EXPLANATION`, `ZONE_COMPLETE`, `RESULTS`, `SOC_INTRO`, `SOC_ROUND`, `SOC_EXPLANATION`, `SOC_RESULTS`, `REVIEWER`

**Round state object:**
- Purpose: Tracks player answers within a single email classification round
- Shape: `{ cluesRevealed, selectedL1, selectedL2, submitted, timedOut, lastRecord }`
- Location: `src/hooks/useGameState.js:22-31`

**Score record object:**
- Purpose: Per-email scoring result stored in `sc.perEmail[]`
- Shape: `{ emailId, zone, selectedL1, selectedL2, correctL1, correctL2, l1Correct, l2Correct, cluesUsed, timedOut, points, l1Points, l2Points, clueDeduction }`
- Location: `src/hooks/useScoring.js:42-57`

**Badge check cycle:**
- Purpose: After each round, zone, and game completion — checks earned badges
- Pattern: `checkAfterRound()` → `checkAfterZone()` → `checkAfterGame()`
- Location: `src/hooks/useBadges.js`

**Glass surface style:**
- Purpose: Shared visual style used across all screen components
- Pattern: Import `glass` from `src/styles/tokens.js`, clone with per-component overrides
- Location: `src/styles/tokens.js:4-10`

## Entry Points

**Application Entry:**
- Location: `src/main.jsx`
- Triggers: Browser loads `index.html` with `#root` div
- Responsibilities: Mounts React StrictMode → ErrorBoundary → App

**Build Entry:**
- Location: `vite.config.js`
- Base path: `/flagmail1/` (for GitHub Pages)

**Deployment Entry:**
- Location: `.github/workflows/deploy.yml`
- Triggers: Push to `main` branch
- Pipeline: `npm ci` → `npm run build` → upload `dist/` → deploy to Pages

**Google Apps Script Entry:**
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

**What happens:** `App.jsx` calls 4 hooks (`useGameState`, `useScoring`, `useSocState`, `useBadges`) and wires them together manually with `useCallback`. Logic for score consolidation, badge checks, and screen transitions mixed in render function.

**Why it's wrong:** App.jsx is 266 lines with interleaved hook state + screen rendering. Adding new features requires modifying both the hook layer and the render layer in the same file. Hook dependencies are implicit (e.g., `useSocState(gs)` couples SOC state to game state).

**Do this instead:** Extract screen routing to a dedicated component or use a lightweight router pattern. Consider `useReducer` or `zustand` for cross-hook state that needs coordination (like the consolidated submission payload).

### No Separation Between Screen and Shared Components

**What happens:** 32 components in one flat `src/components/` directory — screen-level components (`LandingScreen`, `ResultsScreen`) mixed with UI primitives (`TimerBar`, `ScoreDisplay`, `BadgeToast`).

**Why it's wrong:** No clear boundary between "what is a screen" and "what is reusable UI". New developers must read every component to understand the hierarchy.

**Do this instead:** Split into `src/components/screens/` and `src/components/ui/` subdirectories.

## Error Handling

**Strategy:** Error boundaries + try/catch on external calls.

**Patterns:**
- `ErrorBoundary` (class component) wraps entire app — catches render errors, shows reload page
- `fetch` calls to Google Apps Script wrapped in try/catch with `console.warn` only — silent failure
- SOC submission uses `sessionStorage` as fallback if fetch fails
- PropTypes validation on all components (no TypeScript)

## Cross-Cutting Concerns

**Logging:** `console.warn` — used only in ErrorBoundary catch and leaderboard fetch failures. No structured logging.

**Validation:** 
- `validateSpl.js` — keyword-based SPL query validation (required, optional, blocked terms)
- `validateSpl.test.js` and `scoreSoc.test.js` — unit tests for validation and scoring
- No client-side input validation framework — manual checks in `LandingScreen` (name/email/re-attempt)

**Authentication:** None. Player enters name + email on landing. Single-attempt check via `localStorage` flag.

---

*Architecture analysis: 2026-05-25*
