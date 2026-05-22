---
phase: quick-260522-uez
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/utils/scoreSoc.js
  - src/components/ResultsScreen.jsx
  - src/hooks/useSocState.js
  - src/App.jsx
  - google-apps-script.js
autonomous: true
requirements:
  - PART-1-scoring-100
  - PART-2-email-results
  - PART-3-sheets-fix
user_setup:
  - service: google-apps-script
    why: >
      google-apps-script.js is a local source mirror. After Task 3 edits it,
      the user MUST redeploy manually:
      Apps Script editor → Deploy → Manage deployments → edit → New version → Deploy.
      The new deployment introduces MailApp.sendEmail — Google will prompt you
      to re-authorize the Apps Script's permissions (allow "Send email on your
      behalf" scope). Complete the OAuth prompt before testing.
      Copy the new /exec URL into src/config.js only if it changes.

must_haves:
  truths:
    - 'ResultsScreen shows a "Final Score / 100" element that sums zones 1-3 (raw 0-60) + socScaled (0-40)'
    - 'SOC raw total is scaled with divisor 112 → 40 using a named constant SOC_RAW_MAX=112'
    - 'The final score written to the Summary Sheet is the combined /100 value, not the raw zones-1-3 value'
    - 'Summary Sheet has Zone 4 (SOC) and Final Score /100 columns appended after existing columns'
    - 'End of SOC flow triggers a single submitFinal POST that updates the Summary row AND writes SOCData rows AND sends the email'
    - 'Email is sent to all four hardcoded recipients with correct subject and body breakdown'
    - 'Email has a CSV attachment of SOC answers (one row per question) named with applicant name'
    - 'submitFinal payload carries per-question selected/correct classification, SPL, explanation, score, grade'
    - 'Zones 1-3 gameplay, scoring, and leaderboard are untouched'
    - 'npx vite build succeeds with no new errors'
  artifacts:
    - path: 'src/utils/scoreSoc.js'
      provides: 'scaleSocScore(socTotal) helper returning { socScaled, finalScore } given zones-1-3 total; exports SOC_RAW_MAX'
    - path: 'src/components/ResultsScreen.jsx'
      provides: 'Final Score /100 display element; accepts socScaled prop'
    - path: 'src/hooks/useSocState.js'
      provides: 'submitSocToSheets signature replaced by submitFinal(payload) accepting consolidated data'
    - path: 'src/App.jsx'
      provides: 'handleSocNext builds consolidated payload from sc + soc + violations and calls submitFinal'
    - path: 'google-apps-script.js'
      provides: 'submitFinal action handler: updates Summary row with SOC/Final columns, writes SOCData, sends email with CSV'
  key_links:
    - from: 'src/App.jsx handleSocNext'
      to: 'useSocState.submitFinal'
      via: 'consolidated payload object'
    - from: 'useSocState.submitFinal'
      to: 'LEADERBOARD_URL'
      via: 'fetch POST action:submitFinal'
    - from: 'google-apps-script.js doPost submitFinal'
      to: 'Summary sheet row'
      via: 'findRowByEmail + setValues on Zone 4 / Final Score columns'
    - from: 'google-apps-script.js doPost submitFinal'
      to: 'MailApp.sendEmail'
      via: 'recipients array + CSV Blob attachment'
---

<objective>
Finalize the Zone 4 SOC assessment pipeline: introduce a /100 combined scoring
model, wire a single consolidated end-of-SOC POST that updates the Summary
Sheet and sends a results email with a CSV attachment, and fix the missing
SOC/Final columns in the Summary Sheet.

Purpose: Complete the assessment pipeline so a candidate's SOC score is counted,
reported, and delivered to reviewers automatically when they finish.
Output: Five modified files; google-apps-script.js requires manual redeploy.
</objective>

<execution_context>
@C:/Users/anoop/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/anoop/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/debug/soc-zone-scoring-integration.md

<!-- Key interfaces the executor needs: -->
<interfaces>
<!-- src/styles/tokens.js (read-only; do NOT modify) -->
export const POINTS_PER_EMAIL = 4;
export const ZONE_MAX_SCORE = 20;   // 4 * 5 emails
export const MAX_SCORE = 60;        // 20 * 3 zones

