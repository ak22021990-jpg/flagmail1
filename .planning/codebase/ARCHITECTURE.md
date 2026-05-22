# Architecture

> Generated: 2026-05-21

## Pattern

Single-page application (SPA) with **custom screen state machine architecture**. No router library. Screen transitions managed by `useGameState` hook's `screen` + `SCREENS` enum.

## Screen Flow

```
LANDING → TUTORIAL → ZONE_INTRO → ROUND → EXPLANATION → ZONE_COMPLETE → RESULTS
                                                              │
                                                     (zone < 3 → back to ZONE_INTRO)
```

## Layers

### 1. Entry (`src/main.jsx`)
- Mounts `<App />` in `#root` via `createRoot`

### 2. App Shell (`src/App.jsx`)
- Reads `gs.screen` to conditionally render screens
- Injects Google Apps Script URL from `config.js`
- Handles submit/next/advanceZone via callbacks

### 3. State Hooks (`src/hooks/`)
- `useGameState.js` — game flow, zone progression, email pool, perfect-streak tracking
- `useScoring.js` — scoring formula, per-email records, category accuracy
- `useBadges.js` — badge unlocking, toast queue, streak tracking
- `useTimer.js` — countdown timer (180s default)
- `useLeaderboard.js` — leaderboard fetch + score submission

### 4. Screen Components (`src/components/`)
- `LandingScreen.jsx` — player registration form
- `TutorialScreen.jsx` — gameplay instructions
- `ZoneIntroCard.jsx` — zone preview
- `GameRound.jsx` — main gameplay (email + classifier + timer)
- `ExplanationCard.jsx` — post-round feedback
- `ZoneComplete.jsx` — zone summary with badges
- `ResultsScreen.jsx` — final scores, leaderboard

### 5. Supporting Components
- `EmailCard.jsx` — email display with auth headers
- `Classifier.jsx` — L1/L2 category picker
- `ClueSystem.jsx` — progressive clue reveal
- `TimerBar.jsx` — countdown bar
- `BadgeToast.jsx` — badge unlock notification
- `BadgeCollection.jsx` — earned badges grid
- `Leaderboard.jsx` — scores table
- `CompetencySummary.jsx` — category strength analysis
- `RankCard.jsx` — player rank display
- `ReasoningModal.jsx` — explanation QA
- `EmailHeaderPanel.jsx` — email metadata panel

### 6. Data Layer (`src/data/`)
- `emails.js` — 15 email objects with clues, correct answers, explanations

### 7. Config (`src/config/`)
- `game.js` — timing constants (180s round, 10s lightning read, etc.)
- `tokens.js` — scoring constants (4 pts/email, 60 max), glass surface style, zone meta
- `config.js` (root) — leaderboard URL

## Data Flow

```
User Action → Component → Hook (state update) → Re-render
                                       ↓
                              Side effects (badge check, score record, sheet submit)
```

- No context API — all state flows through `App.jsx`
- `useGameState` and `useScoring` are independent hooks composed in `App`
- Score is computed via `useScoring` which maintains its own state
- Badge logic (`useBadges`) checks conditions after each round/zone/game

## Entry Points

- `index.html` → `/src/main.jsx` → `App.jsx`
- Deployed via `vite build` → `dist/` → static hosting
- Base path: `/flagmail1/`

## Key Architectural Decisions

- **No router**: screen state managed by `SCREENS` enum + switch rendering — simpler for linear game flow
- **Hooks over context**: each hook manages its own slice of state; parent (`App`) composes them
- **Static dataset**: all emails embedded in source — no API dependency during gameplay
- **Two-project structure**: `flagmail` (v1) and `flagmail1` (v2 with improved GAS backend)
