# Project Research Summary

**Project:** FlagMail — SOC Investigation Level (Zone 4)
**Domain:** Browser-based SPL query assessment appended to an existing React classification game
**Researched:** 2026-05-22
**Confidence:** HIGH

## Executive Summary

FlagMail Zone 4 is a strictly additive milestone that transforms an existing three-zone phishing-classification quiz into an entry-level SOC analyst assessment. The new level presents candidates with incident scenarios backed by email, proxy, and EDR log evidence, asks them to classify the threat (primary + secondary), write a Splunk SPL query, and justify their reasoning in free text — all scored automatically against a 23-point keyword-matching model and surfaced to a passcode-gated reviewer. The entire research consensus is that this milestone can be delivered using the codebase's exact existing conventions, with zero new dependencies: same React 19 hooks pattern, same SCREENS enum state machine, same Google Apps Script submission pattern, and a new static data file that mirrors `emails.js`.

The recommended implementation order follows strict data-first dependency sequencing: author the question dataset first, build the pure-function validation and scoring utilities next, wire them into a dedicated `useSocState` hook, then build the UI components, and finally wire the backend GAS additions. This order ensures every upstream artifact is testable in isolation before the next layer depends on it. The reviewer view is a late-phase addition because it depends on GAS deployment.

The dominant risk class is keyword-validation quality, not code complexity. The validation engine itself is trivially simple (`String.includes()` on lowercase text). What is hard is authoring a term list that avoids both false passes (term stuffing) and false fails (alternate valid SPL syntax). Secondary risks are a formula-injection vulnerability in the GAS sheet write and silent submission failure inherited from the existing codebase pattern. Both have one-function fixes that must land in the same PR as the features they protect.

## Key Findings

### Recommended Stack

No new npm packages. Five new source files: `src/data/socQuestions.js`, `src/utils/validateSpl.js`, `src/utils/scoreSoc.js`, `src/hooks/useSocState.js`, and SOC screen components under `src/components/`. `framer-motion` (already installed) handles transitions.

**Core technologies:**
- React 19 `useState` + `useCallback` — controlled textarea inputs; same as every existing screen
- Native `<textarea>` with monospace font — SPL editor; CodeMirror/Monaco rejected (200–500 KB, zero scoring benefit)
- `String.includes()` keyword matching — validation engine; SPL parser rejected (weeks of work, keyword fidelity is the spec)
- Existing SCREENS enum — navigation; React Router rejected (URL routing conflicts with SPA-no-URL design)
- GAS `PropertiesService` for passcode — `VITE_` env vars are plaintext in built bundle; server-side check is mandatory
- GAS `SOCData` sheet + new `submitSOC` / `getSOCSubmissions` actions — extends existing `doPost`/`doGet` dispatch

### Expected Features

**Must have (P1 — v1 launch blockers):**
- Scenario card + log evidence panel (email / proxy / EDR)
- Primary classification picker (question-specific options)
- Secondary diagnosis picker (unlocked after primary)
- Multi-line plain-text SPL textarea
- Free-text explanation textarea
- Submit button with confirmation (disabled until both fields have content)
- Keyword validation engine (required / optional / blocked SPL terms + explanation concept matching)
- Per-question score breakdown: Primary 5 / Secondary 3 / SPL 10 / Explanation 5
- Per-dimension inline feedback labels
- Overall grade band: Strong / Good / Needs improvement / Not ready
- Question progress indicator ("Question N of 5")
- Google Sheets push via GAS `submitSOC`
- Reviewer passcode gate (server-side check via `PropertiesService`)
- Reviewer submission list (name, timestamp, scores, grade band, raw SPL)

**Should have (P2 — add after v1 validated):**
- Hint per question (one directional clue, post-first-submit only)
- Worked-solution reveal (model answer SPL + annotations, post-submit only)
- Reviewer per-question drill-down
- SOC Investigation badge
- SPL character/line count indicator

**Defer (P3 / v2+):**
- Print-friendly reviewer export, multi-stage question branching, additional question bank
- Timer on SOC questions, leaderboard integration for SOC scores, LLM grading, real Splunk execution — all explicitly anti-features or out-of-scope

### Architecture Approach

One-line change in `advanceZone` routes zone-3 exit to `SOC_INTRO` instead of `RESULTS`. Four new SCREENS enum values. A dedicated `useSocState` hook owns all SOC state — it never merges into `useGameState`, only reading `gs.player` and calling `gs.goToResults` as coupling points. `App.jsx` receives three additive render blocks; no existing blocks are modified. All validation and scoring is client-side; only the final scored record is sent to GAS.

