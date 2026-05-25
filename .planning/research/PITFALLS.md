# Pitfalls Research

**Domain:** SOC Investigation level — UX overhaul, hint engine, GAS email delivery, static data enrichment, backward-compatible Zone 4 restructure
**Researched:** 2026-05-25
**Confidence:** HIGH (all pitfalls derived from direct codebase inspection, milestone STATE.md, CONCERNS.md, GAS source, recent quick-task summaries, and verified GAS/CORS behavioural sources)

---

## Critical Pitfalls

### Pitfall 1: GAS MailApp Fails Silently After Adding a New Permission Scope

**What goes wrong:**
The `submitFinal` handler added `MailApp.sendEmail()` to `google-apps-script.js`. When the script is redeployed as a new GAS version, the GAS execution engine discovers a new OAuth scope (`https://www.googleapis.com/auth/script.send_mail`) that was not in the previous authorization grant. Calls to `MailApp.sendEmail()` silently fail with a permissions error that is caught by the outer `try/catch` and written only to `Logger.log('MailApp error: ...')`. Because GAS log output is invisible to the browser client and the fetch uses `mode: 'no-cors'` (opaque response), no error surfaces anywhere a developer would check. Reviewers receive no emails. No error is shown to the candidate. The Sheet writes that happen before `MailApp.sendEmail()` do commit successfully, creating a misleading appearance of success.

**Why it happens:**
GAS deployed web apps run under the authorization of the account that created the deployment. When new API scopes are added to source code, existing deployments do not automatically re-request those scopes — the authorization grant was already made without them. The developer must manually run any function in the GAS editor to trigger the OAuth re-authorization dialog, then grant the new scope, before deploying the new version. Skipping this step is the most common cause of email non-delivery after a GAS update.

**How to avoid:**
1. After updating `google-apps-script.js` with any new `MailApp` or `GmailApp` call, open the GAS editor, run a test function (e.g., a `testEmail()` stub that calls `MailApp.sendEmail()` to a known address), and complete the OAuth re-authorization dialog before deploying.
2. Add `MailApp.getRemainingDailyQuota()` to a manual test function — if it returns a number, the scope is authorized; if it throws, re-authorization is needed.
3. In the deployment checklist (the MANUAL REDEPLOY REQUIRED note already in the quick-260522-uez SUMMARY), explicitly add: "Step 4: Re-authorize permissions for MailApp — click Review permissions → Allow."
4. Use `GmailApp.sendEmail()` instead of `MailApp.sendEmail()` if the GAS account is a Google Workspace account — `GmailApp` uses a different (sometimes pre-authorized) scope and has fewer delivery issues to non-Gmail recipients.

**Warning signs:**
- Candidate completes Zone 4; SOCData sheet has rows; Summary sheet cols 12-13 updated — but reviewers receive no email.
- GAS execution logs show `MailApp error:` entries (check via Apps Script > Executions).
- `MailApp.getRemainingDailyQuota()` throws instead of returning a number when run in the GAS editor.

**Phase to address:**
GAS deployment phase and any subsequent `google-apps-script.js` update. This is an ops step, not a code fix — it must be documented as a mandatory action whenever new GAS scopes are added.

---

### Pitfall 2: Term-Stuffing Passes Keyword Validation Without Understanding

**What goes wrong:**
A candidate who knows the game is played by keyword presence can write a query like:
`index=email_logs | stats count | search src_ip | table user_agent recipient` — a syntactically nonsensical or incomplete query that nonetheless contains all required terms. The `String.includes()` engine scores it 10/10. The reviewer sees "Strong" on SPL but the query would never run in Splunk.

**Why it happens:**
Substring matching has no awareness of how terms are used — a term in a comment, a string literal, or as a fragment of a field name (`count_by_src_ip`) all satisfy a match for `count` or `src_ip`. There is no context-of-use check.

**How to avoid:**
1. Author required terms as **multi-token phrases** where possible (`| stats count by`, `| table src_ip`, `index=email_logs`) rather than single tokens (`stats`, `count`, `src_ip`). Phrase matching is much harder to satisfy by accident while still achievable with a correct query.
2. Add 2–3 **blocked terms** per question that represent the "obvious stuffing words" a gamer would use (e.g., if the expected query uses `dedup`, block `dedup stats count` as a phrase, or block known nonsense patterns).
3. The reviewer view displays the raw SPL — a human reviewer can spot-check term-stuffed submissions in seconds. Note this explicitly in reviewer UI as a review hint: "Check SPL is syntactically coherent, not just keyword-present."
4. Accept this is the chosen validation fidelity. The project spec explicitly rules out query execution. Document the known limitation in `socQuestions.js` comments so future maintainers understand the trade-off.

**Warning signs:**
- Test candidates who score 10/10 on SPL but whose written queries look fragmented or nonsensical in the reviewer view.
- If multiple candidates score 10/10 with very different-looking queries, investigate whether the term list is too loose.

**Phase to address:**
Term-list authoring phase (when `socQuestions.js` is written or revised). The scoring engine itself does not need to change — the fix is in the data, not the code.

---

### Pitfall 3: False Fails from Alternate Valid SPL Syntax

