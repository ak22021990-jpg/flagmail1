# Architecture Research

**Domain:** Adding a SOC Investigation level (Zone 4) to an existing React 19 classification game
**Researched:** 2026-05-21
**Confidence:** HIGH — based on direct codebase inspection, no training assumptions required

---

## System Overview

The existing system is a linear screen state machine rendered by `App.jsx`. `useGameState`
owns all navigation. No router, no context API. Everything flows through the `gs` and `sc`
objects composed at the App level.

```
┌─────────────────────────────────────────────────────────────────┐
│                         App.jsx (shell)                          │
│  gs = useGameState()    sc = useScoring()                        │
│                                                                  │
│  gs.screen switch ────────────────────────────────────────────── │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ LANDING  │  │ TUTORIAL │  │ZONE_INTRO│  │      ROUND       │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────┐                │
│  │ EXPLANATION │  │ ZONE_COMPLETE│  │ RESULTS  │                │
│  └─────────────┘  └──────────────┘  └──────────┘                │
├─────────────────────────────────────────────────────────────────┤
│                        Hooks Layer                               │
│  useGameState  useScoring  useBadges  useTimer  useLeaderboard  │
├─────────────────────────────────────────────────────────────────┤
│                         Data Layer                               │
│   src/data/emails.js (static)    src/data/socQuestions.js (new) │
├─────────────────────────────────────────────────────────────────┤
│                       Backend (GAS)                              │
│   POST register | POST submit | POST submitSOC | GET checkEmail │
└─────────────────────────────────────────────────────────────────┘
```

The SOC Investigation level slots in between the existing `ZONE_COMPLETE` (zone 3) exit and
`RESULTS`. The `advanceZone` function in `useGameState` currently goes straight to `RESULTS`
when `zone > 3`. Zone 4 intercepts that moment.

---

## Integration Strategy: Extend Without Rewriting

### Key Constraint

`useGameState.js` must not change for zones 1–3. The zone counter already goes 1→2→3 and
then routes to RESULTS. The SOC level is a discrete mode entered after zone 3 completes,
not a 4th zone in the existing loop.

### Screen State Extension

Add three new entries to the `SCREENS` enum in `useGameState.js`:

```js
export const SCREENS = {
  // existing — untouched
  LANDING:         'landing',
  TUTORIAL:        'tutorial',
  ZONE_INTRO:      'zone_intro',
  ROUND:           'round',
  EXPLANATION:     'explanation',
  ZONE_COMPLETE:   'zone_complete',
  RESULTS:         'results',
  // new — SOC level
  SOC_INTRO:       'soc_intro',
  SOC_ROUND:       'soc_round',
  SOC_EXPLANATION: 'soc_explanation',
  // new — reviewer
  REVIEWER:        'reviewer',
};
```

`SOC_INTRO` mirrors `ZONE_INTRO` — it introduces zone 4 before the first question.
`SOC_ROUND` is the primary question screen (classify + SPL + explanation editor).
`SOC_EXPLANATION` shows per-question feedback before advancing to the next question.
`REVIEWER` is a passcode-gated screen reachable independently of normal game flow.

### Transition Hook: Minimal Patch to `advanceZone`

Only the zone-3 exit path in `useGameState` changes. Replace the `RESULTS` routing with
`SOC_INTRO` routing:

```js
const advanceZone = useCallback(() => {
  const nextZone = zone + 1;
  if (nextZone > 3) {
    // existing: setScreen(SCREENS.RESULTS);
    setScreen(SCREENS.SOC_INTRO);  // zone 3 now hands off to SOC intro
    return;
  }
  setZone(nextZone);
  // ... rest unchanged
}, [zone, zoneStart]);
```

This is a one-line change. All zone 1–3 transitions are unchanged.

### SOC State Lives in a Dedicated Hook: `useSocState`

The SOC level has distinct state needs that do not overlap with classification round state.
Mixing them into `useGameState` would introduce branches into every existing action. Instead,
a new isolated hook owns all SOC flow:

```
useSocState
  socScreen:          'intro' | 'round' | 'explanation'
  currentQuestionIdx: number
  socRound: {
    selectedPrimary:   string | null
    selectedSecondary: string | null
    splText:           string
    explanationText:   string
    submitted:         boolean
    result:            SocResult | null
  }
  socRecords:         SocResult[]   // one per question, for final submit
  // actions
  startSoc()
  selectPrimary(val)
  selectSecondary(val)
  setSplText(val)
  setExplanationText(val)
  submitSocRound()   → runs validation + scoring inline, stores result
  nextSocQuestion()  → advances or exits to RESULTS
  goToResults()      → calls into gs.goToResults()
```

