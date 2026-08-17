# Flagmail v2 — Design Spec
**Date:** 2026-04-22
**Demo deadline:** ~2 hours from authoring

---

## Overview

Six targeted improvements to Flagmail to make it a stronger email-security hiring test: richer email metadata, difficulty-appropriate content, a reasoning layer on top of L1/L2 classification, a smaller focused dataset, a 100-point scoring system, and contextual cues for ambiguous emails.

---

## 1. Email Header Panel (Collapsible)

### What
A collapsed header row sits above the email body in `EmailCard`. Default state: collapsed, showing a chevron + label "Email Headers". On tap it expands to reveal technical metadata.

### Fields
| Label | Content | Notes |
|-------|---------|-------|
| From | "Customer Support" | **Display name only** — the human-readable sender name |
| Sender | security-alert@techco-id-support.net | Raw mailer address (often the giveaway) |
| Reply-To | reply@clickfarm.ru | Where replies actually go |
| Subject | Your account has been LOCKED | Mirrors the subject line |
| Auth | SPF: Pass · DKIM: Fail · DMARC: Pass | Color-coded: Pass=green, Fail=red |
| Origin IP | 185.220.101.42 (RU) | Country code appended where useful |

### Data fields added to each email
```js
fromName:  "Customer Support",           // replaces the display role of email.from
sender:    "security@techco-id.net",     // raw mailer address
replyTo:   "reply@clickfarm.ru",         // reply-to address
auth:      { spf: "Pass", dkim: "Fail", dmarc: "Pass" },
originIp:  "185.220.101.42 (RU)",
```

**`email.from` field:** Keep it as-is in the dataset (used internally). `EmailCard` must be updated to render `email.fromName` wherever it previously rendered `email.from` as a display name. The `EmailHeaderPanel` uses `fromName` + `sender` + `replyTo`. The existing `from` field is no longer directly shown to the user.

### Difficulty alignment
- **Zone 1:** Obvious failures — DKIM Fail, mismatched Sender, foreign IP, disposable Reply-To
- **Zone 2:** One or two subtle mismatches — SPF Pass but DKIM Fail, plausible-looking Sender with one wrong character
- **Zone 3:** Intentionally confusing — all auth passes with a unicode-spoofed domain, or legitimate-looking IP with a policy gap

### Component
New `EmailHeaderPanel` component rendered inside `EmailCard`, above the body. Controlled by local `useState(false)` for open/closed. Use a plain `ℹ` unicode character (not emoji, not an icon library) for the info indicator — renders consistently cross-platform.

---

## 2. Email Bodies — Difficulty by Zone

### What
Rewrite the body text of the 15 kept emails to match difficulty expectations.

### Zone contracts
| Zone | Tone | Red flags |
|------|------|-----------|
| 1 — Easy | ALL CAPS, grammar errors, broken English, urgent threats, obvious fake domain | 3+ visible in body alone |
| 2 — Medium | Polished, professional tone, one clear tell (wrong domain, suspicious link) | 1–2, require mild attention |
| 3 — Hard | Indistinguishable from real corporate email; only header metadata or one unicode character gives it away | 0–1 in body; must check headers |

### Dataset reduction
`ZONE_EMAIL_COUNTS` in `useGameState.js` changes from `{1:10, 2:10, 3:5}` → `{1:5, 2:5, 3:5}`.

In `shuffle.js`, the `.slice(0, 10)` calls for zones 1 and 2 must change to `.slice(0, 5)` to match. (Zone 3 already slices to 5 — no change needed there.)

In `useGameState.js`, the hard-coded `zoneStart`/`zoneEnd` indices must also be updated:
```js
// Before
const zoneStart = zone === 1 ? 0 : zone === 2 ? 10 : 20;
const zoneEnd   = zone === 1 ? 10 : zone === 2 ? 20 : 25;

// After
const zoneStart = zone === 1 ? 0 : zone === 2 ? 5 : 10;
const zoneEnd   = zone === 1 ? 5 : zone === 2 ? 10 : 15;
```

Select the 5 strongest/most representative emails per zone from the existing pool and rewrite their `body` fields to match zone difficulty.

