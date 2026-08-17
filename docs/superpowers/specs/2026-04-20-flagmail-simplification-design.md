# Flagmail Simplification & Design Enhancement
**Date:** 2026-04-20
**Status:** Approved
**Approach:** Surgical — minimal changes to existing codebase, preserve all polished UI work

---

## Context

Flagmail is a mail-moderation hiring assessment game. Management has flagged it as too challenging. This spec defines a simplified version that:
- Tests core mail moderation instincts (not expert subcategory recall)
- Uses a new, clearer dataset with more accessible signals
- Renames zones to thematic names aligned with email moderation workflows
- Elevates the visual design within the existing glassmorphism aesthetic

---

## Section 1: Dataset & Data Model

### New Dataset
Replace `src/data/emails.js` EMAIL_POOL with 30 emails sourced from:
- `Dataset/Low.md` → Zone 1 (10 emails, easy signals)
- `Dataset/Medium.md` → Zone 2 (10 emails, moderate signals)
- `Dataset/hard.md` → Zone 3 (10 emails, sophisticated signals)

### New Email Object Shape
```js
{
  id: "E001",
  zone: 1,                          // 1 | 2 | 3
  from: "money.transfer772@gmail.com",
  subject: "URGENT: YOUR $100,000,000.00 IS READY",
  body: "...",
  clue: "A Prince wouldn't use a random @gmail.com...",  // single string
  level1: "Phishing & Spoofing",    // only field scored
  subCategory: "Email Phishing",    // shown in explanation, not scored
  explanation: "...",               // post-submit learning text
}
```

### L1 Categories (trimmed from 6 → 3)
```js
export const L1_CATEGORIES = [
  { id: "Legitimate",          label: "Legitimate",          color: "#34C759" },
  { id: "Spam & Junk",         label: "Spam & Junk",         color: "#FF9500" },
  { id: "Phishing & Spoofing", label: "Phishing & Spoofing", color: "#FF3B30" },
];
```

### Shared Zone Config (new export in `src/data/emails.js`)
A single authoritative zone config used by ZoneIntroCard, ZoneComplete, GameRound, and App:
```js
export const ZONE_CONFIG = {
  1: { name: "The Inbox",      difficulty: "Easy",   emails: 10, icon: "📬", mission: "Clear the inbox. Trust your instincts." },
  2: { name: "The Queue",      difficulty: "Medium", emails: 10, icon: "🗂",  mission: "The queue is getting trickier. Stay sharp." },
  3: { name: "The Escalation", difficulty: "Hard",   emails: 10, icon: "🚨", mission: "These are the hardest calls. Think carefully." },
};

export const MAX_POINTS_PER_EMAIL = 2;
export const TOTAL_EMAILS = 30;
export const MAX_SCORE = MAX_POINTS_PER_EMAIL * TOTAL_EMAILS; // 60
export const MAX_POINTS_PER_ZONE = MAX_POINTS_PER_EMAIL * 10; // 20
```

### Removed Exports
- `L2_BY_L1` — removed entirely
- `TAXONOMY` — removed entirely
- Categories removed: Malicious Content, Abuse & Harassment, High-Risk Fraud

---

## Section 2: Classification UI & Clue System

### Classifier.jsx
- **L2 row removed entirely** — no subcategory selection
- **`onSelectL2` prop removed** — prop threading cleaned up in `GameRound.jsx` and `App.jsx`
- **3 L1 buttons only** styled as native selection chips
- Section label changes from "L1 — THREAT CATEGORY" → "CLASSIFY THIS EMAIL"
- Tooltips simplified to cover only 3 categories (desc + signals)
- Selected state: spring-animated scale pop + category color fill

### Clue System
- **`ClueSystem.jsx` deleted** — replaced by inline hint UI in `GameRound.jsx`
- **1 hint per email** sourced from `email.clue` (single string, not an array)
- Rendered as a native "More Info" tap pattern inside the email card:
  - `ⓘ` icon button labelled "Reveal Hint" positioned below the email body
  - On click: spring-animated amber inset card appears **below the email body, inside the email card**
  - Button disappears after reveal (one-time use per email)
  - Once revealed, trigger replaced with a subtle "Hint shown" ghost label
