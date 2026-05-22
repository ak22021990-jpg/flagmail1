---
phase: 02-code-review
reviewed: 2026-05-22T12:00:00Z
depth: standard
files_reviewed: 16
files_reviewed_list:
  - src/hooks/useBadges.js
  - src/hooks/useGameState.js
  - src/hooks/useLeaderboard.js
  - src/hooks/useScoring.js
  - src/hooks/useSocState.js
  - src/hooks/useTimer.js
  - src/data/emails.js
  - src/data/socQuestions.js
  - src/utils/competency.js
  - src/utils/scoreSoc.js
  - src/utils/shuffle.js
  - src/utils/validateSpl.js
  - src/styles/tokens.js
  - src/styles/animations.css
  - src/index.css
  - google-apps-script.js
findings:
  critical: 5
  warning: 5
  info: 2
  total: 12
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-05-22T12:00:00Z
**Depth:** standard
**Files Reviewed:** 16
**Status:** issues_found

## Summary

Reviewed 16 source files for phishing education game (React + Vite frontend, Google Apps Script backend). Found 5 critical bugs, 5 warnings, 2 info items.

Critical issues: leaderboard POST broken cross-origin, EAGLE_EYE badge unobtainable (missing dataset category), SOC scoring ignores per-question weight map (Q5a over-scored), GAS sheet injection vulnerability on `register`/`submit` handlers, leaderboard GET endpoint nonexistent.

Frontend hooks generally well-structured with proper useCallback/useRef patterns. GAS backend has formula injection exposure and data duplication in SOC submission handling.

---

## Critical Issues

### CR-01: useLeaderboard.submitScore Lacks `no-cors` Mode — Fails Cross-Origin

**File:** `src/hooks/useLeaderboard.js:13`
**Issue:** `submitScore` (line 13) uses default fetch mode (cors), while `useGameState.submitToSheet` (line 148) and `useSocState.submitSocToSheets` (line 199) correctly use `mode: 'no-cors'`. Google Apps Script web apps do NOT return CORS headers — cross-origin POST fails silently. The `catch` block at line 19 only logs the error; `setSubmitted(true)` never runs. Users never see their score as submitted.

**Fix:** Add `mode: 'no-cors'` to fetch options:

```js
await fetch(LEADERBOARD_URL, {
  method: 'POST',
  body: JSON.stringify(playerData),
  mode: 'no-cors',
});
```

### CR-02: EAGLE_EYE Badge Unobtainable — Zero "Abuse & Harassment" Emails in Dataset

**File:** `src/data/emails.js:1-617`
**Issue:** `useBadges.js` EAGLE_EYE badge (line 14) requires identifying all 6 L1 categories correctly at least once. The email dataset contains zero emails classified as "Abuse & Harassment" — only 5 of 6 categories exist. `categoriesCorrect.current.size` can never reach 6. Badge impossible to earn.

Category distribution across all 15 emails:
- Legitimate: 6 emails (E003, E031, E032, E046, E047, E048)
- Phishing & Spoofing: 6 emails (E001, E017, E026, E029, E050, E049)
- Spam & Junk: 1 email (E004)
- Malicious Content: 1 email (E040)
- Abuse & Harassment: **0 emails**
- High-Risk Fraud: 1 email (E015)

**Fix:** Add ≥1 email with `level1: "Abuse & Harassment"` and valid `level2`, clues, explanation, and reasoning fields. Remove category from tracking or badge criteria if intentionally excluded.

### CR-03: scoreSocRound Ignores QUESTION_SCORE_MAP — Q5a Over-Scored

**File:** `src/utils/scoreSoc.js:1-35`
**Issue:** `scoreSocRound` hardcodes max weights (primary=5, secondary=3, spl=10, explanation=5) regardless of question. `QUESTION_SCORE_MAP` defines per-question weights:
- Q5a: primary=5, secondary=3, **spl=2**, **explanation=0**
- Q5b: primary=0, secondary=0, spl=10, explanation=0

Function always assigns up to 10 SPL points and 5 explanation points. Q5a gets up to 10 SPL points (should be 2), up to 5 explanation points (should be 0). Score inflation causes misleading grades.