<!-- src/hooks/useScoring.js return shape -->
{
  totalScore,    // number 0-60 (zones 1-3 raw)
  displayScore,  // Math.round(totalScore / 60 * 100) — percent
  zoneScores,    // { 1: number, 2: number, 3: number }
  categoryCorrect,
  perEmail,
  scoreRound,
  resetScoring,
}

<!-- src/hooks/useSocState.js — current submitSocToSheets signature -->
submitSocToSheets(proctoring_violations: number): Promise<void>
// Sends action:'submitSOC' — will be REPLACED by submitFinal below.

<!-- src/hooks/useSocState.js — socTotal memo -->
socTotal  // number: sum of a.result.score.total across submitted answers

<!-- useSocState answers[idx] shape (after submitSocRound) -->
{
  primary: string|null,
  secondary: string|string[]|null,
  splText: string,
  explanation: string,
  submitted: boolean,
  result: {
    questionId: string,       // set in submitSocRound via q.id
    primaryCorrect: boolean,
    secondaryRatio: number,
    score: { breakdown, total: number, grade: string },
    splValidation: ...,
    explanationValidation: ...,
  }|null,
}

<!-- SOC_QUESTIONS[idx] shape (relevant fields) -->
{
  id: string,  // 'Q1'..'Q5b'
  classification: {
    correct: { primary: string, secondary: string|string[] },
    options: { primary: string[], secondary: string[] },
  }|null,
}

<!-- src/App.jsx relevant state at handleSocNext call-site -->
const sc = useScoring();    // sc.totalScore, sc.zoneScores, sc.displayScore
const soc = useSocState(gs);
const [gameViolations, setGameViolations] = useState(0);
const [socViolations, setSocViolations] = useState(0);

<!-- google-apps-script.js — existing Summary columns (1-indexed) -->
Col 1: Timestamp
Col 2: Name
Col 3: Email
Col 4: Status
Col 5: Score
Col 6: Display Score
Col 7: Tier
Col 8: Zone 1
Col 9: Zone 2
Col 10: Zone 3
Col 11: Proctoring Violations
<!-- NEW cols to append -->
Col 12: Zone 4 (SOC)
Col 13: Final Score /100

<!-- google-apps-script.js — SOCData columns (unchanged) -->
Col 1: Timestamp  Col 2: Name  Col 3: Email  Col 4: Question ID
Col 5: Score  Col 6: Grade  Col 7: SPL Text  Col 8: Explanation
Col 9: Proctoring Violations (first row only)
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add scaleSocScore helper and update ResultsScreen to show Final /100</name>
  <files>src/utils/scoreSoc.js, src/components/ResultsScreen.jsx</files>
  <action>
In src/utils/scoreSoc.js, add two exports at the bottom (do not touch the
existing scoreSocRound function):

  export const SOC_RAW_MAX = 112;
  export const SOC_SCALED_MAX = 40;
  export const ZONES_RAW_MAX = 60;

  /**
   * Scale socTotal (0-112 raw) to 40 points and compute the combined final score.
   * @param {number} socTotal  Raw SOC score (sum of per-question result.score.total)
   * @param {number} zonesRaw  Zones 1-3 raw total (0-60)
   * @returns {{ socScaled: number, finalScore: number }}
   */
  export function scaleSocScore(socTotal, zonesRaw) {
    const socScaled = Math.round((socTotal / SOC_RAW_MAX) * SOC_SCALED_MAX);
    const finalScore = zonesRaw + socScaled;
    return { socScaled, finalScore };
  }

In src/components/ResultsScreen.jsx:
- Remove the local `const SOC_MAX_SCORE = 112;` constant (line 26) — it will
  be replaced by the canonical import.
- Add to the import from '../utils/scoreSoc.js': SOC_RAW_MAX, scaleSocScore
  (or just SOC_RAW_MAX if scaleSocScore is only needed in App — but import both
  for the display math).
- Add a new prop `socScaled` (number, default null) to the function signature
  alongside the existing `socScore` prop.
