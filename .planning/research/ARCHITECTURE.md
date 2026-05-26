# Architecture Patterns — v1.2 Admin Panel

**Domain:** Admin panel replacing the existing reviewer screen in a React 19 SPA
**Researched:** 2026-05-26
**Confidence:** HIGH — based on direct inspection of all relevant source files

---

## Current As-Built State

The existing reviewer screen (`ReviewerScreen.jsx`) is a minimal passcode-gated table that
reads only from the `SOCData` sheet via `GET ?action=getSOCSubmissions`. It has no knowledge
of classification data (Zones 1–3), no dashboard, no search/filter, no export. The admin
panel replaces this screen entirely.

The SCREENS enum already contains `REVIEWER`. The entry point is a fixed button in the
landing screen that calls `gs.setScreen(SCREENS.REVIEWER)`. That wiring stays unchanged;
only the screen component it renders is replaced.

### What the Sheets Contain Today

Three sheets exist and are written by the existing GAS script:

| Sheet | Written by | Columns |
|-------|-----------|---------|
| `Summary` | `register` + `submit` + `submitFinal` | Timestamp, Name, Email, Status, Score, Display Score, Tier, Zone 1, Zone 2, Zone 3, Proctoring Violations, Zone 4 (SOC), Final Score /100 |
| `RawData` | `submit` | Timestamp, Name, Email, Email ID, Zone, Selected L1, Selected L2, Correct L1, Correct L2, L1 Correct, L2 Correct, Clues Used, Timed Out, Points |
| `SOCData` | `submitSOC` + `submitFinal` | Timestamp, Name, Email, Question ID, Score, Grade, SPL Text, Explanation, Proctoring Violations |

The `Summary` sheet is the primary source for per-candidate aggregate scores and tier data.
`RawData` has per-email classification records needed for answer sheet drill-downs.
`SOCData` has per-question SPL + explanation text needed for SOC answer sheets.

---

## Recommended Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          App.jsx (shell)                             │
│  gs = useGameState()                                                 │
│  ...existing hooks unchanged...                                      │
│                                                                      │
│  SCREENS.REVIEWER → <AdminPanel passcode="" onBack={...} />          │
│  (replaces <ReviewerScreen> import and render)                       │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    AdminPanel.jsx (screen)                            │
│  Passcode gate (local state) → authenticated sub-views               │
│                                                                      │
│  Sub-views (tab or section):                                         │
│    AdminDashboard.jsx    — aggregate stats, grade bands, pass/fail   │
│    AdminCandidateList.jsx — search/filter candidate table            │
│    AdminAnswerSheet.jsx  — per-candidate drill-down (all zones)      │
│    AdminExportBar.jsx    — CSV download button + PDF trigger         │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    useAdmin hook                                      │
│  Owns: passcode auth state, all data fetches, view routing,          │
│        search/filter state, export trigger                           │
│  Fetches from:                                                       │
│    GET ?action=getAdminData&passcode=...                             │
│        → { summary[], rawData[], socData[] }                         │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Google Apps Script                                 │
│  NEW: GET ?action=getAdminData&passcode=...                          │
│    Reads Summary, RawData, SOCData sheets                            │
│    Groups rows into per-candidate objects                            │
│    Returns { ok: true, candidates: [...], rawData: [...],            │
│              socData: [...] }                                        │
│                                                                      │
│  Existing actions unchanged:                                         │
│    POST register | submit | submitSOC | submitFinal                  │
│    GET  checkEmail | getSOCSubmissions (keep for backward compat)    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Inventory

### New Components

