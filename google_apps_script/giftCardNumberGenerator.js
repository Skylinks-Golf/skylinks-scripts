function generateGiftCardNumbers() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const prefix = '2025';  // Example prefix
  const quantity = 20;  // Number of gift cards to generate each time
  const dataRange = sheet.getDataRange();
  const numRows = dataRange.getNumRows();
  const lastSeqNum = numRows > 1 ? sheet.getRange(numRows, 1).getValue() : 999;  // Get last sequential number

  for (let i = 1; i <= quantity; i++) {
    const seqNumber = lastSeqNum + i;
    const suffix = Math.floor(1000 + Math.random() * 9000);  // Generate a 4-digit random suffix
    const giftCardNumber = prefix + seqNumber.toString().padStart(8, '0') + suffix.toString();

    // Append new row with a checkbox for the "Active" status
    const newRow = sheet.appendRow([seqNumber, giftCardNumber, false]);
    const checkboxCell = newRow.getRange(1, 3);  // Adjusting to add a checkbox in column C
    checkboxCell.insertCheckboxes();
  }
}
