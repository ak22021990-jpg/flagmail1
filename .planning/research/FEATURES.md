# Feature Research

**Domain:** SOC Investigation Training Level — SPL Query Writing Assessment (appended to existing phishing-classification game)
**Researched:** 2026-05-22
**Confidence:** MEDIUM-HIGH — grounded in BOTS/TryHackMe/SIEM training patterns plus eLearning assessment literature; exact UI tradeoffs are judgment calls informed by the constraint set

---

## Scope Note

This research covers ONLY the new SOC Investigation level (Zone 4). The existing classification game (Zones 1–3), leaderboard, badges, and Google Sheets backend are already built and out of scope for this document.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features a candidate or reviewer will immediately notice are missing. The level is not credible without these.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Scenario card with log evidence | Every real SOC exercise presents the incident scenario before asking questions — BOTS, TryHackMe, and EC-Council CSA all open with contextual narrative + supporting logs | LOW | Static JSX card; render email/proxy/EDR logs in monospace block; content from `Splunk Questions.docx` |
| Primary classification picker | The existing game already trains L1/L2 picks; the SOC level must extend this to threat-type classification so the skill chain is coherent | LOW | Reuse existing `Classifier` component pattern; options are question-specific, not global |
| Secondary diagnosis picker | Directly mirrors the SOC triage workflow (threat type → root-cause diagnosis); both SIEM training platforms and the project spec call for it | LOW | Same as above; locked until primary is selected |
| Multi-line plain-text SPL editor | Without a text area there is no query-writing exercise; this is the unique differentiating act of the level | LOW | Plain `<textarea>` with monospace font and line numbers; no syntax highlighting required for v1 |
| Free-text explanation editor | Explanation of reasoning is the second open-ended skill being assessed; BOTS and scenario-based SIEM training universally require a written justification | LOW | Plain `<textarea>`; no formatting toolbar |
| Single-question submit button | Candidates need a clear action boundary between writing and grading; pressing submit triggers deterministic validation | LOW | Disabled until both editors have content; confirms before submitting |
| Per-question keyword validation feedback | Immediate feedback on which SPL terms were found/missing and which explanation concepts were recognized is the minimum useful output of keyword-based grading | MEDIUM | Show green/amber/red per validation dimension (required terms, optional terms, explanation concepts); no raw keyword list exposed — use readable labels |
| Per-question score breakdown | Candidates expect to see how the 23 pts were split (Primary 5 / Secondary 3 / SPL 10 / Explanation 5); hidden totals feel opaque and unfair | LOW | Simple score summary card after each question |
| Overall grade band display | The graded band (Strong / Good / Needs improvement / Not ready) is the primary outcome signal; it must appear prominently at level end | LOW | Mirrors the Results screen pattern already in the app |
| Question navigation / progress indicator | With ~5 questions, a candidate must know which question they are on and how many remain; no navigation beyond linear progression required | LOW | "Question 2 of 5" counter; back-navigation is NOT needed and adds state complexity |
| Reviewer passcode gate | Reviewer access must be protected even without full auth; a passcode entry screen is the minimum viable barrier | LOW | A single passcode field that checks against a hardcoded/env value before rendering the review route |
| Reviewer submission list | Reviewers need to see candidate name, submission timestamp, per-question scores, grade band, and raw SPL text; this is the entire value of the reviewer view | MEDIUM | Read-only table from Google Sheets; no editing; sort by timestamp desc |
| Google Sheets submission push | Submissions must be durable and accessible to reviewers without the candidate's browser being open; consistent with the existing architecture | MEDIUM | New sheet + Apps Script action; mirrors existing `submit` action pattern |

---

### Differentiators (Competitive Advantage)