- **No point deduction** for using the hint
- `cluesRevealed` array state replaced with a `hintRevealed` boolean in `useGameState.js`
- Hint card style: `rgba(255,193,7,0.08)` background, amber left-border accent, italic hint text

### useGameState.js
- `ZONE_EMAIL_COUNTS` → `{ 1: 10, 2: 10, 3: 10 }` (Zone 3 was 5, now 10)
- `zoneEnd` derived value updated: `zone === 1 ? 10 : zone === 2 ? 20 : 30` (was `25` for zone 3)
- `hintRevealed` boolean replaces `cluesRevealed` array in round state
- `revealClue(index)` action replaced with `revealHint()` (toggles boolean to true, idempotent)
- `selectL2` action and state removed
- **Early unlock threshold updated:** `record.points === 2` (was `=== 4`) — 2 pts is now a perfect round
- `initialRoundState()` shape updated:
  ```js
  function initialRoundState() {
    return {
      hintRevealed: false,   // replaces cluesRevealed: []
      selectedL1: null,
      // selectedL2 removed
      submitted: false,
      timedOut: false,
      lastRecord: null,
    };
  }
  ```

### useScoring.js
- Scoring: Correct L1 = **2 pts**, Wrong = **0 pts**
- `l2Points`, `clueDeduction`, `l2Correct` fields removed from scoring record
- `cluesUsed` field replaced with `hintUsed: boolean` in scoring record
- `categoryCorrect` initialised with only the 3 active categories (see reset state below)
- Max possible score: 30 emails × 2 pts = **60 pts**

```js
// Reset state
categoryCorrect: {
  'Legitimate':          { correct: 0, total: 0 },
  'Spam & Junk':         { correct: 0, total: 0 },
  'Phishing & Spoofing': { correct: 0, total: 0 },
}
```

### App.jsx — Clue/L2 wiring cleanup
- **`handleSubmit`**: Update the full `sc.scoreRound(...)` call — remove `selectedL2` and replace `cluesRevealed` with `hintRevealed`:
  ```js
  // Old:
  sc.scoreRound({ email, selectedL1: round.selectedL1, selectedL2: timedOut ? null : round.selectedL2, cluesRevealed: round.cluesRevealed, timedOut })
  // New:
  sc.scoreRound({ email, selectedL1: round.selectedL1, hintRevealed: round.hintRevealed, timedOut })
  ```
- **`<GameRound>` render block**: Rename prop `onRevealClue={gs.revealClue}` → `onRevealHint={gs.revealHint}`, remove `onSelectL2={gs.selectL2}`
- Remove `onSelectL2` prop threading to `GameRound`
- Remove `cluesUsed` aggregations — replace with `hintUsed` boolean aggregations:
  ```js
  // Old:
  const zoneCluesUsed = zoneEmails.reduce((sum, r) => sum + r.cluesUsed, 0);
  bg.checkAfterZone({ zoneEmails, zoneCluesUsed, zone: gs.zone });
  // New:
  const zoneHintsUsed = zoneEmails.filter(r => r.hintUsed).length;
  bg.checkAfterZone({ zoneEmails, zoneHintsUsed, zone: gs.zone });

  // Old:
  const totalCluesUsed = sc.perEmail.reduce((sum, r) => sum + r.cluesUsed, 0);
  bg.checkAfterGame({ perEmail: sc.perEmail, totalCluesUsed });
  // New:
  const totalHintsUsed = sc.perEmail.filter(r => r.hintUsed).length;
  bg.checkAfterGame({ perEmail: sc.perEmail, totalHintsUsed });
  ```
- Update leaderboard title thresholds for 60pt max:
  ```js
  // Old (invalid for 60pt max):
  score >= 70 ? 'Threat Intelligence Lead' : score >= 40 ? 'Senior Analyst' : 'Junior Analyst'
  // New:
  score >= 50 ? 'Threat Intelligence Lead' : score >= 30 ? 'Senior Analyst' : 'Junior Analyst'
  ```
- Fix `maxZoneScore` prop passed to `ZoneComplete`: all zones = `MAX_POINTS_PER_ZONE` (20), not 40/20

---

## Section 3: Zone Names & Structure

### Zone Mapping
| # | Old Name        | New Name           | Difficulty | Emails |
|---|----------------|--------------------|------------|--------|
| 1 | Flag Academy    | **The Inbox**      | Easy       | 10     |
| 2 | Shadow Inbox    | **The Queue**      | Medium     | 10     |
| 3 | Zero-Day Vault  | **The Escalation** | Hard       | 10     |

