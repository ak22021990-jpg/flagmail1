---
phase: 02-code-review
reviewed: 2026-05-22T12:00:00Z
depth: standard
files_reviewed: 26
files_reviewed_list:
  - src/App.jsx
  - src/main.jsx
  - src/config.js
  - src/config/game.js
  - src/components/BadgeCollection.jsx
  - src/components/BadgeToast.jsx
  - src/components/Classifier.jsx
  - src/components/ClueSystem.jsx
  - src/components/CompetencySummary.jsx
  - src/components/EmailCard.jsx
  - src/components/EmailHeaderPanel.jsx
  - src/components/ExplanationCard.jsx
  - src/components/GameRound.jsx
  - src/components/LandingScreen.jsx
  - src/components/Leaderboard.jsx
  - src/components/RankCard.jsx
  - src/components/ReasoningModal.jsx
  - src/components/ResultsScreen.jsx
  - src/components/ReviewerScreen.jsx
  - src/components/SocExplanationCard.jsx
  - src/components/SocIntroCard.jsx
  - src/components/SocRound.jsx
  - src/components/TimerBar.jsx
  - src/components/TutorialScreen.jsx
  - src/components/ZoneComplete.jsx
  - src/components/ZoneIntroCard.jsx
  - src/hooks/useGameState.js
  - src/hooks/useSocState.js
  - src/hooks/useTimer.js
  - src/hooks/useScoring.js
  - src/hooks/useBadges.js
  - src/hooks/useLeaderboard.js
  - src/data/emails.js
  - src/data/socQuestions.js
  - src/utils/shuffle.js
  - src/utils/competency.js
  - src/utils/scoreSoc.js
  - src/utils/validateSpl.js
  - src/styles/tokens.js
findings:
  critical: 5
  warning: 12
  info: 4
  total: 21
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-05-22T12:00:00Z
**Depth:** standard
**Files Reviewed:** 26
**Status:** issues_found

## Summary

React + Vite phishing education game. Solid architecture with custom hooks for state management. Two major scoring bugs in SOC assessment mode (question config dead code, wrong max score display). No Error Boundaries anywhere — any render crash kills entire app. Multiple GSAP animation cleanup gaps cause memory leaks. Badge timing logic off-by-1 from descriptions. Style duplication across 10+ components instead of importing shared tokens.

---

## Critical Issues

### CR-01: SOC scoring formula ignores per-question configuration (QUESTION_SCORE_MAP dead code)

**Files:**
- `src/utils/scoreSoc.js:1-35`
- `src/hooks/useSocState.js:7-14`

**Issue:** `QUESTION_SCORE_MAP` in `useSocState.js` defines per-question max scores (Q5a: `spl: 2, explanation: 0`; Q5b: `primary: 0, secondary: 0`). But `scoreSocRound()` in `scoreSoc.js` **never reads** this map. It hardcodes the same formula for every question: primary=5, secondary=3, spl=up to 10, explanation=up to 5.

This means:
- Q5a SPL query gets scored up to 10 points instead of 2 — max inflated by 8 points
- Q5a explanation gets scored up to 5 points instead of 0 — max inflated by 5 points
- Q5b classification gets correctly ignored (classification: null → `classifyCorrect` is falsy) but only by accident, not by config

`QUESTION_SCORE_MAP` is dead configuration — defined at line 7-14 but never referenced anywhere in the codebase.

**Fix:** Either pass `QUESTION_SCORE_MAP` to `scoreSocRound()` and use it to scale scores per question, or remove `QUESTION_SCORE_MAP` if the uniform formula is intentional. Currently both exist and are contradictory.

```js
// scoreSoc.js — accept question config
export function scoreSocRound({ primaryCorrect, secondaryRatio, splValidation, explanationValidation, config }) {
  const primaryScore = primaryCorrect ? (config?.primary ?? 5) : 0;
  const secondaryScore = secondaryRatio * (config?.secondary ?? 3);
  // splScore, explanationScore similarly capped by config
}
```

### CR-02: SocIntroCard "Max points: 20" display is wrong (actual max is 112)

**File:** `src/components/SocIntroCard.jsx:87`

**Issue:** Stat card shows `{ label: "Max points", value: "20", helper: "SOC zone" }`. But max score across all 6 SOC questions:
- Q1-Q4: 23 pts each × 4 = 92
- Q5a: 10 pts (5+3+2+0)
- Q5b: 10 pts (0+0+10+0)
- **Total: 112 points**

Value "20" is an arbitrary wrong number. Misleads users about max possible SOC score.

**Fix:** Calculate dynamically or show per-question max (23 pts as in SocExplanationCard line 96).

