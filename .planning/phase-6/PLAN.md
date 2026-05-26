# Phase 6 — Data Enrichment: Plan

## Goal
Enrich `socQuestions.js` with `investigation_context`, `task_prompt`, and `hints` fields per question — data foundation for Phases 8 and 9.

## Source
`Splunk Query Context Explanations.docx` "Platform-Aligned Structure" section extracted via Word COM.

## Tasks

### Task 1: Enrich socQuestions.js
**Files:** `src/data/socQuestions.js`

Add 3 fields to all 6 question objects (Q1, Q2, Q3, Q4, Q5a, Q5b):

**investigation_context object:**
- `goal` — one-sentence investigation goal from docx
- `analyst_focus` — array of 3-5 indicators to look for
- `expected_outcome` — array of 3-4 security actions

**task_prompt string:**
- One-sentence SPL investigation task from docx
- Q5a: correlation prompt (matches Q8 docx)
- Q5b: kill-chain prompt (advanced SPL from docx)

**hints array (2 items):**
- Hint 1: Evidence direction — what patterns to examine
- Hint 2: SPL approach — what commands/technique to consider (no exact syntax)

### Task 2: Update Documentation Naming
**Files:** `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`

Replace "Q1–Q4, Q8" references with "Q1–Q4, Q5a, Q5b" where they describe the dataset.

### Task 3: Verify
- `npm run lint` passes
- Node import `socQuestions.js` resolves cleanly (no parse errors)
- Run `npm test` to confirm no regression

## Wave Plan
**Wave 1 (parallel):** Task 1 + Task 2 + Task 3 verification prep

## Risks
- LOW: Typo in new field names. Mitigation: verify exact property access paths match Phase 8/9 expectations.
- NONE: No runtime risk — new fields are additive; no component reads them yet (Phases 8 + 9).
