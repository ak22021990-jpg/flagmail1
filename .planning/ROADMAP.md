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

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Question Dataset | 1/1 | Complete | 2026-05-22 |
| 2. Validation and Scoring Utilities | 1/1 | Complete | 2026-05-22 |
| 3. State Machine and Hook | 1/1 | Complete | 2026-05-22 |
| 4. SOC Level UI | 1/1 | Complete | 2026-05-22 |
| 5. Backend and Reviewer View | 1/1 | Complete | 2026-05-22 |
