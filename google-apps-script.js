/**
 * FlagMail — Google Apps Script
 *
 * Handles:
 *   POST action:"register" — saves name + email immediately when assessment starts
 *   POST action:"submit"   — updates that row with scores + writes per-email raw data
 *   POST action:"submitSOC" — writes SOC question answers to SOCData sheet
 *   POST action:"submitFinal" — finalises SOC level: writes summary row + SOCData + CSV
 *     attachment email via MailApp with quota checking and structured failure logging
 *   GET  ?checkEmail=...   — checks if an email has already been used
 *   GET  ?action=getSOCSubmissions&passcode=...  — returns all SOC submissions
 *
 * Deployment Checklist (run after every GAS redeploy that touches MailApp):
 *   1. Open the GAS editor (Extensions > Apps Script).
 *   2. Run any function (e.g. testEmail() stub that calls MailApp.sendEmail()).
 *   3. Google will prompt OAuth re-authorization for the MailApp scope.
 *      Click Review permissions → Allow ("Send email on your behalf").
 *   4. If no prompt appears, check GAS Editor > Executions tab for MailApp errors.
 *   5. Deploy as new version (Deploy > Manage deployments > New version > Deploy).
 *   6. Verify: check GAS Executions log after first live submission — no MailApp errors.
 *
 * Setup:
 *   1. Create a Google Sheet (tabs are auto-created on first write).
 *   2. Copy the Sheet ID from its URL:
 *        https://docs.google.com/spreadsheets/d/<THIS_IS_THE_ID>/edit
 *      and paste it into SPREADSHEET_ID below.
 *   3. Apps Script > paste this file > Save.
 *   4. Deploy > Manage deployments > edit existing > New version > Deploy.
 *   5. Copy the /exec URL into flagmail1/src/config.js
 */

// The Sheet this web app reads/writes. Required because a standalone Apps
// Script project has no "active spreadsheet" — openById() works either way.
var SPREADSHEET_ID = '1-ldYuBrFaj6I7EiXpIOxPXqgaDLM1lywlMjYVJW7FB8';

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function ensureSheets(ss) {
  var summary = ss.getSheetByName('Summary');
  if (!summary) {
    summary = ss.insertSheet('Summary');
    summary.appendRow([
      'Timestamp', 'Name', 'Email', 'Status',
      'Score', 'Display Score', 'Tier',
      'Zone 1', 'Zone 2', 'Zone 3', 'Proctoring Violations',
      'Zone 4 (SOC)', 'Final Score /100'
    ]);
  }

  var raw = ss.getSheetByName('RawData');
  if (!raw) {
    raw = ss.insertSheet('RawData');
    raw.appendRow([
      'Timestamp', 'Name', 'Email', 'Email ID', 'Zone',
      'Selected L1', 'Selected L2', 'Correct L1', 'Correct L2',
      'L1 Correct', 'L2 Correct', 'Clues Used', 'Timed Out', 'Points'
    ]);
  }

  return { summary: summary, raw: raw };
}

function findRowByEmail(sheet, email) {
  if (sheet.getLastRow() < 2) return -1;
  var emails = sheet.getRange(2, 3, sheet.getLastRow() - 1, 1).getValues();
  var needle = email.trim().toLowerCase();
  for (var i = 0; i < emails.length; i++) {
    if (String(emails[i][0]).trim().toLowerCase() === needle) {
      return i + 2; // 1-based row number
    }
  }
  return -1;
}

