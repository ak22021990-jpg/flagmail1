# Requirements: FlagMail v1.1 — SOC Investigation Overhaul + Email Fix

**Defined:** 2025-05-25
**Core Value:** Zone 4 presents realistic SOC investigation scenarios — not vague quiz prompts — so candidates understand what they're investigating, what to look for, and what a good answer achieves, while managers reliably receive submission notifications.

## v1.1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Investigation Context

- [ ] **CTX-01**: Each SOC question displays an investigation goal statement describing what the analyst needs to determine (e.g., "Identify phishing emails using password expiration themes")
- [ ] **CTX-02**: Each SOC question displays an analyst focus callout listing specific indicators to look for (e.g., "Suspicious sender domains, Credential harvesting URLs, Impacted recipients")
- [ ] **CTX-03**: Each SOC question displays expected security outcomes describing what analyst actions should follow (e.g., "Block phishing URL, Reset compromised credentials, Notify affected users")

### SPL Task Prompts

- [ ] **TASK-01**: Each SOC question displays a clear, scenario-specific SPL task prompt above the query input (e.g., "Write an SPL query to find similar phishing emails and identify impacted recipients")

### Hints

- [ ] **HINT-01**: Each SOC question offers one or more directional hints available after the first submit attempt, guiding without revealing exact SPL syntax (e.g., "Think about aggregation" not "use stats count")
- [ ] **HINT-02**: Hints are revealed progressively — candidate requests one at a time, not all at once

### Scoring Feedback

- [ ] **FDBK-01**: After submitting, the candidate sees per-dimension feedback labels clearly identifying how they scored on classification, SPL query, and explanation separately
- [ ] **FDBK-02**: Feedback labels use human-readable descriptions (e.g., "SPL Query: 7/10 — matched core investigation terms, missed aggregation syntax")

### Email Delivery

- [ ] **EMAIL-01**: The GAS email notification reliably delivers submission results to the configured manager/reviewer email addresses
- [ ] **EMAIL-02**: GAS email delivery includes quota checking and logs failures with actionable error details rather than failing silently
- [ ] **EMAIL-03**: The GAS deployment checklist documents the MailApp re-authorization step required after each script update

### Data Enrichment

- [ ] **DATA-01**: The `socQuestions.js` dataset is enriched with investigation_context (goal, analyst_focus, expected_outcome), task prompts, and hint arrays per question
- [ ] **DATA-02**: All 5 SOC questions (Q1-Q4, Q8) are updated with content from the Splunk Query Context Explanations document

## Future Requirements

Deferred beyond v1.1. Tracked but not in the current roadmap.

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

### Reviewer

- **REVW-05**: Reviewer per-question drill-down for a single submission
- **REVW-06**: Reviewer can filter or sort submissions by date, grade band, or candidate name

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Real Splunk query execution | Keyword validation is the chosen fidelity level |
| LLM / AI semantic grading | Keyword and concept matching only; keeps grading deterministic |
| Timer on SOC questions | Time pressure tests anxiety, not SPL skill |
| Leaderboard integration for SOC scores | SOC level is assessment, not competition |
| Evidence display restructure | Current flat display works; typed cards deferred to future milestone |
| Worked-solution reveal | Requires authored content per question; deferred |
| SPL syntax highlighting | 180KB+ library cost, mislabels SPL tokens |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| (filled by roadmapper) | | |

---
*Requirements defined: 2025-05-25*
