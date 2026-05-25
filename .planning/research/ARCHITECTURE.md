# Architecture Research

**Domain:** SOC Investigation Zone 4 — restructuring existing implementation
**Researched:** 2026-05-25
**Confidence:** HIGH — based on direct codebase inspection of all relevant files

---

## Current As-Built State

Zone 4 is already implemented and wired end-to-end. The milestone is a restructuring and
bug-fix pass, not a greenfield build. The architecture below documents what exists and what
must change.

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                          App.jsx (shell)                          │
│  gs = useGameState()                                              │
│  sc = useScoring()                                                │
│  soc = useSocState(gs)                                            │
│  badges = useBadges()                                             │
│                                                                   │
│  Conditional screen render on gs.screen ────────────────────────  │
│                                                                   │
│  Zone 1–3 flow:                                                   │
│  LANDING → TUTORIAL → ZONE_INTRO → ROUND → EXPLANATION            │
│         → ZONE_COMPLETE (loop) → SOC_INTRO (after zone 3)         │
│                                                                   │
│  Zone 4 (SOC) flow:                                               │
│  SOC_INTRO → SOC_ROUND → SOC_EXPLANATION → (repeat) → SOC_RESULTS │
│                                                                   │
│  Side paths:                                                      │
│  LANDING → REVIEWER (passcode gate, independent of game flow)     │
└──────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                       State Hook Layer                            │
│  useGameState   — SCREENS enum, zone progression, player, email   │
│  useScoring     — per-email/zone/total scores for zones 1–3       │
│  useSocState    — SOC question index, per-question answers,        │
│                   validation dispatch, score accumulation,        │
│                   GAS submission                                  │
│  useBadges      — badge unlock conditions                         │
│  useProctoring  — tab-switch detection (inside SocRound)          │
└──────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                       Utility Layer (pure functions)              │
│  validateSpl.js   — keyword match: required/optional/blocked      │
│  validateExplanation (exported from validateSpl.js)               │
│  scoreSoc.js      — 23-pt model + scaleSocScore for combined /100 │
└──────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                       Data Layer (static)                         │
│  src/data/socQuestions.js  — 6 SOC question objects (Q1–Q5b)     │
│  src/data/emails.js        — 15 classification emails (zones 1–3) │
└──────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                       External Layer                              │
│  Google Apps Script web app                                       │
│    POST action:register | submit | submitFinal                    │
│    GET  ?action=getSOCSubmissions&passcode=...                    │
│    MailApp.sendEmail() → 4 hardcoded reviewer addresses           │
└──────────────────────────────────────────────────────────────────┘
```

---

## Component Inventory: Zone 4 (SOC)

### Existing — No Modification Needed

| File | Role | Notes |
|------|------|-------|
| `src/hooks/useGameState.js` | SCREENS enum, screen transitions | `SOC_INTRO`, `SOC_ROUND`, `SOC_EXPLANATION`, `SOC_RESULTS`, `REVIEWER` already defined. `advanceZone` already routes zone-3 exit to `SOC_INTRO`. No changes needed here. |
| `src/utils/validateSpl.js` | SPL + explanation keyword validation | Correct. Handles `anyOf` terms, normalized text. No changes needed. |
| `src/utils/scoreSoc.js` | Per-question scoring + final score scaling | Correct. `scoreSocRound` + `scaleSocScore` cover all requirements. No changes needed. |
| `src/components/SocIntroCard.jsx` | Zone 4 introduction screen | Renders correctly. Not in scope for restructuring. |
| `src/components/SocExplanationCard.jsx` | Per-question feedback after submission | Score breakdown, keyword hits/misses, grade band. No structural changes needed. |
| `src/components/ReviewerScreen.jsx` | Passcode gate + SOC submissions table | Fetches via GET `?action=getSOCSubmissions`. Works correctly for reviewer read path. |

### Existing — Requires Modification

| File | What Changes | Reason |
|------|-------------|--------|
| `src/data/socQuestions.js` | Enrich each question object with `scenario_context`, `investigation_prompt`, `hints` array per question | Current questions have `scenario` (single line) but no investigation narrative, no structured hints for the hint engine, no explicit `investigation_context` that separates the scenario backdrop from the SPL task prompt. The `splRules.tasks[n].prompt` field exists but is not rendered in the UI. |
| `src/components/SocRound.jsx` | Restructure layout from all-at-once to guided flow; add hint engine; expose SPL task prompt | Currently renders Evidence + Classification + SPL + Explanation simultaneously as a single scrollable panel. Needed: step-aware UI that contextualises the investigation. |
| `src/hooks/useSocState.js` | Add hint reveal state, possibly a `stepIndex` for guided flow | Currently manages answers, validation, scoring, and submission. Hint engine needs `hintsRevealed` array per question. |
| `google-apps-script.js` | Debug and fix `MailApp.sendEmail()` | Email delivery is broken. Cause is under investigation but likely: quota exhaustion, recipient list format, or GAS `MailApp` vs `GmailApp` API mismatch. |
| `src/App.jsx` | Wire hint state from `useSocState` into `SocRound`; pass `onRevealHint` callback | If hint state is added to `useSocState`, App must thread it as a prop to `SocRound`. |

### New Files Required

| File | Purpose |
|------|---------|
| (none for components — restructure existing `SocRound.jsx`) | The existing `SocRound.jsx` is the right boundary; it should be restructured rather than replaced. A new `HintPanel.jsx` sub-component is the only new component likely needed. |
| `src/components/HintPanel.jsx` | Renders collapsible hint cards for the active question; receives `hints` array and `hintsRevealed` index from parent. |

---

## Data Structure: What Must Change in `socQuestions.js`

Current shape (Q1 example):

```js
{
  id: "Q1",
  scenario: "A user reports...",          // single-line — too thin for UX
  evidence: { email: {...}, proxy: null, edr: null },
  classification: { options: {...}, correct: {...} },
  splRules: {
    tasks: [
      {
        prompt: "Write an SPL query...",  // exists but not rendered in current UI
        required: [...],
        optional: [...],
        blocked: [...],
      }
    ]
  },
  conceptKeywords: { required: [...], optional: [...] },
  feedback: { primaryCorrect: "...", primaryIncorrect: "...", ... },
}
```

Required additions (new fields only, existing fields untouched):

```js
{
  // ... all existing fields unchanged ...

  // NEW: Richer investigation narrative shown above evidence
  investigation_context: "You are a SOC Tier 1 analyst. A user in the Finance team...",

  // NEW: Per-task hints (one hints array per splRules.tasks entry)
  splRules: {
    tasks: [
      {
        prompt: "...",        // already exists
        required: [...],      // already exists
        optional: [...],      // already exists
        blocked: [...],       // already exists
        hints: [              // NEW — revealed progressively
          "Start by scoping to the correct index for this evidence type.",
          "Include the sender field to identify the originating address.",
          "Use stats to group the results — what dimension are you grouping by?",
        ],
      }
    ]
  },

  // NEW: Explanation task prompt (what to write about)
  explanation_prompt: "Explain why you classified this as phishing and what indicators led you to that conclusion.",
}
```

**Constraint:** All existing field names (`scenario`, `evidence`, `classification`,
`splRules`, `conceptKeywords`, `feedback`) are untouched. New fields are additive.
`useSocState` and `validateSpl` do not need changes to handle these additions —
they are display-only fields consumed by `SocRound`.

---

## Component Boundaries: SOC Flow

### `SocRound.jsx` — Restructured Layout

Current layout: single two-column grid (evidence left, all inputs right — classification,
SPL textarea, explanation textarea, submit).

Target layout: guided flow within the same two-column shell:

```
┌──────────────────────────────────────────────────────────────────┐
│  Header: SOC Investigation | Q{n} of {total} | progress dots     │
├─────────────────────────────┬────────────────────────────────────┤
│  LEFT PANEL                 │  RIGHT PANEL                       │
│  ─────────────────────────  │  ─────────────────────────────     │
│  investigation_context      │  Classification (if applicable)    │
│  (scenario narrative)       │    Primary picker                  │
│                             │    Secondary picker (unlocks       │
│  Evidence cards:            │    after primary selected)         │
│    Email card               │                                    │
│    Proxy card               │  SPL Task Prompt                   │
│    EDR card                 │    (splRules.tasks[n].prompt)       │
│                             │                                    │
│  HintPanel                  │  SPL textarea (monospace)          │
│    (collapsible hints)      │                                    │
│                             │  Explanation Prompt                │
│                             │    (explanation_prompt field)      │
│                             │                                    │
│                             │  Explanation textarea              │
│                             │                                    │
│                             │  [Submit] button                   │
└─────────────────────────────┴────────────────────────────────────┘
```

The right panel already scrolls independently (`maxHeight: calc(100dvh - 140px)`).
The evidence left panel stays sticky/visible. The structural change is:

1. Render `investigation_context` above the evidence cards (currently `scenario` is in the
   header only).
2. Render `splRules.tasks[0].prompt` as a visible section label above the SPL textarea
   (currently the prompt field exists in data but is not rendered anywhere in the UI).
3. Render `explanation_prompt` as a visible section label above the explanation textarea.
4. Add `<HintPanel>` at the bottom of the left panel.

**Props interface remains unchanged.** `SocRound` already receives `question`, `answer`,
`progress`, `onSetPrimary`, `onSetSecondary`, `onSetSplText`, `onSetExplanation`, `onSubmit`,
`onViolationChange`. Add one new prop: `onRevealHint(questionIdx, hintIdx)`.

### `HintPanel.jsx` — New Sub-component

```
Props:
  hints:          string[]          — from question.splRules.tasks[0].hints
  hintsRevealed:  number            — count of hints already shown (0..hints.length)
  onRevealHint:   () => void        — increments hintsRevealed in useSocState