Zone names are driven exclusively from `ZONE_CONFIG` (defined in Section 1). No component hardcodes zone names — all consume `ZONE_CONFIG[zone].name`.

### Code Changes
- All user-facing "Zone 1/2/3" labels replaced with `ZONE_CONFIG[zone].name`
- `GameRound.jsx` header: `Zone {zone} · {emailInZone}/{emailsInZone}` → `{ZONE_CONFIG[zone].name} · {emailInZone}/{emailsInZone}`
- `ZoneIntroCard.jsx`: `ZONES` local array deleted — replaced by `ZONE_CONFIG` import
- `ZoneComplete.jsx`: `ZONE_META` local constant deleted — replaced by `ZONE_CONFIG` import
- Early unlock mechanic kept, threshold updated (see Section 2)

---

## Section 4: Results, Competency & Leaderboard

### ResultsScreen.jsx / CompetencySummary.jsx
- Category breakdown shows 3 categories only
- Max score display updated to `MAX_SCORE` (60 pts)
- Zone score labels use `ZONE_CONFIG[zone].name`
- Category accuracy shown as **circular progress rings** (Activity ring style) — see Section 5.5

### ExplanationCard.jsx
- L2 correct/incorrect row removed
- `subCategory` shown as a read-only pill label (e.g., "Email Phishing") for learning context, not scored
- Scoring breakdown: L1 correct ✓/✗ and pts earned only

### Leaderboard
- No structural changes — name, email, total score submitted as before
- Score ceiling changes from 100 → 60; ranking logic unaffected

### Badges — useBadges.js (updated conditions)
The following badge conditions and descriptions break after the scoring/category change and must be updated:

| Badge | Old Condition | New Condition | Updated `desc` |
|-------|--------------|---------------|----------------|
| **EAGLE_EYE** | `categoriesCorrect.size >= 6` | `categoriesCorrect.size >= 3` | "Correctly identified all 3 email categories" |
| **SNIPER** | `l1Correct && l2Correct && cluesUsed === 0 && timeLeft > X` | `l1Correct && !hintUsed && timeLeft > X` | "Classified correctly, no hint, with time to spare" |
| **PERFECT_EYE** | `perEmail.length === 25 && every(r => r.l1Correct && r.l2Correct)` | `perEmail.length === 30 && every(r => r.l1Correct)` | "All 30 emails classified correctly" |
| **ICE_COLD** | `hardEmails.length === 5 && every(r => r.l1Correct && r.l2Correct ...)` | `hardEmails.length === 10 && every(r => r.l1Correct ...)` | "All 10 Escalation emails classified correctly" |
| **NO_HINTS_NEEDED** | `totalCluesUsed === 0` | `totalHintsUsed === 0` | "Completed the full assessment without revealing any hints" |
| **GHOST_DETECTIVE** | checks `r.cluesUsed` | checks `r.hintUsed` | *(no desc change needed)* |

`checkAfterZone` and `checkAfterGame` hook signatures updated:
```js
// Old: checkAfterZone({ zoneEmails, zoneCluesUsed, zone })
// New: checkAfterZone({ zoneEmails, zoneHintsUsed, zone })

// Old: checkAfterGame({ perEmail, totalCluesUsed })
// New: checkAfterGame({ perEmail, totalHintsUsed })
```
All internal references to `r.cluesUsed` and `totalCluesUsed` replaced with `r.hintUsed` and `totalHintsUsed` respectively.

---

## Section 5: Design Enhancements

All enhancements stay strictly within the glassmorphism aesthetic (glassmorphism, spring physics, system fonts, semantic colours). No aesthetic direction change — elevation only.

### 5.1 Email Card → Mail Client Fidelity
Make `EmailCard.jsx` look like a native desktop mail client message:
- **Sender avatar**: circular badge with initials, coloured by first-letter hash
- **Timestamp**: formatted as "Today at 3:42 PM" (relative)
- **Header/body separator**: 0.5px hairline divider (`rgba(0,0,0,0.1)`)
- **Body typography**: system font at 15px, `#3A3A3C`, line-height 1.65
- **Subject**: system font semibold, `#1C1C1E`
- **From field**: sender name in `#1C1C1E`, email address in `rgba(60,60,67,0.55)` inline

