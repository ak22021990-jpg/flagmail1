# Domain Pitfalls: Admin Panel Addition to Existing React SPA

**Domain:** Adding admin dashboard, CSV/PDF reports, data tables, and candidate management to an existing React 19 + Vite 7 SPA backed by Google Sheets via Google Apps Script.
**Researched:** 2026-05-26
**Milestone:** v1.2 Admin Panel
**Confidence:** HIGH (derived from direct codebase inspection of existing GAS script, ReviewerScreen.jsx, App.jsx, and the specific integration patterns already in the codebase; verified against Recharts React 19 issue tracker, jsPDF Vite issue tracker, GAS quota docs)

> **Note:** This file covers v1.2-specific pitfalls only. Pitfalls from v1.0/v1.1 (GAS MailApp scope re-authorization, term-stuffing, false-fail SPL scoring, CORS on reviewer GET, passcode bundle exposure, formula injection, silent submission failure, Zone 1–3 regression) are documented in the **previous version of this file** and remain valid. This file does not duplicate them but does reference them where they compound with v1.2 changes.

---

## Critical Pitfalls

Mistakes that cause rewrites, data loss, or fundamental feature failure.

---

### Pitfall 1: Recharts ResponsiveContainer Renders with Zero Height in React 19 Production Builds

**What goes wrong:**
A `<BarChart>` or `<LineChart>` wrapped in `<ResponsiveContainer>` renders correctly in `npm run dev` but shows a blank space (0px height, chart invisibly rendered) in the `npm run build` production output. The dashboard renders, but all charts are empty boxes.

