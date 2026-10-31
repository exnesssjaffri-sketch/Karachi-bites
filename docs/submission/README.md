# Karachi Bites - Documentation Index

This folder contains the academic, technical, installation, user and testing documentation for Karachi Bites.

## Documents

| File | Description |
|---|---|
| `KARACHI_BITES_PROJECT_REPORT.md` | Original student project report |
| `KARACHI_BITES_COMPLETE_PROJECT_AUDIT_REPORT.md` | Corrected 30-section audit summary with 31 October 2026 GitHub evidence |
| `TECHNICAL_DOCUMENTATION.md` | Source responsibilities and API documentation |
| `INSTALLATION_GUIDE.md` | Runtime requirements and setup |
| `USER_MANUAL.md` | Customer, staff and administrator guide |
| `TESTING_REPORT.md` | Current automated tests, Lighthouse results and outstanding manual checks |
| `DIAGRAMS.md` | Architecture and workflow diagrams (Mermaid source) |
| `screenshots/` | Visual QA screenshots, where available |

## Latest verified GitHub evidence (31 October 2026)

- Main commit: `2496846bfa2fe6aad8a216382b0ea52977118a36`
- Tests workflow: [41189800713 - success](https://github.com/exnesssjaffri-sketch/Karachi-bites/actions/runs/41189800713)
- Lighthouse workflow: [41189800852 - success](https://github.com/exnesssjaffri-sketch/Karachi-bites/actions/runs/41189800852)
- The CI log executed 16 named test suites and reported all suites passed.
- The BOM/empty scan passed for 55 JavaScript files.
- Production Lighthouse at 360x800: Performance 94, Accessibility 100, Best Practices 100, SEO 100.

## PDF generation status

A PDF file was **not present** in this directory when it was checked on 31 October 2026.

The older `scripts/generate-pdf.js` only builds temporary HTML and explicitly skips PDF generation. The replacement `scripts/generate-pdf-fixed.js` uses `puppeteer-core`, but it has not been verified as a working pipeline. Before relying on it, specify an installed browser executable and replace the Playwright-style `page.waitForLoadState` call with valid Puppeteer readiness handling. It must also be expanded to include all intended historical appendices.

Do not treat `scripts/validate-final.js` as visual PDF proof: it checks file existence/size and source appendix presence, but does not verify page rendering, text extraction, page count, clipping or screenshot/diagram placement.

A separate 18-page corrected report was generated and delivered to the project owner outside this repository. It is not claimed to be committed here.

## Evidence and honesty notes

- A passing local/CI test is not proof of a successful production database write.
- A production Lighthouse result is a mobile page-quality measurement, not a full authenticated order-flow test.
- Real Supabase signup, provider-backed email/SMS OTP, production order persistence and physical-device/keyboard/screen-reader checks remain distinct verification tasks.
- `AI_LOG.md` records summaries rather than a complete archive of historical Cline/ChatGPT prompt transcripts.
- No secrets or real customer records should be included in public documentation.