**What goes wrong:**
A candidate writes a perfectly correct and idiomatic SPL query using a synonym or alternate form:
- Expected required term: `earliest=-24h` — candidate writes `earliest=-1d` (equivalent in Splunk)
- Expected: `| stats count by src_ip` — candidate writes `| stats dc(src_ip)` (also valid)
- Expected: `index=proxy_logs` — candidate uses `index=web_proxy` (same index, different name convention)

The engine marks these required terms as missed and the score drops even though the query is technically correct.

**Why it happens:**
`String.includes()` is an exact-substring check. Splunk has multiple valid syntaxes for the same operation. The term list was authored with one canonical form in mind.

**How to avoid:**
1. In `validateSpl.js`, allow each required term to be either a **string** or a **`{ anyOf: string[] }`** object. If an element is `{ anyOf: ['earliest=-24h', 'earliest=-1d', 'earliest=-86400s'] }`, the check passes if any variant is found. This structure is already in the codebase (`socQuestions.js` Q1 optional terms use `anyOf`) — extend it to required terms for time-range and aggregation variants.
2. When authoring `socQuestions.js`, brainstorm at least two equivalent forms for each time-range or aggregation term and include both as `anyOf` variants.
3. Keep the initial release pragmatic: author required terms around the most common idiom, but plan the `anyOf` structure from day one so it is easy to extend when false fails are found in review.

**Warning signs:**
- Reviewer sees a query that looks correct but scored 4/10.
- Reviewer manually reads the query and cannot find the error.
- Feedback message shows "Missing keyword: `earliest=-24h`" but the raw SPL shows `earliest=-1d`.

**Phase to address:**
Both the authoring phase (`socQuestions.js` data shape) and the validation engine phase (`validateSpl.js` — the `anyOf` structure must be supported before content is authored against it).

---

### Pitfall 4: Whitespace and Case Sensitivity Cause Silent False Fails

**What goes wrong:**
A required term is authored as `index=email_logs` but the candidate writes `index = email_logs` (space around `=`), or `INDEX=email_logs` (uppercase). The `toLowerCase()` + `includes()` approach handles case but does not normalise whitespace inside multi-token terms.

**Why it happens:**
`lower.includes('index=email_logs')` returns false when the candidate's text contains `index = email_logs` because the search string has no space around `=`. Whitespace normalisation is not applied before the check.

**How to avoid:**
In `validateSpl.js`, before doing `includes()` checks, normalise the candidate text by collapsing all runs of whitespace to a single space:
```js
const normalised = text.toLowerCase().replace(/\s+/g, ' ').trim();
```
Then check `normalised.includes(term.toLowerCase().replace(/\s+/g, ' '))`.

Author terms in the format most candidates will actually type — `index=email_logs` not `index = email_logs` — and normalise both sides.

**Warning signs:**
- A term like `| stats count by` fails for a candidate whose query reads `|stats count by` (no space after pipe).
- Reviewer inspects the SPL and can visually see the required term present.

**Phase to address:**
`validateSpl.js` implementation phase. One-line fix; include it from the start rather than debugging it post-authoring.

---

### Pitfall 5: Enriching Evidence Data Structure Breaks SocRound Evidence Rendering

**What goes wrong:**
The v1.1 overhaul adds richer investigation context to each question — structured log lines, timestamps, IP addresses, user agents. These are added as new fields to the `evidence.email`, `evidence.proxy`, and `evidence.edr` objects in `socQuestions.js`. `SocRound.jsx` currently renders evidence by calling `Object.entries(question.evidence.email).map(([key, val]) => ...)` and auto-labels keys by converting camelCase to title case. Adding new fields like `logLines: [...]` (an array) or `rawHeader: "..."` (a multi-line string) causes the renderer to display `[object Object]` or raw unwrapped array entries, breaking the evidence panel's readable layout.

**Why it happens:**
The evidence renderer in `SocRound.jsx` (lines 136–148, 161–174, 185–199) assumes all values are flat strings. It has no type checking — `val && (...)` will render arrays and objects as their coerced string representation. This worked for v1's simple key-value evidence structure but will break when v1.1 adds richer nested or array data.

**How to avoid:**
1. Before enriching `socQuestions.js`, audit `SocRound.jsx`'s evidence renderer and add explicit type guards: if `Array.isArray(val)`, render as a list; if `typeof val === 'object'`, render as a nested block; if `typeof val === 'string'`, render inline.
2. Define the evidence schema explicitly (e.g., a JSDoc typedef in `socQuestions.js`) so any future field additions have a documented shape contract.
3. Alternatively, restructure evidence as an ordered array of `{ label, value, type }` display objects rather than a plain object — this separates display order and label from field names and removes the auto-labelling fragility.
4. Add at least one manual render check per question after editing `socQuestions.js` — open the app, navigate to each SOC question, and verify the evidence panel displays correctly.

**Warning signs:**
- Evidence panel shows `[object Object]` or a raw comma-separated list in the value column.
- A new evidence field is added to `socQuestions.js` but the evidence panel layout looks broken or truncated on that question.
- `console.error` from React about rendering objects as children.

**Phase to address:**
Any phase that modifies `socQuestions.js` evidence shape or `SocRound.jsx`'s evidence rendering block.

