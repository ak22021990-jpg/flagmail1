# Phase 10: GAS Backend — Research

**Researched:** 2026-05-26
**Domain:** Google Apps Script (GAS) web app, Google Sheets read operations, CORS, passcode authentication
**Confidence:** HIGH

## Summary

Phase 10 adds a single new `getAdminData` POST action to the existing `doPost` dispatch in `google-apps-script.js`. This endpoint reads all three data sheets (Summary, RawData, SOCData), validates the passcode via `PropertiesService` before any sheet access, and returns structured JSON the React admin panel can consume. The implementation is purely additive — zero changes to existing actions, zero impact on candidate submission flows.

**Primary recommendation:** Add `getAdminData` as a `doPost` action using `Content-Type: text/plain` on the client to bypass CORS preflight. This keeps the passcode in the request body (not browser-visible URL), leverages the existing `JSON.parse(e.postData.contents)` pattern, and allows the frontend to read the JSON response.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Passcode validation | GAS Backend | — | Must happen server-side; PropertiesService is only accessible in GAS runtime |
| Sheet data reads | GAS Backend | — | SpreadsheetApp API only runs inside GAS |
| Data assembly (candidate objects) | GAS Backend | — | Server-side reduces payload size and keeps client simple |
| JSON serialization | GAS Backend | — | ContentService handles this natively |
| Data display | Frontend (React) | — | Phase 11+ concern; Phase 10 only delivers the data contract |

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GAS-01 | `getAdminData` reads Summary, RawData, SOCData sheets in single call, gated by passcode | See "Response Shape Design" and "Implementation Pattern" sections |
| GAS-02 | `checkPasscode()` helper validates against PropertiesService before returning data | See "Passcode Validation Pattern" section |
| GAS-03 | Returns structured JSON with candidates, rawData, socData arrays | See "Response Shape Design" section |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Google Apps Script (V8 runtime) | N/A (Google-managed) | Server-side JS runtime for Sheets/PropertiesService | Only runtime available for the existing deployment; already in use |
| `SpreadsheetApp` | N/A (GAS built-in) | Read/write Google Sheets | Only Sheets API available inside GAS |
| `PropertiesService` | N/A (GAS built-in) | Store `REVIEWER_PASSCODE` securely | Only server-side config store in GAS; passcode never in client bundle |
| `ContentService` | N/A (GAS built-in) | Return JSON responses | Already used in all existing endpoints; sets correct MIME type |
| `JSON.parse` / `JSON.stringify` | N/A (GAS built-in) | Parse request body, serialize response | GAS V8 runtime provides standard ES JavaScript |

### No New Dependencies
- Zero npm packages needed — Phase 10 is purely additive GAS code
- Zero new client-side dependencies — data contract phase, no UI code written

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| POST `text/plain` workaround | GET with passcode in URL query param | GET matches existing `getSOCSubmissions` pattern but exposes passcode in browser history + server logs. POST body is more secure. |
| Single `getAdminData` endpoint | Three separate sheet-read endpoints | More granular, but violates GAS-01 contract and adds 3x CORS preflight hits. Single call is simpler for admin panel. |
| Client-side data assembly | Server sends raw rows, client joins | Doubles payload size; server-side assembly is deterministic and testable via curl |

**Installation:** None. Phase 10 modifies only `google-apps-script.js` server-side.

## Package Legitimacy Audit

> No external packages installed in this phase. Zero npm/pip/cargo dependencies. Pure GAS script modification.

**Packages added:** None
**Packages removed due to slopcheck:** None
**Flagged as suspicious:** None

## Architecture Patterns

### System Architecture Diagram (getAdminData Flow)

