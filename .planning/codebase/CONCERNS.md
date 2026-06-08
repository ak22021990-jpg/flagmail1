# Codebase Concerns

**Analysis Date:** 2026-06-08

## Tech Debt

### Three Animation Libraries in Use

**Issue:** App bundles `framer-motion` (11.x), `gsap` (3.x), AND `animejs` (3.x) — three competing animation libraries.

**Files:** `package.json`

**Impact:** ~180KB+ unnecessary bundle weight. `framer-motion` used for most UI transitions. `gsap` imported in `GameRound.jsx` for a single timeline animation. `animejs` declared as dependency but usage not confirmed in source.

**Fix approach:** Consolidate on `framer-motion`. Remove `gsap` and `animejs`, replace 1-2 call sites with framer-motion or CSS animations.

### GSAP Tween Memory Leak

**Issue:** GSAP timeline created in `GameRound.jsx` has no cleanup on unmount.

**Files:** `src/components/GameRound.jsx`

**Impact:** Timeline and associated DOM references may linger after component unmounts. Low impact in practice (SPA with single mount), but a code smell.

**Fix approach:** Return cleanup from `useEffect` that calls `tween.kill()`.

### Duplicated Glass Style Objects Across Components

**Issue:** Every screen/component re-declares a local variant of the `glass` style object from `src/styles/tokens.js` with slightly different blur/transparency values.

**Files:** `GameRound.jsx:18`, `ZoneIntroCard.jsx:9`, `ReviewerScreen.jsx:8`, `LandingScreen.jsx:10`, `ExplanationCard.jsx`

**Impact:** Style drift across components. Changing canonical glass requires hunting every file.

**Fix approach:** Add named style variants to `src/styles/tokens.js` (e.g., `glassStrong`, `glassLight`) and import them everywhere.

### `verdictBand` Function Duplicated in Multiple Files

**Issue:** Grade/verdict band logic (`"Strong"`, `"Good"`, `"Needs Work"`) is duplicated across `scoreSoc.js`, `SocExplanationCard.jsx`, and `SocResultsScreen.jsx` instead of being a shared utility.

**Impact:** If thresholds change, must update 3+ locations. Risk of divergence.

**Fix approach:** Extract to `src/utils/gradeBand.js`, import everywhere.

### `SCORE_MAXES` Duplicated Between Files

**Issue:** Score maximum constants duplicated between `SocExplanationCard.jsx` and `useSocState.js`.

**Impact:** If max scores change, both files must be updated in sync.

**Fix approach:** Centralise in `src/config/game.js` or `src/utils/scoreSoc.js`.

### `QUESTION_SCORE_MAP` Dead Code / Wrong Values

**Issue:** `QUESTION_SCORE_MAP` exists but SOC scoring uses hardcoded per-question maxes that don't match the map values.

**Files:** `src/hooks/useSocState.js`

**Impact:** Dead code creates confusion. Scoring is inconsistent with documented per-question weights.

**Fix approach:** Either remove the map and document actual per-question maxes inline, or fix the map and use it consistently.

### Inline Styles Instead of CSS Modules

**Issue:** Entire UI styled through inline `style={}` objects in JSX. No CSS modules.

**Files:** All components in `src/components/`

**Impact:** No media query support in inline styles (workaround: embedded `<style>` tags in `LandingScreen.jsx`, `ZoneIntroCard.jsx`). Runtime memory overhead. Poor maintainability.

### Hardcoded Zone/Email Content in Component Files

**Issue:** `ZoneIntroCard.jsx` (~678 lines) embeds the entire ZONES data array directly in the component file.

**Fix approach:** Extract zone metadata to `src/data/zones.js`.

### Deprecated `ReviewerScreen.jsx` Not Removed

**Issue:** Old `ReviewerScreen.jsx` exists alongside the replacement. May cause confusion about which is active.

**Impact:** Dead code in bundle. Confusing for contributors.

### Variable Name Abbreviation in App.jsx

**Issue:** Core state hooks use single-letter/abbreviated names: `gs` (gameState), `sc` (scoring), `soc` (socState).

**Files:** `src/App.jsx:26-29`

**Fix approach:** Rename to `gameState`, `scoring`, `socState`.

## Security Considerations

### Hardcoded Google Sheet ID Committed to Git

**Risk:** `SPREADSHEET_ID` hardcoded in `google-apps-script.js:21`.

**Recommendations:** Load via `PropertiesService.getScriptProperties()`.

### Hardcoded Reviewer Email Addresses in GAS

**Risk:** Four personal email addresses hardcoded in `google-apps-script.js:230-234`.

**Recommendations:** Store recipient list in `PropertiesService.getScriptProperties()` or a config sheet tab.

### Passcode Sent as GET Query Parameter

**Risk:** Reviewer passcode sent as URL query param in `ReviewerScreen.jsx:25`. Logged in browser history, network logs, GAS access logs.

**Recommendations:** Change to POST with passcode in request body.

### No Server-Side Authentication on GAS Web App

**Risk:** Anyone with the deployed GAS URL can submit scores, check email existence, or attempt the reviewer passcode.

**Current mitigation:** Reviewer endpoint requires passcode (cleartext). Score submission endpoints open by design.

**Recommendations:** Add IP rate limiting. Validate action payload shapes server-side.

### localStorage-Based Attempt Blocking is Trivial to Bypass

**Risk:** `localStorage.setItem(ATTEMPT_KEY, 'true')` trivially cleared by candidate.

**Current mitigation:** Server-side email dedup check via `checkEmail` provides second layer.

## Known Bugs

### `SocIntroCard` Shows Wrong Max Points

**Symptoms:** UI displays "Max points: 20" but actual SOC max is 92 (or 18 depending on scaling — not 20).

