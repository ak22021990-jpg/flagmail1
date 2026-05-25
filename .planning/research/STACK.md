# Stack Research

**Domain:** SOC Investigation level — v1.1 overhaul of Zone 4 in an existing React 19 + Vite 7 + plain-JS game
**Researched:** 2026-05-25
**Confidence:** HIGH

---

## Context: What Already Exists

The following are already installed and must not be changed. Do not re-research them.

| Package | Version | Role |
|---------|---------|------|
| react, react-dom | 19.2.0 | UI |
| vite, @vitejs/plugin-react | 7.3.1 / 5.1.1 | Build |
| framer-motion | ^11.18.2 | Screen transitions, button micro-interactions |
| gsap | ^3.12.5 | Badge animations |
| lottie-react | ^2.4.1 | Badge unlock animations |
| papaparse | ^5.5.3 | CSV (not used by SOC level) |
| prop-types | ^15.8.1 | Runtime prop validation |
| vitest | ^4.1.7 | Test runner (used in validateSpl.test.js, scoreSoc.test.js) |

The existing SOC implementation already has: `SocRound.jsx`, `SocExplanationCard.jsx`, `SocIntroCard.jsx`, `ReviewerScreen.jsx`, `useSocState.js`, `validateSpl.js`, `scoreSoc.js`, `socQuestions.js`. The overhaul refines these — it does not start from scratch.

---

## Recommended Stack

### Core Technologies

All core framework choices stay unchanged. Zero new frameworks or runtimes.

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React 19 | 19.2.0 (existing) | All UI components and state | Zero change; SOC overhaul is additive to existing component tree |
| Vite 7 | 7.3.1 (existing) | Build and dev server | No config change needed |
| Plain JS ES2020+ | — | All logic | Codebase convention; SPL scoring, hint engine, form validation are pure string/array operations |

### New Dependencies — Scoped Analysis

The v1.1 overhaul has five specific areas requiring a stack decision. Each is evaluated below.

---

#### Area 1: SPL Code Editor (syntax highlighting)

**Decision: Do NOT add a code editor library. Keep the `<textarea>` with monospace font.**

The existing `SocRound.jsx` already uses a `<textarea>` with `fontFamily: 'ui-monospace, "SF Mono", monospace'`. The question is whether to replace it with CodeMirror or Monaco.

**Analysis of @uiw/react-codemirror:**
- Latest version: 4.25.10 (npm verified, 2026-05-25)
- Peer dependencies: React >=17.0.0 (React 19 compatible), codemirror >=6.0.0
- SQL language pack (@codemirror/lang-sql, version 6.10.0) is the closest existing grammar to Splunk SPL
- Bundle cost: CodeMirror 6 core + @codemirror/lang-sql adds approximately 180–220 KB gzipped to the bundle
- Splunk SPL is not SQL — column names like `index=`, `sourcetype=`, pipe-chained commands, and `stats` functions are structurally different. The SQL grammar would highlight SPL incorrectly (wrong keywords as errors), creating learner confusion

**Analysis of Monaco Editor:**
- Bundle cost: approximately 3–5 MB (includes full language worker infrastructure)
- Completely disproportionate for a `<textarea>` replacement in a game

**Verdict:** Syntax highlighting has zero impact on the keyword-match scoring engine. The only benefit would be cosmetic. The bundle cost and incorrect SPL highlighting (using SQL grammar as a proxy) make this a net negative for learners. Keep the native `<textarea>`. If SPL highlighting is ever needed, a custom CSS-token approach via Prism.js + a hand-authored SPL grammar is the lower-cost path — but this is out of scope for v1.1.

**What to improve instead:** Visual affordance of the SPL textarea — a dark code-surface background (`rgba(17,24,39,0.92)`), light text (`#F8F8F2`), slightly larger font (14px), and a character counter. This is pure CSS and communicates "code editor" without any library.

---

#### Area 2: Hint / Tooltip Engine for Investigation Guidance