```
┌─────────────────────────────────────────────────────────────┐
│ BROWSER (Phase 11 — AdminPanel)                             │
│                                                             │
│  POST /exec                                                  │
│  Content-Type: text/plain   ← avoids CORS preflight         │
│  Body: {"action":"getAdminData","passcode":"..."}            │
│                                                             │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ GOOGLE APPS SCRIPT (doPost)                                 │
│                                                             │
│  1. JSON.parse(e.postData.contents)                         │
│  2. Switch on action: "getAdminData"                        │
│     ├─ Extract passcode from body                           │
│     ├─ Validate via PropertiesService                       │
│     │   └─ Invalid? → return { ok: false, error: "..." }    │
│     ├─ Read Summary sheet (all rows)                        │
│     ├─ Read RawData sheet (all rows)                        │
│     ├─ Read SOCData sheet (all rows)                        │
│     ├─ Build candidates[] from Summary rows                 │
│     │   (name, email, totalScore, gradeBand, submissionDate,│
│     │    tabSwitches, zone scores)                          │
│     ├─ Build rawData[] — map RawData rows to objects        │
│     ├─ Build socData[] — map SOCData rows to objects        │
│     └─ Return JSON { ok: true, candidates, rawData, socData}│
│                                                             │
│  Response: ContentService → JSON with CORS headers          │
│  (GAS auto-applies Access-Control-Allow-Origin: *)          │
│                                                             │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS response
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ BROWSER (Phase 11 — AdminPanel)                             │
│                                                             │
│  fetch() response → JSON.parse() → setAdminData(state)      │
│                                                             │
│  On failed passcode: show "Invalid passcode"                │
│  On success: render candidate list / drill-down views       │
└─────────────────────────────────────────────────────────────┘
```

### Existing GAS Architecture (for context)

The `doPost` function dispatches on `payload.action`:
```
action: "register"      → ensures Summary sheet, appends candidate row (In Progress)
action: "submit"        → updates Summary row, appends RawData rows
action: "submitSOC"     → appends SOCData rows (per-question)
action: "submitFinal"   → updates Summary (SOC + Final Score), writes SOCData, emails CSV
action: "getAdminData"  → NEW: reads all sheets, returns structured JSON
                ↑
          Phase 10 adds this
```

The `doGet` function handles read-only queries:
```
?checkEmail=...                     → returns { exists: true/false }
?action=getSOCSubmissions&passcode=  → returns SOC submissions
```
Phase 10 does NOT modify `doGet`. The new `getAdminData` is `doPost` only.

### Pattern 1: Action Dispatch in doPost
**What:** Parse JSON body, switch on `action` string, return `ContentService` JSON response. This is the single established pattern for all 4 existing actions.
**When to use:** Any new server-side operation. Phase 10 MUST follow this pattern — not create a new function or modify `doGet`.
**Source:** `google-apps-script.js` lines 79-296 (verified in codebase)

```javascript
// Existing pattern — Phase 10 adds a new case to this switch
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action || '';

    if (action === 'getAdminData') {
      // NEW: Phase 10 implementation here
      var passcode = payload.passcode || '';
      var correct = PropertiesService.getScriptProperties().getProperty('REVIEWER_PASSCODE');
      if (!correct || passcode !== correct) {
        return ContentService.createTextOutput(
          JSON.stringify({ ok: false, error: 'Invalid passcode' })
        ).setMimeType(ContentService.MimeType.JSON);
      }
      // ... read sheets, build response ...
      return ContentService.createTextOutput(
        JSON.stringify({ ok: true, candidates: [...], rawData: [...], socData: [...] })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    // ... existing actions unchanged ...
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: err.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
```

### Pattern 2: Passcode Validation
**What:** Read `REVIEWER_PASSCODE` from `PropertiesService.getScriptProperties().getProperty()`, string-compare. Return error before any data access.
**When to use:** Every read endpoint that returns candidate data.
**Existing precedent:** `doGet` `getSOCSubmissions` at line 314-320 of `google-apps-script.js`
**Source:** Verified in codebase, lines 314-320

```javascript
// Verified pattern from existing getSOCSubmissions (lines 314-320)
function checkPasscode(passcode) {
  var correct = PropertiesService.getScriptProperties().getProperty('REVIEWER_PASSCODE');
  return correct && passcode === correct;
}
```
Phase 10 SHOULD extract this into a shared `checkPasscode()` helper rather than duplicating the validation logic. This means modifying the existing `doGet` `getSOCSubmissions` path to call the same helper.

### Pattern 3: Sheet Row Reading and Mapping
**What:** `sheet.getRange(2, 1, sheet.getLastRow() - 1, numCols).getValues()` returns 2D array. Iterate rows, build objects.
**When to use:** Any read of a data sheet.
**Existing precedent:** `getSOCSubmissions` in `doGet` lines 332-365 — reads SOCData rows, groups by email+timestamp to build submission objects.

### Pattern 4: Formula Injection Sanitization (Response Safety)
**What:** When reading data from sheets that may contain user-generated text (SPL queries, explanations), the GAS `sanitiseCell()` is NOT needed for reads — Sheets stores the data already sanitized from writes. However, any NEW writes introduced by this endpoint would need it.
**Verdict:** Phase 10 does NOT write to sheets, so `sanitiseCell()` is not needed in the read path. The existing `submitSOC` and `submitFinal` already sanitize on write. No new sanitization needed.