Renders:
  - Collapsed by default
  - "Show hint {n}" button reveals next hint sequentially
  - Already-revealed hints show as read-only cards
  - When all hints revealed: "No more hints"
```

### `useSocState.js` — Hint State Addition

New state in existing hook:

```js
// Existing state (untouched):
const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
const [answers, setAnswers] = useState(initialAnswers);
const [showResults, setShowResults] = useState(false);

// NEW:
const [hintsRevealed, setHintsRevealed] = useState(
  () => SOC_QUESTIONS.map(() => 0)    // one counter per question
);

const revealNextHint = useCallback(() => {
  setHintsRevealed(prev => {
    const next = [...prev];
    const q = SOC_QUESTIONS[currentQuestionIdx];
    const maxHints = q.splRules?.tasks?.[0]?.hints?.length ?? 0;
    next[currentQuestionIdx] = Math.min(prev[currentQuestionIdx] + 1, maxHints);
    return next;
  });
}, [currentQuestionIdx]);
```

Return addition:

```js
return {
  // ... all existing return values unchanged ...
  hintsRevealed: hintsRevealed[currentQuestionIdx],
  revealNextHint,
};
```

---

## Data Flow: SOC Question Lifecycle (As Restructured)

```
Candidate enters SOC_ROUND screen
    ↓
