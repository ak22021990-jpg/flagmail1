/**
 * FlagMail — Google Apps Script
 *
 * Handles:
 *   POST action:"register" — saves name + email immediately when assessment starts
 *   POST action:"submit"   — updates that row with scores + writes per-email raw data
 *   GET  ?checkEmail=...   — checks if an email has already been used
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

      // 5. Send email to reviewers
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
    var correct = PropertiesService.getScriptProperties().getProperty('REVIEWER_PASSCODE');
    if (!correct || passcode !== correct) {
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
