# Roadmap: FlagMail — SOC Investigation Level

## Overview

This milestone adds a fourth zone — SOC Investigation — to the existing three-zone FlagMail classification game. Candidates classify the threat, write a Splunk SPL query, and explain their reasoning against log evidence. A keyword-matching engine scores their work automatically on a 23-point model and pushes the result to Google Sheets, where a passcode-gated reviewer view surfaces submissions. The build follows strict data-first dependency sequencing: the question dataset anchors everything, validation and scoring utilities consume it, the state machine and hook wire them together, UI components consume the hook, and the backend integration completes the write-and-read path. The existing three classification zones are not touched.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Question Dataset** - Author 6 SOC investigation question objects (Q1–Q4, Q5a, Q5b) as a static data file, with scenario, log evidence, keyword rules, and feedback strings
- [ ] **Phase 2: Validation and Scoring Utilities** - Build pure-function SPL keyword validation and 23-point scoring engines that all downstream code depends on
- [ ] **Phase 3: State Machine and Hook** - Extend the SCREENS enum, apply the one-line advanceZone patch, and build useSocState to own all SOC flow
- [ ] **Phase 4: SOC Level UI** - Build all SOC screen components and wire them into App.jsx so the full play loop is playable end-to-end
- [ ] **Phase 5: Backend and Reviewer View** - Add GAS submitSOC/getSOCSubmissions actions, formula injection protection, and the passcode-gated reviewer screen
- [x] **Phase 6: Data Enrichment** - Enrich socQuestions.js (Q1–Q4, Q5a, Q5b) with investigation context, SPL task prompts, and hints per question — the data foundation every v1.1 UI phase reads from
- [x] **Phase 7: GAS Email Fix** - Fix manager/reviewer email delivery in the Google Apps Script backend with quota checking, failure logging, and a documented re-authorization checklist
- [x] **Phase 8: Hint Engine** - Add progressive hint reveal state to useSocState and build the HintPanel.jsx sub-component that surfaces hints post-first-submit
- [x] **Phase 9: SOC Round Overhaul** - Restructure SocRound.jsx to display investigation context, analyst focus, expected outcomes, scenario-specific SPL prompts, and human-readable per-dimension feedback

## Phase Details

### Phase 1: Question Dataset
**Goal**: A complete, domain-reviewed static dataset of ~5 SOC investigation questions exists and is importable by downstream code
**Depends on**: Nothing (first phase)
**Requirements**: QSTN-01, QSTN-02, HARD-03
**Success Criteria** (what must be TRUE):
  1. `src/data/socQuestions.js` exports an array of 6 question objects (Q1–Q4, Q5a, Q5b) with scenario, evidence panel (email, proxy, EDR log lines), classification options, SPL keyword rules, and concept keywords
  2. Every question's SPL rules use `anyOf` arrays for at least the time-range and aggregation terms, so alternate valid SPL syntax variants are represented from the start
  3. Every question's explanation concept keywords are authored as shortest-unambiguous root forms (e.g., `"credential"` not `"credential harvesting"`)
  4. Each question's required SPL term list has been manually checked against at least three plausible term-stuffed queries and includes at least one blocked term per question to resist stuffing
  5. The repository README (or a CONCERNS note) explicitly marks `flagmail1/` as the canonical project directory and `flagmail/` as deprecated, so any contributor opening the repo knows which copy to work in
**Plans**: TBD

### Phase 2: Validation and Scoring Utilities
**Goal**: Deterministic, fully testable pure functions exist for SPL keyword validation and 23-point SOC scoring before any UI or hook code is written
**Depends on**: Phase 1
**Requirements**: VALID-01, VALID-02, VALID-03, SCORE-01, SCORE-02, HARD-01
**Success Criteria** (what must be TRUE):
  1. `validateSpl(splText, rules)` returns required hits/misses, optional hits, and blocked hits; whitespace is normalised before any `includes()` check so `|stats` and `| stats` produce identical results
  2. `validateSpl` accepts each required or optional term as either a plain string or a `{ anyOf: string[] }` object, so alternate valid SPL forms are recognised without returning a false fail
  3. `validateExplanation(text, conceptRules)` matches concept keywords case-insensitively and returns required and optional concept hits
  4. `scoreSocRound(inputs)` produces a score breakdown (primary 5 / secondary 3 / SPL 10 / explanation 5), a total, and a grade band (Strong / Good / Needs improvement / Not ready) with a score floor of 0 — blocked terms cannot push the SPL score negative
  5. A score of exactly 20 produces "Strong" and exactly 19 produces "Good" — grade band boundaries are off-by-one free
  6. Vitest is configured in the project and a test suite covering `validateSpl` and `scoreSocRound` passes with `npm test` — all edge cases (whitespace normalisation, `anyOf` matching, blocked-term floor, grade band boundaries) have at least one test each
