# Phase 12-01 Summary: Candidate List

**Date:** 2026-05-26
**Status:** Complete

## What Was Built

Extracted the inline candidate table from AdminPanel.jsx into a standalone CandidateList.jsx component with full search, sort, filter, and proctoring display.

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `src/components/CandidateList.jsx` | Created | Standalone candidate table with search, sort, grade-filter, proctoring display |
| `src/components/AdminPanel.jsx` | Modified | Replaced inline candidate table (32 lines) with `<CandidateList candidates={candidates} />` |

## Features Implemented

- **Search (CAND-02):** Instant text filtering by name or email — no submit button. Uses `useMemo` for zero-render-delay filtering.
- **Sort (CAND-03):** Clickable Score/Grade/Date column headers with ▲/▼ direction toggles. Grade sorted by custom order (strong > good > needs improvement > not ready).
- **Grade filter (CAND-04):** Filter chips for All / Strong / Good / Needs improvement / Not ready. Exclusive selection, active chip highlighted. Click active to deselect.
- **Proctoring (CAND-05):** New "Proctoring" column. Flag (⚠) + red count for violations > 0; em-dash in muted color for clean candidates.
- **Table (CAND-01):** All 6 columns displayed — Name, Email, Score, Grade, Date, Proctoring.
- **Empty states:** "No candidates yet." when data empty; "No candidates match your search or filter." when filtered empty.

## Data Access

Uses positional indices with named fallbacks (matching existing AdminPanel pattern):
- `[0] || .name` → Name
- `[1] || .email` → Email
- `[6] || .totalScore || .score` → Score
- `[7] || .grade` → Grade
- `[2] || .date || .timestamp` → Date
- `[8] || .tabSwitches || .proctoring || .tabSwitchCount || 0` → Proctoring

## Edge Cases Covered

- Search + filter combine (intersection)
- Sort applies to filtered results
- Empty candidate array shows empty state, hides search/filter
- Missing data uses `||` fallbacks
- Unknown grade values default to red
- Proctoring undefined → treated as 0

## Build Verification

```
dist/assets/AdminPanel-zqTZHw3o.js  12.80 kB  (lazy chunk)
dist/assets/index-WVVSmd3t.js     1183.91 kB  (main bundle)
dist/assets/index-BZQrKwzP.css       4.97 kB
```

- `npm run build` succeeds with zero errors
- AdminPanel chunk size: 9.58 → 12.80 kB (+3.22 kB for new features)

## Requirements Verified

- [x] **CAND-01:** Candidate table with 6 columns displayed
- [x] **CAND-02:** Instant search by name or email (no submit required)
- [x] **CAND-03:** Sortable Score, Grade, Date columns with ▲/▼ indicators
- [x] **CAND-04:** Grade-band filter chips — All / Strong / Good / Needs improvement / Not ready
- [x] **CAND-05:** Proctoring violation flags with count displayed in red for > 0

## Decisions Made

- Extracted `gradeColor()` into CandidateList (duplicated from AdminPanel) — avoids import cycle or shared utility overhead for a 6-line function
- `exact` search (not fuzzy) — instant filtering makes fuzzy overkill; `toLowerCase().includes()` is zero-cost
- No debounce on search — `useMemo` handles it efficiently for small-medium candidate lists
- Grade sort uses custom order map, not alphabetic — "strong" > "good" > "needs improvement" > "not ready"
- Column headers only sortable on Score/Grade/Date — Name, Email, Proctoring are not sortable (no meaningful sort order)
