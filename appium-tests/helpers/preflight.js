const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const config = require('../config');

function checkCommand(label, cmd) {
  try {
    const out = execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    return { ok: true, label, detail: out.split('\n')[0] };
  } catch (err) {
    return { ok: false, label, detail: err.message.split('\n')[0] };
  }
}

function runPreflight() {
  const javaCmd = fs.existsSync(path.join(config.javaHome, 'bin', 'java.exe'))
    ? `"${path.join(config.javaHome, 'bin', 'java.exe')}" -version 2>&1`
    : 'java -version 2>&1';

  const checks = [
    checkCommand('Node.js', 'node -v'),
    checkCommand('npm', 'npm -v'),
    checkCommand('Java JDK', javaCmd),
    checkCommand('ADB', `"${config.adbPath}" version`),
    checkCommand('Appium (local)', 'npx appium -v'),
  ];

  checks.push({
    ok: fs.existsSync(config.androidSdk),
    label: 'Android SDK',
    detail: fs.existsSync(config.androidSdk) ? config.androidSdk : 'Not found',
  });

  checks.push({
    ok: fs.existsSync(config.apkPath),
    label: 'Debug APK',
    detail: fs.existsSync(config.apkPath) ? config.apkPath : 'Build required: cd web-admin && npm run build && npx cap sync android && cd android && gradlew assembleDebug',
  });

  let devices = '';
  let deviceOk = false;
  try {
    devices = execSync(`"${config.adbPath}" devices`, { encoding: 'utf8' }).trim();
    deviceOk = devices.split('\n').some((line) => line.includes('device') && !line.includes('List of devices'));
  } catch (err) {
    devices = err.message;
  }
  checks.push({ ok: deviceOk, label: 'Android device/emulator', detail: devices || 'No devices' });

  return checks;
}

module.exports = { runPreflight };