---

### Pitfall 6: Client-Side Passcode Is Visible in the Built JS Bundle

**What goes wrong:**
If the reviewer passcode is stored as `VITE_REVIEWER_PASSCODE` in `.env.local` and injected via `import.meta.env.VITE_REVIEWER_PASSCODE` at build time, Vite embeds this as a plain string literal in the built JavaScript. Anyone who downloads the page and runs `strings dist/assets/index-*.js | grep flagmail` will find the passcode in seconds.

**Why it happens:**
Vite's `import.meta.env` substitution is compile-time string replacement. The resulting JS bundle contains the literal passcode value. This is a well-known Vite/webpack characteristic — environment variables prefixed `VITE_` are intentionally exposed to the client bundle.

**How to avoid:**
1. Do not store the passcode as a `VITE_` prefixed env var. Instead, send the passcode in the fetch call to the GAS endpoint and let the server validate it via `PropertiesService.getScriptProperties()`. The client code sends the passcode to `?action=getSOCSubmissions&passcode=<input>` — the client never needs to know the correct passcode value, only the server does. This is already implemented correctly in the current `google-apps-script.js` (`PropertiesService.getScriptProperties().getProperty('REVIEWER_PASSCODE')`).
2. Verify `ReviewerScreen.jsx` does NOT compare the entered passcode against any local constant. It must only pass it to the GAS endpoint.
3. If any dev fallback is kept (`import.meta.env.VITE_REVIEWER_PASSCODE || 'dev-only'`), document explicitly that this fallback is a dev convenience, not the production passcode, and that the real gate is the server-side `PropertiesService` check.

**Warning signs:**
- Running `npm run build` then searching `dist/assets/index-*.js` reveals the production passcode as a plaintext string.
- The `.env.local` file is committed to git (`.gitignore` must include `*.local`).
- `ReviewerScreen.jsx` contains a hardcoded fallback passcode string that is the same as the production passcode.

**Phase to address:**
`SocReviewer.jsx` / `ReviewerScreen.jsx` implementation and `google-apps-script.js` extension. Both must be addressed together — the client must NOT compare the passcode; it must send it to the server.

---

### Pitfall 7: Zone 1–3 Regression When Modifying SCREENS Enum or App.jsx Render Logic

**What goes wrong:**
The v1.1 overhaul requires changes to `App.jsx`'s screen rendering (adding or modifying SOC screens, reordering conditions, or adding new state fields). A change to the render switch-case or the `useGameState` / `useSocState` composition accidentally breaks the `advanceZone` path, the `handleSocNext` condition, or the leaderboard submit trigger for zones 1–3. Zones 1–3 are the established product — a regression here is a critical bug.

**Why it happens:**
`App.jsx` is the composition root for all hooks (`gs`, `sc`, `soc`) and all screen rendering. Any edit to the render block risks introducing a new early return, a wrong conditional branch, or a state field collision. The SOC zone was wired additively in v1 (`handleSocNext`, `SOC_RESULTS` render path), but v1.1 UI changes may require restructuring that render logic. Without a test for the zones 1–3 path, regressions are invisible until manual testing.

**How to avoid:**
1. Run a complete manual end-to-end test of zones 1–3 (all rounds, zone complete, leaderboard submit) before and after any `App.jsx` or `useGameState.js` change.
2. Keep the `handleAdvanceZone` (zones 1–3) and `handleSocNext` (zone 4) code paths as separate, non-overlapping branches. Never combine them into a single handler.
3. Before any `App.jsx` edit, note which screen states are rendered for zones 1–3 (`LANDING`, `TUTORIAL`, `ZONE_INTRO`, `ROUND`, `EXPLANATION`, `ZONE_COMPLETE`, `RESULTS`) and verify none of those branches are touched.
4. Use the GitNexus impact analysis (`gitnexus_impact({target: "handleAdvanceZone", direction: "upstream"})`) before modifying any function that touches zone progression logic.

**Warning signs:**
- After an `App.jsx` edit, the "Start Game" button on `LandingScreen` does not advance to `TUTORIAL`.
- Completing a round in zone 1 does not trigger `ExplanationCard`.
- The leaderboard submit at `RESULTS` shows no data or throws a console error.
- `ZONE_COMPLETE` appears for zone 4 instead of `SOC_RESULTS`.

**Phase to address:**
Any phase that touches `App.jsx`, `useGameState.js`, or the `SCREENS` enum — particularly Phase 3 (State Machine and Hook) of the current roadmap.

---

### Pitfall 8: GAS CORS Blocks the Reviewer GET Fetch

**What goes wrong:**
The reviewer component calls `fetch(GAS_URL + '?action=getSOCSubmissions&passcode=...')` from a browser. GAS web apps deployed as "Access: Anyone" return CORS headers, but only for simple GET requests that do not trigger a preflight. If the reviewer fetch accidentally uses a `Content-Type: application/json` header or a non-simple method, the browser blocks it with a CORS error.

**Why it happens:**
The existing `submitToSheet` uses `mode: 'no-cors'` for POST submissions (which means the response is opaque and errors are silent). The reviewer GET needs to actually read the response, so `no-cors` cannot be used. If the fetch is not authored as a simple GET with no custom headers, it triggers a preflight that GAS does not handle.