Features that meaningfully improve candidate experience or reviewer trust without requiring execution, LLM, or auth infrastructure.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Progressive hint system (1 hint per question, unlockable after first submit) | Cybersecurity training research shows hints reduce frustration without giving away the answer (PMC 2022 study); BOTS workshop model includes sample SPL patterns as learning aids | MEDIUM | One static hint per question authored in the question dataset; shown only after the candidate submits once; no penalty for using it; hint text is a directional clue ("Which SPL command counts events by source IP?"), not the answer |
| Worked-solution reveal (after final submit or after passing) | Platforms like TryHackMe and BOTS universally show correct queries post-attempt; this is the highest-value learning moment — seeing a well-formed SPL next to their own submission | MEDIUM | Reveal is gated: shown only after the candidate has submitted; never shown before; include brief annotations ("This `stats count by src_ip` counts distinct sources...") |
| Per-dimension inline feedback labels | Rather than a single pass/fail, label each validation bucket (Required terms present / Optional terms used / Explanation covers key concepts) with plain-language status; granular feedback is strongly correlated with skill improvement in automated assessment literature | MEDIUM | Three feedback rows with icons; wording authored per question not auto-generated; stays within keyword validation fidelity |
| SPL character count / line count indicator | Candidates frequently submit a single line when a real query needs piping; a character or line count nudges quality without constraining format | LOW | Passive counter below textarea; no min/max enforcement |
| SOC Investigation badge | Completing Zone 4 should unlock a distinct badge, consistent with the existing badge system; signals achievement to reviewers and candidates alike | LOW | New badge entry in the badge dataset; same toast system |
| Reviewer per-question drill-down | Reviewer can expand a submission row to see the candidate's raw SPL text and explanation text alongside the validation result for each question; makes the reviewer's trust judgment faster | MEDIUM | Accordion or modal expand; no additional API calls needed if full submission is stored in Sheets on submit |
| Print-friendly reviewer export | Reviewers in enterprise security teams often need to file assessment evidence as PDFs; a CSS `@media print` layout for the reviewer table costs little and solves a real workflow pain | LOW | CSS only; no PDF library |

---

### Anti-Features (Deliberately Not Built for v1)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real Splunk query execution | Candidates want to verify their SPL runs; it feels more authentic | Requires a Splunk instance (licensed, containerized, or cloud), adds network dependency during assessment, introduces timeout/error states, massive scope expansion; explicitly ruled out in PROJECT.md | Worked-solution reveal after submit is the learning-equivalent at near-zero cost |
| LLM / AI grading of SPL or explanation | Feels more human; handles synonyms and alternative valid approaches | External API call at grade time breaks determinism (network failure = broken assessment), adds latency, adds cost, adds privacy concern (candidate text sent to third-party LLM), contradicts project constraints; explicitly excluded in PROJECT.md | Keyword + concept matching with multiple accepted alternatives per term in the dataset covers the variation that matters; add alternative keywords during content authoring |
| Reviewer accounts / login | Enterprises want per-reviewer audit trails | Full auth is large (session management, password reset, account CRUD) on a currently auth-free app; explicitly deferred in PROJECT.md | Shared passcode is sufficient; if audit trail needed, Google Sheets already logs who pushes data by timestamp |
| Attempt limits with lockout | Prevents guessing; mirrors real exam conditions | For a training-first tool (not a high-stakes exam), lockout creates anxiety and loses the formative learning value; no evidence the existing game uses lockout | One-attempt-per-session behavior is natural (no explicit lockout needed; the submit button becomes the confirmation boundary) |
| SPL syntax highlighting / autocomplete | Improves ergonomics in a code editor | Adds a non-trivial library (CodeMirror or Monaco) for marginal gain; the assessment is about knowledge, not editor comfort; consistency with the plain-text constraint is more important | Monospace font, line count indicator, and worked-solution reveal together cover ergonomics adequately |
| Leaderboard integration for SOC scores | Competitive motivation; consistent with existing zones | SOC Investigation is an assessment (reviewer-trust context), not a competitive game; publishing raw SPL scores on a leaderboard conflates training with competition and can embarrass candidates in front of peers | Grade band on the Results screen is sufficient competitive signal; detailed scores go only to the reviewer |
| Multi-stage question branching | Q8 in Splunk Questions.docx is a multi-stage question | Branching logic significantly complicates state management in the no-router, custom state machine; v1 should flatten Q8 into sequential sub-questions without conditional navigation | Treat Q8's stages as separate sequential questions in the dataset; the experience is equivalent |
| Timer for SOC questions | Consistent with the timer in the classification zones | SOC investigation is explicitly skills-assessment, not speed; time pressure on a multi-step SPL writing task tests anxiety not competence; no evidence that real BOTS or SIEM certification exercises time individual query questions | No timer on the SOC level; the existing countdown timer is appropriate only for rapid-fire classification |
| Candidate self-score review / appeal | Fairness; candidates want to contest keyword results | Introduces a support workflow that doesn't exist in the app; keyword validation is deterministic and transparent enough that the reviewer can already override manually | Reviewers see the raw SPL; manual override by a human reviewer is the appropriate escalation path |

