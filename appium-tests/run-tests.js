const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { runPreflight } = require('./helpers/preflight');
const { buildTestCases } = require('./test-cases');
const config = require('./config');

function writeMarkdownReport(checks, testCount, runStatus, errorMessage) {
  const reportDir = path.join(__dirname, 'reports');
  fs.mkdirSync(reportDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(reportDir, `APPIUM_E2E_REPORT_${stamp}.md`);

  const lines = [
    '# FacilityDesk Appium E2E Test Report',
    '',
    `**Generated:** ${new Date().toLocaleString()}`,
    '',
    '## 1. Environment Prerequisites',
    '',
    '| Check | Status | Details |',
    '|-------|--------|---------|',
  ];

  checks.forEach((c) => {
    lines.push(`| ${c.label} | ${c.ok ? 'PASS' : 'FAIL'} | ${String(c.detail).replace(/\|/g, '\\|').slice(0, 120)} |`);
  });

  lines.push(
    '',
    '## 2. Project Analysis',
    '',
    '- **App type:** Capacitor hybrid (React web in Android WebView)',
    '- **Package:** `com.vijinew.webadmin`',
    '- **Main activity:** `com.vijinew.webadmin.MainActivity`',
    '- **Backend API (emulator):** `http://10.0.2.2:5000`',
    '- **Test framework:** WebdriverIO + Appium UiAutomator2 + Mocha + Allure',
    '- **Design pattern:** Page Object Model (POM)',
    `- **Total test cases:** ${testCount}`,
    '',
    '## 3. Login Screen Elements (data-testid)',
    '',
    '| Element | Locator | Purpose |',
    '|---------|---------|---------|',
    '| App title | `[data-testid="loginTitle"]` | FacilityDesk branding |',
    '| Subtitle | `[data-testid="loginSubtitle"]` | App description |',
    '| Role picker | `[data-testid="rolePicker"]` | employee / manager / authority |',
    '| User ID | `[data-testid="userId"]` | Login username |',
    '| Password | `[data-testid="password"]` | Login password |',
    '| Login button | `[data-testid="loginButton"]` | Submit login |',
    '| Error message | `[data-testid="loginError"]` | Invalid login feedback |',
    '| Register link | `[data-testid="registerLink"]` | Employee registration |',
    '',
    '## 4. Test Execution Status',
    '',
    `**Result:** ${runStatus}`,
  );

  if (errorMessage) {
    lines.push('', '### Blocker / Error', '', '```', errorMessage, '```');
  }

  lines.push(
    '',
    '## 5. How to Run Locally',
    '',
    '### Install missing prerequisites',
    '',
    '1. **Java JDK 17+**',
    '   ```powershell',
    '   winget install EclipseAdoptium.Temurin.17.JDK',
    '   setx JAVA_HOME "C:\\Program Files\\Eclipse Adoptium\\jdk-17.x.x-hotspot"',
    '   setx PATH "%PATH%;%JAVA_HOME%\\bin"',
    '   ```',
    '',
    '2. **Android SDK PATH** (add to System Environment Variables)',
    '   ```powershell',
    '   setx ANDROID_HOME "%LOCALAPPDATA%\\Android\\Sdk"',
    '   setx PATH "%PATH%;%ANDROID_HOME%\\platform-tools;%ANDROID_HOME%\\emulator"',
    '   ```',
    '',
    '3. **Start emulator**',
    '   ```powershell',
    '   emulator -avd Pixel_10_Pro_XL',
    '   adb devices',
    '   ```',
    '',
    '4. **Build Android APK**',
    '   ```powershell',
    '   cd web-admin',
    '   npm install',
    '   npm run build',
    '   npx cap sync android',
    '   cd android',
    '   .\\gradlew assembleDebug',
    '   ```',
    '',
    '5. **Start backend** (required for login/API tests)',
    '   ```powershell',
    '   cd backend',
    '   node server.js',
    '   ```',
    '',
    '### Run Appium tests',
    '',
    '```powershell',
    'cd appium-tests',
    'npm install',
    'npm run test:allure',
    'npm run report:allure',
    '```',
    '',
    '## 6. Appium Inspector',
    '',
    'Download from https://github.com/appium/appium-inspector/releases',
    '',
    'Connection settings:',
    '- Remote Host: `127.0.0.1`',
    `- Remote Port: \`${config.appiumPort}\``,
    '- Remote Path: `/`',
    '- Capability: `platformName=Android`, `appium:automationName=UiAutomator2`',
    '',
    'For Capacitor WebView elements, switch context to `WEBVIEW_com.vijinew.webadmin` and inspect using CSS `[data-testid="..."]`.',
    '',
    '## 7. Test Coverage Modules',
    '',
    '- App Launch',
    '- Login (valid/invalid, validation, security)',
    '- Register',
    '- Employee portal (raise complaint, navigation, logout)',
    '- Manager portal (pending, merge, filters, logout)',
    '- Authority portal (overview, filters, escalated, logout)',
    '- Access control (role isolation)',
    '- Navigation / UI branding',
    '- Backend integration',
  );

  fs.writeFileSync(reportPath, lines.join('\n'));
  return reportPath;
}

async function ensureAppiumRunning() {
  try {
    const res = await fetch(`http://127.0.0.1:${config.appiumPort}/status`);
    if (res.ok) return null;
  } catch {
    /* start server */
  }

  const appiumCmd = process.platform === 'win32'
    ? `start "Appium" /MIN cmd /c "set JAVA_HOME=${config.javaHome}&& set ANDROID_HOME=${config.androidSdk}&& npx appium --port ${config.appiumPort} --allow-insecure *:chromedriver_autodownload"`
    : `JAVA_HOME="${config.javaHome}" ANDROID_HOME="${config.androidSdk}" npx appium --port ${config.appiumPort} --allow-insecure *:chromedriver_autodownload &`;

  execSync(appiumCmd, { cwd: __dirname, shell: true, stdio: 'ignore' });

  for (let i = 0; i < 30; i += 1) {
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const res = await fetch(`http://127.0.0.1:${config.appiumPort}/status`);
      if (res.ok) return null;
    } catch {
      /* retry */
    }
  }
  throw new Error(`Appium did not start on port ${config.appiumPort}`);
}

