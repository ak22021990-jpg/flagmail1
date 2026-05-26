# Feature Landscape

**Domain:** Assessment Admin Panel — Candidate Score Management, Answer Review, and Reporting
**Milestone:** FlagMail v1.2 Admin Panel (replaces existing passcode-gated reviewer screen)
**Researched:** 2026-05-26
**Confidence:** HIGH — grounded in analysis of HackerRank, TestGorilla, KnowBe4, Proofpoint SAT,
TryHackMe instructor dashboards, education assessment dashboards (Bold BI, Utah Grade Summary),
and direct inspection of the existing ReviewerScreen.jsx, GAS backend, and Google Sheets schema.

---

## Scope Note

This document covers only the admin panel dimension of v1.2. The candidate-facing game (Zones 1-3,
Zone 4 SOC) and the Google Sheets backend are already built. The admin panel replaces the existing
`ReviewerScreen.jsx` (currently SOC-submissions-only, passcode-gated, expand-to-see-SPL).

### What already exists (do not rebuild, extend instead)

- Passcode entry gate with GAS passcode validation
- SOC submission list: name, email, timestamp, per-question grade badges, expand-to-SPL
- GAS `getSOCSubmissions` action — returns grouped rows from SOCData sheet
- GAS Summary sheet with: Timestamp, Name, Email, Status, Score, Display Score, Tier,
  Zone 1–3 scores, Proctoring Violations, Zone 4 (SOC), Final Score /100
- GAS SOCData sheet with: Timestamp, Name, Email, Question ID, Score, Grade, SPL Text,
  Explanation, Proctoring Violations
- Email notification with HTML body + CSV attachment on final submission

### What v1.2 adds

Unified admin panel that surfaces both classification (Zones 1-3, from Summary sheet) and SOC
(Zone 4, from SOCData sheet) in a single view with dashboard stats, candidate drill-downs,
and downloadable reports.

---

## Table Stakes

Features an assessor or hiring manager expects from any assessment management tool. Missing any
of these and the tool fails the credibility test — reviewers will fall back to checking the raw
Google Sheet directly.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Score overview dashboard | Every assessment platform (HackerRank, TestGorilla, KnowBe4, Proofpoint SAT) leads with a summary view: total submissions, average score, pass/fail rates. Assessors can't act on a raw list. | MEDIUM | Computed client-side from fetched submission data. Cards for: total submissions, average final score, pass rate (>= threshold), grade band distribution (Foundation / Proficient / Advanced). |
| Grade band distribution display | Assessors need to see at a glance how the cohort is spread — not just individual scores. All education dashboards (Bold BI, Utah Grade Summary) lead with distribution. | LOW | Simple visual breakdown: X% Foundation, Y% Proficient, Z% Advanced. Inline bar or proportional strip — no charting library required. |
| Candidate list with sortable columns | A flat list sorted by submission time is unusable for any cohort > 10. TestGorilla and HackerRank both allow sort by score, name, date. | MEDIUM | Sort by: name (alpha), final score, submission time. Client-side sort on fetched data. No pagination for v1.2 (Google Sheets caps at a few hundred rows before performance degrades anyway). |
| Search / filter by candidate name or email | Assessors frequently need to find a specific candidate. All assessment platforms include this. Currently missing from ReviewerScreen.jsx. | LOW | Client-side text filter on name + email. Clears on empty. No server round-trip needed. |
| Full answer sheet drill-down | Reviewers need to see exactly what a candidate submitted — classification picks, SPL query text, explanation text — alongside scores. Currently ReviewerScreen.jsx shows SPL text but not classification answers or explanation text. | MEDIUM | Expand panel per candidate. Show for each SOC question: question ID, primary answer selected + correct answer, secondary answer + correct, SPL text (monospace), explanation text, per-dimension score breakdown. |
| Zone 1-3 classification data visible | Current reviewer screen shows only SOC (Zone 4). The Summary sheet already stores Zone 1-3 scores. Assessors need a complete picture. | MEDIUM | Requires a second GAS action (`getClassificationSummary`) that reads the Summary sheet. Show per-zone scores (Zone 1, 2, 3 out of 20 each) plus total classification score. |
| Final score display with tier label | Assessors communicate results in tiers (Foundation / Proficient / Advanced), not raw numbers. The email notification already does this. The admin panel must match. | LOW | Show: Final score /100, Tier label, per-zone breakdown. Data already in Summary sheet. |
| Proctoring violations flag | Assessors treat proctoring violations as a reliability signal. Hidden violations create fairness problems. Currently not surfaced in ReviewerScreen.jsx. | LOW | Show violations count per candidate, highlighted in amber/red if > 0. Data already in both Summary and SOCData sheets. |
| CSV export of submission data | Industry standard for offline review, sharing with HR, or importing into spreadsheets. TestGorilla, HackerRank, and every enterprise LMS include this. | LOW | Client-side CSV generation from fetched data. Use the same `csvEscape` pattern already in GAS. No library needed — `Blob` + `URL.createObjectURL` + `<a download>` pattern. Export filtered view if filter is active. |
| PDF report per candidate | Hiring managers and compliance teams file candidate reports as PDFs. Assessment platforms (HackerRank, Proofpoint SAT) provide printable per-candidate reports. | MEDIUM | Use jsPDF (30K stars, 2.6M weekly downloads, no server needed). One-page candidate report: name, date, final score, tier, zone breakdown, SOC question summary. Not full answer text — that's the answer sheet. |
| Data refresh without full page reload | Assessors open the admin panel at start of a review session and may check for late submissions. A manual refresh button is the minimum. | LOW | "Refresh data" button that re-fetches from GAS. No auto-poll (respects GAS quota). |

