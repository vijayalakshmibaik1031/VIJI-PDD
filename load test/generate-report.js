const fs = require('fs');
const path = require('path');
const ExcelJS = require(path.join(__dirname, '..', 'appium-tests', 'node_modules', 'exceljs'));

const REPORT_DIR = path.join(__dirname, 'reports');
const JSON_REPORT = path.join(REPORT_DIR, 'Load_Test_Report.json');
const XLSX_REPORT = path.join(REPORT_DIR, 'Load_Test_Report.xlsx');

function ensureReportData() {
  if (!fs.existsSync(JSON_REPORT)) {
    throw new Error(`Missing JSON report: ${JSON_REPORT}. Run node run-load-test.js first.`);
  }
  return JSON.parse(fs.readFileSync(JSON_REPORT, 'utf8'));
}

function avg(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

async function writeWorkbook(report) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FacilityDesk Load Test';
  workbook.created = new Date();

  const summary = workbook.addWorksheet('Summary');
  summary.columns = [
    { header: 'Metric', key: 'metric', width: 34 },
    { header: 'Value', key: 'value', width: 22 },
    { header: 'Detail', key: 'detail', width: 50 },
  ];
  summary.getRow(1).font = { bold: true };

  const meta = report.meta;
  summary.addRow({ metric: 'Base URL', value: meta.baseUrl, detail: 'Load target' });
  summary.addRow({ metric: 'Virtual Users', value: meta.virtualUsers, detail: 'Concurrent users during test' });
  summary.addRow({ metric: 'Duration', value: `${meta.durationSeconds}s`, detail: 'Sustained test window' });
  summary.addRow({ metric: 'Total Requests', value: meta.totalRequests, detail: 'All completed requests' });
  summary.addRow({ metric: 'Requests Per Second', value: meta.requestsPerSecond, detail: 'Average RPS over the full minute' });
  summary.addRow({ metric: 'Peak Requests Per Second', value: meta.peakRequestsPerSecond, detail: 'Busiest 1-second window' });
  summary.addRow({ metric: 'Success Rate', value: `${meta.successRate}%`, detail: 'HTTP 2xx responses / total' });
  summary.addRow({ metric: 'Average Response Time', value: `${meta.latencyAvgMs} ms`, detail: 'Mean response time' });
  summary.addRow({ metric: 'Min Response Time', value: `${meta.latencyMinMs} ms`, detail: 'Fastest response' });
  summary.addRow({ metric: 'P95 Response Time', value: `${meta.latencyP95Ms} ms`, detail: '95th percentile' });
  summary.addRow({ metric: 'Max Response Time', value: `${meta.latencyMaxMs} ms`, detail: 'Slowest response' });
  summary.addRow({ metric: 'Successful Requests', value: meta.successes, detail: 'Requests returned 2xx' });
  summary.addRow({ metric: 'Failed Requests', value: meta.failures, detail: 'Non-2xx or transport failures' });

  const timelineSheet = workbook.addWorksheet('Timeline');
  timelineSheet.columns = [
    { header: 'Second', key: 'second', width: 12 },
    { header: 'Requests', key: 'requests', width: 14 },
    { header: 'RPS', key: 'rps', width: 12 },
    { header: 'Avg Latency (ms)', key: 'latency', width: 20 },
  ];
  timelineSheet.getRow(1).font = { bold: true };
  report.timeline.forEach((bucket, index) => {
    timelineSheet.addRow({
      second: index + 1,
      requests: bucket.requests,
      rps: bucket.requests,
      latency: bucket.latencies.length ? Number(avg(bucket.latencies).toFixed(2)) : 0,
    });
  });

  const endpointSheet = workbook.addWorksheet('Endpoint Stats');
  endpointSheet.columns = [
    { header: 'Endpoint', key: 'endpoint', width: 34 },
    { header: 'Requests', key: 'requests', width: 14 },
    { header: 'Successes', key: 'successes', width: 14 },
    { header: 'Failures', key: 'failures', width: 12 },
    { header: 'Avg Latency (ms)', key: 'avg', width: 18 },
    { header: 'P95 (ms)', key: 'p95', width: 12 },
    { header: 'Max (ms)', key: 'max', width: 12 },
  ];
  endpointSheet.getRow(1).font = { bold: true };
  report.endpointStats.forEach((entry) => {
    const latencies = entry.latencies || [];
    const sorted = [...latencies].sort((a, b) => a - b);
    const p95Index = sorted.length ? Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1) : 0;
    endpointSheet.addRow({
      endpoint: entry.endpoint,
      requests: entry.requests,
      successes: entry.successes,
      failures: entry.failures,
      avg: latencies.length ? Number(avg(latencies).toFixed(2)) : 0,
      p95: sorted.length ? sorted[p95Index] : 0,
      max: sorted.length ? sorted[sorted.length - 1] : 0,
    });
  });

  const statusSheet = workbook.addWorksheet('Status Codes');
  statusSheet.columns = [
    { header: 'Status Code', key: 'status', width: 14 },
    { header: 'Count', key: 'count', width: 14 },
  ];
  statusSheet.getRow(1).font = { bold: true };
  Object.entries(report.statusCounts).sort((a, b) => Number(a[0]) - Number(b[0])).forEach(([status, count]) => {
    statusSheet.addRow({ status, count });
  });

  await workbook.xlsx.writeFile(XLSX_REPORT);
  console.log(`Excel report written to ${XLSX_REPORT}`);
}

async function main() {
  const report = ensureReportData();
  await writeWorkbook(report);
}

main().catch((error) => {
  console.error('Report generation failed:', error.message);
  process.exit(1);
});
