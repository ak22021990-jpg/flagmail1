# Phase 1 Discuss Context

**Decisions locked during discuss-phase. Research and planning must not re-ask these.**

## Source Document Gaps Resolved

- **Q5–Q7 gap**: No Q5–Q7 exist in docx. Q8 renumbered to Q5. Deliver Q1–Q4 + Q5 = 5 questions.
- **Splunk.md "Question 5" reference**: Orphaned. Q5 (ex-Q8) has its own validation logic in the docx; the Splunk.md Q5 ref is ignored.
- **Zone scoring**: Zones 1–3 = 60, SOC zone = 20, total = 80 → scaled to 100. Per-question SOC zone contribution = 4 pts (20 ÷ 5).

## Q5 (ex-Q8) Multi-Stage Shape

- Split into **2 sub-questions**: `Q5a` (classification + basic SPL correlation) and `Q5b` (advanced SPL kill-chain query)
- Zone point split: **2 + 2 even**
- Internal scoring: **10 points each** (simplified, scaled to 2 zone pts via ratio)
- Sub-questions stored as separate objects: `id: "Q5a"`, `id: "Q5b"`
- Q5a secondary answer is compound array (`["Initial Access", "Malware Execution"]`)

## Question Object Schema

```js
{
  id: "Q1",          // string, unique
  scenario: "string", // prompt text
  evidence: {
    email: { from, to, subject, attachment?, url?, deliveryStatus, ... },
    proxy: { user, destDomain, action, fileDownloaded? } | null,
    edr: { host, process, networkConnection, alert } | null,
  },
  classification: {
    options: {
      primary: ["Phishing Attempt", "Malware Infection", ...],
      secondary: ["Credential Harvesting", "Initial Access", ...],
    },
    correct: {
      primary: "Phishing Attempt",           // string
      secondary: "Credential Harvesting"      // string, or string[] for compound
    },
  },
  splRules: {
    tasks: [
      {
        prompt: "Write query to...",
        required: ["index=email", "subject", ...],
        optional: ["url", "values", ...],
        blocked: ["delete", "outputlookup", "collect"],
      },
    ],
  },
  conceptKeywords: {
    required: ["credential", "phishing", ...],
    optional: ["harvesting", "landing page", ...],
  },
  feedback: {
    // template-generated from keyword hit/miss for SPL + explanation
    // custom strings only for classification:
    primaryCorrect: "string",
    secondaryCorrect: "string",
    primaryIncorrect: "string",
    secondaryIncorrect: "string",
  },
}
```

## HARD-03 (README Canonical Directory Note)

- Single callout line at top of README.md
- `> **Note:** \`flagmail1/\` is the canonical project directory. \`flagmail/\` is deprecated.`

## State

- **Phase 1 PLAN.md**: Updated with assumptions/risks from discuss
- **PLAN.md ready for**: Task breakdown at plan-phase time
- **Blocked**: Nothing
