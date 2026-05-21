/**
 * FlagMail — Google Apps Script
 *
 * Handles:
 *   POST action:"register" — saves name + email immediately when assessment starts
 *   POST action:"submit"   — updates that row with scores + writes per-email raw data
 *   GET  ?checkEmail=...   — checks if an email has already been used
 *
 * Setup:
 *   1. Create a Google Sheet with two tabs: "Summary" and "RawData"
 *   2. Extensions > Apps Script > paste this file
 *   3. Deploy > New deployment > Web app > Execute as: Me, Access: Anyone
 *   4. Copy the URL into flagmail1/src/config.js
 */

function ensureSheets(ss) {
  var summary = ss.getSheetByName('Summary');
  if (!summary) {
    summary = ss.insertSheet('Summary');
    summary.appendRow([
      'Timestamp', 'Name', 'Email', 'Status',
      'Score', 'Display Score', 'Tier',
      'Zone 1', 'Zone 2', 'Zone 3', 'Proctoring Violations'
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
    var ss = SpreadsheetApp.getActiveSpreadsheet();
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

    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'Unknown action' })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ── GET ───────────────────────────────────────────────────────────────────────

function doGet(e) {
  var checkEmail = (e.parameter && e.parameter.checkEmail) || '';

  if (checkEmail) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
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

    var ss = SpreadsheetApp.getActiveSpreadsheet();
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
