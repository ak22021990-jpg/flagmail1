# Phase 13-01 Summary: Answer Sheet

**Date:** 2026-05-26
**Status:** Complete

## What Was Built

Built the candidate answer sheet drill-down view for the admin panel. Admins can click any candidate row, view all their Zone 1-3 classification answers and Zone 4 SOC investigation answers with SPL keyword highlighting, then return to the candidate list with search/filter/sort state intact.

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `src/components/AnswerSheet.jsx` | Created | Full candidate drill-down with Zone 1-3 answer review and Zone 4 SOC SPL keyword highlighting |
| `src/components/CandidateList.jsx` | Modified | Added `onSelectCandidate` callback prop (backward compatible, pointer cursor + hover on rows) |
| `src/components/AdminPanel.jsx` | Modified | Added `selectedCandidate` state and wired AnswerSheet with AnswerSheet import |

## Requirements Satisfied

| ID | Requirement | How Verified |
|----|------------|-------------|
| ANS-01 | Zone 1-3 answers with L1/L2 picks, correct answers, points per email | AnswerSheet filters rawData by candidate email, cross-references EMAIL_POOL for subject/fromName, shows candidate vs correct picks with check/cross indicators and points |
| ANS-02 | Zone 4 SOC answers with SPL text, explanation, per-dimension scores | AnswerSheet filters socData by candidate email, cross-references SOC_QUESTIONS for correct classification and SPL rules, shows score/grade per question |
| ANS-03 | SPL keyword annotations (required/optional matched, missed required) | `highlightSpl()` calls `validateSpl()`, renders required matched terms in green, optional matched in blue, missed required called out in red below query |
| ANS-03 (criterion 4) | Back preserves search/filter/sort state | AnswerSheet rendered via conditional return (not route change) — CandidateList never unmounts, useState values persist |

## Technical Decisions

- **SPL Highlighting:** `highlightSpl()` walks the original splText byte-by-byte against matched terms sorted longest-first to prevent substring overlap. Green background for required terms matched, blue for optional, red callout for missed required.
- **State preservation:** AnswerSheet conditionally renders inside AdminPanel's main return instead of as a separate route. CandidateList's `useState` values (search, sort, filter) persist because the component never unmounts — it's simply not in the render tree while AnswerSheet is visible.
- **Data sources:** RawData and SOCData arrays passed as props from AdminPanel (sourced from useAdmin). Client-side filtering by candidate email. Correct answers for Zone 1-3 from EMAIL_POOL; SPL rules for Zone 4 from SOC_QUESTIONS.
- **No new dependencies:** Zero npm packages added. All highlighting is manual string-walking with React's built-in safe rendering.

## Security

- SPL text and explanation rendered via React's JSX auto-escaping — no `dangerouslySetInnerHTML`
- All data sourced from GAS endpoint (already passcode-gated server-side)
- No new XSS or information disclosure surfaces
