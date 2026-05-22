# Conventions

> Generated: 2026-05-21

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
