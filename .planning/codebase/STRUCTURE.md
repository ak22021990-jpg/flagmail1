# Codebase Structure

**Analysis Date:** 2026-06-08

## Directory Layout

```
flagmail1/
├── src/
│   ├── App.jsx                  # Orchestrator — screen router, hook wiring
│   ├── main.jsx                 # Browser entry — createRoot + ErrorBoundary
│   ├── index.css                # Global CSS custom properties, font-face, resets
│   ├── config.js                # LEADERBOARD_URL (Google Apps Script endpoint)
│   ├── components/              # 34 React screen and UI components
│   │   ├── LandingScreen.jsx    # Player registration + zone preview
│   │   ├── TutorialScreen.jsx   # How-to-play tutorial
│   │   ├── ZoneIntroCard.jsx    # Zone start card
│   │   ├── GameRound.jsx        # Email classification round (zones 1-3)
│   │   ├── ExplanationCard.jsx  # Post-round answer reveal
│   │   ├── ZoneComplete.jsx     # End-of-zone summary
│   │   ├── ResultsScreen.jsx    # Final results (used for RESULTS and SOC_RESULTS screens)
│   │   ├── SocIntroCard.jsx     # SOC zone introduction
│   │   ├── SocRound.jsx         # SOC investigation question (zone 4)
│   │   ├── SocExplanationCard.jsx # SOC post-question scoring breakdown
│   │   ├── AdminPanel.jsx       # Lazy-loaded reviewer panel (passcode-gated)
│   │   ├── ReviewerScreen.jsx   # DEPRECATED — replaced by AdminPanel
│   │   ├── ErrorBoundary.jsx    # Class component — catches render errors
│   │   ├── EmailCard.jsx        # Email display within GameRound
│   │   ├── ClueSystem.jsx       # Progressive clue reveal UI
│   │   ├── Classifier.jsx       # L1/L2 selection buttons
│   │   ├── ClassifyButton.jsx   # Individual classification option button
│   │   ├── TimerBar.jsx         # Visual countdown progress bar
│   │   ├── RoundHeader.jsx      # Zone/email progress header
│   │   ├── ScoreDisplay.jsx     # Animated score counter
│   │   ├── BadgeToast.jsx       # Badge unlock toast notification
│   │   ├── BadgeCollection.jsx  # Badge grid display
│   │   ├── AnswerSheet.jsx      # SOC answer detail for reviewer
│   │   ├── CandidateList.jsx    # Candidate list table for reviewer
│   │   ├── AuthForm.jsx         # Shared name/email input form
│   │   ├── CategoryBreakdown.jsx # Per-category accuracy chart
│   │   ├── CompetencySummary.jsx # Generated competency paragraph display
│   │   ├── DifficultyBadge.jsx  # Zone difficulty label chip
│   │   ├── EmailHeaderPanel.jsx # Email metadata header display
│   │   ├── FeatureHighlight.jsx # Landing page feature card
│   │   ├── HintPanel.jsx        # SOC hint reveal panel
│   │   ├── RankCard.jsx         # Score rank card in results
│   │   ├── ReasoningModal.jsx   # Modal for SOC reasoning input
│   │   └── ZoneFeatureCard.jsx  # Zone feature description card
│   │   └── ZoneIntroCard.jsx    # Zone intro card
│   │   └── ZoneStatCard.jsx     # Zone statistics card
│   ├── hooks/                   # 8 custom hooks — all mutable state lives here
│   │   ├── useGameState.js      # SCREENS enum + full game state machine
│   │   ├── useScoring.js        # Email scoring, zone totals, category accuracy
│   │   ├── useSocState.js       # SOC quiz answers, SPL validation, scoring
│   │   ├── useBadges.js         # BADGES constant + unlock logic
│   │   ├── useTimer.js          # Countdown timer with phase (green/amber/red)
│   │   ├── useProctoring.js     # Tab-switch violation detection
│   │   ├── useLeaderboard.js    # Legacy leaderboard GET/POST
│   │   └── useAdmin.js          # Admin panel passcode-auth + data fetch
│   ├── data/                    # Static game datasets
│   │   ├── emails.js            # EMAIL_POOL — 15 emails with clues and answers
│   │   ├── socQuestions.js      # SOC_QUESTIONS — 6 SOC investigation questions
│   │   └── email_dataset.csv    # Raw CSV source (not imported in code)
│   ├── config/
│   │   └── game.js              # Timing constants (ROUND_DURATION_SECONDS etc.)
│   ├── utils/                   # Pure utility functions (no React)
│   │   ├── scoreSoc.js          # SOC round scoring + final score scaling
│   │   ├── scoreSoc.test.js     # Unit tests for scoreSoc
│   │   ├── validateSpl.js       # Keyword-based SPL query validation
│   │   ├── validateSpl.test.js  # Unit tests for validateSpl
│   │   ├── shuffle.js           # Fisher-Yates email pool shuffler
│   │   ├── competency.js        # Competency paragraph generator
│   │   ├── confetti.js          # Canvas particle confetti effect
│   │   └── exportCsv.js         # CSV blob download helper
│   ├── styles/
│   │   ├── tokens.js            # glass style object, score constants, ZONE_META_LIST
│   │   └── animations.css       # CSS keyframe animations
│   └── assets/
│       ├── animation/           # Lottie JSON files for badge and celebration animations
│       │   ├── BEAT_THE_CLOCK.json
│       │   ├── EAGLE_EYE.json
│       │   ├── GHOST_DETECTIVE.json
│       │   ├── ICE_COLD.json
│       │   ├── LIGHTNING_READ.json
│       │   ├── NO_HINTS_NEEDED.json
│       │   ├── ON_FIRE.json
│       │   ├── PERFECT_EYE.json
│       │   ├── SNIPER.json
│       │   ├── ZONE_CLEAR.json
│       │   └── Celebration Update Color.json
│       ├── images/              # Static images (4 pages)
│               ├── DisplayFont.ttf      # Display font
│       └── Loverine.otf         # Display font
├── google-apps-script.js        # Google Apps Script backend (deploy to Apps Script)
├── index.html                   # HTML entry point — #root mount target
├── vite.config.js               # Vite config — base: '/flagmail1/'
├── eslint.config.js             # ESLint v9 flat config
├── vitest.config.js             # Vitest config
├── package.json                 # Dependencies and npm scripts
├── package-lock.json            # Lockfile
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Pages CI/CD pipeline
├── .planning/
│   └── codebase/                # GSD codebase analysis documents
├── .claude/                     # Claude / GSD tooling config
├── .gitnexus/                   # GitNexus code intelligence index
├── scripts/
│   └── playwright-audit.mjs    # Playwright visual audit script
├── public/                      # Static assets served at root (if any)
├── dist/                        # Built output (generated, not committed)
├── docs/                        # Documentation
├── Dataset/                     # Raw dataset files
└── graphify-out/                # GraphiF knowledge graph output (generated)
```