### Anti-Patterns to Avoid

- **Don't validate passcode after reading sheets:** Must validate FIRST (per GAS-02). Reading sheets before auth leaks timing information and wastes quota on unauthorized requests.
- **Don't add to `doGet`:** The new endpoint is a POST action in `doPost`. GET endpoints expose passcode in URL query params (visible in browser history, server logs, network tab). The existing `getSOCSubmissions` GET approach was Phase 5's choice; Phase 10 should improve on it.
- **Don't use `mode: 'no-cors'` on the client fetch:** The admin panel MUST read the JSON response. `no-cors` makes the response opaque. Use `Content-Type: text/plain` on the POST to skip CORS preflight while keeping `mode: 'cors'`.
- **Don't return raw 2D arrays:** The response must be structured JSON with named fields — not `[["row1col1","row1col2"], ...]`. The frontend (Phase 11) expects named objects.
- **Don't modify existing actions:** `register`, `submit`, `submitSOC`, `submitFinal` must remain untouched. Candidate assessment flow must not break.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CORS handling | Custom CORS proxy or server | GAS auto-applies `Access-Control-Allow-Origin: *` on all responses | Already works for existing endpoints. `Content-Type: text/plain` bypasses preflight for POST. |
| Passcode storage | Environment variables, hardcoded strings | `PropertiesService.getScriptProperties()` | Only server-side config in GAS. Already configured with `REVIEWER_PASSCODE`. |
| Sheet row parsing | Custom CSV-style parsing | `sheet.getRange().getValues()` | GAS built-in; already used in `getSOCSubmissions` pattern. |
| JSON building | String concatenation | `JSON.stringify()` | GAS V8 runtime supports standard JSON API. Already used everywhere. |

**Key insight:** GAS is a constrained runtime. Do not introduce complexity. The existing `doPost` dispatch + `PropertiesService` + `SpreadsheetApp` + `ContentService` pattern has been proven across 4 existing actions and handles everything Phase 10 needs.

## Runtime State Inventory

> Phase 10 is a greenfield endpoint addition — no rename, refactor, or migration. This section is omitted.
> Verified: No stored data, live config, OS state, secrets, or build artifacts affected by adding a new `doPost` action.

## Common Pitfalls

### Pitfall 1: CORS Preflight on JSON POST
**What goes wrong:** Frontend sends `Content-Type: application/json` POST to GAS → browser sends CORS preflight (OPTIONS) → GAS doesn't handle OPTIONS → request fails with CORS error before reaching `doPost`.
**Why it happens:** GAS web apps don't support CORS preflight. `application/json` is not a "simple" content type per the CORS spec.
**How to avoid:** Client sends `Content-Type: text/plain` header on the POST request. This is a "simple" content type that skips CORS preflight. GAS's `JSON.parse(e.postData.contents)` still works because it parses the raw request body string, not the content type header.
**Warning signs:** Browser console shows CORS error on `mode: 'cors'` POST. Network tab shows OPTIONS request with no response.

```javascript
// Client-side fetch pattern (Phase 11 will use this)
// Must use text/plain to avoid CORS preflight
const res = await fetch(LEADERBOARD_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain' },
  body: JSON.stringify({ action: 'getAdminData', passcode }),
});
const data = await res.json();
```

### Pitfall 2: Passcode in URL (GET-based approach)
**What goes wrong:** Sending passcode as URL query parameter (like existing `getSOCSubmissions` does) leaks it in browser history, server access logs, and network tab screenshots.
**Why it happens:** The existing ReviewerScreen uses GET for simplicity (no CORS issues with GET). But this is a known security smell.
**How to avoid:** Phase 10 should use POST with passcode in body. This is the correct pattern even though a previous phase used GET. The existing `getSOCSubmissions` GET endpoint can be refactored to use the shared `checkPasscode()` helper, but its GET protocol remains unchanged to avoid breaking the existing ReviewerScreen (which will be replaced in Phase 11 anyway).
**Warning signs:** Passcode visible in URL bar, DevTools Network tab query string, or server access logs.

### Pitfall 3: Quota Exhaustion from Bulk Reads
**What goes wrong:** Reading all rows from all three sheets in a single call could exhaust GAS execution time (6 min for consumer, 30 min for Workspace) or spreadsheet read quota if there are thousands of submissions.
**Why it happens:** `getValues()` on large ranges returns all data at once. For small-to-medium datasets this is efficient; for very large ones it's slow.
**How to avoid:** For the expected scale of this tool (assessment platform, not production SaaS with thousands of daily users), bulk reads are fine. The planner should note this as a future concern if submission volume grows beyond ~500 submissions (estimated ~5,000 rows across all sheets).
**Warning signs:** GAS execution log shows "Exceeded maximum execution time" error. Response takes >30 seconds.

