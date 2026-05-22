---
phase: quick-260522-5to
plan: 01
subsystem: proctoring
tags: [proctoring, hooks, game-round, soc-round, gas-backend]
key-files:
  created:
    - src/hooks/useProctoring.js
  modified:
    - src/components/GameRound.jsx
    - src/components/SocRound.jsx
    - src/App.jsx
    - src/hooks/useSocState.js
    - google-apps-script.js
decisions:
  - "Violation count is advisory/informational only — never blocks gameplay (spec requirement)"
  - "lastHiddenRef guard prevents double-counting when both visibilitychange + blur fire on one departure"
  - "SocRound accumulates violations across all questions; GameRound resets per email"
  - "GAS SOCData writes violation count only on first answer row per submission (keeps one-row-per-answer structure intact)"
  - "All new GAS fields default to 0 / empty so existing rows without the field are unaffected"
metrics:
  duration: ~12 minutes
  completed: 2026-05-22
  tasks_completed: 3
  files_changed: 6
---

# Quick Task 260522-5to: Add Detect-and-Flag Proctoring (Tab/Window Switch)

**One-liner:** Tab/window switch detection via `visibilitychange` + `blur` events, counted per session with amber inline warning, violation count threaded through both zone-1-3 and SOC submit payloads to Google Sheets.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create useProctoring hook | 0b9c3c1 | src/hooks/useProctoring.js |
| 2 | Wire proctoring into GameRound and SocRound | e1c09dd | src/components/GameRound.jsx, src/components/SocRound.jsx |
| 3 | Thread violation count through App, hooks, and GAS backend | 86c5535 | src/App.jsx, src/hooks/useSocState.js, google-apps-script.js |

## What Was Built

### useProctoring hook (`src/hooks/useProctoring.js`)
- Listens to `document.visibilitychange` and `window.blur`/`window.focus`
- `lastHiddenRef` guard ensures one discrete departure = one violation regardless of how many events fire
- Returns `{ violations, switchedAway, reset }`
- Cleans up all listeners when `active` becomes false or component unmounts
- Does not reset violations when `active` goes false — consumers need the running total

### GameRound (`src/components/GameRound.jsx`)
- Calls `useProctoring({ active: !round.submitted })`
- Resets per email via `useEffect` on `[email?.id]`
- Amber non-blocking pill banner rendered above `<RoundHeader>` when `switchedAway || violations > 0`
- Text logic: "Tab switch detected (N) — stay on this page" while away; "Returned — N tab switches recorded" after returning
- Emits `onViolationChange(count)` via optional prop (default no-op)

### SocRound (`src/components/SocRound.jsx`)
- Same hook and banner; no per-question reset (accumulates across full SOC session)
- Banner rendered at top of content grid, above the header card
- Emits `onViolationChange(count)` via optional prop (default no-op)

### App.jsx
- Added `useState` import
- `gameViolations` / `setSocViolations` state variables
- `onViolationChange={setGameViolations}` on `<GameRound>`
- `onViolationChange={setSocViolations}` on `<SocRound>`
- `proctoring_violations: gameViolations` added to zone-3 `submitToSheet` payload
- `soc.submitSocToSheets(socViolations)` in `handleSocNext`

### useSocState.js
- `submitSocToSheets(proctoring_violations = 0)` — parameter with default
- `proctoring_violations` included in both sessionStorage snapshot and GAS POST body

### google-apps-script.js
- `ensureSheets`: Summary header extended to 11 columns (`'Proctoring Violations'` appended)
- `action === 'submit'`: `setValues` range extended to 8 columns; `appendRow` extended to 11 elements; both use `payload.proctoring_violations || 0`
- `ensureSOCSheet`: SOCData header extended to 9 columns (`'Proctoring Violations'` appended)
- `action === 'submitSOC'`: `appendRow` in the answer loop writes `payload.proctoring_violations || 0` for `i === 0` and `''` for subsequent rows

## Deviations from Plan

None — plan executed exactly as written.

## Threat Surface Scan

No new network endpoints, auth paths, or schema changes at new trust boundaries introduced beyond what is documented in the plan's threat model.

## Known Stubs

None.

## Build Verification

`npx vite build` — PASSED (7.35s, 444 modules). Pre-existing warnings only:
- lottie-web eval warning (pre-existing, not caused by these changes)
- chunk size warning for index.js (pre-existing)

## Self-Check

- [x] `src/hooks/useProctoring.js` exists and exports `useProctoring`
- [x] `GameRound.jsx` imports and uses `useProctoring`, renders amber banner, emits `onViolationChange`
- [x] `SocRound.jsx` imports and uses `useProctoring`, renders amber banner, emits `onViolationChange`
- [x] `App.jsx` tracks `gameViolations`/`socViolations`, passes to submit paths
- [x] `useSocState.js` accepts and forwards `proctoring_violations`
- [x] `google-apps-script.js` has `Proctoring Violations` in both sheet headers and both write paths
- [x] All 3 task commits exist: 0b9c3c1, e1c09dd, 86c5535
- [x] Build passes

## Self-Check: PASSED
