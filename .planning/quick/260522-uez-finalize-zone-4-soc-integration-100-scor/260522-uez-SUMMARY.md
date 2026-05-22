---
phase: quick-260522-uez
plan: 01
subsystem: scoring, results, google-apps-script
tags: [soc, scoring, email, sheets, results-screen]
dependency_graph:
  requires: [useSocState, useScoring, ResultsScreen, google-apps-script]
  provides: [scaleSocScore, submitFinal, Combined Assessment Score card, GAS submitFinal handler]
  affects: [App.jsx handleSocNext, ResultsScreen SOC_RESULTS render, Google Sheets Summary tab]
tech_stack:
  added: []
  patterns: [consolidated POST payload, no-cors fetch, GAS MailApp with Blob attachment, RFC-4180 CSV escape]
key_files:
  created: []
  modified:
    - src/utils/scoreSoc.js
    - src/components/ResultsScreen.jsx
    - src/hooks/useSocState.js
    - src/App.jsx
    - google-apps-script.js
decisions:
  - SOC_RAW_MAX=112 is the canonical divisor; exported from scoreSoc.js so both ResultsScreen and App share the same constant
  - submitFinal replaces submitSocToSheets entirely; old submitSOC action kept in GAS for replay safety
  - socScaledResult held in App.jsx state so ResultsScreen can read it at render time after handleSocNext fires
  - Email failure is non-fatal (Logger.log only); Sheet writes commit before MailApp.sendEmail is attempted
metrics:
  duration: ~18 minutes
  completed: 2026-05-22
  tasks_completed: 3
  files_modified: 5
---

# Phase quick-260522-uez Plan 01: Finalize Zone 4 SOC Integration (/100 Scoring) Summary

**One-liner:** Combined /100 scoring (zones 1-3 raw + SOC scaled to 40) wired end-to-end: scaleSocScore helper, ResultsScreen Combined Assessment card, consolidated submitFinal POST updating Summary Sheet cols 12-13 and sending a CSV-attached email to four reviewers.

---

## MANUAL REDEPLOY REQUIRED — ACTION NEEDED BEFORE TESTING

**google-apps-script.js has been updated locally but is NOT live yet.**

You must redeploy it as a new Apps Script Web App version:

