# Flagmail Assessment Redesign — Design Spec
**Date:** 2026-04-22
**Approach:** Option B — Refined Evolution
**Scope:** Full sweep — Landing, Zone Intro, Game Round, Explanation Card, Zone Complete, Results

---

## 1. Context

Flagmail is a hiring assessment tool that places candidates in a timed email security simulation. Candidates review 15 emails across 3 escalating zones and classify each one. Their decisions are scored and used to rank candidates by competency tier.

The Codex redesign introduced a strong visual foundation but broke the assessment framing (introduced "game" language), left placeholder copy visible in the UI, created layout overflow at tablet breakpoints, and introduced "Veridian Security" branding throughout the codebase. This redesign corrects all of that while lifting quality across every screen.

---

## 2. Design Language (shared)

### Aesthetic — keep
- Glass card surfaces: `rgba(255,255,255,0.72)`, `backdropFilter: blur(28px) saturate(165%)`
- Background gradient: `linear-gradient(180deg, #f5f7fb 0%, #edf3fb 42%, #f7f4ef 100%)`
- Zone accent colors: Zone 1 `#0A84FF`, Zone 2 `#30B0C7`, Zone 3 `#FF7A1A`
- Display typography: bold, tight letter-spacing (`-0.04em` to `-0.06em`)
- Font: `system-ui, sans-serif`

### Label discipline — change
No screen should have a section label paired with a redundant section title. Each panel gets at most one orientation label, used only when the layout alone is insufficient.

### Copy voice — change
Assessment-toned throughout. Terse, authoritative, no filler.
- "Submit" not "Submit Classification"
- "Next email" not "Continue to next email"
- "Start Assessment" not "Launch Game"
- Results describe competency, not a game rank
- Celebration copy: "Correct" not "Nailed it!"

### What is not changing
- Game mechanics: timer, scoring algorithm, clue reveal cost, zone progression, badge system
- Routing: `App.jsx` screen switching logic and all hooks remain structurally unchanged
- All data files: `emails.js`, `email_dataset.csv`
- Animation assets: Lottie files, GSAP score counter, Framer Motion transitions
- Tutorial screen: out of scope for this pass
- Leaderboard screen: out of scope for this pass (structural)

Note: Internal layout restructuring of `GameRound.jsx` (consolidating three stacked panels into one) **is in scope**. This is a layout change inside the component, not a routing or hook change.

---

## 3. Landing Screen

### Left panel
- **Badge:** `FLAGMAIL ASSESSMENT` with the existing blue dot indicator retained left of the text
- **Overline:** `SHARPEN JUDGMENT, NOT JUST RECALL`
- **Headline:** `Prove your judgment on real email threats.`
- **Body:** `15 timed scenarios across 3 escalating zones. Your decisions are scored and mapped to a competency tier.`
- **Stats strip:** Three equal-width cards: `15 emails` · `3 zones` · `45s per round`
- **Zone preview label:** `What you'll face`
- **Zone cards:** Inbox / Queue / Escalation with zone-accented left border, zone number, title, and one-sentence description. Grid: `repeat(3, 1fr)` at desktop, `1fr` at ≤720px.

### Right panel
- **Overline:** `CANDIDATE ACCESS`
- **Headline:** `Begin the assessment`
- **Subtext:** `Enter your details to start. Your name and email are used to record your result.`
- **Form:** Full Name input, Email Address input
- **CTA:** `Start Assessment` — full-width, blue gradient, `border-radius: 18px`
- **Steps section:**
  1. Enter your details and start the assessment.
  2. Classify each email under time pressure.
  3. Receive your competency result and ranking.

### Layout fixes
- At ≤1080px: single-column stack, `max-width: 860px`
- At ≤720px: zone cards switch to `grid-template-columns: 1fr`; landing card padding reduces to 22px
- Eliminates the 621px tablet overflow confirmed by Playwright audit

---

## 4. Zone Intro Card

### Left panel
- **Zone badge pill:** `Zone N · Section N of 3` (replaces "Warm-up round" / "Judgment round")
- **Headline:** Zone title — `The Inbox`, `The Queue`, `The Escalation`
- **Mission copy (zone-specific):**
  - Zone 1: `Spot the loud red flags fast and build your rhythm.`
  - Zone 2: `The copy gets cleaner here. Trust the details, not the polish.`
  - Zone 3: `One subtle inconsistency is usually the whole story.`
