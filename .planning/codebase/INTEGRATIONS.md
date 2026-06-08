# External Integrations

**Analysis Date:** 2026-06-08

## APIs & External Services

**Google Apps Script Web App:**
- Service: Custom GAS deployment serving as the sole backend
- Endpoint (configured in `src/config.js`):
  `https://script.google.com/macros/s/AKfycbw51_etJnBWQ74R4YBt8OPmEAXH5y3x9MQOkZaVMGhOlinvNKUjucnAZiOcGwwjAj9_/exec`
- SDK/Client: Raw `fetch()` — no SDK or client library
- Auth: None for write operations (public endpoint). Reviewer/admin access gated by passcode checked server-side.
- CORS mode: `no-cors` for score submission via `useLeaderboard.js` (responses are opaque). Admin/reviewer calls use normal mode and parse JSON responses.

**POST Actions (all send `Content-Type` as plain body JSON):**

| Action | Caller | What it writes |
|--------|--------|----------------|
| `register` | `src/hooks/useGameState.js` | Player name + email on game start → Summary sheet |
| `submit` | `src/hooks/useGameState.js` | Zone 1-3 scores + per-email raw data → Summary + RawData sheets |
| `submitSOC` | `src/hooks/useSocState.js` | SOC question answers (SPL text, explanation, score, grade) → SOCData sheet |
| `submitFinal` | `src/hooks/useSocState.js` | Combined zone + SOC final score → Summary col 12-13 + SOCData sheet |
| `getAdminData` | `src/hooks/useAdmin.js` | Passcode-gated: returns candidates + rawData + socData JSON |

**GET Actions:**

| Query Param | Caller | Returns |
|-------------|--------|---------|
| `?checkEmail=<email>` | `src/components/LandingScreen.jsx` | `{ exists: boolean }` — duplicate-entry guard |
| `?action=getSOCSubmissions&passcode=<code>` | `src/components/ReviewerScreen.jsx:25` | Array of SOC submissions grouped by candidate |

## Data Storage

**Google Sheets (via `SpreadsheetApp` in `google-apps-script.js`):**
- Sheet ID: `1-ldYuBrFaj6I7EiXpIOxPXqgaDLM1lywlMjYVJW7FB8` (hardcoded in `google-apps-script.js:34`)
- Tabs auto-created on first write:

  **Summary tab** — one row per candidate:
  `Timestamp, Name, Email, Status, Score, Display Score, Tier, Zone 1, Zone 2, Zone 3, Proctoring Violations, Zone 4 (SOC), Final Score /100`

  **RawData tab** — one row per email classification:
  `Timestamp, Name, Email, Email ID, Zone, Selected L1, Selected L2, Correct L1, Correct L2, L1 Correct, L2 Correct, Clues Used, Timed Out, Points`

  **SOCData tab** — one row per SOC question answered:
  `Timestamp, Name, Email, Question ID, Score, Grade, SPL Text, Explanation, Proctoring Violations`

**File Storage:**
- Local filesystem only. No cloud file storage (no S3, no GCS, no Supabase storage).
- Static assets served from `dist/` via GitHub Pages.

**Client-Side Storage:**
- `sessionStorage` — `src/hooks/useSocState.js:165` — SOC payload failover key `"socSubmission"` if fetch fails
- `localStorage` — `src/components/LandingScreen.jsx:34,65` — Re-attempt guard key `ATTEMPT_KEY`

**Caching:**
- None. No Redis, no service worker cache, no IndexedDB.

## Authentication & Identity

**Players:**
- No authentication. Free-text name + email collected in `src/components/AuthForm.jsx`.
- No OAuth, no JWT, no session tokens.
- Email uniqueness checked via `?checkEmail=` GET call to GAS before game starts.
- Re-attempt prevention via `localStorage` flag (client-side only — can be cleared).