### Pitfall 4: Empty Sheet Handling
**What goes wrong:** When sheets have only header rows (`getLastRow() < 2`), `getRange(2, 1, 0, N).getValues()` returns empty `[]` — this is safe. But `getRange(2, 1, -1, N)` would throw.
**Why it happens:** `getLastRow() - 1` can be 0 or negative with only headers.
**How to avoid:** Guard each sheet read with a `getLastRow() >= 2` check. Return empty arrays for sheets with no data rows. The existing `getSOCSubmissions` already does this (line 324-328).
**Warning signs:** "Range not found" or "The coordinates of the range are outside the dimensions of the sheet" errors.

### Pitfall 5: Missing Columns in Legacy Summary Rows
**What goes wrong:** Older Summary rows may lack columns 12 (Zone 4 SOC) and 13 (Final Score /100) if they were created before the SOC phase was deployed. Reading these columns as numbers could return empty strings.
**Why it happens:** The `ensureSheets` function creates columns 1-14, but pre-SOC rows from v1.0 will have empty cols 12-13.
**How to avoid:** Treat missing/empty score columns as 0. Use `Number(row[col]) || 0` to safely coerce empty cells.

## Response Shape Design

### `getAdminData` Response Contract

```json
{
  "ok": true,
  "candidates": [
    {
      "name": "Jane Doe",
      "email": "jane@example.com",
      "status": "Completed",
      "totalScore": 85,
      "displayScore": 92,
      "gradeBand": "Advanced",
      "submissionDate": "2026-05-26T10:30:00.000Z",
      "tabSwitches": 2,
      "zone1Score": 18,
      "zone2Score": 16,
      "zone3Score": 17,
      "zone4SocScore": 34
    }
  ],
  "rawData": [
    {
      "name": "Jane Doe",
      "email": "jane@example.com",
      "emailId": 103,
      "zone": 1,
      "selectedL1": "Phishing",
      "selectedL2": "Credential Harvesting",
      "correctL1": "Phishing",
      "correctL2": "Credential Harvesting",
      "l1Correct": true,
      "l2Correct": true,
      "cluesUsed": 1,
      "timedOut": false,
      "points": 4,
      "timestamp": "2026-05-26T10:15:00.000Z"
    }
  ],
  "socData": [
    {
      "name": "Jane Doe",
      "email": "jane@example.com",
      "questionId": "Q1",
      "score": 18,
      "grade": "Strong",
      "splText": "index=email sourcetype=exchange...",
      "explanation": "The email contained a suspicious attachment...",
      "selectedPrimary": "Phishing",
      "selectedSecondary": "Credential Harvesting",
      "proctoringViolations": 2,
      "timestamp": "2026-05-26T10:20:00.000Z"
    }
  ]
}
```

### Error Response (Invalid Passcode)
```json
{
  "ok": false,
  "error": "Invalid passcode"
}
```

### Sheet Column Mapping

**Summary sheet** (0-based index from `getValues()`):
| Index | Column | Candidate Field | Notes |
|-------|--------|-----------------|-------|
| 0 | Timestamp | `submissionDate` | ISO string |
| 1 | Name | `name` | |
| 2 | Email | `email` | Used as candidate key |
| 3 | Status | `status` | "In Progress" or "Completed" |
| 4 | Score | — | Zones 1-3 raw total |
| 5 | Display Score | `displayScore` | Normalized /100 |
| 6 | Tier | `gradeBand` | "Advanced" / "Proficient" / "Foundation" |
| 7 | Zone 1 | `zone1Score` | |
| 8 | Zone 2 | `zone2Score` | |
| 9 | Zone 3 | `zone3Score` | |
| 10 | Proctoring Violations | `tabSwitches` | |
| 11 | Zone 4 (SOC) | `zone4SocScore` | May be empty for pre-SOC rows |
| 12 | Final Score /100 | `totalScore` | May be empty for pre-SOC rows |