- **Stats:** 5 emails · up to 25 pts · 45s each
- **Signals list:** "What to watch for" — 3 bullet items per zone (keep existing content)

### Right panel
- **Icon box:** Reduce from 92px to 72px, zone-accent background, zone icon centered
- **No `Mission` overline label** — remove it entirely; the context copy below the icon speaks for itself
- **Context copy (zone-specific):**
  - Zone 1: `Start with the obvious ones and find your footing.`
  - Zone 2: `Polish can hide a lot. Read slower.`
  - Zone 3: `High stakes. One detail changes everything.`
- **Early unlock badge:** keep if `earlyUnlocked && zone > 1`
- **CTA:** `Start Zone N`

---

## 5. Game Round

### Scope note
`GameRound.jsx` currently renders three stacked side-panel cards via `gridTemplateRows: 'auto auto auto'`. This spec replaces that structure with a single unified decision card containing internal sections. This is an in-scope layout change to `GameRound.jsx`.

### Top bar (unified single glass card)
No section labels. Three segments laid out horizontally:

**Left:** Zone number badge (zone-accent tinted square) + zone name heading + `Email N of 5` colored pill

**Center:** Timer bar (`TimerBar` component, keep) + countdown number (`32s`) phase-colored and right-aligned. Remove `Decision clock` label and `urgencyLabel` text (`Stable scan` / `Decision window closing` / `Critical window`) — the phase color on the countdown number is sufficient urgency signal.

**Right:** Score number only (e.g., `42`) with GSAP count-up animation. No "Running score" label.

### Email panel (left main panel)
- Remove "Evidence panel" overline and "Inspect the message" heading
- Remove "Trust signals matter" badge
- Keep: `Incoming message` timestamp badge top-right
- Keep: avatar, sender name + address cards, subject, `EmailHeaderPanel`, `userContext` strip, body

### Decision card (right panel — unified)
Replaces the three stacked cards. Single glass card with four internal sections:

**A — Primary classification**
- Label: `Primary classification` (11px uppercase)
- Helper right-aligned: `Choose the strongest category` (11px, muted)
- L1 classifier chips — same as current (`L1_CATEGORIES`, color-coded, hover tooltip)

**B — Secondary diagnosis** (animates in after L1 selected)
- Animate with `anim-fadeSlideUp`
- Label: `Secondary diagnosis` (11px uppercase)
- Helper: `Optional — refine if confident`
- L2 chips — same as current

**C — Hints**
- Label: `Hints` with count badge `0/3` right-aligned
- `ClueSystem` component rendered here (not in a separate panel)
- Below the clue chips: `Using hints reduces your score` in 11px muted text

**D — Submit**
- No "Ready check" header
- Status line: `No category selected` → `[Category name] selected` (13px, muted)
- Button: `Submit` when L1 selected; disabled when not
- Button uses zone accent gradient, full width, `border-radius: 18px`

---

## 6. Reasoning Modal

No structural changes. Copy adjustments only:
- Modal submit/confirm button: keep current label
- `Skip` button: shorten to `Skip`
- Do not add "assessment" language to the question text — keep it neutral and question-focused

---

## 7. Explanation Card

### Copy — two locations to update

**CorrectAnswerOverlay** (the full-screen overlay that fires on correct answers):
- `Nailed it!` → `Correct`
- Any celebration subtext → remove or replace with score delta only (e.g., `+4 pts`)
- Keep the confetti/Lottie animation — only the copy changes

**Verdict banner** (the inline banner rendered via the `verdict` object, separate from the overlay):
- `✓ Nailed it!` → `✓ Correct`
- The incorrect label stays as-is if already assessment-neutral; otherwise apply the same principle

### Outcome-first layout

**Top section:**
- Icon: 56px checkmark (correct) or X (incorrect), zone-accent colored
- Headline: `Correct — Phishing & Spoofing` or `Missed — This was Legitimate`
- Score delta badge: `+4 pts` (green) or `+0 pts` (muted)
- Running total: kept as a secondary line below the delta — `Score so far: 42 pts` — relabelled from "Running total" to make it read as an assessment stat, not a game score

**Middle section:**
- Giveaway phrase highlighted in email body (`giveawayHighlight: true`)
- `email.reasoning` text below

**Bottom:**
- Secondary label if L2 was also correct: `Diagnosis confirmed: Spear Phishing`
- CTA: `Next email →` or `End of zone →` depending on position in zone
- Remove any "Evidence panel" framing

---

