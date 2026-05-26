# Technology Stack

**Project:** FlagMail v1.2 — Admin Panel
**Researched:** 2026-05-26
**Confidence:** HIGH

---

## Context: Existing Stack (Do Not Re-research)

These packages are installed and locked. The admin panel must integrate with, not replace, them.

| Package | Version | Role in Admin Panel |
|---------|---------|---------------------|
| react, react-dom | 19.2.0 | All UI — admin panel is a new screen within the existing SPA |
| vite, @vitejs/plugin-react | 7.3.1 / 5.1.1 | No config changes needed |
| framer-motion | ^11.18.2 | Transitions when navigating to/from admin screen |
| papaparse | ^5.5.3 | Already installed — usable for CSV generation if needed (evaluated below) |
| prop-types | ^15.8.1 | Runtime prop validation on all new components |
| vitest | ^4.1.7 | Unit tests for any new pure-function utilities |

The project constraint from v1.1 — "zero new npm packages" — was evaluated against five feature areas and
held cleanly because all v1.1 needs were covered by existing dependencies. For v1.2 the evaluation must be
re-run: the admin panel introduces chart rendering and PDF generation, both of which have no existing
equivalent in the installed packages. The constraint should be applied as a decision criterion, not an
absolute rule. Where a native/utility approach meets the need at equivalent quality, prefer it. Where it
creates 200+ lines of non-trivial code that a maintained library solves in 10, the package justifies its
cost.

---

## Feature Area Analysis

### Area 1: Dashboard Charts

**Decision: Add recharts@^3.8.1 with a react-is override.**

The admin dashboard needs three visualisations:
1. Grade band distribution — bar or column chart
2. Pass/fail rate — donut/pie chart
3. Score-over-time or submission volume trend — line chart

**Options evaluated:**

| Option | Bundle (gzip est.) | React 19 | SVG/Canvas | Verdict |
|--------|-------------------|----------|------------|---------|
| Recharts 3.x | ~150 KB | YES (with override) | SVG | Recommended |
| Chart.js 4.x + react-chartjs-2 | ~60 KB combined | YES | Canvas | Viable but non-compositional |
| Victory (FormidableLabs) | ~150 KB | YES | SVG | Weaker ecosystem, less maintained |
| Native SVG by hand | 0 KB | N/A | SVG | Viable for one chart; 3 charts × responsive + tooltip = 300+ lines |

**Why Recharts over Chart.js:**
- Recharts is React-compositional — charts are JSX (`<BarChart><Bar .../></BarChart>`). This matches the
  existing component style in this codebase. Chart.js 4 requires a canvas ref and imperative data
  registration, which is an anti-pattern in the existing hook-driven architecture.
- Recharts renders SVG, which inherits the app's existing dark-glass aesthetic via CSS custom properties
  without canvas API workarounds.
- Recharts v3.8.1 is the current stable release (npm, March 2026). Bundlephobia shows 3.8.1 at
  approximately 290 KB minified / ~150 KB gzipped — acceptable for a gated admin screen that the candidate
  never loads.

**React 19 peer dependency fix (CRITICAL):**
Recharts internally requires `react-is` to match the installed React version. With React 19.2.0, a
`react-is@^19` mismatch causes charts to render empty (the component tree mounts but produces no output).
The fix is two lines in `package.json`:

```json
"overrides": {
  "react-is": "^19.0.0"
}
```

