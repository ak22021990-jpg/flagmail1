# Codebase Structure

**Analysis Date:** 2026-05-25

## Directory Layout

```
flagmail1/
├── .github/workflows/       # CI/CD pipeline
│   └── deploy.yml           # GitHub Pages deployment on push to main
├── .planning/               # GSD project planning artifacts
├── Dataset/                 # Raw question data (markdown docs)
├── docs/superpowers/        # Design specs and plans
├── dist/                    # Built output (generated, not committed)
├── node_modules/            # Dependencies (not committed)
├── playwright-artifacts/    # Playwright visual test screenshots
├── public/                  # Static assets served as-is
│   ├── vite.svg
│   └── veridian-favicon.svg
├── scripts/
│   └── playwright-audit.mjs # Playwright audit script
├── src/                     # Source code
│   ├── assets/
│   │   ├── animation/       # Lottie JSON animation files (12)
│   │   ├── images/          # Page background images (4)
│   │   ├── Loverine.otf     # Custom font
│   │   └── HomemadeApple.ttf # Custom font
│   ├── components/          # All React components (32)
│   ├── config/              # Game configuration
│   │   └── game.js          # Timer constants (ROUND_DURATION_SECONDS, etc.)
│   ├── data/                # Static datasets
│   ├── hooks/               # Custom React hooks (7)
│   ├── styles/              # CSS and design tokens
│   ├── utils/               # Pure utility functions (7, includes 2 test files)
│   ├── App.jsx              # Root orchestrator component
│   ├── config.js            # Google Apps Script web app URL
│   ├── index.css            # Global CSS + CSS custom properties
│   └── main.jsx             # Application entry point
├── index.html               # Vite HTML entry
├── google-apps-script.js    # Google Apps Script backend code
├── package.json             # Dependencies and scripts
├── vite.config.js           # Vite build config
├── vitest.config.js         # Test runner config
├── eslint.config.js         # ESLint flat config
├── CLAUDE.md                # Claude agent instructions
├── AGENTS.md                # GitNexus instructions
├── ANIMATION_BRIEF.md       # Animation design brief
├── REVIEW.md                # User-facing review notes
└── README.md                # Project README
```

## Directory Purposes

**`src/components/`**:
- Purpose: All screen-level and reusable UI components
- Contains: 32 `.jsx` files
- Key files:
  - `App.jsx` — root orchestrator, screen router, hook instantiation (defined at `src/` level)
  - `GameRound.jsx` — main classification round with timer + proctoring + email display (452 lines, largest component)
  - `LandingScreen.jsx` — player registration form (464 lines)
  - `ResultsScreen.jsx` — final score + competency + badge display (309 lines)
  - `ErrorBoundary.jsx` — class-based error boundary (67 lines)

**`src/hooks/`**:
- Purpose: All game state and behavior encapsulated in custom hooks
- Contains: 7 `.js` files
- Key files:
  - `useGameState.js` — screen state machine, player data, email pool, zone progression, Google Sheet submission (182 lines)
  - `useScoring.js` — score tracking per email/zone/total + category accuracy (96 lines)
  - `useSocState.js` — SOC classification quiz state, answer tracking, SPL validation (204 lines)
  - `useBadges.js` — 10 badge types, check-after-round/zone/game patterns (122 lines)
  - `useProctoring.js` — tab-switch detection via visibilitychange + blur/focus (73 lines)
  - `useTimer.js` — countdown timer with green/amber/red phase (49 lines)
  - `useLeaderboard.js` — GET/POST to Google Apps Script leaderboard (43 lines)

**`src/utils/`**:
- Purpose: Pure functions with no React dependency
- Contains: 7 files (5 `.js` + 2 `.test.js`)
- Key files:
  - `scoreSoc.js` — SOC question scoring (scaling, per-round score calculation)
  - `validateSpl.js` — SPL query keyword validation (required/optional/blocked term matching)
  - `shuffle.js` — Fisher-Yates shuffle of emails per zone with clue limits
  - `competency.js` — Competency summary text generation from category accuracy
  - `confetti.js` — Canvas-based confetti animation

**`src/data/`**:
- Purpose: Static datasets powering the game
- Contains: 3 files
  - `emails.js` — 15 email objects with classification (L1/L2), clues, reasoning
  - `socQuestions.js` — 6 SOC analyst questions with classification, SPL rules, keywords
  - `email_dataset.csv` — Raw CSV dataset

**`src/styles/`**:
- Purpose: Design tokens and CSS animations
- Contains: 2 files
  - `tokens.js` — glass surface style, score constants (POINTS_PER_EMAIL, MAX_SCORE), zone metadata
  - `animations.css` — 148 lines of CSS keyframe animations (tooltipCountdown, fadeSlideUp, springIn, shake, stampIn, floatUp, timerPulse, toastSlideIn, etc.)

**`src/assets/`**:
- Purpose: Static binary assets
- Contains:
  - `animation/` — 12 Lottie JSON animation files (badge celebrations, confetti)
  - `images/` — 4 page background images
  - 2 custom fonts (Loverine.otf, HomemadeApple.ttf)

**`public/`**:
- Purpose: Assets served at root path without build processing
- Contains: `vite.svg`, `veridian-favicon.svg`

**`dist/`**:
- Purpose: Vite build output (generated)
- Contains: `index.html`, `assets/` with hashed JS/CSS bundles
- Committed: Yes (for GitHub Pages deployment from `dist/` folder)

**`docs/superpowers/`**:
- Purpose: Design specs and implementation plans
- Contains: 4 specs + 2 plans (markdown)

## Key File Locations