**How to avoid:**
Author the reviewer fetch as a plain GET with no custom headers:
```js
fetch(`${GAS_URL}?action=getSOCSubmissions&passcode=${encodeURIComponent(passcode)}`)
  .then(r => r.json())
  .then(data => ...)
```
Do not add `Content-Type`, `Authorization`, or any custom header. Test in both Chrome and Firefox in dev before considering the feature done.

**Warning signs:**
- Console shows "CORS error" or "Access to fetch at GAS URL from origin ... has been blocked."
- The POST submissions work but the reviewer GET fails.
- The fetch call has a `headers` object or `method: 'POST'` where a simple GET would do.

**Phase to address:**
`ReviewerScreen.jsx` fetch implementation and `google-apps-script.js` `doGet` extension. Add an explicit `// no custom headers — GAS CORS requires simple GET` comment in the code.

---

### Pitfall 9: Concept Keyword Matching Penalises Synonyms in Explanations

**What goes wrong:**
Expected concept keyword: `"lateral movement"`. Candidate writes: `"the attacker moved laterally to other systems"`. The substring check for `lateral movement` fails because the phrase is split across a sentence boundary.

Or: expected concept `"credential harvesting"` — candidate writes `"credentials were harvested"` (plural/past tense). `includes('credential harvesting')` fails.

**Why it happens:**
Natural language explanations are paraphrased. Unlike SPL queries where there is a canonical syntax, explanations are free-form. Stemming and semantic equivalence are beyond plain `String.includes()`.

**How to avoid:**
1. Author concept keywords as the **shortest unambiguous root form** that still appears in natural writing: `"lateral"` instead of `"lateral movement"`, `"credential"` instead of `"credential harvesting"`. Shorter roots match more natural variants.
2. Use the same `anyOf` mechanism as SPL terms: `{ anyOf: ['lateral movement', 'moved laterally', 'lateral spread'] }`.
3. Keep the concept list short (3–5 per question). A 5-point score divided across 5 concepts gives 1 point per concept — tolerate one or two misses rather than trying to catch every synonym.
4. The explanation score is 5 points (22% of total). The risk of false fails here affects the grade band less severely than SPL (10 points, 43%). Accept some imprecision in explanation scoring at v1.

**Warning signs:**
- Manual review of explanations shows correct reasoning that scores 2/5 because of synonym variation.
- Multiple candidates score 0 on concepts that should be common knowledge.

**Phase to address:**
`socQuestions.js` authoring phase. Design the concept list with root-form keywords. The `anyOf` support in `validateSpl.js` applies equally to `validateExplanation`.

---

### Pitfall 10: SPL Submission Is Stored as Raw Text in Google Sheets — Formula Injection Risk

**What goes wrong:**
A candidate types `=HYPERLINK("https://evil.com","click")` as their SPL query. When this is written to the `SOCData` Google Sheet, Sheets interprets the leading `=` as a formula and executes it. At minimum this is a nuisance; at worst it can exfiltrate sheet data via `=IMPORTRANGE` or similar.

**Why it happens:**
The GAS `appendRow` call writes values directly without sanitising the first character. Google Sheets treats any cell value starting with `=`, `+`, `-`, or `@` as a formula.

**How to avoid:**
The current `google-apps-script.js` already implements `sanitiseCell()` correctly (lines 352–357) and applies it to `splText` and `explanation` in the `submitSOC` and `submitFinal` handlers. Verify this is not removed or bypassed during any v1.1 GAS edits.

**Warning signs:**
- A cell in `SOCData` shows a hyperlink or a formula result instead of raw SPL text.
- Sheet shows `#REF!` or `#ERROR!` in the SPL column.

**Phase to address:**
Any `google-apps-script.js` modification. Add `sanitiseCell` to the checklist for every new `appendRow` call.

---

### Pitfall 11: Silent Submission Failure Leaves Candidate Score Unrecorded

**What goes wrong:**
The `submitFinal` in `useSocState.js` uses `mode: 'no-cors'` (opaque response), wraps all errors in `catch (_) {}`, and gives no user feedback on failure. If the GAS URL is wrong, the Apps Script has a quota error, or the network is offline, the submission silently fails and the reviewer sees nothing.

**Why it happens:**
The existing codebase has this as a documented LOW concern in `CONCERNS.md` ("Silent Email Check Failure Allows Bypass", "Silent Failure on Score Submission"). The SOC submission inherits the same fetch pattern. `mode: 'no-cors'` makes the response permanently unreadable — the browser cannot distinguish success from failure.

**How to avoid:**
1. After the fetch resolves (even with opaque response), show a "Submitted" confirmation. If the fetch rejects (network error), show "Submission failed — note your scores and contact the reviewer."
2. Before leaving the SOC results screen, store the serialised submission in `sessionStorage` as a fallback — this is already implemented in `useSocState.submitFinal` (`sessionStorage.setItem("socSubmission", ...)`). Verify the data is actually written and recoverable.
3. Do NOT attempt to read the GAS POST response body — `mode: 'no-cors'` makes it unreadable. The error branch is fetch rejection only.

