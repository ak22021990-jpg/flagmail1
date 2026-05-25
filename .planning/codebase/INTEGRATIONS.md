# External Integrations

**Analysis Date:** 2026-05-25

## APIs & External Services

**Google Apps Script Web App:**
- Service: Custom GAS deployment at `LEADERBOARD_URL` in `src/config.js`
- Endpoint: `https://script.google.com/macros/s/AKfycbx5l3JRXc697eDL6uSKSaoKykqoIDKnALBtu4EdKpao-5oyYfTV3e667g8J_Y5QJJYB/exec`
- SDK/Client: Raw `fetch()` — no client library
- Auth: None (public web app); reviewer access uses passcode

**API Operations (via POST):**
- `action: "register"` — Logs player name + email on game start (`useGameState.js:140`)
- `action: "submit"` — Writes zone scores + per-email raw data (`useGameState.js:109-121`)
- `action: "submitSOC"` — Writes SOC assessment answers (`google-apps-script.js:115`)
- `action: "submitFinal"` — Writes combined zone+SOC results, sends reviewer email with CSV attachment (`google-apps-script.js:135-250`)

**API Operations (via GET):**
- `?checkEmail=...` — Check if email already registered (`google-apps-script.js:261-272`)
- `?action=getSOCSubmissions&passcode=...` — Reviewer fetches all SOC submissions (`ReviewerScreen.jsx:25`)

## Data Storage

**Databases:**
- Google Sheets (via Google Apps Script `SpreadsheetApp`)
  - Sheet ID: `1-ldYuBrFaj6I7EiXpIOxPXqgaDLM1lywlMjYVJW7FB8` in `google-apps-script.js:21`
  - Auto-created tabs: `Summary`, `RawData`, `SOCData`
  - Summary columns: Timestamp, Name, Email, Status, Score, Display Score, Tier, Zone 1-3, Violations, SOC Score, Final Score
  - RawData columns: Per-email scoring details (L1/L2 selections, clues, timing)

**File Storage:**
- Local filesystem only — no cloud storage integration

**Caching:**
- None — no Redis, no service worker cache, no IndexedDB

## Authentication & Identity

**Auth Provider:**
- None. Players provide name + email via `AuthForm.jsx` (free-text input, no SSO).
- No OAuth, no JWT, no session tokens.
- Reviewer access uses hardcoded passcode check against `PropertiesService.getScriptProperties()` (`google-apps-script.js:275-280`)

## Monitoring & Observability

**Error Tracking:**
- None. Errors logged via `console.warn()` in `useLeaderboard.js`, `useGameState.js`, `ErrorBoundary.jsx`

**Logs:**
- Google Apps Script `Logger.log()` for internal debugging (`google-apps-script.js:246`)

## CI/CD & Deployment

**Hosting:**
- GitHub Pages at `https://<org>.github.io/flagmail1/` (configured via `vite.config.js` base path)

**CI Pipeline:**
- GitHub Actions at `.github/workflows/deploy.yml`
- Trigger: push to `main` branch
- Steps: checkout → setup Node 20 → `npm ci` → `npm run build` → upload `dist/` → deploy to Pages
- Permissions: `contents: read`, `pages: write`, `id-token: write`

## Email & Notifications

**Outgoing Email:**
- Google Apps Script `MailApp.sendEmail()` in `google-apps-script.js:237-243`
- Receives CSV attachment with SOC response data
- Recipients (hardcoded):
  - `pavan.machala@sutherlandglobal.com`
  - `emilouvienna.nadela@sutherlandglobal.com`
  - `Anoop.krishnan1@sutherlandglobal.com`
  - `Sandhya.jobbin@sutherlandglobal.com`

**Proctoring:**
- Client-side tab-switch detection via `useProctoring.js` (`visibilitychange` + `blur`/`focus` events)
- Violation count submitted with results (informational only — no blocking)

## Environment Configuration

**Required config values:**
- `LEADERBOARD_URL` in `src/config.js` — Deployed Google Apps Script Web App URL

**Secrets location:**
- Google Sheet ID hardcoded in `google-apps-script.js:21` (deployed as GAS project)
- Reviewer passcode stored in GAS `PropertiesService` (set via GAS editor)
- No `.env` files used

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- Score submission via POST to GAS endpoint (same as leaderboard URL)

## Client-Side Data Loading

**CSV Dataset:**
- File `src/data/email_dataset.csv` present but not imported via papaparse at runtime
- Data instead inlined in `src/data/emails.js` as JS array (15 email objects)

---

*Integration audit: 2026-05-25*