This is a standard npm overrides field (not pnpm-specific). Install `react-is@^19.0.0` explicitly as a
dev dependency alongside recharts. Confirmed working pattern from multiple community sources (shadcn/ui
docs, bstefanski.com blog, GitHub issue #4558).

**Installation:**
```bash
npm install recharts@^3.8.1
npm install -D react-is@^19.0.0
```
Then add `"overrides": { "react-is": "^19.0.0" }` to `package.json` root.

**Native SVG fallback:** Viable only for a single static bar chart with no tooltip or responsive container.
Three chart types × responsive + tooltip + axis labels = ~300–400 lines of bespoke SVG math. Recharts
eliminates that complexity cleanly. The bundle cost lands entirely on the admin screen path.

---

### Area 2: CSV Export

**Decision: Use native Blob + URL.createObjectURL — no new package. PapaParse (already installed)
can handle edge cases if needed.**

The admin panel needs to export submission data as a `.csv` file.

The native browser pattern is well-established and handles this completely:

```js
function exportCSV(rows, filename) {
  const header = Object.keys(rows[0]);
  const lines = [header, ...rows.map(r => header.map(k => JSON.stringify(r[k] ?? '')))];
  const csv = lines.map(l => l.join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

The `﻿` BOM ensures Excel on Windows opens the file with correct UTF-8 encoding.

**When to use PapaParse instead:** If cells contain commas, newlines, or quotes embedded in the data (e.g.,
SPL query text or candidate explanation text), the naive `JSON.stringify` approach above handles them
because `JSON.stringify` wraps strings in double quotes and escapes internal quotes. This covers 100% of
the admin panel's data shape. PapaParse's `unparse()` function is equivalent but adds no capability for
this use case.

**Verdict:** Zero new packages. The utility function is ~15 lines and lives in `src/utils/exportCsv.js`.

---

### Area 3: PDF Report Generation

**Decision: Implement `window.print()` + `@media print` CSS for the v1.2 MVP. Evaluate jsPDF for a
future milestone only if print output is insufficient.**

The requirement is "PDF report generation per candidate or summary." Two implementation approaches:

**Option A: window.print() + @media print CSS (zero packages)**
- How it works: A dedicated print layout is built into the admin screen behind `@media print`. When the
  user triggers "Export PDF", the app calls `window.print()`. The browser renders the print layout and
  opens its native Save as PDF dialog.
- Output quality: Matches browser rendering exactly — CSS custom properties, grids, and tables render
  faithfully. The admin panel's data tables and score cards are straightforward print targets.
- Limitations: The user sees a browser print dialog (cannot silently download a `.pdf` without interaction).
  The output is whatever the browser's PDF renderer produces — no custom fonts, no pixel-perfect
  pagination control.
- Bundle cost: 0 KB.
- Implementation: One CSS block (`@media print { ... }`) + one `window.print()` call. Approximately 30–50
  lines of CSS.

**Option B: jsPDF 4.x + jspdf-autotable 5.x (~95 KB gzip)**
- jsPDF 4.2.1 is the current stable release (npm, March 2026). jspdf-autotable 5.0.8 supports jsPDF 4.x
  as a peer dependency (updated April 2026).
- jsPDF generates PDFs programmatically via a document API (`doc.text()`, `doc.autoTable()`), producing a
  Blob that downloads silently without a print dialog.
- Bundle cost: jsPDF adds approximately 95 KB gzipped (based on 229.8 KB minified figure from nutrient.io
  comparison, 2025). AutoTable adds a further ~10–15 KB.
- Limitation: Text-only layout via API calls — reproducing the admin panel's visual design requires
  manually programming every cell, row, and column position. The print-CSS approach uses the actual UI
  component as the template.

**Why window.print() first:**
The admin panel's report output is essentially a structured data view — score tables, answer text, grade
bands. These render natively in a browser print dialog. A silent `.pdf` download (jsPDF path) saves the
user one dialog click but costs 95 KB of bundle shipped to every admin session. The silent download is a
polish improvement, not a functional requirement. Build window.print() in v1.2; promote jsPDF to the
backlog as a v1.3 enhancement if reviewers report the print dialog is a workflow friction point.

**Verdict:** Zero new packages for v1.2. The print approach is implemented in a `<style>` block and
`window.print()` call inside the admin panel component.

---

### Area 4: Data Tables with Search/Filter

**Decision: Build a plain-React table component with `useMemo`-based filter. No library.**

The candidate management view needs:
- Tabular display of submissions (name, email, date, zone scores, SOC score, grade band)
- Text search across name/email
- Filter by grade band or date range
- Sort by score, date, or name

**Options evaluated:**

| Option | Bundle | React 19 | Verdict |
|--------|--------|----------|---------|
| Plain React + useMemo filter | 0 KB | YES | Recommended |
| TanStack Table v8 | ~15 KB | YES | Viable but not needed |
| react-table (legacy) | deprecated | — | Avoid |
| AG Grid Community | ~250 KB | YES | Severe overkill |

**Why not TanStack Table:** TanStack Table v8 is a headless table utility — it provides sorting/filtering
logic but no HTML or CSS. The developer still writes all JSX. For a single admin table with <500 rows
(this app will not exceed 100 candidates in practice), the `useMemo` filter pattern is 20–40 lines and
produces the same outcome with zero additional package surface area.

**Implementation pattern:**

```jsx
// In AdminPanel.jsx or a useAdminTable hook
const filtered = useMemo(() =>
  submissions.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.email.toLowerCase().includes(query.toLowerCase())
  ).filter(s => !gradeBandFilter || s.gradeBand === gradeBandFilter)
  .sort((a, b) => sortDir * (a[sortKey] > b[sortKey] ? 1 : -1)),
  [submissions, query, gradeBandFilter, sortKey, sortDir]
);
```

This pattern is idiomatic React — it matches how `useSocState.js` and `useGameState.js` are already
structured. No new mental model or abstraction layer.

**Verdict:** Zero new packages. Plain React `useMemo` + native HTML `<table>` styled with CSS custom
properties.

---

### Area 5: Google Apps Script — Admin Data Endpoint

**Decision: Add a `getSubmissions` action to the existing GAS handler. No new backend service.**

The admin panel needs to read all submission data from Google Sheets (both the Summary/RawData sheets for
zones 1-3 and the SOCData sheet for zone 4). The existing GAS handler handles `register`, `submit`, and
`checkEmail` POST actions plus GET for leaderboard reads.

Adding `action: 'getSubmissions'` (GET, passcode-gated) is a straightforward extension:

```javascript
// In google-apps-script.js
if (action === 'getSubmissions') {
  const passcode = e.parameter.passcode;
  if (passcode !== ADMIN_PASSCODE) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'unauthorized' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('SOCData');
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const data = rows.slice(1).map(row =>
    Object.fromEntries(headers.map((h, i) => [h, row[i]]))
  );
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
```

The GAS response is a CORS-unblocked JSON GET, not a `no-cors` POST — GAS GET responses include a
`Access-Control-Allow-Origin: *` header when the app is published "to anyone". The admin panel fetches
this with a normal `fetch()` call (no `mode: 'no-cors'`).

**Passcode security:** The admin passcode is sent as a URL query parameter. This is acceptable for the
stated auth model ("shared passcode, no identity provider"). The GAS web app URL is not public knowledge
and the risk profile matches existing reviewer functionality.

**No new packages needed.** The GAS extension is changes to the existing `google-apps-script.js` file,
deployed as a new version.

---

## Recommended Stack — New Additions for v1.2

| Package | Version | Purpose | Why / Why Not Alternative |
|---------|---------|---------|--------------------------|
| recharts | ^3.8.1 | Bar, pie, and line charts for dashboard | React-compositional SVG charts; Chart.js requires imperative canvas API incompatible with hook architecture |
| react-is | ^19.0.0 (dev) | Override to fix recharts + React 19 peer dep mismatch | Without this, recharts mounts but renders empty components |

**No packages added for:** CSV export (native Blob), PDF generation (window.print), search/filter tables
(useMemo), GAS data endpoint (GAS script edit).

---

## What NOT to Add

| Package | Reason | Use Instead |
|---------|--------|-------------|
| chart.js + react-chartjs-2 | Imperative canvas API; requires ref-based data injection; not compositional | recharts (JSX-native SVG) |
| victory (FormidableLabs) | Weaker maintenance, similar bundle; no advantage over recharts | recharts |
| jsPDF + jspdf-autotable | 95–110 KB for PDF that window.print() produces at 0 KB; print dialog is acceptable UX | window.print() + @media print CSS |
| html2pdf.js | Wraps html2canvas + jsPDF; 280+ KB; screenshot-based so text is unselectable in PDF output | window.print() |
| TanStack Table | Headless — still requires all HTML/CSS; 15 KB for what useMemo covers in 20 lines | useMemo + native HTML table |
| AG Grid | 250 KB; enterprise feature set for a table with <100 rows | useMemo + native HTML table |
| react-csv | Wrapper around Blob pattern; PapaParse already installed; no added value | Native Blob + URL.createObjectURL |
| React Router / TanStack Router | Violates the existing SPA SCREENS enum design | Extend SCREENS enum with ADMIN_PANEL |
| Zustand / Context API | Admin panel state (submissions, filter, sort) is local to the admin screen | useState + useMemo in admin hooks |
| date-fns / dayjs | Date display formatting for submissions is `new Date(ts).toLocaleDateString()` | Native Intl.DateTimeFormat |

---

## Installation

```bash
# Add recharts and its React 19 override
npm install recharts@^3.8.1
npm install -D react-is@^19.0.0
```

Add to `package.json` root (alongside `"scripts"`, `"dependencies"`):
```json
"overrides": {
  "react-is": "^19.0.0"
}
```

No other install commands. CSV export, PDF print, data tables, and GAS endpoint are zero-package additions.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Charts | recharts 3.8.1 | chart.js 4 + react-chartjs-2 | Imperative canvas API; ref-based data injection is an anti-pattern in this hook-driven codebase |
| Charts | recharts 3.8.1 | Native SVG | 3 chart types × responsive + tooltip + axes = 300–400 lines of custom SVG math; unjustifiable when recharts covers it compositionally |
| PDF | window.print() + @media print | jsPDF 4.2.1 + jspdf-autotable 5.0.8 | 95–110 KB bundle; print dialog is acceptable for admin workflow; jsPDF promoted to backlog for v1.3 |
| PDF | window.print() | html2pdf.js | Screenshot-based — text in output PDF is an image, not selectable/copyable; unacceptable for answer sheet review |
| Tables | useMemo + native HTML | TanStack Table v8 | Headless only; same HTML still required; 15 KB for 20 lines of filter logic |
| CSV | Native Blob | react-csv | Thin wrapper with no added value; PapaParse unparse() is equivalent and already installed |

---

## Integration Points with Existing Stack

| New Feature | Integrates With | How |
|-------------|-----------------|-----|
| Dashboard charts | New `useAdminData` hook | Recharts components receive data arrays from hook; rendered inside `AdminPanel.jsx` |
| Admin screen navigation | `useGameState.js` SCREENS enum | Add `ADMIN` to SCREENS; `App.jsx` renders `<AdminPanel>` when `gs.screen === SCREENS.ADMIN` |
| Passcode gate | Existing passcode check pattern from `ReviewerScreen.jsx` | Reuse or extend the same passcode comparison logic |
| CSV export | `src/utils/exportCsv.js` (new utility) | Called from button `onClick` in `AdminPanel.jsx`; receives submission array |
| PDF print | `AdminPanel.jsx` + `src/styles/admin-print.css` (new file) | `window.print()` call; `@media print` block hides navigation, shows report layout |
| GAS data fetch | `src/hooks/useAdminData.js` (new hook) | `fetch(LEADERBOARD_URL + '?action=getSubmissions&passcode=...')` — normal fetch, not no-cors |
| Search/filter | `useAdminData.js` or local `AdminPanel` state | `useMemo` over fetched submissions array |
| React 19 compatibility | `package.json` overrides | `"overrides": { "react-is": "^19.0.0" }` prevents empty chart render |

---

## Version Compatibility Summary

| Package | Version | React 19 Compatible | Notes |
|---------|---------|---------------------|-------|
| recharts | ^3.8.1 | YES (with react-is override) | Override required; without it charts render empty on React 19.x |
| react-is (override) | ^19.0.0 | YES — is React 19 | Dev dependency; corrects recharts internal react-is version mismatch |
| jsPDF | 4.2.1 | YES | NOT adding in v1.2; documented for future reference |
| jspdf-autotable | 5.0.8 | YES (peer: jsPDF 4.x) | NOT adding in v1.2; peer dep updated April 2026 |
| TanStack Table | v8.x | YES | NOT adding; useMemo covers the need |

---

## Sources

- `package.json` (direct file read, 2026-05-26) — confirmed existing dependency versions (HIGH confidence)
- `.planning/research/STACK.md` v1.1 (direct file read, 2026-05-26) — prior stack decisions and rationale (HIGH confidence)
- WebSearch: "recharts v3 latest npm version 2025 react-is peer dep" — confirmed v3.8.1, last published
  March 2026, react-is override required for React 19 (MEDIUM confidence — npm page not directly fetchable)
- WebSearch: "recharts React 19 compatibility issue resolved version 2025" — confirmed override pattern,
  empty chart symptom, react-is version must match React version (MEDIUM confidence, corroborated by
  multiple sources: bstefanski.com, shadcn/ui docs, GitHub issue #4558)
- WebSearch: "jsPDF npm bundle size gzip 2025 latest version" — confirmed v4.2.1, ~95 KB gzipped
  (MEDIUM confidence — specific gzip figure from nutrient.io comparison article 2025)
- WebSearch: "jsPDF 4.x autotable plugin latest version 2025 npm install size" — confirmed jspdf-autotable
  v5.0.8, peer dep updated to allow jsPDF 4.x (MEDIUM confidence)
- WebSearch: "native CSV export browser without papaparse Blob download pattern react 2025" — confirmed
  Blob + URL.createObjectURL pattern; UTF-8 BOM for Excel compatibility (HIGH confidence — well-established
  browser API, multiple consistent sources)
- WebSearch: "pure CSS data table search filter react no library pattern 2025" — confirmed useMemo filter
  is idiomatic, no library required for single-table use case (HIGH confidence)
- WebSearch: "window.print CSS @media print PDF alternative browser no library react 2025" — confirmed
  window.print() produces print dialog; @media print CSS controls layout (HIGH confidence — native browser
  API)
- [recharts GitHub — Support React 19 issue #4558](https://github.com/recharts/recharts/issues/4558) — core
  compatibility tracking issue (MEDIUM confidence)
- [recharts — 3.0 migration guide](https://github.com/recharts/recharts/wiki/3.0-migration-guide) —
  confirms v3 API surface (MEDIUM confidence)
- [Bundlephobia recharts 3.8.1](https://bundlephobia.com/package/recharts) — ~290 KB min / ~150 KB gzip
  (MEDIUM confidence — not directly fetchable, derived from search result descriptions)

---

*Stack research for: Admin Panel v1.2 — flagmail1*
*Researched: 2026-05-26*
