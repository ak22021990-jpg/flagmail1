# Codebase Concerns

**Analysis Date:** 2026-05-25

## Tech Debt

### Three Animation Libraries in Use

**Issue:** App bundles `framer-motion` (11.x), `gsap` (3.x), AND `animejs` (3.x) — three competing animation libraries.

**Files:** `package.json`

**Impact:** ~180KB+ unnecessary bundle weight. `framer-motion` used for most UI transitions (`AnimatePresence`, `motion.div` throughout components). `gsap` imported in `GameRound.jsx` for a single timeline animation. `animejs` declared as dependency but usage not found in source components.

**Fix approach:** Consolidate on `framer-motion` (already dominates usage). Remove `gsap` and `animejs` deps, replace their 1-2 call sites with framer-motion or CSS animations from `src/styles/animations.css`.

### Duplicated Glass Style Objects Across Components

**Issue:** Every screen/component re-declares a local variant of the `glass` style object from `src/styles/tokens.js` with slightly different blur/transparency values:

- `GameRound.jsx:18` — `surface = { ...glass, backdropFilter: 'blur(30px) saturate(165%)' }`
- `ZoneIntroCard.jsx:9` — `localGlass = { ...glass, backdropFilter: 'blur(30px) saturate(165%)' }`
- `ReviewerScreen.jsx:8` — `localGlass = { ...glass, backdropFilter: 'blur(30px) saturate(165%)' }`
- `LandingScreen.jsx:10` — `localGlass = { ...glass, background: 'rgba(255,255,255,0.72)' }`
- `ExplanationCard.jsx` — inline glass overrides

**Impact:** Style drift across components. Changing canonical glass requires hunting every file.

**Fix approach:** Add named style variants to `src/styles/tokens.js` (e.g., `glassStrong`, `glassLight`) and import them everywhere.

### Inline Styles Instead of CSS Modules / CSS-in-JS

**Issue:** Entire UI styled through inline `style={}` objects in JSX. No CSS modules, no styled-components, no CSS variables beyond `index.css`.

**Files:** All components in `src/components/` — all use raw JS style objects.

**Impact:** No media query support in inline styles (workaround: embedded `<style>` tags in `LandingScreen.jsx:102`, `ZoneIntroCard.jsx`). Runtime memory overhead. No SSR/SSG style extraction possible. Poor maintainability.

**Fix approach:** Migrate to CSS modules or a CSS-in-JS solution. Start with high-churn components (LandingScreen, GameRound, ZoneIntroCard).

### Hardcoded Zone/Email Content in Component Files

**Issue:** `ZoneIntroCard.jsx` (678 lines) embeds the entire ZONES data array (zone descriptions, signals, stats) directly in the component file rather than in a data module.

**Files:** `src/components/ZoneIntroCard.jsx:11-36` (zone array)

**Impact:** Component file too large. Data not reusable (zone titles duplicated in `GameRound.jsx:33-37` as ZONE_META). Changing zone copy requires editing component code.

**Fix approach:** Extract zone metadata to `src/data/zones.js`, import in both components.

### Variable Name Abbreviation in App.jsx

**Issue:** Core state hooks use single-letter/abbreviated names: `gs` (gameState), `sc` (scoring), `soc` (socState).

**Files:** `src/App.jsx:26-29`

**Impact:** Reduces readability for new contributors. Violates general JS naming conventions.

**Fix approach:** Rename to `gameState`, `scoring`, `socState`.

## Security Considerations

### Hardcoded Google Sheet ID Committed to Git

**Risk:** `SPREADSHEET_ID` is hardcoded in the Google Apps Script backend.

**Files:** `google-apps-script.js:21`

```javascript
var SPREADSHEET_ID = '1-ldYuBrFaj6I7EiXpIOxPXqgaDLM1lywlMjYVJW7FB8';
```

**Current mitigation:** Sheet not world-readable (still requires authentication). But the ID is exposed publicly.

**Recommendations:** Load via `PropertiesService.getScriptProperties()` instead of hardcoding.

### Hardcoded Reviewer Email Addresses in GAS

**Risk:** Four personal email addresses hardcoded in the GAS backend that receives assessment results:

**Files:** `google-apps-script.js:230-234`

```javascript
var recipients = [
    'pavan.machala@sutherlandglobal.com',
    'emilouvienna.nadela@sutherlandglobal.com',
    'Anoop.krishnan1@sutherlandglobal.com',
    'Sandhya.jobbin@sutherlandglobal.com',
];
```

**Current mitigation:** Email sending only happens server-side in GAS.

**Recommendations:** Store recipient list in `PropertiesService.getScriptProperties()` or a dedicated config sheet tab.

### Passcode Sent as GET Query Parameter

**Risk:** Reviewer passcode is sent as a URL query parameter when fetching SOC submissions.

**Files:** `src/components/ReviewerScreen.jsx:25`

```javascript
const url = `${LEADERBOARD_URL}?action=getSOCSubmissions&passcode=${encodeURIComponent(passcode)}`;
```

