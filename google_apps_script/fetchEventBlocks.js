function doGet() {
  const AIRTABLE_API_KEY = 'patHVwTNQIhmxl1Sg.a28e55d120e35854cb27cdd8b4cc6a57b569ad31e739fdbd4455117df12c83e5';
  const BASE_ID = 'app1L7NbGnRnRZ8UD'; // replace with your actual base ID
  const TABLE_NAME = 'EventBlocks';

  const filter = encodeURIComponent(`Status="Open"`); // encode formula
  const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}?filterByFormula=${filter}&sort%5B0%5D%5Bfield%5D=Date&sort%5B0%5D%5Bdirection%5D=asc`;

  const options = {
    method: 'get',
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`
    }
  };

  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response.getContentText());

  const simplified = data.records.map(rec => ({
    id: rec.id,
    title: rec.fields['Time Block'],
    date: rec.fields['Date']
  }));

  return ContentService
    .createTextOutput(JSON.stringify(simplified))
    .setMimeType(ContentService.MimeType.JSON);
}

// console.log(doGet().getContent())