**Major components:**
1. `src/data/socQuestions.js` — static question objects with scenario, log evidence, picker options, keyword rules, concept rules, feedback strings. All downstream depends on this.
2. `src/utils/validateSpl.js` + `src/utils/scoreSoc.js` — pure functions, no React dependency, trivially unit-testable before any UI exists.
3. `src/hooks/useSocState.js` — orchestration layer: question flow, scoring dispatch, GAS submission with `sessionStorage` backup and user-visible error handling.
4. `SocRound.jsx` — main question screen composing `EvidencePanel`, `SocClassifier` (x2), `SplEditor`, explanation textarea, submit button.
5. `SocExplanationCard.jsx` — per-question feedback: score breakdown, grade band, keyword hit/miss list, reference answer.
6. `ReviewerScreen.jsx` — passcode gate + plain `fetch(url)` GET from GAS (no custom headers — CORS constraint).
7. `google-apps-script.js` additions — `submitSOC`, `getSOCSubmissions`, `ensureSOCSheet`, `sanitiseCell`.

### Critical Pitfalls

1. **Term-stuffing false passes** — candidate writes isolated keywords in a nonsensical query and scores 10/10 SPL. Prevention: author required terms as multi-token phrases; add 2–3 blocked terms per question; reviewer UI displays raw SPL with a coherence check note.
2. **False fails from alternate valid SPL syntax** — `earliest=-1d` fails when `earliest=-24h` is the required term. Prevention: `anyOf` array support in `validateSpl.js` from day one; author known aliases at question-authoring time.
3. **Whitespace normalisation false fails** — `|stats count by` fails to match `| stats count by`. Prevention: `.replace(/\s+/g, ' ')` normalisation in `validateSpl.js` before any `includes()` check.
4. **Passcode exposed in built JS bundle** — any `VITE_` variable is a plaintext string in `dist/`. Prevention: send passcode to server; compare via GAS `PropertiesService`; client never holds the correct value.
5. **Formula injection in Google Sheets** — `=IMPORTRANGE(...)` in candidate SPL executes in Sheets. Prevention: `sanitiseCell()` in GAS prefixes cells starting with `=`/`+`/`-`/`@` with an apostrophe; ships in same PR as `submitSOC`.
6. **Silent submission failure** — inherited `mode: 'no-cors'` + `console.warn` pattern gives no user feedback. Prevention: user-visible error on fetch rejection; `sessionStorage` backup before navigating away.
7. **CORS error on reviewer GET** — any custom header triggers a preflight GAS cannot handle. Prevention: plain `fetch(url)` with no headers object; explicit code comment; browser-test required.

## Implications for Roadmap

### Phase 1: Question Dataset Authoring
**Rationale:** Every downstream artifact consumes `socQuestions.js`. This is the only primarily content phase, not code. Nothing else is buildable without final question content.
**Delivers:** `src/data/socQuestions.js` — ~5 questions with `anyOf`-capable keyword rules and root-form concept keywords from the start.
**Avoids:** Term-stuffing (multi-token phrases), false fails (anyOf at data-design time), synonym false fails (root-form concepts).
**Research flag:** Standard patterns — no deeper research needed. Requires human domain review of each term list against 3 plausible stuffing attempts before phase is closed.

### Phase 2: Validation and Scoring Utilities
**Rationale:** Pure functions testable with `console.log` before any UI exists. `useSocState` cannot be authored without these.
**Delivers:** `validateSpl.js` (whitespace-normalised, `anyOf`-supporting), `scoreSoc.js` (23-point model with score floor and grade band).
**Avoids:** Whitespace false fails, blocked-term negative score, grade band off-by-one.
**Research flag:** Standard patterns — no deeper research needed.

### Phase 3: State Machine and Hook
**Rationale:** `useSocState` is the API that all screen components consume. Also includes the two-line `useGameState.js` patch. Must precede all UI work.
**Delivers:** `useSocState.js`, SCREENS enum extension, `advanceZone` one-line patch.
**Avoids:** SOC state merging into `useGameState`; silent submission failure (error handling + `sessionStorage` in `submitSocRound`).
**Research flag:** Follows existing hook conventions exactly — no deeper research needed.