`App.jsx` composes `useSocState` alongside `useGameState` and `useScoring`. The SOC hook
receives `gs.goToResults` as a callback (or calls it directly if imported from the hook
return value). No circular dependency because `useSocState` only reads from `gs.player`
and calls `gs.goToResults`, both of which are stable references.

### Reviewer Access via SCREENS.REVIEWER

The reviewer screen needs to be reachable without completing the game. Two viable approaches:

**Approach A (recommended):** A small "Reviewer" link on the `LandingScreen` (e.g., bottom
corner, low-prominence) calls `gs.setScreen(SCREENS.REVIEWER)`. The reviewer screen prompts
for the passcode before rendering submissions. This keeps everything in the same SPA
without adding URL routing.

**Approach B (simpler but slightly awkward):** A separate HTML page (`reviewer.html`) with
its own minimal script, fetching from GAS directly. Avoids any App.jsx change but creates
a second entry point to maintain.

Approach A is recommended because it reuses the existing glass card components and CSS
system, and the passcode validation is a client-side string comparison (acceptable for a
shared password with no sensitive personal data beyond names/emails that are already
public in the game flow).

---

## Component Boundaries

### New Components

| Component | Location | Responsibility | Reuses |
|-----------|----------|---------------|--------|
| `SocIntroCard.jsx` | `src/components/` | Zone 4 introduction card | `ZoneIntroCard` pattern, `glass` token |
| `SocRound.jsx` | `src/components/` | Question screen: scenario, evidence panel, pickers, SPL editor, explanation textarea, submit | `Classifier` for pickers, `glass` token |
| `SocExplanationCard.jsx` | `src/components/` | Per-question feedback: scores breakdown, correct answer, keyword hits/misses | `ExplanationCard` pattern |
| `ReviewerScreen.jsx` | `src/components/` | Passcode gate + submissions table | `glass` token |
| `SplEditor.jsx` | `src/components/` | Multi-line `<textarea>` with monospace font and line-count indicator | New, no dependency |
| `EvidencePanel.jsx` | `src/components/` | Displays scenario + log evidence for a SOC question | Mirrors `EmailCard` structure |

### Existing Components Reused Without Modification

| Component | Role in SOC Level |
|-----------|------------------|
| `LandingScreen.jsx` | Add reviewer link (single small addition) |
| `Classifier.jsx` | Reused directly for primary and secondary pickers — pass question-specific `options` prop if Classifier accepts dynamic option lists; otherwise create `SocClassifier` variant |
| `BadgeToast.jsx` | Can fire on SOC completion if badge logic is extended |
| `ResultsScreen.jsx` | Receives combined final score after SOC completes |
| `ZoneComplete.jsx` | May be reused for SOC zone complete summary, or skipped in favor of direct RESULTS routing |

Note on `Classifier.jsx`: the existing component has hardcoded L1/L2 category lists. SOC
questions have different option sets per question. Either (a) pass options as props and make
the component data-driven, or (b) build a lightweight `SocClassifier` that mirrors the
visual pattern with dynamic props. Option (b) is safer — it avoids touching a tested
component — and is the recommended approach.

### New Hook

| Hook | Location | Responsibility |
|------|----------|---------------|
| `useSocState.js` | `src/hooks/` | SOC question flow, round state, validation dispatch, score accumulation, sheet submission for SOC records |

### New Utilities

| Utility | Location | Responsibility |
|---------|----------|---------------|
| `validateSpl.js` | `src/utils/` | Keyword-matching validation engine for SPL and explanation fields |
| `scoreSoc.js` | `src/utils/` | 23-point scoring model: takes validation result, returns score breakdown |

### New Data

| File | Location | Shape |
|------|----------|-------|
| `socQuestions.js` | `src/data/` | Array of SOC question objects (see shape below) |

---

## SOC Question Dataset Shape

Mirrors the `EMAIL_POOL` convention in `emails.js` — a named export, static array, one
object per question:

