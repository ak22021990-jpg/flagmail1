<!-- refreshed: 2026-06-08 -->
# Architecture

**Analysis Date:** 2026-06-08

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         Browser SPA                                  │
│  index.html → src/main.jsx → ErrorBoundary → App.jsx               │
├───────────────┬──────────────┬──────────────┬───────────────────────┤
│  Screen Layer │  Hook Layer  │  Data Layer  │    Utils Layer        │
│  src/         │  src/hooks/  │  src/data/   │    src/utils/         │
│  components/  │             │  src/config/ │                        │
└───────┬───────┴──────┬───────┴──────┬───────┴───────────────────────┘
        │              │              │
        ▼              ▼              ▼
   Renders UI    Owns state &    Static JS modules
   full-screen   all mutations   (no runtime deps)
   one at a time via useState
        │              │
        └──── props ───┘
              (no context, no store)
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│  External: Google Apps Script Web App (LEADERBOARD_URL)             │
│  HTTP POST — no-cors / fire-and-forget with 3-retry wrapper         │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| `App` | Screen router — renders 1 of 13 screens based on `gs.screen`; wires all hook callbacks | `src/App.jsx` |
| `useGameState` | Screen state machine, player registration, email pool shuffling, zone/round progression | `src/hooks/useGameState.js` |
| `useScoring` | Per-email score calculation, zone totals, category-accuracy tracking | `src/hooks/useScoring.js` |
| `useSocState` | SOC quiz state — answers array, SPL validation, per-question scoring, final submission | `src/hooks/useSocState.js` |
| `useBadges` | Badge unlock logic (10 badge types) triggered after round/zone/game events | `src/hooks/useBadges.js` |
| `useTimer` | Countdown with green/amber/red phase and `onTimeout` callback | `src/hooks/useTimer.js` |
| `useProctoring` | Tab-switch detection via `visibilitychange` + `blur`/`focus`; one violation per departure | `src/hooks/useProctoring.js` |
| `useLeaderboard` | GET/POST to Google Apps Script leaderboard (used by `ReviewerScreen` legacy) | `src/hooks/useLeaderboard.js` |
| `useAdmin` | Admin panel data fetch — passcode-protected GET via Google Apps Script | `src/hooks/useAdmin.js` |
| `ErrorBoundary` | Class component — catches render errors, shows reload UI | `src/components/ErrorBoundary.jsx` |
| `AdminPanel` | Lazy-loaded reviewer panel — passcode login, candidate list, answer sheets | `src/components/AdminPanel.jsx` |
| `ReviewerScreen` | Deprecated — replaced by `AdminPanel`. Kept for reference only | `src/components/ReviewerScreen.jsx` |

## Pattern Overview

**Overall:** Single-page App with a manual screen state machine (no router library).

**Key Characteristics:**
- `SCREENS` enum (13 values) in `src/hooks/useGameState.js` drives all navigation via `gs.setScreen()`
- All mutable state lives inside `useState` in custom hooks — no Redux, no Zustand, no Context API
- `App.jsx` is the sole orchestrator — instantiates 4 hooks at top level (`useGameState`, `useScoring`, `useSocState`, `useBadges`), wires callbacks, conditionally renders one screen at a time
- Props flow downward at most 1 level deep (App to screen component to sub-components)
- Two independent scoring tracks converge at end-game: zones 1-3 (raw points, max 60) + SOC zone 4 (raw max 92, scaled to 40)
- Data layer is entirely static JS modules until final submission fires HTTP POST

## Layers

**Screen / Component Layer:**
- Purpose: Render full-viewport UI screens and reusable sub-components
- Location: `src/components/*.jsx`
- Contains: 34 React components (full-screen screens, email cards, timer, badges, admin panel)
- Depends on: Props from `App.jsx`, design tokens from `src/styles/tokens.js`, CSS from `src/styles/animations.css`
- Used by: `App.jsx` (renders one screen at a time via conditional render)

**Hook / State Layer:**
- Purpose: Encapsulate all mutable game state and side-effect-heavy actions
- Location: `src/hooks/*.js`
- Contains: 8 custom hooks — `useGameState`, `useScoring`, `useSocState`, `useBadges`, `useTimer`, `useLeaderboard`, `useProctoring`, `useAdmin`
- Depends on: `src/data/` for datasets, `src/config/` for constants, `src/utils/` for pure scoring/validation functions
- Used by: `App.jsx` (top-level instantiation); `GameRound.jsx` and `SocRound.jsx` also instantiate `useTimer` and `useProctoring` locally

