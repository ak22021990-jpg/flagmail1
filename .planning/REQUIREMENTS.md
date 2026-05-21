# Requirements: FlagMail — SOC Investigation Level

**Defined:** 2026-05-22
**Core Value:** A candidate can complete a realistic SOC investigation — classify the threat, write a working SPL query, and explain their reasoning — and get an automatic, defensible score plus feedback that a reviewer can trust.

## v1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Level Integration

- [ ] **LEVEL-01**: A new fourth zone "SOC Investigation" is reachable after the existing three classification zones, leaving zones 1–3 unchanged
- [ ] **LEVEL-02**: The SOC level shows an intro card before its questions begin, consistent with existing zone intros
- [ ] **LEVEL-03**: A progress indicator shows which SOC question the candidate is on (e.g. "Question N of 5")

### Question Content

- [ ] **QSTN-01**: The level ships with ~5 SOC investigation questions authored from `Splunk Questions.docx` (Q1–Q4 and the multi-stage Q8)
- [ ] **QSTN-02**: Each question displays a scenario description and a log evidence panel showing the email / proxy / EDR details relevant to that question

### Candidate Input

- [ ] **INPUT-01**: The candidate selects a primary classification from question-specific options
- [ ] **INPUT-02**: The candidate selects a secondary diagnosis from question-specific options
- [ ] **INPUT-03**: The candidate writes a Splunk SPL query in a plain multi-line text editor
- [ ] **INPUT-04**: The candidate writes a free-text explanation of their reasoning
- [ ] **INPUT-05**: The candidate cannot submit a question until both the SPL query and explanation contain content

### Validation

- [ ] **VALID-01**: The SPL query is validated by keyword matching — required terms must be present, optional terms earn credit, blocked terms are penalized — with no query execution
- [ ] **VALID-02**: SPL validation normalizes whitespace and supports alternate accepted terms so valid syntax variants are not falsely failed
- [ ] **VALID-03**: The explanation is validated against expected concept keywords

### Scoring

- [ ] **SCORE-01**: Each question is scored on a 23-point model — Primary classification 5, Secondary diagnosis 3, SPL query 10, Explanation 5
- [ ] **SCORE-02**: Each question produces an overall grade band — Strong (20–23), Good (15–19), Needs improvement (10–14), Not ready (below 10)

### Candidate Feedback

- [ ] **FDBK-01**: After submitting a question, the candidate sees a per-question pass/fail result with a per-dimension score breakdown
- [ ] **FDBK-02**: The candidate sees per-dimension feedback explaining what was correct or missing

### Submission Backend

- [ ] **BACK-01**: SOC submissions (classifications, SPL text, explanation, scores, feedback) are pushed to Google Sheets via the existing Apps Script backend using a new sheet and action
- [ ] **BACK-02**: A failed submission surfaces a visible error to the candidate rather than failing silently
- [ ] **BACK-03**: Candidate-supplied text written to Google Sheets is sanitized so spreadsheet formulas cannot execute

### Reviewer View

- [ ] **REVW-01**: A reviewer view is reachable as a separate in-app route, gated by a shared passcode
- [ ] **REVW-02**: The passcode is validated server-side (Apps Script) so it is not exposed in the client bundle
- [ ] **REVW-03**: The reviewer view lists SOC submissions with candidate name, timestamp, scores, and grade band, read from the Google Sheet
- [ ] **REVW-04**: The reviewer view shows each submission's raw SPL query and explanation text

## v2 Requirements

Deferred to a future release. Tracked but not in the current roadmap.

### Candidate Assistance

- **HINT-01**: Each question offers one directional hint, available after the first submit attempt
- **HINT-02**: A worked-solution reveal shows a model SPL answer with annotations after submission

### Reviewer

- **REVW-05**: Reviewer per-question drill-down for a single submission
- **REVW-06**: Reviewer can filter or sort submissions by date, grade band, or candidate name

### Progression

- **BADGE-01**: A "SOC Investigation" badge unlocks on strong completion of the level

### Content

- **CONT-01**: Fold the `Sample questions(1).xlsx` email bank into the existing classification zones

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Reviewer login / user accounts | Shared passcode is sufficient for v1; full auth is a large addition to a currently auth-free app |
| Real Splunk query execution | Keyword validation is the chosen fidelity level; execution needs a Splunk backend |
| LLM / AI semantic grading | Keyword and concept matching only for v1; keeps grading deterministic and API-free |
| Timer on SOC questions | Time pressure tests anxiety, not SPL skill; existing countdown timer is not ported to the SOC level |
| Leaderboard integration for SOC scores | The SOC level is an assessment, not a competition; mixing scores conflates the two modes |
| Rewriting the existing three zones | The SOC level is purely additive |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| (populated by roadmapper) | — | Pending |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 23 ⚠️

---
*Requirements defined: 2026-05-22*
*Last updated: 2026-05-22 after initial definition*