| Component | File | Responsibility |
|-----------|------|---------------|
| `AdminPanel` | `src/components/AdminPanel.jsx` | Replaces `ReviewerScreen`. Passcode gate wrapper. Mounts `useAdmin` and distributes state to sub-views. Owns tab/view switching. Renders `AdminDashboard`, `AdminCandidateList`, `AdminAnswerSheet`, `AdminExportBar`. |
| `AdminDashboard` | `src/components/AdminDashboard.jsx` | Score overview: total submissions count, average final score, grade band distribution bars (Foundation / Proficient / Advanced), pass rate. Reads from `useAdmin.candidates`. |
| `AdminCandidateList` | `src/components/AdminCandidateList.jsx` | Searchable, filterable table of all candidates. Columns: Name, Email, Date, Zone 1-3 Scores, SOC Score, Final Score, Tier. Row click navigates to answer sheet for that candidate. |
| `AdminAnswerSheet` | `src/components/AdminAnswerSheet.jsx` | Full drill-down for one candidate. Classification zone section (per-email L1/L2 selections and correct answers from `rawData`). SOC section (per-question SPL text, explanation, score, grade from `socData`). |
| `AdminExportBar` | `src/components/AdminExportBar.jsx` | CSV export button (client-side, no server call). PDF export button (uses `window.print()` with print-specific CSS). Receives formatted data arrays from `useAdmin`. |

### Modified Files

| File | Change | Why |
|------|--------|-----|
| `src/App.jsx` | Replace `ReviewerScreen` import with `AdminPanel`. Replace `<ReviewerScreen onBack={...} />` render with `<AdminPanel onBack={...} />`. | One-line swap; the `SCREENS.REVIEWER` entry point and `gs.setScreen` wiring are unchanged. |
| `google-apps-script.js` | Add `getAdminData` GET action. Reads all three sheets; returns grouped per-candidate JSON. Add `getCandidateDetail` GET action for deep drill-down if payload is too large for single call. | New read-only endpoint. No writes. Passcode-gated via `PropertiesService` (same `REVIEWER_PASSCODE` property as today). |

### Deprecated/Removed

| File | Disposition |
|------|------------|
| `src/components/ReviewerScreen.jsx` | Delete when `AdminPanel` is complete. Keep until then for reference. |

---

## New Hook: useAdmin

**Do not extend `useLeaderboard`.** `useLeaderboard` handles anonymous leaderboard POST/GET.
`useAdmin` handles passcode-authenticated reads across three sheets with internal view
routing. These are different concerns at different auth levels. Mixing them would break the
separation between public game flow and gated admin flow.

```js
// src/hooks/useAdmin.js (new file)

export function useAdmin() {
  const [authed, setAuthed] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Data from GAS
  const [candidates, setCandidates] = useState([]);   // from Summary sheet
  const [rawData, setRawData] = useState([]);          // from RawData sheet
  const [socData, setSocData] = useState([]);          // from SOCData sheet

  // View routing within the panel (no SCREENS enum — local to admin)
  const [view, setView] = useState('dashboard');       // 'dashboard' | 'candidates' | 'detail'
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Search/filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState('all'); // 'all' | 'Foundation' | 'Proficient' | 'Advanced'

  async function authenticate(passcodeInput) { ... }

  function selectCandidate(candidateKey) { ... }

  function clearSelection() { ... }

  // Derived: filtered candidate list
  const filteredCandidates = useMemo(() => { ... }, [candidates, searchQuery, filterTier]);

  // Derived: records for selected candidate
  const selectedRawData = useMemo(() => { ... }, [rawData, selectedCandidate]);
  const selectedSocData = useMemo(() => { ... }, [socData, selectedCandidate]);

  return {
    authed, passcode, setPasscode, loading, error,
    candidates, rawData, socData,
    view, setView,
    selectedCandidate, selectCandidate, clearSelection,
    searchQuery, setSearchQuery, filterTier, setFilterTier,
    filteredCandidates, selectedRawData, selectedSocData,
  };
}
```

**Key design decisions:**
- `view` is local admin state — not a SCREENS enum entry. Adding `ADMIN_DASHBOARD`,
  `ADMIN_CANDIDATES`, `ADMIN_DETAIL` to `useGameState.SCREENS` would pollute the game
  state machine with admin sub-views and make zone 1-3 logic defensive.