---

## Differentiators

Features that make the admin panel genuinely useful beyond compliance, without requiring a
backend rewrite. Each is achievable within the React 19 + plain JS + GAS constraint set.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Cohort comparison strip (score distribution) | Assessors making hiring decisions need to rank candidates relative to the cohort, not just against an absolute threshold. HackerRank provides percentile scores; this is a lightweight equivalent. | LOW | Horizontal bar per candidate in the list showing their score relative to min/max/median of the cohort. Pure CSS, computed client-side. No charting library. |
| Per-dimension SOC breakdown in summary list | Seeing "SOC: 62/100" doesn't tell a reviewer whether the candidate can write SPL but cannot classify — or vice versa. Question-level grade badges already exist in ReviewerScreen.jsx. Surfacing them in the list (not just expanded view) lets reviewers scan without drilling into every candidate. | LOW | Show grade band badges per SOC question (Q1–Q6) inline in the candidate row — exactly what ReviewerScreen.jsx already renders in the expand panel, pulled up to the summary row. |
| Filter by grade band | Assessors often want to review only "Needs Improvement" candidates or only "Strong" candidates. None of this exists today. | LOW | Dropdown filter: All / Foundation / Proficient / Advanced. Client-side. Combines with name/email search. |
| Filter by date range | When running a multi-day assessment window, assessors want to see only "today's" submissions or a specific intake batch. | LOW | Date range picker (two `<input type="date">`) applied client-side against timestamp. |
| Exportable filtered view | When the admin filters by grade band or date range, the CSV export should reflect the filtered set, not the full dataset. Assessors share cohort-specific exports with managers. | LOW | Derive export from the same filtered array used for rendering. No extra logic. |
| Summary stats that update on filter | Stats (total, average, pass rate, distribution) should recompute when a filter is active so the assessor understands the filtered cohort, not the full set. | LOW | `useMemo` on filtered array. Consistent with how existing hooks compute derived state. |
| Candidate history across multiple attempts | FlagMail prevents re-attempts via `checkEmail`, but the Summary sheet may have multiple rows for the same email if a candidate was manually allowed to retry. Showing attempt history per candidate avoids confusion. | MEDIUM | Group by email on the client side. Show most recent attempt prominently, prior attempts collapsed. Requires the GAS `getClassificationSummary` action to return all rows (not just unique emails). |
| SPL quality signal in answer sheet | Reviewers who are not SPL experts cannot easily judge whether a query is good or poor. A visual signal (which required terms were hit, which were missed, whether any blocked terms appear) gives non-technical reviewers a defensible basis for the score. | MEDIUM | In the drill-down answer sheet, annotate the SPL text with which required terms were matched. This requires the keyword match data to be stored in Sheets or re-evaluated client-side. Re-evaluation client-side is viable: import `validateSpl.js` in the admin component and re-run it against the stored SPL text using the `socQuestions.js` rules. No additional GAS changes needed. |