function isEmulatorRunning() {
  try {
    const out = execSync(`"${config.adbPath}" devices`, { encoding: 'utf8' });
    const lines = out.trim().split('\n').slice(1);
    return lines.some((line) => line.includes('device') && !line.includes('offline'));
  } catch {
    return false;
  }
}

async function startEmulator() {
  console.log(`\n[Emulator] Starting emulator "${config.emulatorName}"...`);
  const emulatorPath = path.join(config.androidSdk, 'emulator', 'emulator.exe');
  try {
    const { spawn } = require('child_process');
    const child = spawn(emulatorPath, ['-avd', config.emulatorName], {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
  } catch (err) {
    console.error('[Emulator] Failed to launch emulator command:', err.message);
  }

  console.log('[Emulator] Waiting for device to be online and booted...');
  let booted = false;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const res = execSync(`"${config.adbPath}" shell getprop sys.boot_completed`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
      if (res === '1') {
        booted = true;
        console.log('[Emulator] Emulator booted successfully!');
        break;
      }
    } catch {
      // ignore errors during boot
    }
  }
  if (!booted) {
    console.warn('[Emulator] Emulator start timeout or not fully booted, proceeding anyway...');
  }
}

async function main() {
  if (!isEmulatorRunning()) {
    await startEmulator();
  }

  const checks = runPreflight();
  const testCount = buildTestCases().length;
  const failedChecks = checks.filter((c) => !c.ok);

  console.log('\n=== Appium Preflight ===');
  checks.forEach((c) => console.log(`${c.ok ? '✓' : '✗'} ${c.label}: ${c.detail}`));
  console.log(`\nTest cases ready: ${testCount}`);

  if (failedChecks.length) {
    const msg = failedChecks.map((c) => `${c.label}: ${c.detail}`).join('\n');
    const reportPath = writeMarkdownReport(checks, testCount, 'BLOCKED — prerequisites missing', msg);
    console.log(`\nReport written: ${reportPath}`);
    console.log('\nFix the failed prerequisites above, then run: npm run test:allure');
    console.error('\n═══════════════════════════════════════════════');
    console.error(' ERROR: Appium execution failed due to missing preflight checks.');
    console.error(' To run the Appium tests directly, use the command:');
    console.error(`   cd appium-tests && npx wdio run ./wdio.conf.js`);
    console.error('═══════════════════════════════════════════════\n');
    process.exit(1);
  }

  try {
    await ensureAppiumRunning();
    const env = {
      ...process.env,
      JAVA_HOME: config.javaHome,
      ANDROID_HOME: config.androidSdk,
      PATH: `${path.join(config.javaHome, 'bin')};${path.join(config.androidSdk, 'platform-tools')};${path.join(config.androidSdk, 'emulator')};${process.env.PATH}`,
    };
    execSync('npx wdio run ./wdio.conf.js', { stdio: 'inherit', cwd: __dirname, env });
    try {
      execSync('npx allure generate allure-results --clean -o allure-report', { stdio: 'inherit', cwd: __dirname });
    } catch {
      console.warn('Allure CLI not found. Install: npm i -g allure-commandline');
    }
    const reportPath = writeMarkdownReport(checks, testCount, 'COMPLETED — see allure-report/');
    console.log(`\nReport written: ${reportPath}`);
  } catch (err) {
    const reportPath = writeMarkdownReport(checks, testCount, 'FAILED — see console/allure-results', err.message);
    console.log(`\nReport written: ${reportPath}`);
    console.error('\n═══════════════════════════════════════════════');
    console.error(' ERROR: Appium execution failed during test run.');
    console.error(' To run the Appium tests directly, use the command:');
    console.error(`   cd appium-tests && npx wdio run ./wdio.conf.js`);
    console.error('═══════════════════════════════════════════════\n');
    process.exit(1);
  }
}

main();
