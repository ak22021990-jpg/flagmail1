# Requirements: FlagMail v1.2 — Admin Panel

**Defined:** 2026-05-26
**Core Value:** An admin/reviewer can access a unified panel to view all candidate submissions across all zones, drill into answer sheets, and download reports — with data they can trust and act on.

## v1.2 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Admin Infrastructure

- [ ] **ADMN-01**: Admin panel replaces the existing reviewer screen as the single entry point for assessment management
- [ ] **ADMN-02**: Admin panel is passcode-gated using the existing server-side GAS PropertiesService validation
- [ ] **ADMN-03**: Admin panel is lazy-loaded via React.lazy so candidates never download admin code
- [ ] **ADMN-04**: Admin can manually refresh data to pull latest submissions from Google Sheets

### Candidate Management

- [ ] **CAND-01**: Admin can view a table of all candidates with name, email, total score, grade band, and submission date
- [ ] **CAND-02**: Admin can search candidates by name or email with instant filtering
- [ ] **CAND-03**: Admin can sort the candidate list by score, date, or grade band
- [ ] **CAND-04**: Admin can filter candidates by grade band (Strong / Good / Needs improvement / Not ready)
- [ ] **CAND-05**: Admin can see proctoring violation flags (tab-switch count) per candidate

### Answer Sheet

- [ ] **ANS-01**: Admin can drill down into a candidate's Zone 1-3 classification answers showing L1/L2 picks, correct answers, and points per email
- [ ] **ANS-02**: Admin can view a candidate's SOC Investigation answers showing SPL query text, explanation text, and per-dimension scores for each question
- [ ] **ANS-03**: Admin can see SPL keyword annotations highlighting which required/optional/blocked terms were matched or missed

### Reports & Export

- [ ] **RPT-01**: Admin can download all submission data as a CSV file
- [ ] **RPT-02**: Admin can generate a printable PDF report for a candidate via browser print dialog

### Backend (GAS)

- [ ] **GAS-01**: A new `getAdminData` GAS endpoint reads Summary, RawData, and SOCData sheets in a single call, gated by passcode
- [ ] **GAS-02**: The GAS endpoint includes a `checkPasscode()` helper that validates against PropertiesService before returning any data
- [ ] **GAS-03**: The GAS endpoint returns structured JSON with candidates, rawData, and socData arrays

## Future Requirements

Deferred beyond v1.2. Tracked but not in the current roadmap.

### Dashboard

- **DASH-01**: Score overview dashboard showing total submissions, average scores, pass/fail rates
- **DASH-02**: Grade band distribution chart (bar/pie) across all zones
- **DASH-03**: Zone-by-zone comparison stats (Zones 1-3 vs Zone 4 SOC)
- **DASH-04**: Trend charts showing score distribution over time

### Evidence Display

- **EVID-01**: Evidence displayed as typed cards (email headers, log summaries, EDR alerts) instead of flat field dump
- **EVID-02**: Structured evidence with fixed labeled layout (Sender, Subject, Attachment, URL, Status)

### Learning

- **LEARN-01**: Worked-solution reveal shows model SPL answer with clause-by-clause annotations after scoring
- **LEARN-02**: AI-generated coaching feedback based on candidate mistakes

### Display

- **DISP-01**: Dark-themed code surface for SPL textarea to signal "code input"
- **DISP-02**: SPL syntax highlighting

### Progression

- **BADGE-01**: A "SOC Investigation" badge unlocks on strong completion of the level

### Content

- **CONT-01**: Fold the `Sample questions(1).xlsx` email bank into the existing classification zones

### Reporting (Advanced)

- **RPT-03**: Batch PDF export for multiple candidates at once
- **RPT-04**: Excel (XLSX) export format
- **RPT-05**: Custom date-range filtering for exports

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Real-time auto-refresh / polling | Exhausts GAS quota; manual refresh is sufficient |
| Role-based access / user accounts | Requires identity provider; shared passcode is sufficient |
| Manual score override by admin | Requires GAS write-back with concurrent-access risks |
| Excel (XLSX) export | CSV covers spreadsheet needs without adding ~170KB library |
| jsPDF programmatic PDF | `window.print()` is zero-library, zero-hazard; jsPDF deferred to v1.3 |
| Real Splunk query execution | Keyword validation is the chosen fidelity level |
| LLM / AI semantic grading | Keyword and concept matching only; keeps grading deterministic |
| Dashboard charts (recharts) | Deferred to future milestone; summary stats can use plain HTML |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ADMN-01 | TBD | Pending |
| ADMN-02 | TBD | Pending |
| ADMN-03 | TBD | Pending |
| ADMN-04 | TBD | Pending |
| CAND-01 | TBD | Pending |
| CAND-02 | TBD | Pending |
| CAND-03 | TBD | Pending |
| CAND-04 | TBD | Pending |
| CAND-05 | TBD | Pending |
| ANS-01 | TBD | Pending |
| ANS-02 | TBD | Pending |
| ANS-03 | TBD | Pending |
| RPT-01 | TBD | Pending |
| RPT-02 | TBD | Pending |
| GAS-01 | TBD | Pending |
| GAS-02 | TBD | Pending |
| GAS-03 | TBD | Pending |

**Coverage:**
- v1.2 requirements: 17 total
- Mapped to phases: 0
- Unmapped: 17

---
*Requirements defined: 2026-05-26*
*Last updated: 2026-05-26 after initial definition*