- Authentication is local `useState` (`authed` boolean) — not a context. `AdminPanel` is
  the only consumer. No cross-component auth context is needed.
- Data is fetched once on successful auth, then filtered client-side. No pagination fetch
  loop needed at this scale (assessment cohorts are dozens to low hundreds of candidates).

---

## New GAS Endpoint: getAdminData

Add to `doGet` in `google-apps-script.js`:

```js
if (e.parameter.action === 'getAdminData') {
  var passcode = e.parameter.passcode || '';
  var correct = PropertiesService.getScriptProperties().getProperty('REVIEWER_PASSCODE');
  if (!correct || passcode !== correct) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: 'Invalid passcode' })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  var ss = getSpreadsheet();
  var sheets = ensureSheets(ss);

  // Read Summary (candidates)
  var candidates = [];
  if (sheets.summary.getLastRow() >= 2) {
    var summaryData = sheets.summary.getRange(2, 1, sheets.summary.getLastRow() - 1, 13).getValues();
    for (var i = 0; i < summaryData.length; i++) {
      var r = summaryData[i];
      candidates.push({
        timestamp: r[0], name: r[1], email: r[2], status: r[3],
        score: r[4], displayScore: r[5], tier: r[6],
        zone1: r[7], zone2: r[8], zone3: r[9],
        proctoringViolations: r[10], socScore: r[11], finalScore: r[12],
      });
    }
  }

  // Read RawData (per-email classification records)
  var rawData = [];
  if (sheets.raw.getLastRow() >= 2) {
    var rawRows = sheets.raw.getRange(2, 1, sheets.raw.getLastRow() - 1, 14).getValues();
    for (var j = 0; j < rawRows.length; j++) {
      var rr = rawRows[j];
      rawData.push({
        timestamp: rr[0], name: rr[1], email: rr[2], emailId: rr[3],
        zone: rr[4], selectedL1: rr[5], selectedL2: rr[6],
        correctL1: rr[7], correctL2: rr[8],
        l1Correct: rr[9], l2Correct: rr[10],
        cluesUsed: rr[11], timedOut: rr[12], points: rr[13],
      });
    }
  }

  // Read SOCData
  var socData = [];
  var soc = ss.getSheetByName('SOCData');
  if (soc && soc.getLastRow() >= 2) {
    var socRows = soc.getRange(2, 1, soc.getLastRow() - 1, 9).getValues();
    for (var k = 0; k < socRows.length; k++) {
      var sr = socRows[k];
      socData.push({
        timestamp: sr[0], name: sr[1], email: sr[2], questionId: sr[3],
        score: sr[4], grade: sr[5], splText: sr[6],
        explanation: sr[7], proctoringViolations: sr[8],
      });
    }
  }

  return ContentService.createTextOutput(
    JSON.stringify({ ok: true, candidates: candidates, rawData: rawData, socData: socData })
  ).setMimeType(ContentService.MimeType.JSON);
}
```

**Why a single endpoint instead of three separate calls:**
- GAS has no parallel fetch capability from the client side when using `no-cors`.
  However, `getAdminData` uses full CORS (same as `getSOCSubmissions`) because it's a
  simple GET with no custom headers — GAS responds with `Access-Control-Allow-Origin: *`.
  A single round-trip is simpler and faster than three sequential fetches.
- If payload size becomes a concern (very large cohorts), the endpoint can be split into
  `getSummary`, `getRawData`, `getSocData` later without changing the React hook interface
  (just split the single `authenticate()` call into three awaited fetches internally).

**Passcode reuse:** The same `REVIEWER_PASSCODE` `PropertiesService` property is reused.
No new GAS property needs to be configured.

---

## Data Flow: Sheets → GAS → React Admin Views