**Data / Config Layer:**
- Purpose: Static datasets and game configuration constants
- Location: `src/data/`, `src/config/`, `src/config.js`
- Contains: `emails.js` (EMAIL_POOL — 15 emails with clues), `socQuestions.js` (SOC_QUESTIONS — 6 questions), `game.js` (timing constants), `config.js` (LEADERBOARD_URL)
- Depends on: Nothing
- Used by: Hooks layer

**Utils Layer:**
- Purpose: Pure functions — no React, no side effects
- Location: `src/utils/*.js`
- Contains: `scoreSoc.js` (SOC scoring + scaling), `validateSpl.js` (keyword-based SPL validation), `shuffle.js` (Fisher-Yates email pool shuffler), `competency.js` (competency paragraph generator), `confetti.js` (canvas particle effect), `exportCsv.js` (CSV download helper)
- Depends on: Nothing (pure functions)
- Used by: Hooks layer and component layer

**Style / Token Layer:**
- Purpose: Shared design constants referenced by components
- Location: `src/styles/tokens.js`, `src/styles/animations.css`, `src/index.css`
- Contains: `glass` surface style object, `MAX_SCORE`/zone score constants, `ZONE_META_LIST` (zone metadata)
- Depends on: Nothing
- Used by: Almost every component for the glass card visual style

**External / Backend Layer:**
- Purpose: Server-side persistence and CI/CD
- Location: `google-apps-script.js`, `.github/workflows/deploy.yml`
- Contains: Google Apps Script web app (`doPost`/`doGet`) writing to Google Sheets; GitHub Pages deploy pipeline
- Depends on: `src/config.js` (LEADERBOARD_URL)

## Data Flow

### Primary Request Path — Email Classification (Zones 1-3)

1. Player registers on `LandingScreen` — `gs.startGame(name, email)` shuffles email pool via `shuffleEmails()` (`src/utils/shuffle.js`) and fires `submitToSheet({ action: 'register' })`
2. `App.jsx` renders `GameRound` with `gs.currentEmail`, `gs.round`, and callbacks
3. `GameRound` instantiates `useTimer` (120s countdown) and `useProctoring` (tab-switch detection) locally
4. Player reveals clues (`gs.revealClue`), selects L1/L2 (`gs.selectL1`, `gs.selectL2`), then submits
5. `handleSubmit` in `App.jsx` calls `sc.scoreRound(...)` — produces a `record` object, updates `sc.totalScore`, `sc.zoneScores`, `sc.categoryCorrect`, `sc.perEmail`
6. `gs.submitRound(record)` stores `record` in `gs.round.lastRecord` and transitions to `SCREENS.EXPLANATION`
7. After last email in zone: `gs.nextEmail()` detects `nextIndex >= zoneEnd`, transitions to `SCREENS.ZONE_COMPLETE`
8. `handleAdvanceZone` in `App.jsx` fires `submitToSheet` if zone === 3, then calls `gs.advanceZone()`

### SOC Investigation Path (Zone 4)

1. After zone 3 completes, `gs.advanceZone()` transitions to `SCREENS.SOC_INTRO`
2. `SocRound` receives `soc.currentQuestion` and `soc.currentAnswer` as props
3. Player sets primary/secondary classification and writes SPL text
4. `handleSocSubmit` calls `soc.submitSocRound()` — runs `validateSpl()` against `q.splRules.tasks`, then `scoreSocRound()`, stores result in `answers[idx].result`
5. `SocExplanationCard` displays scoring breakdown and hints
6. `handleSocNext` advances to next question or, when all 6 done, calls `scaleSocScore(soc.socTotal, sc.totalScore)` to produce `socScaled` and `finalScore`
7. Full `consolidatedPayload` (zones + SOC + proctoring) is POSTed via `soc.submitFinal()` with 3-retry logic; `sessionStorage` failover saves payload before fetch
8. Transitions to `SCREENS.SOC_RESULTS`

### Proctoring Data Flow

