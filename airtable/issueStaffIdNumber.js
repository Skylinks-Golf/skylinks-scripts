/**
 * 
 * Airtable > Skylinks at Buchanan Fields base > Staff table
 * 
 */


// CONFIG
const tableName = 'Staff';
const departmentField = 'Dep';
const employeeNumberField = 'Employee Number';

const departmentRanges = {
    'Pro Shop': { min: 0, max: 99 },
    'Kitchen': { min: 300, max: 399 },
    'Range Crew': { min: 200, max: 299 },
    // Add more departments and ranges here
};

// Get input config
let table = base.getTable(tableName);
let record = await input.recordAsync('Select a staff record:', table);
let recordId = record.id;


// let table = base.getTable(tableName);
// // let record = await table.selectRecordAsync(recordId);
// if (!record) {
//     throw new Error('Record not found');
// }

// Get department
let department = record.getCellValueAsString(departmentField);
if (!department || !(department in departmentRanges)) {
    throw new Error(`Missing or unknown department: ${department}`);
}

let { min, max } = departmentRanges[department];

// Get all records
let query = await table.selectRecordsAsync();
let usedNumbers = new Set();

for (let r of query.records) {
    if (r.getCellValueAsString(departmentField) !== department) continue;
    let num = parseInt(r.getCellValue(employeeNumberField));
    if (!isNaN(num) && num >= min && num <= max) {
        usedNumbers.add(num);
    }
}

console.log(usedNumbers);

// Find next available number
let nextNumber = min;
while (usedNumbers.has(nextNumber) && nextNumber <= max) {
    nextNumber++;
}

if (nextNumber > max) {
    throw new Error(`No available IDs left in range for ${department}`);
}

let formattedNumber = String(nextNumber).padStart(3, '0');

await table.updateRecordAsync(record.id, {
    [employeeNumberField]: formattedNumber
});
