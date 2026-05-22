---
slug: soc-zone-scoring-integration
status: resolved
trigger: |
  debug the codebase and above highlighted points. in all 3 initial zones game start screen shows 25
  5 each
  Max points. Also check if we could add some kind of protoring basic, but effective. like once they start the level they cannot switch the screen.
created: 2026-05-22
updated: 2026-05-22
---

# Debug: SOC zone scoring integration

A cluster of related defects, all caused by the SOC level (the "fourth zone")
being built as a parallel system that was never integrated into the existing
scoring, results, sheet pipeline, or zone-count messaging.

## Symptoms

- expected: Zone intro screen advertises the real max points; the SOC (4th)
  zone's score is counted in the final total, shown on the results screen, and
  written to the Google Sheet; UI copy reflects four zones.
- actual: Zone intro shows "25 / 5 each / Max points" (should be 20 / 4 each);
  SOC score is never added to the total nor displayed on results; SOC data
  never reaches the Sheet; UI copy still says "3 zones".
- errors: None thrown — silent data loss / wrong display.
- timeline: Introduced when the SOC zone was added (current working tree;
  uncommitted SOC components).
- reproduction: (1) Start any of zones 1-3 → intro card shows 25 max points.
  (2) Complete the SOC level → results screen shows only the zones 1-3 score.
  (3) Complete the SOC level with a configured Apps Script URL → no row appears
  in the SOCData sheet.

## Current Focus

hypothesis: SOC zone built parallel to useScoring; integration glue (zone
count, total, results screen, sheet payload contract) was never written.
test: Confirm each finding below against current source.
expecting: All four root causes confirmed; fixes applied and committed atomically.
next_action: gather initial evidence

## Prior Investigation (orchestrator audit — confirmed against source)

### Bug 1 — Zone intro "25 / 5 each" max points (CONFIRMED root cause)
- `src/components/ZoneIntroCard.jsx:99` — `{ label: 'Max points', value: meta.emails * 5, helper: '5 each' }`
- `meta.emails` = 5 → renders 25.
- Real scoring is 4 pts/email: `src/hooks/useScoring.js:33-39` (l1Points 2 + l2Points 2 = 4 max); `src/styles/tokens.js:13` `POINTS_PER_EMAIL = 4`.
- Fix: `value: meta.emails * POINTS_PER_EMAIL`, `helper: '4 each'`; import `POINTS_PER_EMAIL` from `../styles/tokens.js`.

### Bug 2 — SOC (4th zone) score never counted or shown
- Two disconnected scoring systems: `useScoring.js` (zones 1-3, `totalScore`, `zoneScores {1,2,3}`, max 60) vs `useSocState.js` (per-question `result.score.total`, SOC max 112).
- `src/App.jsx:190-199` — SOC_RESULTS screen renders `<ResultsScreen finalScore={sc.totalScore} zoneScores={sc.zoneScores} perEmail={sc.perEmail} />` — all zones-1-3 data only.
- `soc.allResults` is computed (`useSocState.js:158-162`) but never passed anywhere.
- `src/components/ResultsScreen.jsx:49` (`max: ZONE_MAX_SCORE`) and `:175` (zone grid `repeat(3, ...)`) only model 3 zones.
- Fix direction: surface SOC total + grade on the SOC results view (dedicated SOC results, or extend ResultsScreen to accept SOC data).

### Bug 3 — SOC data never reaches the Google Sheet (payload contract mismatch)
- Client `src/hooks/useSocState.js:192-201` POSTs `{ action:"submitSOC", name, email, answers: submittedAnswers }` where each item is `{ splText, explanation, score, grade }`.
- Server `google-apps-script.js:104` iterates `payload.questions` (UNDEFINED) → loop body never runs → nothing written to `SOCData`.
- Server `google-apps-script.js:111` reads top-level `payload.splText`/`payload.explanation` — also absent (they are per-answer).
- `submittedAnswers` items have no `questionId`.
- `doPost submitSOC` writes one row per question; `doGet getSOCSubmissions` (`:156-179`) reads as if one row holds all 6 — the two GAS functions also disagree.
- Main `Summary` sheet (`ensureSheets`, cols Zone 1/2/3) has no SOC column.
- Fix: align one payload shape + field names across `useSocState.js` and `google-apps-script.js` (doPost + doGet).