---

## Feature Dependencies

```
Scenario Card (render log evidence)
    └──required-by──> Primary Classification Picker
                          └──required-by──> Secondary Diagnosis Picker
                                               └──required-by──> SPL Editor
                                                                    └──required-by──> Explanation Editor
                                                                                        └──required-by──> Submit Button

Submit Button
    └──triggers──> Keyword Validation Engine
                      └──produces──> Per-Question Score + Feedback Card
                                        └──aggregates-into──> Overall Grade Band

Per-Question Score + Feedback Card
    └──enables-reveal-of──> Hint (if Hint differentiator is built)
    └──enables-reveal-of──> Worked Solution (if Worked Solution differentiator is built)

Overall Grade Band
    └──triggers──> Google Sheets Push (new Apps Script action)
    └──triggers──> SOC Badge Unlock (if badge differentiator is built)

Google Sheets Push
    └──read-by──> Reviewer Passcode Gate
                      └──renders──> Reviewer Submission List
                                       └──expands-into──> Per-Question Drill-Down (if differentiator built)
```

### Dependency Notes

- **Secondary Diagnosis requires Primary Classification:** The secondary options are question-specific and may be conditioned on the primary pick; render secondary only after primary is committed.
- **Hint requires Submit:** Showing a hint before the candidate tries defeats its purpose. Gate the hint button on the first submit event.
- **Worked Solution requires Submit:** Never pre-reveal. The learning value comes from seeing the correct answer after genuine engagement.
- **Reviewer Submission List requires Google Sheets Push:** If the push fails, the reviewer view is empty. The push must be synchronous-from-the-candidate's-perspective (with a loading state and error retry) before navigating to the grade screen.
- **SPL Editor conflicts with Timer:** Do not apply the existing zone countdown timer to SOC questions (see Anti-Features).

---

## MVP Definition

### Launch With (v1)

Minimum viable feature set to deliver a credible SOC Investigation level with reviewer-trustworthy automated scoring.

- [ ] Scenario card + log evidence render — without this the candidate has no context
- [ ] Primary classification picker (question-specific options) — core skill being assessed
- [ ] Secondary diagnosis picker (unlocked after primary) — second dimension of triage skill
- [ ] Multi-line plain-text SPL textarea — the unique act of the level
- [ ] Free-text explanation textarea — second open-ended component
- [ ] Submit button with confirmation — clear action boundary
- [ ] Keyword validation engine (required/optional/blocked SPL terms; explanation concept matching) — deterministic scoring
- [ ] Per-question score breakdown (Primary 5 / Secondary 3 / SPL 10 / Explanation 5) — transparency
- [ ] Per-dimension inline feedback labels — minimum useful output beyond a number
- [ ] Overall grade band (Strong / Good / Needs improvement / Not ready) — the primary outcome signal
- [ ] Question progress indicator (Question N of 5) — orientation
- [ ] Google Sheets push of full submission — durable reviewer-accessible record
- [ ] Reviewer passcode gate — minimum protection
- [ ] Reviewer submission list (name, timestamp, scores, grade band, raw SPL) — reviewer's job

### Add After Validation (v1.x)

Add once v1 is running and reviewers have used it.

- [ ] Hint per question — add if candidates report being stuck; requires hint text to be authored per question
- [ ] Worked-solution reveal — add if reviewer feedback indicates candidates aren't improving; highest learning value; requires model-answer SPL per question
- [ ] Reviewer per-question drill-down — add if reviewers report it takes too long to evaluate individual questions
- [ ] SOC Investigation badge — add once the badge dataset expansion is a low-risk change; quick win for candidate motivation
- [ ] SPL character/line count indicator — quick win, add anytime

### Future Consideration (v2+)

