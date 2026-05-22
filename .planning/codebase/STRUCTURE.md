# Structure

> Generated: 2026-05-21

## Top-Level Layout

```
apple/
├── .claude/                  # Claude AI project config
├── .planning/                # GSD planning artifacts
│   ├── config.json
│   ├── graphs/               # Knowledge graph output
│   └── codebase/             # (this directory)
├── flagmail/                 # Project v1
├── flagmail1/                # Project v2 (GitNexus indexed)
├── graphify-out/             # Knowledge graph exports
```

## Project Layout (flagmail and flagmail1 are identical)

```
flagmail[1]/
├── index.html                # HTML entry
├── package.json              # Dependencies & scripts
├── vite.config.js            # Vite config (base: /flagmail1/)
├── eslint.config.js          # Flat ESLint config
├── google-apps-script.js     # Backend: Google Sheets integration
├── README.md                 # Default Vite README
├── ANIMATION_BRIEF.md        # GSAP + SVG animation spec
├── GAME_OVERVIEW.md          # Game rules & scoring docs
├── .gitignore
├── Dataset/                  # Raw training datasets
│   ├── Low.md
│   ├── Medium.md
│   └── hard.md
├── public/                   # Static assets
│   ├── veridian-favicon.svg
│   └── vite.svg
├── scripts/                  # Dev tooling
│   └── playwright-audit.mjs  # Visual regression audit
├── dist/                     # Build output (gitignored)
├── node_modules/             # (gitignored)
├── playwright-artifacts/     # Screenshot output
└── src/
    ├── main.jsx              # Entry point
    ├── App.jsx               # Root component
    ├── config.js             # Leaderboard URL
    ├── index.css             # Global styles + CSS variables
    ├── styles/
    │   ├── animations.css    # Keyframe animations
    │   └── tokens.js         # Design tokens + constants
    ├── config/
    │   └── game.js           # Timing constants
    ├── data/
    │   ├── emails.js         # 15 email objects (~740 lines)
    │   └── email_dataset.csv # Reference CSV
    ├── hooks/
    │   ├── useGameState.js   # Core game state machine
    │   ├── useScoring.js     # Score computation
    │   ├── useBadges.js      # Badge unlock logic
    │   ├── useTimer.js       # Countdown timer
    │   └── useLeaderboard.js # Leaderboard API
    ├── components/
    │   ├── LandingScreen.jsx
    │   ├── TutorialScreen.jsx
    │   ├── ZoneIntroCard.jsx
    │   ├── GameRound.jsx
    │   ├── ExplanationCard.jsx
    │   ├── ZoneComplete.jsx
    │   ├── ResultsScreen.jsx
    │   ├── EmailCard.jsx
    │   ├── Classifier.jsx
    │   ├── ClueSystem.jsx
    │   ├── TimerBar.jsx
    │   ├── BadgeToast.jsx
    │   ├── BadgeCollection.jsx
    │   ├── Leaderboard.jsx
    │   ├── CompetencySummary.jsx
    │   ├── RankCard.jsx
    │   ├── ReasoningModal.jsx
    │   └── EmailHeaderPanel.jsx
    ├── utils/
    │   ├── shuffle.js        # Fisher-Yates shuffle
    │   └── competency.js     # Competency paragraph generator
    └── assets/
        ├── animation/        # 10 Lottie JSON files (one per badge)
        ├── images/           # 4 JPG reference images
        └── HomemadeApple.ttf # Self-hosted font
```

## Naming Conventions

- **Files**: PascalCase for components (`GameRound.jsx`), camelCase for utilities/hooks
- **Exports**: default export for components, named exports for hooks/utils
- **Hooks**: `use*` prefix, always in `src/hooks/`

## Key Locations

| Path | Role |
|------|------|
| `src/App.jsx` | Screen router, compose hooks |
| `src/hooks/useGameState.js` | Game logic & state machine |
| `src/hooks/useScoring.js` | Scoring engine |
| `src/hooks/useBadges.js` | Badge unlock conditions |
| `src/data/emails.js` | Email dataset (15 entries) |
| `src/styles/tokens.js` | Design tokens (glass, scores, zone colors) |
| `google-apps-script.js` | Backend (Google Sheets) |
| `scripts/playwright-audit.mjs` | Visual audit tool |
