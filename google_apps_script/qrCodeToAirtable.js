// 🔐 CONFIG
const AIRTABLE_API_KEY = 'patI8ZKsNPIpqOx4W.9fecb9d550196e05c3e8bf51142c94dc0b8d780b3e62c85e493ce9b52aec79f8';
const BASE_ID = 'app6DkHOvJF8Vwflt';
const TABLE_NAME = 'Website URLs'; // URL-encoded table name
const URL_FIELD = 'Link';
const QR_FIELD = 'QR Code';
const SHEET_ID = '1CFe6L1JMylsA1qTXZHfHgBlNRdwZB8cfqvLzozgw2X8'; // For logging

function doGet(e) {
  const recordId = e.parameter.recordId;
  if (!recordId) {
    Logger.log("❌ No recordId received in request.");
    return htmlResponse('❌ Missing record ID');
  }

  Logger.log(`📥 Received request to generate QR for recordId: ${recordId}`);

  const airtableRecordURL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}/${recordId}`;

  try {
    Logger.log(`🔍 Fetching record data from Airtable: ${airtableRecordURL}`);

    const fetchResponse = UrlFetchApp.fetch(airtableRecordURL, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    });
    const record = JSON.parse(fetchResponse.getContentText());
    const urlValue = record.fields[URL_FIELD];
    const hasQR = record.fields[QR_FIELD];

    Logger.log(`🔗 URL in record: ${urlValue}`);
    Logger.log(`📎 QR already exists: ${!!hasQR}`);

    if (!urlValue) {
      Logger.log("❌ No URL found in record.");
      logStatus(recordId, '', '❌ No URL in record');
      return htmlResponse('❌ This record has no URL.');
    }

    if (hasQR) {
      Logger.log("⚠️ QR Code already exists. Skipping generation.");
      logStatus(recordId, urlValue, '⚠️ QR already exists');
      return htmlResponse('⚠️ A QR code already exists for this record.');
    }

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(urlValue)}&size=300x300`;
    Logger.log(`🧪 Generated QR code URL: ${qrUrl}`);

    const updatePayload = {
      fields: {
        [QR_FIELD]: [{ url: qrUrl }]
      }
    };

    Logger.log(`📤 Sending PATCH to Airtable with QR image...`);
    const updateResponse = UrlFetchApp.fetch(airtableRecordURL, {
      method: 'patch',
      contentType: 'application/json',
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
      payload: JSON.stringify(updatePayload)
    });

    Logger.log(`✅ Airtable update response: ${updateResponse.getResponseCode()}`);
    logStatus(recordId, urlValue, '✅ QR Created');

    return htmlResponse(`✅ QR Code successfully generated for:<br><code>${urlValue}</code>`);

  } catch (err) {
    Logger.log(`❌ Error: ${err.message}`);
    logStatus(recordId, '', `❌ Error: ${err.message}`);
    return htmlResponse(`❌ Error occurred: ${err.message}`);
  }
}

function htmlResponse(message) {
  return HtmlService.createHtmlOutput(`
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>QR Code Generator</h2>
      <p>${message}</p>
      <a href="#" onclick="window.close(); return false;">Close this tab</a>
    </div>
  `);
}

function logStatus(recordId, url, status) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    sheet.appendRow([
      new Date().toISOString(),
      recordId,
      url,
      status
    ]);
    Logger.log(`📝 Logged to sheet: [${recordId}] ${status}`);
  } catch (err) {
    Logger.log(`❌ Failed to log to sheet: ${err.message}`);
  }
}
