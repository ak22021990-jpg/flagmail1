# Integrations

> Generated: 2026-05-21

## Google Apps Script Web App

- **URL**: Configured in `src/config.js` as `LEADERBOARD_URL`
- **Protocol**: HTTPS POST/GET to a Google Apps Script Web App
- **Auth**: None (public endpoint, "Execute as: Me, Access: Anyone")

### POST (score submission)

- `flagmail` version: single POST with all score data at game end
- `flagmail1` version: two-POST flow
  - `action: "register"` — saves name+email when game starts
  - `action: "submit"` — updates row with scores + writes per-email raw data

### GET (email duplicate check)

- `?checkEmail=...` — returns `{ exists: bool, attempts: N }`

### Google Sheets Schema

**Summary sheet** columns:
- Timestamp, Name, Email, Status/Score, DisplayScore, Tier, Zone1, Zone2, Zone3

**RawData sheet** columns:
- Timestamp, Name, Email, EmailID, Zone, SelectedL1, SelectedL2, CorrectL1, CorrectL2, L1Correct, L2Correct, CluesUsed, TimedOut, Points

### Source Files
- `flagmail/google-apps-script.js` (v1)
- `flagmail1/google-apps-script.js` (v2 with register/submit split)

## External Data

- No external API calls during gameplay
- Email dataset is static, embedded in `src/data/emails.js` (15 emails inline)
- CSV dataset at `src/data/email_dataset.csv` (unused in code, reference only)
- Raw markdown datasets in `Dataset/` (Low.md, Medium.md, hard.md) — training reference

## No Other Integrations

- No auth provider
- No database
- No webhook
- No third-party analytics
- No CDN (fonts are self-hosted: `HomemadeApple.ttf`, `Loverine.otf`)
