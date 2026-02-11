/**
 * Generate Barcode for New Record
 * Skylinks Airtable Automation Script
 * Ian 2025
 */

const TABLE_NAME = 'Events';
const SOURCE_FIELD = 'Lightspeed Customer Number';
const BARCODE_FIELD = 'Barcode';

const table = base.getTable(TABLE_NAME);
const records = await table.selectRecordsAsync();

for (let record of records.records) {
    const customerNumber = record.getCellValue(SOURCE_FIELD);
    const alreadyHasBarcode = record.getCellValue(BARCODE_FIELD);

    if (!customerNumber || alreadyHasBarcode) {
        continue; // Skip if empty or already has barcode
    }

    const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(customerNumber)}&includetext&backgroundcolor=FFFFFF`;

    await table.updateRecordAsync(record.id, {
        [BARCODE_FIELD]: [{
            url: barcodeUrl,
            filename: `barcode-${customerNumber}.png`,
        }],
    });

    console.log(`✅ Created barcode for: ${customerNumber}`);
}

console.log("🎉 All done generating barcodes!");