**Fix:** Accept a `scoreMap` parameter and use per-question caps:

```js
export function scoreSocRound({ primaryCorrect, secondaryRatio, splValidation, explanationValidation, scoreMap }) {
  const maxPrimary = scoreMap?.primary ?? 5;
  const maxSecondary = scoreMap?.secondary ?? 3;
  const maxSpl = scoreMap?.spl ?? 10;
  const maxExplanation = scoreMap?.explanation ?? 5;

  const primaryScore = primaryCorrect ? maxPrimary : 0;
  const secondaryScore = secondaryRatio * maxSecondary;
  const splScore = Math.max(0, requiredRatio * (maxSpl * 0.7) + optionalRatio * (maxSpl * 0.3) - blockedPenalty);
  const explanationScore = Math.min(maxExplanation, expRequiredRatio * (maxExplanation * 0.6) + expOptionalRatio * (maxExplanation * 0.4));
  ...
}
```

### CR-04: GAS `register`/`submit` Handlers No Formula Injection Sanitization

**File:** `google-apps-script.js:63-66, 74-78, 90-96`
**Issue:** `sanitiseCell` (line 207) prevents Google Sheets formula injection for `submitSOC` handler but is NOT called in `register` (lines 63-66) or `submit` (lines 74-78, 90-96) handlers. String fields like `payload.name`, `payload.email`, `r.selectedL1`, `r.selectedL2` can contain formula injection (e.g., `=HYPERLINK(...)`, `=IMPORTXML(...)`). When an admin opens the sheet, formulas execute — potential data exfiltration.

**Fix:** Apply `sanitiseCell` to all user-supplied string values before writing to sheets:

```js
// register handler
sheets.summary.appendRow([
  ts, sanitiseCell(payload.name || ''), sanitiseCell(payload.email || ''),
  'In Progress', '', '', '', '', '', ''
]);

// submit handler per-email data
sheets.raw.appendRow([
  ts, sanitiseCell(payload.name || ''), sanitiseCell(payload.email || ''),
  r.emailId || '', r.zone || '',
  sanitiseCell(r.selectedL1 || ''), sanitiseCell(r.selectedL2 || ''),
  sanitiseCell(r.correctL1 || ''), sanitiseCell(r.correctL2 || ''),
  r.l1Correct === true, r.l2Correct === true,
  r.cluesUsed || 0, r.timedOut === true, r.points || 0,
]);
```

### CR-05: fetchLeaderboard Always Returns Empty — No GET Endpoint Returns Leaderboard Array

**File:** `src/hooks/useLeaderboard.js:23-39`
**File:** `google-apps-script.js:126-189`
**Issue:** `fetchLeaderboard` calls `GET LEADERBOARD_URL`, expects JSON array response (line 32: `setEntries(Array.isArray(data) ? data : [])`). GAS `doGet` has no endpoint that returns an array. Valid GET paths:
- `?checkEmail=...` returns `{ exists: bool }`
- `?action=getSOCSubmissions&passcode=...` returns `{ ok, submissions: [] }`
- Default returns `{ error: 'No action specified' }`

None return an array. `fetchLeaderboard` always sets `entries` to `[]`. Leaderboard display feature is broken end-to-end.

**Fix:** Either add a GET endpoint that returns leaderboard data as array in GAS, or change the frontend to parse the actual response shape.

---

## Warnings

### WR-01: useSocState.submitSocToSheets Empty Catch Swallows Errors

**File:** `src/hooks/useSocState.js:202`
**Issue:** `catch (_) {}` at line 202 silently discards fetch errors. Combined with `mode: 'no-cors'` (line 199), failed submissions are invisible to users and developers. User sees no feedback when SOC data fails to save.

**Fix:** Log error detail or surface to user:

```js
} catch (err) {
  console.warn('SOC submission error:', err);
}
```

### WR-02: useScoring.categoryCorrect Crashes on Unknown L1 Category

**File:** `src/hooks/useScoring.js:65-73`
**Issue:** `const cat = email.level1` uses string key into `categoryCorrect` state object. If `email.level1` is not one of the 6 hardcoded keys (e.g., new email added with misspelled category), `prev[cat]` is `undefined`, and `prev[cat].correct` throws `TypeError: Cannot read properties of undefined`. No defensive guard.

