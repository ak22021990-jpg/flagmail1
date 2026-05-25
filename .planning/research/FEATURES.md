# Feature Landscape

**Domain:** SOC Investigation Training Level — SPL Query Writing Assessment (Zone 4 of FlagMail)
**Researched:** 2026-05-25 (updated for v1.1 SOC Investigation Overhaul milestone)
**Confidence:** HIGH — grounded in current SOC training platform analysis (LetsDefend, TryHackMe SOC Simulator,
CyberDefenders, Splunk BOTS), eLearning assessment literature, and the existing socQuestions.js dataset

---

## Scope Note

This document covers ONLY the Zone 4 SOC Investigation level. Zones 1–3 (email classification game),
leaderboard, badges, and existing Google Sheets backend are built and out of scope. This version is
updated for the v1.1 milestone whose goal is to make Zone 4 a **realistic SOC investigation simulator**
— the v1.0 build exists but feedback says questions are "too vague."

### What v1.0 already ships (do not rebuild)

- 6 SOC question objects in `src/data/socQuestions.js` (Q1–Q4, Q5a, Q5b) — dataset exists
- 23-point scoring model per question (Primary 5 / Secondary 3 / SPL 10 / Explanation 5)
- Keyword validation engine (required/optional/blocked SPL terms, conceptKeywords)
- Grade band (Strong 20–23 / Good 15–19 / Needs improvement 10–14 / Not ready below 10)
- Google Sheets submission via Apps Script
- Reviewer passcode-gated view

### What v1.1 adds or fixes (this milestone's scope)

Structured investigation context per question, evidence artifact display upgrade, investigation
goal/analyst focus framing, hint engine, better SPL task prompts, email delivery fix for reviewers.

---

## Table Stakes

Features a candidate or reviewer expects. Without these, the Zone 4 level feels like a quiz, not
an investigation. All established SOC training platforms (LetsDefend, TryHackMe SOC Simulator,
Splunk BOTS, CyberDefenders) share these as baseline design requirements.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Investigation scenario narrative | Every real SOC exercise opens with an incident narrative before presenting data — LetsDefend, BOTS, and CyberDefenders all do this; without it, the evidence panel is context-free | LOW | Already exists as `scenario` string per question; v1.1 enriches it with goal/focus framing |
| Evidence artifact display (email / proxy / EDR) | Analysts always see structured log evidence before forming a hypothesis; the current display is a flat JSON dump that feels unfinished | LOW | Structured card component per source type (email headers, auth log summary, EDR alert summary); monospace for raw values |
| Investigation goal statement | TryHackMe SOC Sim, BOTS, and CyberDefenders each open exercises with an explicit investigative goal ("Determine if this alert is a true positive and identify the affected user"); without it candidates don't know what success looks like | LOW | One sentence per question: "Your goal: identify the attack type and write an SPL query that surfaces affected users." Authored in dataset |
| Analyst focus / what-to-look-for callout | OSCAR methodology (Obtain → Strategize → Collect → Analyze → Report) used in enterprise SOC training always includes a "what to look for" step; absent from v1.0 | LOW | 2–3 bullet callout per question highlighting the key indicators the analyst should pivot on; authored in dataset |
| Expected outcome statement | CyberDefenders and TryHackMe exercises tell the analyst what a correct investigation produces (a confirmed threat actor, a list of affected hosts, a MITRE technique ID); sets grading expectations | LOW | Short list: "A valid query returns source IP, user count, and time window." Authored in dataset |
| Question-specific SPL task prompt | v1.0 prompts are generic ("Write an SPL query to investigate"); BOTS and LetsDefend give focused prompts ("Find all authentication failures from a single source IP in a 5-minute window grouped by user") | LOW | Already in splRules.tasks[].prompt; v1.1 replaces vague prompts with scenario-tied, scoped prompts that name the log source and target field |
| Primary classification picker (question-specific options) | Core skill; already exists; v1.1 ensures options are tight, scenario-relevant, and not over-broad | LOW | Existing `Classifier` component reuse; trim any option sets that include implausible distractors |
| Secondary diagnosis picker | Mirrors SOC triage workflow; already exists | LOW | Same; gate on primary commit |
| Multi-line plain-text SPL editor | The unique differentiating act of the level; already exists | LOW | No change needed for v1.1; monospace textarea |
| Free-text explanation editor | Reasoning capture; already exists | LOW | No change needed for v1.1 |
| Submit gate (content required) | Prevents empty submissions; already exists | LOW | Enforce non-empty SPL and explanation before enabling submit |
| Per-question keyword validation feedback | Immediate post-submit feedback on which SPL terms were recognized and which concepts were found; already exists | MEDIUM | v1.1 improves label wording to be human-readable rather than raw keyword dumps |
| Per-question score breakdown | Candidates need to see the 23-point split; already exists | LOW | No change needed |
| Overall grade band | Primary outcome signal; already exists | LOW | No change needed |
| Question progress indicator | "Question 2 of 5" orientation; already exists | LOW | No change needed |
| GAS email fix for reviewer notifications | Managers/reviewers are not receiving submission notification emails — explicitly listed as v1.1 target fix | MEDIUM | Investigate GAS `MailApp.sendEmail` call and recipient list in Apps Script; likely a recipient address misconfiguration or Apps Script quota issue |
| Reviewer passcode gate | Minimum protection for reviewer view; already exists | LOW | No change needed |
| Reviewer submission list | Reviewer sees name, timestamp, scores, grade band, raw SPL; already exists | MEDIUM | No change needed |

