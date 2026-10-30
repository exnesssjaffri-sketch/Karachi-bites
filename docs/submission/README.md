# Karachi Bites — Documentation Index

This directory contains the complete documentation package for the Karachi Bites project.

## Generated Files

| File | Description |
| --- | --- |
| `KARACHI_BITES_PROJECT_REPORT.md` | Main student project report (30 sections) |
| `TECHNICAL_DOCUMENTATION.md` | Source file responsibilities and API endpoints |
| `INSTALLATION_GUIDE.md` | Software requirements and setup instructions |
| `USER_MANUAL.md` | User-facing guide for customers, staff, and admins |
| `TESTING_REPORT.md` | Test evidence and current GitHub Actions status |
| `DIAGRAMS.md` | System architecture and workflow diagrams (Mermaid) |
| `screenshots/` | Visual QA screenshots at 5 viewports (9 PNG files) |

## How to Generate PDF

Run the following command from the project root:

```bash
node scripts/generate-pdf.js
```

This script converts all Markdown files to a single styled HTML document and uses Edge (headless) to produce `Karachi_Bites_Project_Documentation.pdf`.

**Note:** If PDF generation is not available in your environment, the Markdown files below serve as the primary deliverable.

## Documentation Quality Notes

- All technical claims are verified against the source code at commit `90dd0bce3c`.
- No fabricated test results, API endpoints, database tables, or deployment capabilities are included.
- The latest GitHub Actions Tests run (41035876169) is honestly documented as a failure.
- No real customer data, passwords, API keys, or secrets appear in any document.
- Placeholder fields (student name, institution, supervisor) are left blank for the submitter to fill in.