**Warning signs:**
- Candidates complete Zone 4 but the reviewer's `SOCData` sheet has no rows.
- The fetch call swallows errors silently with no UI indication.
- `sessionStorage["socSubmission"]` is empty after zone completion (indicates the sessionStorage write is also failing).

**Phase to address:**
`useSocState.js` implementation phase (fetch + error handling). The `sessionStorage` backup is already implemented — verify it works.

---

### Pitfall 12: Q8 Multi-Stage Flattening Creates Mismatched Scoring Weights

**What goes wrong:**
Q8 (now Q5a/Q5b in the dataset) was split into two sub-questions to handle a multi-stage investigation. The `QUESTION_SCORE_MAP` in `useSocState.js` assigns Q5a: `{ primary: 5, secondary: 3, spl: 2, explanation: 0 }` and Q5b: `{ primary: 0, secondary: 0, spl: 10, explanation: 0 }`. If the content design decision on this split is revised (e.g., Q5b gains an explanation task, or Q5a's SPL weight changes), the `QUESTION_SCORE_MAP` must also change — but there is no compile-time enforcement connecting the question data to its score weights. A mismatch silently produces wrong totals.

**Why it happens:**
The score weights are defined in a separate constant (`QUESTION_SCORE_MAP`) rather than co-located with the question data. When `socQuestions.js` is updated, `useSocState.js` must also be updated manually. There is no schema validation asserting the two stay in sync.

**How to avoid:**
1. Add the score weights directly to each question object in `socQuestions.js` (e.g., a `scoreConfig: { primary: 5, secondary: 3, spl: 10, explanation: 5 }` field) instead of maintaining a parallel map in `useSocState.js`. This co-locates the content decision with its scoring weight.
2. If the parallel map must stay in `useSocState.js` for architectural reasons, add a runtime assertion at hook initialisation: verify that every `SOC_QUESTIONS[i].id` has a corresponding entry in `QUESTION_SCORE_MAP`. If not, throw a descriptive error in development.
3. The STATE.md blocker "Q8 multi-stage flattening requires a content design decision on how to split into sequential sub-questions" is unresolved — do not close Phase 1 until this decision is finalised and the score map updated to match.

**Warning signs:**
- `socTotal` in `useSocState` does not match the sum of displayed per-question scores.
- Q5b scores primary/secondary even though neither is applicable (weight should be 0).
- Adding a new question to `socQuestions.js` results in `scoreSocRound` receiving `undefined` for the score config.

**Phase to address:**
Phase 1 (Question Dataset) and the data-design decision gate on Q5a/Q5b. Must be resolved before Phase 2 (Validation and Scoring Utilities) can be tested against the full question set.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Single required-term string (no `anyOf`) | Simple data structure, fast to author | False fails accumulate as real candidates use alternate syntax; content must be retrofitted | Only if term list is exhaustively reviewed against multiple valid query variants before release |
| Passcode hardcoded in component source (no env var, no server check) | Zero config needed | Passcode visible in git history and built JS bundle; anyone with the URL can read all SOC submissions | Never — always use server-side `PropertiesService` check |
| No `sessionStorage` backup for SOC submission | Less code | If network blips during submit, candidate's score is permanently lost; no recovery path | MVP-acceptable only if candidates are supervised and can re-submit immediately |
| Concept keywords as exact phrases (not root forms) | Easier to author | High false-fail rate on explanation score; reviewer workload increases as they manually correct scores | Never — always author concept keywords as shortest unambiguous root |
| Copying `submitToSheet`'s silent `catch (_) {}` error handling | Consistent with existing code | SOC candidates have no feedback if their score was not saved; creates reviewer confusion | Never for SOC — at minimum show a user-visible error message |
| Score weights in `useSocState.js` QUESTION_SCORE_MAP (not co-located with question data) | Existing pattern, easy to discover | Drift between question content and scoring weights; no compile-time enforcement | Acceptable temporarily if a runtime assertion guards the map on init |
| Object.entries() auto-render for evidence panel in SocRound | Zero template code needed per question | Breaks on non-string values (arrays, nested objects); requires all evidence fields to remain flat strings | Only if evidence data remains simple key-value pairs with no nested arrays |
| Hardcoded reviewer email addresses in GAS | Easy to deploy | Must edit and redeploy GAS to change recipients; email addresses exposed in version history | Never for production — move to `PropertiesService` or a config sheet |

---

## Integration Gotchas

Common mistakes when connecting to Google Apps Script.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| GAS MailApp — new scope after redeploy | Assuming new version inherits old authorization; email silently fails | Run any MailApp function in GAS editor to trigger re-authorization dialog before deploying new version |
| GAS GET for reviewer data | Adding `Content-Type: application/json` header causes preflight; GAS returns CORS error | Plain `fetch(url)` with no headers; GAS only allows simple requests without preflight |
| GAS POST for SOC submission | Using `mode: 'cors'` expecting to read response; GAS POST does not set CORS headers | Use `mode: 'no-cors'`; treat all POSTs as fire-and-forget; show UX confirmation regardless |
| GAS sheet write (SPL text) | Writing raw candidate input directly to sheet | Prefix cells starting with `=`, `+`, `-`, `@` with apostrophe via `sanitiseCell()` — already implemented; do not remove |
| GAS PropertiesService for passcode | Setting passcode in `doGet` source code | Set via `File > Project properties > Script properties` in GAS editor; read with `PropertiesService.getScriptProperties().getProperty('REVIEWER_PASSCODE')` |
| GAS PropertiesService for recipients | Hardcoding reviewer emails in GAS source | Move to `PropertiesService` key `REVIEWER_EMAILS` (comma-separated) so ops can update without a code redeploy |
| GAS new sheet (`SOCData`) | Assuming sheet exists after first deploy | Use the existing `ensureSOCSheet` pattern — already implemented; verify it is called before every `appendRow` |
| GAS MailApp daily quota | Sending to 4 recipients per submission; large candidate volumes hit the 100 emails/day (consumer Gmail) or 1,500/day (Workspace) limit | Monitor quota via `MailApp.getRemainingDailyQuota()`; switch to `GmailApp.sendEmail()` for higher Workspace quota if limit is hit |
| Evidence panel rendering | Adding array or object fields to `evidence.email` or `evidence.proxy` in `socQuestions.js` | Audit `SocRound.jsx` evidence renderer for type guards before enriching evidence structure; add explicit handling for arrays and nested objects |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| GAS returns entire SOCData sheet on every reviewer GET | Reviewer page slow; GAS 30s timeout on large sheets | For v1 (small candidate volume) acceptable; add `?limit=&offset=` params before exceeding ~500 rows | ~500+ SOCData rows (depends on row count × column width) |
| All 10 Lottie badge animations bundled statically in BadgeToast | Large initial JS bundle (~200–400KB for animations); slow first load on mobile | Lazy-load Lottie assets via dynamic `import()` when badge triggers; not needed for Zone 4 (no badge yet) | Noticeable on 3G/mobile; already flagged in CONCERNS.md |
| `socQuestions.js` fully bundled at startup | All 6 questions loaded before Zone 1 even starts | For v1 acceptable (~30KB); split by zone before data exceeds ~100KB | If question count grows to 20+ with rich evidence strings |
| `Object.entries()` auto-render over growing evidence objects | Evidence panel grows uncontrollably with new fields; layout breaks | Define a fixed display schema for evidence; only render known fields in defined order | As soon as a non-string (array, nested object) field is added |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| `VITE_REVIEWER_PASSCODE` in built JS bundle | Anyone inspecting the bundle finds the passcode and can read all SOC submissions | Do not use `import.meta.env` for passcode comparison on the client; send passcode to server and compare there via `PropertiesService` |
| Passcode in GET query param without HTTPS | Query params appear in GAS execution logs, browser history if bookmarked | GAS is always HTTPS; avoid `Logger.log(e.parameter.passcode)` in GAS — do not log the raw passcode |
| Formula injection via candidate SPL or explanation text | `=IMPORTRANGE(...)` in a cell can exfiltrate sheet data to an external URL | `sanitiseCell()` in GAS before every `appendRow` write — already implemented; verify it is not removed |
| `.env.local` committed to git | Passcode enters version history permanently | Verify `.gitignore` includes `*.local` (standard Vite template already does this; confirm before first commit) |
| Reviewer email addresses hardcoded in GAS source | Personal/corporate email addresses in git history; must redeploy to change recipients | Move to `PropertiesService` key `REVIEWER_EMAILS` |
| Candidate name injected into email subject line | `payload.name` appears in the subject: `'Email Abuse Assessment - "' + (payload.name || '') + '"'`; a candidate named `" onclick="alert(1)"` sends a malformed subject | For plain-text email body and standard email clients this is low risk; add basic name sanitisation (`name.replace(/[^a-zA-Z0-9 \-']/g, '')`) if names are user-controlled |
| localStorage-based attempt blocking is trivial to bypass | Candidates can clear localStorage and retake the assessment | The server-side `checkEmail` GAS query is the real gate; localStorage check is advisory only — this is the current design and is acceptable |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing "Missing keyword: `earliest=-24h`" as feedback when candidate used `earliest=-1d` | Candidate who wrote a valid query feels the system is wrong; erodes trust in the assessment | Either resolve the false fail at authoring time with `anyOf`, or phrase feedback as "Query may be missing time-scoping — verify your time filter" rather than quoting the exact expected token |
| No character count or minimum length signal on SPL textarea | Candidates submit a one-liner and miss the explanation entirely, not realising they left a field blank | Add a minimum-character hint below the textarea ("Typical queries: 50–200 characters") and disable the submit button until both fields exceed a minimum length |
| Showing score breakdown immediately per-question during the flow | Candidate reverse-engineers the keyword list by trial-and-error between questions | Show detailed keyword feedback only on the final results screen (or after all questions are done), not inline during the question flow |
| Reviewer view loads all submissions with no indication of loading state | On a slow GAS response (2–4 seconds), the reviewer sees a blank table and may think it is empty | Show a spinner immediately on unlock; display "Loading submissions..." text until the fetch resolves |
| Grade band label "Not ready" shown to candidate on results screen | Demoralising without context; candidate does not know what to improve | Pair every grade band with one actionable improvement tip from the feedback list, not just the label |
| Evidence panel auto-labels camelCase keys without context | `deliveryStatus` becomes "Delivery Status" — fine; `edr` field `networkConnection` becomes "Network Connection" — less clear without SOC context | Pre-define display labels for each field in the evidence schema, or add a `label` alongside each evidence value; do not rely on camelCase-to-title-case auto-labelling for domain-specific field names |
| Hint system reveals keywords before candidate writes SPL | Hints reduce task validity for assessment purposes; a hint that says "look at stats count by" defeats the SPL scoring | Defer hints to v2 as currently planned; if adding hints in v1.1, show hints only after first failed submit attempt and ensure hints give directional guidance ("think about aggregation") not exact SPL fragments |
| Secondary diagnosis picker always visible even for Q5b (no classification) | Candidate sees an empty picker or a picker with no options, causing confusion | Q5b has no classification task — the picker must be hidden entirely when `hasClassification` is false; verify `SocRound.jsx` `hasClassification` guard works correctly for Q5b |

---

## "Looks Done But Isn't" Checklist

- [ ] **GAS MailApp delivery:** Run end-to-end SOC submission in staging and verify all four recipients received the email with a `.csv` attachment — not just that no error appeared in the browser.
- [ ] **GAS re-authorization after scope change:** Open GAS Executions log after first real deployment; confirm no `MailApp error:` entries. If present, re-authorize and redeploy.
- [ ] **SPL validation engine:** Handles `anyOf` term variants — verify a query using `earliest=-1d` still passes when `earliest=-24h` is the required term.
- [ ] **Whitespace normalisation:** Verify `|stats count by src_ip` (no space after pipe) still matches the required term `| stats count by src_ip`.
- [ ] **Blocked term penalty:** Verify the score floor is 0 — blocked terms cannot make the SPL score go negative.
- [ ] **Reviewer passcode gate:** Inspect the built `dist/assets/index-*.js` — the correct passcode must NOT appear as a plaintext string.
- [ ] **GAS formula injection:** Open `SOCData` sheet after submitting a query starting with `=` — the cell must display the raw text, not execute a formula.
- [ ] **Silent submission failure:** Disable network in DevTools and submit a SOC answer — the UI must show an error message or at minimum a visible "check your connection" prompt.
- [ ] **Reviewer CORS:** Call the reviewer GET fetch in a real browser (not just Node) — must not throw a CORS error.
- [ ] **Explanation concept keywords:** Manually grade 3 correct explanations that use synonyms — at least 2/3 must pass with root-form keywords.
- [ ] **Grade band boundary:** Verify a score of exactly 20 shows "Strong" and exactly 19 shows "Good" (off-by-one is common in boundary conditions).
- [ ] **Existing zones unaffected:** Complete Zone 1–3 flow end-to-end after any `App.jsx` or `useGameState.js` change — leaderboard submit must still work.
- [ ] **Evidence panel with enriched data:** Navigate to every SOC question and verify the evidence panel shows readable text, not `[object Object]` or raw array notation.
- [ ] **Q5b classification guard:** Navigate to Q5b in the app — the classification pickers must not render; only the SPL textarea and explanation field should be visible.
- [ ] **QUESTION_SCORE_MAP sync:** Verify every question ID in `SOC_QUESTIONS` has a corresponding entry in `QUESTION_SCORE_MAP` in `useSocState.js` — no question should silently receive `undefined` weights.
- [ ] **sessionStorage backup:** After completing Zone 4, open DevTools → Application → sessionStorage — `socSubmission` must contain a parseable JSON string of the full submission payload.

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| GAS MailApp not sending (scope not re-authorized) | LOW | Open GAS editor → run `testEmail()` stub → re-authorize → redeploy as new version; existing sheet data is intact |
| Term-stuffed submissions scored as Strong | LOW | Reviewer manually downgrades in sheet; add the stuffed phrase to the blocked list in `socQuestions.js` and redeploy static build |
| False fails from alternate SPL syntax discovered post-launch | LOW | Add `anyOf` variant to `socQuestions.js`; redeploy static build; existing submissions in sheet are stale but can be manually corrected by reviewer |
| Evidence panel broken by enriched data structure | LOW | Revert the `socQuestions.js` evidence field addition; add type guards to `SocRound.jsx`; re-add the field after guards are in place |
| Passcode discovered in built bundle | HIGH | Immediately change the `PropertiesService` passcode in GAS editor; revoke the old `.env.local` value; rebuild and redeploy; old submissions are not at risk (read-only) |
| GAS formula injection found in SOCData sheet | MEDIUM | Delete affected rows; verify `sanitiseCell` is applied; redeploy GAS (does not require client rebuild); re-collect affected submissions if possible |
| Silent submission failure discovered for multiple candidates | HIGH | Restore from `sessionStorage` if implemented; otherwise manually re-enter candidate scores from the UI's displayed results (results screen renders from local state before submission) |
| CORS error blocks reviewer GET | LOW | Switch to plain `fetch(url)` with no headers; no GAS changes required |
| Zone 1–3 regression after App.jsx edit | MEDIUM | Revert the App.jsx change; re-apply only the intended edit with careful branch isolation; run manual end-to-end of zones 1–3 before merging |
| Q5a/Q5b score weight mismatch | LOW | Update `QUESTION_SCORE_MAP` in `useSocState.js` to match the content decision in `socQuestions.js`; no GAS or sheet changes needed |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| GAS MailApp delivery / scope re-authorization | GAS deployment (Phase 5 and every subsequent GAS redeploy) | Check GAS Executions log; verify all 4 recipients received the email with CSV attachment |
| Term-stuffing false passes | Term-list authoring (Phase 1: socQuestions.js) | Review each term list against 3 plausible stuffing attempts; at least one blocked term per question |
| False fails from alternate SPL syntax | Phase 2: validateSpl.js implementation + Phase 1: socQuestions.js authoring | Unit-test validateSpl with known synonym variants; confirm score matches expected |
| Whitespace/case normalisation false fails | Phase 2: validateSpl.js implementation | Unit-test `\|stats` vs `| stats`; `INDEX=` vs `index=` |
| Evidence panel broken by enriched data | Phase 1 (socQuestions.js) + Phase 4 (SocRound.jsx) | Navigate to every question in browser; verify evidence panel displays readable text only |
| Zone 1–3 regression | Any phase touching App.jsx or useGameState.js | Manual end-to-end zones 1–3 run before and after each App.jsx commit |
| Client-side passcode bundle exposure | Phase 5: SocReviewer.jsx + GAS doGet extension | `grep` built JS bundle for passcode value — must not appear |
| GAS CORS blocking reviewer GET | Phase 5: ReviewerScreen.jsx fetch implementation | Manual browser test of reviewer GET in Chrome and Firefox |
| Concept keyword synonym false fails | Phase 1: socQuestions.js authoring | Manually write 3 correct explanations using synonyms; score each via validateExplanation |
| GAS formula injection | Phase 5: google-apps-script.js submitSoc action | Submit query starting with `=` and inspect SOCData sheet |
| Silent SOC submission failure | Phase 3: useSocState.js fetch + error handling | DevTools network offline test; confirm user-visible error appears; confirm sessionStorage written |
| Q5a/Q5b score weight mismatch | Phase 1 (content decision gate) + Phase 2 (scoring implementation) | Assert every SOC_QUESTIONS id has a QUESTION_SCORE_MAP entry; verify socTotal against manual sum |
| GAS daily email quota exhaustion | Phase 5 deployment and ongoing ops | Monitor `MailApp.getRemainingDailyQuota()` in GAS editor if candidate volume grows |

---

## Sources

- `flagmail1/.planning/PROJECT.md` — scoring model, validation spec, passcode requirement, v1.1 milestone goals (HIGH confidence, direct read)
- `flagmail1/.planning/STATE.md` — known blockers: term-list quality, Q8 split, CORS browser test, passcode ops step (HIGH confidence, direct read)
- `flagmail1/.planning/codebase/CONCERNS.md` — silent submission failure, no tests, GAS public endpoint concerns, evidence rendering fragility, QUESTION_SCORE_MAP (HIGH confidence, direct read)
- `flagmail1/.planning/codebase/INTEGRATIONS.md` — GAS schema, POST/GET patterns, no-cors context, MailApp recipient list (HIGH confidence, direct source read)
- `flagmail1/google-apps-script.js` — appendRow pattern, action dispatch, sanitiseCell implementation, MailApp.sendEmail with try/catch, Logger.log on failure (HIGH confidence, direct source read)
- `flagmail1/src/hooks/useSocState.js` — QUESTION_SCORE_MAP, submitFinal fetch pattern, sessionStorage backup (HIGH confidence, direct source read)
- `flagmail1/src/components/SocRound.jsx` — Object.entries evidence renderer, hasClassification guard, canSubmit logic (HIGH confidence, direct source read)
- `flagmail1/.planning/quick/260522-uez*/SUMMARY.md` — GAS redeploy warning, MailApp scope re-authorization requirement, email non-fatal pattern (HIGH confidence, direct read)
- Google Apps Script authorization scopes docs: adding a new scope (MailApp) requires manual re-authorization in the GAS editor before the new deployment takes effect (MEDIUM confidence — consistent with GAS authorization model and community reports)
- Google Apps Script CORS behaviour: GAS web apps support simple GET requests without preflight; POST requires `mode: no-cors` from browser clients (MEDIUM confidence, consistent with known GAS behaviour and existing codebase pattern)
- GAS MailApp quota: consumer Gmail accounts limited to 100 emails/day; Google Workspace accounts up to 1,500/day via `MailApp.getRemainingDailyQuota()` (MEDIUM confidence, community-confirmed quotas)
- OWASP CSV Injection / Formula Injection: leading `=`, `+`, `-`, `@` in spreadsheet cells trigger formula execution (HIGH confidence, well-documented attack class)
- Vite documentation: `import.meta.env` values are statically replaced in built output — any `VITE_` prefixed variable is present as a string literal in `dist/` (HIGH confidence, well-documented Vite behaviour)

---

*Pitfalls research for: SOC Investigation UX overhaul, hint engine considerations, GAS email delivery debugging, static data enrichment with backward-compatible Zone 4 restructure*
*Researched: 2026-05-25*
*Milestone: v1.1 SOC Investigation Overhaul + Email Fix*
