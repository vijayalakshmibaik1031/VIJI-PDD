const path = require('path');
const config = require('./config');

process.env.JAVA_HOME = process.env.JAVA_HOME || config.javaHome;
process.env.ANDROID_HOME = process.env.ANDROID_HOME || config.androidSdk;
process.env.PATH = [
  path.join(config.javaHome, 'bin'),
  path.join(config.androidSdk, 'platform-tools'),
  path.join(config.androidSdk, 'emulator'),
  process.env.PATH,
].join(';');

exports.config = {
  runner: 'local',
  hostname: '127.0.0.1',
  port: config.appiumPort,
  path: '/',
  specs: ['./test/specs/full-suite.e2e.js'],
  exclude: [],
  maxInstances: 1,
  capabilities: [
    {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:deviceName': config.deviceName,
      'appium:app': config.apkPath,
      'appium:appPackage': config.appPackage,
      'appium:appActivity': config.appActivity,
      'appium:autoGrantPermissions': true,
      'appium:newCommandTimeout': 240000,
      'appium:chromedriverExecutableDir': path.join(config.androidSdk, 'chromedriver'),
      'appium:ensureWebviewsHavePages': true,
      'appium:nativeWebScreenshot': true,
      'appium:webviewDevtoolsPort': 9222,
    },
  ],
  logLevel: 'info',
  bail: 0,
  waitforTimeout: config.timeoutMs,
  connectionRetryTimeout: 180000,
  connectionRetryCount: 3,
  services: [],
  framework: 'mocha',
  reporters: [
    'spec',
    [
      'allure',
      {
        outputDir: 'allure-results',
        disableWebdriverStepsReporting: true,
        disableWebdriverScreenshotsReporting: false,
      },
    ],
  ],
  mochaOpts: {
    ui: 'bdd',
    timeout: 120000,
  },
  afterTest: async function (test, _context, { error }) {
    if (error) {
      await browser.takeScreenshot();
    }
  },
  onPrepare() {
    console.log('Starting FacilityDesk Appium Android E2E tests');
    console.log(`APK: ${config.apkPath}`);
    console.log(`API: ${config.apiUrl}`);
  },
};
