const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const SUBMISSION_DIR = path.join(__dirname, '..', 'docs', 'submission');
const OUTPUT_PDF = path.join(SUBMISSION_DIR, 'Karachi_Bites_Complete_Project_Audit_Report.pdf');
const MARKDOWN_FILES = [
  'KARACHI_BITES_COMPLETE_PROJECT_AUDIT_REPORT.md',
  'TECHNICAL_DOCUMENTATION.md',
  'INSTALLATION_GUIDE.md',
  'USER_MANUAL.md',
  'TESTING_REPORT.md',
  'DIAGRAMS.md'
];

async function generatePDF() {
  try {
    // Launch browser with system Chrome if available
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    
    // Build HTML content
    let bodyHTML = '';
    for (const filename of MARKDOWN_FILES) {
      const mdPath = path.join(SUBMISSION_DIR, filename);
      if (fs.existsSync(mdPath)) {
        const md = fs.readFileSync(mdPath, 'utf8');
        // Simple markdown to HTML conversion (marked is available)
        const marked = require('marked');
        const html = marked.parse(md);
        bodyHTML += `<section class="doc-section">${html}</section>`;
      }
    }
    
    const htmlContent = `<!DOCTYPE html><html><head><style>
      body { font-family: sans-serif; font-size: 11pt; line-height: 1.6; margin: 2cm; }
      h1 { color: #b42318; page-break-before: always; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ccc; padding: 6px; }
      pre { background: #f5f0e8; padding: 10px; }
      @media print { body { margin: 0; } }
    </style></head><body>${bodyHTML}</body></html>`;
    
    // Write temp HTML
    const tempPath = path.join(SUBMISSION_DIR, '_temp.html');
    fs.writeFileSync(tempPath, htmlContent, 'utf8');
    
    // Navigate to temp file
    await page.goto(`file://${tempPath}`);
    
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Generate PDF
    await page.pdf({
      path: OUTPUT_PDF,
      format: 'A4',
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
      printBackground: true
    });
    
    await browser.close();
    console.log('PDF generated successfully:', OUTPUT_PDF);
    
    // Validation
    const pdfStats = fs.statSync(OUTPUT_PDF);
    console.log('PDF size:', pdfStats.size, 'bytes');
    console.log('PDF generated at:', new Date().toISOString());
    
    return OUTPUT_PDF;
  } catch (error) {
    console.error('PDF generation failed:', error.message);
    throw error;
  }
}

generatePDF().then(result => {
  console.log('✅ PDF generation complete:', result);
}).catch(error => {
  console.error('❌ PDF generation failed:', error);
  process.exit(1);
});