**Plans**: TBD

### Phase 3: State Machine and Hook
**Goal**: The SOC level is reachable in the running app — the SCREENS enum is extended, zone-3 hands off to SOC_INTRO, and useSocState owns the full question flow including error-surfacing submission logic
**Depends on**: Phase 2
**Requirements**: LEVEL-01, LEVEL-02, LEVEL-03
**Success Criteria** (what must be TRUE):
  1. Completing zone 3 navigates to SOC_INTRO instead of RESULTS — zones 1–3 transitions are unchanged
  2. `useSocState` exposes a stable hook API (start, select, set, submit, next actions plus all state fields) that screen components can consume without touching `useGameState` internals
  3. A progress counter (`currentQuestionIdx` + total) is tracked in state so a "Question N of 5" indicator can be rendered by any consuming component
  4. `submitSocRound` shows a user-visible error message on fetch rejection and writes the serialised submission to `sessionStorage` before navigating away, so a network failure does not silently discard the candidate's work
**Plans**: TBD

### Phase 4: SOC Level UI
**Goal**: A candidate can play through the entire SOC Investigation level in the browser — intro card, all questions with evidence panel and input fields, per-question feedback — before the backend is wired
**Depends on**: Phase 3
**Requirements**: INPUT-01, INPUT-02, INPUT-03, INPUT-04, INPUT-05, FDBK-01, FDBK-02
**Success Criteria** (what must be TRUE):
  1. The SOC intro card renders before the first question, consistent in visual style with the existing zone intro cards
  2. A candidate can select a primary classification from question-specific options; the secondary diagnosis picker only becomes active after a primary is chosen
  3. A candidate can type a multi-line SPL query in a plain monospace textarea and a free-text explanation in a separate field; the submit button remains disabled until both fields contain content
  4. After submitting a question, the candidate sees a per-dimension score breakdown (primary / secondary / SPL / explanation scores) alongside a grade band label
  5. Per-dimension feedback text explains what was correct or missing for the SPL query and explanation, so the candidate understands the result and not just the number
**Plans**: TBD
**UI hint**: yes

### Phase 5: Backend and Reviewer View
**Goal**: SOC submissions are durably stored in Google Sheets and a passcode-gated reviewer can read all submissions including raw SPL text, with formula injection prevented and the passcode not exposed in the client bundle
**Depends on**: Phase 4
**Requirements**: BACK-01, BACK-02, BACK-03, REVW-01, REVW-02, REVW-03, REVW-04, HARD-02
**Success Criteria** (what must be TRUE):
  1. Completing the SOC level pushes all per-question records (classifications, SPL text, explanation, scores, grade band) to a `SOCData` Google Sheet via the existing Apps Script endpoint using a new `submitSOC` action
  2. A submission containing SPL text that begins with `=`, `+`, `-`, or `@` is stored as plain text in the sheet — no formula is executed in `SOCData`
  3. A reviewer navigates to the reviewer screen from the landing page, enters the correct passcode, and the passcode is validated server-side via GAS `PropertiesService` — the correct passcode value does not appear as a plaintext string in the built JS bundle
  4. The reviewer sees a list of submissions showing candidate name, timestamp, total score, and grade band for each entry
  5. The reviewer can read the raw SPL query and explanation text for any submission
  6. When leaderboard score submission fails (network error or non-OK response), the candidate sees a visible error message in the UI — the existing `submitToSheet` / `submitScore` path no longer fails silently with only a `console.warn`; zones 1–3 game behavior is otherwise unchanged
**Plans**: TBD
**UI hint**: yes

---

## Milestone v1.1 — SOC Investigation Overhaul + Email Fix

**Goal:** Make Zone 4 a realistic SOC investigation simulator with structured investigation context, scenario-tied prompts, progressive hints, human-readable scoring feedback — and fix manager email delivery.

