# Testing Patterns

**Analysis Date:** 2026-05-25

## Test Framework

**Runner:** Vitest v4 (`vitest` as both runner and assertion library)
- Config: `vitest.config.js`
- Uses `vitest`'s built-in `expect`, `describe`, `it` (imported from `"vitest"`)

**Run Commands:**
```bash
npm test                  # vitest run       (CI mode — single run)
npx vitest                # vitest           (watch mode)
npx vitest --coverage     # not configured — no coverage provider
```

## Test Configuration

```js
// vitest.config.js
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["src/**/*.test.js"],
  },
});
```

**Key details:**
- Glob pattern: `src/**/*.test.js`
- No `setupFiles`, no `environment` override (defaults to Node environment)
- No coverage configuration, no reporters configured
- No global test file — per-file imports from `vitest`

## Test File Organization

**Location:** Co-located with source files in `src/utils/`:
```
src/utils/scoreSoc.js         → src/utils/scoreSoc.test.js
src/utils/validateSpl.js      → src/utils/validateSpl.test.js
```

**Naming:** `<sourceFileName>.test.js` — mirrors source file name exactly.

**Total:** 2 test files, 18 test cases total.

## What Is Tested

**Only pure utility functions** — no component tests, no hook tests, no integration tests, no E2E tests.

| File | Module | Cases | Coverage |
|------|--------|-------|----------|
| `src/utils/scoreSoc.test.js` | `scoreSocRound` | 8 | edge cases: perfect score, grade thresholds, floor at 0, partial credit, caps |
| `src/utils/validateSpl.test.js` | `validateSpl`, `validateExplanation` | 10 | required hits, misses, blocked terms, whitespace normalization, case insensitivity, `anyOf` terms, empty string, missing arrays |

**Not tested:**
- `src/App.jsx` — root component
- All 25+ component files in `src/components/`
- All 7 custom hooks in `src/hooks/`
- Utility files: `shuffle.js`, `competency.js`, `confetti.js`
- Config files, data files
- Async logic (leaderboard fetch, Google Sheets submission)

## Test Structure

**Suite Organization:**
```js
import { describe, it, expect } from "vitest";
import { scoreSocRound } from "./scoreSoc.js";

describe("scoreSocRound", () => {
  it("perfect score is 23", () => {
    const result = scoreSocRound({...});
    expect(result.breakdown.primary).toBe(5);
    expect(result.total).toBe(23);
    expect(result.grade).toBe("Strong");
  });
  // ... more cases
});
```

**Patterns:**
- `describe` per function being tested
- `it` per behavior/boundary case
- Multiple `expect` assertions per test
- No nested `describe` blocks
- No `beforeEach` / `afterEach` — tests fully self-contained

## Fixtures and Factories

**Helper functions defined in test files** (not shared):

```js
// scoreSoc.test.js
function makeSpl(requiredHits, requiredTotal, optionalHits, optionalTotal, blockedHits = 0) {
  return {
    required: { hits: Array(requiredHits).fill("x"), misses: Array(requiredTotal - requiredHits).fill("x") },
    optional: { hits: Array(optionalHits).fill("x"), misses: Array(optionalTotal - optionalHits).fill("x") },
    blocked: { hits: Array(blockedHits).fill("x") },
  };
}

function makeExp(requiredHits, requiredTotal, optionalHits, optionalTotal) {
  return { ...similar... };
}
```

**No shared fixture files** — all test data constructed inline.

## Mocking

**Framework:** None used. No `vi.mock()`, `vi.spy()`, or manual mocks in the codebase.

**What would need mocking:**
- `fetch()` calls (leaderboard submission, Google Sheets)
- `sessionStorage` (Soc final submission)
- `window.location` (ErrorBoundary reload)
- `requestAnimationFrame` / `cancelAnimationFrame` (confetti canvas)
- React component rendering (no component tests exist)

**Current approach:** Pure functions tested in isolation — no mocks needed for existing tests.

## Coverage

**Requirements:** Not configured — no `coverage` block in `vitest.config.js`.

**View coverage:**
```bash
npx vitest --coverage   # fails — no coverage provider installed
```

## CI Integration

**CI pipeline** (`.github/workflows/deploy.yml`) does NOT run tests. Pipeline steps:
1. `npm ci`
2. `npm run build`
3. Upload to GitHub Pages

Tests must be run manually. No test gate in CI.

## Test Types — Current State

**Unit Tests:** 2 files (utilities only).
**Integration Tests:** 0.
**E2E Tests:** 0 (Playwright is a devDependency — `"playwright": "^1.59.1"` — but no test files found).

## Common Patterns

**Assertion style:**
```js
// Exact equality
expect(result.breakdown.primary).toBe(5);

// Array length
expect(result.required.hits).toHaveLength(3);
expect(result.required.misses).toHaveLength(0);

// Contains
expect(result.required.misses).toContain("subject");

// Comparison
expect(result.total).toBeGreaterThanOrEqual(10);
expect(result.total).toBeLessThan(15);

// Specific element access
expect(result.blocked.hits[0]).toBe("delete");
```

**No use of:** `toMatchSnapshot`, `toThrowError`, `toMatchObject`, `rejects`, `resolves` in existing tests.

## Gaps & Recommendations

| Gap | Impact | Fix |
|-----|--------|-----|
| No component testing | UI regressions undetected | Add `@testing-library/react` + `jsdom` environment |
| No hook testing | State logic (scoring, badges, badges) untested | Add `renderHook` from `@testing-library/react` |
| No async testing | Submission/fetch errors undetected | Add tests with `vi.mock('fetch')` |
| No CI test gate | Broken code can deploy | Add `npm test` to deploy workflow |
| No coverage target | Untested code invisible | Add `coverage` config with 70%+ threshold |
| No E2E tests | Full flows (game playthrough) untested | Use Playwright (already installed) |
| Only `src/utils/` tested | 28 source files total, 2 tested | Expand coverage to hooks and components |

---

*Testing analysis: 2026-05-25*
