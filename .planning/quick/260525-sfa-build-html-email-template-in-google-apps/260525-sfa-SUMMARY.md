---
quick_id: 260525-sfa
status: complete
date: 2026-05-25
---

# Quick Task 260525-sfa: HTML Email Results Template

## What Changed

**File:** `google-apps-script.js`

1. Added `buildResultsHtml(payload, socScaled, finalScore, tierVal)` helper function that generates a complete HTML email replicating the ResultsScreen visual layout.

2. Added `_zoneCell(label, name, score, max, accent)` helper for rendering individual zone score cards.

3. Updated the `submitFinal` action to call `buildResultsHtml()` and pass the result as `htmlBody` to `MailApp.sendEmail()`. The plain-text body is preserved as a fallback.

## HTML Email Design

- **Layout:** Email-safe table-based layout (no flexbox/grid) at 640px max-width
- **Header:** Dark gradient header with candidate name and score bubble
- **Tier badge:** Color-coded pill (Advanced=#34C759, Proficient=#FF9500, Foundation=#8E8E93)
- **Zone cards:** Three-column zone breakdown with accent colors matching the app (Zone 1=#0A84FF, Zone 2=#30B0C7, Zone 3=#FF7A1A)
- **SOC section:** Purple-accented card (#7B2D8E) showing SOC Investigation score /40
- **Combined score:** Full-width card showing final /100
- **SOC detail table:** Per-question breakdown with score and grade (color-coded)
- **Proctoring:** Violation count with red/green indicator
- **Footer:** CSV attachment note and FlagMail branding

## What's Preserved

- Plain-text `body` remains as fallback for clients that don't render HTML
- CSV attachment unchanged
- Recipient list unchanged
- Quota checking and error handling unchanged
