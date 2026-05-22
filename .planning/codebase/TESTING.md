# Testing

> Generated: 2026-05-21

## Status

**No automated unit/integration tests exist.** The codebase has zero test files.

## Testing Tools Available

| Tool | Used For | In Use? |
|------|----------|---------|
| Playwright | Visual regression screenshots | Yes |
| ESLint | Static analysis / lint | Yes |
| None | Unit tests (Jest, Vitest) | No |
| None | Component tests (RTT, Storybook) | No |
| None | E2E tests (Cypress, Playwright tests) | No |

## Current Test Strategy (Manual)

- **Playwright audit script** (`scripts/playwright-audit.mjs`):
  - Launches Chromium headless at 3 viewports (1440×900, 1280×720, 1024×768)
  - Captures full-page screenshots to `playwright-artifacts/`
  - Measures DOM layout metrics (scroll overflow, column dimensions, text content)
  - Reports JSON with layout data per viewport
  - **Not** a pass/fail test — purely visual reference collection
  - Run via: `node scripts/playwright-audit.mjs` (after `npm run build && npm run preview`)

- **Manual verification** flows:
  - Landing screen renders correctly at different viewports
  - Tutorial → game → results flow completes
  - Score calculation matches game formula
  - Badge conditions trigger correctly

## Coverage Gaps

- **No scoring logic unit tests** — the formula at `src/hooks/useScoring.js` has no automated verification
- **No badge condition tests** — `useBadges.js` edge cases (perfect streak, 6-category detection, etc.)
- **No component render tests** — `GameRound`, `Classifier`, `ExplanationCard` etc. untested
- **No GAS backend tests** — `google-apps-script.js` cannot be unit tested without Google Sheets
- **No accessibility tests**
- **No performance benchmarks**