- [ ] Print-friendly reviewer export — useful for enterprise compliance workflows; CSS-only change but low urgency until a real enterprise reviewer requests it
- [ ] Multi-stage branching for Q8-type questions — once v1 content proves the linear format's limitations
- [ ] Additional SPL question bank beyond the ~5 Splunk Questions.docx questions — once content authoring is an established workflow

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Scenario card + log evidence | HIGH | LOW | P1 |
| Primary + secondary classification pickers | HIGH | LOW | P1 |
| SPL textarea | HIGH | LOW | P1 |
| Explanation textarea | HIGH | LOW | P1 |
| Submit + keyword validation engine | HIGH | MEDIUM | P1 |
| Per-question score breakdown | HIGH | LOW | P1 |
| Per-dimension inline feedback labels | HIGH | MEDIUM | P1 |
| Overall grade band | HIGH | LOW | P1 |
| Google Sheets push (SOC submissions) | HIGH | MEDIUM | P1 |
| Reviewer passcode gate | HIGH | LOW | P1 |
| Reviewer submission list | HIGH | MEDIUM | P1 |
| Question progress indicator | MEDIUM | LOW | P1 |
| Hint per question | MEDIUM | MEDIUM | P2 |
| Worked-solution reveal | HIGH | MEDIUM | P2 |
| Reviewer per-question drill-down | MEDIUM | MEDIUM | P2 |
| SOC Investigation badge | MEDIUM | LOW | P2 |
| SPL character/line count indicator | LOW | LOW | P2 |
| Print-friendly reviewer export | LOW | LOW | P3 |
| Multi-stage question branching | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Add after v1 is validated
- P3: Future consideration

---

## Competitor / Reference Platform Analysis

| Feature | TryHackMe (Splunk rooms) | Splunk BOTS Workshop | EC-Council CSA Exam | FlagMail SOC Level (v1) |
|---------|--------------------------|---------------------|--------------------|-----------------------|
| Scenario context before question | Yes — narrative + log snippets | Yes — full dataset access | Multiple choice, no free text | Yes — scenario card + log evidence |
| Free-text query writing | No — fill-in-blank or MCQ | Yes — open Splunk search bar | No | Yes — plain textarea |
| Real query execution | Yes — live Splunk instance | Yes — live BOTS dataset | No | No — keyword validation only |
| Hints | Yes — "View Hint" per question | Implicit — sample searches in workshop | No | v1.x — one hint per question post-submit |
| Worked solution reveal | Yes — after correct answer | Yes — questions and answers open-sourced | N/A | v1.x — post-submit reveal |
| Partial credit | No — binary pass/fail | Binary per question | N/A | Yes — 4-dimension weighted scoring |
| Attempt limit | Usually unlimited for free rooms | CTF context has one run | Exam context: fixed attempts | One submit per question (no lockout) |
| Reviewer / admin view | Instructor dashboard (paid) | Scoring app (self-hosted) | Proctored exam center | Passcode-gated in-app route reading Sheets |
| Score breakdown | Room completion % | Answer right/wrong | Total score | Per-question breakdown + grade band |

---

## Sources

- Splunk Boss of the SOC blog + open-source dataset release: https://www.splunk.com/en_us/blog/security/boss-of-the-soc-scoring-server-questions-and-answers-and-dataset-open-sourced-and-ready-for-download.html
- BOTS Investigation Workshop app overview: https://www.splunk.com/en_us/blog/security/boss-of-the-soc-bots-investigation-workshop-for-splunk.html
- TryHackMe Splunk: The Basics room: https://tryhackme.com/room/splunk101
- TryHackMe Splunk: Exploring SPL room: https://tryhackme.com/room/splunkexploringspl
- Student assessment in cybersecurity training automated by pattern mining and clustering (PMC 2022): https://pmc.ncbi.nlm.nih.gov/articles/PMC8964927/
- Automated feedback for cybersecurity training participants (Springer 2023): https://link.springer.com/article/10.1007/s10639-023-12265-8
- Gamification in security awareness training — Keepnet: https://keepnetlabs.com/blog/the-power-of-gamification-in-security-awareness-training
- Scenario-Based Cybersecurity Analyst Training: Log Analysis & SIEM Alerts — Undercode: https://undercodetesting.com/scenario-based-cybersecurity-analyst-training-log-analysis-siem-alerts-part/
- EC-Council Certified SOC Analyst (CSA) certification page: https://www.eccouncil.org/train-certify/certified-soc-analyst-csa/
- EpicDetect SPL cheat sheet / SOC analyst query patterns: https://epicdetect.io/blogs/splunk-spl-cheat-sheet-15-queries-soc-analysts
- Hack The Box Academy SOC Analyst path: https://academy.hackthebox.com/path/preview/soc-analyst
- PROJECT.md constraints and requirements (project source of truth)
- Splunk.md scoring model (23-point model, grade bands)

---
*Feature research for: SOC Investigation Level — FlagMail Zone 4 SPL Assessment*
*Researched: 2026-05-22*
