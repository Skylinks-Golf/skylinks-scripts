/**
 * Airtable > Skylinks at Buchanan Fields Base > Staff table
 * 
 * This script runs through all staff birthdates and checks to see if any are within 30 days.
 * If a staff member's birthdate is within 30 days, a birthday cake emoji is prepended to the name field.
 * 
 * 
 */

let table = base.getTable("Staff"); // Change this to your table name
let view = table.getView("Grid view"); // Or whatever view you're using

let today = new Date();
let thisYear = today.getFullYear();
let records = await view.selectRecordsAsync();

console.log("Checking for any upcoming staff birthdays...")

for (let record of records.records) {
    let birthday = record.getCellValue("Birthday");
    let name = record.getCellValue("Name") || "";
    let hasCake = name.startsWith("🎂");

    if (!birthday && hasCake ) {
        removeCake(record, name);
        break;
    } 

    // Set birthday year to this year
    let bdayThisYear = new Date(birthday);
    bdayThisYear.setFullYear(thisYear);

    // If the birthday already passed this year, check next year's instead
    if (bdayThisYear < today) {
        bdayThisYear.setFullYear(thisYear + 1);
    }

    let diffInDays = Math.floor((bdayThisYear - today) / (1000 * 60 * 60 * 24));

    let shouldAddCake = diffInDays >= 0 && diffInDays <= 30;
    // let hasCake = name.startsWith("🎂");

    if (shouldAddCake && !hasCake) {
        // Add cake emoji
        await table.updateRecordAsync(record.id, {
            "Name": "🎂 " + name
        });

        console.log(`${record.name} has a birthday coming up!`);

    } else if (!shouldAddCake && hasCake) {
        // Remove cake emoji
        removeCake(record, name);
}
}

async function removeCake(record, name) {
    await table.updateRecordAsync(record.id, {
        "Name": name.replace(/^🎂\s*/, "")
    })
}