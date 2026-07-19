const { buildTestCases } = require('./test-cases');
const { createDriver } = require('./helpers/driver');
const { writeExcelReport } = require('./helpers/report');
const config = require('./config');

if (process.env.MOCK_E2E === 'true') {
  global.fetch = async (url, options = {}) => {
    const urlStr = String(url);
    let status = 200;
    let data = {};

    let bodyObj = {};
    if (options.body) {
      try {
        bodyObj = JSON.parse(options.body);
      } catch {}
    }

    if (urlStr.endsWith('/test-db')) {
      data = { status: 'connected' };
    } else if (urlStr.endsWith('/api/employees/register')) {
      data = { ok: true };
      if (bodyObj.id) {
        global._registeredUsers.add(bodyObj.id);
      }
    } else if (urlStr.endsWith('/api/employees/login')) {
      if (bodyObj.badField || !bodyObj.userId) {
        status = 400;
        data = { error: 'Invalid schema' };
      } else {
        data = { token: 'mock_token', session: { userId: 'mock_emp', name: 'Mock Emp', role: 'employee' } };
      }
    } else if (urlStr.endsWith('/api/managers/login')) {
      data = { token: 'mock_mgr_token', session: { userId: 'manager', name: 'Manager', role: 'manager' } };
    } else if (urlStr.endsWith('/api/authorities/login')) {
      data = { token: 'mock_auth_token', session: { userId: 'auth', name: 'Auth', role: 'authority' } };
    } else if (urlStr.endsWith('/api/complaints')) {
      data = { id: 'cmp_123' };
    } else {
      data = { status: 'success', message: 'API Running' };
    }

    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => data,
      text: async () => JSON.stringify(data),
    };
  };

  global._currentPath = '/';
  global._selectedRole = 'employee';
  global._registerError = '';
  global._hasSession = false;
  global._lastTypedName = '';
  global._lastTypedId = '';
  global._lastTypedPassword = '';
  global._registeredUsers = new Set();
}

async function preflight() {
  const fe = await fetch(config.baseUrl).catch(() => null);
  if (!fe?.ok) {
    console.error(`\n✗ Frontend not reachable at ${config.baseUrl}`);
    console.error('  Start: cd web-admin && npm run dev\n');
    process.exit(1);
  }
  const be = await fetch(`${config.apiUrl}/`).catch(() => null);
  if (!be?.ok) {
    console.error(`\n✗ Backend not reachable at ${config.apiUrl}`);
    console.error('  Start: cd backend && node server.js\n');
    process.exit(1);
  }
}

async function run() {
  await preflight();
  const tests = buildTestCases();
  const startTime = new Date().toISOString();
  console.log(`\n═══════════════════════════════════════════════`);
  console.log(` FacilityDesk Selenium E2E — ${tests.length} test cases`);
  console.log(` Base URL: ${config.baseUrl}`);
  console.log(` Headless: ${config.headless}`);
  console.log(`═══════════════════════════════════════════════\n`);

  const results = [];
  const startAll = Date.now();
  let driver = null;

  async function getDriver() {
    if (!driver) {
      driver = await createDriver();
      await driver.manage().setTimeouts({ implicit: 3000, pageLoad: 30000 });
    }
    return driver;
  }

  for (let i = 0; i < tests.length; i++) {
    const t = tests[i];
    
    if (process.env.MOCK_E2E === 'true') {
      global._currentPath = '/';
      global._selectedRole = 'employee';
      global._registerError = '';
      global._hasSession = false;
      global._lastTypedName = '';
      global._lastTypedId = '';
      global._lastTypedPassword = '';
    }

    const started = Date.now();
    let status = 'FAIL';
    let actual = '';
    let notes = '';

    process.stdout.write(`[${i + 1}/${tests.length}] ${t.id} ${t.name} ... `);

    try {
      const needsBrowser = typeof t.run === 'function' && t.run.length > 0;
      if (needsBrowser) {
        const browser = await getDriver();
        const out = await t.run(browser);
        status = out.pass ? 'PASS' : 'FAIL';
        actual = out.actual || '';
        if (out.skip) status = 'SKIP';
      } else {
        const out = await t.run();
        status = out.pass ? 'PASS' : 'FAIL';
        actual = out.actual || '';
      }
    } catch (err) {
      status = 'FAIL';
      actual = err.message;
      notes = err.stack ? err.stack.split('\n')[0] : '';
    }

    const durationMs = Date.now() - started;
    console.log(`${status === 'PASS' ? '✓' : status === 'SKIP' ? '⚠' : '✗'} ${status} (${durationMs}ms)`);

    results.push({
      id: t.id,
      module: t.module,
      name: t.name,
      description: t.description,
      steps: t.steps,
      expected: t.expected,
      actual: String(actual).slice(0, 500),
      status,
      durationMs,
      severity: t.severity,
      notes,
      timestamp: new Date().toISOString(),
    });
  }

  if (driver) {
    try { await driver.quit(); } catch {}
  }

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const totalDurationSec = ((Date.now() - startAll) / 1000).toFixed(2);
  const passRate = ((passed / results.length) * 100).toFixed(1);
  const endTime = new Date().toISOString();

  const reportPath = await writeExcelReport(results, {
    baseUrl: config.baseUrl,
    total: results.length,
    startTime,
    endTime,
    totalDurationSec,
  });

  console.log(`\n═══════════════════════════════════════════════`);
  console.log(` SUMMARY`);
  console.log(`═══════════════════════════════════════════════`);
  console.log(` ✓ Passed:  ${passed}`);
  console.log(` ✗ Failed:  ${failed}`);
  console.log(` Total:     ${results.length}`);
  console.log(` Pass rate: ${passRate}%`);
  console.log(` Duration:  ${totalDurationSec}s`);
  console.log(` Report:    ${reportPath}`);
  console.log(`═══════════════════════════════════════════════\n`);

  if (failed > 0) {
    results.filter((r) => r.status === 'FAIL').forEach((r) => {
      console.log(`  ✗ ${r.id} ${r.name}: ${r.actual}`);
    });
    process.exitCode = 1;
  }
}

run().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
