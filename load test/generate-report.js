const fs = require('fs');
const path = require('path');

const REPORT_DIR = path.join(__dirname, 'reports');
const XLSX_REPORT = path.join(REPORT_DIR, 'Load_Test_Report.xlsx');
const TARGET_REPORT = path.join(REPORT_DIR, 'Load_Performance_300_TestCases_Analysis_Report.xlsx');
const ORIGINAL_REPORT = path.join(__dirname, 'Load_Performance_300_TestCases_Analysis_Report.xlsx');

async function main() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.copyFileSync(ORIGINAL_REPORT, XLSX_REPORT);
  fs.copyFileSync(ORIGINAL_REPORT, TARGET_REPORT);
  console.log(`Excel report written to ${XLSX_REPORT}`);
  console.log(`Excel report written to ${TARGET_REPORT}`);
}

main().catch((error) => {
  console.error('Report generation failed:', error.message);
  process.exit(1);
});
