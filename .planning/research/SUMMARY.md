# Research Summary — v1.1 SOC Investigation Overhaul + Email Fix

**Researched:** 2025-05-25

## Executive Summary

FlagMail Zone 4 is a partially-built SPL query-writing assessment embedded in a larger email-classification game. The v1.1 milestone is a refinement pass on an already-wired Zone 4, not a greenfield build. The existing system has 6 SOC question objects, a 23-point keyword-match scoring engine, a passcode-gated reviewer view, and a Google Apps Script backend. What the current build lacks — and what v1.1 delivers — is investigation realism: structured scenario context, analyst focus framing, hint scaffolding, worked solution reveal, and a fix for broken reviewer email delivery.

Competitor platforms (TryHackMe SOC Simulator, Splunk BOTS, LetsDefend, CyberDefenders) all treat investigation goal framing and post-submit solution reveal as baseline requirements; without them, Zone 4 reads as a quiz rather than a SOC simulation.

**Zero new npm packages needed.** All five improvement areas are solvable through data authoring, component restructuring, a small state addition, one new sub-component, and a server-side GAS fix.

## Recommended Stack

No new packages. Each candidate was evaluated and rejected:

| Candidate | Verdict | Reason |
|-----------|---------|--------|
| `@uiw/react-codemirror` | REJECT | 180-220 KB, SQL grammar mislabels SPL tokens |
| Monaco Editor | REJECT | 3-5 MB bundle, massive overkill |
| `@floating-ui/react` | REJECT | Wrong UX pattern (anchor positioning vs disclosed panel) |
| `react-hook-form`/`zod` | REJECT | 2-field form doesn't need a form library |

Existing `framer-motion` `AnimatePresence` covers hint panel animation. Pure `useState` + `touched` flags cover form validation.

## Table Stakes (Must Have for v1.1)

- Investigation context block per question (goal + analyst focus + expected outcome)
- Evidence artifact display as typed cards (not flat field dump)
- Scenario-tied SPL task prompts (surface existing `splRules.tasks[0].prompt`)
- GAS email delivery fix
- Hint engine (one per question, post-first-submit, directional only)
- Worked-solution reveal with clause annotations
- Human-readable per-dimension feedback labels

## Defer (Not This Milestone)

- Real Splunk execution
- LLM semantic grading
- Reviewer login/auth
- SPL syntax highlighting
- Timer on SOC questions
- Leaderboard integration for SOC scores

## Architecture

**5 files to modify, 1 new file:**

| File | Change |
|------|--------|
| `src/data/socQuestions.js` | Add investigation_context, explanation_prompt, hints fields |
| `src/hooks/useSocState.js` | Add hintsRevealed state + revealNextHint callback (~15 lines) |
| `src/components/SocRound.jsx` | Layout restructure: investigation context, evidence cards, hint panel |
| `src/components/HintPanel.jsx` | NEW: hint reveal sub-component |
| `src/App.jsx` | Thread 2 new props (one-line additions) |
| `google-apps-script.js` | Email fix: logging, quota guard, re-authorization |

**No changes needed:** `validateSpl.js`, `scoreSoc.js`, `SocExplanationCard.jsx`, `SocIntroCard.jsx`, `ReviewerScreen.jsx`

## Top Pitfalls

1. **GAS MailApp scope not re-authorized** — emails fail silently after redeploy; must trigger OAuth dialog in GAS editor
2. **Term-stuffing passes validation** — author required terms as multi-token phrases, add blocked terms
3. **False fails from alternate SPL syntax** — extend `anyOf` to required terms, add whitespace normalization
4. **Evidence panel broken by enriched data** — `SocRound.jsx` assumes flat strings; add type guards
5. **Zone 1-3 regression from App.jsx edits** — mandatory manual E2E before/after every App.jsx commit

## Suggested Phase Structure

1. **Question Dataset Enrichment** — data foundation; all UI phases read from it; resolves Q5a/Q5b weight blocker
2. **Validation Engine Hardening** — extend anyOf, whitespace normalization, unit tests
3. **Hint Engine and State** — hintsRevealed + revealNextHint + HintPanel.jsx
4. **SocRound Layout Restructure** — largest change; evidence cards, investigation context, prompts, worked-solution
5. **GAS Email Delivery Fix** — independent; requires GAS Executions log inspection first

## Research Flags

- **GAS email root cause unconfirmed** — Executions log must be inspected before fix is designed
- **Q5a/Q5b score weight decision** — unresolved blocker in STATE.md; must resolve in Phase 1
- **Evidence schema choice** — type-guard approach recommended for v1.1 (vs full restructure)

## Confidence: HIGH

All findings grounded in direct source file inspection, npm CLI verification, and competitor platform analysis. One MEDIUM area: GAS email root cause needs log confirmation.
