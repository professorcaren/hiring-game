/**
 * Google Apps Script for Hiring Conjoint Experiment.
 *
 * Deploy:
 *   1. Create a Google Sheet
 *   2. Extensions > Apps Script
 *   3. Paste this code into Code.gs
 *   4. Deploy > New deployment > Web app
 *      - Execute as: Me
 *      - Who has access: Anyone
 *   5. Copy the URL into app.js APPS_SCRIPT_URL
 */

var SHEET_NAME = 'Responses';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = getOrCreateSheet();
    var rows = data.results;
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      sheet.appendRow([
        new Date().toISOString(),
        data.sessionId,
        r.round,
        r.left.name,
        r.left.gender,
        r.left.nameClass,
        r.left.phd,
        r.left.phdTier,
        r.left.pubs,
        r.left.teaching,
        r.right.name,
        r.right.gender,
        r.right.nameClass,
        r.right.phd,
        r.right.phdTier,
        r.right.pubs,
        r.right.teaching,
        r.chosenSide,
        r.chosenPosition || '',
      ]);
    }
    return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var sheet = getOrCreateSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return ContentService.createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    var data = sheet.getRange(2, 1, lastRow - 1, 19).getValues();
    var headers = ['timestamp', 'session_id', 'round',
      'left_name', 'left_gender', 'left_class', 'left_phd', 'left_phd_tier', 'left_pubs', 'left_teaching',
      'right_name', 'right_gender', 'right_class', 'right_phd', 'right_phd_tier', 'right_pubs', 'right_teaching',
      'chosen_side', 'chosen_position'];
    var result = data.map(function (row) {
      var obj = {};
      for (var i = 0; i < headers.length; i++) {
        obj[headers[i]] = row[i];
      }
      return obj;
    });
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    var headers = [
      'Timestamp', 'Session ID', 'Round',
      'Left Name', 'Left Gender', 'Left Class', 'Left PhD', 'Left PhD Tier', 'Left Pubs', 'Left Teaching',
      'Right Name', 'Right Gender', 'Right Class', 'Right PhD', 'Right PhD Tier', 'Right Pubs', 'Right Teaching',
      'Chosen Side', 'Chosen Position'
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  return sheet;
}