---

## 3. Reasoning Question Modal

### What
After the user hits **Submit** on their L1+L2 classification, a modal overlay appears before `ExplanationCard` loads. The user answers one multiple-choice question about why they made their classification decision, then the modal dismisses and `ExplanationCard` loads.

### Game flow change
A new screen state `SCREENS.REASONING` is inserted between `SCREENS.ROUND` and `SCREENS.EXPLANATION`.

```
User hits Submit
  → scoreRound() called (L1+L2 points awarded)
  → screen → SCREENS.REASONING
  → ReasoningModal renders as overlay
  → User picks an option and taps Confirm (or taps Skip)
  → reasoningRound() called (if answered, +1 if correct)
  → screen → SCREENS.EXPLANATION
```

`submitRound()` in `useGameState.js` is split: calling `onSubmit` now sets screen to `SCREENS.REASONING` instead of directly to `SCREENS.EXPLANATION`. A new `onReasoningComplete` handler transitions from `SCREENS.REASONING` → `SCREENS.EXPLANATION`.

### Modal content
```
"Why did you classify this as [L1]?"     ← uses email.reasoningQuestion if L1 was correct
"The correct category was [L1]. Why?"   ← prefix override when L1 was wrong; same options shown

○ The sender domain didn't match the brand it claims to be   ← correct for this email
○ It threatened immediate account deletion
○ It asked for personal information via email
○ The email used excessive urgency

[ Skip ]    [ Confirm ]
```

- **Skip:** Modal dismisses without scoring. No point awarded. Proceeds to ExplanationCard.
- **Confirm with selection:** +1 if correct, +0 if wrong. Brief "+1" toast shown before dismiss.
- **Confirm without selection:** Button is disabled until an option is picked.

### Data fields per email
```js
reasoningQuestion: "Why is this a phishing email?",
reasoningOptions: [
  "The sender domain doesn't match the brand it claims to be",  // index 0 — correct
  "It threatened immediate account deletion",
  "It asked for personal information via email",
  "The email used excessive urgency",
],
correctReason: 0,   // index of the correct option
```

Options are **specific to each email** — written to match that email's most diagnostic signal. The correct option is always the single most definitive reason, not a secondary observation. Distractors are plausible but secondary or misleading for that particular email.

### Scoring integration
- Reasoning result added to the per-email record in `useScoring.js`:
```js
record = {
  ...existingFields,
  reasoningCorrect: boolean,
  reasoningPoints: 0 | 1,
}
```
- `scoreRound()` handles L1+L2 as before. A new `scoreReasoning({ emailId, correct })` method on `useScoring` works as follows:
  1. Find the existing record in `perEmail` by `emailId`
  2. Replace it with `{ ...record, reasoningCorrect: correct, reasoningPoints: correct ? 1 : 0 }`
  3. Add `reasoningPoints` to `totalScore`
  ```js
  setPerEmail(prev => prev.map(r =>
    r.emailId === emailId
      ? { ...r, reasoningCorrect: correct, reasoningPoints: correct ? 1 : 0 }
      : r
  ));
  if (correct) setTotalScore(prev => prev + 1);
  ```