**Why it happens:**
Recharts' `ResponsiveContainer` internally checks whether its child is a "chart" component by inspecting the child's `displayName`. In development builds React preserves `displayName` (e.g., `"CategoricalChart"`), so the check passes and both width and height are set. In Vite production builds, React 19 minifies component names — `displayName` becomes `"Component"` — which causes the `isChart` check to evaluate to false. Only width is set; height defaults to zero. This is a confirmed Recharts issue against React 19 (GitHub issue #5173, reported late 2024).

**Warning signs:**
- Dashboard charts look correct at `localhost:5173` but are blank after deploying to GitHub Pages.
- Browser DevTools shows a `<svg>` element with `width=600 height=0` in the production build.
- No console errors — the chart renders silently with zero height.

**Prevention:**
1. Always supply explicit `height` to `ResponsiveContainer` — never rely on `height="100%"` with no fixed parent height: `<ResponsiveContainer width="100%" height={280}>`. A fixed pixel height bypasses the ResponsiveContainer height calculation that breaks.
2. Wrap the chart in a parent `<div style={{ height: 280 }}>` if percentage height is needed — the parent provides the measured height.
3. Test charts with `npm run build && npm run preview` (Vite's local production preview) before any admin panel phase is considered done. Never accept "looks good in dev" for charts.
4. Pin Recharts to the tested version (`recharts@^3.3.0` or later if the issue is patched). Watch the issue tracker before upgrading.

**Phase to address:** Dashboard phase (Phase 1 of v1.2). The fixed-height wrapper pattern must be established on the first chart component written — retrofitting it later requires touching every chart instance.

---

### Pitfall 2: jsPDF Vite Build Breaks Due to CommonJS/ESM Module Mismatch

**What goes wrong:**
Adding `jspdf` (or `jspdf` + `jspdf-autotable`) to `package.json` causes `npm run build` to fail with a cryptic error: `Could not resolve '../internals/define-window-property' from '../internals/define-window-property?commonjs-external'`. Alternatively, the build succeeds but the PDF generation throws `TypeError: Cannot read properties of undefined` at runtime in the production bundle.

**Why it happens:**
jsPDF ships a CommonJS distribution. Vite 7 defaults to native ESM for everything in the project. The Vite CommonJS interop plugin (`@vitejs/plugin-commonjs`, built into Vite) must transform jsPDF at build time. The transformation can fail with certain jsPDF versions or certain `optimizeDeps` configurations. This is a documented Vite issue (Vite issue #11496, issue #16320). The `jspdf-autotable` plugin also mutates the `jsPDF` prototype, which requires that the import order and the `doc.autoTable` call happen in the right sequence — order-sensitive module side effects are fragile under Vite's tree-shaking.

**Warning signs:**
- `npm run dev` works but `npm run build` outputs a warning about CommonJS modules.
- PDF generation works locally but produces a blank document or throws in GitHub Pages deployment.
- `jspdf-autotable` is imported but `doc.autoTable is not a function` appears at runtime.

**Prevention:**
1. Use dynamic import for jsPDF — load it only when the user clicks "Download PDF": `const { jsPDF } = await import('jspdf')`. This defers the CommonJS transformation to the lazy chunk and avoids polluting the main bundle. jsPDF is ~330KB minified, ~110KB gzipped — far too large for the main bundle of a game that most users never access the admin panel for.
2. For `jspdf-autotable`: import it inside the same dynamic import block, not at the top of the file: `await import('jspdf-autotable')` after `jsPDF` is loaded. This preserves the prototype mutation order.
3. Add `jspdf` to `vite.config.js` `optimizeDeps.include` if the dynamic import approach does not resolve the build error: `optimizeDeps: { include: ['jspdf', 'jspdf-autotable'] }`.
4. Verify with `npm run build && npm run preview` — download the PDF from the local production build before deploying.

**Phase to address:** PDF report phase. The dynamic-import pattern must be decided before writing PDF generation code — it affects how the function is structured.

---

### Pitfall 3: jsPDF Silently Drops Non-ASCII Characters (Names, Email Addresses, SPL Symbols)

**What goes wrong:**
A candidate named "Léa Müller" or "Ana González" appears as "L_a M_ller" or blank in the downloaded PDF. SPL queries containing `|`, `"`, `{`, `}` may appear as question marks or be dropped entirely. The PDF renders correctly in the browser but the downloaded file has missing characters.

**Why it happens:**
jsPDF's default built-in fonts (Helvetica, Times, Courier) only support Latin-1 (ISO 8859-1). Any character outside that range is silently replaced with a question mark or dropped. This affects:
- Accented characters in candidate names (`é`, `ü`, `ç`, `ñ`)
- SPL pipe characters (`|`) — rendered as `|` in some fonts, dropped in others
- Email addresses with `+` signs or unusual TLDs

The issue is particularly silent: no exception is thrown, and the PDF appears to generate successfully. Only inspection of the downloaded file reveals the corruption.

**Warning signs:**
- PDFs downloaded by test users with non-ASCII names show garbled text.
- SPL query text in the PDF is missing pipe characters.
- The browser `console.log` shows no errors during PDF generation.

**Prevention:**
1. Bundle a Unicode-compatible font (e.g., NotoSans-Regular) as a base64 string or import it via `doc.addFileToVFS()` + `doc.addFont()` before writing any text. This is the only reliable fix — jsPDF cannot render Unicode without an embedded font.
2. For the admin panel scope (candidate names, emails, SPL queries in English), the risk is primarily accented characters in names. Add a sanitisation fallback: `name.normalize('NFC')` before writing to PDF. This does not fix the font issue but reduces the character range to the most common Latin extended set.
3. Test PDF generation with a candidate name containing at least one accented character (e.g., "José") and one SPL query containing `|` before considering the PDF feature done.
4. If adding a full Unicode font is too costly (NotoSans adds ~500KB to the lazy PDF chunk), generate PDFs with ASCII-only content and display a visible warning if the candidate name contains non-ASCII characters.

**Phase to address:** PDF report phase. Font embedding must be decided before the PDF template is authored, as retrofitting font changes requires re-authoring all text positioning.

---

### Pitfall 4: GAS `doGet` Returns the Entire Summary + SOCData Sheet on Every Admin Panel Load — Slow and Will Break at Scale

**What goes wrong:**
The admin panel requires data from two sheets: `Summary` (one row per candidate, classification scores) and `SOCData` (6 rows per candidate, SOC question answers). A naive implementation adds a new GAS action `getAdminData` that calls `getValues()` on both sheets and returns all rows as one JSON response. With 50 candidates this works. With 200+ candidates, the GAS script exceeds its 6-minute execution timeout or the JSON response exceeds the browser's parse capacity. The admin panel appears to hang or returns a timeout error.

**Why it happens:**
Each GAS `getValues()` call fetches an entire range synchronously. For `SOCData`, each candidate generates 6 rows — 200 candidates = 1,200 rows with 9 columns each. The in-memory join of `Summary` rows to their corresponding `SOCData` rows (by email + timestamp key) runs inside GAS's JavaScript V8 runtime, which has no JIT optimizations for this use case. The total execution time for read + join + JSON serialisation + HTTP response write can approach the 6-minute limit at a few hundred rows.

**Warning signs:**
- Admin panel load works fine during development with 5–10 test submissions but hangs in staging with 50+ real submissions.
- GAS Executions log shows execution times increasing linearly with candidate count.
- `fetch` in the browser resolves with a timeout error or `{"error": "Script timeout"}` response.

**Prevention:**
1. Design the GAS `getAdminData` action with pagination from the start: `?action=getAdminData&passcode=...&limit=50&offset=0`. Even if v1.2 never exceeds 50 candidates, the parameter structure avoids a breaking schema change later.
2. Return `Summary` and `SOCData` as separate GAS actions — `getSummary` and `getSOCDetails?email=...` — so the dashboard loads the summary table first (fast, one sheet), then loads per-candidate details on demand (slow, 6 rows per candidate). This lazy-loads the expensive join.
3. Cache the admin data in React `useState` after first fetch. Do not re-fetch on every visit to the admin panel within the same browser session. The passcode-gated panel is for synchronous review sessions, not live monitoring.
4. Use `getRange(2, 1, lastRow - 1, numCols).getValues()` with explicit column bounds — do not call `getDataRange()`, which is slower and returns formatting metadata in addition to values.

**Phase to address:** GAS backend extension phase. The API shape (single vs. split endpoints, pagination parameters) must be decided before writing the fetch layer in the React admin panel, as changing it after both sides are built requires touching both.

---

### Pitfall 5: Admin Panel Replaces `ReviewerScreen` in App.jsx — Stale Data and Back-Navigation Break Existing Flow

**What goes wrong:**
The existing `ReviewerScreen` is mounted at `gs.screen === SCREENS.REVIEWER` with no local state beyond the fetch result. Replacing it with a richer `AdminPanel` component introduces multi-tab navigation (Overview / Candidate Table / Answer Sheets / Reports), which requires its own internal screen state. Two problems emerge:
1. **Stale data:** The admin panel fetches submission data on mount. If the admin navigates to the landing page and back to the admin panel, the component remounts (because `SCREENS.REVIEWER` unmounts it), losing all fetched data and triggering a second GAS fetch with a loading spinner.
2. **State leak into game:** If the admin panel manages any state that is held in a parent hook (`useGameState`, `useSocState`), navigating back to the landing screen leaves that state populated, potentially affecting the first candidate who loads the game after the admin session.

**Warning signs:**
- Navigating from admin panel back to landing and then back to admin shows a loading spinner even though no new submissions have occurred.
- GAS Executions log shows double fetches for admin data.
- Console errors about reading properties of null after navigating from admin panel to Zone 1.

**Prevention:**
1. Keep all admin panel state (fetched data, active tab, search term, selected candidate) inside the `AdminPanel` component itself using `useState`, not in `useGameState` or `useSocState`. The admin panel is not part of the game flow — it must be fully isolated.
2. Cache fetched data in `sessionStorage` or a React `useRef` after first fetch. On remount, restore from cache if the session is still valid (passcode was already entered). This prevents the double-fetch on navigation.
3. The `passcode` state in the existing `ReviewerScreen` is local `useState` — maintain this pattern. The admin panel should re-prompt for the passcode after a hard refresh but not on in-session navigation.
4. Use `key` on the `AdminPanel` component to explicitly control remount vs. persist: `<AdminPanel key="admin-panel" .../>` (stable key = persists state on re-render). If a fresh state is always desired on admin entry, use a timestamp key.
5. Run `gitnexus_impact({target: "SCREENS", direction: "upstream"})` before adding any new SCREENS enum value — the existing 11 screens are already wired; an accidental key collision silently renders the wrong screen.

**Phase to address:** Admin panel integration phase. The isolation pattern (all state inside `AdminPanel`, no `useGameState` pollution) must be established before any component is wired.

---

### Pitfall 6: Client-Side Search and Filter Loads All Submissions into Browser Memory Upfront

**What goes wrong:**
The candidate management view offers search by name/email and filter by grade band. A naive implementation fetches all submissions at login, stores them in React state, and filters/sorts in-component. With 200 candidates and 6 SOC rows per candidate, the total data is ~1,200 rows × ~9 columns. This is not technically "large" by browser standards, but the GAS fetch itself becomes slow (see Pitfall 4), and the in-browser filter+sort runs on every keystroke, potentially causing noticeable lag on lower-end devices.

**Why it happens:**
There is no server-side filtering in the GAS backend — it returns all rows. The React component re-renders on every search input character with `submissions.filter(s => s.name.includes(query))` over the full array.

**Prevention:**
1. Debounce search input with a 150–250ms delay before filtering — the user typing "smith" should only trigger one filter pass, not five. Use a `useEffect` with a `setTimeout` cleanup (no library needed — this is 8 lines of code).
2. Use `useMemo` for filtered results: `const filtered = useMemo(() => submissions.filter(...), [submissions, query, gradeFilter])`. This memoizes the filter pass and only re-runs when the dependencies change, not on every render.
3. For the candidate table itself, render only visible rows (virtual scrolling) if the submission count exceeds ~100 rows. At the expected scale (50–200 candidates per assessment cycle), plain `Array.map` rendering is fine — do not add `react-window` or `react-virtual` until there is a measured performance problem.
4. Accept that pagination is not necessary for this use case (single-session reviewer with at most a few hundred rows). Document this assumption so it is not re-litigated during implementation.

**Phase to address:** Candidate management / data table phase.

---

## Moderate Pitfalls

Mistakes that cause visible defects or reviewer friction but not data loss.

---

### Pitfall 7: CSV Export Truncates or Corrupts SPL Query Text Containing Commas and Newlines

**What goes wrong:**
The CSV export uses a naive `array.join(',')` row builder. SPL queries frequently contain commas (e.g., `| stats count by src_ip, user`), and explanation text often contains newlines. The resulting CSV has rows that span multiple lines in spreadsheet software, with cells split at the wrong position. Excel shows garbled data; Google Sheets imports incorrectly.

**Why it happens:**
RFC 4180 CSV requires values containing commas, double-quotes, or newlines to be wrapped in double-quotes, with internal double-quotes escaped as `""`. A simple `join(',')` does none of this.

**Warning signs:**
- Downloaded CSV opened in Excel shows candidate names on row 1 but SPL query text overflowing into rows 2 and 3.
- Cell counts per row are inconsistent in the downloaded file.
- The existing `csvEscape()` function in `google-apps-script.js` already implements correct escaping — but the client-side CSV generation must replicate this logic independently.

**Prevention:**
The `google-apps-script.js` already has a correct `csvEscape()` function (lines 398–404). Copy this logic exactly into the client-side CSV builder:
```js
function csvEscape(val) {
  const s = String(val == null ? '' : val);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}
```
Apply `csvEscape` to every cell, not just text fields. Test with a submission where the SPL query contains `| stats count by src_ip, user` and an explanation containing a newline.

**Phase to address:** CSV export phase. The escape function must be present from the first working CSV export — do not add it as a patch after reviewers report corruption.

---

### Pitfall 8: PDF Download Silently Fails on Mobile Safari (Blob URL Handling)

**What goes wrong:**
The PDF download works on Chrome and Firefox on desktop. On mobile browser (tablet/smartphone) Safari, clicking "Download PDF" either opens a blank page, opens the PDF in the browser tab instead of downloading it, or does nothing. The reviewer uses a tablet at their desk — the feature appears broken for their primary device.

**Why it happens:**
Mobile Safari does not support `<a href="blob:..." download="filename.pdf">` in the same way desktop browsers do. `URL.createObjectURL` returns a blob URL, but mobile Safari ignores the `download` attribute on anchor elements pointing to blob URLs. Instead it navigates to the blob URL, which shows a blank page (mobile Safari cannot render PDF blobs inline in the same way desktop Chrome does).

**Warning signs:**
- "Download PDF" works on desktop Chrome/Safari but shows a blank new tab on a mobile device.
- Developer Tools network panel shows the blob URL being navigated to rather than triggering a file download.

**Prevention:**
1. Use `window.open(blobUrl)` on mobile Safari, which opens the PDF inline in a new tab where the user can use the share sheet to save it. Detection: `const isMobileSafari = /iPad|iPhone|iPod/.test(navigator.userAgent)` (user-agent sniffing for mobile device).
2. Alternatively, generate the PDF and offer a `<a href={dataUrl} download="report.pdf">` where `dataUrl` is a `data:application/pdf;base64,...` string — data URLs work more consistently across mobile Safari for PDF content than blob URLs.
3. Test PDF download on at least one mobile browser before considering the feature done. The reviewer access point is a fixed-location admin task — if the reviewer uses a desktop, mobile support is lower priority. Document this explicitly.

**Phase to address:** PDF report phase. Mobile Safari compatibility must be tested before the feature is marked complete.

---

### Pitfall 9: Dashboard Statistics Are Computed in the React Component — Recalculated on Every Render

**What goes wrong:**
The score overview dashboard computes average scores, grade band distribution counts, and pass/fail rates directly in the render function body:
```js
const avg = submissions.reduce((s, r) => s + r.total, 0) / submissions.length;
const bands = submissions.reduce((acc, r) => ({ ...acc, [r.grade]: (acc[r.grade]||0)+1 }), {});
```
With 200 submissions, these reduce calls run on every keystroke in the search box, every filter change, every Framer Motion animation tick that causes a parent re-render. The dashboard feels sluggish during interaction.

**Prevention:**
Wrap all derived dashboard statistics in `useMemo` keyed to `submissions` (the source data, not the filtered view). The overview dashboard statistics should reflect all submissions, not just the filtered view — separate the "all data statistics" from the "filtered table rows":
```js
const stats = useMemo(() => computeDashboardStats(submissions), [submissions]);
const filteredRows = useMemo(() => filterSubmissions(submissions, query, grade), [submissions, query, grade]);
```
This is a two-line change but prevents repeated quadratic work during table interactions.

**Phase to address:** Dashboard phase. Establish the `useMemo` pattern on the first statistics computation — do not add memoization as a performance fix after the fact.

---

### Pitfall 10: Admin Panel GAS Action Endpoint Exposes All Candidate Data to Anyone Who Knows the URL Structure

**What goes wrong:**
The existing `getSOCSubmissions` GAS action is passcode-gated: it checks `PropertiesService.getScriptProperties().getProperty('REVIEWER_PASSCODE')` before returning data. The new `getAdminData` action (or any new GAS action that returns candidate data) must replicate this check. If a developer adds a new action for convenience (`?action=getSummary`) and forgets to add the passcode check, the entire `Summary` sheet (with all candidate names, emails, scores) is accessible to anyone who knows the GAS URL — which is hardcoded in `src/config.js` and therefore visible in the public GitHub repository.

**Warning signs:**
- A new GAS action returns data without a `passcode` parameter in its URL.
- Any GAS action that reads from `Summary`, `RawData`, or `SOCData` does not check `PropertiesService`.
- The GAS URL is discoverable in the public repo (`src/config.js` is committed).

**Prevention:**
1. Create a `checkPasscode(passcode)` helper function in `google-apps-script.js` that reads from `PropertiesService` and returns `true/false`. Call it at the top of every new `doGet` action that reads private data — before any `getValues()` call.
2. All new admin GAS actions must follow the pattern:
   ```js
   if (!checkPasscode(e.parameter.passcode)) {
     return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'Unauthorized' }))
       .setMimeType(ContentService.MimeType.JSON);
   }
   ```
3. Run the `gitnexus_detect_changes()` check before committing any `google-apps-script.js` change to verify no unprotected action was accidentally added.

**Phase to address:** GAS backend extension phase. The `checkPasscode` helper must be the first thing added to `google-apps-script.js` before any new admin actions are authored.

---

### Pitfall 11: Recharts Bundle Added to Main Chunk Bloats Initial Load for All Players

**What goes wrong:**
`recharts` is added to `package.json` and imported at the top of `AdminPanel.jsx`. Vite includes Recharts in the main application bundle. All players loading FlagMail — the majority of whom are candidates who will never visit the admin panel — pay the Recharts bundle cost (~350KB minified, ~115KB gzipped) on every game load. First load time on mobile increases noticeably.

**Why it happens:**
Vite bundles all static imports into the main chunk by default. `AdminPanel` is only mounted when `gs.screen === SCREENS.REVIEWER`, but if it is imported at the top of `App.jsx`, its dependencies (including Recharts) are included in the main bundle regardless.

**Warning signs:**
- `npm run build` output shows a single chunk significantly larger than before Recharts was added.
- Lighthouse "First Contentful Paint" score drops after adding the admin panel.
- `vite-bundle-visualizer` shows `recharts` as a large segment of the main chunk.

**Prevention:**
1. Lazy-load the entire `AdminPanel` component with `React.lazy` + `Suspense`:
   ```jsx
   const AdminPanel = React.lazy(() => import('./components/AdminPanel.jsx'));
   // ...
   {gs.screen === SCREENS.ADMIN && (
     <Suspense fallback={<div>Loading...</div>}>
       <AdminPanel ... />
     </Suspense>
   )}
   ```
   Vite automatically code-splits lazy-loaded components into separate chunks. Recharts and jsPDF end up in the `AdminPanel` chunk, which is only downloaded when the admin panel is first accessed.
2. For jsPDF, use dynamic import inside the PDF generation function (see Pitfall 2 above) — this further separates jsPDF from the Recharts chunk.
3. Verify with `npm run build` output: the main `index-[hash].js` chunk must not grow significantly after adding the admin panel import.

**Phase to address:** Admin panel integration phase. The lazy-load wrapper must be the first thing written before any admin component code — retrofitting it requires refactoring the import structure.

---

### Pitfall 12: Replacing `ReviewerScreen` Breaks the Existing Passcode Flow Without a Clear Transition Plan

**What goes wrong:**
`ReviewerScreen.jsx` is a self-contained component with its own passcode `useState`, fetch logic, and submission list rendering. The v1.2 admin panel replaces it entirely. A naive approach deletes `ReviewerScreen.jsx` and substitutes `AdminPanel.jsx`. This breaks any code that still imports `ReviewerScreen` and leaves the `SCREENS.REVIEWER` enum value either dangling or incorrectly pointed.

**Why it happens:**
`App.jsx` references `SCREENS.REVIEWER` and renders `<ReviewerScreen onBack=... />`. Deleting the component without updating `App.jsx` causes a build error. Renaming `SCREENS.REVIEWER` to `SCREENS.ADMIN` without a migration plan may affect existing `ROADMAP.md` references or quick-task summaries that reference `REVIEWER`.

**Warning signs:**
- Build error: `Cannot find module './components/ReviewerScreen.jsx'` after deleting the file.
- `SCREENS.REVIEWER` value exists in the enum but no component renders for it.
- The "Reviewer" button on `LandingScreen` still navigates to the old screen after replacement.

**Prevention:**
1. Do not delete `ReviewerScreen.jsx` in the same commit that creates `AdminPanel.jsx`. Instead: (a) create `AdminPanel.jsx`, (b) update `App.jsx` to render `AdminPanel` for `SCREENS.REVIEWER` (or a new `SCREENS.ADMIN` value), (c) verify the app builds and the admin entry works, (d) then delete `ReviewerScreen.jsx` in a follow-up commit.
2. Keep the `SCREENS.REVIEWER` enum value name if changing it introduces risk of missing references. The admin panel replacing the reviewer screen is a UX decision, not an enum naming decision. A reviewer/admin distinction is fine at the UI level; the enum key name is internal.
3. Update the landing screen button label from "Reviewer" to "Admin" only after the component replacement is confirmed working.

**Phase to address:** Admin panel integration phase. The transition plan (create → wire → verify → delete) must be documented in the phase plan before coding starts.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Dashboard charts | Recharts React 19 production height=0 bug (Pitfall 1) | Explicit pixel height on all ResponsiveContainer wrappers; test with `npm run preview` |
| Dashboard charts | Recharts in main bundle (Pitfall 11) | `React.lazy()` on AdminPanel before first chart import |
| Dashboard stats computation | Stats recalculated on every render (Pitfall 9) | `useMemo` for all aggregate statistics on the `submissions` array |
| GAS backend — new admin endpoints | Unprotected GAS action exposes candidate data (Pitfall 10) | `checkPasscode` helper added to GAS before any new action is written |
| GAS backend — fetching both sheets | GAS timeout on large submission counts (Pitfall 4) | Split `Summary` and `SOCData` fetches; add pagination parameters |
| Candidate table — search/filter | All data in memory, expensive re-filter on every keystroke (Pitfall 6) | Debounce + `useMemo` for filtered rows |
| CSV export | Commas in SPL queries corrupt CSV rows (Pitfall 7) | Use RFC 4180-compliant `csvEscape` on every cell |
| PDF generation | jsPDF Vite CommonJS build failure (Pitfall 2) | Dynamic import; `optimizeDeps.include` in `vite.config.js` |
| PDF generation | Non-ASCII characters dropped silently (Pitfall 3) | Embed a Unicode font or sanitise before writing |
| PDF generation | Mobile Safari blob URL does not trigger download (Pitfall 8) | Test on mobile browser; use `data:` URL or `window.open` for mobile Safari |
| Admin panel wiring into App.jsx | Stale data on navigate-away-and-return (Pitfall 5) | Cache fetched data in `sessionStorage`; no admin state in `useGameState` |
| ReviewerScreen replacement | Build breakage if delete-before-wire (Pitfall 12) | Create → wire → verify → delete sequence; never delete before wiring |

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create problems specific to the v1.2 admin panel.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `import AdminPanel from './components/AdminPanel'` at top of App.jsx (static import) | Simpler code | Recharts/jsPDF in main bundle; every candidate pays the load cost | Never — use `React.lazy()` |
| Single `getAdminData` GAS action returning all rows from both sheets | Simple API surface | GAS timeout at scale; one slow query blocks all admin data | Only for prototype; always add pagination before first real deployment |
| `array.join(',')` for CSV cell building | 1-line CSV generation | Breaks on SPL queries with commas; corrupts spreadsheet import | Never — always use RFC 4180-compliant escaping |
| All admin panel state in `useGameState` via a new `adminData` field | Survives navigation | Admin data contaminates candidate game state; hard to clear cleanly | Never — all admin state must live inside AdminPanel or a dedicated `useAdminState` hook |
| Computing dashboard statistics inline in JSX | No boilerplate | Recalculated on every render; slow with 200+ submissions | Never past the prototype stage — `useMemo` on first extraction |
| Hardcoded `height="100%"` on Recharts ResponsiveContainer | "Responsive" label | Renders at 0px in React 19 production builds | Never — always provide a fixed fallback height |
| Passcode checked in React component (`if passcode === 'admin123'`) | No GAS round-trip | Passcode visible in built JS bundle and git history | Never — passcode must be validated server-side via PropertiesService |

---

## "Looks Done But Isn't" Checklist for v1.2

- [ ] **Charts in production:** Run `npm run build && npm run preview`, open the admin panel, and verify all charts render with non-zero height.
- [ ] **Recharts in main bundle:** Run `npm run build` and verify `recharts` does NOT appear in the main `index-[hash].js` chunk (use `npx vite-bundle-visualizer` or check build output sizes).
- [ ] **jsPDF production build:** Run `npm run build` — zero build warnings about CommonJS modules. Download a PDF from `npm run preview` — not just `npm run dev`.
- [ ] **PDF Unicode:** Generate a PDF for a candidate with an accented name (e.g., "José García") — the PDF must display the name correctly, not as "Jos_ Garc_a".
- [ ] **PDF mobile Safari:** Open the admin panel on a mobile browser (tablet or smartphone) — the PDF download must not open a blank page.
- [ ] **CSV integrity:** Download the CSV export and open in Google Sheets — all rows must have the correct column count; SPL queries containing commas must be in a single cell, not spread across adjacent cells.
- [ ] **GAS passcode gate on all new actions:** Fetch any new admin GAS action URL directly in the browser without a passcode parameter — it must return `{"ok":false,"error":"Unauthorized"}`, not candidate data.
- [ ] **Admin panel data isolation:** Complete Zone 1 of the game as a candidate, then navigate to the admin panel, then navigate back to the landing page and start a new game — the new game must start cleanly with no admin data visible.
- [ ] **No stale data on re-entry:** Log into the admin panel (enter passcode, data loads). Navigate back to landing. Navigate to admin panel again — must show cached data immediately, not a loading spinner, without making a second GAS fetch.
- [ ] **Reviewer screen replacement clean:** Run `npm run build` after wiring `AdminPanel` — no `Cannot find module ReviewerScreen` error; no dangling `SCREENS.REVIEWER` reference.
- [ ] **Candidate search debounced:** Type a 5-character search query quickly — browser DevTools "Performance" panel must not show more than 1–2 filter operations, not 5.
- [ ] **Dashboard statistics memoized:** Open React DevTools "Profiler", interact with the search box — dashboard statistic components must not re-render on search input changes.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Recharts zero-height in production | LOW | Add explicit `height={280}` to every `ResponsiveContainer`; redeploy static build; no GAS changes needed |
| jsPDF Vite build failure | LOW | Switch static import to dynamic import; add to `optimizeDeps.include`; redeploy |
| jsPDF Unicode characters dropped | MEDIUM | Embed NotoSans font via `addFileToVFS/addFont`; re-test all PDF templates; redeploy |
| GAS data endpoint timeout at scale | MEDIUM | Add pagination to GAS action; update React fetch to paginate; no schema change to sheets |
| CSV corruption discovered post-launch | LOW | Fix `csvEscape` function; no GAS changes; redeploy static build; advise reviewers to re-download |
| Unprotected GAS admin action discovered | HIGH | Immediately add `checkPasscode` to the GAS action; deploy new GAS version; assess whether the URL was accessed without passcode by checking GAS execution logs |
| Admin state polluting game state | MEDIUM | Extract admin state to isolated component or dedicated hook; clear admin data on `SCREENS.REVIEWER` exit; no GAS changes |
| Mobile PDF download blank page | LOW | Switch to `data:` URL approach for PDF download; Chrome/Firefox unaffected; redeploy |
| ReviewerScreen deleted before AdminPanel wired | LOW | `git revert` the deletion commit; re-add `ReviewerScreen.jsx` temporarily; wire AdminPanel first |

---

## Sources

- `flagmail1/src/components/ReviewerScreen.jsx` — existing component being replaced: passcode state, fetch pattern, submission rendering (HIGH confidence, direct read)
- `flagmail1/google-apps-script.js` — GAS `doGet` structure, `getSOCSubmissions` action, `sanitiseCell`, `csvEscape`, `PropertiesService` passcode gate (HIGH confidence, direct read)
- `flagmail1/src/hooks/useSocState.js` — `submitFinal` no-cors fetch, sessionStorage backup (HIGH confidence, direct read)
- `flagmail1/src/App.jsx` — SCREENS enum usage, `gs.screen === SCREENS.REVIEWER` wiring point (HIGH confidence, direct read)
- `flagmail1/.planning/PROJECT.md` — v1.2 feature scope: dashboard, CSV, PDF, candidate management, unified admin entry (HIGH confidence, direct read)
- Recharts GitHub issue #5173 (2024): `ComposedChart` in `ResponsiveContainer` with React 19 production build — `displayName` minification breaks `isChart` check, resulting in `height=0` (HIGH confidence, confirmed GitHub issue with root cause analysis)
- Recharts GitHub issue #4590 (2024): "React 19. No render inside ResponsiveContainer" — related to same React 19 production build behavior (MEDIUM confidence, same root cause as #5173)
- Vite GitHub issue #11496 and #16320: jsPDF CommonJS → ESM build failures in Vite (MEDIUM confidence, confirmed GitHub issues; fix is dynamic import or `optimizeDeps.include`)
- jsPDF-AutoTable GitHub issues #391, #459, #580: Unicode/UTF-8 character drops in table cells; font not embedded in production (HIGH confidence, multiple confirmed issues with same root cause: default fonts only support Latin-1)
- Google Apps Script Quotas docs (developers.google.com): execution time limit 6 minutes (standard), `getValues()` best practices (HIGH confidence, official docs)
- Google Apps Script Best Practices (developers.google.com): batch `getValues()` vs per-cell reads (HIGH confidence, official docs)
- Recharts bundle size: ~350KB minified (~115KB gzipped) from npm-compare.com and community benchmarks (MEDIUM confidence — not measured against this specific project; use `vite-bundle-visualizer` to confirm)
- RFC 4180 CSV format: comma, double-quote, and newline characters in cells must be quoted and escaped (HIGH confidence, IETF standard)
- Mobile Safari blob URL download limitation: `download` attribute on anchor with `blob:` URL is ignored; workaround is `window.open` or `data:` URI (MEDIUM confidence, well-documented browser compatibility issue; MDN Web Docs compatibility table)

---

*Pitfalls research for: v1.2 Admin Panel — dashboard, CSV/PDF reports, data tables, Google Sheets backend, replacing ReviewerScreen*
*Researched: 2026-05-26*
*Supersedes: The v1.0/v1.1 PITFALLS.md content remains valid for those milestone domains. This file adds v1.2-specific pitfalls only.*