## Directory Purposes

**`src/components/`:**
- Purpose: All React UI — full-screen views and shared sub-components
- Contains: `.jsx` files only; each file is one default-exported React component
- Key screen components: `LandingScreen`, `GameRound`, `SocRound`, `ResultsScreen`, `AdminPanel`
- Key sub-components: `EmailCard`, `ClueSystem`, `Classifier`, `TimerBar`, `BadgeToast`, `ScoreDisplay`

**`src/hooks/`:**
- Purpose: All mutable state and async side effects (fetch, timers, event listeners)
- Contains: `.js` files, each exporting one `use*` function; `useGameState.js` also exports `SCREENS` and `BADGES`
- Rule: Hooks are instantiated in `App.jsx` (game hooks) or locally in screen components (`useTimer`, `useProctoring`)

**`src/data/`:**
- Purpose: Static game content — email scenarios and SOC questions
- Contains: JS modules exporting frozen arrays (`EMAIL_POOL`, `SOC_QUESTIONS`); also the raw `email_dataset.csv` source file (not imported by code)
- Rule: Never mutate these arrays at runtime. Changes here affect all players.

**`src/config/`:**
- Purpose: Runtime configuration constants (not secrets)
- Contains: `game.js` — timer durations for rounds and badge thresholds

**`src/config.js`** (root-level, singular):
- Purpose: External service URL
- Contains: `LEADERBOARD_URL` — Google Apps Script web app endpoint
- Note: Flat file at `src/` root, not inside `src/config/`

**`src/utils/`:**
- Purpose: Pure functions with no React dependency and no side effects
- Contains: Scoring logic, validation, data transformation, UI helpers (confetti, CSV)
- Rule: Utils must be importable in test environments (Node/jsdom) without React

**`src/styles/`:**
- Purpose: Shared visual design system
- Contains: `tokens.js` (JS constants for glass surface, score math, zone metadata), `animations.css` (CSS keyframes)
- Rule: Import `glass` from `tokens.js` in every screen component; customize with spread overrides

**`src/assets/`:**
- Purpose: Static binary assets bundled by Vite
- Contains: Lottie JSON animations (named by badge ID), JPEG images, TTF/OTF fonts

## Key File Locations

**Entry Points:**
- `src/main.jsx`: Browser bootstrap — mounts React app into `#root`
- `index.html`: HTML shell — Vite entry HTML

**Screen Router:**
- `src/App.jsx`: Only place that renders screen components; contains `handleSubmit`, `handleNext`, `handleAdvanceZone`, `handleSocSubmit`, `handleSocNext`

**Navigation Constants:**
- `src/hooks/useGameState.js:5-19`: `SCREENS` enum — import from here when calling `setScreen`