```
Admin navigates to landing screen
    ↓
Clicks "Reviewer" button (bottom-right, fixed position)
    ↓
App.jsx: gs.setScreen(SCREENS.REVIEWER)
    ↓
AdminPanel.jsx renders (replaces ReviewerScreen)
    ↓
Passcode gate: useAdmin.authed === false
    → Passcode input form rendered
    → User enters passcode → clicks "Access admin"
    ↓
useAdmin.authenticate(passcode)
    → GET ${LEADERBOARD_URL}?action=getAdminData&passcode=...
    → GAS doGet reads Summary (13 cols), RawData (14 cols), SOCData (9 cols)
    → Returns { ok: true, candidates: [...], rawData: [...], socData: [...] }
    → setCandidates([...]), setRawData([...]), setSocData([...])
    → setAuthed(true)
    ↓
AdminPanel renders authenticated view
    ├── AdminDashboard (view === 'dashboard')
    │     reads: useAdmin.candidates
    │     computes: total count, avg finalScore, tier distribution, pass rate
    │
    ├── AdminCandidateList (view === 'candidates')
    │     reads: useAdmin.filteredCandidates (candidates filtered by searchQuery + filterTier)
    │     action: row click → useAdmin.selectCandidate(email+timestamp key) → view = 'detail'
    │
    └── AdminAnswerSheet (view === 'detail')
          reads: useAdmin.selectedCandidate (from candidates)
                 useAdmin.selectedRawData (rawData filtered by candidate email)
                 useAdmin.selectedSocData (socData filtered by candidate email)
          back button → useAdmin.clearSelection() → view = 'candidates'
```

**Client-side filtering:** After the single auth fetch, all search/filter/sort operations
run in React with `useMemo`. No re-fetch on filter change. This is correct for the expected
scale (dozens to low hundreds of records).

---

## Export Architecture

### CSV Export (client-side, no server call)

Build a CSV string in the browser from `useAdmin.candidates` + `useAdmin.socData`.
Create a `Blob` with `type: 'text/csv'`, use `URL.createObjectURL()`, programmatically
click a hidden `<a download="...">` link.

```js
// src/utils/exportCsv.js (new utility file)
export function downloadCsv(rows, filename) {
  const header = Object.keys(rows[0]).join(',');
  const body = rows.map(r =>
    Object.values(r).map(v => {
      const s = String(v == null ? '' : v);
      return (s.includes(',') || s.includes('"') || s.includes('\n'))
        ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(',')
  ).join('\r\n');
  const blob = new Blob([header + '\r\n' + body], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
```

No new npm library needed. `papaparse` is already installed for CSV parsing but is not
needed for generation — the above 15-line utility is sufficient.

### PDF Export (window.print + print CSS)

Use `window.print()` scoped to the admin panel with a `@media print` stylesheet that:
- Hides the game background, navigation buttons, and tab bar
- Renders the currently visible admin view (dashboard or answer sheet) as a clean document
- Sizes the content to A4

This avoids adding `jspdf` (~500 KB), `html2canvas` (~80 KB), or `puppeteer` (Node-only).
The `window.print()` approach is zero-library, works in all browsers, and produces
printable-to-PDF output via the browser's native print dialog.

**Limitation:** The user must trigger "Save as PDF" in the browser's print dialog.
This is acceptable given the "no new npm dependencies" constraint and the low frequency
of report generation in an assessment tool.

---

## Component Boundaries

### AdminPanel.jsx — Screen Shell

```
Props: onBack: func (→ gs.setScreen(SCREENS.LANDING))
Owns: useAdmin() hook call
State delegated to: useAdmin

Render:
  if !authed → passcode form (same visual style as current ReviewerScreen passcode gate)
  if authed:
    → header bar with back button + "Admin Panel" title + tab strip
    → {view === 'dashboard'} → <AdminDashboard candidates={filteredCandidates} />
    → {view === 'candidates'} → <AdminCandidateList .../>
    → {view === 'detail'} → <AdminAnswerSheet .../>
    → <AdminExportBar .../>
```

### AdminDashboard.jsx — Stats View