---

## Anti-Features

Features explicitly NOT to build for a Google-Sheets-backed SPA at this scale. Documented to
prevent scope creep and to explain why reasonable-sounding ideas were rejected.

| Anti-Feature | Why Requested | Why Not for This Context | What to Do Instead |
|--------------|---------------|--------------------------|-------------------|
| Real-time auto-refresh / live updates | Assessors running a live cohort want to see submissions appear automatically | GAS `fetch` is quota-bound (~20k calls/day for free). Auto-polling every 30s with 10 admins would exhaust the quota within hours. GAS does not support WebSockets or push. | Manual "Refresh data" button with timestamp showing last fetch time. |
| Role-based access / multiple reviewer accounts | Enterprise request: some reviewers should see only their cohort, others see all | Full auth is a separate service (OAuth, Supabase, Firebase Auth, etc.) that does not fit the GAS + no-backend constraint. Explicitly out of scope in PROJECT.md. | Single shared passcode. If cohort isolation is needed, deploy separate FlagMail instances per cohort. |
| In-app manual score override / grading | Reviewers may want to override an automated score | Requires a PATCH endpoint in GAS (write back to Sheets), complex optimistic-update state, audit trail. GAS write-back is fragile under concurrent access. | Reviewer notes to themselves are sufficient; override in the Google Sheet directly. |
| Bulk email / notification dispatch from admin panel | HR wants to send result emails to all candidates from the admin view | MailApp quota is already used for submission notifications. A blast-send tool would exhaust the quota. Adding a second MailApp caller doubles the risk. | The existing per-submission email notification on submitFinal is the delivery mechanism. |
| Inline question editing / assessment authoring | Admin wants to add or change SOC questions from the panel | Question data is static in `socQuestions.js`. Hot-editing questions would require a CMS, versioned dataset, and migration path for scores — none of which exist. | Edit `socQuestions.js` directly and redeploy. |
| Custom grade thresholds UI | Assessors want to set their own pass/fail cutoff per cohort | Threshold logic is baked into `scoreSoc.js`. A settings UI without persisting the threshold to Sheets creates inconsistency between what the candidate sees and what the admin sees. | Expose threshold as a constant in `src/config/game.js`. Change by code + redeploy. |
| Leaderboard integration in admin panel | Competitive ranking visible to admins | SOC zone is assessment-not-competition. Leaderboard mixes classification scores with SOC scores in incompatible ways. | Show ranked list in admin panel by final score. That is sufficient for comparative review. |
| XLSX / Excel export | Some managers prefer XLSX with multiple sheets | Adds a ~170KB library (SheetJS) for marginal gain over CSV. CSV opens in Excel natively. Excel is explicitly excluded in PROJECT.md. | CSV export. Assessors can open CSV in Excel with no data loss. |
| Candidate self-service portal (view own results) | Candidates want to see their score after submission | Candidates already see a full Results screen at the end of the game. An additional authenticated portal requires user accounts. | The existing Results screen + per-submission email is the candidate-facing result delivery. |
| Pagination of candidate list | Handles very large datasets gracefully | The Google Sheets backend becomes unreliable beyond ~500 rows before GAS script timeout (6-minute limit). Pagination beyond 200 candidates is premature optimization for a tool used in discrete cohort-sized batches. | Client-side rendering of all fetched rows is fine for expected cohort sizes (< 100 per intake). |
| Analytics over time (trend charts, cohort comparison over months) | CISO-level reporting | Requires time-series data storage, chart libraries (Chart.js, D3), and a data model not in Sheets today. Out of scope for a hiring-cycle assessment tool. | Export CSV for each cohort; compare in Excel or Sheets natively. |

