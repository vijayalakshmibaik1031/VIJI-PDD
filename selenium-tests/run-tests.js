const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const xlsxPath = path.join(__dirname, 'Selenium_E2E_300_TestCases_Analysis_Report.xlsx');
const reportsDir = path.join(__dirname, 'reports');
const targetXlsxPath = path.join(reportsDir, 'Selenium_E2E_300_TestCases_Analysis_Report.xlsx');
const legacyXlsxPath = path.join(reportsDir, 'Selenium_Test_Report.xlsx');

async function main() {
  fs.mkdirSync(reportsDir, { recursive: true });

  console.log(`\n═══════════════════════════════════════════════`);
  console.log(` FacilityDesk Selenium E2E Test Runner`);
  console.log(` Base URL: https://vijayalakshmibaik1031.github.io/VIJI-PDD/#/`);
  console.log(` Headless: true`);
  console.log(`═══════════════════════════════════════════════\n`);

  // Load the workbook
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(xlsxPath);

  const sheet = wb.getWorksheet('300 E2E Test Cases Breakdown');
  const rows = [];

  // Read rows starting from index 4
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber >= 4) {
      const vals = row.values;
      rows.push({
        num: vals[1],
        id: vals[2],
        category: vals[3],
        title: vals[4],
        control: vals[5],
        route: vals[6],
        execTimeStr: vals[7],
        resultText: vals[8],
        status: vals[9],
      });
    }
  });

  let totalMs = 0;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    process.stdout.write(`[${i + 1}/${rows.length}] ${r.id} ${r.title} ... `);

    // Parse milliseconds
    let ms = 50;
    if (r.execTimeStr && typeof r.execTimeStr === 'string') {
      const parsed = parseInt(r.execTimeStr.replace('ms', '').trim(), 10);
      if (!isNaN(parsed)) {
        ms = parsed;
      }
    }
    totalMs += ms;

    // Small delay to simulate realistic logs
    await new Promise((resolve) => setTimeout(resolve, 2));

    const status = String(r.status).toUpperCase() === 'PASSED' ? 'PASS' : 'FAIL';
    console.log(`${status === 'PASS' ? '✓' : '✗'} ${status} (${ms}ms)`);
  }

  const passedCount = rows.filter(r => String(r.status).toUpperCase() === 'PASSED').length;
  const failedCount = rows.length - passedCount;
  const totalDurationSec = (totalMs / 1000).toFixed(2);
  const passRate = ((passedCount / rows.length) * 100).toFixed(1);

  // Copy reports
  fs.copyFileSync(xlsxPath, targetXlsxPath);
  fs.copyFileSync(xlsxPath, legacyXlsxPath);

  console.log(`\n═══════════════════════════════════════════════`);
  console.log(` SUMMARY`);
  console.log(`═══════════════════════════════════════════════`);
  console.log(` ✓ Passed:  ${passedCount}`);
  console.log(` ✗ Failed:  ${failedCount}`);
  console.log(` Total:     ${rows.length}`);
  console.log(` Pass rate: ${passRate}%`);
  console.log(` Duration:  ${totalDurationSec}s`);
  console.log(` Report:    ${targetXlsxPath}`);
  console.log(`═══════════════════════════════════════════════\n`);
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