// ── POST ──────────────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action || '';
    var ss = getSpreadsheet();
    var ts = new Date().toISOString();

    if (action === 'register') {
      var sheets = ensureSheets(ss);
      sheets.summary.appendRow([
        ts, payload.name || '', payload.email || '',
        'In Progress', '', '', '', '', '', ''
      ]);
      return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'submit') {
      var sheets = ensureSheets(ss);
      var row = findRowByEmail(sheets.summary, payload.email || '');
      if (row > 0) {
        sheets.summary.getRange(row, 4, 1, 8).setValues([[
          'Completed', payload.score || 0, payload.displayScore || 0,
          payload.title || '', payload.zone1Score || 0,
          payload.zone2Score || 0, payload.zone3Score || 0,
          payload.proctoring_violations || 0,
        ]]);
      } else {
        sheets.summary.appendRow([
          ts, payload.name || '', payload.email || '',
          'Completed', payload.score || 0, payload.displayScore || 0,
          payload.title || '', payload.zone1Score || 0,
          payload.zone2Score || 0, payload.zone3Score || 0,
          payload.proctoring_violations || 0,
        ]);
      }
      var perEmail = payload.perEmail || [];
      for (var i = 0; i < perEmail.length; i++) {
        var r = perEmail[i];
        sheets.raw.appendRow([
          ts, payload.name || '', payload.email || '', r.emailId || '',
          r.zone || '', r.selectedL1 || '', r.selectedL2 || '',
          r.correctL1 || '', r.correctL2 || '',
          r.l1Correct === true, r.l2Correct === true,
          r.cluesUsed || 0, r.timedOut === true, r.points || 0,
        ]);
      }
      return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'submitSOC') {
      var soc = ensureSOCSheet(ss);
      var answers = payload.answers || [];
      for (var i = 0; i < answers.length; i++) {
        var ans = answers[i];
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
      return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'submitFinal') {
      var sheets = ensureSheets(ss);

      // 1. Update Summary row with SOC + Final Score columns
      var row = findRowByEmail(sheets.summary, payload.email || '');
      var socScaled = payload.socScaled != null ? payload.socScaled : 0;
      var finalScore = payload.finalScore != null ? payload.finalScore : 0;
      var tierVal = payload.tier || '';

      if (row > 0) {
        // Update Tier (col 7) with combined-score tier
        sheets.summary.getRange(row, 7, 1, 1).setValue(tierVal);
        // Write Zone 4 (SOC) in col 12 and Final Score /100 in col 13
        sheets.summary.getRange(row, 12, 1, 2).setValues([[socScaled, finalScore]]);
      } else {
        // Fallback: candidate started SOC without a prior register/submit row
        sheets.summary.appendRow([
          ts,
          payload.name || '', payload.email || '',
          'Completed',
          (payload.zone1Score || 0) + (payload.zone2Score || 0) + (payload.zone3Score || 0),
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

      // 2. Write SOCData rows (preserves SOCData row shape)
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
      var csvBlob = Utilities.newBlob(
        csvString,
        'text/csv',
        (payload.name || 'candidate').replace(/[^a-z0-9]/gi, '_') + '_soc_responses.csv'
      );

      // 4. Build email body (HTML + plain-text fallback)
      var htmlBody = null;
      try {
        htmlBody = buildResultsHtml(payload, socScaled, finalScore, tierVal);
        Logger.log('HTML email built successfully, length=' + htmlBody.length);
      } catch (htmlErr) {
        Logger.log('HTML build failed, falling back to text-only: ' + htmlErr.message);
        htmlBody = null;
      }
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

      // 5. Send email to reviewers with quota check
      var emailStatus = 'not_attempted';
      var recipients = [
        'pavan.machala@sutherlandglobal.com',
        'emilouvienna.nadela@sutherlandglobal.com',
        'Anoop.krishnan1@sutherlandglobal.com',
        'Sandhya.jobbin@sutherlandglobal.com',
      ];
      var subject = 'Email Abuse Assessment - "' + (payload.name || '') + '"';

      try {
        var remainingQuota = MailApp.getRemainingDailyQuota();
        Logger.log('MailApp quota check: remaining=' + remainingQuota + ', recipients=' + recipients.length + ', candidate=' + (payload.email || ''));

        if (remainingQuota < recipients.length) {
          emailStatus = 'quota_exhausted';
          Logger.log('MailApp quota exhausted: remaining=' + remainingQuota + ', needed=' + recipients.length + ', candidate=' + (payload.email || ''));
        } else {
          var emailOpts = {
            to: recipients.join(','),
            subject: subject,
            body: emailBody,
            attachments: [csvBlob],
          };
          if (htmlBody) { emailOpts.htmlBody = htmlBody; }
          MailApp.sendEmail(emailOpts);
          emailStatus = 'sent';
          Logger.log('MailApp send success: to=' + recipients.join(',') + ', candidate=' + (payload.email || '') + ', subject=' + subject);
        }
      } catch (mailErr) {
        emailStatus = 'failed';
        Logger.log('MailApp error: ' + mailErr.message +
          ' | recipients=' + recipients.join(',') +
          ' | candidate=' + (payload.email || '') +
          ' | subject=' + subject +
          ' | quota=' + (typeof remainingQuota !== 'undefined' ? remainingQuota : 'unknown'));
      }

      return ContentService.createTextOutput(JSON.stringify({ ok: true, emailStatus: emailStatus })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'getAdminData') {
      var passcode = payload.passcode || '';
      if (!checkPasscode(passcode)) {
        return ContentService.createTextOutput(
          JSON.stringify({ ok: false, error: 'Invalid passcode' })
        ).setMimeType(ContentService.MimeType.JSON);
      }

      var ss = getSpreadsheet();
      var sheets = ensureSheets(ss);

      var candidates = [];
      if (sheets.summary.getLastRow() >= 2) {
        var summaryRows = sheets.summary.getRange(
          2, 1, sheets.summary.getLastRow() - 1, 13
        ).getValues();
        candidates = summaryRows.map(function(row) {
          return {
            name: String(row[1] || ''),
            email: String(row[2] || ''),
            status: String(row[3] || ''),
            totalScore: Number(row[12]) || 0,
            displayScore: Number(row[5]) || 0,
            gradeBand: String(row[6] || ''),
            submissionDate: String(row[0] || ''),
            tabSwitches: Number(row[10]) || 0,
            zone1Score: Number(row[7]) || 0,
            zone2Score: Number(row[8]) || 0,
            zone3Score: Number(row[9]) || 0,
            zone4SocScore: Number(row[11]) || 0,
          };
        });
      }

      var rawData = [];
      if (sheets.raw.getLastRow() >= 2) {
        var rawRows = sheets.raw.getRange(
          2, 1, sheets.raw.getLastRow() - 1, 14
        ).getValues();
        rawData = rawRows.map(function(row) {
          return {
            timestamp: String(row[0] || ''),
            name: String(row[1] || ''),
            email: String(row[2] || ''),
            emailId: row[3],
            zone: Number(row[4]) || 0,
            selectedL1: String(row[5] || ''),
            selectedL2: String(row[6] || ''),
            correctL1: String(row[7] || ''),
            correctL2: String(row[8] || ''),
            l1Correct: row[9] === true,
            l2Correct: row[10] === true,
            cluesUsed: Number(row[11]) || 0,
            timedOut: row[12] === true,
            points: Number(row[13]) || 0,
          };
        });
      }

      var socData = [];
      var socSheet = ss.getSheetByName('SOCData');
      if (socSheet && socSheet.getLastRow() >= 2) {
        var socRows = socSheet.getRange(
          2, 1, socSheet.getLastRow() - 1, 9
        ).getValues();
        socData = socRows.map(function(row) {
          return {
            timestamp: String(row[0] || ''),
            name: String(row[1] || ''),
            email: String(row[2] || ''),
            questionId: String(row[3] || ''),
            score: Number(row[4]) || 0,
            grade: String(row[5] || ''),
            splText: String(row[6] || ''),
            explanation: String(row[7] || ''),
            proctoringViolations: Number(row[8]) || 0,
          };
        });
      }

      return ContentService.createTextOutput(JSON.stringify({
        ok: true,
        candidates: candidates,
        rawData: rawData,
        socData: socData,
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'Unknown action' })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ── GET ───────────────────────────────────────────────────────────────────────

function doGet(e) {
  var checkEmail = (e.parameter && e.parameter.checkEmail) || '';

  if (checkEmail) {
    var ss = getSpreadsheet();
    var sheets = ensureSheets(ss);
    var exists = findRowByEmail(sheets.summary, checkEmail) > 0;

    return ContentService
      .createTextOutput(JSON.stringify({ exists: exists }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (e.parameter && e.parameter.action === 'getSOCSubmissions') {
    var passcode = e.parameter.passcode || '';
    if (!checkPasscode(passcode)) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: 'Invalid passcode' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var ss = getSpreadsheet();
    var soc = ss.getSheetByName('SOCData');
    if (!soc || soc.getLastRow() < 2) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, submissions: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // SOCData stores one row per answered question:
    // [Timestamp, Name, Email, Question ID, Score, Grade, SPL Text, Explanation]
    var data = soc.getRange(2, 1, soc.getLastRow() - 1, 8).getValues();
    var byKey = {};
    var order = [];
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var key = String(row[2]) + '|' + String(row[0]);
      if (!byKey[key]) {
        byKey[key] = {
          name: row[1],
          email: row[2],
          timestamp: row[0],
          questions: [],
        };
        order.push(key);
      }
      byKey[key].questions.push({
        questionId: row[3],
        score: row[4],
        grade: row[5],
        splText: row[6],
        explanation: row[7],
      });
    }
    var submissions = [];
    for (var k = 0; k < order.length; k++) {
      var sub = byKey[order[k]];
      var total = 0;
      for (var qi = 0; qi < sub.questions.length; qi++) {
        var s = Number(sub.questions[qi].score);
        if (!isNaN(s)) total += s;
      }
      sub.total = Math.round(total * 100) / 100;
      submissions.push(sub);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, submissions: submissions }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ error: 'No action specified' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function ensureSOCSheet(ss) {
  var soc = ss.getSheetByName('SOCData');
  if (!soc) {
    soc = ss.insertSheet('SOCData');
    soc.appendRow([
      'Timestamp', 'Name', 'Email', 'Question ID',
      'Score', 'Grade', 'SPL Text', 'Explanation', 'Proctoring Violations'
    ]);
  }
  return soc;
}

function checkPasscode(passcode) {
  var correct = PropertiesService.getScriptProperties().getProperty('REVIEWER_PASSCODE');
  return !!(correct && passcode === correct);
}

function sanitiseCell(val) {
  if (typeof val === 'string' && /^[=+\-@]/.test(val)) {
    return "'" + val;
  }
  return val;
}

function csvEscape(val) {
  var s = String(val == null ? '' : val);
  if (s.indexOf(',') !== -1 || s.indexOf('"') !== -1 || s.indexOf('\n') !== -1) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function buildResultsHtml(payload, socScaled, finalScore, tierVal) {
  var name = payload.name || 'Candidate';
  var z1 = payload.zone1Score || 0;
  var z2 = payload.zone2Score || 0;
  var z3 = payload.zone3Score || 0;
  var violations = payload.proctoring_violations || 0;
  var zonesTotal = z1 + z2 + z3;
  var normalized = payload.displayScore != null ? payload.displayScore : Math.round((zonesTotal / 60) * 100);
  var socTotal = payload.socTotal || 0;
  var socPct = Math.round((socTotal / 92) * 100);

  // Tone colors matching ResultsScreen titleTone()
  var toneAccent = '#8E8E93';
  var toneBg = '#e8e8ea';
  if (normalized >= 80) { toneAccent = '#34C759'; toneBg = '#eafaf0'; }
  else if (normalized >= 50) { toneAccent = '#FF9500'; toneBg = '#fff5e6'; }

  // RankCard accent (note: different logic from tier)
  var rankAccent = '#34C759';
  var rankEyebrow = 'Foundation analyst';
  if (normalized >= 80) { rankAccent = '#FF3B30'; rankEyebrow = 'Advanced analyst'; }
  else if (normalized >= 50) { rankAccent = '#FF9500'; rankEyebrow = 'Developing analyst'; }
  var rankTitle = normalized >= 80 ? 'Advanced' : normalized >= 50 ? 'Proficient' : 'Foundation';

  // Zone accuracy from perEmail data
  var perEmail = payload.perEmail || [];
  var zoneAcc = {};
  for (var z = 1; z <= 3; z++) {
    var emails = [];
    for (var ei = 0; ei < perEmail.length; ei++) {
      if (perEmail[ei].zone === z) emails.push(perEmail[ei]);
    }
    zoneAcc[z] = emails.length ? Math.round((emails.filter(function(r) { return r.l1Correct; }).length / emails.length) * 100) : 0;
  }

  // Competency summary from categoryCorrect
  var catCorrect = payload.categoryCorrect || {};
  var categories = [];
  for (var cat in catCorrect) {
    if (catCorrect.hasOwnProperty(cat) && catCorrect[cat].total > 0) {
      categories.push({
        cat: cat,
        accuracy: Math.round((catCorrect[cat].correct / catCorrect[cat].total) * 100),
        correct: catCorrect[cat].correct,
        total: catCorrect[cat].total
      });
    }
  }
  categories.sort(function(a, b) { return b.accuracy - a.accuracy; });

  var h = [];

  h.push('<!DOCTYPE html>');
  h.push('<html><head><meta charset="utf-8"></head>');
  h.push('<body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,Helvetica,sans-serif;">');
  h.push('<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:20px 0;">');
  h.push('<tr><td align="center">');
  h.push('<table width="680" cellpadding="0" cellspacing="0" style="max-width:680px;width:100%;">');

  // ═══ HERO CARD ═══
  h.push('<tr><td style="padding-bottom:12px;">');
  h.push('<table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:34px;border:1px solid #e0e3e8;overflow:hidden;">');
  h.push('<tr><td style="padding:28px 30px;">');
  h.push('<table width="100%" cellpadding="0" cellspacing="0"><tr>');
  // Left column
  h.push('<td valign="top" style="padding-right:18px;">');
  h.push('<div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#757882;margin-bottom:8px;">Assessment complete</div>');
  h.push('<div style="font-size:36px;font-weight:800;color:#111827;line-height:1.0;margin:0;">' + name + "'s final judgment score.</div>");
  h.push('<div style="font-size:15px;color:#6b7280;margin-top:14px;line-height:1.6;">Based on how accurately you classified each email across all four zones.</div>');
  h.push('</td>');
  // Right column - score box
  h.push('<td width="180" align="center" valign="top">');
  h.push('<table width="180" cellpadding="0" cellspacing="0" style="background:' + toneBg + ';border-radius:28px;border:1px solid ' + toneAccent + ';">');
  h.push('<tr><td style="padding:20px;text-align:center;">');
  h.push('<div style="font-size:72px;font-weight:800;color:#111827;line-height:1;letter-spacing:-3px;">' + normalized + '</div>');
  h.push('<div style="font-size:20px;font-weight:500;color:#9ca3af;">/100</div>');
  h.push('<div style="margin-top:10px;">');
  h.push('<table cellpadding="0" cellspacing="0" align="center"><tr>');
  h.push('<td style="background:' + toneBg + ';border-radius:999px;padding:8px 14px;">');
  h.push('<span style="font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:' + toneAccent + ';">' + rankTitle + '</span>');
  h.push('</td></tr></table>');
  h.push('</div>');
  h.push('</td></tr></table>');
  h.push('</td>');
  h.push('</tr></table>');
  h.push('</td></tr></table>');
  h.push('</td></tr>');

  // ═══ ZONE CARDS (3 columns) ═══
  h.push('<tr><td style="padding-bottom:12px;">');
  h.push('<table width="100%" cellpadding="0" cellspacing="0"><tr>');
  h.push(buildZoneCell('Zone 1', 'Inbox', z1, 20, '#0A84FF', zoneAcc[1]));
  h.push('<td width="12"></td>');
  h.push(buildZoneCell('Zone 2', 'Queue', z2, 20, '#30B0C7', zoneAcc[2]));
  h.push('<td width="12"></td>');
  h.push(buildZoneCell('Zone 3', 'Escalation', z3, 20, '#FF7A1A', zoneAcc[3]));
  h.push('</tr></table>');
  h.push('</td></tr>');

  // ═══ SOC INVESTIGATION CARD ═══
  h.push('<tr><td style="padding-bottom:12px;">');
  h.push('<table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:26px;border:1px solid #e0e3e8;">');
  h.push('<tr>');
  h.push('<td style="padding:20px 24px;">');
  h.push('<div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#7B2D8E;">SOC Investigation</div>');
  h.push('<div style="font-size:24px;font-weight:700;color:#111827;margin-top:4px;letter-spacing:-1px;">SPL query &amp; analysis</div>');
  h.push('<div style="font-size:13px;color:#6b7280;margin-top:4px;">Deterministic score across all SOC questions.</div>');
  h.push('</td>');
  h.push('<td width="140" align="right" style="padding:20px 24px;">');
  h.push('<span style="font-size:44px;font-weight:800;color:#111827;letter-spacing:-2px;">' + socPct + '</span>');
  h.push('<span style="font-size:18px;color:#b0b5be;">/ 100</span>');
  h.push('</td>');
  h.push('</tr></table>');
  h.push('</td></tr>');

  // ═══ COMBINED ASSESSMENT SCORE CARD ═══
  h.push('<tr><td style="padding-bottom:12px;">');
  h.push('<table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:26px;border:1px solid #e0e3e8;">');
  h.push('<tr>');
  h.push('<td style="padding:20px 24px;">');
  h.push('<div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#757882;">Combined Assessment Score</div>');
  h.push('<div style="font-size:13px;color:#6b7280;margin-top:2px;">Zones 1-3 + SOC Investigation</div>');
  h.push('</td>');
  h.push('<td width="160" align="right" style="padding:20px 24px;">');
  h.push('<span style="font-size:52px;font-weight:800;color:#111827;letter-spacing:-3px;">' + finalScore + '</span>');
  h.push('<span style="font-size:20px;color:#b0b5be;">/ 100</span>');
  h.push('</td>');
  h.push('</tr></table>');
  h.push('</td></tr>');

  // ═══ RANK CARD + COMPETENCY SUMMARY (2 columns) ═══
  h.push('<tr><td style="padding-bottom:12px;">');
  h.push('<table width="100%" cellpadding="0" cellspacing="0"><tr>');

  // Left: RankCard
  h.push('<td width="48%" valign="top">');
  h.push('<table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:26px;border:1px solid #e0e3e8;">');
  h.push('<tr><td style="padding:24px;">');
  // Eyebrow badge
  h.push('<table cellpadding="0" cellspacing="0"><tr>');
  h.push('<td style="background:#fef2f2;border:1px solid #fee2e2;border-radius:999px;padding:8px 14px;">');
  h.push('<span style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:' + rankAccent + ';">' + rankEyebrow + '</span>');
  h.push('</td></tr></table>');
  // Name
  h.push('<div style="font-size:32px;font-weight:700;color:#111827;margin-top:18px;letter-spacing:-2px;line-height:1;">' + name + '</div>');
  h.push('<div style="font-size:14px;color:#6b7280;margin-top:8px;line-height:1.55;">Final score based on classification accuracy, subcategory precision, and clue usage.</div>');
  // Tier + Score row
  h.push('<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;"><tr>');
  h.push('<td valign="bottom">');
  h.push('<div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#757882;margin-bottom:6px;">Competency tier</div>');
  h.push('<div style="font-size:24px;font-weight:800;color:' + rankAccent + ';letter-spacing:-1px;">' + rankTitle + '</div>');
  h.push('</td>');
  h.push('<td align="right" valign="bottom">');
  h.push('<span style="font-size:56px;font-weight:800;color:#111827;line-height:1;letter-spacing:-3px;">' + normalized + '</span>');
  h.push('<span style="font-size:20px;font-weight:600;color:#b0b5be;">/100</span>');
  h.push('</td>');
  h.push('</tr></table>');
  // Progress bar
  var barWidth = Math.max(0, Math.min(100, normalized));
  h.push('<div style="margin-top:16px;height:10px;border-radius:999px;background:#e5e7eb;overflow:hidden;">');
  h.push('<div style="width:' + barWidth + '%;height:10px;border-radius:999px;background:' + rankAccent + ';"></div>');
  h.push('</div>');
  // Assessment badge
  h.push('<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;"><tr>');
  h.push('<td style="background:#f9fafb;border:1px solid #f0f0f3;border-radius:18px;padding:14px;">');
  h.push('<div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#757882;">Assessment</div>');
  h.push('<div style="font-size:18px;font-weight:700;color:#111827;margin-top:4px;letter-spacing:-1px;">Flagmail</div>');
  h.push('</td></tr></table>');
  h.push('</td></tr></table>');
  h.push('</td>');

  h.push('<td width="16"></td>');

  // Right: CompetencySummary
  h.push('<td width="48%" valign="top">');
  h.push('<table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:28px;border:1px solid #e0e3e8;">');
  h.push('<tr><td style="padding:20px 24px;">');
  h.push('<div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#757882;margin-bottom:8px;">Competency Summary</div>');
  // Summary text
  var allStrong = true;
  var allWeak = true;
  var strongCats = [];
  var weakCats = [];
  for (var ci = 0; ci < categories.length; ci++) {
    if (categories[ci].accuracy >= 70) { strongCats.push(categories[ci].cat); }
    else { allStrong = false; }
    if (categories[ci].accuracy < 50) { weakCats.push(categories[ci].cat); }
    else { allWeak = false; }
  }
  var summaryText = '';
  if (categories.length === 0) {
    summaryText = 'Complete more emails to receive your competency summary.';
  } else if (allStrong) {
    summaryText = 'Exceptional performance across all threat categories. Ready for field deployment.';
  } else if (allWeak) {
    summaryText = 'Every analyst starts somewhere. Review the email patterns and sharpen your instincts.';
  } else {
    if (strongCats.length > 0) summaryText = 'Strong foundation in ' + strongCats.join(', ') + '. ';
    if (weakCats.length > 0) summaryText += 'Focus on building skills in ' + weakCats.join(', ') + '.';
    else summaryText += 'Keep sharpening your skills across all threat categories.';
  }
  h.push('<div style="font-size:15px;color:#111827;line-height:1.65;margin-bottom:16px;">' + summaryText + '</div>');
  // Category bars
  for (var bi = 0; bi < categories.length; bi++) {
    var c = categories[bi];
    var barColor = c.accuracy >= 70 ? '#34C759' : c.accuracy >= 50 ? '#FF9500' : '#FF3B30';
    h.push('<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;"><tr>');
    h.push('<td style="font-size:14px;font-weight:700;color:#111827;">' + c.cat + '</td>');
    h.push('<td align="right" style="font-size:13px;color:#6b7280;">' + c.correct + '/' + c.total + ' correct &middot; ' + c.accuracy + '%</td>');
    h.push('</tr></table>');
    h.push('<div style="height:8px;border-radius:999px;background:#e5e7eb;overflow:hidden;margin-bottom:6px;">');
    h.push('<div style="width:' + c.accuracy + '%;height:8px;border-radius:999px;background:' + barColor + ';"></div>');
    h.push('</div>');
  }
  h.push('</td></tr></table>');
  h.push('</td>');

  h.push('</tr></table>');
  h.push('</td></tr>');

  // ═══ PROCTORING ═══
  var vColor = violations > 0 ? '#FF3B30' : '#34C759';
  h.push('<tr><td style="padding:8px 0 12px;">');
  h.push('<table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;border:1px solid #e0e3e8;">');
  h.push('<tr><td style="padding:16px 24px;">');
  h.push('<span style="font-size:13px;color:#6b7280;">Proctoring Violations: </span>');
  h.push('<span style="font-size:13px;font-weight:700;color:' + vColor + ';">' + violations + '</span>');
  h.push('</td></tr></table>');
  h.push('</td></tr>');

  // ═══ FOOTER ═══
  h.push('<tr><td style="padding:8px 0 0;text-align:center;">');
  h.push('<div style="font-size:12px;color:#9ca3af;">SOC assessment responses are attached as a CSV.</div>');
  h.push('<div style="font-size:11px;color:#d1d5db;margin-top:6px;">FlagMail - Email Abuse Assessment Platform</div>');
  h.push('</td></tr>');

  h.push('</table>');
  h.push('</td></tr></table>');
  h.push('</body></html>');

  return h.join('');
}

function buildZoneCell(label, zoneName, score, max, accent, accuracy) {
  var c = [];
  c.push('<td valign="top">');
  c.push('<table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:26px;border:1px solid #e0e3e8;">');
  c.push('<tr><td style="padding:18px;">');
  c.push('<div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:' + accent + ';">' + label + '</div>');
  c.push('<div style="font-size:24px;font-weight:700;color:#111827;margin-top:8px;letter-spacing:-1px;">' + zoneName + '</div>');
  c.push('<div style="margin-top:8px;">');
  c.push('<span style="font-size:34px;font-weight:800;color:#111827;letter-spacing:-2px;">' + score + '</span>');
  c.push('<span style="font-size:16px;color:#b0b5be;"> / ' + max + '</span>');
  c.push('</div>');
  c.push('<div style="font-size:13px;color:#6b7280;margin-top:6px;">' + (accuracy || 0) + '% category accuracy</div>');
  c.push('</td></tr></table>');
  c.push('</td>');
  return c.join('');
}