---

## Feature Dependencies

```
GAS getClassificationSummary action (NEW)
    └──required-by──> Zone 1-3 score display in admin panel
    └──required-by──> Candidate history across attempts (grouped by email)
    └──required-by──> Final score + tier from Summary sheet
    └──required-by──> Proctoring violations from Summary sheet

GAS getSOCSubmissions action (EXISTING — already works)
    └──required-by──> SOC answer sheet drill-down
    └──required-by──> Per-question grade badges
    └──required-by──> SPL quality signal (re-validate client-side)
    └──required-by──> SOC per-question breakdown in summary list

Both GAS actions fetched on passcode unlock
    └──merged-into──> Unified candidate record (join on email + timestamp)
                          └──feeds──> Score overview dashboard (computed stats)
                          └──feeds──> Candidate list with sort/filter
                          └──feeds──> CSV export
                          └──feeds──> PDF per-candidate report

socQuestions.js (static import in admin component)
    └──required-by──> SPL quality signal (re-run validateSpl client-side)
    └──no-server-needed──> Annotate stored SPL text against known rules

jsPDF (new dependency, ~100KB gzipped)
    └──required-by──> PDF per-candidate report
    └──load-on-demand──> Import only when admin triggers PDF export (code split)
```

### Key Dependency Notes

- **A new GAS action is required.** The existing `getSOCSubmissions` reads only SOCData.
  `getClassificationSummary` must read the Summary sheet and return all rows (not just the
  most recent per email) to support attempt history. This is the only backend change for v1.2.

- **Join happens client-side.** Classification data (Summary sheet) and SOC data (SOCData sheet)
  are joined by email address + timestamp proximity in the browser. This avoids a server-side join
  and keeps GAS logic simple.

- **validateSpl re-runs client-side.** The SOCData sheet stores only the final SPL text and
  keyword-match scores as numbers. To show which keywords were hit/missed in the answer sheet,
  the admin component imports `validateSpl.js` and `socQuestions.js` directly and re-evaluates.
  This is pure JS — no new API calls.

- **jsPDF must be lazy-loaded.** It is ~100KB gzipped. Loading it eagerly adds to the main
  bundle for a feature used rarely. Dynamic `import('jspdf')` triggered only when "Download PDF"
  is clicked avoids this cost.

- **CSV export has zero new dependencies.** It uses the existing `csvEscape` pattern and the
  browser's native `Blob` + `URL.createObjectURL`. No library.

- **Filter and sort are stateless UI operations.** They operate on the already-fetched data
  array in component state. No new GAS calls on filter change.

---

## MVP Definition

### v1.2 Launch (this milestone) — Must Have

All table stakes features. The admin panel must replace the existing reviewer screen and
be strictly better in every way the reviewer screen currently works, while adding the
cross-zone view that assessors actually need.

- [ ] Score overview dashboard: total submissions, average final score, pass rate, grade band distribution
- [ ] Candidate list with sort (name, score, date) and search (name/email)
- [ ] Full answer sheet drill-down: classification picks vs correct, SPL text, explanation text, per-dimension scores
- [ ] Zone 1-3 scores visible per candidate (requires new GAS action)
- [ ] Final score + tier label per candidate
- [ ] Proctoring violations surfaced per candidate
- [ ] CSV export (full dataset + filtered view)
- [ ] PDF per-candidate report (jsPDF, lazy-loaded)
- [ ] Manual data refresh button with last-fetched timestamp
- [ ] Filter by grade band and date range