### Bug 4 — "3 zones" copy / zone count
- `src/components/TutorialScreen.jsx:110` — literal "15 emails · 3 zones · 120s per round".
- `src/styles/tokens.js:15` `ZONE_COUNT = 3`; `:19-23` `ZONE_META_LIST` 3 entries.
- SOC is a separate screen flow (`SOC_INTRO`/`SOC_ROUND`), not `zone === 4` — by design. Fix is messaging consistency, not the zone state machine.

### Related minor issue
- `src/components/SocExplanationCard.jsx:93` hardcodes `{total} / 23 pts`; Q5a max is 10 and Q5b max is 10 — wrong denominator for sub-questions.
- `src/hooks/useSocState.js:164-172` `submitSocToSheets` maps `SOC_QUESTIONS[idx]` using the filtered-array index, not the real question index — misaligns IDs if any question is unsubmitted.

### Out of scope for this session
- Proctoring (detect tab/window switching) is a NEW FEATURE, not a bug — handled as a follow-up after this debug session. Chosen approach: detect-and-flag (Page Visibility API + window blur), count violations, warn the player, record the count for the reviewer.

## Evidence

- timestamp: 2026-05-22 — Orchestrator audit completed; all four root causes confirmed against source (see Prior Investigation).
- timestamp: 2026-05-22 — All four root causes re-confirmed against live source; fixes applied to 8 files; production build verified passing.

## Eliminated

(none yet)

## Resolution

root_cause: The SOC ("fourth zone") was built as a parallel system and never
integrated into the existing scoring/results/sheet pipeline or zone-count copy.
All four root causes in Prior Investigation confirmed against current source.

fix:
- Bug 1 — ZoneIntroCard "Max points" now uses POINTS_PER_EMAIL (4) instead of
  literal 5; helper text derived from the same constant. (20 / 4 each)
- Bug 2 — ResultsScreen accepts an optional socScore prop and renders a SOC
  Investigation score card (X / 112); App.jsx SOC_RESULTS now passes
  soc.socTotal. Added socTotal memo to useSocState.
- Bug 3 — Aligned one canonical per-question payload shape across client and
  server. useSocState.submitSocToSheets sends answers: [{questionId, splText,
  explanation, score, grade}] (questionId now included, filtered-index bug
  fixed by zipping with SOC_QUESTIONS before filtering). google-apps-script.js
  doPost submitSOC writes one row per answer (cols: Timestamp, Name, Email,
  Question ID, Score, Grade, SPL Text, Explanation); doGet getSOCSubmissions
  groups rows by name+timestamp and computes a per-submission total;
  ensureSOCSheet headers updated to match. ReviewerScreen updated for the new
  shape (per-question SPL/explanation, total / 112 chip).
- Bug 4 — TutorialScreen copy now reads "3 zones + SOC investigation".
- Minor — SocExplanationCard no longer hardcodes "/ 23"; per-question max is
  derived from each question's score config (Q1-Q4 = 23, Q5a/Q5b = 10), and
  zero-max breakdown rows are filtered out.

verification: `npx vite build` succeeds (443 modules, no errors). ESLint on
changed files shows only pre-existing baseline errors (motion/`_`/unused vars
from the project's eslint config lacking react JSX-usage detection) — zero new
lint errors introduced. Out-of-scope proctoring not implemented.

files_changed:
- src/components/ZoneIntroCard.jsx
- src/components/TutorialScreen.jsx
- src/components/ResultsScreen.jsx
- src/components/SocExplanationCard.jsx
- src/components/ReviewerScreen.jsx
- src/hooks/useSocState.js
- src/App.jsx
- google-apps-script.js