```
Props: candidates: array
Computes (locally, not in hook):
  - totalCount = candidates.length
  - completed = candidates.filter(c => c.status === 'Completed').length
  - avgFinal = mean(candidates.map(c => c.finalScore))
  - tierCounts = { Foundation: N, Proficient: N, Advanced: N }
  - passRate = (candidates.filter(c => c.finalScore >= 50).length / completed) * 100

Renders:
  - Stat cards (Total, Completed, Avg Score, Pass Rate)
  - Grade band distribution bar chart (CSS, no charting library)
  - Zone average scores (Zone 1 avg, Zone 2 avg, Zone 3 avg, SOC avg)
```

No charting library. Grade band bars are CSS `width` percentages on `div` elements — the
same pattern used in `ResultsScreen.jsx` and the email template. This keeps the zero-new-
dependencies constraint while producing readable visualizations.

### AdminCandidateList.jsx — Table View

```
Props:
  candidates: array (already filtered by useAdmin)
  searchQuery: string
  onSearchChange: func
  filterTier: string
  onFilterChange: func
  onSelectCandidate: func

Renders:
  - Search input (free text, filters by name or email)
  - Tier filter buttons (All / Foundation / Proficient / Advanced)
  - Sortable table: Name, Email, Date, Zone1, Zone2, Zone3, SOC, Final, Tier
  - Each row: click → onSelectCandidate(candidateKey)
```

Sort state (column + direction) lives as local `useState` in `AdminCandidateList` — it is
a presentation concern, not something `useAdmin` needs to know about.

### AdminAnswerSheet.jsx — Drill-down View

```
Props:
  candidate: object (from Summary)
  rawData: array (RawData rows for this candidate)
  socData: array (SOCData rows for this candidate)
  onBack: func

Renders:
  Section 1 — Candidate Header: name, email, timestamp, final score, tier
  Section 2 — Classification (Zones 1–3):
    Table of rawData rows grouped by zone:
    Email ID | Zone | Selected L1 | Correct L1 | Selected L2 | Correct L2 | Points
  Section 3 — SOC Investigation (Zone 4):
    For each socData row (per question):
      Question ID | Score | Grade
      SPL Query (monospace pre block)
      Explanation (paragraph block)
  Section 4 — Score Summary: zone breakdowns, SOC scaled, final /100
```

### AdminExportBar.jsx — Export Controls

```
Props:
  candidates: array (all or filtered)
  selectedCandidate: object | null
  selectedRawData: array
  selectedSocData: array
  view: string

Renders:
  - "Export all CSV" button → downloadCsv(candidates, 'flagmail_candidates.csv')
  - "Export SOC data CSV" button → downloadCsv(socData, 'flagmail_soc.csv')
  - "Print / PDF" button → window.print() (only visible in 'detail' view)
```

---

## Print / PDF CSS Strategy

Add a `@media print` block to `src/index.css` (or a new `src/styles/print.css` imported
only by `AdminPanel.jsx`):

```css
@media print {
  /* Hide everything except admin content */
  body > #root > div > *:not(.admin-print-target) { display: none !important; }
  .admin-print-target { display: block !important; }

  /* Remove glass backgrounds, show clean document styling */
  .admin-print-target * {
    background: white !important;
    color: black !important;
    box-shadow: none !important;
  }

  /* Page breaks between candidates (if bulk printing) */
  .admin-candidate-page { page-break-after: always; }
}
```

Assign `className="admin-print-target"` to the `AdminAnswerSheet` wrapper div.

---

## Suggested Build Order

Build order follows data → fetch → hook → components → export dependency chain:

### Step 1: GAS endpoint (data layer)

Add `getAdminData` action to `google-apps-script.js`. Deploy. Test with `curl` or browser.
Verify all three sheets are returned correctly grouped. This unblocks all React work.

**Why first:** All downstream React code depends on the data shape the endpoint returns.
Defining the response contract before writing the hook prevents shape mismatches.

