# Stack Research

**Domain:** SOC Investigation level — 4th zone added to an existing React 19 + Vite 7 + plain-JS game
**Researched:** 2026-05-21
**Confidence:** HIGH (all recommendations drawn directly from the existing codebase; zero new dependencies required)

---

## Recommended Stack

### Core Technologies

All core technologies are already present. This milestone adds no new framework, router, or runtime dependency.

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React 19 | 19.2.0 (existing) | UI components, state, effects | Already in project; the SOC screen is one more conditional branch in `App.jsx`, identical to how `SCREENS.ROUND` works |
| Vite 7 | 7.3.1 (existing) | Build and dev server | No change needed; base path `/flagmail1/` already set |
| Plain JS (ES2020+) | — | All logic | Codebase convention; SPL keyword matching and passcode gating are simple string operations that need no TypeScript or special runtime |

### New Source Files to Create (zero new packages)

These are files to author, not packages to install.

| File | Role | Pattern It Follows |
|------|------|--------------------|
| `src/data/socQuestions.js` | Static dataset of SOC questions, classification options, and validation rules | Mirrors `src/data/emails.js` — a plain JS export of an array of objects |
| `src/utils/splValidation.js` | Keyword-matching engine for SPL queries and explanations | Plain function, no dependencies; mirrors `src/utils/competency.js` |
| `src/hooks/useSocState.js` | State machine for the SOC question flow (question index, inputs, results) | Follows `useGameState.js` exactly — `useState` + `useCallback`, returns state + action object |
| `src/components/SocInvestigation.jsx` | Top-level screen component for zone 4 | Added as a new conditional branch in `App.jsx`; follows the same props-down pattern as `GameRound.jsx` |
| `src/components/SocReviewer.jsx` | Passcode-gated reviewer screen | New screen branch in `App.jsx`; passcode stored in a `useState`, validated inline |

### Supporting Libraries

No new libraries are needed or recommended. The table below lists existing packages that serve the SOC level.

| Library | Version | Purpose | When Used in SOC Level |
|---------|---------|---------|------------------------|
| React (existing) | 19.2.0 | `useState`, `useCallback`, controlled inputs | SPL textarea, classification pickers, passcode input |
| `framer-motion` (existing) | ^11.18.2 | Screen transition animations | SOC intro card → question → result — same `AnimatePresence` wrapping used in existing screens |
| Plain `fetch` (existing pattern) | browser native | POST submissions, GET reviewer data | SOC submit action; reviewer GET action — follows `submitToSheet` / `useLeaderboard` patterns exactly |

### Development Tools

No changes. Existing toolchain is sufficient.

| Tool | Purpose | Notes |
|------|---------|-------|
| ESLint (existing) | Lint `.jsx`/`.js` | Flat config already covers all new files in `src/` |
| Vite dev server (existing) | HMR during development | No config change needed |
| Playwright (existing) | Visual audit | Can screenshot SOC screens with the same `playwright-audit.mjs` script |

---

## Installation

No new packages. The command is intentionally empty.

```bash
# Nothing to install — zero new dependencies for this milestone
```

---

## Implementation Patterns

### (1) Plain-Text SPL Query Input

Use a native `<textarea>` controlled via `useState`. No library needed.

```js
// Inside SocInvestigation.jsx (or a child component)
const [spl, setSpl] = useState('');

<textarea
  value={spl}
  onChange={e => setSpl(e.target.value)}
  rows={8}
  placeholder="index=... | ..."
  style={{ fontFamily: 'monospace', width: '100%' }}
/>
```

Rationale: `<textarea>` is a standard HTML element, fully controlled by React's `onChange`. Code-editor libraries (CodeMirror, Monaco) would add 200–500 KB for zero validation benefit — keyword matching works identically on raw text.

### (2) Deterministic Keyword-Matching Validation Engine

Author `src/utils/splValidation.js` as a pure function module — no state, no side effects.

```js
// src/utils/splValidation.js

/**
 * Validate a candidate's SPL text against a question's rule set.
 *
 * @param {string} text  - raw SPL string from textarea
 * @param {object} rules - { required: string[], optional: string[], blocked: string[] }
 * @returns {{ score: number, max: number, feedback: string[], matched: string[], missed: string[], penalised: string[] }}
 */
export function validateSpl(text, rules) {
  const lower = text.toLowerCase();
  const matched = rules.required.filter(t => lower.includes(t.toLowerCase()));
  const missed = rules.required.filter(t => !lower.includes(t.toLowerCase()));
  const optMatched = (rules.optional || []).filter(t => lower.includes(t.toLowerCase()));
  const penalised = (rules.blocked || []).filter(t => lower.includes(t.toLowerCase()));

  // Scoring: required terms share the 10 SPL points proportionally;
  // optional terms add 1pt each (capped at remaining); each blocked term deducts 2pt.
  const basePerRequired = rules.required.length > 0 ? 10 / rules.required.length : 0;
  let score = matched.length * basePerRequired;
  score += optMatched.length * 1;
  score -= penalised.length * 2;
  score = Math.max(0, Math.min(10, Math.round(score)));

  const feedback = [
    ...missed.map(t => `Missing keyword: "${t}"`),
    ...penalised.map(t => `Blocked keyword used: "${t}"`),
    ...optMatched.map(t => `Bonus term found: "${t}"`),
  ];

  return { score, max: 10, feedback, matched, missed, penalised };
}

/**
 * Validate a free-text explanation against expected concept keywords.
 *
 * @param {string} text     - candidate's explanation
 * @param {string[]} concepts - expected concept strings
 * @returns {{ score: number, max: number, feedback: string[], found: string[], missing: string[] }}
 */
export function validateExplanation(text, concepts) {
  const lower = text.toLowerCase();
  const found = concepts.filter(c => lower.includes(c.toLowerCase()));
  const missing = concepts.filter(c => !lower.includes(c.toLowerCase()));
  const score = concepts.length > 0
    ? Math.round((found.length / concepts.length) * 5)
    : 0;
  const feedback = missing.map(c => `Concept not addressed: "${c}"`);
  return { score, max: 5, feedback, found, missing };
}
```

