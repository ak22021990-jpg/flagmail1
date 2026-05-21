# Pitfalls Research

**Domain:** SOC Investigation level — keyword-validated SPL grading, concept-keyword explanation grading, client-side passcode gate, Google Apps Script submission, term-list authoring
**Researched:** 2026-05-21
**Confidence:** HIGH (all pitfalls derived from direct codebase inspection, project spec, and known failure modes of keyword-matching assessment systems)

---

## Critical Pitfalls

### Pitfall 1: Term-Stuffing Passes Keyword Validation Without Understanding

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
Term-list authoring phase (when `socQuestions.js` is written). The scoring engine itself does not need to change — the fix is in the data, not the code.

---

### Pitfall 2: False Fails from Alternate Valid SPL Syntax

**What goes wrong:**
A candidate writes a perfectly correct and idiomatic SPL query using a synonym or alternate form:
- Expected required term: `earliest=-24h` — candidate writes `earliest=-1d` (equivalent in Splunk)
- Expected: `| stats count by src_ip` — candidate writes `| stats dc(src_ip)` (also valid)
- Expected: `index=proxy_logs` — candidate uses `index=web_proxy` (same index, different name convention)

The engine marks these required terms as missed and the score drops even though the query is technically correct.

**Why it happens:**
`String.includes()` is an exact-substring check. Splunk has multiple valid syntaxes for the same operation. The term list was authored with one canonical form in mind.

**How to avoid:**
1. In `splValidation.js`, allow each required term to be either a **string** or a **`{ anyOf: string[] }`** object. If an element is `{ anyOf: ['earliest=-24h', 'earliest=-1d', 'earliest=-86400s'] }`, the check passes if any variant is found.
2. When authoring `socQuestions.js`, brainstorm at least two equivalent forms for each time-range or aggregation term and include both as `anyOf` variants.
3. Keep the initial release pragmatic: author required terms around the most common idiom, but plan the `anyOf` structure from day one so it is easy to extend when false fails are found in review.

**Warning signs:**
- Reviewer sees a query that looks correct but scored 4/10.
- Reviewer manually reads the query and cannot find the error.
- Feedback message shows "Missing keyword: `earliest=-24h`" but the raw SPL shows `earliest=-1d`.

**Phase to address:**
Both the authoring phase (`socQuestions.js` data shape) and the validation engine phase (`splValidation.js` — the `anyOf` structure must be supported before content is authored against it).

---

### Pitfall 3: Whitespace and Case Sensitivity Cause Silent False Fails

**What goes wrong:**
A required term is authored as `index=email_logs` but the candidate writes `index = email_logs` (space around `=`), or `INDEX=email_logs` (uppercase). The current `toLowerCase()` + `includes()` approach handles case but does not normalise whitespace inside multi-token terms.

**Why it happens:**
`lower.includes('index=email_logs')` returns false when the candidate's text contains `index = email_logs` because the search string has no space around `=`. Whitespace normalisation is not applied before the check.

**How to avoid:**
In `splValidation.js`, before doing `includes()` checks, normalise the candidate text by collapsing all runs of whitespace to a single space:
```js
const normalised = text.toLowerCase().replace(/\s+/g, ' ').trim();
```
Then check `normalised.includes(term.toLowerCase().replace(/\s+/g, ' '))`.

Author terms in the format most candidates will actually type — `index=email_logs` not `index = email_logs` — and normalise both sides.

**Warning signs:**
- A term like `| stats count by` fails for a candidate whose query reads `|stats count by` (no space after pipe).
- Reviewer inspects the SPL and can visually see the required term present.

**Phase to address:**
`splValidation.js` implementation phase. One-line fix; include it from the start rather than debugging it post-authoring.

---

### Pitfall 4: Client-Side Passcode Is Visible in the Built JS Bundle

**What goes wrong:**
The reviewer passcode is stored as `VITE_REVIEWER_PASSCODE` in `.env.local` and injected via `import.meta.env.VITE_REVIEWER_PASSCODE` at build time. Vite embeds this as a plain string literal in the built JavaScript. Anyone who downloads the page and runs `strings dist/assets/index-*.js | grep flagmail` will find the passcode in seconds.