### v1.1 Phases

- [x] **Phase 6: Data Enrichment** - Enrich socQuestions.js (Q1–Q4, Q5a, Q5b) with investigation context, SPL task prompts, and hints per question — the data foundation every v1.1 UI phase reads from
- [x] **Phase 7: GAS Email Fix** - Fix manager/reviewer email delivery in the Google Apps Script backend with quota checking, failure logging, and a documented re-authorization checklist
- [ ] **Phase 8: Hint Engine** - Add progressive hint reveal state to useSocState and build the HintPanel.jsx sub-component that surfaces hints post-first-submit
- [ ] **Phase 9: SOC Round Overhaul** - Restructure SocRound.jsx to display investigation context, analyst focus, expected outcomes, scenario-specific SPL prompts, and human-readable per-dimension feedback

## Phase Details

### Phase 6: Data Enrichment
**Goal**: Every SOC question in socQuestions.js carries structured investigation context (goal, analyst focus, expected outcomes), a scenario-specific SPL task prompt, and a progressive hint array — so all UI changes in Phases 8 and 9 read from real data, not placeholders
**Depends on**: Phase 5 (v1.0 complete)
**Requirements**: DATA-01, DATA-02
**Success Criteria** (what must be TRUE):
  1. All 6 SOC question objects (Q1–Q4, Q5a, Q5b) in `src/data/socQuestions.js` have an `investigation_context` object with `goal`, `analyst_focus`, and `expected_outcome` fields populated from the Splunk Query Context Explanations document
  2. All 6 questions have a `task_prompt` string that describes the specific SPL investigation task in one sentence (e.g., "Write an SPL query to find similar phishing emails and identify impacted recipients")
  3. All 6 questions have a `hints` array with at least 2 directional hint strings per question — hints guide without revealing exact SPL syntax (e.g., "Think about aggregation" not "use stats count")
  4. The enriched data file imports and exports cleanly with no runtime errors (no undefined field accesses when SocRound.jsx reads `question.investigation_context.goal`)
**Plans**: TBD

### Phase 7: GAS Email Fix
**Goal**: Manager and reviewer email notifications reliably deliver after SOC submissions, with quota-aware failure handling and a documented ops checklist so the delivery failure does not silently recur after redeploys
**Depends on**: Phase 5 (v1.0 complete; independent of Phases 6, 8, 9)
**Requirements**: EMAIL-01, EMAIL-02, EMAIL-03
**Success Criteria** (what must be TRUE):
  1. After a SOC submission, the configured manager/reviewer email address receives a notification email containing the candidate's name, score, and grade band
  2. When `MailApp.getRemainingDailyQuota()` returns 0, the GAS script logs a structured error (not a silent exception) and the `doPost` response includes an `emailStatus` field indicating delivery was skipped due to quota
  3. When email delivery fails for any reason (quota exhausted, MailApp scope not authorized, recipient invalid), the failure is written to the GAS Execution Log with enough detail to diagnose the root cause without accessing the Sheets data
  4. The GAS deployment checklist (in the repo as a `.md` or inline comment) documents the MailApp re-authorization step — specifically, that the GAS editor's "Run" button must be used to trigger the OAuth consent dialog after each new deployment
**Plans**: TBD

### Phase 8: Hint Engine
**Goal**: A candidate who has submitted at least once on a SOC question can request hints one at a time — the hint state lives in useSocState and HintPanel.jsx renders the progressively revealed list
**Depends on**: Phase 6
**Requirements**: HINT-01, HINT-02
**Success Criteria** (what must be TRUE):
  1. After a candidate submits their first answer on a SOC question, a "Get a hint" button becomes visible — it is not shown before the first submit attempt
  2. Each press of the hint button reveals exactly one additional hint from the question's `hints` array; pressing it again reveals the next, until all hints are shown
  3. When all hints for a question have been revealed, the hint button is replaced by a message indicating no more hints are available (e.g., "No more hints") — it does not error or loop
  4. Hint reveal state does not persist across questions — moving to the next question resets the hint index to 0
**Plans**: TBD
**UI hint**: yes

