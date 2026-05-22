# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-21)

**Core value:** A candidate can complete a realistic SOC investigation — classify the threat, write a working SPL query, and explain their reasoning — and get an automatic, defensible score plus feedback that a reviewer can trust.
**Current focus:** Phase 1 — Question Dataset

## Current Position

Phase: 1 of 5 (Question Dataset)
Plan: 0 of TBD in current phase
Status: Ready to plan
Last activity: 2026-05-22 - Completed quick task 260522-uez: Finalize zone 4 SOC integration (/100 scoring, email results with CSV, fix Sheets)

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: —
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Roadmap: SOC content is a new 4th zone — purely additive, zones 1–3 untouched
- Roadmap: SPL validation is client-side keyword matching (no query execution, no LLM)
- Roadmap: Reviewer passcode validated server-side via GAS PropertiesService — NOT in client bundle
- Roadmap: `anyOf` term structure baked into validateSpl from day one (Phase 2), not retrofitted
- Roadmap: SocClassifier built as new component — Classifier.jsx never modified
- Roadmap revision: HARD-01 (Vitest unit tests for validateSpl/scoreSocRound) → Phase 2
- Roadmap revision: HARD-02 (visible error on leaderboard submit failure) → Phase 5; touch is minimal and must not alter zone 1–3 game behavior
- Roadmap revision: HARD-03 (flagmail1/ canonical / flagmail/ deprecated docs note) → Phase 1

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 1: Term-list quality requires human domain review of each question's required/blocked terms against plausible stuffing attempts before phase can close
- Phase 1: Q8 multi-stage flattening requires a content design decision on how to split into sequential sub-questions
- Phase 5: GAS CORS for reviewer GET must be manually browser-tested in Chrome and Firefox (fix is known; verification is required)
- Phase 5: Reviewer passcode must be set via GAS Script Properties after deploy — not in source; this ops step must be documented in Phase 5 plan

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260522-5to | Add detect-and-flag proctoring (tab/window switch detection) to timed game rounds | 2026-05-21 | 86c5535 | [260522-5to-add-detect-and-flag-proctoring-tab-windo](./quick/260522-5to-add-detect-and-flag-proctoring-tab-windo/) |
| 260522-uez | Finalize zone 4 SOC integration: /100 scoring, email results with CSV, fix Sheets | 2026-05-22 | 6b0012a | [260522-uez-finalize-zone-4-soc-integration-100-scor](./quick/260522-uez-finalize-zone-4-soc-integration-100-scor/) |

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Content | Fold Sample questions(1).xlsx into existing zones (CONT-01) | v2 | Roadmap creation |
| UX | Hint per question (HINT-01) | v2 | Roadmap creation |
| UX | Worked-solution reveal (HINT-02) | v2 | Roadmap creation |
| Reviewer | Per-question drill-down (REVW-05) | v2 | Roadmap creation |
| Reviewer | Filter/sort submissions (REVW-06) | v2 | Roadmap creation |
| Gamification | SOC Investigation badge (BADGE-01) | v2 | Roadmap creation |

## Session Continuity

Last session: 2026-05-22
Stopped at: Roadmap revised; HARD-01..03 folded into existing phases; all 26 v1 requirements now mapped; ready to plan Phase 1
Resume file: None
