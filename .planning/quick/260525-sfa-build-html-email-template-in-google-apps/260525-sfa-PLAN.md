---
quick_id: 260525-sfa
description: Build HTML email template in Google Apps Script that visually replicates ResultsScreen layout
slug: build-html-email-template-in-google-apps
tasks: 1
---

# Quick Task: HTML Email Results Template

## Task 1: Replace plain-text email body with HTML template in submitFinal

**Files:** `google-apps-script.js`
**Action:** Replace the `bodyLines` plain-text email construction (lines 222-239) with an `htmlBody` that visually replicates the ResultsScreen layout using inline CSS.

**Details:**
- Create `buildResultsHtml(payload)` helper function that returns an HTML string
- Match ResultsScreen visual hierarchy: hero score + tier badge, zone breakdown cards, SOC card, combined score
- Use email-safe inline CSS (no flexbox/grid — use tables for layout)
- Color scheme from ResultsScreen: Zone 1 `#0A84FF`, Zone 2 `#30B0C7`, Zone 3 `#FF7A1A`, SOC `#7B2D8E`
- Tier colors: Advanced `#34C759`, Proficient `#FF9500`, Foundation `#8E8E93`
- Keep the CSV attachment
- Keep plain `body` as fallback for email clients that don't render HTML
- Use `htmlBody` parameter in `MailApp.sendEmail()` alongside existing `body`

**Verify:** The GAS function returns valid HTML; `MailApp.sendEmail` called with `htmlBody` param
**Done:** Email contains visual results layout matching ResultsScreen design