- Compute `finalScore100` = `socScaled != null ? (finalScore ?? normalized) + ... `
  — actually: because zonesRaw is not passed as a prop, derive it from the
  existing `finalScore` prop (which IS the raw zones-1-3 total from sc.totalScore
  per App.jsx line 199). So:
    const finalScore100 = socScaled != null ? finalScore + socScaled : null;
- The existing SOC card (lines ~206-240 in current source) still shows the
  per-SOC raw score display. Leave its internals unchanged. Only update the
  divisor reference: replace the magic `SOC_MAX_SCORE` variable name with
  `SOC_RAW_MAX` in the card's math: `Math.round((socScore / SOC_RAW_MAX) * 100)`.
- ADD a new "Final Score" element rendered only when `finalScore100 != null`,
  positioned between the SOC card and the results-mid-grid (the RankCard /
  CompetencySummary row). Use the same `surface` style and motion.div animation
  pattern as the SOC card. Display:
    - Label: "Combined Assessment Score" (uppercase, small, same style)
    - Large number: `{finalScore100}` with `/ 100` suffix in muted colour
    - Sub-label: "Zones 1-3 + SOC Investigation"
  Do NOT replace the existing big number at the top (which shows `normalized`
  from zones-1-3 displayScore). The existing big number and title tier stay as-is.
- Add `socScaled: PropTypes.number` to the PropTypes block.

Do not touch the zone cards, RankCard, CompetencySummary, or the celebration
animation logic. Do not add any new dependencies.
  </action>
  <verify>
    <automated>npx vite build 2>&1 | tail -20</automated>
  </verify>
  <done>
`npx vite build` exits 0. ResultsScreen accepts socScaled prop and renders a
"Combined Assessment Score / 100" card when socScaled is not null. scaleSocScore
and SOC_RAW_MAX are exported from scoreSoc.js.
  </done>
</task>

<task type="auto">
  <name>Task 2: Build consolidated submitFinal in useSocState and wire App.jsx handleSocNext</name>
  <files>src/hooks/useSocState.js, src/App.jsx</files>
  <action>
In src/hooks/useSocState.js:

1. Import scaleSocScore from '../utils/scoreSoc.js'.