**Fix:** Guard against missing key:

```js
setCategoryCorrect(prev => {
  const cat = email.level1;
  if (!prev[cat]) return prev; // or initialize it
  return {
    ...prev,
    [cat]: {
      correct: prev[cat].correct + (l1Correct ? 1 : 0),
      total: prev[cat].total + 1,
    },
  };
});
```

### WR-03: competency.js formatList Returns Empty String for Zero-Length Array — Syntactically Broken Output

**File:** `src/utils/competency.js:30-33, 36-41`
**Issue:** `formatList` returns `''` for empty array. `strongText` joins `"You have a strong foundation in " + formatList(strong) + ". "`. When `strong.length === 0` but `weak.length > 0`, output becomes `"Focus on..."` (correct). But when `strong.length === 0` AND `weak.length === 0` (all categories have 0.5-0.7 accuracy, no strong/weak), output is `"Keep sharpening..."` (correct too). Edge case: `strong.length === 0` falls to `strongText = ''`, `weakText` branches correctly. Actually this is fine on re-analysis — the `allStrong` and `allWeak` early returns handle the extreme cases, and the else handles mixed. The formatList returning `''` for empty is handled via the conditional checks. **Downgrade to Info.**

Actually, re-reading: the `strongText` condition is `strong.length > 0`, so empty list produces `''`. The `weakText` condition handles empty. The template `strongText + weakText` joins them. No syntax issue. Not a bug.

### WR-04: shuffleEmails Ignores Arguments Passed from startGame

**File:** `src/utils/shuffle.js:23`
**File:** `src/hooks/useGameState.js:56`
**Issue:** `startGame` calls `shuffleEmails({ name, email })` (line 56). But `shuffleEmails()` ignores all arguments (no params defined, line 23). The unused arguments are dead code. Minor — no behavioral impact since shuffle doesn't use player data.

**Fix:** Remove unused arguments at call site:

```js
const pool = shuffleEmails();
```

### WR-05: GAS submitSOC Creates Rows with 12 Empty Cells Per Submission

**File:** `google-apps-script.js:104-112`
**Issue:** Inner loop `for (var j = 0; j < 6; j++)` writes Q1-Q6 score/grade columns for every row, but only fills the one matching current question index. Each SOC submission (potentially 6 questions × N answers) creates rows with mostly empty cells. `splText` and `explanation` duplicated in every row per submission. Data storage is wasteful and hard to query.

**Fix:** Write only the columns that have data. Restructure sheet schema to one-row-per-question with question-specific columns, or use one row per submission with all question data.

---

## Info

### IN-01: useBadges.js — Redundant `earnBadge` Calls in checkAfterZone

**File:** `src/hooks/useBadges.js:86-87`
**Issue:** `ZONE_CLEAR` and `NO_HINTS_NEEDED` can both be earned from a single zone completion (e.g., perfect zone with zero clues). Two separate `earnBadge` calls in sequence. Not a bug (earnBadge deduplicates via `earnedSetRef`), but consider batching for toast UX — only the first badge's toast shows.

### IN-02: Missing `prefers-reduced-motion` Media Query for Accessibility

**File:** `src/styles/animations.css:1-148`
**File:** `src/index.css:1-90`
**Issue:** 24 keyframe animations defined in `animations.css` with zero `prefers-reduced-motion` media query. Users with vestibular motion disorders cannot disable animations. Animations like `shake`, `inboxClear` (translateY -120vh), and `burstRing` may trigger discomfort.

**Fix:**

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Overall Assessment

Frontend hooks well-structured: stable refs (`useRef`), proper callback memoization (`useCallback`), functional state updates, timer cleanup via effect return. Scoring logic sound in design, flawed in data coverage.

**3 blockers must ship with fixes:** CR-02 (empty category), CR-03 (over-scoring), CR-05 (leaderboard dead). CR-01 and CR-04 are runtime failures under cross-origin deployment and data exfiltration risk — fix before public deployment.

GAS backend functional but lacks input sanitization breadth and has data duplication. Sheet schema design needs review for queryability.

_Reviewed: 2026-05-22T12:00:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
