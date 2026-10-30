const fs = require("fs");
const path = require("path");
const { marked } = require("marked");

const SUBMISSION_DIR = path.join(__dirname, "..", "docs", "submission");
const OUTPUT_PDF = path.join(SUBMISSION_DIR, "Karachi_Bites_Project_Documentation.pdf");
const MARKDOWN_FILES = [
  "KARACHI_BITES_PROJECT_REPORT.md",
  "TECHNICAL_DOCUMENTATION.md",
  "INSTALLATION_GUIDE.md",
  "USER_MANUAL.md",
  "TESTING_REPORT.md",
  "DIAGRAMS.md"
];

function buildHTML() {
  let bodyHTML = "";
  for (const filename of MARKDOWN_FILES) {
    const md = fs.readFileSync(path.join(SUBMISSION_DIR, filename), "utf8");
    bodyHTML += `<section class="doc-section">${marked.parse(md)}</section>`;
  }
  return `<!DOCTYPE html><html><head><style>
    body { font-family: sans-serif; font-size: 11pt; line-height: 1.6; }
    h1 { color: #b42318; page-break-before: always; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ccc; padding: 6px; }
    pre { background: #f5f0e8; padding: 10px; }
  </style></head><body>${bodyHTML}</body></html>`;
}

fs.writeFileSync(path.join(SUBMISSION_DIR, "_temp.html"), buildHTML(), "utf8");
console.log("Markdown converted to HTML. PDF generation skipped due to environment limitations.");