**Why it happens:**
Vite's `import.meta.env` substitution is compile-time string replacement. The resulting JS bundle contains the literal passcode value. This is a well-known Vite/webpack characteristic — environment variables prefixed `VITE_` are intentionally exposed to the client bundle.

**How to avoid:**
1. Accept this for v1 because the project spec explicitly states "a shared passcode is sufficient for v1; full auth is a large addition." The passcode protects against casual access, not a determined attacker.
2. **Do not store the passcode as `VITE_` prefixed env var.** Instead, pass the passcode in the fetch call to the GAS endpoint and let the server validate it via `PropertiesService.getScriptProperties()`. The client code sends the passcode to `?action=getSoc&passcode=<input>` — the client never needs to know the correct passcode value, only the server does. This is the pattern already outlined in `STACK.md` and it eliminates the bundle exposure entirely.
3. If the client-side default fallback is kept (`import.meta.env.VITE_REVIEWER_PASSCODE || 'flagmail-review'`), document explicitly that this fallback is a dev convenience, not the production passcode, and that the real gate is the server-side `PropertiesService` check.

**Warning signs:**
- Dev runs `npm run build` and then inspects `dist/assets/index-*.js` and finds the passcode as a plaintext string.
- The `.env.local` file is committed to git (`.gitignore` must include `*.local`).

**Phase to address:**
`SocReviewer.jsx` implementation phase and `google-apps-script.js` extension phase. Both must be addressed together — the client must NOT compare the passcode; it must send it to the server.

---

### Pitfall 5: Google Apps Script CORS Blocks the Reviewer GET Fetch

**What goes wrong:**
The reviewer component calls `fetch(GAS_URL + '?action=getSoc&passcode=...')` from a browser. GAS web apps deployed as "Access: Anyone" return CORS headers, but only for simple GET requests that do not trigger a preflight. If the reviewer fetch accidentally uses a `Content-Type: application/json` header or a non-simple method, the browser blocks it with a CORS error.

**Why it happens:**
The existing `submitToSheet` in `useLeaderboard.js` uses `mode: 'no-cors'` for POST submissions (which means the response is opaque and errors are silent). The reviewer GET needs to actually read the response, so `no-cors` cannot be used. If the fetch is not authored as a simple GET with no custom headers, it triggers a preflight that GAS does not handle.

**How to avoid:**
Author the reviewer fetch as a plain GET with no custom headers:
```js
fetch(`${GAS_URL}?action=getSoc&passcode=${encodeURIComponent(passcode)}`)
  .then(r => r.json())
  .then(data => ...)
```
Do not add `Content-Type`, `Authorization`, or any custom header. Test in both Chrome and Firefox in dev before considering the feature done.

**Warning signs:**
- Console shows "CORS error" or "Access to fetch at GAS URL from origin ... has been blocked."
- The POST submissions work but the reviewer GET fails.
- The fetch call has a `headers` object or `method: 'POST'` where a simple GET would do.

**Phase to address:**
`SocReviewer.jsx` fetch implementation and `google-apps-script.js` `doGet` extension. Add an explicit `// no custom headers — GAS CORS requires simple GET` comment in the code.

---

### Pitfall 6: Concept Keyword Matching Penalises Synonyms in Explanations

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
`socQuestions.js` authoring phase. Design the concept list with root-form keywords. The `anyOf` support in `splValidation.js` applies equally to `validateExplanation`.

---

### Pitfall 7: SPL Submission Is Stored as Raw Text in Google Sheets — Formula Injection Risk

**What goes wrong:**
A candidate types `=HYPERLINK("https://evil.com","click")` as their SPL query. When this is written to the `SOCData` Google Sheet, Sheets interprets the leading `=` as a formula and executes it. At minimum this is a nuisance; at worst it can exfiltrate sheet data via `=IMPORTRANGE` or similar.

**Why it happens:**
The GAS `appendRow` call writes values directly without sanitising the first character. Google Sheets treats any cell value starting with `=`, `+`, `-`, or `@` as a formula.