```js
export const SOC_QUESTIONS = [
  {
    id: 'SOC001',
    zone: 4,
    title: 'Credential Harvesting via Phishing Redirect',
    scenario: 'A user reports receiving a suspicious email...',
    evidence: {
      email: {
        from: 'hr-notifications@corp-hr-portal.co',
        subject: 'Urgent: Update your payroll details',
        body: '...',
        auth: { spf: 'Fail', dkim: 'None', dmarc: 'Fail' },
      },
      proxy: [
        'GET http://corp-hr-portal.co/payroll-update → 302 → http://185.220.x.x/harvest',
        'POST http://185.220.x.x/harvest → 200',
      ],
      edr: [
        'chrome.exe → Suspicious outbound connection to 185.220.x.x',
      ],
    },
    primaryOptions: [
      'Credential Harvesting',
      'Business Email Compromise',
      'Malware Delivery',
      'Legitimate HR Communication',
    ],
    correctPrimary: 'Credential Harvesting',
    secondaryOptions: [
      'Phishing Redirect Chain',
      'Lookalike Domain',
      'Compromised Internal Account',
      'None of the above',
    ],
    correctSecondary: 'Phishing Redirect Chain',
    spl: {
      required: ['index=proxy', 'dest_ip', '185.220'],
      optional: ['action=blocked', 'bytes_out', 'http_method=POST'],
      blocked:  ['index=main', 'earliest=-1y'],
      exampleQuery: 'index=proxy dest_ip=185.220.101.42 | stats count by src_ip, http_method',
    },
    explanation: {
      requiredConcepts: ['redirect', 'credential', 'phishing', 'domain'],
      optionalConcepts: ['proxy log', 'edr', 'harvest'],
      exampleExplanation: 'The proxy logs show a redirect from a lookalike HR domain to a known malicious IP...',
    },
    feedback: {
      primaryFeedback: 'The redirect chain terminating at a POST to a suspicious IP is the defining indicator of credential harvesting.',
      spl: 'A correct query must scope to the proxy index and filter on the destination IP observed in the logs.',
      explanation: 'Key concepts: the redirect chain, the lookalike domain, and the POST to an unexpected IP.',
    },
  },
  // Q2–Q5 follow the same shape
];
```

**Field explanations:**

- `evidence` is a structured object with `email`, `proxy` (array of log lines), and `edr`
  (array of EDR events). `EvidencePanel` renders each sub-section with a tab or accordion.
- `spl.required` — terms that must appear; each missing term loses points proportionally.
- `spl.optional` — terms that add credit if present.
- `spl.blocked` — terms that indicate incorrect approach; presence deducts points.
- `explanation.requiredConcepts` — lower-cased keywords; presence in submitted explanation
  awards concept points.
- `feedback` — static strings shown after submission; not generated dynamically.

---

## Validation Engine: `src/utils/validateSpl.js`

Single pure function — no side effects, no imports, fully testable:

```js
/**
 * Validates a candidate SPL query against keyword rules.
 * @param {string} splText - Raw text from the editor
 * @param {{ required: string[], optional: string[], blocked: string[] }} rules
 * @returns {{ requiredHits, requiredMisses, optionalHits, blockedHits, rawScore, maxScore }}
 */
export function validateSpl(splText, rules) {
  const text = splText.toLowerCase();
  const requiredHits  = rules.required.filter(k => text.includes(k.toLowerCase()));
  const requiredMisses = rules.required.filter(k => !text.includes(k.toLowerCase()));
  const optionalHits  = rules.optional.filter(k => text.includes(k.toLowerCase()));
  const blockedHits   = rules.blocked.filter(k => text.includes(k.toLowerCase()));
  // scoring computed in scoreSoc.js
  return { requiredHits, requiredMisses, optionalHits, blockedHits };
}

export function validateExplanation(explanationText, conceptRules) {
  const text = explanationText.toLowerCase();
  const requiredHits  = conceptRules.required.filter(k => text.includes(k.toLowerCase()));
  const optionalHits  = conceptRules.optional.filter(k => text.includes(k.toLowerCase()));
  return { requiredHits, optionalHits };
}
```

---

## Scoring Engine: `src/utils/scoreSoc.js`