### Phase 9: SOC Round Overhaul
**Goal**: A candidate playing SocRound sees a structured investigation context block, a clear scenario-specific SPL task prompt, and receives human-readable per-dimension feedback labels that identify exactly what they scored on classification, SPL, and explanation
**Depends on**: Phase 6, Phase 8
**Requirements**: CTX-01, CTX-02, CTX-03, TASK-01, FDBK-01, FDBK-02
**Success Criteria** (what must be TRUE):
  1. Above the evidence panel, the candidate can read an investigation goal statement describing what the analyst needs to determine (sourced from `question.investigation_context.goal`)
  2. The candidate can see an analyst focus callout listing the specific indicators to look for in the evidence (sourced from `question.investigation_context.analyst_focus`)
  3. The candidate can see expected security outcomes describing what analyst actions should follow a confirmed finding (sourced from `question.investigation_context.expected_outcome`)
  4. A scenario-specific SPL task prompt appears above the query textarea (sourced from `question.task_prompt`) — the prompt changes per question and is not a generic instruction
  5. After submitting, the feedback panel displays three labeled sections — "Classification", "SPL Query", "Explanation" — each showing the points earned and a human-readable description of what was matched or missed (e.g., "SPL Query: 7/10 — matched core investigation terms, missed aggregation syntax")
  6. Zone 1–3 game flow remains fully unchanged — completing a zone 1–3 round still navigates through the existing ExplanationCard and ZoneComplete screens without any regressions
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9

Note: Phase 7 (GAS Email Fix) is independent of Phases 6, 8, 9 and can execute in parallel with Phase 6 if bandwidth allows.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Question Dataset | 1/1 | Complete | 2026-05-22 |
| 2. Validation and Scoring Utilities | 1/1 | Complete | 2026-05-22 |
| 3. State Machine and Hook | 1/1 | Complete | 2026-05-22 |
| 4. SOC Level UI | 1/1 | Complete | 2026-05-22 |
| 5. Backend and Reviewer View | 1/1 | Complete | 2026-05-22 |
| 6. Data Enrichment | 1/1 | Complete | 2026-05-25 |
| 7. GAS Email Fix | 1/1 | Complete | 2026-05-25 |
| 8. Hint Engine | 1/1 | Complete | 2026-05-25 |
| 9. SOC Round Overhaul | 1/1 | Complete | 2026-05-25 |

---

## Milestone v1.2 — Admin Panel

**Goal:** Replace the reviewer screen with a full admin panel giving assessors a unified view of all candidate submissions across all zones — with passcode-gated access, candidate management, answer sheet drill-downs, and downloadable reports.

### v1.2 Phases

- [ ] **Phase 10: GAS Backend** - Add the `getAdminData` endpoint to google-apps-script.js, reading Summary, RawData, and SOCData sheets in a single passcode-gated call and returning structured JSON
- [ ] **Phase 11: Admin Infrastructure** - Replace ReviewerScreen with a lazy-loaded AdminPanel entry point, wire the useAdmin hook and passcode gate into App.jsx, and add manual refresh
- [ ] **Phase 12: Candidate List** - Build the candidate table with search, sort, and grade-band filter — the primary list view every admin session starts from
- [ ] **Phase 13: Answer Sheet** - Build the candidate drill-down showing Zone 1-3 classification answers and Zone 4 SOC answers with SPL keyword annotations
- [ ] **Phase 14: Reports and Export** - Add CSV download of all submission data and per-candidate print-to-PDF via browser print dialog

## Phase Details

### Phase 10: GAS Backend
**Goal**: A single `getAdminData` GAS endpoint exists that reads all three data sheets, validates the passcode server-side, and returns structured JSON the React app can consume — establishing the data contract before any React code is written
**Depends on**: Phase 9 (v1.1 complete)
**Requirements**: GAS-01, GAS-02, GAS-03
**Plans**: 1 plan
**Success Criteria** (what must be TRUE):
  1. A POST to the GAS web app with `{ action: "getAdminData", passcode: "..." }` returns `{ candidates: [...], rawData: [...], socData: [...] }` when the passcode is correct
  2. A POST with an incorrect passcode returns `{ error: "Unauthorized" }` and no data — the passcode is validated via `PropertiesService` before any sheet is read
  3. Each candidate object in the response includes name, email, total score, grade band, submission date, and tab-switch count (proctoring flags)
  4. The endpoint reads Summary, RawData, and SOCData sheets in a single request — no client-side multi-fetch required to load the admin view

