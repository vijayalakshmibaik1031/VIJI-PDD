const config = require('../config');
const LoginPage = require('../pageobjects/LoginPage');
const RegisterPage = require('../pageobjects/RegisterPage');
const AppShellPage = require('../pageobjects/AppShellPage');
const EmployeePage = require('../pageobjects/EmployeePage');
const ManagerPage = require('../pageobjects/ManagerPage');
const AuthorityPage = require('../pageobjects/AuthorityPage');
const { sleep, switchToWebView } = require('./context');
const {
  registerAndLoginEmployee,
  loginManagerViaApi,
  loginAuthorityViaApi,
  seedAppSession,
} = require('./api-setup');

async function byTestId(id) {
  await switchToWebView();
  return $(`[data-testid="${id}"]`);
}

async function bodyText() {
  await switchToWebView();
  return $('body').getText();
}

async function elementExists(testId, timeout = 5000) {
  try {
    const el = await byTestId(testId);
    await el.waitForExist({ timeout });
    return true;
  } catch {
    return false;
  }
}

async function textExists(text, timeout = 5000) {
  try {
    await switchToWebView();
    const el = await $(`//*[contains(normalize-space(.),"${text}")]`);
    await el.waitForExist({ timeout });
    return true;
  } catch {
    return false;
  }
}

async function relaunchApp() {
  try {
    await switchToWebView(3000);
    await browser.url('http://localhost/');
    await browser.execute(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await sleep(500);
  } catch (err) {
    console.log('[Appium] Soft reset failed, performing hard relaunch...');
    try {
      await driver.terminateApp(config.appPackage);
    } catch {}
    await sleep(1000);
    await driver.activateApp(config.appPackage);
    await sleep(3500);
    await switchToWebView(20000);
  }
}

async function clearSession() {
  await relaunchApp();
  await browser.execute(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await sleep(500);
}

async function loginAs(role, userId, password) {
  await relaunchApp();
  await LoginPage.waitForIsShown();
  await LoginPage.login(role, userId, password);
  await sleep(1500);
}

async function loginEmployeeSession() {
  const creds = await registerAndLoginEmployee();
  await relaunchApp();
  await seedAppSession(creds.token, creds.session);
  await driver.execute('mobile: deepLink', {
    url: 'http://localhost/employee/raise',
    package: config.appPackage,
  }).catch(async () => {
    await browser.url('http://localhost/employee/raise');
  });
  await sleep(1200);
  return creds;
}

async function loginManagerSession() {
  const creds = await loginManagerViaApi();
  await relaunchApp();
  await seedAppSession(creds.token, creds.session);
  await browser.url('http://localhost/manager/pending');
  await sleep(1200);
}

async function loginAuthoritySession() {
  const creds = await loginAuthorityViaApi();
  await relaunchApp();
  await seedAppSession(creds.token, creds.session);
  await browser.url('http://localhost/authority/overview');
  await sleep(1200);
}

async function registerEmployee({ name, id, password }) {
  await relaunchApp();
  await RegisterPage.openFromLogin();
  await RegisterPage.register({ name, id, password });
  await sleep(1500);
}

async function logout() {
  await AppShellPage.logout();
  await sleep(800);
}

async function isLoginScreen() {
  return elementExists('loginButton', 3000);
}

async function navigateTo(path) {
  await switchToWebView();
  await browser.url(`http://localhost${path}`);
  await sleep(800);
}

async function currentPath() {
  await switchToWebView();
  const href = await browser.execute(() => window.location.pathname);
  return href || '/';
}

async function raiseComplaint({ room = '11', category = 'Electrical', description = 'E2E test complaint' }) {
  await navigateTo('/employee/raise');
  await EmployeePage.selectRoom(room);
  await EmployeePage.selectCategory(category);
  await EmployeePage.setDescription(description);
  await EmployeePage.submit();
  await sleep(1000);
}

async function waitForRedirectAway(forbiddenPrefix, timeout = 8000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const path = await currentPath();
    if (!path.startsWith(forbiddenPrefix)) return;
    await sleep(300);
  }
}

async function xpathExists(xpath, timeout = 5000) {
  try {
    await switchToWebView();
    const el = await $(xpath);
    await el.waitForExist({ timeout });
    return true;
  } catch {
    return false;
  }
}

async function xpathClick(xpath) {
  await switchToWebView();
  const el = await $(xpath);
  await el.waitForDisplayed({ timeout: 10000 });
  await el.click();
}

async function xpathSetValue(xpath, value) {
  await switchToWebView();
  const el = await $(xpath);
  await el.waitForDisplayed({ timeout: 10000 });
  await el.clearValue();
  await el.setValue(value);
}

async function selectRoleOption(role) {
  await switchToWebView();
  const picker = await $('[data-testid="rolePicker"]');
  await picker.selectByAttribute('value', role);
}

async function getSelectOptions() {
  await switchToWebView();
  const opts = await $$('select option');
  return Promise.all(opts.map((o) => o.getAttribute('value')));
}

async function countElements(css) {
  await switchToWebView();
  const els = await $$(css);
  return els.length;
}

module.exports = {
  sleep,
  byTestId,
  bodyText,
  elementExists,
  textExists,
  xpathExists,
  xpathClick,
  xpathSetValue,
  selectRoleOption,
  getSelectOptions,
  countElements,
  relaunchApp,
  clearSession,
  loginAs,
  loginEmployeeSession,
  loginManagerSession,
  loginAuthoritySession,
  registerEmployee,
  logout,
  isLoginScreen,
  navigateTo,
  currentPath,
  raiseComplaint,
  waitForRedirectAway,
  LoginPage,
  RegisterPage,
  AppShellPage,
  EmployeePage,
  ManagerPage,
  AuthorityPage,
};