### 5.2 Classifier → Chip Selection
- Buttons restyled as compact tag/chip components
- **Unselected**: white/5% opacity, 1px `rgba(0,0,0,0.08)` border, `#1C1C1E` text
- **Selected**: category color at 12% opacity fill, 1.5px solid category color border, spring scale pop to 1.04 on select
- Chips laid out in a single horizontal row (3 categories fit cleanly)

### 5.3 Zone Intro → Arcade Hero Screen
- Zone name rendered in a rounded display font
- Zone name as oversized display hero (font-size 38px, weight 800)
- Zone icon enlarged to 52px; sits in a 72×72 pill with category-coloured glow shadow
- Background: subtle animated gradient mesh behind the glass card (slow drift, 8s loop)

### 5.4 Hint Reveal → Disclosure Pattern
- Hint trigger: `ⓘ` icon + "Reveal Hint" label, styled as a tappable info row
- **Placement**: inset card appears **below the email body, inside the email card** (not above)
- Reveal animation: spring-in slide-down from the trigger point
- Hint card: `rgba(255,193,7,0.08)` background, amber left-border accent, italic hint text
- Once revealed, trigger button replaced with a subtle "Hint shown" ghost label

### 5.5 Results → Health Dashboard Aesthetic
- Per-category accuracy shown as three **circular progress rings** (activity ring style)
  - Ring color matches category color (green/orange/red)
  - Animated draw-on using `stroke-dasharray` / `stroke-dashoffset`
  - Accuracy % displayed in center of each ring
- Zone scores displayed in a 3-column stat card row with zone name, score, and a mini bar
- Overall score shown as a large hero number with a contextual tier label:
  - ≥ 50 pts → "Threat Intelligence Lead"
  - ≥ 30 pts → "Senior Analyst"
  - < 30 pts → "Junior Analyst"

---

## Files to Modify

| File | Change |
|------|--------|
| `src/data/emails.js` | Replace EMAIL_POOL (30 new emails), trim L1_CATEGORIES to 3, remove L2_BY_L1 & TAXONOMY, add ZONE_CONFIG & score constants |
| `src/components/Classifier.jsx` | Remove L2 row & onSelectL2 prop, update tooltips, restyle as chips |
| `src/components/GameRound.jsx` | Remove ClueSystem usage, add inline hint UI, remove onSelectL2 prop, update zone label |
| `src/components/ZoneIntroCard.jsx` | Replace local ZONES array with ZONE_CONFIG, rounded display font title, hero layout |
| `src/components/ZoneComplete.jsx` | Replace ZONE_META with ZONE_CONFIG, update zone name display |
| `src/components/ExplanationCard.jsx` | Remove L2 row, add subCategory pill, simplify scoring breakdown |
| `src/components/EmailCard.jsx` | Mail client fidelity redesign (avatar, timestamp, typography) |
| `src/components/ResultsScreen.jsx` | Ring charts, zone name labels, 60pt max, tier thresholds |
| `src/components/CompetencySummary.jsx` | 3 categories only, ring chart visualization |
| `src/components/TutorialScreen.jsx` | Update content to reflect 3 categories and single-hint system |
| `src/components/LandingScreen.jsx` | Audit and update any references to scoring mechanics or category counts |
| `src/hooks/useGameState.js` | ZONE_EMAIL_COUNTS updated, hintRevealed boolean, selectL2 removed, perfect threshold = 2 |
| `src/hooks/useScoring.js` | Remove L2/clue deduction logic, hintUsed boolean, 3 categories only |
| `src/hooks/useBadges.js` | Update EAGLE_EYE, SNIPER, PERFECT_EYE, ICE_COLD conditions (see Section 4) |
| `src/App.jsx` | Remove cluesUsed aggregation, remove onSelectL2 wiring, fix title thresholds, fix maxZoneScore prop |

### Files to Delete
| File | Reason |
|------|--------|
| `src/components/ClueSystem.jsx` | Replaced by inline hint UI in GameRound.jsx |

---

## What Does Not Change

- Timer mechanic
- Leaderboard submission structure
- Overall app routing / screen flow
- Background gradient
- Spring animation physics (Framer Motion)
- Badge animations and toast display
- HelloIntro screen