Plans:
- [ ] 10-01-PLAN.md — Extract checkPasscode() helper, refactor doGet, add getAdminData POST endpoint with passcode-gated 3-sheet read

### Phase 11: Admin Infrastructure
**Goal**: The admin panel is reachable from the app, lazy-loaded so candidates never download admin code, passcode-gated using the GAS endpoint, and capable of refreshing data on demand
**Depends on**: Phase 10
**Requirements**: ADMN-01, ADMN-02, ADMN-03, ADMN-04
**Success Criteria** (what must be TRUE):
  1. The existing reviewer screen entry point (passcode prompt on the landing page) now loads AdminPanel instead of ReviewerScreen — the reviewer screen component is fully replaced
  2. AdminPanel is imported via `React.lazy` — the admin bundle chunk is absent from the network waterfall when a candidate plays the game normally
  3. After entering the correct passcode, the admin sees the panel load with candidate data — the passcode is validated against the GAS endpoint, not a hardcoded string in the client
  4. An admin can click a "Refresh" button to re-fetch the latest submissions from Google Sheets without reloading the page
**UI hint**: yes

### Phase 12: Candidate List
**Goal**: An admin can see all candidates in a sortable, searchable, filterable table and identify at a glance who needs review — the primary landing view of every admin session
**Depends on**: Phase 11
**Requirements**: CAND-01, CAND-02, CAND-03, CAND-04, CAND-05
**Success Criteria** (what must be TRUE):
  1. The candidate table displays name, email, total score, grade band, submission date, and proctoring flag (tab-switch count) for every submission
  2. Typing in a search box instantly filters the table to rows where name or email contains the search string — no submit required
  3. Clicking a column header for score, date, or grade band sorts the table by that column; clicking again reverses the sort order
  4. A grade-band filter (Strong / Good / Needs improvement / Not ready / All) narrows the table to candidates in that band only
  5. Candidates with one or more tab-switch violations are visibly flagged — the proctoring count is displayed and distinguishable from clean submissions
**UI hint**: yes

### Phase 13: Answer Sheet
**Goal**: An admin can drill into any candidate's full submission record — seeing their exact Zone 1-3 classification answers and Zone 4 SPL query text with keyword annotations — to make a defensible hiring decision
**Depends on**: Phase 12
**Requirements**: ANS-01, ANS-02, ANS-03
**Success Criteria** (what must be TRUE):
  1. Clicking a candidate row opens their answer sheet showing each Zone 1-3 email with the candidate's L1/L2 picks, the correct answers, and points earned per email
  2. The answer sheet also shows each Zone 4 SOC question with the candidate's SPL query text, explanation text, and per-dimension scores (primary / secondary / SPL / explanation)
  3. Within each SOC answer, required SPL terms that were matched are highlighted in one color, optional matched terms in another, and missed required terms are called out — the admin can see exactly which keywords the candidate's query contained or lacked
  4. Navigating back from the answer sheet returns the admin to the candidate list with the previous search/filter/sort state intact
**UI hint**: yes

### Phase 14: Reports and Export
**Goal**: An admin can download a CSV of all submission data for offline analysis and generate a printable PDF report for any individual candidate via the browser's native print dialog
**Depends on**: Phase 13
**Requirements**: RPT-01, RPT-02
**Success Criteria** (what must be TRUE):
  1. Clicking "Download CSV" in the admin panel triggers a file download containing all candidate records — name, email, scores per dimension, grade band, submission date, and proctoring count — as a properly escaped CSV file
  2. The downloaded CSV opens correctly in Excel and Google Sheets — fields containing commas or quotes are properly quoted per RFC 4180
  3. Clicking "Print Report" on a candidate's answer sheet opens the browser print dialog with a print-optimised layout — the candidate's name, scores, and answer text are all visible and the game UI chrome (navigation, animations) is hidden via `@media print`
**UI hint**: yes

## v1.2 Progress

**Execution Order:**
Phases execute in numeric order: 10 → 11 → 12 → 13 → 14

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 10. GAS Backend | 0/1 | Planned | - |
| 11. Admin Infrastructure | 0/0 | Not started | - |
| 12. Candidate List | 0/0 | Not started | - |
| 13. Answer Sheet | 0/0 | Not started | - |
| 14. Reports and Export | 0/0 | Not started | - |