**RawData sheet** (0-based index):
| Index | Column | Output Field |
|-------|--------|-------------|
| 0 | Timestamp | `timestamp` |
| 1 | Name | `name` |
| 2 | Email | `email` |
| 3 | Email ID | `emailId` |
| 4 | Zone | `zone` |
| 5 | Selected L1 | `selectedL1` |
| 6 | Selected L2 | `selectedL2` |
| 7 | Correct L1 | `correctL1` |
| 8 | Correct L2 | `correctL2` |
| 9 | L1 Correct | `l1Correct` (boolean) |
| 10 | L2 Correct | `l2Correct` (boolean) |
| 11 | Clues Used | `cluesUsed` |
| 12 | Timed Out | `timedOut` (boolean) |
| 13 | Points | `points` |

**SOCData sheet** (0-based index):
| Index | Column | Output Field |
|-------|--------|-------------|
| 0 | Timestamp | `timestamp` |
| 1 | Name | `name` |
| 2 | Email | `email` |
| 3 | Question ID | `questionId` |
| 4 | Score | `score` |
| 5 | Grade | `grade` |
| 6 | SPL Text | `splText` |
| 7 | Explanation | `explanation` |
| 8 | Proctoring Violations | `proctoringViolations` |

**Note on SOCData:** Phase 5's `submitSOC` writes `selectedPrimary` and `selectedSecondary` via `submitFinal`'s `socAnswers` array, but the SOCData sheet schema (header row) only has 9 columns. The per-question `selectedPrimary`/`selectedSecondary`/`correctPrimary`/`correctSecondary` are NOT stored in SOCData sheet — they're only in the CSV attachment. The CSV is NOT accessible via GAS sheet reads. For SOCData, only the 9 stored columns are available. The `selectedPrimary` and `selectedSecondary` fields in the response contract above are aspirational — they would require a SOCData schema migration to add to the sheet. The planner should decide whether to include these or mark them for future phases.

## Code Examples

### Full `getAdminData` Implementation Pattern

```javascript
// Source: Synthesized from existing patterns in google-apps-script.js (verified in codebase)
// Add inside doPost(), after existing action cases:

if (action === 'getAdminData') {
  // 1. Validate passcode FIRST — before any sheet access
  var passcode = payload.passcode || '';
  if (!checkPasscode(passcode)) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: 'Invalid passcode' })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  var ss = getSpreadsheet();
  var sheets = ensureSheets(ss);
  var ts = new Date().toISOString();

  // 2. Read Summary sheet
  var summaryData = [];
  if (sheets.summary.getLastRow() >= 2) {
    var summaryRows = sheets.summary.getRange(
      2, 1, sheets.summary.getLastRow() - 1, 14
    ).getValues();
    summaryData = summaryRows.map(function(row) {
      return {
        name: String(row[1] || ''),
        email: String(row[2] || ''),
        status: String(row[3] || ''),
        totalScore: Number(row[13]) || 0,          // Final Score /100
        displayScore: Number(row[5]) || 0,
        gradeBand: String(row[6] || ''),
        submissionDate: String(row[0] || ''),
        tabSwitches: Number(row[10]) || 0,         // Proctoring Violations
        zone1Score: Number(row[7]) || 0,
        zone2Score: Number(row[8]) || 0,
        zone3Score: Number(row[9]) || 0,
        zone4SocScore: Number(row[11]) || 0,       // May be empty for pre-SOC rows
      };
    });
  }

  // 3. Read RawData sheet
  var rawData = [];
  if (sheets.raw.getLastRow() >= 2) {
    var rawRows = sheets.raw.getRange(
      2, 1, sheets.raw.getLastRow() - 1, 14
    ).getValues();
    rawData = rawRows.map(function(row) {
      return {
        timestamp: String(row[0] || ''),
        name: String(row[1] || ''),
        email: String(row[2] || ''),
        emailId: row[3],
        zone: Number(row[4]) || 0,
        selectedL1: String(row[5] || ''),
        selectedL2: String(row[6] || ''),
        correctL1: String(row[7] || ''),
        correctL2: String(row[8] || ''),
        l1Correct: row[9] === true,
        l2Correct: row[10] === true,
        cluesUsed: Number(row[11]) || 0,
        timedOut: row[12] === true,
        points: Number(row[13]) || 0,
      };
    });
  }

  // 4. Read SOCData sheet
  var socData = [];
  var socSheet = ss.getSheetByName('SOCData');
  if (socSheet && socSheet.getLastRow() >= 2) {
    var socRows = socSheet.getRange(
      2, 1, socSheet.getLastRow() - 1, 9
    ).getValues();
    socData = socRows.map(function(row) {
      return {
        timestamp: String(row[0] || ''),
        name: String(row[1] || ''),
        email: String(row[2] || ''),
        questionId: String(row[3] || ''),
        score: Number(row[4]) || 0,
        grade: String(row[5] || ''),
        splText: String(row[6] || ''),
        explanation: String(row[7] || ''),
        proctoringViolations: Number(row[8]) || 0,
      };
    });
  }

  // 5. Return structured JSON
  return ContentService.createTextOutput(JSON.stringify({
    ok: true,
    candidates: summaryData,
    rawData: rawData,
    socData: socData,
  })).setMimeType(ContentService.MimeType.JSON);
}
```