```js
/**
 * Computes the 23-point SOC score for one question.
 * Primary 5 pts | Secondary 3 pts | SPL 10 pts | Explanation 5 pts
 */
export function scoreSocRound({
  selectedPrimary, correctPrimary,
  selectedSecondary, correctSecondary,
  splValidation,  // from validateSpl()
  explanationValidation, // from validateExplanation()
  question, // full question object for maxima
}) {
  const primaryScore     = selectedPrimary === correctPrimary ? 5 : 0;
  const secondaryScore   = selectedSecondary === correctSecondary ? 3 : 0;

  const requiredTotal    = question.spl.required.length;
  const requiredHitCount = splValidation.requiredHits.length;
  const optionalBonus    = Math.min(splValidation.optionalHits.length, 2);
  const blockedPenalty   = splValidation.blockedHits.length * 2;
  const splScore = Math.max(
    0,
    Math.round((requiredHitCount / requiredTotal) * 8)
    + optionalBonus
    - blockedPenalty
  ); // max 10

  const conceptTotal     = question.explanation.requiredConcepts.length;
  const conceptHitCount  = explanationValidation.requiredHits.length;
  const conceptBonus     = Math.min(explanationValidation.optionalHits.length, 1);
  const explanationScore = Math.max(
    0,
    Math.round((conceptHitCount / conceptTotal) * 4) + conceptBonus
  ); // max 5

  const total = primaryScore + secondaryScore + splScore + explanationScore;

  return {
    primaryScore,
    secondaryScore,
    splScore,
    explanationScore,
    total,
    splValidation,
    explanationValidation,
    gradeBand: total >= 20 ? 'Strong'
             : total >= 15 ? 'Good'
             : total >= 10 ? 'Needs improvement'
             : 'Not ready',
  };
}
```

Both utilities live in `src/utils/`. They are pure functions — `useSocState` calls them
inside `submitSocRound`, passes the result into `socRound.result`, and appends it to
`socRecords`. No side effects in the validators.

---

## Data Flow: SOC Question Lifecycle

```
Candidate opens SOC_ROUND screen
    ↓
SocRound renders SOC_QUESTIONS[currentQuestionIdx]
    ↓
  ┌── EvidencePanel (scenario + email + proxy + edr logs)
  ├── SocClassifier (primary picker)
  ├── SocClassifier (secondary picker, unlocked after primary)
  ├── SplEditor (textarea, monospace, character hint)
  └── explanation textarea
    ↓
Candidate clicks Submit
    ↓
useSocState.submitSocRound()
    ├── validateSpl(splText, question.spl)
    ├── validateExplanation(explanationText, question.explanation)
    ├── scoreSocRound({ selections, validations, question })
    ├── setRound({ submitted: true, result: scoreResult })
    └── socRecords.push(scoreResult)
    ↓
gs.setScreen(SCREENS.SOC_EXPLANATION)
    ↓
SocExplanationCard shows:
  ├── Score breakdown (primary / secondary / SPL / explanation chips)
  ├── Grade band pill
  ├── Keyword hit/miss list (for SPL)
  ├── Concept hit list (for explanation)
  └── Reference answer (exampleQuery + exampleExplanation)
    ↓
Candidate clicks Next
    ↓
useSocState.nextSocQuestion()
  ├── if more questions → increment currentQuestionIdx, reset socRound, SOC_ROUND
  └── if last question →
        submitSocToSheet({ player, socRecords })
        gs.goToResults()
    ↓
ResultsScreen receives combined score (classification + SOC aggregate)
```

---

## Backend Extension: Google Apps Script

### New Sheet: `SOCData`

Columns: `Timestamp | Name | Email | QuestionID | Primary | Secondary | SPL Text | Explanation Text | Primary Score | Secondary Score | SPL Score | Explanation Score | Total Score | Grade Band`

### New POST Action: `submitSOC`

