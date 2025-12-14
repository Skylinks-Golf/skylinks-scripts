# Onboarding Documentation for Codex

## Project Overview

**Project Name:** Airtable Photo Export Script

**Purpose:** Create a Python script that automates the export of member photos from Airtable, renaming them by email address, and saving them to a local folder for use with CardImaging software.

## Context & Background

**Current Workflow:**

- Exporting member data from Airtable as CSV for CardImaging software works successfully
- Photos cannot be exported in a format compatible with CardImaging
- Manual photo handling is creating a bottleneck in the card printing workflow

**CardImaging Software Requirements:**

- Requires photo files to be named using the member's email address
- Photos must be stored in a specific folder structure

## Technical Specifications

### Data Source

- **Platform:** Airtable
- **Table:** '2026 Members - Lightspeed Tracking'
- **View:** 'Photo Export'
- **Required Fields:** Email address and Photo attachment

### Technology Stack

- **Language:** Python
- **Execution:** Terminal/command line on local computer
- **Dependencies:** Will need Airtable Python library (pyairtable or similar)
- **NOT using:** Google Cloud, Apps Script, or other cloud-based solutions

### Script Requirements

**Core Functionality:**

1. Connect to Airtable API with proper authentication
2. Query the 'Photo Export' view in the '2026 Members - Lightspeed Tracking' table
3. Extract email addresses and photo URLs from each record
4. Download photos from Airtable
5. Rename each photo file to match the corresponding email address (e.g., `john.doe@example.com.jpg`)
6. Save renamed photos to a user-specified local folder

**Additional Considerations:**

- Error handling for missing emails or photos
- Progress indication during batch processing
- Handling of duplicate email addresses (if applicable)
- File format preservation (jpg, png, etc.)
- Configuration file or command-line arguments for API key, base ID, table name, and output folder

## Prerequisites & Setup

**What will be needed:**

- Airtable API key (Personal Access Token)
- Airtable Base ID
- Python 3.x installed on local machine
- pip for installing Python packages
- Local folder path where photos should be saved

## Success Criteria

- Script successfully authenticates with Airtable
- All photos from the 'Photo Export' view are downloaded
- Photos are correctly renamed using email addresses
- Photos are saved to the specified local folder
- Script can be run repeatedly without issues
- Clear error messages for any failures

## Scope Boundaries

**In Scope:**

- Python script for terminal execution
- Airtable API integration
- Photo download and renaming
- Local file storage

**Out of Scope:**

- Cloud-based solutions (Google Cloud, AWS, etc.)
- Browser-based automation (Apps Script)
- Integration directly with CardImaging software
- CSV export functionality (already working)
- Automated scheduling or continuous syncing

## Next Steps for Development

1. Set up Python environment and install required libraries
2. Obtain Airtable API credentials and Base ID
3. Create basic script structure with API connection
4. Implement photo download functionality
5. Add file renaming logic
6. Test with sample records
7. Add error handling and logging
8. Create configuration file or command-line interface
9. Document usage instructions

## Current Scaffold

- `photo_export.py` contains the CLI entrypoint. Supply a config file (defaults to `.env`) and run `python photo_export.py --config .env.local`.
- `config_loader.py` parses `.env`, `.json`, or `.yaml` files into a normalized configuration object and validates required keys.
- `.env.example` lists all required settings (API key, base, table/view names, field names, and output path). Copy it to `.env` and update the values before running the exporter.