### Shared `checkPasscode()` Helper (Extract from existing code)

```javascript
// Source: Extracted from doGet lines 314-318, generalized for reuse
// Place outside doPost/doGet as a module-level function
function checkPasscode(passcode) {
  var correct = PropertiesService.getScriptProperties().getProperty('REVIEWER_PASSCODE');
  return !!(correct && passcode === correct);
}
```

Then refactor the existing `doGet` to use it:
```javascript
// In doGet, replace lines 314-318 with:
if (!checkPasscode(passcode)) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error: 'Invalid passcode' }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### Client-Side Fetch Pattern (Phase 11 Reference)

```javascript
// Source: Synthesized from CORS constraints documented in this research
// NOT for Phase 10 — this is for Phase 11 planner reference only
async function fetchAdminData(passcode) {
  const res = await fetch(LEADERBOARD_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },  // ← CRITICAL: avoids CORS preflight
    body: JSON.stringify({ action: 'getAdminData', passcode }),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.error || 'Failed to fetch admin data');
  }
  return data; // { candidates, rawData, socData }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `getSOCSubmissions` sends passcode in GET URL query param | `getAdminData` sends passcode in POST body | Phase 10 (new) | Passcode not visible in browser history/logs |
| Passcode validation inline in `doGet` | Extracted `checkPasscode()` helper | Phase 10 (refactor) | Shared validation, single source of truth |
| Admin data requires multiple sheet-specific endpoints | Single `getAdminData` returns all sheets | Phase 10 (new) | One fetch to load entire admin view |

**Deprecated/outdated:**
- `getSOCSubmissions` GET endpoint: Will be superseded by `getAdminData` in Phase 11 when AdminPanel replaces ReviewerScreen. Keep operational until Phase 11 complete. The `checkPasscode()` refactor is backward-compatible.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `Content-Type: text/plain` POST to GAS does not trigger CORS preflight and GAS parses the body normally | Common Pitfalls #1 | HIGH — if GAS rejects `text/plain` bodies or browser still sends preflight, admin panel can't read responses. Fallback: use GET with passcode in URL (matches existing pattern, less secure). |
| A2 | The existing `REVIEWER_PASSCODE` in PropertiesService is the correct passcode for admin access | Passcode Validation | LOW — same passcode already used for `getSOCSubmissions`. If wrong, GAS admin sets it manually. |
| A3 | Submission volume is <500 candidates (est. <15,000 total sheet rows) | Pitfall #3 | MEDIUM — larger datasets may hit GAS 6-min execution limit. Mitigation: pagination or per-candidate endpoints deferred to v1.3. |
| A4 | All Summary rows have consistent column count (14 cols) | Pitfall #5 | LOW — `ensureSheets` has always created 14 cols. Only v1.0 pre-SOC rows may have fewer, handled by `|| 0` coercion. |
| A5 | SOCData contains all relevant proctoring data in column 9 | SOCData schema | LOW — verified from `submitSOC` lines 131-143 and `submitFinal` lines 183-195. The column is populated on first question row only. |
| A6 | `selectedPrimary`/`selectedSecondary`/`correctPrimary`/`correctSecondary` are NOT stored in SOCData sheet (only in CSV attachment) | Response Shape | HIGH — if planner expects these fields in `socData[]`, they must either add columns to SOCData schema or accept their absence. See Note in Response Shape section. |

## Open Questions

1. **Should `getAdminData` also serve per-soc-question classification metadata?**
   - What we know: `selectedPrimary`/`selectedSecondary`/`correctPrimary`/`correctSecondary` are in the CSV attachment but NOT in the SOCData sheet. The SOCData sheet only has: Timestamp, Name, Email, Question ID, Score, Grade, SPL Text, Explanation, Proctoring Violations.
   - What's unclear: Whether Phase 13 (Answer Sheet drill-down) needs this data for SOC answer display.
   - Recommendation: Phase 10 returns what's actually in the sheet. If Phase 13 needs classification metadata, a prior phase should migrate the SOCData schema to add those columns. Or Phase 13 can reconstruct correct answers from `socQuestions.js` (already in the client bundle).