## 8. Zone Complete

- **Zone label:** `Zone N Complete — Section N of 3`
- **Score format:** `18 / 25` (not raw integer — computed from `zoneScore` / `maxZoneScore`)
- **Performance message:** Zone-specific and accuracy-tier-based

### Performance message matrix

Accuracy tier thresholds (based on % of L1-correct emails in the zone):
- **High:** ≥ 80% correct (4–5 of 5)
- **Mid:** 40–79% correct (2–3 of 5)
- **Low:** < 40% correct (0–1 of 5)

| | High (≥80%) | Mid (40–79%) | Low (<40%) |
|---|---|---|---|
| Zone 1 | "Strong start. You cut through the obvious threats cleanly." | "Solid pass. A few clear threats slipped through." | "Some obvious flags were missed. Zone 2 demands more." |
| Zone 2 | "Sharp eye. You handled the polished fakes well." | "The cleaner emails created some uncertainty." | "The polished emails caused problems. Slow down in Zone 3." |
| Zone 3 | "Specialist-level judgment. You found the subtle signals." | "The edge cases tested your limits. A few key details were missed." | "The subtle signals in this zone proved difficult." |

- **CTA:** `Enter Zone N+1` or `See Your Results` (zone 3)

---

## 9. Results Screen

### Hero
- Large display: score number (`74`) with `/100` in lighter weight beside it
- Below: Competency tier badge — `Foundation`, `Proficient`, or `Advanced`
- Below tier: Player name personalized header — `[Name]'s Assessment Result`

### Competency tier thresholds
- `displayScore < 50` → **Foundation**
- `displayScore 50–79` → **Proficient**
- `displayScore ≥ 80` → **Advanced**

### Zone breakdown
- Horizontal strip: Zone 1 · Zone 2 · Zone 3, each showing `N / 25` with zone accent color

### Category accuracy
- Grid showing correct % per email category
- Sourced from existing `categoryCorrect` prop

### Badges
- If earned: show `BadgeCollection`
- If none earned: omit section entirely

### CTAs
- Primary: `View Leaderboard`
- Secondary: `Retake Assessment`
- Side-by-side on desktop, stacked on mobile

---

## 10. Scoring Tier — Code Changes

### `App.jsx` (line 87 — the inline title string passed to `lb.submitScore`)
```js
// Before
title: sc.displayScore >= 80 ? 'Threat Intelligence Lead' : sc.displayScore >= 50 ? 'Senior Analyst' : 'Junior Analyst'

// After
title: sc.displayScore >= 80 ? 'Advanced' : sc.displayScore >= 50 ? 'Proficient' : 'Foundation'
```

Note: `useLeaderboard.js` does not contain title logic — it passes through whatever `playerData` it receives. No change needed there.

### `src/utils/competency.js`
- Update `getProgressTitle()` thresholds to match: `< 50` → Foundation, `50–79` → Proficient, `≥ 80` → Advanced
- Remove "Veridian Security" from `generateCompetency()` — replace with Flagmail-appropriate language or remove the employer reference entirely

---

## 11. Files to Modify

| File | Change |
|---|---|
| `src/components/LandingScreen.jsx` | Full rewrite — assessment copy, layout fix, badge text |
| `src/components/ZoneIntroCard.jsx` | Zone-specific copy, icon size, remove Mission overline, section subtitle |
| `src/components/GameRound.jsx` | Unified top bar, remove section headers, consolidate three side panels into one decision card |
| `src/components/EmailCard.jsx` | Remove "Evidence panel" / "Inspect the message" headers |
| `src/components/Classifier.jsx` | Label copy cleanup only |
| `src/components/ExplanationCard.jsx` | Outcome-first layout, CorrectAnswerOverlay copy, CTA copy |
| `src/components/ZoneComplete.jsx` | Score format (`N / 25`), zone label, performance message matrix |
| `src/components/ResultsScreen.jsx` | Competency tier hero, CTA copy, personalized header |
| `src/components/RankCard.jsx` | Render Foundation / Proficient / Advanced tier labels. Update `titleColor` thresholds from 70/40 to **80/50** to match the competency tier breakpoints. Remove both "Veridian Security" hard-coded strings (header line ~33 and watermark line ~107). |
| `src/utils/competency.js` | Threshold updates in `getProgressTitle()`, remove "Veridian Security" from `generateCompetency()` |
| `src/App.jsx` | Tier title string in `lb.submitScore()` call |