**Entry Points:**
- `src/main.jsx`: Application mount — renders `<StrictMode><ErrorBoundary><App/></ErrorBoundary></StrictMode>` into `#root`
- `index.html`: Vite HTML entry — div#root, script module src
- `vite.config.js`: Build config — React plugin, base path `/flagmail1/`
- `.github/workflows/deploy.yml`: CI/CD — build + deploy to GitHub Pages on push to main

**Configuration:**
- `src/config.js`: Google Apps Script web app URL (`LEADERBOARD_URL`)
- `src/config/game.js`: Timer duration constants (ROUND_DURATION_SECONDS: 120, LIGHTNING_READ_SECONDS: 10, SNIPER_SECONDS: 15, BEAT_THE_CLOCK_SECONDS: 5)
- `package.json`: Scripts (dev/build/test/lint/preview), dependencies (React 19, Vite 7, framer-motion, gsap, lottie-react, matter-js, papaparse)

**Core Logic:**
- `src/App.jsx`: Screen orchestrator — instantiates 4 hooks, wires callbacks, renders 1 of 11 screens
- `src/hooks/useGameState.js`: Screen state machine (11 states), email pool, zone/round progression, sheet submission
- `src/hooks/useScoring.js`: Score calculation engine — per-email, per-zone, cumulative, category accuracy
- `src/hooks/useSocState.js`: SOC quiz engine — answer tracking, SPL validation, scoring, final payload assembly
- `src/hooks/useBadges.js`: Badge system — 10 badges checked after round/zone/game
- `src/utils/shuffle.js`: Email shuffling — pools 15 emails across 3 zones, Fisher-Yates per zone

**Testing:**
- `src/utils/scoreSoc.test.js`: Unit tests for SOC scoring
- `src/utils/validateSpl.test.js`: Unit tests for SPL query validation
- `vitest.config.js`: Vitest config — includes `src/**/*.test.js` patterns

## Naming Conventions

**Files:**
- Components: PascalCase `.jsx` — `GameRound.jsx`, `LandingScreen.jsx`, `EmailCard.jsx`
- Hooks: camelCase prefix `use` `.js` — `useGameState.js`, `useScoring.js`, `useTimer.js`
- Utilities: camelCase `.js` — `shuffle.js`, `competency.js`, `validateSpl.js`
- Test files: `*.test.js` co-located with source — `scoreSoc.test.js` next to `scoreSoc.js`
- Data: camelCase `.js` — `emails.js`, `socQuestions.js`
- Config: camelCase `.js` — `game.js`
- Styles: camelCase `.js` + `.css` — `tokens.js`, `animations.css`

**Directories:**
- All lowercase — `components/`, `hooks/`, `utils/`, `assets/`, `data/`, `styles/`, `config/`

**Functions:**
- Exported React components: PascalCase (matching file name)
- Custom hooks: camelCase with `use` prefix — `useGameState`, `useScoring`, `useTimer`
- Utility functions: camelCase — `shuffleEmails`, `validateSpl`, `scaleSocScore`, `generateCompetency`, `runConfetti`
- Callback props in components: camelCase with `on` prefix — `onSubmit`, `onRevealClue`, `onSelectL1`, `onNext`

**Variables:**
- camelCase throughout — `timeLeft`, `earlyUnlocked`, `consecutivePerfect`, `emailInZone`, `displayScore`
- `SCREENS` const object (ALL_CAPS)
- Zone/level constants: camelCase or ALL_CAPS depending on context

## Where to Add New Code

**New Feature (e.g., new game zone or assessment type):**
1. Static data: `src/data/<feature-name>.js`
2. State hook: `src/hooks/use<Feature>.js`
3. Screen component: `src/components/<Feature>Screen.jsx`
4. Wire in `src/App.jsx` — add screen constant to imports, add render condition, add hook call
5. Scoring/utilities: `src/utils/<feature>.js`
6. Tests: `src/utils/<feature>.test.js`
7. Config: `src/config/game.js` (if new timer/constant needed)

**New Component/Module:**
- Screen-level component: `src/components/` (PascalCase.jsx)
- Reusable UI component: `src/components/` (PascalCase.jsx)
- Custom hook: `src/hooks/useThing.js`
- Utility function: `src/utils/<name>.js`

**New Test:**
- Unit test: `src/utils/<name>.test.js` (co-located with utility)
- Config: Add to `vitest.config.js` includes if pattern changes

**Style Changes:**
- CSS custom properties: `src/index.css` (`:root` block)
- Design tokens (glass, score constants, zone meta): `src/styles/tokens.js`
- CSS keyframe animations: `src/styles/animations.css`

**New Badge:**
- Add badge definition to `BADGES` const in `src/hooks/useBadges.js`
- Add check logic in `checkAfterRound`, `checkAfterZone`, or `checkAfterGame`
- Add Lottie animation file to `src/assets/animation/`

**External Integration:**
- API URL: `src/config.js`
- API call hook: `src/hooks/use<Api>.js`
- Google Apps Script: `google-apps-script.js` (separate deploy, not part of Vite build)

## Special Directories

**`dist/`:**
- Purpose: Vite production build output
- Generated: Yes (by `npm run build`)
- Committed: Yes — GitHub Pages deployment serves from `dist/`

**`node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes (by `npm install`)
- Committed: No (gitignored)

**`.github/workflows/`:**
- Purpose: GitHub Actions CI/CD
- Generated: No
- Committed: Yes

**`playwright-artifacts/`:**
- Purpose: Playwright visual test screenshots and reports
- Generated: Yes (by running `scripts/playwright-audit.mjs`)
- Committed: Yes (reference images for testing)

**`docs/superpowers/`:**
- Purpose: Design docs and spec artifacts
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-05-25*