**How to avoid:**
In `google-apps-script.js`, sanitise the SPL and explanation text before writing to the sheet:
```js
function sanitiseCell(val) {
  var s = String(val || '');
  if (s.match(/^[=+\-@]/)) { s = "'" + s; }  // prefix with apostrophe = force text
  return s;
}
```
Apply `sanitiseCell` to `splQuery` and `explanation` fields before `appendRow`. This is a one-function fix in the GAS file.

**Warning signs:**
- A cell in `SOCData` shows a hyperlink or a formula result instead of raw SPL text.
- Sheet shows `#REF!` or `#ERROR!` in the SPL column.

**Phase to address:**
`google-apps-script.js` extension phase (when `submitSoc` action is added). Add `sanitiseCell` at the same time as the new sheet columns.

---

### Pitfall 8: Silent Submission Failure Leaves Candidate Score Unrecorded

**What goes wrong:**
The existing `submitToSheet` in `useGameState.js` uses `mode: 'no-cors'` (which returns an opaque response), catches errors with only `console.warn`, and gives no user feedback on failure. The SOC submission will inherit this pattern. If the GAS URL is wrong, the Apps Script has a quota error, or the network is offline, the submission silently fails and the reviewer sees nothing.

**Why it happens:**
The existing codebase already has this as a documented LOW concern in `CONCERNS.md` ("Score Submission Silent Failure"). The SOC submission is likely to copy the same fetch pattern.

**How to avoid:**
The SOC POST uses `mode: 'no-cors'` like the existing submissions (GAS POST CORS limitation). The response is always opaque. To give the user meaningful feedback:
1. After the fetch resolves (even with opaque response), show a "Submitted" confirmation. If the fetch rejects (network error), show "Submission failed — note your scores and contact the reviewer."
2. Before leaving the SOC results screen, store the serialised submission in `sessionStorage` as a fallback. If the candidate refreshes or the submission was lost, they can retrieve their data.
3. Do NOT attempt to read the GAS POST response body — `mode: 'no-cors'` makes it unreadable. The error branch is fetch rejection only.

**Warning signs:**
- Candidates complete Zone 4 but the reviewer's `SOCData` sheet has no rows.
- The fetch call swallows errors silently with no UI indication.

**Phase to address:**
`useSocState.js` implementation phase (fetch + error handling). `sessionStorage` backup can be added in the same PR.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Single required-term string (no `anyOf`) | Simple data structure, fast to author | False fails accumulate as real candidates use alternate syntax; content must be retrofitted | Only if term list is exhaustively reviewed against multiple valid query variants before release |
| Passcode hardcoded in component source (no env var, no server check) | Zero config needed | Passcode visible in git history and built JS bundle; anyone with the URL can read all SOC submissions | Never — always use server-side `PropertiesService` check |
| No `sessionStorage` backup for SOC submission | Less code | If network blips during submit, candidate's score is permanently lost; no recovery path | MVP-acceptable only if candidates are supervised and can re-submit immediately |
| Concept keywords as exact phrases (not root forms) | Easier to author | High false-fail rate on explanation score; reviewer workload increases as they manually correct scores | Never — always author concept keywords as shortest unambiguous root |
| Copying `submitToSheet`'s silent `console.warn` error handling | Consistent with existing code | SOC candidates have no feedback if their score was not saved; creates reviewer confusion | Never for SOC — at minimum show a user-visible error message |

---

## Integration Gotchas