Key design decisions:
- Pure functions — deterministic, trivially testable, no React dependency
- `toLowerCase()` on both sides — case-insensitive match, no regex complexity needed
- `String.prototype.includes()` — sufficient for keyword presence; no tokeniser or SPL parser
- Scoring formula expressed inline — reviewer can audit it directly

### (3) Passcode-Gated Reviewer View Without a Router Library

Add two entries to the `SCREENS` enum in `useGameState.js`:

```js
export const SCREENS = {
  // ... existing screens ...
  SOC_INTRO:    'soc_intro',
  SOC_ROUND:    'soc_round',
  SOC_RESULT:   'soc_result',
  REVIEWER:     'reviewer',
};
```

Trigger entry to `SCREENS.REVIEWER` from the `RESULTS` screen (a small "Reviewer access" link) or from the `LANDING` screen. The passcode itself lives in a component-local `useState` — it never needs to be in the game state:

```js
// Inside SocReviewer.jsx
const PASSCODE = import.meta.env.VITE_REVIEWER_PASSCODE || 'flagmail-review';

export default function SocReviewer({ onExit }) {
  const [input, setInput] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [submissions, setSubmissions] = useState([]);

  const handleUnlock = useCallback(() => {
    if (input === PASSCODE) {
      setUnlocked(true);
      fetchSubmissions().then(setSubmissions);
    }
  }, [input]);

  if (!unlocked) {
    return (
      <div className="reviewer-gate">
        <input type="password" value={input} onChange={e => setInput(e.target.value)} />
        <button onClick={handleUnlock}>Enter</button>
        <button onClick={onExit}>Back</button>
      </div>
    );
  }

  return <ReviewerTable submissions={submissions} onExit={onExit} />;
}
```

Passcode stored in `.env.local` as `VITE_REVIEWER_PASSCODE` — Vite exposes it at build time via `import.meta.env`. Never commit `.env.local`. Default fallback keeps the app functional without it.

The `onExit` callback calls `setScreen(SCREENS.LANDING)` in `App.jsx`, which is exactly how every other screen exits.

This approach:
- Needs no router library — it is one more `{gs.screen === SCREENS.REVIEWER && <SocReviewer />}` in `App.jsx`
- Needs no auth provider — a shared passcode is the specified requirement
- Is server-invisible — the passcode check is client-side; this is acceptable because the data is not secret to an authenticated user, only casual-access protected

### (4) Extending the Google Apps Script Backend

Add a third sheet `SOCData` and two new action dispatches in `google-apps-script.js`. The existing `doPost`/`doGet` structure already uses an `action` string switch — extend it.

**New POST action: `"submitSoc"`**

Payload shape:
```json
{
  "action": "submitSoc",
  "name": "...",
  "email": "...",
  "questionId": "q1",
  "primaryClassification": "Phishing",
  "secondaryDiagnosis": "Credential Harvesting",
  "splQuery": "index=email_logs ...",
  "explanation": "...",
  "primaryScore": 5,
  "secondaryScore": 3,
  "splScore": 8,
  "explanationScore": 4,
  "totalScore": 20,
  "gradeBand": "Good",
  "feedback": ["Missing keyword: stats", "Concept not addressed: lateral movement"]
}
```

**New GET action: `?action=getSoc&passcode=...`**

Returns all rows from `SOCData`. Passcode checked server-side using a `PropertiesService` script property (not hardcoded in the script) so the passcode is not visible in the deployed URL history:

```js
// In doGet, inside google-apps-script.js
if (e.parameter.action === 'getSoc') {
  var stored = PropertiesService.getScriptProperties().getProperty('REVIEWER_PASSCODE');
  if (e.parameter.passcode !== stored) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'Forbidden' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  var soc = ss.getSheetByName('SOCData');
  // ... return rows
}
```

`SOCData` sheet columns:
`Timestamp | Name | Email | QuestionID | PrimaryClass | SecondaryDiagnosis | SPLQuery | Explanation | PrimaryScore | SecondaryScore | SPLScore | ExplanationScore | TotalScore | GradeBand | Feedback`