SocRound renders SOC_QUESTIONS[currentQuestionIdx]
    │
    ├── LEFT:  investigation_context + evidence cards + HintPanel
    └── RIGHT: classification pickers → SPL prompt → SPL textarea
                                      → explanation prompt → explanation textarea
    ↓
Candidate optionally reveals hints (HintPanel → revealNextHint → hintsRevealed[idx]++)
    ↓
Candidate fills classification, SPL, explanation → Submit button activates
    ↓
useSocState.submitSocRound()
    ├── validateSpl(answer.splText, task)           [per task in splRules.tasks]
    ├── validateExplanation(answer.explanation, conceptKeywords)
    ├── scoreSocRound({ primaryCorrect, secondaryRatio, splValidation, explanationValidation }, config)
    └── setAnswers: answers[idx] = { ...answer, submitted: true, result: record }
    ↓
App.jsx handleSocSubmit → gs.setScreen(SCREENS.SOC_EXPLANATION)
    ↓
SocExplanationCard shows score breakdown, keyword hits/misses, grade band
    ↓
Candidate clicks "Next question" → App.jsx handleSocNext → soc.nextQuestion()
    │
    ├── hasMore = true  → gs.setScreen(SCREENS.SOC_ROUND)
    │
    └── hasMore = false →
            scaleSocScore(soc.socTotal, sc.totalScore)
            soc.submitFinal(consolidatedPayload)    [POST to GAS + sessionStorage fallback]
            gs.setScreen(SCREENS.SOC_RESULTS)
    ↓
