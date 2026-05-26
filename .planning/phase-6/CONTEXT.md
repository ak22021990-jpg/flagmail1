# Phase 6 — Data Enrichment: Context

## Decisions

### Q5a/Q5b Naming
- Keep Q5a/Q5b as-is (Phase 1 decision validated). No rename to Q8.
- Update REQUIREMENTS.md + ROADMAP.md to say "Q1–Q4, Q5a, Q5b" (6 objects) instead of "Q1–Q4, Q8".

### Source Content
- `Splunk Query Context Explanations.docx` extracted successfully (PowerShell Word COM).
- Content per question in "Platform-Aligned Structure" section provides structured `investigation_context` (goal, analyst_focus, expected_outcome) and task prompt strings directly.
- Q5a + Q5b both inherit same investigation_context from Q8 doc.

### Hint Count
- 2 directional hints per question.
- First hint: evidence-reading guidance (what to look for in the scenario).
- Second hint: SPL approach guidance (what commands/technique to consider).
- No exact SPL syntax in hints (per success criteria).

### Field Structure
```js
investigation_context: {
  goal: "string",
  analyst_focus: ["string"],
  expected_outcome: ["string"]
},
task_prompt: "string",
hints: ["string", "string"]
```

### Data Mappings (docx source → question ID)

| Docx Section | Question ID | Notes |
|-------------|-------------|-------|
| Q1 — Phishing | Q1 | 1:1 mapping |
| Q2 — Password Spraying | Q2 | 1:1 mapping |
| Q3 — Malware Attachment | Q3 | 1:1 mapping |
| Q4 — BEC | Q4 | 1:1 mapping |
| Q8 — Multi-Stage | Q5a, Q5b | Same investigation_context; different task_prompt per sub-question |

### Hints Strategy
- Hint 1: Focus analyst on key evidence indicators (e.g., "Look at the sender domain closely — does it match the claimed organization?")
- Hint 2: Guide SPL approach without revealing exact syntax (e.g., "Consider using stats to group results by sender or URL — this helps identify campaign scope")

## Scope Boundary
- Phase 6 = data only. No UI changes.
- SocRound.jsx, useSocState.js, SocExplanationCard.jsx consume these fields in Phases 8 + 9.
- Phase 9 adds UI rendering for investigation_context and task_prompt.
- Phase 8 adds hint reveal engine.