---

## Differentiators

Features that meaningfully improve candidate experience or reviewer trust. These go beyond
what is available in keyword-validation-only platforms and are achievable within the React 19
+ plain JS + GAS constraint set.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Hint engine (1 hint per question, post-first-submit) | Cybersecurity learning research (PMC 2022, arXiv 2511.06362) consistently shows that contextual next-step hints reduce frustration and improve performance for low-performers without reducing value for strong candidates; BOTS workshop and TryHackMe both include hints | MEDIUM | One static hint per question, authored in dataset, shown only after first submit attempt; hint is directional ("Which SPL command counts distinct users per source IP?"), not the answer; no score penalty for viewing |
| Worked-solution reveal (post-submit, gated) | Highest single learning-value feature in assessment research; BOTS and TryHackMe both reveal correct queries and explanations post-attempt; seeing a well-formed SPL next to their own output is the clearest learning signal available without execution | MEDIUM | Reveal gated: shown only after candidate submits the question; includes brief annotation on each clause ("This `dc(user)` counts distinct affected users, which distinguishes spraying from a single targeted brute force"); authored per question in dataset |
| Per-dimension inline feedback labels with plain-language status | Rather than a score number, labelling each validation bucket (Required terms: found / missing; Optional terms: credited; Explanation concepts: recognized) with readable status is strongly correlated with skill improvement in automated assessment (Springer 2023); TryHackMe uses per-task status badges | MEDIUM | Three feedback rows with icons; wording per question; never exposes the raw keyword list to prevent gaming |
| SPL character / line count indicator | A passive counter nudges candidates who write a single-line query when a piped multi-stage query is expected; LetsDefend and BOTS exercises implicitly reward depth; no equivalent in current v1.0 | LOW | Passive counter below textarea; no enforcement; updates on keystroke |
| SOC Investigation badge | Consistent with existing badge system; signals achievement to candidates and reviewers; low-cost motivation boost | LOW | New badge entry in badge dataset; same BadgeToast system; unlocks on zone complete |
| Reviewer per-question drill-down | Reviewers can expand a submission to see raw SPL and explanation per question alongside validation results; reduces time-to-judgment for reviewers | MEDIUM | Accordion expand or modal; no additional API calls if full submission stored in Sheets on submit |
| Print-friendly reviewer export | Enterprise security teams file assessment evidence as PDFs; a CSS `@media print` layout costs little and solves a real enterprise workflow pain | LOW | CSS-only; no PDF library |