ResultsScreen (SOC_RESULTS) shows combined final score
```

---

## Data Flow: Email Delivery (Bug Fix Path)

Current implementation in `google-apps-script.js` (lines 237–243):

```js
MailApp.sendEmail({
  to: recipients.join(','),
  subject: subject,
  body: emailBody,
  attachments: [csvBlob],
});
```

Known failure modes to investigate:

1. **`MailApp` daily quota** — free Google accounts: 100 emails/day; Workspace: 1500/day.
   `MailApp.getRemainingDailyQuota()` can be checked before calling.

2. **`to` field format** — passing a comma-joined string with 4 addresses may be rejected
   silently in some GAS runtime versions. Confirmed correct format for `MailApp.sendEmail`
   is comma-delimited string.

3. **Recipient domain restrictions** — Workspace admins can restrict outbound mail to
   approved domains. `sutherlandglobal.com` recipients from a personal Google account
   sending via GAS may be blocked server-side.

4. **Blob MIME type mismatch** — `text/csv` MIME type with `.csv` extension is correct
   but some GAS deployments reject non-standard MIME blobs.

5. **`Logger.log` loss** — the `catch` block logs but the log is ephemeral. Add
   `console.log` + check GAS execution transcripts to capture the actual error.

Fix approach:
- Add `MailApp.getRemainingDailyQuota()` guard before `sendEmail`.
- Split `to` into multiple `sendEmail` calls (one per recipient) to isolate failures.
- Log the full exception object, not just `mailErr.message`.
- Consider `GmailApp.sendEmail()` as an alternative (same quota, sometimes more permissive).
- Move recipient list to `PropertiesService` for runtime configurability.

---

## Existing vs New File Classification

### Files to Modify

| File | Modification Scope | Risk |
|------|--------------------|------|
| `src/data/socQuestions.js` | Add `investigation_context`, `explanation_prompt`, `hints` per task | LOW — additive only; no existing field renamed or removed |
| `src/components/SocRound.jsx` | Add left-panel narrative + hint panel; expose SPL/explanation prompts | MEDIUM — layout restructure, prop interface grows by 2 |
| `src/hooks/useSocState.js` | Add `hintsRevealed` state + `revealNextHint` action | LOW — additive; existing actions unchanged |
| `src/App.jsx` | Thread `hintsRevealed` and `revealNextHint` into `SocRound` props | LOW — one new prop pair |
| `google-apps-script.js` | Debug and fix `MailApp.sendEmail`; add quota guard | MEDIUM — GAS deployment required after change |

### Files That Are New

| File | Type |
|------|------|
| `src/components/HintPanel.jsx` | New sub-component |

### Files That Are Untouched

All zones 1–3 components, hooks, and data files. The `validateSpl.js`, `scoreSoc.js`,
`SocExplanationCard.jsx`, `SocIntroCard.jsx`, and `ReviewerScreen.jsx` require no changes.

---

## Suggested Build Order

Dependencies listed; each step unblocks the next:

1. **`src/data/socQuestions.js` — data enrichment**
   Add `investigation_context`, `explanation_prompt`, and `hints` arrays to all 6 questions.
   No code changes; pure data authoring. Unblocks SocRound restructure and HintPanel.

2. **`google-apps-script.js` — email delivery fix**
   Can be worked on in parallel with UI changes. Requires GAS editor access + redeployment.
   Test with a single-recipient `sendEmail` call before restoring multi-recipient.

3. **`src/hooks/useSocState.js` — hint state**
   Add `hintsRevealed` and `revealNextHint`. 10–15 lines. No existing logic changes.
   Unblocks `HintPanel` and `SocRound` prop interface.

4. **`src/components/HintPanel.jsx` — new component**
   Pure display component; no hook dependencies. Receives `hints`, `hintsRevealed`, and
   `onRevealHint` as props. Can be developed and visually verified in isolation.

5. **`src/components/SocRound.jsx` — layout restructure**
   Depends on: enriched data shape (step 1), `HintPanel` (step 4), updated prop interface
   from `useSocState` (step 3). This is the largest change. Restructure left panel to show
   `investigation_context`, render `splRules.tasks[0].prompt` above SPL textarea, render
   `explanation_prompt` above explanation textarea, mount `<HintPanel>`.

6. **`src/App.jsx` — wire new props**
   Thread `soc.hintsRevealed` and `soc.revealNextHint` into `<SocRound>`. One-line prop
   additions.

---

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|--------------|-------|
| `App.jsx` → `useSocState` | Hook call; returns state + actions | `soc.hintsRevealed` + `soc.revealNextHint` are new additions |
| `App.jsx` → `SocRound` | Props: all answer state + action callbacks | Add `hintsRevealed` + `onRevealHint` props |
| `SocRound` → `HintPanel` | Props: `hints`, `hintsRevealed`, `onRevealHint` | One-directional; HintPanel is display-only |
| `useSocState.submitSocRound` → `validateSpl` / `scoreSocRound` | Direct function calls | Pure functions; no change needed |
| `useSocState.submitFinal` → GAS | `fetch(LEADERBOARD_URL, { method: 'POST', mode: 'no-cors' })` | Existing pattern; `no-cors` means response is opaque |
| `ReviewerScreen` → GAS | GET `?action=getSOCSubmissions&passcode=...` | Existing pattern; returns JSON with CORS headers |

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Google Apps Script (submitFinal) | POST, `mode: 'no-cors'`, fire-and-forget | `sessionStorage` fallback on failure. MailApp bug on server side — fix in GAS, not client. |
| Google Apps Script (getSOCSubmissions) | GET with query params, full JSON response | Needs GAS `doGet` returning `ContentService.createTextOutput` with JSON MIME type |

---

## Architectural Constraints to Honour

These are non-negotiable given the existing system:

- No router, no context API — screen transitions via `gs.setScreen(SCREENS.X)` only.
- No new hook dependencies between hooks — `useSocState` only couples to `gs` via the
  `gs` parameter passed at construction; hint state stays internal to `useSocState`.
- All validation runs client-side — `validateSpl` and `scoreSocRound` are called inside
  `useSocState.submitSocRound`, not in the component and not on the backend.
- The zone 1–3 flow must not be touched — `useGameState`, `useScoring`, `useBadges`,
  `useTimer`, all existing screen components are out of scope for this milestone.
- Static data only — `socQuestions.js` stays a plain JS export; no fetch, no async loading.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Adding Step State to `useGameState`

**What people do:** Add a `socStep` enum (`scenario | evidence | classify | spl | explain`)
to `useGameState` so the SOC question flow uses the main screen machine.

**Why it is wrong:** `useGameState` owns zone/email progression. Adding SOC sub-step state
turns 12 SCREENS into 12+5 and makes zone 1–3 logic defensive against SOC step leakage.

**Do this instead:** If a guided step flow is needed within `SOC_ROUND`, manage it as local
component state in `SocRound.jsx` or as an additional state slice in `useSocState`. It is
a question-local UI concern, not a top-level navigation concern.

### Anti-Pattern 2: Revealing All Hints at Once

**What people do:** Show all `hints` as an accordion that expands to reveal all items.

**Why it is wrong:** This defeats the pedagogical intent of progressive disclosure; candidates
bypass hints as a learning scaffold.

**Do this instead:** Reveal hints one at a time, in order, via a "Show next hint" button.
Track `hintsRevealed` as a per-question integer index in `useSocState`.

### Anti-Pattern 3: Putting `investigation_context` in the Header

**What people do:** Append `investigation_context` to the existing header bar where `scenario`
already appears.

**Why it is wrong:** The header is a compact nav element. Investigation context is a multi-
sentence narrative — cramming it into the header makes the header too large and obscures
navigation chrome.

**Do this instead:** Render `investigation_context` as the first card in the left evidence
panel, above the evidence artifact cards. It acts as the "briefing" before the evidence.

### Anti-Pattern 4: Fixing Email by Changing the Fetch Mode

**What people do:** Change `mode: 'no-cors'` to `mode: 'cors'` on the `submitFinal` POST,
assuming the fetch mode is what prevents email delivery.

**Why it is wrong:** The email send happens entirely server-side in GAS. The fetch mode
controls CORS headers on the response, not what GAS does with the payload. The email bug
is in `google-apps-script.js`, not in the client fetch call.

**Do this instead:** Debug by reading GAS execution logs (Apps Script editor → Executions).
Add `Logger.log('Email error:', JSON.stringify(mailErr))` in the catch block. Check quota
with `MailApp.getRemainingDailyQuota()`. Consider splitting multi-recipient sends.

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|-----------|-------|
| Existing screen state machine | HIGH | Direct inspection of `useGameState.js` — SCREENS enum and advanceZone confirmed correct |
| useSocState existing behaviour | HIGH | Full file read — answers, validation, scoring, submitFinal all working |
| Hint engine design | HIGH | Standard progressive disclosure pattern; fits cleanly into useSocState |
| SocRound layout restructure scope | HIGH | Full component read — layout targets are clear |
| Data enrichment fields needed | HIGH | Derived from milestone requirements vs. current question shape |
| Email delivery bug cause | MEDIUM | Root cause unconfirmed — GAS logs not yet inspected; multiple plausible causes identified |
| HintPanel implementation | HIGH | Simple display component, no novel patterns |

---

*Architecture research for: FlagMail SOC Investigation Zone 4 Restructure (v1.1)*
*Researched: 2026-05-25*