```js
{ label: "Max per question", value: "23", helper: "SOC zone" }
```

### CR-03: No Error Boundaries — any render crash kills entire app

**Files:**
- `src/main.jsx:1-10`
- `src/App.jsx:21-211`

**Issue:** `main.jsx` wraps `<App>` only in `<StrictMode>`. `App.jsx` mounts 10+ screen components conditionally with zero error boundaries. Any exception during render (null prop access, undefined state, incorrect import) produces a white screen. Given complex state in `useGameState`, `useSocState`, and `useScoring` — with computed values like `currentEmail = emailPool[currentIndex]` — null/undefined access is a real risk.

**Fix:** Add at minimum one Error Boundary wrapping the screen-switch region in App, plus per-zone boundaries for GameRound/ExplanationCard.

```jsx
// Add ErrorBoundary class component (or react-error-boundary package)
// Wrap screen renders:
<ErrorBoundary fallback={<div>Something went wrong. Please refresh.</div>}>
  {gs.screen === SCREENS.ROUND && ...}
</ErrorBoundary>
```

### CR-04: GSAP animations leak on unmount (no cleanup killed)

**Files:**
- `src/components/GameRound.jsx:67-97`
- `src/components/ExplanationCard.jsx:5-51` (runConfetti)

**Issue:** In `GameRound.jsx`, the `useEffect` on lines 67-97 creates GSAP tweens via `gsap.fromTo()` but never calls `gsap.killTweensOf()` in the effect cleanup. If the component unmounts during animation (user navigates away, timer expires), GSAP continues trying to update `scoreDisplayRef.current` which is now a detached DOM node. Can cause console warnings and memory leaks on rapid zone transitions.

Same pattern in `ExplanationCard.jsx` `runConfetti()` — `cancelAnimationFrame` is returned but only if `raf` was set, and GSAP tweens have no kill path.

**Fix:**

```js
// GameRound.jsx — add cleanup
useEffect(() => {
  // ... existing animation code ...
  return () => {
    gsap.killTweensOf(scoreProxy);
    gsap.killTweensOf(scoreDisplayRef.current);
  };
}, [meta.accent, totalScore]);
```

### CR-05: `submitToSheet` and leaderboard POSTs mix `no-cors` modes inconsistently

**Files:**
- `src/hooks/useGameState.js:142-153`
- `src/hooks/useLeaderboard.js:10-21`

**Issue:** `submitToSheet` in `useGameState.js` uses `mode: 'no-cors'` (line 148), which means the response is opaque and `res.json()` would fail if called. But the function uses `await fetch(...)` without checking the result. `submitScore` in `useLeaderboard.js` does NOT use `mode: 'no-cors'`. If the Google Apps Script endpoint requires no-cors (which is common for Web Apps deployed without CORS), the leaderboard POST will fail with a CORS error, silently caught at line 19.

**Fix:** Make consistent across both functions. If the endpoint needs `no-cors`, both must use it. If it supports CORS, remove `no-cors` from `submitToSheet`.

```js
// Either both use no-cors or neither does
await fetch(LEADERBOARD_URL, {
  method: 'POST',
  body: JSON.stringify(playerData),
  mode: 'no-cors',  // consistent
});
```

---

## Warnings

### WR-01: Sniper/Lightning Read badge timing off by 1s from description

**File:** `src/hooks/useBadges.js:56,62`

**Issue:** `SNIPER` description says "under 15s" but logic checks `timeLeft >= roundDuration - SNIPER_SECONDS` which is `>= 105` = "≤ 15s elapsed". A submission at exactly 15.0s qualifies. `LIGHTNING_READ` description says "under 10 seconds" but logic allows exactly 10s.

**Fix:** Match description. For "under 15s" use `>` instead of `>=`:
```js
if (l1Correct && l2Correct && cluesUsed === 0 && timeLeft > roundDuration - SNIPER_SECONDS) {
```

### WR-02: Large component files reduce maintainability

**Files (line counts):**
- `src/components/ZoneIntroCard.jsx` — 772 lines
- `src/components/LandingScreen.jsx` — 621 lines
- `src/components/ExplanationCard.jsx` — 569 lines
- `src/components/GameRound.jsx` — 547 lines
- `src/components/Classifier.jsx` — 447 lines
- `src/components/BadgeToast.jsx` — 415 lines
- `src/components/ZoneComplete.jsx` — 399 lines

**Issue:** These files mix layout markup, inline styles, state logic, and sub-components in single monolithic files. Functions like `formatClock`, `runConfetti`, `CategoryBreakdown`, `HelpTooltip` are defined as inner functions and cannot be tested or reused independently. Components >400 lines are hard to review, test, and refactor.