### After Validation (v1.2.x) — Should Have

- [ ] Cohort comparison strip in candidate list
- [ ] Summary stats update dynamically when filter is active
- [ ] SPL quality signal (keyword hit/miss annotation in answer sheet)
- [ ] Candidate history across attempts (grouped by email)

### Future (v2+) — Could Have

- [ ] Exportable comparison report across multiple cohorts
- [ ] Per-question analytics (which question trips up candidates most)
- [ ] Configurable pass/fail threshold without code change

---

## Reference Platform Analysis

| Feature | HackerRank | TestGorilla | KnowBe4 SAT | Proofpoint SAT | FlagMail v1.1 Reviewer | FlagMail v1.2 Target |
|---------|------------|-------------|-------------|----------------|------------------------|----------------------|
| Score overview dashboard | Yes | Yes | Yes | Yes | No (list only) | Yes |
| Grade band distribution | Yes | Percentile | RAG distribution | Risk score distribution | No | Yes (Foundation/Proficient/Advanced) |
| Candidate search/filter | Yes | Yes | Yes | Yes | No | Yes |
| Sort by score/name/date | Yes | Yes | Yes | Yes | No | Yes |
| Answer sheet drill-down | Code review UI | Question-by-question | Not applicable | Not applicable | SPL text only | Full: classification + SPL + explanation |
| Cross-zone score view | N/A (single assessment) | N/A | Training modules | Campaign modules | SOC only | Zones 1-3 + Zone 4 |
| Proctoring flags | Yes (anti-cheat flags) | Yes (anti-cheat) | No | No | No | Yes |
| CSV export | Yes | Yes | Yes | Yes | No | Yes |
| PDF per-candidate | Yes | Yes | Yes | Yes | No (CSS print only in v1.1) | Yes (jsPDF) |
| Cohort comparison | Percentile rank | Percentile rank | Benchmarking | Industry benchmark | No | Lightweight (relative bar) |
| Role-based access | Yes | Yes | Yes | Yes | Shared passcode | Shared passcode (unchanged) |
| Real-time updates | Yes | Yes | Yes | Yes | No | No (manual refresh) |

---

## Sources

- HackerRank admin dashboard and answer review features: https://www.hackerrank.com/writing/hackerrank-vs-testgorilla-technical-screening-2025-pricing-features
- TestGorilla dashboard and filter features: https://www.testgorilla.com/blog/testgorilla-vs-hackerrank/
- KnowBe4 SAT Console Reporting Overview: https://support.knowbe4.com/hc/en-us/articles/360033951614-Security-Awareness-Training-Console-Reporting-Overview
- Proofpoint CISO Dashboard reporting: https://www.proofpoint.com/us/products/security-awareness-training/security-awareness-reporting
- Assessment platform features for candidate screening: https://www.canditech.io/blog/assessment-platform-features-for-candidate-screening/
- TopScore Technologies dashboard (assessment centre design patterns): https://www.topscoretech.com/product-blog-dashboard-feauture/
- Bold BI student performance dashboard patterns: https://www.boldbi.com/dashboard-examples/education/student-performance-dashboard/
- Grade distribution dashboard (Utah): https://data.utah.edu/data-dashboard/course-grade-summary/
- jsPDF library (client-side PDF, 30K stars, 2.6M weekly DLs): https://npm-compare.com/@react-pdf/renderer,jspdf,pdfmake,react-pdf
- Client-side PDF generation comparison: https://joyfill.io/blog/how-to-generate-pdfs-in-the-browser-with-javascript-no-server-needed
- Google Apps Script export patterns: https://spreadsheet.dev/comprehensive-guide-export-google-sheets-to-pdf-excel-csv-apps-script
- PROJECT.md, ReviewerScreen.jsx, google-apps-script.js — project source of truth (internal)

---
*Feature research for: FlagMail v1.2 Admin Panel*
*Researched: 2026-05-26*