Common mistakes when connecting to Google Apps Script.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| GAS GET for reviewer data | Adding `Content-Type: application/json` header causes preflight; GAS returns CORS error | Plain `fetch(url)` with no headers; GAS only allows simple requests without preflight |
| GAS POST for SOC submission | Using `mode: 'cors'` expecting to read response; GAS POST does not set CORS headers | Use `mode: 'no-cors'`; treat all POSTs as fire-and-forget; show UX confirmation regardless |
| GAS sheet write (SPL text) | Writing raw candidate input directly to sheet | Prefix cells starting with `=`, `+`, `-`, `@` with apostrophe in `sanitiseCell()` to prevent formula injection |
| GAS PropertiesService for passcode | Setting passcode in `doGet` source code | Set via `File > Project properties > Script properties` in GAS editor; read with `PropertiesService.getScriptProperties().getProperty('REVIEWER_PASSCODE')` |
| GAS new sheet (`SOCData`) | Assuming sheet exists after first deploy | Use the existing `ensureSheets` pattern — check `getSheetByName`, create if null, write header row |
| Reviewer GET returning all rows | No pagination; GAS returns entire sheet | For v1 (small candidate volume) this is fine; if SOCData exceeds ~500 rows, consider `?limit=` and `?offset=` params |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| `VITE_REVIEWER_PASSCODE` in built JS bundle | Anyone inspecting the bundle finds the passcode and can read all SOC submissions | Do not use `import.meta.env` for passcode comparison on the client; send passcode to server and compare there via `PropertiesService` |
| Passcode in GET query param without HTTPS | Query params appear in server logs and browser history | GAS is always HTTPS; acceptable. But avoid logging the full URL in GAS (`Logger.log`) |
| Formula injection via candidate SPL or explanation text | `=IMPORTRANGE(...)` in a cell can exfiltrate sheet data to an external URL | `sanitiseCell()` in GAS before every `appendRow` write |
| `.env.local` committed to git | Passcode enters version history permanently | Verify `.gitignore` includes `*.local` (standard Vite template already does this; confirm it exists before first commit) |
| Reviewer route accessible at a known URL fragment | Bots or curious candidates navigate to `#reviewer` or trigger the screen via JS console | The SCREENS enum state machine has no URL; the reviewer screen is only reachable via in-app navigation with a correct passcode — no URL to discover |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing "Missing keyword: `earliest=-24h`" as feedback when candidate used `earliest=-1d` | Candidate who wrote a valid query feels the system is wrong; erodes trust in the assessment | Either resolve the false fail at authoring time, or phrase feedback as "Query may be missing time-scoping — verify your time filter" rather than quoting the exact expected token |
| No character count or minimum length signal on SPL textarea | Candidates submit a one-liner and miss the explanation entirely, not realising they left a field blank | Add a minimum-character hint below the textarea ("Typical queries: 50–200 characters") and disable the submit button until both fields exceed a minimum length |
| Showing score breakdown immediately per-question during the flow | Candidate reverse-engineers the keyword list by trial-and-error between questions | Show detailed keyword feedback only on the final results screen, not during the question flow |
| Reviewer view loads all submissions with no indication of loading state | On a slow GAS response (2–4 seconds), the reviewer sees a blank table and may think it is empty | Show a spinner immediately on unlock; display "Loading submissions..." text until the fetch resolves |
| Grade band label "Not ready" shown to candidate on results screen | Demoralising without context; candidate does not know what to improve | Pair every grade band with one actionable improvement tip from the feedback list, not just the label |

---

## "Looks Done But Isn't" Checklist