2. **Should the response include only "Completed" candidates or all rows?**
   - What we know: Summary sheet has both "In Progress" and "Completed" rows. A candidate who refreshes mid-game may have a stale "In Progress" row.
   - What's unclear: Whether the admin panel should show incomplete candidates.
   - Recommendation: Return all rows. Let the frontend (Phase 12) filter by status. Server-side filtering is premature.

3. **GAS execution timeout risk for large datasets?**
   - What we know: GAS consumer accounts have 6 min execution limit. Reading all sheets in one call is efficient for small data but scales linearly with row count.
   - What's unclear: Expected submission volume. This is an internal assessment tool, not a public SaaS.
   - Recommendation: No pagination for v1.2. If `getValues()` calls error with timeout, the error message will be in the response. Defer pagination to v1.3 if needed.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Google Apps Script deployment | All server-side execution | ✓ | Deployed (URL in src/config.js) | — |
| Google Sheets (Summary, RawData, SOCData) | Data source | ✓ | Already populated from v1.0-v1.1 | — |
| PropertiesService `REVIEWER_PASSCODE` | Passcode validation | ✓ | Already configured | Manual setup in GAS console |
| Node.js / npm | GAS file editing only | ✓ | 22+ (local) | — |

**Missing dependencies:** None. All infrastructure already deployed and operational from v1.1.

## Validation Architecture

> nyquist_validation is enabled in .planning/config.json

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.7 |
| Config file | `vitest.config.js` |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GAS-01 | `getAdminData` reads all 3 sheets and returns structured JSON | Manual (curl/GAS deploy) | Cannot be automated — GAS has no local test runner | ❌ Manual only |
| GAS-02 | `checkPasscode()` validates via PropertiesService, rejects wrong passcode | Manual (curl) | `curl -X POST <URL> -H 'Content-Type: text/plain' -d '{"action":"getAdminData","passcode":"wrong"}'` | ❌ Manual only |
| GAS-03 | Response contains `candidates`, `rawData`, `socData` arrays with correct shape | Manual (curl) | `curl ... \| python3 -c "import sys,json;d=json.load(sys.stdin);assert 'candidates' in d;print('OK')"` | ❌ Manual only |
| — | `checkPasscode()` helper function (unit-testable logic) | unit | `npx vitest run` (if test file created) | ❌ Wave 0 |
| — | Existing GAS actions (`register`, `submit`, `submitSOC`, `submitFinal`) unchanged | regression | Manual GAS deploy + playthrough | ❌ Manual only |

### Sampling Rate

- **Per task commit:** Manual curl test against deployed GAS endpoint (cannot run locally)
- **Per wave merge:** Full manual test: wrong passcode → error, correct passcode → all 3 arrays returned
- **Phase gate:** All three success criteria verified manually via curl

### Wave 0 Gaps

- [ ] No GAS test framework exists (Google Apps Script has no local test runner)
- [ ] No Vitest tests for `checkPasscode()` — could be written as a pure function test if the logic is extracted to a testable module, but GAS functions depend on `PropertiesService` which only exists in GAS runtime
- [ ] `tests/` directory has no GAS-related test files — existing tests cover `validateSpl` and `scoreSoc` only

*(GAS server-side code is inherently manual-test-only. The planner should include a manual verification checklist in PLAN.md.)*

## Security Domain

> security_enforcement is implicitly enabled (not explicitly false in config)

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | Passcode validated server-side via `PropertiesService.getScriptProperties()` — no client-side secret. String comparison, single shared credential. |
| V3 Session Management | No | No sessions — stateless passcode per request. Each POST validates independently. |
| V4 Access Control | Yes | Passcode check gates ALL sheet read operations. Passcode validated BEFORE any data access (fail-fast). Wrong passcode returns error without touching sheets. |
| V5 Input Validation | Yes | Passcode validated for empty/missing. Action string checked. Sheet cell values type-coerced with `Number()` and `String()` guards. |
| V6 Cryptography | No | No cryptographic operations. Passcode is a plaintext shared secret (appropriate for internal assessment tool). |