1. Open [Google Apps Script](https://script.google.com) and open the FlagMail project.
2. Paste/replace the content of `google-apps-script.js` into the editor and save (Ctrl+S).
3. Click **Deploy → Manage deployments → edit (pencil icon) → New version → Deploy**.
4. Google will prompt you to **re-authorize permissions** — the new deployment introduces `MailApp.sendEmail`. Click **Review permissions → Allow** (the "Send email on your behalf" scope).
5. The `/exec` URL does not change between versions — no need to update `src/config.js` unless you create a brand-new deployment.
6. Verify: complete a test run through the SOC zone; check the Summary Sheet for cols 12-13 (Zone 4 SOC, Final Score /100) and the SOCData tab for per-question rows; confirm the four recipients received the email with a `.csv` attachment.

**Without this redeploy, the email and Zone 4 Sheet writes will not take effect.**

---

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add scaleSocScore helper and update ResultsScreen to show Final /100 | 46bedcc | src/utils/scoreSoc.js, src/components/ResultsScreen.jsx |
| 2 | Build consolidated submitFinal in useSocState and wire App.jsx handleSocNext | b35929b | src/hooks/useSocState.js, src/App.jsx |
| 3 | Update google-apps-script.js — Summary columns, submitFinal action, email + CSV | 6b0012a | google-apps-script.js |

---

## What Was Built

### Task 1 — scoreSoc.js + ResultsScreen

- **`src/utils/scoreSoc.js`**: Added three named exports at the top of the file (before `scoreSocRound`):
  - `SOC_RAW_MAX = 112` — canonical divisor shared by ResultsScreen and App
  - `SOC_SCALED_MAX = 40` — maximum SOC contribution to the /100 score
  - `ZONES_RAW_MAX = 60` — documentation constant
  - `scaleSocScore(socTotal, zonesRaw)` — returns `{ socScaled, finalScore }`

- **`src/components/ResultsScreen.jsx`**:
  - Removed local `const SOC_MAX_SCORE = 112`; imports `SOC_RAW_MAX` from scoreSoc.js
  - Added `socScaled` prop (default `null`) and `finalScore100 = finalScore + socScaled` computation
  - SOC card divisor updated to use `SOC_RAW_MAX`
  - New **Combined Assessment Score** card rendered between SOC card and results-mid-grid when `finalScore100 != null`; shows `{finalScore100} / 100` with sub-label "Zones 1-3 + SOC Investigation"
  - `socScaled: PropTypes.number` added to PropTypes

### Task 2 — useSocState + App.jsx

- **`src/hooks/useSocState.js`**:
  - `submitSocToSheets` removed; replaced by `submitFinal(consolidatedPayload)`
  - `submitFinal` stores the full consolidated payload to `sessionStorage["socSubmission"]` and fires a `no-cors` POST with `action: "submitFinal"` spread into the body

- **`src/App.jsx`**:
  - Imports `scaleSocScore` from `./utils/scoreSoc.js` and `SOC_QUESTIONS` from `./data/socQuestions.js`
  - Adds `socScaledResult` state (initialized `null`); set in `handleSocNext` after computing scores
  - `handleSocNext` (when no more questions):
    1. Computes `{ socScaled, finalScore }` via `scaleSocScore(soc.socTotal, sc.totalScore)`
    2. Derives tier from combined `/100` score (Advanced ≥80, Proficient ≥50, Foundation <50)
    3. Maps `SOC_QUESTIONS` × `soc.answers` into `socAnswers` array with per-question classification/SPL/explanation/score/grade fields
    4. Builds consolidated payload and calls `soc.submitFinal(consolidatedPayload)`
    5. Transitions to `SOC_RESULTS`
  - `SOC_RESULTS` ResultsScreen render now passes `socScaled={socScaledResult}`
  - `handleAdvanceZone` (zones 1-3 path) is entirely unchanged

### Task 3 — google-apps-script.js

- **`ensureSheets`**: Summary header extended to 13 columns — `'Zone 4 (SOC)'` (col 12) and `'Final Score /100'` (col 13) appended
- **`submitFinal` action block** (new):
  1. `findRowByEmail` → `setValues` on col 12-13; also updates Tier (col 7) with combined-score tier. Fallback `appendRow` if no prior row exists.
  2. Writes SOCData rows (one per question) — same column shape as the old `submitSOC` handler
  3. Builds RFC-4180 CSV via `csvEscape()` with columns: Question ID, Selected Primary, Correct Primary, Selected Secondary, Correct Secondary, SPL Query, Explanation, Score, Grade
  4. Sends email via `MailApp.sendEmail` to four hardcoded recipients with the CSV as a `Utilities.newBlob` attachment; email failure is non-fatal
- **`submitSOC` action**: left intact for replay safety — no longer called by the updated client
- **`csvEscape(val)`** helper added at the bottom alongside `sanitiseCell`
- `doGet` / `getSOCSubmissions` reviewer path: untouched

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Threat Surface Scan

| Flag | File | Description |
|------|------|-------------|
| threat_flag: injection | google-apps-script.js | Candidate-controlled `name`, `splText`, `explanation` flow into email subject and body. The plan's threat model (T-uez-03) covers this: `csvEscape()` wraps all CSV cells; email body is plain text (no HTML injection via MailApp plain-text mode). Subject line includes `payload.name` — accepted per T-uez-03 (internal reviewer audience). |

---

## Known Stubs

None — all data paths are wired. `socScaledResult` is `null` only before `handleSocNext` fires (i.e., before the SOC zone completes), which is the correct initial state and does not affect the zones-1-3 `RESULTS` screen.

---

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| src/utils/scoreSoc.js exists | FOUND |
| src/components/ResultsScreen.jsx exists | FOUND |
| src/hooks/useSocState.js exists | FOUND |
| src/App.jsx exists | FOUND |
| google-apps-script.js exists | FOUND |
| Commit 46bedcc exists | FOUND |
| Commit b35929b exists | FOUND |
| Commit 6b0012a exists | FOUND |
| `SOC_RAW_MAX` exported from scoreSoc.js | FOUND |
| `scaleSocScore` exported from scoreSoc.js | FOUND |
| `finalScore100` in ResultsScreen | FOUND |
| `Combined Assessment Score` card in ResultsScreen | FOUND |
| `submitFinal` in useSocState return | FOUND |
| `submitSocToSheets` removed from useSocState | CONFIRMED (not found) |
| `socScaledResult` state in App.jsx | FOUND |
| `scaleSocScore` import in App.jsx | FOUND |
| `SOC_QUESTIONS` import in App.jsx | FOUND |
| `soc.submitFinal(consolidatedPayload)` in handleSocNext | FOUND |
| `socScaled={socScaledResult}` on SOC_RESULTS render | FOUND |
| `submitFinal` action block in GAS | FOUND |
| `Zone 4 (SOC)` in GAS ensureSheets header | FOUND |
| `csvEscape` helper in GAS | FOUND |
| Old `submitSOC` action preserved in GAS | FOUND |
| `npx vite build` exits 0 | PASSED |
