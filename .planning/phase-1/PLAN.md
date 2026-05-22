# Phase 1 Plan: Question Dataset

**Goal:** Static dataset of 6 SOC investigation question objects in `src/data/socQuestions.js`, importable by downstream phases.

**Depends on:** Nothing

**Requirements:** QSTN-01, QSTN-02, HARD-03

## Decisions (from discuss-phase)

- **Questions**: Q1–Q4 + Q5 (ex-Q8 renumbered). Total 6 objects (Q1, Q2, Q3, Q4, Q5a, Q5b)
- **Q5 split**: Q5a (classification + basic SPL), Q5b (advanced SPL)
- **Zone scoring**: 20 pts SOC zone (4 pts each toward 80 total, scaled to 100)
- **Q5 internal**: 10 pts each, scaled to 2 zone pts
- **Q5a secondary**: compound array `["Initial Access", "Malware Execution"]`
- **Evidence shape**: `{ email: {...}, proxy: {...} | null, edr: {...} | null }`
- **Feedback**: template-generated from keyword hits/misses; custom strings only for classification
- **HARD-03**: callout line at top of README
- **Splunk.md Q5 ref**: orphaned, ignored

## Task 1 — Create `socQuestions.js`

New file at `src/data/socQuestions.js`. Export `SOC_QUESTIONS` array.

### Q1 — Phishing email investigation

```
evidence: { email only }
classification: primary=Phishing Attempt, secondary=Credential Harvesting
splRules: 1 task, basic `index=email` correlation
  required: [index=email, subject, recipient, sender, stats]
  optional: [url, values, count]
  blocked: [delete, outputlookup, collect]
conceptKeywords: required=[credential, phishing, landing page, urgency], optional=[harvesting, password reset]
```

### Q2 — Password spraying

```
evidence: { proxy only (auth logs) } — no email
classification: primary=Password Spraying, secondary=Credential Access
splRules: 1 task, `index=auth` brute-force detection
  required: [index=auth, action=failure, stats, dc(user), src_ip, where]
  optional: [count, time_window]
  blocked: as common (delete, collect, outputlookup)
conceptKeywords: required=[password spraying, brute force, credential access, multiple users], optional=[IP]
```

### Q3 — Malware attachment (ISO)

```
evidence: { email only }
classification: primary=Malware Delivery, secondary=Initial Access
splRules: 1 task, `index=email` with `.iso` attachment
  required: [index=email, attachment, .iso, stats, sender, recipient]
  optional: [subject, count]
conceptKeywords: required=[malware, ISO, attachment, initial access], optional=[invoice, delivery]
```

### Q4 — BEC investigation

```
evidence: { email only }
classification: primary=Business Email Compromise, secondary=Financial Fraud
splRules: 2 tasks (basic + advanced)
  Task 1 — basic: index=email, subject, payment, wire transfer, sender, display_name, stats, recipient
  Task 2 — advanced: index=email, eval, match, sender, display_name, where, external
  optional: [values, count]
  blocked: standard
conceptKeywords: required=[BEC, executive impersonation, wire transfer, urgency, financial fraud, social engineering]
```

### Q5a — Multi-stage correlation (classification + basic SPL)

```
evidence: { email + proxy + EDR }
classification: primary=Malware Infection, secondary=["Initial Access", "Malware Execution"]
splRules: 1 task, basic correlation across indexes
  required: [index=email, index=proxy, index=edr, stats, user, process_name]
  optional: [dest_domain, file_name, values, host]
conceptKeywords: required=[correlation, email proxy EDR, process injection, compromise, kill chain]
```

### Q5b — Multi-stage advanced SPL

```
evidence: { email + proxy + EDR } (same)
classification: none (inherited from Q5a)
splRules: 1 task, advanced kill-chain identification
  required: [index=email, index=proxy, index=edr, stats, process_name, file_name, user]
  optional: [url, dest_domain, values, host, search]
  blocked: standard (delete, outputlookup, collect)
conceptKeywords: required=[kill chain, execution, C2, outbound connection, compromise]
```

### Object shape reference

```js
{
  id: "Q1",
  scenario: "string",
  evidence: {
    email: { from, to, subject, attachment?, url?, deliveryStatus },
    proxy: null | { user, destDomain, action, fileDownloaded? },
    edr: null | { host, process, networkConnection, alert },
  },
  classification: {
    options: { primary: [...], secondary: [...] },
    correct: { primary: "string", secondary: "string" | string[] },
  },
  splRules: {
    tasks: [
      { prompt: "string", required: [...], optional: [...], blocked: [...] },
    ],
  },
  conceptKeywords: {
    required: [...],
    optional: [...],
  },
  feedback: {
    primaryCorrect: "string",
    primaryIncorrect: "string",
    secondaryCorrect: "string",
    secondaryIncorrect: "string",
  },
}
```

## Task 2 — Term-list review

For each of 6 question objects, manually test term list against 3 plausible candidate SPL queries. Verify:
- Required terms catch valid queries (no false fail)
- Blocked terms reject stuffing (no false pass)
- Optional terms correctly additive
- `anyOf` patterns included for time-range and aggregation terms where variants exist

## Task 3 — HARD-03 (already done)

## Verification

- [ ] `socQuestions.js` loads without error
- [ ] Exports `SOC_QUESTIONS` array with 6 objects
- [ ] Every object has: id, scenario, evidence, classification, splRules, conceptKeywords, feedback
- [ ] Q5a secondary is array; all others are strings
- [ ] Q5a has email+proxy+edr evidence; Q5b omits classification
- [ ] SPL rules use `anyOf` arrays for time-range and aggregation terms
- [ ] Each splRules task has ≥1 blocked term
- [ ] Concept keywords are shortest-unambiguous root forms
- [ ] Every term list passes 3 stuffing-attempt checks
- [ ] README has HARD-03 note at top

## Risks

| # | Item | Mitigation |
|---|------|------------|
| R1 | Term list quality — fairness depends on human domain review | Explicit review step against 3 stuffing attempts per question |
| R2 | Splunk.md Q5 ref orphaned | Documented in CONTEXT.md as ignored |