**Impact:** Passcode logged in GAS access logs, browser history (if typed in directly), network logs, and proxy logs.

**Recommendations:** Change to POST request with passcode in request body. Currently structured as GET because GAS requires `doGet` for simple requests (no CORS preflight), but a POST with `no-cors` mode could work if the passcode check is moved server-side only.

### No Server-Side Authentication on GAS Web App

**Risk:** Anyone with the deployed GAS URL can:
- Submit scores (any name/email)
- Check if any email exists in the database
- Attempt the reviewer passcode

**Files:** `google-apps-script.js:66-257` (`doPost`), `google-apps-script.js:261-335` (`doGet`)

**Current mitigation:** Reviewer endpoint requires passcode (sent in cleartext). Score submission endpoints are open by design (assessment tool).

**Recommendations:** Add IP rate limiting. Validate action payload shapes server-side.

### localStorage-Based Attempt Blocking is Trivial to Bypass

**Risk:** The single-device attempt block uses `localStorage` which can be easily cleared or set to false.

**Files:** `src/components/LandingScreen.jsx:33-35`, `src/components/LandingScreen.jsx:65`

```javascript
const [blocked, setBlocked] = useState(() => {
    try { return localStorage.getItem(ATTEMPT_KEY) === 'true'; } catch { return false; }
});
// ...
try { localStorage.setItem(ATTEMPT_KEY, 'true'); } catch {}
```

**Current mitigation:** Server-side email dedup check via `checkEmail` query on the GAS backend provides second layer.

**Recommendations:** Make the localStorage check advisory only — current server-side check is the real gate. Consider adding `localStorage` + `sessionStorage` dual check.

### Constant-Time String Comparison in GAS

**Risk:** Passcode comparison uses `!==` (standard JS string comparison), potentially vulnerable to timing attacks.

**Files:** `google-apps-script.js:277`

```javascript
if (!correct || passcode !== correct) {
```

**Impact:** Low practical risk (GAS execution timing is noisy, passcode is not the only gate). Still a code smell for authentication.

**Recommendations:** Not critical to fix given GAS execution model, but worth noting.

## Known Bugs

### Silent Email Check Failure Allows Bypass

**Symptoms:** When the `checkEmail` fetch fails (network error, GAS down), the catch block silently allows the user to proceed without checking email dedup.

**Files:** `src/components/LandingScreen.jsx:61-63`

```javascript
catch {
    // If check fails, allow the user to proceed
}
```

**Trigger:** Any network failure during email check.

**Workaround:** Retry the page load. No data corruption risk — duplicate prevention is advisory here.

### Silent Failure on Score Submission

**Symptoms:** Score submission uses `mode: 'no-cors'` and `catch (_) {}`, meaning the frontend never knows if the score was saved. If GAS is down, the user completes the assessment, gets results, but data is never persisted.

**Files:** `src/hooks/useGameState.js:140-151`, `src/hooks/useLeaderboard.js:10-22`, `src/hooks/useSocState.js:170-184`

**Impact:** Undetected data loss. Assessment results shown to user but never saved to sheet.

**Workaround:** Implement a retry mechanism with local queue (IndexedDB/localStorage). Add feedback to user on failure.

## Performance Bottlenecks

### Lottie Animation JSON Bundle Bloat

**Problem:** 10 Lottie animation JSON files imported statically in `BadgeToast.jsx` added to JS bundle regardless of whether badges are earned.

**Files:** `src/components/BadgeToast.jsx:7-16`

```javascript
import LIGHTNING_READ   from '../assets/animation/LIGHTNING_READ.json';
import ON_FIRE          from '../assets/animation/ON_FIRE.json';
// ... 8 more imports
```

**Impact:** Each JSON animation is ~10-50KB. Combined ~200-400KB added to initial JS bundle. Animations only needed on rare badge-unlock events.

**Improvement path:** Lazy-load Lottie assets — use Vite's `import()` with dynamic key lookup when badge is triggered.

### Huge Data Files Bundled Entirely

**Problem:** `src/data/emails.js` (742 lines) and `src/data/socQuestions.js` (356 lines) are imported synchronously and fully bundled.

**Files:** `src/data/emails.js`, `src/data/socQuestions.js`

**Impact:** All 17 email objects and all SOC questions loaded upfront even though only 5 emails per zone are used per game. Total ~30KB+ of static data in bundle.

**Improvement path:** Split by zone. Load zone-specific data chunks on zone transitions.

### Large Inline Style Objects Recreated on Every Render

**Problem:** Components define large style objects inside render functions or at module level.

**Files:** Every component in `src/components/`

**Impact:** Style objects created once at module scope (fine) in most cases, but some are defined in render scope causing re-creation on each render.

**Improvement path:** Move all style objects outside component functions to module scope.

## Fragile Areas

### ZoneIntroCard.jsx — 678 Lines, Hard to Modify

**Files:** `src/components/ZoneIntroCard.jsx`

**Why fragile:** Largest component in the app. Embeds zone data, mission copy, signal lists, difficulty info, stats, and full layout. Any zone content change requires editing this component. Inline `<style>` tags for responsive breakpoints embedded in JSX.

