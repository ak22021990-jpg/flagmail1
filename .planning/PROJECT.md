# FlagMail — SOC Assessment Platform

## What This Is

FlagMail (flagmail1) is a browser-based security-awareness training and assessment tool where
candidates classify suspicious emails across three escalating zones, then complete a SOC
Investigation level writing Splunk SPL queries and explanations against log evidence. An
admin panel gives assessors a unified dashboard with score overviews, candidate management,
answer sheet drill-downs, and downloadable CSV/PDF reports across all zones.

## Core Value

A candidate can complete a realistic SOC investigation — classify the threat, write a
working SPL query, and explain their reasoning — and get an automatic, defensible score
plus feedback that an admin/reviewer can trust and act on from a unified panel.

## Requirements

### Validated

- ✓ Email classification game with L1/L2 category pickers — existing
- ✓ Three escalating zones with intro cards, rounds, and zone-complete summaries — existing
- ✓ Progressive clue reveal system per email — existing
- ✓ Countdown timer per round — existing
- ✓ Badge unlock system with toasts and badge collection view — existing
- ✓ Scoring engine with per-email records and category accuracy — existing
- ✓ Leaderboard backed by Google Apps Script + Google Sheets — existing
- ✓ Player registration (name/email) with duplicate-attempt check — existing
- ✓ Results screen with competency summary and rank — existing
- ✓ SOC Investigation zone (Zone 4) with 6 questions, SPL query input, explanation input — v1.0
- ✓ SPL keyword validation (required/optional/blocked terms with anyOf) — v1.0
- ✓ 23-point scoring model (Primary 5 / Secondary 3 / SPL 10 / Explanation 5) — v1.0
- ✓ SOC submissions pushed to Google Sheets (SOCData sheet) — v1.0
- ✓ Passcode-gated reviewer view reading from Google Sheets — v1.0
- ✓ Investigation context per SOC question (goal, analyst focus, expected outcomes) — v1.1
- ✓ Scenario-specific SPL task prompts — v1.1
- ✓ Progressive hint engine (post-first-submit, per-question) — v1.1
- ✓ Human-readable per-dimension feedback (classification, SPL, explanation) — v1.1
- ✓ GAS email notifications with quota-aware error handling — v1.1

### Active

<!-- This milestone: Admin Panel (v1.2) -->

- [ ] Admin panel replaces the existing reviewer screen as a unified assessment management view
- [ ] Score overview dashboard showing total submissions, average scores, grade band distribution, and pass/fail rates across all zones
- [ ] Full answer sheet view displaying each candidate's exact classification picks, SPL query text, explanation text, and per-dimension scores
- [ ] CSV export of submission data for offline review
- [ ] PDF report generation per candidate or summary
- [ ] Candidate management with search/filter and individual history across attempts
- [ ] Admin panel shows data from both classification zones (1-3) and SOC Investigation (Zone 4)

### Out of Scope

- Folding `Sample questions(1).xlsx` emails into the existing classification zones — separate effort, deferred
- User accounts / identity provider — shared passcode is sufficient; full auth is too large for the current app
- Real Splunk query execution against a live or mock backend — keyword validation is the chosen fidelity level
- LLM / AI semantic grading of SPL or explanations — keyword and concept matching only
- Rewriting the existing three zones — purely additive changes only
- Real-time collaboration / live admin notifications — static data refresh is sufficient for v1.2
- Excel (XLSX) export — CSV and PDF cover reporting needs

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
| Reviewer view is a passcode-gated in-app route reading from Google Sheets | App has no auth; passcode is the lightest way to gate reviewer-only data | ✓ Good |
| SOC questions stored as a new static dataset | Matches existing `emails.js` pattern; no API dependency during play | ✓ Good |
| xlsx email bank deferred to v2 | Keeps this milestone focused on the SOC level | ✓ Good |
| Admin panel replaces reviewer screen | One unified entry point; no need for separate reviewer and admin flows | — Pending |
| Same shared passcode for admin access | Consistent with existing auth model; no new auth infrastructure needed | — Pending |
| CSV + PDF for report downloads | Covers spreadsheet and printable use cases without requiring XLSX library | — Pending |
| Implementation with OpenCode + claude-sonnet-4-6 | Best coding model for complex implementation; Opus for planning | — Pending |

## Current Milestone: v1.2 Admin Panel

**Goal:** Replace the reviewer screen with a full admin panel that gives assessors a unified view of all candidate submissions across all zones, with dashboards, reports, answer sheets, and candidate management.

**Target features:**
- Score overview dashboard with summary stats, grade band distribution, pass/fail rates
- Full answer sheet view showing candidate's exact answers (classification, SPL, explanation)
- CSV and PDF report downloads for offline review or sharing
- Candidate management with search/filter and individual history
- Unified admin entry point replacing the existing reviewer screen
- Data from both Zones 1-3 (classification) and Zone 4 (SOC Investigation)

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
*Last updated: 2026-05-26 after milestone v1.2 initialization*