---

## Anti-Features

Deliberately not built in this milestone. Documented to prevent scope creep.

| Feature | Why Requested | Why Not Now | Alternative |
|---------|---------------|-------------|-------------|
| Real Splunk query execution | Candidates want to verify their SPL runs; feels most authentic | Requires a Splunk instance (licensed, containerized, or cloud), network dependency during assessment, timeout/error states, massive scope expansion; ruled out in PROJECT.md | Worked-solution reveal post-submit is the learning-equivalent at near-zero cost |
| LLM / AI semantic grading | Handles synonyms, alternative valid approaches, feels more human | External API at grade time breaks determinism (network failure = broken assessment), adds latency and cost, sends candidate text to third parties, contradicts project constraints | Multiple accepted alternatives per term authored in the dataset (`anyOf` patterns already implemented) cover the variation that matters |
| Reviewer user accounts / login | Per-reviewer audit trail, enterprise preference | Full auth is large on a currently auth-free app; explicitly deferred in PROJECT.md | Shared passcode; Google Sheets already timestamps submissions |
| SPL syntax highlighting / autocomplete (CodeMirror, Monaco) | Editor ergonomics; code-editor familiarity | Non-trivial library for marginal gain on a knowledge assessment; assessment is about SPL knowledge, not editor comfort; consistency with plain-text constraint matters | Monospace font + line count indicator + worked-solution reveal together cover ergonomics adequately |
| Timer on SOC questions | Consistent with countdown timer in Zones 1–3 | Time pressure on multi-step SPL writing tests anxiety not competence; no real SOC exercise (BOTS, CyberDefenders) times individual query questions; ruled out in PROJECT.md | No timer; the assessment is skills-focused not speed-focused |
| Leaderboard integration for SOC scores | Competitive motivation, consistent with other zones | SOC Investigation is an assessment not a competition; publishing raw SPL scores conflates training with competition and can embarrass candidates | Grade band on Results screen is sufficient outcome signal; detailed scores go only to the reviewer |
| Attempt limits / lockout | Prevents guessing; exam-like conditions | Training-first tool; lockout loses formative learning value; no evidence existing game uses lockout | Submit button is the natural one-attempt boundary; no explicit lockout needed |
| Multi-stage question branching (Q8 full implementation) | Q8 in Splunk Questions.docx is a multi-stage conditional question | Branching logic significantly complicates state management in the no-router, custom state machine | Q5a/Q5b flatten Q8 into sequential sub-questions — already implemented in v1.0 |
| Candidate self-score review / appeal workflow | Fairness; candidates may contest keyword results | Introduces a support workflow that doesn't exist; keyword validation is transparent and deterministic enough that human reviewer can override | Reviewers see raw SPL and can override grade band manually |
| Score normalization to 100 per question | Clean percentage display | 23 points already maps to a named grade band; converting to 100 adds math without adding clarity for a 23-point rubric | Keep 23-point model; display grade band prominently |

---

## Feature Dependencies

```
Investigation Context Block (goal + analyst focus + expected outcome)
    └──required-before──> Evidence Artifact Display
                              └──required-before──> Primary Classification Picker
                                                        └──required-before──> Secondary Diagnosis Picker
                                                                                  └──required-before──> SPL Editor
                                                                                                            └──required-before──> Explanation Editor
                                                                                                                                      └──required-before──> Submit

Submit
    └──triggers──> Keyword Validation Engine
                      └──produces──> Per-Question Score + Dimension Feedback Card
                                        └──unlocks──> Hint (if authored; shown on request)
                                        └──unlocks──> Worked Solution (if authored; shown on request)
                                        └──aggregates-into──> Overall Grade Band

Overall Grade Band
    └──triggers──> Google Sheets Push (GAS action)
    └──triggers──> SOC Badge Unlock (if badge differentiator built)

Google Sheets Push
    └──triggers──> Reviewer Email Notification (GAS MailApp — the fix target)
    └──read-by──> Reviewer Passcode Gate
                      └──renders──> Reviewer Submission List
                                       └──expands-into──> Per-Question Drill-Down (differentiator)
```