This extends the existing script without touching existing `register`/`submit`/`checkEmail` paths — zero risk to the existing leaderboard.

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| Native `<textarea>` | CodeMirror / Monaco editor | 200–500 KB bundle increase; syntax highlighting has no impact on keyword-match scoring; violates zero-new-deps constraint |
| `String.includes()` keyword matching | SPL grammar parser (e.g., a custom tokeniser) | SPL parsing is complex (pipes, subsearches, macros); keyword presence is the specified validation fidelity; a parser would add weeks of work and a new maintenance surface |
| `SCREENS` enum extension (existing state machine) | React Router v6 / TanStack Router | Router library adds a dependency and requires URL-based navigation that conflicts with the SPA-with-no-URL-change design; SCREENS enum already handles 7 screens without it |
| Component-local `useState` for passcode | React Context / Zustand for auth state | Auth state never needs to be shared across components; component-local is the simplest correct scope; context or Zustand would add indirection with no benefit |
| `VITE_REVIEWER_PASSCODE` env var | Hardcoded constant in source | Env var keeps the passcode out of git history; `import.meta.env` is standard Vite — no new tool required |
| GAS `PropertiesService` for server-side passcode | Passcode in GET query param only | Query params appear in GAS execution logs and browser history; PropertiesService keeps the passcode in script configuration, not in the deployed URL surface |
| `src/data/socQuestions.js` static file | CMS, API, or Google Sheets as question store | Matches existing `emails.js` pattern; no API call during gameplay; content editing is a code change, which is acceptable at this team size |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| CodeMirror / Monaco | Adds 200–500 KB bundle weight; syntax highlighting provides no scoring benefit | Native `<textarea>` with `fontFamily: monospace` |
| SPL parser / grammar library | SPL is a complex query language; parsing it correctly is a multi-week project; the spec calls for keyword matching, not query execution | `String.includes()` in `splValidation.js` |
| React Router / TanStack Router | Requires URL-based navigation; conflicts with the SPA-no-URL design; adds a dependency | Extend `SCREENS` enum in `useGameState.js`; add one conditional render in `App.jsx` |
| Zustand / Jotai / Redux | Passcode and reviewer fetch state are local to `SocReviewer.jsx`; shared state management is unnecessary complexity | Component-local `useState` |
| Firebase / Supabase / any new backend | Project constraint is to reuse GAS + Sheets; a new backend service has auth, billing, and ops overhead | Extend `google-apps-script.js` with `submitSoc` and `getSoc` actions |
| TypeScript migration | Codebase is intentionally plain JS; adding TS mid-project requires tsconfig, type stubs, and build changes across all files | JSDoc comments for critical function signatures (validation engine, data shapes) |
| `window.location.hash` routing | Appears simpler than a router but creates URL state that must be synced with React state — adds complexity without removing it | `SCREENS` enum which is already the source of truth |

---

## Version Compatibility

No new packages means no new compatibility surface. The existing lockfile governs everything.

| Concern | Status |
|---------|--------|
| React 19 controlled `<textarea>` | Standard; no breaking changes in React 19 for controlled inputs |
| `import.meta.env` in Vite 7 | Fully supported; `.env.local` is already in `.gitignore` via standard Vite template |
| GAS `PropertiesService` | Stable GAS API; no version concern |

---

## Sources

- `C:\Users\anoop\OneDrive\Desktop\apple\flagmail1\.planning\codebase\STACK.md` — existing stack confirmed (HIGH confidence, direct codebase read)
- `C:\Users\anoop\OneDrive\Desktop\apple\flagmail1\.planning\codebase\ARCHITECTURE.md` — screen state machine pattern, hook composition confirmed (HIGH confidence)
- `C:\Users\anoop\OneDrive\Desktop\apple\flagmail1\.planning\codebase\INTEGRATIONS.md` — GAS action/sheet schema confirmed (HIGH confidence)
- `C:\Users\anoop\OneDrive\Desktop\apple\flagmail1\src\hooks\useGameState.js` — SCREENS enum and submitToSheet pattern confirmed (HIGH confidence, direct source read)
- `C:\Users\anoop\OneDrive\Desktop\apple\flagmail1\src\hooks\useScoring.js` — pure-function scoring engine pattern confirmed (HIGH confidence, direct source read)
- `C:\Users\anoop\OneDrive\Desktop\apple\flagmail1\google-apps-script.js` — doPost/doGet action dispatch pattern confirmed (HIGH confidence, direct source read)
- `C:\Users\anoop\OneDrive\Desktop\apple\flagmail1\.planning\PROJECT.md` — 23-point scoring model, validation spec, passcode requirement confirmed (HIGH confidence)
- Vite docs (import.meta.env): standard feature, documented since Vite 2 — no version risk (HIGH confidence)
- GAS PropertiesService: stable GAS platform API — no version risk (HIGH confidence)

---

*Stack research for: SOC Investigation level — flagmail1 milestone*
*Researched: 2026-05-21*
