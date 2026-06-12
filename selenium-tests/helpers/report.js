const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function writeExcelReport(results, meta) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outDir = path.join(__dirname, '..', 'reports');
  fs.mkdirSync(outDir, { recursive: true });
  const filename = `E2E_Test_Report_FacilityDesk_${ts}.xlsx`;
  const filepath = path.join(outDir, filename);

  const passed = results.filter((r) => r.status === 'PASS');
  const failed = results.filter((r) => r.status === 'FAIL');
  const passRate = meta.total > 0 ? ((passed.length / meta.total) * 100).toFixed(2) : '0.00';

  const wb = new ExcelJS.Workbook();
  wb.creator = 'FacilityDesk E2E';
  wb.created = new Date();

  // ── Summary (PancreaScan format) ──
  const summary = wb.addWorksheet('Summary');
  summary.addRow(['Test Suite', 'Total Tests', 'Passed', 'Failed', 'Pass Rate %', 'Duration (sec)', 'Start Time', 'End Time']);
  summary.addRow([
    'FacilityDesk Web App — Full E2E Workflow',
    meta.total,
    passed.length,
    failed.length,
    passRate,
    meta.totalDurationSec,
    meta.startTime,
    meta.endTime,
  ]);
  summary.getRow(1).font = { bold: true };

  // ── Passed Tests ──
  const passedSheet = wb.addWorksheet('Passed Tests');
  passedSheet.addRow(['No.', 'Category', 'Test Name', 'Time (sec)', 'Status']);
  passedSheet.getRow(1).font = { bold: true };
  passed.forEach((r, i) => {
    passedSheet.addRow([i + 1, r.module, r.name, (r.durationMs / 1000).toFixed(2), 'PASSED']);
  });

  // ── Failed Tests ──
  const failedSheet = wb.addWorksheet('Failed Tests');
  failedSheet.addRow(['No.', 'Category', 'Test Name', 'Error', 'Status', 'Timestamp']);
  failedSheet.getRow(1).font = { bold: true };
  failed.forEach((r, i) => {
    failedSheet.addRow([
      i + 1,
      r.module,
      r.name,
      r.actual || r.notes || 'Assertion failed',
      'FAILED',
      new Date(r.timestamp).toLocaleString(),
    ]);
  });

  // ── Execution Log ──
  const logSheet = wb.addWorksheet('Execution Log');
  logSheet.addRow(['Timestamp', 'Level', 'Message']);
  logSheet.getRow(1).font = { bold: true };
  results.forEach((r) => {
    const level = r.status === 'PASS' ? 'INFO' : 'ERROR';
    const msg = `[${r.module}] ${r.name} → ${r.status} in ${(r.durationMs / 1000).toFixed(2)}s`;
    logSheet.addRow([new Date(r.timestamp).toLocaleString(), level, msg]);
  });

  // ── Test Details ──
  const details = wb.addWorksheet('Test Details');
  details.addRow(['No.', 'Category', 'Test Name', 'Status', 'Error Details']);
  details.getRow(1).font = { bold: true };
  results.forEach((r, i) => {
    details.addRow([
      i + 1,
      r.module,
      r.name,
      r.status === 'PASS' ? 'PASSED' : 'FAILED',
      r.status === 'PASS' ? 'None — test passed successfully.' : (r.actual || r.notes || 'Failed'),
    ]);
  });

  await wb.xlsx.writeFile(filepath);
  return filepath;
}

module.exports = { writeExcelReport };