### Step 2: useAdmin hook (state layer)

Build `src/hooks/useAdmin.js` with passcode auth, single fetch, and all derived state.
Write against the real GAS endpoint from Step 1. Verify `candidates`, `rawData`,
`socData` are populated correctly before building any component.

**Why second:** Components are props-driven; they can only be built once the hook API is
stable. Hook API is stable once the GAS response shape is confirmed.

### Step 3: AdminPanel.jsx + passcode gate (screen shell)

Build the authenticated shell with tab navigation and the passcode gate.
Connect to `useAdmin`. At this point, mount empty placeholder divs for sub-views.
Verify the screen swap in App.jsx works (`ReviewerScreen` → `AdminPanel`).

**Why third:** Establishes the screen boundary and the `useAdmin` prop distribution
pattern that all sub-components will follow.

### Step 4: AdminCandidateList.jsx (core view)

The candidate list is the most-used view and exercises the search/filter/sort logic.
Build this before the dashboard so data rendering is confirmed before aggregate stats.

### Step 5: AdminDashboard.jsx (aggregate stats)

Dashboard reads from the same `candidates` array as the list. By Step 5, the data is
confirmed correct. Dashboard adds derived calculations (means, distributions) on top.

### Step 6: AdminAnswerSheet.jsx (drill-down)

Deepest view; requires both `rawData` and `socData` joins. Build last among views so
the data plumbing is fully trusted before the most complex rendering is attempted.

### Step 7: exportCsv.js + AdminExportBar.jsx (export)

Export is a feature layer on top of existing data; it does not block any other view.
Build last. CSV is simpler and should ship before PDF.

### Step 8: Print CSS for PDF (polish)

Add `@media print` styles. Test in Chrome and Firefox. Ship as the final step.

---

## Integration Points With Existing Architecture

| Boundary | How Admin Panel Integrates | Risk |
|----------|---------------------------|------|
| `App.jsx` → `AdminPanel` | Replace `ReviewerScreen` import and conditional render. Prop interface is identical: `onBack` function. | LOW — one-line import swap + one render replacement |
| `SCREENS.REVIEWER` in `useGameState` | Unchanged. `REVIEWER` screen value maps to `AdminPanel` now. No new SCREENS entries needed. | NONE |
| GAS passcode validation | `AdminPanel` uses same `REVIEWER_PASSCODE` PropertiesService property. No new GAS properties. | NONE |
| `useLeaderboard` | Not touched. `useAdmin` is a separate hook for authenticated reads. | NONE |
| Zone 1–3 game flow | Not touched. Admin panel is a side-path from LANDING only, same as reviewer was. | NONE |
| `src/config.js` `LEADERBOARD_URL` | `useAdmin` uses same `LEADERBOARD_URL` for the new `getAdminData` GET. No new URL constant. | NONE |

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Adding Admin Sub-Views to the SCREENS Enum

**What happens:** Adds `ADMIN_DASHBOARD`, `ADMIN_CANDIDATES`, `ADMIN_DETAIL` to
`useGameState.SCREENS` so navigation uses the main state machine.

**Why it is wrong:** The main SCREENS machine governs the player game flow. Admin sub-view
navigation is an internal concern of the admin panel only. Adding admin screens to SCREENS
makes `useGameState` aware of admin state, forces defensive checks in game transitions
(e.g., `advanceZone` must skip if on an admin screen), and couples two unrelated
navigation concerns.

**Do this instead:** Track `view` as local `useState('dashboard')` inside `useAdmin`.
Admin view transitions are `setView('detail')` calls, not `gs.setScreen()` calls.

### Anti-Pattern 2: Extending useLeaderboard for Admin Reads

**What happens:** Adds `fetchAdminData(passcode)` to the `useLeaderboard` hook.

**Why it is wrong:** `useLeaderboard` is used by game flow (submit score, fetch public
leaderboard). Admin reads are passcode-gated and return sensitive per-candidate data.
Merging them means the public leaderboard hook holds sensitive auth state, and refactoring
one path risks breaking the other.