### Phase 4: SOC Level UI Components
**Rationale:** All UI components are pure consumers of `useSocState`. Build sub-order: display primitives first, composition screens second, `App.jsx` wiring last. After this phase the full play loop is playable.
**Delivers:** `SocIntroCard`, `EvidencePanel`, `SplEditor`, `SocClassifier`, `SocRound`, `SocExplanationCard`; `App.jsx` wired with four additive render blocks.
**Avoids:** `Classifier.jsx` modification risk (use independent `SocClassifier`); SPL library bloat (plain textarea).
**Research flag:** Standard React component patterns — no deeper research needed. Highest code-volume phase.

### Phase 5: Backend and Reviewer View
**Rationale:** GAS deployment depends on final payload shape from Phase 4. Reviewer view is a read path from GAS — requires at least one successful write to test.
**Delivers:** GAS `submitSOC` + `getSOCSubmissions` + `sanitiseCell` + `ensureSOCSheet`; `ReviewerScreen.jsx`; `REVIEWER_PASSCODE` set in GAS `PropertiesService` (not in source).
**Avoids:** Formula injection (`sanitiseCell`), passcode bundle exposure (server-side check), CORS error (plain GET fetch).
**Research flag:** GAS CORS for reviewer GET must be manually verified in Chrome and Firefox before this phase is closed. The fix is known but a browser integration test is required.

### Phase Ordering Rationale

- Data before utilities: validation rules are data-driven; a validation engine without final rules is untestable.
- Utilities before hook: `useSocState.submitSocRound` calls `validateSpl` and `scoreSoc` directly.
- Hook + SCREENS before UI: component APIs are defined by hook return values; must be stable before components are built.
- UI before backend: GAS column schema must match the final payload shape determined by UI.
- The reviewer screen component can be built against mock data in parallel with GAS work in Phase 5.

### Research Flags

Standard patterns (no research phase needed during planning):
- Phase 1, 2, 3, 4 — all follow directly from the existing codebase conventions.

Needs verification during execution:
- Phase 5 — GAS CORS reviewer GET must be browser-tested. Not a research gap; the fix is known, but it is the most likely integration surprise.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All recommendations from direct codebase inspection; zero new dependencies; no version risk |
| Features | MEDIUM-HIGH | Table-stakes grounded in BOTS/TryHackMe/EC-Council; exact UI tradeoffs are judgment calls within confirmed constraints |
| Architecture | HIGH | Direct inspection of `useGameState.js`, `App.jsx`, `google-apps-script.js`; one-line `advanceZone` patch verified against source |
| Pitfalls | HIGH | Derived from codebase inspection, known keyword-matching failure modes, documented Vite bundle behaviour, OWASP formula injection |

**Overall confidence:** HIGH

### Gaps to Address

- **Term list quality:** The biggest determinant of level fairness cannot be resolved in research — it requires human domain review of each question's required/blocked term lists against multiple plausible candidate responses. Plan an explicit review step at the end of Phase 1.
- **`anyOf` data shape alignment:** Design `anyOf` into `validateSpl.js` from day one even if Phase 1 content initially uses only simple strings. Retrofitting this post-authoring is a content migration.
- **Q8 multi-stage flattening:** A human content design decision is needed during Phase 1 on how to split the multi-stage question into sequential sub-questions. Not a code gap.
- **GAS `PropertiesService` ops step:** Setting the reviewer passcode in `File > Project properties > Script properties` after deploying must be documented in the Phase 5 implementation plan.

## Sources

### Primary (HIGH confidence)
- `flagmail1/src/hooks/useGameState.js` — SCREENS enum, `advanceZone`, `submitToSheet` pattern
- `flagmail1/src/hooks/useScoring.js` — pure-function scoring engine pattern
- `flagmail1/google-apps-script.js` — `doPost`/`doGet` action dispatch, `appendRow` pattern
- `flagmail1/src/data/emails.js` — static dataset shape
- `flagmail1/.planning/PROJECT.md` — 23-point scoring model, validation spec, passcode requirement, out-of-scope items
- `flagmail1/Splunk.md` — grade band thresholds
- `flagmail1/.planning/codebase/CONCERNS.md` — silent submission failure, GAS public endpoint
- Vite documentation: `import.meta.env` static replacement
- OWASP formula/CSV injection: leading `=`/`+`/`-`/`@` triggers formula execution

### Secondary (MEDIUM confidence)
- Splunk BOTS blog and open-source dataset — scenario-based SPL training reference
- TryHackMe Splunk rooms — hint and worked-solution reveal patterns
- PMC 2022 / Springer 2023 — progressive hint and per-dimension feedback research basis
- EC-Council CSA — assessment structure reference
- GAS CORS behaviour — consistent with existing codebase pattern; browser-testing still required

---
*Research completed: 2026-05-22*
*Ready for roadmap: yes*