### Key Dependency Notes

- **Investigation context must precede evidence display.** Goal framing before data prevents candidates from pattern-matching on keywords before understanding what the investigation requires.
- **Analyst focus callout anchors the SPL task prompt.** The "what to look for" bullets should use the same field names that appear in the SPL task prompt — this is the coherence that v1.0 lacks.
- **Hint requires first submit.** Showing a hint before any attempt removes the productive struggle that makes hints pedagogically valuable (PMC 2022, contextual factors affecting hint utility).
- **Worked solution requires submit.** Pre-reveal destroys the learning value of genuine engagement.
- **GAS email fix is a prerequisite for reviewer usability.** If manager notifications don't arrive, the reviewer view is only reachable by those who know to poll the Sheets URL — the passcode gate becomes useless in practice.
- **Evidence display does not require multi-source data.** Q1, Q3, Q4 have email-only evidence; Q2 has proxy-only (auth log); Q5a/Q5b have all three. Evidence component must gracefully handle `null` source types.
- **SPL editor has no dependency on timer.** The existing `useTimer` hook must NOT be wired to SOC questions — this is an architectural guard, not just a feature toggle.

---

## MVP Definition

### v1.1 Launch (this milestone)

The minimum to upgrade Zone 4 from "quiz" to "realistic SOC investigation simulator."

- [ ] Investigation context block per question: goal statement, analyst focus bullets, expected outcome — authored in dataset
- [ ] Evidence artifact display: structured card per source type (email headers, auth summary, EDR alert) rather than raw field dump
- [ ] Improved SPL task prompts: scenario-tied, log-source-specific, scoped to a concrete investigative question
- [ ] Analyst focus callout uses same field names as SPL task prompt (coherence fix)
- [ ] GAS email delivery fix for reviewer notifications
- [ ] Hint engine: one static hint per question, post-first-submit, authored in dataset
- [ ] Worked-solution reveal: model SPL with clause annotations, post-submit, authored in dataset
- [ ] Per-dimension feedback labels: human-readable, not raw keyword lists

### After Validation (v1.x)

- [ ] Reviewer per-question drill-down accordion
- [ ] SOC Investigation badge unlock
- [ ] SPL character / line count indicator
- [ ] Print-friendly reviewer export (CSS only)

### Future Consideration (v2+)

- [ ] Additional SPL question bank beyond the 6 existing questions
- [ ] Multi-stage branching for truly conditional investigation paths
- [ ] Fold `Sample questions(1).xlsx` email bank into classification zones
- [ ] Reviewer filter/sort by date, grade band, candidate name

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | v1.1 Priority |
|---------|------------|---------------------|--------------|
| Investigation context block (goal / focus / outcome) | HIGH | LOW | P1 — dataset addition + render |
| Evidence artifact display (structured cards) | HIGH | LOW | P1 — component update |
| Improved SPL task prompts | HIGH | LOW | P1 — dataset edit |
| GAS email delivery fix | HIGH | MEDIUM | P1 — ops correctness |
| Hint engine | MEDIUM | MEDIUM | P1 — core learning feature for this milestone |
| Worked-solution reveal | HIGH | MEDIUM | P1 — core learning feature for this milestone |
| Per-dimension feedback human-readable labels | HIGH | LOW | P1 — polish existing feature |
| SPL character / line count indicator | LOW | LOW | P2 |
| SOC Investigation badge | MEDIUM | LOW | P2 |
| Reviewer per-question drill-down | MEDIUM | MEDIUM | P2 |
| Print-friendly reviewer export | LOW | LOW | P3 |

---

## Competitor / Reference Platform Analysis

