<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **flagmail1** (938 symbols, 1197 relationships, 12 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

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
## Notable Absences
- **No TypeScript** — all `.js` / `.jsx` with JSDoc-style comments
- **No CSS framework** — plain CSS with CSS variables
- **No state management library** — `useState`/`useCallback` only
- **No router** — custom screen state machine in `useGameState`
- **No testing framework** — no Jest, Vitest, or React Testing Library
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Code Style
- **Language**: JavaScript (ES2020+), no TypeScript
- **JSX**: `.jsx` extension required
- **Semicolons**: always
- **Quotes**: single quotes for JS strings
- **Indentation**: 2 spaces
- **Trailing commas**: yes (in multiline arrays/objects)
## Naming
| Element | Convention | Example |
|---------|-----------|---------|
| Components | PascalCase | `GameRound.jsx` |
| Hooks | `use` prefix, camelCase | `useGameState.js` |
| Utils | camelCase | `shuffle.js` |
| Constants | UPPER_SNAKE_CASE | `ROUND_DURATION_SECONDS` |
| CSS classes | kebab-case | `anim-fadeSlideUp` |
| CSS variables | kebab-case | `--flagmail-ink` |
| Files | PascalCase for components | `LandingScreen.jsx` |
## Component Patterns
- **Function components only** — no class components
- **Default exports** for all components
- **Named exports** for hooks, utils, constants
- Props destructured inline: `export default function GameRound({ email, zone, ... })`
- Callbacks wrapped in `useCallback` with dependency arrays
- No PropTypes or TypeScript interfaces
## Hook Patterns
- Each hook manages ONE concern (game state, scoring, badges, timer, leaderboard)
- Hooks return objects with state + action functions
- `useState` for local state, `useCallback` for actions, `useRef` for mutable refs
- `useEffect` minimal — primarily used in `useTimer.js` for interval logic
## CSS Patterns
- **Global CSS** via `src/index.css` — CSS variables, resets, scrollbar styling
- **Animation classes** in `animations.css` — utility classes with `.anim-*` prefix
- **Inline styles** for dynamic JS values (e.g., gradient backgrounds)
- No CSS modules, CSS-in-JS, or Tailwind
- Glass surface pattern: `rgba(255,255,255,0.74)` background + blur + subtle border
## Error Handling
- **Try/catch** in Google Apps Script `doPost`/`doGet` — returns `{ status: 'error', message }`
- **Try/catch** in `useLeaderboard.js` and `useGameState.submitToSheet` — silent failure with `console.warn`
- **No error boundaries** in React tree
- **No fallback UI for API failures** — leaderboard simply shows empty state
## File Organization
- One component per file
- Grouped by role: `components/`, `hooks/`, `data/`, `config/`, `styles/`, `utils/`
- Assets split: `animation/` (Lottie), `images/` (reference images)
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern
## Screen Flow
```
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