**Do this instead:** New `useAdmin` hook. Zero shared state with `useLeaderboard`.

### Anti-Pattern 3: Multiple GAS Fetch Calls on Authentication

**What happens:** `useAdmin.authenticate()` fires three separate GAS GET calls
(one for Summary, one for RawData, one for SOCData) to avoid a large payload.

**Why it is wrong:** GAS web apps respond with CORS headers on simple GET requests, but
each fetch is a separate network round-trip. Three sequential calls triple latency for
the admin user on auth. GAS execution time also counts against quotas.

**Do this instead:** Single `getAdminData` endpoint that reads all three sheets in one
GAS execution and returns them in one JSON payload. If the payload ever becomes too large
(thousands of candidates), add a date-range query param to GAS and filter before returning.

### Anti-Pattern 4: Server-side PDF Generation

**What happens:** Adding a `generatePDF` GAS action or a Node backend endpoint that uses
`puppeteer` / `wkhtmltopdf` to generate PDFs server-side.

**Why it is wrong:** Violates the "no new backend service" constraint. GAS has no HTML
rendering capability. Adding a separate PDF generation service is disproportionate for
an assessment tool used by dozens of candidates.

**Do this instead:** `window.print()` with `@media print` CSS. The admin can print to PDF
from the browser's native print dialog. This is zero-library, always available, and
produces acceptable report quality.

### Anti-Pattern 5: Storing Passcode in React State Outside useAdmin

**What happens:** The raw passcode string is stored in `App.jsx` state and passed as a
prop to `AdminPanel` so it can be reused across re-renders.

**Why it is wrong:** Passcode should not be held at the App level — it leaks beyond the
admin boundary. The existing `ReviewerScreen` correctly scoped passcode to local component
state. `useAdmin` is the correct home.

**Do this instead:** Keep passcode in `useAdmin`. After successful authentication, the
hook stores `authed: true` and discards or keeps the passcode string only within the hook.
App.jsx passes only `onBack` to `AdminPanel`; it does not know whether the admin is authed.

---

## Scalability Note

The architecture above is appropriate for cohorts of 10–300 candidates (the expected scale
of a single assessment session). For larger scales:

| Scale concern | Current approach | When to revisit |
|---------------|-----------------|-----------------|
| GAS payload size | All rows returned in one response | >500 candidates: add date-range param |
| Client-side filtering | `useMemo` over `candidates` array | >1000 rows: debounce search input |
| CSV export | In-memory Blob | >5000 rows: stream write via WritableStream |
| GAS execution timeout | 6 sec GAS limit | >2000 rows: paginate with offset param |

None of these limits are expected to be hit in v1.2. Document them here so the next
milestone that grows the dataset knows where the boundaries are.

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| Existing screen state machine integration | HIGH | Direct inspection of `useGameState.js`, `App.jsx`, `SCREENS` enum — all integration points confirmed |
| GAS sheet schemas | HIGH | Direct inspection of `google-apps-script.js` `ensureSheets` and `ensureSOCSheet` — all column positions verified |
| `getAdminData` endpoint design | HIGH | Same pattern as existing `getSOCSubmissions`; passcode validation, JSON return, CORS handling are identical patterns |
| `useAdmin` hook design | HIGH | Standard React `useState`/`useMemo` pattern; same shape as `useLeaderboard` + local view routing |
| CSV export without library | HIGH | `URL.createObjectURL` + hidden anchor is a well-established browser pattern; no library needed |
| PDF via `window.print()` | MEDIUM | `window.print()` is standard but `@media print` CSS requires testing across browsers; print layout may need iteration |
| Component decomposition | HIGH | Sub-views map 1:1 to features listed in REQUIREMENTS.md; boundaries are clean |

---

*Architecture research for: FlagMail v1.2 Admin Panel*
*Researched: 2026-05-26*
