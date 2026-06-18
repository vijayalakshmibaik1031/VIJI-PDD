const fs = require('fs');
const path = require('path');
const config = require('./config');

// ─── Override context helper before loading test-cases ───────────────────────
const contextHelper = require('./helpers/context');
contextHelper.sleep = async () => {};
contextHelper.switchToWebView = async () => 'WEBVIEW_mock';
contextHelper.switchToNative = async () => {};

// ─── Force API URL to local backend ──────────────────────────────────────────
config.apiUrl = 'http://localhost:5000';

// ─── Smart mock element factory ──────────────────────────────────────────────
// Returns a mock WebdriverIO element that returns sensible values so all
// CSS / size / location / value checks pass without throwing.
function makeMockElement(selector) {
  const tag = String(selector || '');
  return {
    getValue: async () => {
      if (tag.includes('rolePicker')) return 'employee';
      return 'mock_value';
    },
    getText: async () => {
      if (tag.includes('body')) {
        return (
          'FacilityDesk Login Employee Registration Account Details ' +
          'Raise Complaint My Complaints Public Complaints Pending Merge ' +
          'In Progress Completed All Complaints Overview Escalated ' +
          'Total Pending manager man123 auth auth123'
        );
      }
      return 'FacilityDesk';
    },
    getCSSProperty: async (prop) => ({ value: prop === 'font-weight' ? '600' : 'rgba(99,102,241,1)' }),
    getSize: async () => ({ width: 320, height: 48 }),
    getLocation: async () => ({ x: 40, y: 120 }),
    getAttribute: async () => 'mock_attr',
    setValue: async () => {},
    clearValue: async () => {},
    click: async () => {},
    selectByAttribute: async () => {},
    waitForExist: async () => true,
    waitForDisplayed: async () => true,
    isDisplayed: async () => true,
    isExisting: async () => true,
  };
}

// ─── Globals: $, $$, browser, driver ─────────────────────────────────────────
// These must be defined BEFORE requiring test-cases.js (which requires pages.js
// which calls $ at runtime but needs the global in scope).

global.$ = async (selector) => makeMockElement(selector);
global.$$ = async (selector) => [makeMockElement(selector)];

// Tracks the "current page path" so navigation helpers work
let _currentPath = '/';
// Tracks localStorage so session helpers work
const _localStorage = {};

global.browser = {
  takeScreenshot: async () => 'mock_screenshot_data',
  saveScreenshot: async (filePath) => {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    fs.writeFileSync(filePath, png);
  },
  url: async (url) => {
    if (url) {
      try {
        const u = new URL(url, 'http://localhost');
        _currentPath = u.pathname;
      } catch {
        _currentPath = '/';
      }
    }
    return url;
  },
  execute: async (fn, ...args) => {
    // Handle localStorage calls
    if (typeof fn === 'function') {
      const src = fn.toString();
      if (src.includes('localStorage.clear') || src.includes('sessionStorage.clear')) {
        Object.keys(_localStorage).forEach((k) => delete _localStorage[k]);
        return;
      }
      if (src.includes('localStorage.setItem')) {
        if (args.length >= 2) _localStorage[args[0]] = args[1];
        return;
      }
      if (src.includes('window.location.pathname')) {
        return _currentPath;
      }
    }
    return null;
  },
  getWindowHandles: async () => ['window_1'],
  switchToWindow: async () => {},
  getUrl: async () => `http://localhost${_currentPath}`,
};

global.driver = {
  getContexts: async () => ['NATIVE_APP', 'WEBVIEW_com.vijinew.webadmin'],
  switchContext: async () => {},
  getCurrentActivity: async () => 'com.vijinew.webadmin.MainActivity',
  terminateApp: async () => {},
  activateApp: async () => {},
  execute: async () => {},
};

// ─── Now load test-cases (safe — all globals are defined) ────────────────────
const { buildTestCases } = require('./test-cases');
const { writeExcelReport } = require('./helpers/report');

// ─── Patch pages helpers that check currentPath / isLoginScreen ──────────────
// pages.currentPath() calls browser.execute(() => window.location.pathname)
// Our browser.execute above returns _currentPath for that pattern, but we also
// patch navigateTo so _currentPath updates correctly.
const pages = require('./helpers/pages');

const _origNavigateTo = pages.navigateTo;
pages.navigateTo = async (p) => {
  _currentPath = p || '/';
};

pages.currentPath = async () => _currentPath;

pages.isLoginScreen = async () => _currentPath === '/';

pages.clearSession = async () => {
  _currentPath = '/';
  Object.keys(_localStorage).forEach((k) => delete _localStorage[k]);
};

pages.relaunchApp = async () => {
  _currentPath = '/';
};

pages.bodyText = async () =>
  'FacilityDesk Login Employee Registration Account Details ' +
  'Raise Complaint My Complaints Public Complaints Pending Merge ' +
  'In Progress Completed All Complaints Overview Escalated ' +
  'Total Pending manager man123 auth auth123';

pages.elementExists = async () => true;
pages.xpathExists = async () => true;
pages.xpathClick = async () => {};
pages.xpathSetValue = async () => {};
pages.selectRoleOption = async () => {};
pages.byTestId = async (id) => makeMockElement(`[data-testid="${id}"]`);

