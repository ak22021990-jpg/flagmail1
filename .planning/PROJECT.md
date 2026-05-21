# FlagMail — SOC Investigation Level

## What This Is

FlagMail (flagmail1) is a browser-based security-awareness training game where players
classify suspicious emails — phishing, BEC, spam, malware — across three escalating zones,
using progressive clues, a countdown timer, badges, and a leaderboard. This milestone adds
a **fourth zone: a SOC Investigation level** where candidates go beyond classification to
write **Splunk SPL queries** and explanations against log evidence, scored automatically and
surfaced to a reviewer. It turns FlagMail from a classification quiz into an entry-level
SOC-analyst assessment tool.

## Core Value

A candidate can complete a realistic SOC investigation — classify the threat, write a
working SPL query, and explain their reasoning — and get an automatic, defensible score
plus feedback that a reviewer can trust.

## Requirements

### Validated

<!-- Inferred from existing flagmail1 codebase (see .planning/codebase/). -->

- ✓ Email classification game with L1 (primary) and L2 (secondary) category pickers — existing
- ✓ Three escalating zones with intro cards, rounds, and zone-complete summaries — existing
- ✓ Progressive clue reveal system per email — existing
- ✓ Countdown timer per round — existing
- ✓ Badge unlock system with toasts and a badge collection view — existing
- ✓ Scoring engine with per-email records and category accuracy — existing
- ✓ Leaderboard backed by a Google Apps Script + Google Sheets web app — existing
- ✓ Player registration (name/email) with duplicate-attempt check — existing
- ✓ Results screen with competency summary and rank — existing

### Active

<!-- This milestone: the SOC Investigation level. -->

- [ ] A new fourth zone ("SOC Investigation") appears after the existing three zones, leaving the existing game flow unchanged
- [ ] The level ships with ~5 investigation questions sourced from `Splunk Questions.docx` (Q1–Q4 and the multi-stage Q8)
- [ ] Each question presents a scenario plus log evidence (email / proxy / EDR details)
- [ ] Candidate picks a primary classification and a secondary diagnosis from question-specific option sets
- [ ] Candidate writes a Splunk SPL query in a plain multi-line text editor
- [ ] Candidate writes a free-text explanation of their reasoning
- [ ] The SPL query is validated by keyword matching — required terms present, optional terms credited, blocked terms penalized — with no query execution
- [ ] The explanation is validated against expected concept keywords
- [ ] Each question is scored on a 23-point model: Primary 5, Secondary 3, SPL 10, Explanation 5
- [ ] The candidate sees a per-question pass/fail result with feedback and an overall grade band (Strong 20–23 / Good 15–19 / Needs improvement 10–14 / Not ready below 10)
- [ ] SOC Investigation submissions (answers, SPL text, scores, feedback) are pushed to Google Sheets via the existing Apps Script backend
- [ ] A passcode-gated reviewer view (separate in-app route) lists submissions with scores and feedback, read from the Google Sheet

### Out of Scope

- Folding `Sample questions(1).xlsx` emails into the existing classification zones — separate effort, deferred to v2
- Reviewer login / user accounts — a shared passcode is sufficient for v1; full auth is a large addition to a currently auth-free app
- Real Splunk query execution against a live or mock backend — keyword validation is the chosen fidelity level
- LLM / AI semantic grading of SPL or explanations — keyword and concept matching only for v1
- Rewriting the existing three zones — the SOC level is purely additive

## Context

- **Existing app**: React 19 + Vite 7 single-page app. Custom screen state machine in
  `useGameState` (no router) — screens advance LANDING → TUTORIAL → ZONE_INTRO → ROUND →
  EXPLANATION → ZONE_COMPLETE → RESULTS, looping zones until zone 3.
- **No TypeScript, no CSS framework, no state library, no test framework** — plain
  `.jsx`/`.js`, CSS variables, `useState`/`useCallback` hooks.
- **Backend**: Google Apps Script web app (public, no auth). Two sheets — Summary and
  RawData. `register` and `submit` POST actions; `checkEmail` GET. The SOC level will
  need an additional sheet and action for SPL submissions.
- **Question content**: existing emails are static in `src/data/emails.js`. The SOC
  questions and their validation rules (classification answers, required/optional/blocked
  SPL terms, expected concepts) will be authored as a new static dataset.
- **Source documents**: `Splunk Questions.docx` (question content + validation keywords),
  `Splunk.md` (automation flow and scoring model). Both live in the repo root.
- The existing codebase is mapped under `.planning/codebase/` and indexed by GitNexus.

## Constraints

- **Tech stack**: Stay within React 19 + Vite + plain JS — no new framework, router, or
  state library; match existing hook/component conventions.
- **Backend**: Reuse the existing Google Apps Script + Sheets integration — no new backend service.
- **Compatibility**: The existing three zones and their scoring/badges/leaderboard must keep working unchanged.
- **Validation**: SPL and explanation scoring must be deterministic (keyword/concept matching) — no external API dependency at grade time.
- **Auth**: Reviewer access is a shared passcode only — no identity provider.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| SOC content is a new 4th zone, not a redesign | Preserves the working classification game; layers the harder skill on top | — Pending |
| SPL entered as plain text, validated by keyword matching | Deterministic, no backend execution, matches the docx's stated validation approach | — Pending |
| 23-point scoring model per SOC question | Specified directly in `Splunk.md` (Primary 5 / Secondary 3 / SPL 10 / Explanation 5) | — Pending |
| Reviewer view is a passcode-gated in-app route reading from Google Sheets | App has no auth; passcode is the lightest way to gate reviewer-only data | — Pending |
| SOC questions stored as a new static dataset | Matches existing `emails.js` pattern; no API dependency during play | — Pending |
| xlsx email bank deferred to v2 | Keeps this milestone focused on the SOC level | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-21 after initialization*