### Known Threat Patterns for Google Apps Script

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Passcode brute-force via repeated POST | Denial of Service | GAS has built-in rate limiting per-user. No additional mitigation needed at current scale. Consider adding attempt logging if abuse observed. |
| Passcode exposure via URL query param | Information Disclosure | `getAdminData` uses POST with passcode in body (not GET URL). Existing `getSOCSubmissions` GET endpoint still exposes passcode in URL — Phase 11 replaces this. |
| Formula injection via sheet cell data | Tampering | NOT a read-path concern. Write-path protection (`sanitiseCell()`) already applied on `submitSOC`/`submitFinal`. Read data is as-stored. |
| JSON injection via manipulated POST body | Tampering | `JSON.parse()` validates syntactic correctness. Malformed JSON → GAS throws → caught by outer try/catch → returns `{ ok: false, error: err.message }`. No injection surface. |
| Sensitive data exposure in responses | Information Disclosure | Entire dataset returned to authenticated admin. This is by design — admin needs full data. Mitigation: passcode gate ensures only authorized viewers. |
| Timing side-channel on passcode validation | Information Disclosure | String comparison is constant-time-ish in practice for short strings in V8. Not a realistic threat at this security level (shared passcode, internal tool). |

### Risks Specific to Phase 10

1. **Passcode is shared, not per-user:** No audit trail of who accessed admin data. Acceptable risk for internal assessment tool per project constraints (CLAUDE.md: "Reviewer access is a shared passcode only — no identity provider").
2. **All-or-nothing data access:** Any passcode holder can see ALL candidate data across all zones. No row-level filtering. Acceptable — admin view is comprehensive by design.
3. **PropertiesService passcode is set once in GAS console:** If lost, requires GAS console access to view/reset. No self-service password reset. Acceptable — operational concern, not security flaw.

## Sources

### Primary (HIGH confidence — verified in codebase)
- `google-apps-script.js` (664 lines) — Full GAS backend analyzed: `doPost` dispatch, `doGet` endpoints, `sanitiseCell`, `ensureSheets`, `ensureSOCSheet`, `findRowByEmail`, `checkPasscode` pattern, `buildResultsHtml`, `csvEscape`
- `src/components/ReviewerScreen.jsx` (194 lines) — GET fetch pattern for `getSOCSubmissions`, passcode UI, submission rendering
- `src/hooks/useLeaderboard.js` (43 lines) — `no-cors` POST pattern, `LEADERBOARD_URL` usage
- `src/hooks/useGameState.js` (182 lines) — `submitToSheet` pattern, `SCREENS` enum, `REVIEWER` screen routing
- `src/hooks/useSocState.js` (198 lines) — `submitFinal` pattern, `sessionStorage` failover
- `src/hooks/useProctoring.js` (73 lines) — Tab-switch detection mechanism
- `src/config.js` (2 lines) — `LEADERBOARD_URL` constant
- `src/App.jsx` lines 70-149 — How `submitToSheet` and `submitFinal` are wired in the orchestrator

### Secondary (MEDIUM confidence — external docs + codebase cross-reference)
- Google Apps Script reference: `ContentService`, `SpreadsheetApp`, `PropertiesService` are built-in GAS APIs — behavior confirmed by existing codebase usage patterns
- CORS specification: "Simple" requests and preflight rules — applied to GAS web app behavior observed in existing fetch patterns (`no-cors` on POST, `cors` on GET)

### Tertiary (LOW confidence — unverified assumptions)
- Assumption A1: `text/plain` POST with JSON body works correctly on GAS `doPost` — not empirically tested in this session. Verified by GAS documentation pattern but not end-to-end against the deployed web app.
- Assumption A6: `selectedPrimary`/`selectedSecondary` columns absent from SOCData — verified from code analysis but the sheet itself was not queried live.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies are built-in GAS APIs; zero external packages; pattern verified against 4 existing action implementations
- Architecture: HIGH — single-endpoint POST action within existing `doPost` dispatch; no new architectural patterns needed
- Pitfalls: MEDIUM — CORS pitfall is well-understood but the `text/plain` workaround is assumed (A1); need empirical validation on deploy
- Sheet schemas: HIGH — all 3 sheet schemas verified from `ensureSheets()`, `ensureSOCSheet()`, and write-path code

**Research date:** 2026-05-26
**Valid until:** 2026-06-26 (30 days — GAS APIs are stable, schemas are locked by existing code)

**Caveat:** This research was performed without a live GAS deployment to test against. The CORS `text/plain` workaround (A1) and the exact behavior of `getRange().getValues()` on the deployed sheet should be validated during execution. If the `text/plain` approach fails, fall back to a GET-based endpoint (like `getSOCSubmissions`) with the passcode in the URL query parameter.