**Decision: Build a zero-dependency hint system using existing framer-motion. Do NOT add @floating-ui/react.**

**Analysis of @floating-ui/react:**
- Latest version: 0.27.19 (npm verified, 2026-05-25)
- Peer dependencies: React >=17.0.0, React-DOM >=17.0.0 (React 19 compatible)
- Bundle cost: ~25 KB gzipped
- Purpose: Anchor positioning for floating elements (tooltips, popovers)
- Problem for this use case: The hint system for SOC questions is not a cursor-positioned tooltip. It is a question-level hint panel (think: "Need a hint? Click here") that reveals hint text below the relevant section. This is a toggle pattern, not an anchor-positioned floating layer.

**What the hint engine actually needs:**
1. A `useHint` hook that tracks which hints have been revealed per question (array of booleans, persisted in `useSocState`)
2. A `HintPanel` component that renders a collapsible hint text block beneath each SPL prompt
3. Animation via existing `framer-motion` `AnimatePresence` — the same pattern already used in `ExplanationCard.jsx` and `ZoneComplete.jsx`

**Verdict:** @floating-ui/react solves a problem this project does not have. A positioned tooltip above a word is not the UX pattern needed here. The hint panel is a disclosed region — a framer-motion `AnimatePresence` + `motion.div` with `initial={{ height: 0 }} animate={{ height: 'auto' }}` covers this completely. Zero new packages.

---

#### Area 3: Better Form Validation UX

**Decision: Implement inline validation state in existing hooks via `useState`. Do NOT add react-hook-form or zod.**

The SOC form has three validated fields: primary classification (required), SPL textarea (required, non-empty), explanation textarea (required, non-empty). The existing `SocRound.jsx` already gates the Submit button on `!!answer.splText?.trim() && !!answer.explanation?.trim()`.

**What "better form validation UX" means in this context:**
- Per-field error messages shown after the first attempted submit (not on mount)
- A `touched` flag per field (has the user interacted with this field?)
- Visual border color changes (`border-color: #FF3B30` on invalid, `#34C759` on valid)

**Implementation:** Add `touched` state object to `useSocState` and expose a `markTouched(field)` action. On submit-attempt with missing fields, set all fields touched. Each field reads `touched.spl && !answer.splText?.trim()` to decide whether to show the error border. This is 20 lines of React state — no library needed.

**Alternatives rejected:**
- **react-hook-form**: Designed for complex multi-step forms with dozens of fields and cross-field validation. The SOC form has 2 textareas and button pickers. Overhead is not justified.
- **zod**: A TypeScript-first schema validation library. This project has no TypeScript and the validation rules (non-empty string) are too simple to warrant a schema definition language.

---

#### Area 4: Restructured SOC Question UI (scenario → evidence → classification → SPL → explanation)

**Decision: Zero new libraries. Refactor existing `SocRound.jsx` layout using CSS grid columns.**

The current `SocRound.jsx` already implements a two-column grid layout (`1.08fr / 0.92fr`). The overhaul restructures the right column into a vertical accordion-style flow:

1. Classification pickers (existing, unchanged)
2. SPL task prompt + hint panel (new: prompt text from `question.splRules.tasks[0].prompt`)
3. SPL textarea (existing, restyled)
4. Explanation textarea (existing, unchanged)

The SPL task prompt is already in the data layer (`socQuestions.js` has `splRules.tasks[n].prompt` per task). The overhaul surfaces it in the UI above the textarea. This requires no new library — only reading the existing data field and rendering a `<p>` element.

---

#### Area 5: GAS Email Delivery Fix

**Decision: Fix the existing GAS `doPost` handler in the Apps Script source file. No new packages or services.**

**Root cause analysis:**
The current `useSocState.js` uses `mode: 'no-cors'` in all fetch calls. With `no-cors`, the browser sends an opaque request — the response is unreadable, but crucially: the request body content-type is restricted to `text/plain`, `multipart/form-data`, or `application/x-www-form-urlencoded`. The fetch call sends `JSON.stringify(...)` as the body without setting a Content-Type header. GAS receives this as `text/plain` content (not parsed JSON), so `JSON.parse(e.postData.contents)` may fail silently if the body is not valid JSON in that context.