| Feature | TryHackMe SOC Sim | Splunk BOTS Workshop | LetsDefend | CyberDefenders | FlagMail Zone 4 v1.0 | FlagMail Zone 4 v1.1 target |
|---------|-------------------|---------------------|-----------|----------------|----------------------|------------------------------|
| Investigation goal statement | Yes — per alert | Yes — scenario brief | Yes — per case | Yes — per challenge | No | Yes — authored per question |
| Analyst focus / what-to-look-for | Yes — playbook steps | Yes — BOTS workshop guide | Yes — playbook | Yes — challenge hints | No | Yes — 2–3 bullet callout |
| Expected outcome statement | Yes — "confirm true positive" | Yes — forensic answer format | Yes — closure criteria | Yes — artifact list | No | Yes — scoped per question |
| Structured evidence display | Yes — SIEM UI | Yes — live Splunk | Yes — SIEM + EDR panels | Yes — PCAP / log viewer | Partial (flat fields) | Yes — typed cards per source |
| Free-text query writing | No (fill-in-blank or MCQ) | Yes — open search bar | No | No | Yes | Yes |
| Hints | Yes — "View Hint" | Yes — sample searches | Yes — step reveal | Yes — structured hints | No | Yes — 1 per question post-submit |
| Worked solution reveal | Yes — after correct | Yes — open-sourced | Yes — after complete | Yes — after submit | No | Yes — post-submit with annotations |
| Partial credit scoring | No — binary pass/fail | Binary | No | No | Yes — 4-dimension weighted | Yes (unchanged) |
| Reviewer / admin view | Instructor dashboard (paid) | Self-hosted scoring app | Team dashboard (paid) | Not applicable | Passcode-gated in-app | Passcode-gated in-app (unchanged) |

---

## Sources

- TryHackMe SOC Simulator launch and structure: https://tryhackme.com/resources/blog/soc-simulator-launch
- TryHackMe SOC L1 Alert Triage room walkthrough (exercise component structure): https://tryhackme.com/room/socl1alerttriage
- Splunk BOTS Investigation Workshop — context, goal, evidence design: https://www.splunk.com/en_us/blog/security/boss-of-the-soc-bots-investigation-workshop-for-splunk.html
- BOTS dataset and scoring open-sourced: https://www.splunk.com/en_us/blog/security/boss-of-the-soc-scoring-server-questions-and-answers-and-dataset-open-sourced-and-ready-for-download.html
- LetsDefend SOC Analyst Learning Path — exercise structure and evidence artifacts: https://app.letsdefend.io/path/soc-analyst-learning-path
- CyberDefenders Blue Team CTF Challenges — investigation structure: https://cyberdefenders.org/blueteam-ctf-challenges/
- OSCAR investigative methodology (Obtain → Strategize → Collect → Analyze → Report): https://www.dropzone.ai/blog/why-socs-rely-on-oscar-a-proven-investigative-framework
- Understanding Student Interaction with AI-Powered Next-Step Hints (arXiv 2511.06362): https://arxiv.org/pdf/2511.06362
- Contextual factors affecting hint utility (PMC, PMC6310403): https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6310403/
- Student assessment in cybersecurity training automated by pattern mining (PMC 2022): https://pmc.ncbi.nlm.nih.gov/articles/PMC8964927/
- Automated feedback for cybersecurity training (Springer 2023): https://link.springer.com/article/10.1007/s10639-023-12265-8
- SOC analyst investigation methodology — TCM Security: https://tcm-sec.com/basics-of-soc-analyst-methodology/
- SIEMXPERT SOC scenario-based interview questions — field-name patterns: https://www.siemxpert.com/blog/top-25-soc-analyst-scenario-based-interview-questions-in-2026/
- PROJECT.md, REQUIREMENTS.md, PLAN.md — project source of truth (internal)
- socQuestions.js — existing dataset (internal)
- Splunk.md — scoring model (internal)

---
*Feature research for: FlagMail Zone 4 SOC Investigation — v1.1 Overhaul*
*Updated: 2026-05-25*