2. Add a new exported callback `submitFinal` alongside (NOT replacing yet; keep
   submitSocToSheets for one pass then remove it after wiring — actually: replace
   submitSocToSheets entirely since App.jsx will call submitFinal instead.
   Remove the submitSocToSheets callback and the direct fetch call it contained.
   Return `submitFinal` in the hook's return object instead.

3. `submitFinal` signature:
   submitFinal(consolidatedPayload: object): Promise<void>
   where consolidatedPayload is the full object built in App.jsx (see below).
   The hook's job: persist to sessionStorage and fire the fetch. Keep the same
   no-cors fetch pattern and the same silent-catch error handling.

   sessionStorage key stays 'socSubmission'. Store the full consolidatedPayload.

   Fetch body: JSON.stringify({ action: 'submitFinal', ...consolidatedPayload })

4. Remove the socTotal-only version of submitSocToSheets from the return object.
   Remove `submitSocToSheets` from the return entirely; add `submitFinal`.

In src/App.jsx:

In handleSocNext, replace the current:
  soc.submitSocToSheets(socViolations);

with logic that:
a. Computes scaleSocScore result — import scaleSocScore from './utils/scoreSoc.js':
     const { socScaled, finalScore } = scaleSocScore(soc.socTotal, sc.totalScore);

b. Determines tier using the combined /100 score:
     const tier = finalScore >= 80 ? 'Advanced' : finalScore >= 50 ? 'Proficient' : 'Foundation';

c. Builds per-question answer rows for the CSV/email. Iterate
   soc.answers (array aligned to SOC_QUESTIONS) with index to zip with question
   metadata. For each submitted answer, produce:
     {
       questionId: q.id,
       selectedPrimary: a.primary,
       correctPrimary: q.classification ? q.classification.correct.primary : null,
       selectedSecondary: Array.isArray(a.secondary) ? a.secondary.join(', ') : (a.secondary || ''),
       correctSecondary: q.classification
         ? (Array.isArray(q.classification.correct.secondary)
             ? q.classification.correct.secondary.join(', ')
             : q.classification.correct.secondary)
         : null,
       splText: a.splText,
       explanation: a.explanation,
       score: a.result ? a.result.score.total : 0,
       grade: a.result ? a.result.score.grade : '',
     }
   Import SOC_QUESTIONS from './data/socQuestions.js' in App.jsx (add import if
   not already present). Filter to only submitted answers (a.submitted === true).

d. Builds the consolidated payload object:
     {
       name: gs.player.name,
       email: gs.player.email,
       zone1Score: sc.zoneScores[1] || 0,
       zone2Score: sc.zoneScores[2] || 0,
       zone3Score: sc.zoneScores[3] || 0,
       socScaled,
       finalScore,
       tier,
       proctoring_violations: gameViolations + socViolations,
       socAnswers: [array of per-question objects above],
     }

e. Calls soc.submitFinal(consolidatedPayload).

f. Also passes socScaled down to ResultsScreen for the SOC_RESULTS screen render.
   Update the SOC_RESULTS screen render in App.jsx:
     <ResultsScreen
       ...existing props...
       socScore={soc.socTotal}
       socScaled={socScaled}    // ADD THIS
       finalScore={sc.totalScore}
     />
   But socScaled is a local const inside handleSocNext — it is not available at
   render time. Solution: add a state variable in App.jsx:
     const [socScaledResult, setSocScaledResult] = useState(null);
   In handleSocNext (step d above), after computing socScaled, call:
     setSocScaledResult(socScaled);
   Pass socScaled={socScaledResult} to the SOC_RESULTS ResultsScreen render.

Update handleSocNext's useCallback dependency array to include sc, soc,
socViolations, gameViolations (it already has soc, gs, socViolations — add sc).

Do not change handleAdvanceZone (zones 1-3 submit path stays untouched).
Do not change handleSubmit or handleNext.
  </action>
  <verify>
    <automated>npx vite build 2>&1 | tail -20</automated>
  </verify>
  <done>
`npx vite build` exits 0. handleSocNext calls soc.submitFinal with a full
consolidated payload. App.jsx passes socScaled={socScaledResult} to ResultsScreen
on SOC_RESULTS. useSocState exports submitFinal and no longer exports
submitSocToSheets.
  </done>
</task>

<task type="auto">
  <name>Task 3: Update google-apps-script.js — Summary columns, submitFinal action, email + CSV</name>
  <files>google-apps-script.js</files>
  <action>
All changes are in google-apps-script.js. This file is deployed to Google Apps
Script manually — no automated deploy step exists.

--- (A) ensureSheets: add two new Summary columns ---

In the `ensureSheets` function, add 'Zone 4 (SOC)' and 'Final Score /100' to
the header row appended when the Summary sheet is created for the first time:

  summary.appendRow([
    'Timestamp', 'Name', 'Email', 'Status',
    'Score', 'Display Score', 'Tier',
    'Zone 1', 'Zone 2', 'Zone 3', 'Proctoring Violations',
    'Zone 4 (SOC)', 'Final Score /100'
  ]);

NOTE: This only affects newly created sheets. Existing sheets will have the
rows updated by setValues calls — the columns simply appear at the end.

--- (B) Keep existing submit action unchanged ---

The existing `submit` action (zones 1-3 partial submit fired at end of zone 3)
stays exactly as-is: it writes cols 4-11 (Status through Proctoring Violations).
Do not touch it. The new `submitFinal` handler will update cols 12-13 on the
same row when SOC completes.

--- (C) Add submitFinal action handler ---

After the closing brace of the `submitSOC` action block (and before the final
`return ContentService...` for unknown action), add a new `if (action === 'submitFinal')` block:

  if (action === 'submitFinal') {
    var sheets = ensureSheets(ss);

    // 1. Update Summary row with SOC + Final Score columns
    var row = findRowByEmail(sheets.summary, payload.email || '');
    var socScaled = payload.socScaled != null ? payload.socScaled : 0;
    var finalScore = payload.finalScore != null ? payload.finalScore : 0;
    var tierVal = payload.tier || '';

    if (row > 0) {
      // Update Zone 4 (SOC) in col 12 and Final Score /100 in col 13
      // Also update Tier (col 7) with the combined-score tier
      sheets.summary.getRange(row, 7, 1, 1).setValue(tierVal);
      sheets.summary.getRange(row, 12, 1, 2).setValues([[socScaled, finalScore]]);
    } else {
      // Fallback: candidate started SOC without a prior register/submit row
      sheets.summary.appendRow([
        ts,
        payload.name || '', payload.email || '',
        'Completed',
        payload.zone1Score + payload.zone2Score + payload.zone3Score,
        '',
        tierVal,
        payload.zone1Score || 0,
        payload.zone2Score || 0,
        payload.zone3Score || 0,
        payload.proctoring_violations || 0,
        socScaled,
        finalScore,
      ]);
    }

    // 2. Write SOCData rows (same as old submitSOC, preserves SOCData shape)
    var soc = ensureSOCSheet(ss);
    var socAnswers = payload.socAnswers || [];
    for (var i = 0; i < socAnswers.length; i++) {
      var ans = socAnswers[i];
      soc.appendRow([
        ts,
        payload.name || '',
        payload.email || '',
        sanitiseCell(ans.questionId || ''),
        sanitiseCell(ans.score != null ? ans.score : ''),
        sanitiseCell(ans.grade || ''),
        sanitiseCell(ans.splText || ''),
        sanitiseCell(ans.explanation || ''),
        i === 0 ? (payload.proctoring_violations || 0) : '',
      ]);
    }

    // 3. Build CSV string for attachment
    var csvLines = ['Question ID,Selected Primary,Correct Primary,Selected Secondary,Correct Secondary,SPL Query,Explanation,Score,Grade'];
    for (var j = 0; j < socAnswers.length; j++) {
      var r = socAnswers[j];
      csvLines.push([
        csvEscape(r.questionId || ''),
        csvEscape(r.selectedPrimary || ''),
        csvEscape(r.correctPrimary || ''),
        csvEscape(r.selectedSecondary || ''),
        csvEscape(r.correctSecondary || ''),
        csvEscape(r.splText || ''),
        csvEscape(r.explanation || ''),
        r.score != null ? r.score : '',
        csvEscape(r.grade || ''),
      ].join(','));
    }
    var csvString = csvLines.join('\r\n');
    var csvBlob = Utilities.newBlob(csvString, 'text/csv', (payload.name || 'candidate').replace(/[^a-z0-9]/gi, '_') + '_soc_responses.csv');

    // 4. Build email body
    var bodyLines = [
      'Email Abuse Assessment Results',
      '',
      'Applicant: ' + (payload.name || ''),
      'Email: ' + (payload.email || ''),
      '',
      'Zone Scores:',
      '  Zone 1 (Inbox):       ' + (payload.zone1Score || 0) + ' / 20',
      '  Zone 2 (Queue):       ' + (payload.zone2Score || 0) + ' / 20',
      '  Zone 3 (Escalation):  ' + (payload.zone3Score || 0) + ' / 20',
      '  Zone 4 (SOC Inv.):    ' + socScaled + ' / 40',
      '',
      'Combined Final Score:   ' + finalScore + ' / 100',
      'Competency Tier:        ' + tierVal,
      'Proctoring Violations:  ' + (payload.proctoring_violations || 0),
      '',
      'SOC assessment responses are attached as a CSV.',
    ];
    var emailBody = bodyLines.join('\n');

    // 5. Send email
    var recipients = [
      'pavan.machala@sutherlandglobal.com',
      'emilouvienna.nadela@sutherlandglobal.com',
      'Anoop.krishnan1@sutherlandglobal.com',
      'Sandhya.jobbin@sutherlandglobal.com',
    ];
    var subject = 'Email Abuse Assessment - "' + (payload.name || '') + '"';
    try {
      MailApp.sendEmail({
        to: recipients.join(','),
        subject: subject,
        body: emailBody,
        attachments: [csvBlob],
      });
    } catch (mailErr) {
      // Email failure is non-fatal — Sheet writes already succeeded
      Logger.log('MailApp error: ' + mailErr.message);
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  }

--- (D) Add csvEscape helper function ---

Add at the bottom of the file alongside sanitiseCell:

  function csvEscape(val) {
    var s = String(val == null ? '' : val);
    if (s.indexOf(',') !== -1 || s.indexOf('"') !== -1 || s.indexOf('\n') !== -1) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

--- (E) Keep submitSOC action intact ---

The existing `if (action === 'submitSOC')` block stays in place. It is no
longer called from the updated client (which now sends submitFinal) but
must remain to avoid breaking any in-flight or replayed requests from
older client builds. Do not remove it.

--- (F) Keep doGet getSOCSubmissions intact ---

Do not modify doGet at all. The SOCData row shape is unchanged so the
reviewer GET path continues to work without modification.
  </action>
  <verify>
    <automated>npx vite build 2>&1 | tail -5</automated>
  </verify>
  <done>
google-apps-script.js has: (1) ensureSheets Summary header with 13 columns,
(2) submitFinal action block updating cols 12-13, writing SOCData rows,
building and sending the email with CSV attachment, (3) csvEscape helper.
`npx vite build` exits 0 (google-apps-script.js is not bundled; build success
confirms no JS syntax errors in the client files changed in Tasks 1-2).
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Client → GAS POST | Candidate browser sends unvalidated payload to Apps Script doPost |
| GAS → MailApp | Apps Script forwards candidate-supplied name/text into email subject and body |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-uez-01 | Tampering | GAS doPost submitFinal — payload.socScaled / finalScore | accept | Scores are computed client-side by deterministic math; reviewer can cross-check raw SOCData rows. No financial consequence. |
| T-uez-02 | Information Disclosure | email body + CSV sent to four hardcoded internal reviewers | accept | Recipients are internal Sutherland staff; no external exposure. |
| T-uez-03 | Tampering | CSV/email body — candidate-controlled name/splText/explanation injected into email | mitigate | csvEscape() wraps all candidate strings for CSV; email body is plain text (no HTML injection vector via MailApp plain-text body). |
| T-uez-04 | Spoofing | submitFinal fired multiple times (page reload) | accept | Sheets `findRowByEmail` overwrites the same row; SOCData gets duplicate rows which reviewer can filter. Low risk for an internal assessment tool. |
| T-uez-SC | Tampering | npm/pip/cargo installs | accept | No new packages installed in this task. |
</threat_model>

<verification>
1. `npx vite build` — must exit 0 with no new errors after all three tasks.
2. Local smoke test (dev server):
   - Complete the full assessment flow through SOC zone.
   - ResultsScreen (SOC_RESULTS) shows the "Combined Assessment Score" card
     with a number between 0 and 100.
   - The existing big number (zones-1-3 percentage) is still visible above it.
3. google-apps-script.js manual redeploy (see user_setup) — then:
   - Complete another test run. Check Google Sheet Summary tab: columns 12-13
     (Zone 4 SOC, Final Score /100) should be populated in the candidate's row.
   - Check SOCData tab: rows written for each SOC question answered.
   - Check that the four recipients received an email with subject
     `Email Abuse Assessment - "<name>"` and a CSV attachment.
</verification>

<success_criteria>
- scaleSocScore(socTotal, zonesRaw) exported from scoreSoc.js with SOC_RAW_MAX=112
- ResultsScreen renders "Combined Assessment Score / 100" card when socScaled prop is provided
- handleSocNext in App.jsx calls soc.submitFinal with all required fields
- google-apps-script.js submitFinal handler: updates Summary cols 12-13, writes SOCData, sends email to all four recipients with CSV
- `npx vite build` exits 0
- Zones 1-3 flow entirely unchanged (handleAdvanceZone, useScoring, zone cards)
- MANUAL STEP REQUIRED: Redeploy google-apps-script.js as a new version and re-authorize MailApp scope
</success_criteria>

<output>
Create `.planning/quick/260522-uez-finalize-zone-4-soc-integration-100-scor/260522-uez-SUMMARY.md` when done.
</output>