However, per the GAS docs and community knowledge, `no-cors` with a raw JSON string body **does** work for GAS `doPost` when GAS reads `e.postData.contents` directly (not `e.postData.object`). The real issue is most likely one of:

1. **Email field name mismatch**: GAS `MailApp.sendEmail()` is called with a recipient field drawn from the payload. If the field name in the payload changed (e.g., `email` vs `managerEmail`), GAS throws "no recipient" silently and the try/catch swallows it.
2. **GAS execution quota**: Free account is limited to 100 email recipients/day. Exceeding it causes silent failures unless `MailApp.getRemainingDailyQuota()` is checked before the call.
3. **GAS deployment not re-published**: After editing the `.gs` file, you must click "Deploy > Manage deployments > New version" for the live URL to pick up changes. The old version keeps running.

**Fix approach (no new packages):**
- In the GAS script: wrap `MailApp.sendEmail()` in a try/catch that logs to `Logger.log()` with the full error message and recipient value, so failures appear in the GAS execution log (Apps Script dashboard > Executions).
- Add `MailApp.getRemainingDailyQuota()` check before sending; if quota is 0, log and skip gracefully.
- Confirm the `to` parameter matches what the payload sends. The payload in `App.jsx` sends `email: gs.player.email` — the GAS script must read `payload.email`, not a different field name.
- After editing, redeploy as a new version and update the URL in `config.js` if the deployment ID changed.

**On the front-end side:** The `submitFinal` call in `useSocState.js` already uses `mode: 'no-cors'`. This is correct and unavoidable for GAS web apps called from a browser (GAS does not support CORS preflight). The fix is entirely server-side in the GAS script.

---

## Installation

No new packages required for the v1.1 overhaul.

```bash
# Nothing to install
# All five feature areas are addressed by:
# - Refactoring existing components
# - Adding pure-JS utility functions
# - Editing the GAS script (outside the npm/Vite project)
```

---

## Alternatives Considered

| Area | Recommended | Alternative | Why Not |
|------|-------------|-------------|---------|
| SPL editor | Native `<textarea>` (restyled) | @uiw/react-codemirror 4.25.10 | 180–220 KB bundle; SQL grammar highlights SPL incorrectly; no scoring benefit |
| SPL editor | Native `<textarea>` | Monaco Editor | 3–5 MB bundle; completely disproportionate |
| Hint engine | framer-motion AnimatePresence (existing) | @floating-ui/react 0.27.19 | Solves anchor-positioning, not the toggle-panel pattern needed here |
| Hint engine | framer-motion (existing) | Radix UI Collapsible | Adds ~30 KB; framer-motion already handles the animation requirement |
| Form validation | useState + touched flags | react-hook-form | Designed for large forms; the SOC form has 2 textareas |
| Form validation | useState + touched flags | zod | TypeScript-first; this codebase has no TypeScript |
| Email fix | Edit GAS script | New backend service | Violates project constraint; GAS is the mandated backend |
| Email fix | Edit GAS script | SendGrid / Resend | New billing, new service, new credentials — not justified for a single email notification |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| @uiw/react-codemirror / Monaco | Bundle cost (180 KB – 5 MB) with no scoring benefit; SQL grammar mislabels SPL tokens | Native `<textarea>` + dark background CSS |
| @floating-ui/react | Anchor-positioned tooltips are the wrong UX pattern for a disclosed hint panel | framer-motion `AnimatePresence` expand/collapse |
| react-hook-form / zod | 2-field form does not need a form management library or schema language | `useState` + `touched` flags in `useSocState` |
| React Router / TanStack Router | Violates the SPA-no-URL design; the `SCREENS` enum already handles all navigation | Extend `SCREENS` enum; `App.jsx` conditional render |
| New backend service | Violates project constraints | Extend existing GAS script with new action handlers |
| TypeScript migration | Codebase convention is plain JS; mid-project migration disrupts all existing tooling | JSDoc comments on new utility functions |

