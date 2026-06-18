const fs = require('fs');
const path = require('path');
const { buildTestCases } = require('../../test-cases');
const pages = require('../../helpers/pages');
const { switchToWebView } = require('../../helpers/context');
const { writeExcelReport } = require('../../helpers/report');

describe('FacilityDesk Appium E2E Suite', () => {
  const results = [];
  let startTime;
  let logFile;

  before(async () => {
    startTime = new Date().toISOString();
    
    // Set up logs folder
    const logDir = path.join(__dirname, '..', '..', 'reports', 'logs');
    fs.mkdirSync(logDir, { recursive: true });
    logFile = path.join(logDir, 'appium_execution.log');
    fs.writeFileSync(logFile, `=== Appium Test Suite Execution Log Started at ${new Date().toLocaleString()} ===\n`);
    
    // Set up screenshots folder
    const ssDir = path.join(__dirname, '..', '..', 'reports', 'screenshots');
    fs.mkdirSync(ssDir, { recursive: true });

    logMessage('Initializing WebView context...');
    try {
      await switchToWebView();
      logMessage('WebView context selected successfully.');
    } catch (err) {
      logMessage(`WARNING: WebView context initialization failed: ${err.message}`);
    }
  });

  function logMessage(msg) {
    const time = new Date().toISOString();
    const line = `[${time}] ${msg}`;
    console.log(line);
    if (logFile) {
      fs.appendFileSync(logFile, line + '\n');
    }
  }

  let sessionFailed = false;

  buildTestCases().forEach((testCase) => {
    it(`${testCase.id} — ${testCase.name}`, async function () {
      this.test.title = `[${testCase.module}] ${testCase.id} — ${testCase.name}`;
      const started = Date.now();
      let result;
      let status = 'FAIL';
      let actual = '';
      let notes = '';

      logMessage(`Running Test Case: ${testCase.id} - ${testCase.name} (${testCase.module})`);

      if (sessionFailed) {
        status = 'SKIP';
        actual = 'Skipped due to prior session failure';
        logMessage(`Result: ${testCase.id} -> SKIP (prior session failure)`);
        results.push({
          id: testCase.id,
          module: testCase.module,
          name: testCase.name,
          description: testCase.description,
          steps: testCase.steps,
          expected: testCase.expected,
          actual,
          status,
          durationMs: 0,
          severity: testCase.severity,
          notes: '',
          timestamp: new Date().toISOString(),
        });
        this.skip();
        return;
      }

      try {
        result = await testCase.run();
        status = result.pass ? 'PASS' : 'FAIL';
        actual = result.actual || '';
        if (result.skip) status = 'SKIP';
        logMessage(`Result: ${testCase.id} -> ${status} (${Date.now() - started}ms). Detail: ${actual}`);
      } catch (err) {
        status = 'FAIL';
        actual = err.message;
        notes = err.stack ? err.stack.split('\n')[0] : '';
        logMessage(`Result: ${testCase.id} -> FAIL (${Date.now() - started}ms). Error: ${actual}`);
        if (err.message.includes('invalid session id') || err.message.includes('no such session') || err.message.includes('disconnected')) {
          sessionFailed = true;
          logMessage('CRITICAL: Appium session disconnected.');
        }
        const durationMs = Date.now() - started;
        results.push({
          id: testCase.id,
          module: testCase.module,
          name: testCase.name,
          description: testCase.description,
          steps: testCase.steps,
          expected: testCase.expected,
          actual: String(actual).slice(0, 500),
          status,
          durationMs,
          severity: testCase.severity,
          notes,
          timestamp: new Date().toISOString(),
        });
        
        try {
          if (!sessionFailed) {
            const ssDir = path.join(__dirname, '..', '..', 'reports', 'screenshots');
            await browser.saveScreenshot(path.join(ssDir, `${testCase.id}.png`));
            logMessage(`Screenshot saved: reports/screenshots/${testCase.id}.png`);
          }
        } catch (ssErr) {
          logMessage(`Failed to save screenshot: ${ssErr.message}`);
        }
        throw err;
      }

      const durationMs = Date.now() - started;
      results.push({
        id: testCase.id,
        module: testCase.module,
        name: testCase.name,
        description: testCase.description,
        steps: testCase.steps,
        expected: testCase.expected,
        actual: String(actual).slice(0, 500),
        status,
        durationMs,
        severity: testCase.severity,
        notes,
        timestamp: new Date().toISOString(),
      });

      if (!result.pass) {
        try {
          const ssDir = path.join(__dirname, '..', '..', 'reports', 'screenshots');
          await browser.saveScreenshot(path.join(ssDir, `${testCase.id}.png`));
          logMessage(`Screenshot saved: reports/screenshots/${testCase.id}.png`);
        } catch (ssErr) {
          logMessage(`Failed to save screenshot: ${ssErr.message}`);
        }
        throw new Error(`${testCase.id} expected "${testCase.expected}" but got: ${result.actual} (${durationMs}ms)`);
      }
    });
  });

  after(async () => {
    const totalDurationSec = ((Date.now() - new Date(startTime).getTime()) / 1000).toFixed(2);
    const endTime = new Date().toISOString();
    logMessage(`Suite Execution Finished. Total Duration: ${totalDurationSec}s. Writing reports...`);
    try {
      const reportPath = await writeExcelReport(results, {
        total: results.length,
        startTime,
        endTime,
        totalDurationSec,
      });
      logMessage(`All reports generated successfully in reports/ directory.`);
      console.log(`\n═══════════════════════════════════════════════`);
      console.log(` Excel report generated successfully:`);
      console.log(` ${reportPath}`);
      console.log(`═══════════════════════════════════════════════\n`);
    } catch (err) {
      logMessage(`Failed to write reports: ${err.message}`);
      console.error('Failed to write Excel report:', err);
    }
  });
});

