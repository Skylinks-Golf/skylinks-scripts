## SQLite Database for Card Imaging Software - Implementation Guide

### Overview

This feature implements an SQLite database to store member data for printing membership cards using CardImaging software. The database will be document-internal and accessible by CardImaging for card production.

### Database Schema

```sql
CREATE TABLE members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_number TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  email TEXT NOT NULL,
  photo BLOB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups by member number
CREATE INDEX idx_member_number ON members(member_number);

-- Index for email lookups
CREATE INDEX idx_email ON members(email);
```

### Field Specifications

- **member_number**: Unique identifier for each member (TEXT, UNIQUE, NOT NULL)
- **first_name**: Member's first name (TEXT, NOT NULL)
- **email**: Member's email address (TEXT, NOT NULL)
- **photo**: Member photo stored as BLOB for card printing
- **created_at**: Timestamp of record creation
- **updated_at**: Timestamp of last update

### Implementation Steps

1. Database SetupCreate the SQLite database file in a location accessible to CardImaging software.
    
    ```jsx
    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database('./members.db');
    
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_number TEXT UNIQUE NOT NULL,
        first_name TEXT NOT NULL,
        email TEXT NOT NULL,
        photo BLOB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
      
      db.run('CREATE INDEX IF NOT EXISTS idx_member_number ON members(member_number)');
      db.run('CREATE INDEX IF NOT EXISTS idx_email ON members(email)');
    });
    
    db.close();
    ```
    
2. Insert Member DataFunction to add new members to the database.
    
    ```jsx
    function insertMember(memberData) {
      return new Promise((resolve, reject) => {
        const { member_number, first_name, email, photo } = memberData;
        
        const sql = `INSERT INTO members (member_number, first_name, email, photo)
                     VALUES (?, ?, ?, ?)`;
        
        db.run(sql, [member_number, first_name, email, photo], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID });
          }
        });
      });
    }
    ```
    
3. Handle Photo DataConvert image files to BLOB format for database storage.
    
    ```jsx
    const fs = require('fs');
    
    function photoToBlob(photoPath) {
      return fs.readFileSync(photoPath);
    }
    
    // Example usage
    const photoBlob = photoToBlob('./photos/member_001.jpg');
    insertMember({
      member_number: 'M001',
      first_name: 'John',
      email: 'john@example.com',
      photo: photoBlob
    });
    ```
    
4. Query Member DataRetrieve member information for card printing.
    
    ```jsx
    function getMemberByNumber(memberNumber) {
      return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM members WHERE member_number = ?';
        
        db.get(sql, [memberNumber], (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        });
      });
    }
    
    function getAllMembers() {
      return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM members ORDER BY first_name';
        
        db.all(sql, [], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
    }
    ```
    
5. Update Member DataFunction to update existing member records.
    
    ```jsx
    function updateMember(memberNumber, updates) {
      return new Promise((resolve, reject) => {
        const fields = Object.keys(updates);
        const values = Object.values(updates);
        const setClause = fields.map(f => `${f} = ?`).join(', ');
        
        const sql = `UPDATE members 
                     SET ${setClause}, updated_at = CURRENT_TIMESTAMP
                     WHERE member_number = ?`;
        
        db.run(sql, [...values, memberNumber], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ changes: this.changes });
          }
        });
      });
    }
    ```
    
6. Export Photo from DatabaseExtract photo BLOB for use with CardImaging.
    
    ```jsx
    function exportPhoto(memberNumber, outputPath) {
      return new Promise((resolve, reject) => {
        db.get('SELECT photo FROM members WHERE member_number = ?', 
          [memberNumber], 
          (err, row) => {
            if (err) {
              reject(err);
            } else if (!row || !row.photo) {
              reject(new Error('Photo not found'));
            } else {
              fs.writeFileSync(outputPath, row.photo);
              resolve(outputPath);
            }
          }
        );
      });
    }
    ```
    

### CardImaging Integration

CardImaging software can connect to the SQLite database using its document-internal database connection feature:

- **Database File**: Specify the path to `members.db`
- **Query Setup**: Configure CardImaging to query the members table
- **Field Mapping**: Map database fields to card template placeholders
- **Photo Handling**: Configure CardImaging to read BLOB photo data directly or export to temporary files

### Data Migration from Airtable

If member data exists in Airtable, create a migration script:

```jsx
const Airtable = require('airtable');

async function migrateFromAirtable() {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
    .base(process.env.AIRTABLE_BASE_ID);
  
  const records = await base('Members').select().all();
  
  for (const record of records) {
    const photoUrl = record.get('Photo')?.[0]?.url;
    let photoBlob = null;
    
    if (photoUrl) {
      const response = await fetch(photoUrl);
      const buffer = await response.arrayBuffer();
      photoBlob = Buffer.from(buffer);
    }
    
    await insertMember({
      member_number: record.get('Member Number'),
      first_name: record.get('First Name'),
      email: record.get('Email'),
      photo: photoBlob
    });
  }
}
```

### Testing Checklist

- [ ]  Create SQLite database with schema
- [ ]  Test inserting member records with photos
- [ ]  Verify member_number uniqueness constraint
- [ ]  Test querying members by member_number
- [ ]  Test photo BLOB storage and retrieval
- [ ]  Export sample photos to verify image quality
- [ ]  Configure CardImaging database connection
- [ ]  Test card printing with sample member data
- [ ]  Verify all required fields display correctly on cards

### Security Considerations

- **File Permissions**: Ensure database file has appropriate read/write permissions
- **Backup Strategy**: Implement regular database backups
- **Data Validation**: Validate email format and member_number format before insertion
- **SQL Injection**: Use parameterized queries (already implemented above)

### Future Enhancements

- Add phone number field for additional member contact info
- Add membership type/tier field
- Add expiration date for membership cards
- Implement soft delete (is_active flag) instead of hard deletes
- Add barcode/QR code generation for card scanning