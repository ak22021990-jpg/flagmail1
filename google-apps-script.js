/**
 * FlagMail — Google Apps Script
 *
 * Deploy as Web App (Execute as: Me, Access: Anyone).
 * Handles:
 *   POST  →  writes one row to "Summary" + one row per email to "RawData"
 *
 * Required sheets (create them in the same spreadsheet):
 *   1. "Summary"  — columns: Timestamp, Name, Email, Score, DisplayScore, Tier, Zone1, Zone2, Zone3
 *   2. "RawData"  — columns: Timestamp, Name, Email, EmailID, Zone, SelectedL1, SelectedL2,
 *                     CorrectL1, CorrectL2, L1Correct, L2Correct, CluesUsed, TimedOut, Points
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var ts = new Date();

    // ── Summary sheet ───────────────────────────────────────────────────────
    var summary = ss.getSheetByName('Summary');
    if (!summary) {
      summary = ss.insertSheet('Summary');
      summary.appendRow([
        'Timestamp', 'Name', 'Email', 'Score', 'DisplayScore', 'Tier',
        'Zone1', 'Zone2', 'Zone3'
      ]);
    }
    summary.appendRow([
      ts,
      data.name || '',
      data.email || '',
      data.score || 0,
      data.displayScore || 0,
      data.title || '',
      data.zone1Score || 0,
      data.zone2Score || 0,
      data.zone3Score || 0,
    ]);

    // ── RawData sheet ───────────────────────────────────────────────────────
    var raw = ss.getSheetByName('RawData');
    if (!raw) {
      raw = ss.insertSheet('RawData');
      raw.appendRow([
        'Timestamp', 'Name', 'Email', 'EmailID', 'Zone',
        'SelectedL1', 'SelectedL2', 'CorrectL1', 'CorrectL2',
        'L1Correct', 'L2Correct', 'CluesUsed', 'TimedOut', 'Points'
      ]);
    }

    var perEmail = data.perEmail || [];
    for (var i = 0; i < perEmail.length; i++) {
      var r = perEmail[i];
      raw.appendRow([
        ts,
        data.name || '',
        data.email || '',
        r.emailId || '',
        r.zone || '',
        r.selectedL1 || '',
        r.selectedL2 || '',
        r.correctL1 || '',
        r.correctL2 || '',
        r.l1Correct === true,
        r.l2Correct === true,
        r.cluesUsed || 0,
        r.timedOut === true,
        r.points || 0,
      ]);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