```js
if (action === 'submitSOC') {
  var socSheet = ensureSOCSheet(ss);
  var records = payload.records || [];
  for (var i = 0; i < records.length; i++) {
    var r = records[i];
    socSheet.appendRow([
      ts,
      payload.name      || '',
      payload.email     || '',
      r.questionId      || '',
      r.selectedPrimary || '',
      r.selectedSecondary || '',
      r.splText         || '',
      r.explanationText || '',
      r.primaryScore    || 0,
      r.secondaryScore  || 0,
      r.splScore        || 0,
      r.explanationScore || 0,
      r.total           || 0,
      r.gradeBand       || '',
    ]);
  }
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

`ensureSOCSheet` follows the same pattern as the existing `ensureSheets` helper — creates
the sheet with headers if absent, returns reference.

### New GET Action: `getSOCSubmissions`

```js
if (e.parameter.action === 'getSOCSubmissions') {
  var socSheet = ss.getSheetByName('SOCData');
  if (!socSheet || socSheet.getLastRow() < 2) {
    return ContentService.createTextOutput(JSON.stringify({ rows: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  var data = socSheet.getDataRange().getValues();
  var headers = data[0];
  var rows = data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
  return ContentService.createTextOutput(JSON.stringify({ rows: rows }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

The reviewer screen fetches with `?action=getSOCSubmissions` and renders the response.

### Passcode Gate

The passcode is a constant in `src/config/game.js`:

```js
export const REVIEWER_PASSCODE = 'flagmail-soc-review';
```

`ReviewerScreen` renders a passcode input. On match, it fetches SOC submissions and renders
the table. Client-side only — appropriate for a shared passcode with no sensitive data beyond
what already exists in the public GAS endpoint.

---

## Recommended File Structure (New Files Only)

```
src/
├── components/
│   ├── SocIntroCard.jsx        # Zone 4 intro (mirrors ZoneIntroCard)
│   ├── SocRound.jsx            # Main SOC question screen
│   ├── SocExplanationCard.jsx  # Per-question feedback
│   ├── EvidencePanel.jsx       # Scenario + log evidence display
│   ├── SplEditor.jsx           # SPL textarea with monospace styling
│   ├── SocClassifier.jsx       # Dynamic option picker (mirrors Classifier)
│   └── ReviewerScreen.jsx      # Passcode gate + submissions table
├── hooks/
│   └── useSocState.js          # All SOC-level flow and state
├── data/
│   └── socQuestions.js         # 5 question objects
└── utils/
    ├── validateSpl.js          # SPL + explanation keyword validation
    └── scoreSoc.js             # 23-point scoring model

google-apps-script.js           # Add submitSOC + getSOCSubmissions to existing file
```

---

## App.jsx Changes (Additive Only)

The existing `App.jsx` receives three additions:

1. Import `useSocState` and `SOC_SCREENS` constants.
2. Pass `goToResults` callback to `useSocState` so the SOC hook can exit to RESULTS.
3. Add three new conditional renders below the existing seven, guarded by the new screen
   constants. No existing render blocks are modified.

```jsx
// New additions only — existing blocks unchanged
const soc = useSocState({ player: gs.player, goToResults: gs.goToResults });

{gs.screen === SCREENS.SOC_INTRO && (
  <SocIntroCard onStart={soc.startSoc} />
)}
{gs.screen === SCREENS.SOC_ROUND && (
  <SocRound soc={soc} />
)}
{gs.screen === SCREENS.SOC_EXPLANATION && (
  <SocExplanationCard soc={soc} onNext={soc.nextSocQuestion} />
)}
{gs.screen === SCREENS.REVIEWER && (
  <ReviewerScreen />
)}
```

The `handleAdvanceZone` callback in `App.jsx` must also be updated for the zone-3 case:
instead of calling `gs.goToResults()`, it calls `gs.setScreen(SCREENS.SOC_INTRO)`. This is
a one-line change inside the existing `if (gs.zone === 3)` branch.

---

## Build Order

Build in dependency order — each step unblocks the next:

1. **Dataset (`src/data/socQuestions.js`)** — all downstream components and hooks consume
   this; author the ~5 questions from `Splunk Questions.docx` before any UI work begins.
   Unblocks everything else.

2. **Validation + scoring utilities (`validateSpl.js`, `scoreSoc.js`)** — pure functions
   with no UI dependency; can be exercised with `console.log` tests before any component
   is built. Unblocks `useSocState`.

3. **`useSocState.js`** — wires dataset + validators into hook API; testable by calling
   actions directly from a minimal test harness. Unblocks `App.jsx` changes and all
   SOC screens.

4. **SCREENS enum extension + `advanceZone` patch in `useGameState.js`** — two-line change;
   do this before building screens so the routing exists. Low risk to existing zones.

5. **Level UI: `SocIntroCard`, `EvidencePanel`, `SplEditor`, `SocClassifier`, `SocRound`,
   `SocExplanationCard`** — build in that sub-order (display components before composition).
   The full SOC play loop is playable after this step.

6. **Reviewer view: `ReviewerScreen`** — passcode gate + fetch from GAS; requires backend
   to be deployed first (or mock data during development).

7. **Backend: `google-apps-script.js` additions** — add `submitSOC` action, `ensureSOCSheet`
   helper, `getSOCSubmissions` GET handler. Deploy new GAS version. Connects both the
   submission path (from `useSocState`) and the reviewer fetch path.

8. **`App.jsx` wiring** — add imports, compose `useSocState`, add screen conditionals,
   update `handleAdvanceZone`. Final integration step.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Merging SOC State into `useGameState`

**What people do:** Add `socRound`, `socRecords`, `currentQuestionIdx` directly to
`useGameState` because it already owns `screen`.

**Why it is wrong:** It intermingles concerns. Every existing action (`submitRound`,
`nextEmail`, `advanceZone`) would need defensive branches to avoid affecting SOC state.
The hook becomes fragile for both paths.

**Do this instead:** `useSocState` owns all SOC-specific state. It reads `gs.player` and
calls `gs.goToResults` as its only coupling to `useGameState`. The `gs.screen` setter is
the only shared surface — SOC screens are just additional enum values.

### Anti-Pattern 2: Making `Classifier` Data-Driven by Modifying It

**What people do:** Add a `options` prop to the existing `Classifier.jsx` to handle
SOC-specific category lists.

**Why it is wrong:** `Classifier` is exercised by all 15 existing rounds. Changing it risks
breaking the proven classification UI. It also has hardcoded L1/L2 structure that does not
map cleanly to single-tier SOC pickers.

**Do this instead:** Build `SocClassifier.jsx` as a new component. It can share the same
visual tokens and button pattern but is independent. If the existing `Classifier` is later
found to be a superset, consolidation is easy — building it new first is risk-free.

### Anti-Pattern 3: Running SPL Validation on the Backend

**What people do:** POST the SPL text to GAS and validate there.

**Why it is wrong:** GAS has no query execution capability, adds a round-trip before
showing feedback, and couples the scoring step to network availability. The requirement
explicitly specifies deterministic keyword matching.

**Do this instead:** All validation and scoring runs client-side in `validateSpl.js` and
`scoreSoc.js`. Only the final scored record is sent to GAS for storage.

### Anti-Pattern 4: Using URL Hash Routing for the Reviewer Screen

**What people do:** Add `#/reviewer` URL routing so reviewers can bookmark the screen.

**Why it is wrong:** The app has no router. Adding `window.location.hash` logic is a bespoke
mini-router that is inconsistent with the existing screen state machine.

**Do this instead:** Add a low-prominence link on `LandingScreen` that calls
`gs.setScreen(SCREENS.REVIEWER)`. The passcode gate makes unauthorized access inconsequential,
so lack of a bookmarkable URL is an acceptable trade-off for v1.

---

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|--------------|-------|
| `useSocState` → `useGameState` | Calls `gs.goToResults` (passed as prop) | One-directional; SOC hook never reads `gs.screen` |
| `SocRound` → `useSocState` | Props: all state + action callbacks | Matches existing GameRound ↔ useGameState pattern |
| `useSocState` → `validateSpl` / `scoreSoc` | Direct function calls inside `submitSocRound` | Pure functions; no state coupling |
| `App.jsx` → `handleAdvanceZone` | Modified to route zone-3 exit to SOC_INTRO | Only the `gs.zone === 3` branch changes |
| `ReviewerScreen` → GAS | `fetch(LEADERBOARD_URL + '?action=getSOCSubmissions')` | GET; no-cors not needed since reviewer expects response body |

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Google Apps Script (submit) | POST with `action: 'submitSOC'`, `mode: 'no-cors'` | Matches existing `submitToSheet` pattern in `useGameState` |
| Google Apps Script (reviewer fetch) | GET `?action=getSOCSubmissions` | Requires CORS-enabled response; GAS GET returns JSON already |

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|-----------|-------|
| Screen state extension approach | HIGH | Direct inspection of `useGameState.js` — enum + switch pattern confirmed |
| Hook isolation strategy | HIGH | Existing hook conventions observed; `useSocState` follows identical structure |
| Dataset shape | HIGH | Derived from `emails.js` shape + requirements in `Splunk.md` and `PROJECT.md` |
| Validation engine design | HIGH | Requirements are explicit: keyword matching, no execution, deterministic |
| GAS backend extension | HIGH | Existing `doPost`/`doGet` pattern is clear; new action follows identical structure |
| Scoring model | HIGH | 23-point breakdown explicitly specified in `Splunk.md` |
| Reviewer passcode approach | MEDIUM | Simple but adequate for v1; a shared static passcode in config is the correct trade-off given no auth system |

---

*Architecture research for: FlagMail SOC Investigation Level (Zone 4)*
*Researched: 2026-05-21*