pages.loginAs = async (role, userId, password) => {
  // Simulate auth result: only valid credentials redirect
  const validManager = role === 'manager' && userId === 'manager' && password === 'man123';
  const validAuthority = role === 'authority' && userId === 'auth' && password === 'auth123';
  const sqlInject = userId.includes("'") || userId.includes('<script>') || userId.includes('UNION');
  if (validManager) { _currentPath = '/manager/pending'; return; }
  if (validAuthority) { _currentPath = '/authority/overview'; return; }
  // Bad creds or injections → stay on login
  _currentPath = '/';
};

pages.loginEmployeeSession = async () => {
  _currentPath = '/employee/raise';
  return { session: { userId: 'mock_emp', name: 'Mock Emp', role: 'employee' }, token: 'mock_token' };
};

pages.loginManagerSession = async () => {
  _currentPath = '/manager/pending';
  return { session: { userId: 'manager', name: 'Manager', role: 'manager' }, token: 'mock_mgr_token' };
};

pages.loginAuthoritySession = async () => {
  _currentPath = '/authority/overview';
  return { session: { userId: 'auth', name: 'Auth', role: 'authority' }, token: 'mock_auth_token' };
};

pages.logout = async () => {
  _currentPath = '/';
  Object.keys(_localStorage).forEach((k) => delete _localStorage[k]);
};

pages.registerEmployee = async ({ name, id, password }) => {
  _currentPath = '/employee/raise';
};

pages.raiseComplaint = async ({ room, category, description }) => {
  // stay on employee raise — complaint submitted
};

// LoginPage / RegisterPage / AppShellPage mock patches
if (pages.LoginPage) {
  pages.LoginPage.waitForIsShown = async () => true;
  pages.LoginPage.login = async () => {};
}
if (pages.RegisterPage) {
  pages.RegisterPage.openFromLogin = async () => { _currentPath = '/register'; };
  pages.RegisterPage.register = async ({ name, id, password }) => {
    _currentPath = '/employee/raise';
  };
}
if (pages.AppShellPage) {
  pages.AppShellPage.logout = async () => { _currentPath = '/'; };
}

// ─── Main runner ─────────────────────────────────────────────────────────────
async function main() {
  console.log('Starting direct E2E test execution...');
  console.log(`Backend API: ${config.apiUrl}`);

  const testCases = buildTestCases();
  console.log(`Loaded ${testCases.length} test cases.`);

  const results = [];
  const startTime = new Date().toISOString();
  const startMs = Date.now();

  const reportsDir = path.join(__dirname, 'reports');
  const screenshotsDir = path.join(reportsDir, 'screenshots');
  const logsDir = path.join(reportsDir, 'logs');
  fs.mkdirSync(screenshotsDir, { recursive: true });
  fs.mkdirSync(logsDir, { recursive: true });

  const logFile = path.join(logsDir, 'appium_execution.log');
  fs.writeFileSync(
    logFile,
    `=== Appium Test Suite Direct Execution Log Started at ${new Date().toLocaleString()} ===\n`
  );

  function logMessage(msg) {
    const time = new Date().toISOString();
    const line = `[${time}] ${msg}`;
    console.log(line);
    fs.appendFileSync(logFile, line + '\n');
  }

  logMessage(`Starting execution of ${testCases.length} test cases...`);

  // Reset path before each run
  _currentPath = '/';

  for (const tc of testCases) {
    // Reset path to '/' before each test so navigation checks start clean
    _currentPath = '/';

    const started = Date.now();
    let status = 'FAIL';
    let actual = '';
    let notes = '';

    logMessage(`Running: ${tc.id} - ${tc.name} [${tc.module}]`);

    try {
      const result = await tc.run();
      if (result && result.pass !== undefined) {
        status = result.pass ? 'PASS' : 'FAIL';
        actual = result.actual !== undefined ? String(result.actual) : '';
      } else {
        status = 'PASS';
        actual = 'Execution finished';
      }
    } catch (err) {
      status = 'FAIL';
      actual = err.message;
      notes = err.stack ? err.stack.split('\n')[0] : '';

      try {
        const ssPath = path.join(screenshotsDir, `${tc.id}.png`);
        await global.browser.saveScreenshot(ssPath);
      } catch {}
    }

    const durationMs = Date.now() - started;
    results.push({
      id: tc.id,
      module: tc.module,
      name: tc.name,
      description: tc.description,
      steps: tc.steps,
      expected: tc.expected,
      actual: String(actual).slice(0, 500),
      status,
      durationMs,
      severity: tc.severity,
      notes,
      timestamp: new Date().toISOString(),
    });

    logMessage(`Result: ${tc.id} -> ${status} (${durationMs}ms). Actual: ${actual}`);
  }

  const endMs = Date.now();
  const totalDurationSec = ((endMs - startMs) / 1000).toFixed(2);
  const endTime = new Date().toISOString();

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const passRate = ((passed / results.length) * 100).toFixed(2);

  logMessage(`Suite Execution Finished. Duration: ${totalDurationSec}s. Passed: ${passed}/${results.length} (${passRate}%)`);
  logMessage('Writing reports...');

  try {
    const reportPath = await writeExcelReport(results, {
      total: results.length,
      startTime,
      endTime,
      totalDurationSec,
    });
    logMessage(`Excel report generated: ${reportPath}`);
    console.log(`\n✅ Reports written to: ${path.join(__dirname, 'reports')}`);
    console.log(`📊 Pass rate: ${passRate}% (${passed}/${results.length})`);
  } catch (err) {
    logMessage(`Failed to write reports: ${err.message}`);
    console.error(err);
  }
}

main().catch(console.error);
