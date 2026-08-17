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
      var existingRow = findRowByEmail(sheets.summary, payload.email || '');
      if (existingRow > 0) {
        var existingStatus = String(sheets.summary.getRange(existingRow, 4).getValue()).trim();
        if (existingStatus === 'Completed') {
          return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'Already completed' })).setMimeType(ContentService.MimeType.JSON);
        }
        // In Progress — update timestamp only, no duplicate row
        sheets.summary.getRange(existingRow, 1).setValue(ts);
        return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
      }
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
        // Set Status = 'Completed' (col 4)
        sheets.summary.getRange(row, 4).setValue('Completed');
        // Update Tier (col 7) with combined-score tier
        sheets.summary.getRange(row, 7, 1, 1).setValue(tierVal);
        // Update Score (col 5) and Display Score (col 6)
        sheets.summary.getRange(row, 5, 1, 2).setValues([[finalScore, finalScore]]);
        // Write Zone 4 (SOC) in col 12 and Final Score /100 in col 13
        sheets.summary.getRange(row, 12, 1, 2).setValues([[socScaled, finalScore]]);
      } else {
        // Fallback: candidate started SOC without a prior register/submit row
        sheets.summary.appendRow([
          ts,
          payload.name || '', payload.email || '',
          'Completed',
          finalScore,
          finalScore,
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

      return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
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
            totalScore: (row[11] !== undefined && row[11] !== null && row[11] !== "") ? (Number(row[12]) || 0) : (Number(row[5]) || 0),
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

      var integritySheet = ss.getSheetByName('IntegrityLogs');
      var integrityLogs = [];
      if (integritySheet && integritySheet.getLastRow() > 1) {
        var integrityData = integritySheet.getRange(2, 1, integritySheet.getLastRow() - 1, 6).getValues();
        integrityLogs = integrityData.map(function(row) {
          return { timestamp: row[0], name: row[1], email: row[2], logType: row[3], details: row[4], phase: row[5] };
        });
      }

      return ContentService.createTextOutput(JSON.stringify({
        ok: true,
        candidates: candidates,
        rawData: rawData,
        socData: socData,
        integrityLogs: integrityLogs,
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'logIntegrity') {
      var integritySheet = ss.getSheetByName('IntegrityLogs');
      if (!integritySheet) {
        integritySheet = ss.insertSheet('IntegrityLogs');
        integritySheet.appendRow(['Timestamp', 'Name', 'Email', 'LogType', 'Details', 'Phase']);
      }
      var iEmail = payload.email || '';
      var iLogType = payload.logType || '';
      var iDetails = payload.details || {};
      // Find name from Summary
      var sheets = ensureSheets(ss);
      var iRow = findRowByEmail(sheets.summary, iEmail);
      var iName = iEmail;
      if (iRow > 0) {
        iName = String(sheets.summary.getRange(iRow, 2).getValue()) || iEmail;
      }
      // Determine phase
      var detailsStr = JSON.stringify(iDetails);
      var iPhase = 'assessment';
      if (/zone/i.test(detailsStr)) {
        var zoneMatch = detailsStr.match(/zone\s*(\d+)/i);
        if (zoneMatch) iPhase = 'zone' + zoneMatch[1];
      }
      integritySheet.appendRow([new Date().toISOString(), iName, iEmail, iLogType, detailsStr, iPhase]);
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
    var checkRow = findRowByEmail(sheets.summary, checkEmail);

    if (checkRow < 0) {
      return ContentService
        .createTextOutput(JSON.stringify({ exists: false }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    var statusVal = String(sheets.summary.getRange(checkRow, 4).getValue()).trim();
    if (statusVal === 'Completed') {
      return ContentService
        .createTextOutput(JSON.stringify({ exists: true, status: 'completed' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    // In Progress (or any other status) — not blocked, let them re-enter
    return ContentService
      .createTextOutput(JSON.stringify({ exists: false, status: 'in_progress' }))
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