1. `GameRound` and `SocRound` each instantiate `useProctoring({ active: !answer.submitted })`
2. `visibilitychange` and `blur` events increment `violations` counter (deduplicated by `lastHiddenRef`)
3. Violation count is bubbled up via `onViolationChange` prop callback (`setGameViolations` / `setSocViolations` in `App.jsx`)
4. `gameViolations + socViolations` is included in the final submission payload as `proctoring_violations`

### Reviewer / Admin Flow

1. `LandingScreen` shows "Reviewer" link — `gs.setScreen(SCREENS.ADMIN)`
2. `AdminPanel` is lazy-loaded (`React.lazy` + `Suspense` in `src/App.jsx:21`) — loaded on first navigation to `SCREENS.ADMIN`
3. `useAdmin` POSTs `{ action: 'getAdminData', passcode }` to Google Apps Script
4. On success: renders `CandidateList` — on candidate select — renders `AnswerSheet`
5. CSV export uses `downloadCsv()` from `src/utils/exportCsv.js`

**State Management:**
- No global store. All state in `useState` within custom hooks.
- `App.jsx` is the only component that instantiates `useGameState`, `useScoring`, `useSocState`, `useBadges` — state is passed as props to screens.
- `useTimer` and `useProctoring` are instantiated locally inside `GameRound` and `SocRound` respectively.
- State resets on page refresh (no persistence beyond `sessionStorage` SOC failover and `localStorage` one-attempt guard).

## Key Abstractions

**SCREENS enum:**
- Purpose: All valid screen identifiers — drives the entire navigation state machine
- Location: `src/hooks/useGameState.js:5-19`
- Values: `LANDING`, `TUTORIAL`, `ZONE_INTRO`, `ROUND`, `EXPLANATION`, `ZONE_COMPLETE`, `RESULTS`, `SOC_INTRO`, `SOC_ROUND`, `SOC_EXPLANATION`, `SOC_RESULTS`, `REVIEWER` (unused), `ADMIN`
- Pattern: `gs.setScreen(SCREENS.XXX)` is the only navigation mechanism

**Round State object:**
- Purpose: Tracks player actions within one email classification round
- Shape: `{ cluesRevealed: [], selectedL1: null, selectedL2: null, submitted: false, timedOut: false, lastRecord: null }`
- Location: `src/hooks/useGameState.js:23-32`
- Reset: `initialRoundState()` called on `startZone()`, `nextEmail()`, `advanceZone()`

**Scoring Record object:**
- Purpose: Immutable per-email result stored in `sc.perEmail[]`
- Shape: `{ emailId, zone, selectedL1, selectedL2, correctL1, correctL2, l1Correct, l2Correct, cluesUsed, timedOut, points, l1Points, l2Points, clueDeduction }`
- Location: `src/hooks/useScoring.js:42-57`
- Used by: `ExplanationCard`, `ZoneComplete`, `ResultsScreen`, badge checks, final submission payload

**SOC Answer object:**
- Purpose: Per-question state for the SOC zone
- Shape: `{ primary: null, secondary: null, splText: "", submitted: false, result: null }`
- Location: `src/hooks/useSocState.js:16-24`

**glass token:**
- Purpose: Canonical CSS-in-JS object for the frosted-glass card surface used across all screens
- Location: `src/styles/tokens.js:4-10`
- Pattern: `import { glass } from '../styles/tokens.js'` then `const surface = { ...glass, ...overrides }`

**SOC Score constants:**
- `SOC_RAW_MAX = 92` (max raw points across 6 questions), `SOC_SCALED_MAX = 40` (scaled contribution to final score), `ZONES_RAW_MAX = 60` (max from zones 1-3)
- Location: `src/utils/scoreSoc.js:1-3`

## Entry Points

**Browser Entry:**
- Location: `src/main.jsx`
- Triggers: Browser loads `index.html`, Vite injects `<script type="module" src="/src/main.jsx">`
- Responsibilities: `createRoot` — `StrictMode` — `ErrorBoundary` — `App`

**Build Entry:**
- Location: `vite.config.js`
- Base path: `/flagmail1/` for GitHub Pages subpath deployment

**Deployment:**
- Location: `.github/workflows/deploy.yml`
- Triggers: Push to `main` branch
- Pipeline: `npm ci` — `npm run build` — upload `dist/` — GitHub Pages

**Google Apps Script:**
- Location: `google-apps-script.js`
- Triggers: HTTP POST (`doPost`) or GET (`doGet`) from browser fetch calls
- Actions handled: `register`, `submit`, `submitFinal`, `getAdminData`