**Reviewer / Admin Access:**
- Shared passcode only — entered in `src/components/ReviewerScreen.jsx` and `src/components/AdminPanel.jsx`.
- Passcode verified server-side: `PropertiesService.getScriptProperties().getProperty('REVIEWER_PASSCODE')` in `google-apps-script.js:389`.
- No identity provider. No OAuth. Passcode is set manually via the GAS editor Script Properties UI.
- Two separate reviewer interfaces:
  - `ReviewerScreen.jsx` — SOC submission review (uses GET `getSOCSubmissions`)
  - `AdminPanel.jsx` + `useAdmin.js` + `CandidateList.jsx` — Full admin dashboard (uses POST `getAdminData`, returns candidates + rawData + socData)

## Monitoring & Observability

**Error Tracking:**
- None. No Sentry, no Datadog, no external error service.
- Errors logged via `console.warn()` in `src/hooks/useLeaderboard.js`, `src/hooks/useGameState.js`, `src/components/ErrorBoundary.jsx`.
- SOC submission catch block silently swallows errors (`catch (_) {}`).

**Server-Side Logs:**
- Google Apps Script `Logger.log()` available in GAS executions tab (`google-apps-script.js:246` area).
- No structured logging.

## CI/CD & Deployment

**Hosting:**
- GitHub Pages at `https://<org>.github.io/flagmail1/`
- Base path `/flagmail1/` configured in `vite.config.js`

**CI Pipeline (`/.github/workflows/deploy.yml`):**
- Trigger: push to `main` branch
- Runner: `ubuntu-latest`
- Steps: `actions/checkout@v4` → `actions/setup-node@v4` (Node 20, npm cache) → `npm ci` → `npm run build` → `actions/upload-pages-artifact@v3` (uploads `dist/`) → `actions/deploy-pages@v4`
- Permissions: `contents: read`, `pages: write`, `id-token: write`
- Concurrency group: `pages` with `cancel-in-progress: true`

**GAS Deployment (manual):**
- Separate from GitHub deployment. Requires manual redeploy via GAS editor after changes.
- Checklist in `google-apps-script.js:13-20` for OAuth re-authorization after MailApp changes.

## Email & Notifications

**Outgoing Email (Google Apps Script `MailApp.sendEmail()`):**
- Triggered by `action: "submitFinal"` in `google-apps-script.js`
- Sends CSV attachment of SOC response data to reviewers
- Recipients hardcoded in `google-apps-script.js`:
  - `pavan.machala@sutherlandglobal.com`
  - `emilouvienna.nadela@sutherlandglobal.com`
  - `Anoop.krishnan1@sutherlandglobal.com`
  - `Sandhya.jobbin@sutherlandglobal.com`
- Requires OAuth re-authorization in GAS editor when MailApp scope is added or changed
- Note: `submitFinal` action in the current GAS code (lines 148-198) does NOT call `MailApp.sendEmail()` — the email sending referenced in original docs may have been removed in the latest version.

## Proctoring (Client-Side)

**Tab-Switch Detection (`src/hooks/useProctoring.js`):**
- Listens to `visibilitychange` and `blur`/`focus` browser events
- Violation count incremented on each tab switch
- Submitted with zone and SOC results as `proctoring_violations` field
- Informational only — no game blocking, no disqualification logic

## Client-Side Data Export

**CSV Download (`src/utils/exportCsv.js`):**
- `downloadCsv(rows, filename)` — generates CSV in-browser via `Blob` + `URL.createObjectURL` + programmatic `<a>` click
- Used in `AdminPanel.jsx` to allow admins to download candidate or SOC data locally
- No server-side involvement

## Environment Configuration

**Required config values:**
- `LEADERBOARD_URL` in `src/config.js` — Deployed GAS Web App `/exec` URL. Change this when redeploying GAS.

**Secrets location:**
- Google Sheet ID hardcoded in `google-apps-script.js:34` (inside the GAS project, not in this repo's `src/`)
- Reviewer passcode stored in GAS `PropertiesService` — set via GAS editor, never in source code
- No `.env` files in this project

## Webhooks & Callbacks

**Incoming:** None

**Outgoing:**
- Score submission POST to GAS endpoint (fire-and-forget with `no-cors` mode in `useLeaderboard.js`)
- Admin data POST to GAS endpoint (with response parsing in `useAdmin.js`)

---

*Integration audit: 2026-06-08*