**Safe modification:** Extract data to `src/data/zones.js` first. Then split presentation from data.

**Test coverage:** 0 tests.

### GameRound.jsx — 452 Lines, Orchestration Hub

**Files:** `src/components/GameRound.jsx`

**Why fragile:** Orchestrates timer, proctoring, email display, clues, classifier, score display, and class action button. Multiple timers and state interactions. Directly calls gsap animation.

**Safe modification:** Extract sub-features (header, timer display, score display) into smaller components if not already extracted.

**Test coverage:** 0 tests.

### Google Apps Script Backend — No Testing, No Versioning

**Files:** `google-apps-script.js` (365 lines)

**Why fragile:** Backend cannot be unit-tested (GAS runtime). Single monolithic file handling register, submit, submitSOC, submitFinal, getSOCSubmissions. Sheet ID and reviewer emails hardcoded. String-based action routing with no schema validation on payloads.

**Safe modification:** Add payload validation at the top of each action handler. Use try/catch per action block. Keep GAS deployment versioned.

**Test coverage:** 0 tests (GAS cannot be tested conventionally).

### Scoring Logic — Multiple Layers, No Integration Test

**Files:** `src/utils/scoreSoc.js`, `src/utils/validateSpl.js`, `src/hooks/useScoring.js`, `src/hooks/useSocState.js:82-143`

**Why fragile:** Scoring spans 4 files across utils and hooks. `useSocState.submitSocRound()` manually computes primary/secondary correctness, SPL validation, explanation validation, then calls `scoreSocRound()`. The `scoreSoc.js` helper has complex ratio-based scoring with hardcoded thresholds (>=20 "Strong", >=15 "Good", etc.).

**Safe modification:** Unit tests exist for `scoreSoc.js` and `validateSpl.js` but not for the integration between hooks and scoring. Add integration test for `submitSocRound`.

**Test coverage:** Only `scoreSoc.test.js` and `validateSpl.test.js` exist. No tests for `useScoring.js`.

## Dependencies at Risk

### Lack of TypeScript

**Risk:** Entire codebase is plain JSX/JS. No static type checking. PropType validation exists but is runtime-only and bypassed in production builds.

**Files:** All `src/**/*.jsx` and `src/**/*.js` files.

**Impact:** Refactoring risk. Undocumented prop shapes (some PropTypes missing). No editor autocompletion for complex objects (email shapes, score records, question configs).

**Migration plan:** Incremental TS migration. Start with data types (`emails.js`, `socQuestions.js`), then hooks, then components.

### No Lockfile in Repo

**Risk:** No `package-lock.json` or `yarn.lock` found at project root.

**Files:** (missing lockfile)

**Impact:** Non-deterministic dependency installs. CI may install different sub-dependency versions than local development.

**Recommendations:** Generate and commit lockfile. Project uses npm (from node_modules structure), run `npm install --package-lock-only`.

## Test Coverage Gaps

### Source Files Without Tests

**Files with no corresponding test:**

| File | Lines | Risk |
|------|-------|------|
| `src/hooks/useGameState.js` | 182 | Core game orchestration |
| `src/hooks/useScoring.js` | 96 | Points calculation |
| `src/hooks/useSocState.js` | 204 | SOC scoring pipeline |
| `src/hooks/useProctoring.js` | 73 | Integrity detection |
| `src/hooks/useBadges.js` | 122 | Badge unlock logic |
| `src/hooks/useLeaderboard.js` | 43 | API interaction |
| `src/hooks/useTimer.js` | 49 | Countdown logic |
| `src/utils/competency.js` | 50 | Summary generation |
| `src/utils/confetti.js` | 70 | Canvas rendering |
| `src/utils/shuffle.js` | 32 | Email shuffling |
| `src/components/*` (30 files) | ~7000 total | All UI components |

**Total unit test files: 2 out of ~40 source files.**

**Risk:** Scoring regression, badge unlock bugs, game state transition errors can ship undetected.

**Priority:**
- **HIGH:** `useScoring.js`, `useBadges.js`, `shuffle.js`, `competency.js`
- **MEDIUM:** `useGameState.js`, `useProctoring.js`, `useTimer.js`
- **LOW:** Component rendering (covered by visual testing in dev)

## Missing Critical Features

### Offline Data Resilience

**Problem:** If network drops during or after assessment, all score data is lost. No IndexedDB/localStorage cache for score submissions.

**Files:** `src/hooks/useGameState.js:140-151`, `src/hooks/useSocState.js:170-184`

**Impact:** Complete data loss on network failure during submission.

### Proctoring is Informational Only

**Problem:** `useProctoring.js` counts tab switches but cannot prevent cheating. Browsers don't allow blocking tab switches from JS.

**Files:** `src/hooks/useProctoring.js`

**Impact:** Proctoring is honesty-based. Violations are logged to sheet but assessment cannot be auto-terminated on violation.

---

*Concerns audit: 2026-05-25*