## Architectural Constraints

- **State architecture:** No global state store. All state in `useState` inside custom hooks. State is lost on page refresh (intentional — one-attempt assessment tool).
- **Navigation:** No React Router. Screen transitions via `gs.setScreen(SCREENS.XXX)`. Single conditional-render block in `App.jsx`.
- **Prop passing:** App to screen component to sub-component. Max one level of prop drilling. No Context used.
- **Data persistence:** Browser memory only during session. `sessionStorage` used solely as SOC submission failover. `localStorage` used only for one-attempt guard key `'flagmail_attempted'`.
- **External dependency:** Google Apps Script uses `no-cors` fetch mode in `useLeaderboard` — responses are opaque. `useGameState.submitToSheet` uses regular fetch (CORS-enabled Apps Script) with JSON response. Both use `console.warn` on failure — fire-and-forget with 3-retry wrapper.
- **Animation approach:** Hybrid — CSS keyframes (`src/styles/animations.css`), Framer Motion (`motion.div`, `AnimatePresence`) in ~20 components, Lottie JSON animations for badges (`src/assets/animation/*.json`), GSAP imperative timeline in `GameRound.jsx`, canvas confetti in `src/utils/confetti.js`.
- **Lazy loading:** Only `AdminPanel` is lazy-loaded (`React.lazy` + `Suspense` in `src/App.jsx:21`) to keep initial bundle lean.
- **Threading:** Single-threaded browser event loop. No Web Workers. `useTimer` uses `setInterval` with 1-second tick.

## Anti-Patterns

### Local re-declaration of ZONE_META

**What happens:** `ZONE_META` (zone to name/accent/tone) is declared as a module-level constant independently in `GameRound.jsx`, `ZoneComplete.jsx`, `ResultsScreen.jsx`, and `LandingScreen.jsx` with slightly differing shapes.
**Why it's wrong:** Zone metadata changes require edits in 4+ places. `ZONE_META_LIST` already exists in `src/styles/tokens.js` but is not consumed by these components.
**Do this instead:** Import `ZONE_META_LIST` from `src/styles/tokens.js` and derive the keyed lookup from it.

### Deprecated component still in file system

**What happens:** `src/components/ReviewerScreen.jsx` is marked `@deprecated` but remains present.
**Why it's wrong:** Creates confusion about which component is authoritative for reviewer access.
**Do this instead:** Delete `ReviewerScreen.jsx` once `AdminPanel` is confirmed stable.

### Scoring logic inline in App.jsx handleSocNext

**What happens:** Tier calculation (`finalScore >= 80 ? 'Advanced' : ...`) and SOC answer payload aggregation are inline inside `handleSocNext` in `src/App.jsx:43-98`.
**Why it's wrong:** Business logic leaks into the orchestrator; harder to test and reuse.
**Do this instead:** Extract to a utility function in `src/utils/scoreSoc.js` alongside `scaleSocScore`, or move into `useSocState`.

## Error Handling

**Strategy:** Defensive — catch and warn, never crash the user.

**Patterns:**
- `ErrorBoundary` (class component) wraps entire app in `src/main.jsx` and again inside `App.jsx` — catches render errors, shows reload UI
- All `fetch` calls to Google Apps Script wrapped in `try/catch` with `console.warn` only — silent failure for player
- SOC submission stores payload to `sessionStorage` before fetching — recovery safety net
- `useGameState.submitToSheet` retries up to 3 times with 1-second delay between attempts (`src/hooks/useGameState.js:141-158`)
- PropTypes validation on all components (runtime type checking; no TypeScript)

## Cross-Cutting Concerns

**Logging:** `console.warn` for all async failures. No structured logging. No log levels.
**Validation:** SPL query validated via keyword-matching in `src/utils/validateSpl.js`. Player name/email validated inline in `src/components/LandingScreen.jsx` (regex + trim checks). No shared validation framework.
**Authentication:** Reviewer access via shared passcode only — checked server-side by Google Apps Script `getAdminData` action. No identity provider, no JWT, no session token.
**One-attempt enforcement:** `localStorage.getItem('flagmail_attempted')` checked in `src/components/LandingScreen.jsx` before allowing game start.

---

*Architecture analysis: 2026-06-08*