**Files:** `src/components/SocIntroCard.jsx` or equivalent intro card

**Impact:** Misleads candidates about scoring weight.

### `AnswerSheet` SPL Highlight Only Uses First Task Rules

**Symptoms:** For multi-task SOC questions, SPL keyword highlighting in the answer sheet silently only applies the first task's validation rules.

**Files:** `src/components/AnswerSheet.jsx` or `SocExplanationCard.jsx`

**Impact:** Incorrect keyword highlighting for questions with multiple SPL tasks.

### `canSubmit` Null Guard Fragility

**Issue:** `canSubmit` logic has brittle null guards that could silently allow submission when state is partially initialised.

**Files:** `src/hooks/useSocState.js`

### Silent Email Check Failure Allows Bypass

**Files:** `src/components/LandingScreen.jsx:61-63`

```javascript
catch {
    // If check fails, allow the user to proceed
}
```

**Trigger:** Any network failure during email check.

### Silent Failure on Score Submission

**Symptoms:** Score submission uses `mode: 'no-cors'` and `catch (_) {}` — frontend never knows if score was saved.

**Files:** `src/hooks/useGameState.js`, `src/hooks/useLeaderboard.js`, `src/hooks/useSocState.js`

**Impact:** Undetected data loss.

### `useScoring.resetScoring` Never Called on Restart

**Issue:** If a restart path exists, `resetScoring` is not called, leaving stale scoring state.

**Files:** `src/hooks/useScoring.js`

### `useBadges.earnedSetRef` Not Cleared on Reset

**Issue:** `earnedSetRef` tracks which badges have been shown. Not cleared on game reset, so re-plays may not show badge toasts.

**Files:** `src/hooks/useBadges.js`

### Missing Explanation Field in SOC Round

**Issue:** Spec says candidates must write an explanation for their SPL query, but no textarea for explanation exists in `SocRound`. The explanation column is always empty in submissions.

**Files:** `src/components/SocRound.jsx` (or equivalent)

**Impact:** Core SOC feature (explanation scoring) effectively non-functional.

## Performance Bottlenecks

### Lottie Animation JSON Bundle Bloat

**Files:** `src/components/BadgeToast.jsx:7-16` — 10 static Lottie JSON imports.

**Impact:** ~200-400KB added to initial JS bundle. Animations only needed on rare badge-unlock events.

**Fix:** Lazy-load Lottie assets with dynamic `import()`.

### Huge Data Files Bundled Entirely

**Files:** `src/data/emails.js` (742 lines), `src/data/socQuestions.js` (356 lines)

**Impact:** All data loaded upfront even though only 5 emails per zone are used per game.

### `no-cors` Inconsistency Across Fetch Calls

**Issue:** Some fetch calls use `mode: 'no-cors'`, others don't. Inconsistent handling means some failures are detected, others are silently swallowed.

**Files:** `src/hooks/useGameState.js`, `src/hooks/useLeaderboard.js`, `src/hooks/useSocState.js`

## Fragile Areas

### `ZoneIntroCard.jsx` — ~678 Lines, Hard to Modify

**Why fragile:** Largest component in the app. Embeds zone data, mission copy, signal lists, difficulty info, stats, and full layout. Inline `<style>` tags for responsive breakpoints embedded in JSX.

### `GameRound.jsx` — ~452 Lines, Orchestration Hub

**Why fragile:** Orchestrates timer, proctoring, email display, clues, classifier, score display. Multiple timers and state interactions. Directly calls GSAP animation.

### Google Apps Script Backend — No Testing, No Versioning

**Files:** `google-apps-script.js` (365 lines)

**Why fragile:** Cannot be unit-tested (GAS runtime). Single monolithic file. Hardcoded IDs and emails. String-based action routing with no schema validation.

### Scoring Logic — Multiple Layers, No Integration Test

**Files:** `src/utils/scoreSoc.js`, `src/utils/validateSpl.js`, `src/hooks/useScoring.js`, `src/hooks/useSocState.js`

**Why fragile:** Scoring spans 4 files. `useSocState.submitSocRound()` manually computes correctness, SPL validation, explanation validation, then calls `scoreSocRound()`. Complex ratio-based thresholds.

## Test Coverage Gaps

### Source Files Without Tests

| File | Lines | Risk |
|------|-------|------|
| `src/hooks/useGameState.js` | ~182 | Core game orchestration |
| `src/hooks/useScoring.js` | ~96 | Points calculation |
| `src/hooks/useSocState.js` | ~204 | SOC scoring pipeline |
| `src/hooks/useProctoring.js` | ~73 | Integrity detection |
| `src/hooks/useBadges.js` | ~122 | Badge unlock logic |
| `src/hooks/useLeaderboard.js` | ~43 | API interaction |
| `src/hooks/useTimer.js` | ~49 | Countdown logic |
| `src/hooks/useAdmin.js` | unknown | Admin data access |
| `src/utils/competency.js` | ~50 | Summary generation |
| `src/utils/confetti.js` | ~70 | Canvas rendering |
| `src/utils/shuffle.js` | ~32 | Email shuffling |
| `src/utils/exportCsv.js` | unknown | CSV export (new) |
| `src/utils/scaleSocScore` | — | Score scaling logic |
| `src/components/*` (~30 files) | ~7000 total | All UI components |

**Total unit test files: 2 out of ~40+ source files.**

## Missing Critical Features

### Offline Data Resilience

**Problem:** If network drops during assessment, all score data is lost. No IndexedDB/localStorage queue for submissions.

### Proctoring is Informational Only

**Problem:** `useProctoring.js` counts tab switches but cannot prevent cheating. Violations logged to sheet but assessment not auto-terminated.

---

*Concerns audit: 2026-06-08*