**Fix:** Extract sub-components to separate files. Extract inline style objects to `tokens.js` (duplicated across 10+ files). Split ZoneIntroCard into at least 3-4 smaller components.

### WR-03: Style objects duplicated across 10+ components instead of importing from tokens.js

**Files:** `ZoneIntroCard.jsx`, `SocIntroCard.jsx`, `LandingScreen.jsx`, `TutorialScreen.jsx`, `GameRound.jsx`, `ResultsScreen.jsx`, `ExplanationCard.jsx`, `SocExplanationCard.jsx`, `ZoneComplete.jsx`, `Leaderboard.jsx`, `ReviewerScreen.jsx`

**Issue:** Each file defines its own `glass` or `surface` object with identical CSS values. `tokens.js` exports a canonical `glass` but only `ResultsScreen.jsx` imports it. The rest duplicate the exact same 5-6 lines. Any visual change to glass surfaces requires editing 10+ files.

**Fix:** Import `{ glass }` from `../styles/tokens.js` in every component. Only override where different.

### WR-04: Reviewer passcode sent as GET query parameter

**File:** `src/components/ReviewerScreen.jsx:25`

**Issue:** Passcode sent as URL query parameter: `LEADERBOARD_URL + "?action=getSOCSubmissions&passcode=" + encodeURIComponent(passcode)`. Passcode appears in server access logs, browser history, and referrer headers. Low risk (admin tool), but avoidable.

**Fix:** Send passcode in POST body instead of GET query:
```js
const res = await fetch(LEADERBOARD_URL, {
  method: 'POST',
  body: JSON.stringify({ action: 'getSOCSubmissions', passcode }),
});
```

### WR-05: SOC submissions sent as N sequential POST requests instead of batched

**File:** `src/hooks/useSocState.js:184-201`

**Issue:** `submitSocToSheets` sends one fetch per SOC answer in a serial loop:
```js
for (const a of answers) {
  if (!a.submitted || !a.result) continue;
  await fetch(LEADERBOARD_URL, { ... });
}
```
If the network degrades mid-batch, some answers submit and others don't. No retry logic, no partial-failure handling. 6 sequential fetches for 6 questions.

**Fix:** Batch all answers into one request:
```js
await fetch(LEADERBOARD_URL, {
  method: 'POST',
  body: JSON.stringify({ action: 'submitSOCBatch', name, email, answers: allResults }),
  mode: 'no-cors',
});
```

### WR-06: `canSubmit` can throw on null/undefined splText/explanation

**File:** `src/components/SocRound.jsx:22`

**Issue:** `const canSubmit = !!answer.splText.trim() && !!answer.explanation.trim() && !answer.submitted;` — if `answer.splText` or `answer.explanation` is ever null/undefined (not initialized as empty string), `.trim()` throws TypeError. Currently safe because `initialAnswers()` initializes as `""`, but fragile.

**Fix:** Optional chaining: `answer.splText?.trim()`

### WR-07: No PropTypes or TypeScript — all prop types unchecked

**Files:** All `.jsx` files (26 reviewed)

**Issue:** Zero type checking. Components like `ResultsScreen` receive 6+ props where several are optional with defaults (`finalScore = 0`), but many components have no defaults at all. `GameRound` receives 12+ props with no validation. Missing required prop produces silent `undefined` access and runtime error.

**Fix:** Add PropTypes or migrate to TypeScript incrementally. At minimum, add PropTypes to the 5 most complex components (GameRound, ExplanationCard, SocRound, ResultsScreen, LandingScreen).

### WR-08: Leaderboard `useEffect` depends on `onFetch` — stable by accident

**File:** `src/components/Leaderboard.jsx:19-21`

**Issue:** `useEffect(() => { onFetch(); }, [onFetch]);` depends on `onFetch` identity. `onFetch` is `fetchLeaderboard` from `useLeaderboard`, which is wrapped in `useCallback([])` — stable because of empty deps. If deps were ever added to `fetchLeaderboard`, this effect would fire on every render, creating infinite loop risk.

**Fix:** Use a boolean `fetched` ref to guard against double-fetch, or call `fetchLeaderboard` directly without passing through props.

### WR-09: Email body rendering uses no input sanitization — low risk with static data

**File:** `src/components/EmailCard.jsx:26-49`

**Issue:** `renderBody` uses `body.slice()` and wraps text in `<mark>` elements. Currently safe because email body comes from static `emails.js` array. But pattern is fragile — if email body ever includes user-generated content or dynamic markdown, XSS risk exists. No `dangerouslySetInnerHTML` used, so actual XSS is not possible in current form. Flagging as pattern concern.

