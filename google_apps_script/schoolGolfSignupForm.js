/**
 * Google Apps Script: School Golf Program Registration
 * Connects Google Form responses to Airtable
 */

const AIRTABLE_TOKEN = 'pat78mOnaC9uOiuiz.e02ffa29d0843de0ba83f8e4e52e234ca4832100ba6767a512c7d93dc81294b4';
const BASE_ID = 'appUEKaccYCxXUdDB';

const SCHOOLS_TABLE = 'Schools';
const CONTACTS_TABLE = 'Proshop Contacts';
const SEASONS_TABLE = 'Schools: Seasons';

function onFormSubmit(e) {
  const form = e.namedValues;

  Logger.log(form);

  const schoolName = form['School Name'][0];
  const districtName = form['District Name'][0] || '';
  const coachName = form['Coach Name'][0];
  const coachEmail = form['Coach Email'][0];
  const coachPhone = form['Coach Phone'][0] || '';
  const billName = form['Bill Payer Name'][0] || '';
  const billEmail = form['Bill Payer Email'][0] || '';

  const seasonType = form['Season Type'][0];
  const teamName = form['Team Name'][0];
  const startDate = form['Start Date'][0];
  const endDate = form['End Date'][0];
  const practiceDays = form['Practice Days'][0]
    .split(',')
    .map(day => day.trim())
    .filter(day => day);
  const locations = form['Facilities Requested'][0]
    .split(',')
    .map(loc => loc.trim())
    .filter(loc => loc);
  const studentCount = parseInt(form['Estimated Number of Students'][0] || '0');
  const notes = form['Notes'][0] || '';

  const schoolId = findOrCreateSchool(schoolName, districtName);
  const coachId = findOrCreateContact(coachName, coachEmail, coachPhone, 'Coach');

  if (coachId && typeof coachId === 'string') {
    airtablePatch(SCHOOLS_TABLE, schoolId, {
      'Coach': [coachId]
    });
  } else {
    throw new Error(`Invalid coachId: ${coachId}`);
  }

  if (billEmail && billName) {
    findOrCreateContact(billName, billEmail, '', 'Bill Payer');
  }

  createSeasonRecord({
    seasonType,
    schoolId,
    teamName,
    startDate,
    endDate,
    practiceDays,
    locations,
    studentCount,
    notes
  });
}

function findOrCreateSchool(name, district) {
  const formula = `SEARCH(\"${name}\", {School Name})`;
  const records = airtableGet(SCHOOLS_TABLE, `filterByFormula=${encodeURIComponent(formula)}`);
  if (records.length > 0) return records[0].id;

  const result = airtablePost(SCHOOLS_TABLE, {
    'School Name': name,
    'District Name': district
  });
  return result.id;
}

function findOrCreateContact(name, email, phone, role) {
  const formula = `{Email} = '${email}'`;
  const records = airtableGet(CONTACTS_TABLE, `filterByFormula=${encodeURIComponent(formula)}`);
  if (records.length > 0) return records[0].id;

  const result = airtablePost(CONTACTS_TABLE, {
    'Name': name,
    'Email': email,
    'Phone Number': phone,
    'Role': role
  });
  return result.id;
}

function createSeasonRecord(data) {
  airtablePost(SEASONS_TABLE, {
    'Season Type': data.seasonType,
    'School': [data.schoolId],
    'Team Name': data.teamName,
    'Start Date': data.startDate,
    'End Date': data.endDate,
    'Practice Days': data.practiceDays,
    'Use Locations': data.locations,
    'Estimated Students': data.studentCount,
    'Status': 'New',
    'Notes': data.notes
  });
}

function airtableGet(table, filter = '') {
  const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}?${filter}`;
  const response = UrlFetchApp.fetch(url, {
    headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` }
  });
  return JSON.parse(response.getContentText()).records;
}

function airtablePost(table, fields) {
  const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}`;
  const options = {
    method: 'POST',
    contentType: 'application/json',
    headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
    payload: JSON.stringify({ fields })
  };
  const response = UrlFetchApp.fetch(url, options);
  const result = JSON.parse(response.getContentText());

  if (!result.id) {
    throw new Error(`Failed to create record in ${table}: ${JSON.stringify(result)}`);
  }

  return result;
}

function airtablePatch(table, recordId, fields) {
  const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}/${recordId}`;
  const options = {
    method: 'PATCH',
    contentType: 'application/json',
    headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
    payload: JSON.stringify({ fields })
  };
  const response = UrlFetchApp.fetch(url, options);
  return JSON.parse(response.getContentText());
}