**Scoring System:**
- `src/hooks/useScoring.js`: Zone 1-3 per-email scoring
- `src/utils/scoreSoc.js`: SOC scoring (`scoreSocRound`) and final score scaling (`scaleSocScore`)
- `src/styles/tokens.js`: `MAX_SCORE = 60`, `POINTS_PER_EMAIL = 4`, `EMAILS_PER_ZONE = 5`

**SPL Validation:**
- `src/utils/validateSpl.js`: `validateSpl(splText, rules)` — keyword/anyOf matching
- SPL rules are co-located with questions in `src/data/socQuestions.js` under `q.splRules.tasks[]`

**Configuration:**
- `src/config.js`: `LEADERBOARD_URL`
- `src/config/game.js`: `ROUND_DURATION_SECONDS = 120`, badge time thresholds

**Design Tokens:**
- `src/styles/tokens.js`: `glass`, `MAX_SCORE`, `ZONE_META_LIST` — import in every component

**Testing:**
- `src/utils/validateSpl.test.js`: SPL validation unit tests
- `src/utils/scoreSoc.test.js`: SOC scoring unit tests

**Backend:**
- `google-apps-script.js`: Full Apps Script backend — deploy manually to Google Apps Script

## Naming Conventions

**Files:**
- `PascalCase.jsx` for React component files: `GameRound.jsx`, `BadgeToast.jsx`, `ErrorBoundary.jsx`
- `camelCase.js` for hooks: `useGameState.js`, `useSocState.js`
- `camelCase.js` for utils: `scoreSoc.js`, `validateSpl.js`, `shuffle.js`
- `camelCase.js` for config/data: `game.js`, `emails.js`, `tokens.js`
- `camelCase.test.js` for test files co-located with source: `scoreSoc.test.js`

**Directories:**
- `src/components/` — all React JSX components
- `src/hooks/` — all custom hooks
- `src/utils/` — all pure JS utilities
- `src/data/` — static content datasets
- `src/config/` — game configuration constants
- `src/styles/` — CSS and JS design tokens
- `src/assets/` — binary assets (fonts, images, Lottie JSON)

## Where to Add New Code

**New full-screen view:**
- Component: `src/components/YourScreen.jsx` (PascalCase, default export)
- Register in SCREENS enum: `src/hooks/useGameState.js:5-19`
- Add render branch in `src/App.jsx` (`gs.screen === SCREENS.YOUR_SCREEN`)

**New shared UI sub-component:**
- File: `src/components/YourComponent.jsx`
- Import in the screen component that uses it — no barrel index file

**New game state or action:**
- Add to the appropriate hook: `src/hooks/useGameState.js` for navigation/game flow, `src/hooks/useScoring.js` for scoring state
- Expose from hook return object, wire in `src/App.jsx`, pass as prop to screen

**New SOC question:**
- Add to `SOC_QUESTIONS` array in `src/data/socQuestions.js`
- Follow the existing shape: `{ id, scenario, evidence, classification, splRules, feedback, investigation_context, hints }`
- Update `QUESTION_SCORE_MAP` in `src/hooks/useSocState.js` with the new question ID

**New badge:**
- Add to `BADGES` constant in `src/hooks/useBadges.js`
- Add the corresponding Lottie JSON animation to `src/assets/animation/`
- Add unlock condition to `checkAfterRound`, `checkAfterZone`, or `checkAfterGame` in `useBadges`

**New pure utility:**
- File: `src/utils/yourUtil.js`
- Must be a named export, no React imports, no side effects
- Add a co-located test file: `src/utils/yourUtil.test.js`

**New timing constant:**
- Add to `src/config/game.js` as `export const UPPER_SNAKE_CASE = value`

**New design token:**
- Add to `src/styles/tokens.js` as a named export

## Special Directories

**`dist/`:**
- Purpose: Vite production build output
- Generated: Yes (by `npm run build`)
- Committed: No (in `.gitignore`)

**`.planning/`:**
- Purpose: GSD workflow artifacts — codebase analysis, phase plans, debug logs
- Generated: By GSD commands and Claude agents
- Committed: Yes (tracked in git)

**`.gitnexus/`:**
- Purpose: GitNexus code intelligence index (symbol graph, execution flows)
- Generated: Yes (by `npx gitnexus analyze`)
- Committed: Cache files may be gitignored; index is tracked

**`graphify-out/`:**
- Purpose: GraphiF knowledge graph export output
- Generated: Yes
- Committed: Cache only

**`playwright-artifacts/`:**
- Purpose: Playwright visual audit screenshots and flow recordings
- Generated: Yes (by `scripts/playwright-audit.mjs`)
- Committed: No

**`node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes (by `npm install`)
- Committed: No

---

*Structure analysis: 2026-06-08*
