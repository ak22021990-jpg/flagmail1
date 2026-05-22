# Concerns

> Generated: 2026-05-21

## Duplicate Project (HIGH)

Two near-identical projects exist: `flagmail/` and `flagmail1/`. Both share identical dependencies, components, hooks, and data. Differences found:
- `flagmail1/google-apps-script.js` has improved two-phase registration flow
- `flagmail1/src/config.js` has different `LEADERBOARD_URL`
- `flagmail1` is GitNexus-indexed
- Minor diff in App.jsx (flagmail1 has `action: 'register'` on landing screen submit)
- `flagmail1` has additional files: `AGENTS.md`, `CLAUDE.md`, `Splunk.md`, `Splunk Questions.docx`, `.gitnexus/`

**Risk**: Confusion which is canonical. Changes must be sync'd across both or one deprecated.

## No Tests (HIGH)

Zero unit, integration, or E2E tests. The scoring formula (`useScoring.js`) and badge logic (`useBadges.js`) contain non-trivial business rules with no automated verification. Playwright script captures screenshots only — no assertions.

## No TypeScript (MEDIUM)

Entire codebase is plain JavaScript. No type checking for props, hook returns, or API responses. Refactoring risk is higher without type coverage.

## Google Apps Script as Backend (MEDIUM)

- No auth — public endpoint
- No rate limiting
- No data validation beyond basic try/catch
- Spreadsheet row limits (18M cells max, but per-email data grows fast)
- Latency varies (GAS execution time limit ~6 minutes, but slow requests degrade UX)
- No offline fallback — if script deployment URL changes, leaderboard breaks silently

## Animation Library Fragmentation (MEDIUM)

Three animation libraries installed:
- `framer-motion` — screen-level transitions
- `gsap` — planned badge animations
- `animejs` — unused? (no import found in JSX files, possibly fallback)

Plus Lottie for badge animations. This is 4 animation systems for one game. The `ANIMATION_BRIEF.md` plans GSAP upgrades but much of it is not yet implemented.

## Score Submission Silent Failure (LOW)

`submitToSheet` in `useGameState.js` and `submitScore` in `useLeaderboard.js` both use try/catch with `console.warn` only. If leaderboard URL is misconfigured, users never know their score wasn't saved.

## No CI/CD (LOW)

No GitHub Actions, no build pipeline, no automated deploy. The only build verification is `npm run lint && npm run build`.

## Visual Audit Is Manual (LOW)

Playwright script captures DOM metrics but doesn't assert against baselines. Requires human review of screenshots.

## Self-Hosted Fonts (LOW)

`HomemadeApple.ttf` and `Loverine.otf` are bundled in `src/assets/`. These are likely licensed fonts — verify licensing before deploying.

## Hardcoded Dataset (LOW)

15 emails embedded in JS source. Adding more emails requires code change. CSV in `src/data/email_dataset.csv` suggests there were plans for dynamic loading.