**Fix:** No change needed now. Document that email bodies must remain static.

### WR-10: ARIA accessibility gaps across screen-reader-revealing components

**Files:** Multiple components

**Issue:** TimerBar has no `aria-live` announcement — screen readers don't announce countdown changes. BadgeToast uses `AnimatePresence` but no `role="alert"` or `aria-live="polite"` on the toast content. ZoneComplete status changes have no ARIA. ResultsScreen score updates have no announcement.

**Fix:** Add `aria-live="polite"` to dynamic score/timer displays. Add `role="alert"` to toast notifications.

### WR-11: TimerBar.jsx contains dead code spread

**File:** `src/components/TimerBar.jsx:19`

**Issue:** Line 19: `...(phase === 'red' ? {} : {})` — Always spreads empty object. No-op. Dead code.

**Fix:** Remove line.

### WR-12: useBadges badges reset function never called on game restart

**File:** `src/hooks/useBadges.js:104-111`

**Issue:** `resetBadges` exists but is never called from `App.jsx` when game restarts. If a user completes the game and starts again (e.g., via reviewer → back to landing → new session), badges from previous session persist. The `earnedSetRef` ref prevents re-earning (line 30-31), so badges won't show again, but the `pendingToast` could re-trigger from stale refs.

**Fix:** Call `resetBadges()` in the game-start flow alongside `gs.startGame()`.

---

## Info

### IN-01: `QUESTION_SCORE_MAP` in useSocState.js is entirely dead code

**File:** `src/hooks/useSocState.js:7-14`

**Issue:** Defined but never referenced. All SOC scoring goes through `scoreSocRound()` in `scoreSoc.js` which hardcodes its own formula.

**Fix:** Either wire it into scoring (preferred) or remove it.

### IN-02: `consecutivePerfect` state setter calls `setEarlyUnlocked` inside a state updater function

**File:** `src/hooks/useGameState.js:102-106`

**Issue:** Inside `setConsecutivePerfect(cp => { ... setEarlyUnlocked(true); ... })`. Calling one state setter inside another's updater function works but violates the "functional update should be pure" React principle. The `setEarlyUnlocked` call is a side effect inside a state updater.

**Fix:** Extract to a separate `useEffect`:
```js
useEffect(() => {
  if (consecutivePerfect >= 3) setEarlyUnlocked(true);
}, [consecutivePerfect]);
```

### IN-03: `ZoneIntroCard.jsx` contains a `borderTop: item.zone === 1 ? 'none'` check that is always true for index 0

**File:** `src/components/ZoneIntroCard.jsx:637`

**Issue:** `ZONES` array has zone=1 at index 0, so `item.zone === 1` is always true for the first item. Works correctly — first item doesn't get a top border. Not a bug but fragile — depends on ordering.

**Fix:** Use index-based check: `index === 0 ? 'none' : '1px solid rgba(13,26,51,0.06)'`

### IN-04: `BadgeToast.jsx` redefines `runConfetti` identical to `ExplanationCard.jsx`

**Files:**
- `src/components/BadgeToast.jsx:23-66`
- `src/components/ExplanationCard.jsx:5-51`

**Issue:** Two identical canvas-confetti functions with slightly different parameters (120 pieces vs 200, different colors). ~80 lines of duplicated canvas rendering logic.

**Fix:** Extract shared confetti utility to `src/utils/confetti.js`.

---

## Overall Assessment

**Quality:** Moderate. Architecture is sound (hooks-driven, separated concerns), but execution has scoring bugs in the SOC assessment module and missing error boundaries that could cause total app failure. The two critical SOC scoring issues (CR-01, CR-02) must be resolved before production use — they directly affect assessment validity.

**Pattern strengths:** Custom hooks well-isolated (useGameState, useSocState, useScoring). Screen-routing via state machine is clean. Animated transitions via Framer Motion are consistent.

**Pattern weaknesses:** Massive single-file components, 10+ copies of identical style objects, no type checking, no Error Boundaries, unkilled GSAP tweens, dead configuration code, ARIA gaps.

**Recommended actions before ship:**
1. Fix SOC scoring — wire QUESTION_SCORE_MAP or remove it (CR-01)
2. Fix "Max points: 20" display (CR-02)
3. Add Error Boundary wrapping App content (CR-03)
4. Kill GSAP tweens on unmount (CR-04)
5. Extract shared styles to tokens.js (WR-03)
6. Batch SOC submission (WR-05)

---

_Reviewed: 2026-05-22T12:00:00Z_
_Reviewer: gsd-code-reviewer_
_Depth: standard_