### Perfect-round threshold
`useGameState.js` checks `record.points === 4` for `consecutivePerfect` / `earlyUnlocked` logic inside `submitRound`. Because `scoreReasoning()` is called *after* `submitRound` (reasoning hasn't been answered yet), this check must move to `onReasoningComplete`. Inside `onReasoningComplete`, after `scoreReasoning()` resolves, check: `lastRecord.points + reasoningPoints === 5` to determine a perfect round.

---

## 4. Dataset — 15 Emails (5 per Zone)

See Section 2 for all code changes. The `EMAIL_POOL` in `emails.js` keeps all emails (for future use) but only the selected 5 per zone are drawn by the shuffle/slice logic.

---

## 5. Scoring — Normalized to 100

### Raw point system
| Action | Points |
|--------|--------|
| L1 correct | +2 |
| L2 correct (requires L1 correct, not timed out) | +2 |
| Each clue revealed | −1 (from L1+L2 earned points only, floor 0) |
| Reasoning correct | +1 (never subject to clue deduction) |

Clue deductions apply only to the L1+L2 subtotal (max 4). The reasoning point is always a clean +1 or +0, unaffected by clues.

### Maximum raw score
15 emails × 5 pts (L1+L2+reasoning, no clues) = **75 raw max**

### Display
```js
displayScore = Math.round((rawScore / 75) * 100)   // 0–100
```

All user-facing score displays use `displayScore`:
- `ZoneComplete` — show zone raw and normalized total
- `ResultsScreen` — show final score as X / 100
- `Leaderboard` — rank by normalized score
- `ExplanationCard` — show points earned this round as raw (e.g. "+3 pts") not normalized
- `GameRound` — if a running score is shown, use normalized value

`maxZoneScore` prop passed to `ZoneComplete` = 25 (5 emails × 5 pts max). `ZONE_EMAIL_COUNTS` is not exported from `useGameState.js`. Compute this in `App.jsx` as `gs.emailsInZone * 5`, where `gs.emailsInZone` is already returned from `useGameState`. If `emailsInZone` is not in the return object, add it.

---

## 6. User Context for Ambiguous Emails

### What
A subtle one-line context card shown **above the email body** on Zone 2 and Zone 3 emails where classification depends on situational knowledge not visible in the email body itself.

### Examples
> *"Your account shows no recent login from Beijing."*
> *"This email arrived 3 minutes after you reset your password."*
> *"You have no active subscriptions with this service."*

### Data field
```js
userContext: "Your account shows no recent login from Beijing.",
// null (or omitted) on emails where context is not relevant
```

### UI
Rendered as a small muted info-bar between the subject line and the email body. Only rendered when `userContext` is non-null. Use a plain `ℹ` character as the icon.

---

## Files Changed

| File | Change |
|------|--------|
| `src/data/emails.js` | Add 9 new fields per email, select 5/zone, rewrite bodies by difficulty |
| `src/hooks/useGameState.js` | Update `ZONE_EMAIL_COUNTS`, `zoneStart`/`zoneEnd`, add `SCREENS.REASONING`, `onReasoningComplete`, update perfect-round threshold |
| `src/hooks/useScoring.js` | Add `scoreReasoning()`, add reasoning fields to per-email record, export `displayScore` |
| `src/utils/shuffle.js` | Update zone 1+2 slice from 10→5; update JSDoc comment to reflect new pool sizes |
| `src/components/EmailCard.jsx` | Render `fromName` instead of `from`; add `EmailHeaderPanel`; add `userContext` info-bar |
| `src/components/EmailHeaderPanel.jsx` | **New** — collapsible header metadata panel |
| `src/components/ReasoningModal.jsx` | **New** — reasoning question modal overlay |
| `src/components/GameRound.jsx` | Trigger reasoning flow after submit; remove direct ExplanationCard transition |
| `src/components/ExplanationCard.jsx` | Include reasoning result in score breakdown |
| `src/components/ZoneComplete.jsx` | Use normalized score; update `maxZoneScore` to 25 |
| `src/components/ResultsScreen.jsx` | Show final score as X / 100 |
| `src/App.jsx` | Wire `onReasoningComplete`, pass updated `maxZoneScore` |

---

## Implementation Order (demo priority)

| Step | Task | Est. |
|------|------|------|
| 1 | Update `ZONE_EMAIL_COUNTS`, `zoneStart`/`zoneEnd`, slice in `shuffle.js` | 5 min |
| 2 | Add all new fields to 15 selected emails in `emails.js` | 35 min |
| 3 | Rewrite email bodies to match zone difficulty | 20 min |
| 4 | Build `EmailHeaderPanel` + wire into `EmailCard` (fromName, userContext bar) | 20 min |
| 5 | Add `SCREENS.REASONING`, build `ReasoningModal`, wire submit flow | 35 min |
| 6 | Update `useScoring` (reasoning point, displayScore, perEmail record) + score displays | 15 min |

**Total: ~2 hrs 10 min**