- [ ] **SPL validation engine:** Handles `anyOf` term variants — verify a query using `earliest=-1d` still passes when `earliest=-24h` is the required term.
- [ ] **Whitespace normalisation:** Verify `|stats count by src_ip` (no space after pipe) still matches the required term `| stats count by src_ip`.
- [ ] **Blocked term penalty:** Verify the score floor is 0 — blocked terms cannot make the SPL score go negative.
- [ ] **Reviewer passcode gate:** Inspect the built `dist/assets/index-*.js` — the correct passcode must NOT appear as a plaintext string.
- [ ] **GAS formula injection:** Open `SOCData` sheet after submitting a query starting with `=` — the cell must display the raw text, not execute a formula.
- [ ] **Silent submission failure:** Disable network in DevTools and submit a SOC answer — the UI must show an error message, not silently succeed.
- [ ] **Reviewer CORS:** Call the reviewer GET fetch in a real browser (not just Node) — must not throw a CORS error.
- [ ] **Explanation concept keywords:** Manually grade 3 correct explanations that use synonyms — at least 2/3 must pass with root-form keywords.
- [ ] **Grade band boundary:** Verify a score of exactly 20 shows "Strong" and exactly 19 shows "Good" (off-by-one is common in boundary conditions).
- [ ] **Existing zones unaffected:** Complete Zone 1–3 flow end-to-end after adding Zone 4 — leaderboard submit must still work.

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Term-stuffed submissions scored as Strong | LOW | Reviewer manually downgrades in sheet; add the stuffed phrase to the blocked list in `socQuestions.js` and redeploy |
| False fails from alternate SPL syntax discovered post-launch | LOW | Add `anyOf` variant to `socQuestions.js`; redeploy static build; existing submissions in sheet are stale but can be manually corrected by reviewer |
| Passcode discovered in built bundle | HIGH | Immediately change the `PropertiesService` passcode in GAS editor; revoke the old `.env.local` value; rebuild and redeploy; old submissions are not at risk (read-only) |
| GAS formula injection found in SOCData sheet | MEDIUM | Delete affected rows; add `sanitiseCell` to GAS; redeploy GAS (redeploy does not require client rebuild); re-collect affected submissions if possible |
| Silent submission failure discovered for multiple candidates | HIGH | Restore from `sessionStorage` if implemented; otherwise manually re-enter candidate scores from the UI's displayed results (results screen renders from local state before submission) |
| CORS error blocks reviewer GET | LOW | Switch to plain `fetch(url)` with no headers; no GAS changes required |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Term-stuffing false passes | Term-list authoring (socQuestions.js) | Review each term list against 3 plausible stuffing attempts; at least one blocked term per question |
| False fails from alternate SPL syntax | splValidation.js implementation + socQuestions.js authoring | Unit-test validateSpl with known synonym variants; confirm score matches expected |
| Whitespace/case normalisation false fails | splValidation.js implementation | Unit-test `\|stats` vs `| stats`; `INDEX=` vs `index=` |
| Client-side passcode bundle exposure | SocReviewer.jsx + GAS doGet extension | `grep` built JS bundle for passcode value — must not appear |
| GAS CORS blocking reviewer GET | SocReviewer.jsx fetch implementation | Manual browser test of reviewer GET in Chrome and Firefox |
| Concept keyword synonym false fails | socQuestions.js authoring | Manually write 3 correct explanations using synonyms; score each via validateExplanation |
| GAS formula injection | google-apps-script.js submitSoc action | Submit query starting with `=` and inspect SOCData sheet |
| Silent SOC submission failure | useSocState.js fetch + error handling | DevTools network offline test; confirm user-visible error appears |

---

## Sources

- `flagmail1/.planning/PROJECT.md` — scoring model, validation spec, passcode requirement (HIGH confidence, direct read)
- `flagmail1/.planning/codebase/CONCERNS.md` — silent submission failure, no-tests, GAS public endpoint concerns (HIGH confidence, direct read)
- `flagmail1/.planning/codebase/INTEGRATIONS.md` — GAS schema, POST/GET patterns, no-cors context (HIGH confidence, direct read)
- `flagmail1/.planning/research/STACK.md` — splValidation.js design, VITE_REVIEWER_PASSCODE approach, GAS PropertiesService pattern (HIGH confidence, direct read)
- `flagmail1/google-apps-script.js` — appendRow pattern, action dispatch, no sanitiseCell currently present (HIGH confidence, direct source read)
- Vite documentation: `import.meta.env` values are statically replaced in built output — any `VITE_` prefixed variable is present as a string literal in `dist/` (HIGH confidence, well-documented Vite behaviour)
- Google Apps Script CORS behaviour: GAS web apps support simple GET requests without preflight; POST requires `mode: no-cors` from browser clients (MEDIUM confidence, consistent with known GAS behaviour and existing codebase pattern)
- OWASP CSV Injection / Formula Injection: leading `=`, `+`, `-`, `@` in spreadsheet cells trigger formula execution (HIGH confidence, well-documented attack class)

---

*Pitfalls research for: SOC Investigation level — keyword-validated SPL grading, client-side passcode, GAS submission*
*Researched: 2026-05-21*