---

## Version Compatibility

| Package | Version | React 19 Compatible | Notes |
|---------|---------|---------------------|-------|
| @uiw/react-codemirror | 4.25.10 | YES (peer: React >=17) | Not adding — documented here for future reference |
| @floating-ui/react | 0.27.19 | YES (peer: React >=17, React-DOM >=17) | Not adding — documented here for future reference |
| @codemirror/lang-sql | 6.10.0 | YES (via @uiw/react-codemirror) | Not adding — SQL grammar is wrong for SPL anyway |
| framer-motion | ^11.18.2 (existing) | YES | Already installed; handles hint panel animation |
| vitest | ^4.1.7 (existing) | YES | Test coverage for validateSpl.js and scoreSoc.js already exists |

---

## Integration Points with Existing Stack

| New Feature | Integrates With | How |
|-------------|-----------------|-----|
| Hint panel | `useSocState.js` | Add `hintsRevealed: []` per question; expose `revealHint(questionIdx, hintIdx)` action |
| Hint panel animation | `framer-motion` (existing) | `AnimatePresence` + `motion.div` with `height` animation — same pattern as `ExplanationCard.jsx` |
| SPL task prompt in UI | `socQuestions.js` (existing) | `question.splRules.tasks[0].prompt` is already authored; just render it in `SocRound.jsx` |
| Touched/validation UX | `useSocState.js` | Add `touched: { spl: false, explanation: false }` state; expose `markTouched(field)` |
| GAS email fix | `google-apps-script.js` (GAS file, outside npm) | Add `Logger.log()` + quota check + correct field name in `MailApp.sendEmail()` |
| Dark SPL textarea | `SocRound.jsx` (existing) | Inline style change: `background: 'rgba(17,24,39,0.92)', color: '#F8F8F2'` |

---

## Sources

- `package.json` (direct file read, 2026-05-25) — confirmed existing dependency versions (HIGH confidence)
- `src/components/SocRound.jsx` (direct file read, 2026-05-25) — confirmed existing textarea, classification picker, layout (HIGH confidence)
- `src/hooks/useSocState.js` (direct file read, 2026-05-25) — confirmed no-cors fetch pattern, submit flow (HIGH confidence)
- `src/data/socQuestions.js` (direct file read, 2026-05-25) — confirmed `splRules.tasks[n].prompt` field exists in data (HIGH confidence)
- `npm info @uiw/react-codemirror` (shell, 2026-05-25) — version 4.25.10, peer React >=17 (HIGH confidence)
- `npm info @uiw/react-codemirror peerDependencies` (shell, 2026-05-25) — codemirror >=6.0.0 required (HIGH confidence)
- `npm info @codemirror/lang-sql version` (shell, 2026-05-25) — version 6.10.0 (HIGH confidence)
- `npm info @floating-ui/react version peerDependencies` (shell, 2026-05-25) — version 0.27.19, peer React >=17 (HIGH confidence)
- WebSearch: "@floating-ui/react npm latest version 2025 tooltip React 19" — confirmed 0.27.19, actively maintained (MEDIUM confidence, corroborated by npm CLI)
- WebSearch: "Google Apps Script MailApp no-cors fetch mode email delivery missing recipient field" — confirmed no-cors limitation, MailApp quota, field name mismatch as common causes (MEDIUM confidence)
- [GAS MailApp docs](https://developers.google.com/apps-script/reference/mail/mail-app) — MailApp.getRemainingDailyQuota() confirmed, sendEmail() signature confirmed (HIGH confidence)
- [GAS Quotas](https://developers.google.com/apps-script/guides/services/quotas) — 100 recipients/day free, 1500 paid (HIGH confidence, official docs updated April 2026)

---

*Stack research for: SOC Investigation level v1.1 overhaul — flagmail1*
*Researched: 2026-05-25*
