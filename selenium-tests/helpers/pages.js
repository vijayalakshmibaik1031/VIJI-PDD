const { By, until } = require('selenium-webdriver');
const config = require('../config');
const {
  registerAndLoginEmployee,
  loginManagerViaApi,
  loginAuthorityViaApi,
  seedBrowserSession,
} = require('./api-setup');

let cachedEmployeeSession = null;
let cachedManagerSession = null;
let cachedAuthoritySession = null;

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function clearSession(driver) {
  await driver.manage().deleteAllCookies();
  await driver.get(config.baseUrl);
  await driver.executeScript('localStorage.clear(); sessionStorage.clear();');
  await sleep(300);
}

async function goTo(driver, path) {
  const url = path.startsWith('http') ? path : `${config.baseUrl}${path}`;
  await driver.get(url);
  await sleep(600);
}

async function getCurrentPath(driver) {
  const url = await driver.getCurrentUrl();
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

async function waitForPath(driver, predicate, timeout = config.timeoutMs) {
  await driver.wait(async () => predicate(await getCurrentPath(driver)), timeout);
}

async function bodyText(driver) {
  return await driver.findElement(By.css('body')).getText();
}

async function isLoginPage(driver) {
  const text = await bodyText(driver);
  return text.includes('FacilityDesk') && text.includes('Login');
}

async function loginAs(driver, role, userId, password) {
  await clearSession(driver);
  await goTo(driver, '/');
  await driver.findElement(By.css(`select option[value="${role}"]`)).click();
  await driver.findElement(By.xpath("//label[normalize-space()='User ID']/following-sibling::input[1]")).clear();
  await driver.findElement(By.xpath("//label[normalize-space()='User ID']/following-sibling::input[1]")).sendKeys(userId);
  await driver.findElement(By.xpath("//label[normalize-space()='Password']/following-sibling::input[1]")).clear();
  await driver.findElement(By.xpath("//label[normalize-space()='Password']/following-sibling::input[1]")).sendKeys(password);
  await driver.findElement(By.css('button[type="submit"]')).click();
  await sleep(1500);
  try {
    await driver.wait(async () => {
      const p = await getCurrentPath(driver);
      if (role === 'manager') return p.includes('/manager');
      if (role === 'authority') return p.includes('/authority');
      if (role === 'employee') return p.includes('/employee');
      return p !== '/';
    }, 10000);
  } catch {
    /* caller validates */
  }
}

async function loginEmployeeSession(driver) {
  const creds = cachedEmployeeSession || (cachedEmployeeSession = await registerAndLoginEmployee());
  await seedBrowserSession(driver, creds.token, creds.session);
  await goTo(driver, '/employee/raise');
  return creds;
}

async function loginManagerSession(driver) {
  const creds = cachedManagerSession || (cachedManagerSession = await loginManagerViaApi());
  await seedBrowserSession(driver, creds.token, creds.session);
  await goTo(driver, '/manager/pending');
}

async function loginAuthoritySession(driver) {
  const creds = cachedAuthoritySession || (cachedAuthoritySession = await loginAuthorityViaApi());
  await seedBrowserSession(driver, creds.token, creds.session);
  await goTo(driver, '/authority/overview');
}

async function registerEmployee(driver, { name, id, password }) {
  await clearSession(driver);
  await goTo(driver, '/register');
  await driver.findElement(By.xpath("//label[normalize-space()='Name']/following-sibling::input[1]")).sendKeys(name);
  await driver.findElement(By.xpath("//label[normalize-space()='Employee ID']/following-sibling::input[1]")).sendKeys(id);
  await driver.findElement(By.xpath("//label[normalize-space()='Password']/following-sibling::input[1]")).sendKeys(password);
  await driver.findElement(By.css('button[type="submit"]')).click();
  try {
    await driver.wait(async () => {
      const p = await getCurrentPath(driver);
      const text = await bodyText(driver);
      return p.includes('/employee') || text.includes('Employee Portal');
    }, 15000);
  } catch {
    /* caller validates */
  }
}

async function forceLogout(driver) {
  await driver.executeScript('localStorage.clear(); sessionStorage.clear();');
  await goTo(driver, '/');
  await sleep(400);
}

async function logout(driver) {
  await forceLogout(driver);
}

async function elementExists(driver, xpath, timeout = 5000) {
  try {
    await driver.wait(until.elementLocated(By.xpath(xpath)), timeout);
    return true;
  } catch {
    return false;
  }
}

async function clickNavLink(driver, label) {
  const routes = {
    'Raise Complaint': '/employee/raise',
    'My Complaints (Private)': '/employee/private',
    'Public Complaints': '/employee/public',
    Account: '/employee/account',
  };
  if (routes[label]) await goTo(driver, routes[label]);
}

async function raiseComplaint(driver, { room = '11', category = 'Electrical', description = 'E2E test complaint' }) {
  await goTo(driver, '/employee/raise');
  const roomBtn = await driver.wait(
    until.elementLocated(By.xpath(`//main//button[normalize-space()='${room}']`)),
    config.timeoutMs
  );
  await roomBtn.click();
  const catSelect = await driver.findElement(By.xpath("//main//select[1]"));
  await catSelect.findElement(By.css(`option[value="${category}"]`)).click();
  const textarea = await driver.findElement(By.xpath("//main//textarea"));
  await textarea.clear();
  await textarea.sendKeys(description);
  await driver.findElement(By.xpath("//main//button[contains(.,'Submit')]")).click();
  await sleep(1000);
}

async function waitForRedirectAway(driver, forbiddenPrefix, timeout = 8000) {
  await driver.wait(async () => {
    const p = await getCurrentPath(driver);
    return !p.startsWith(forbiddenPrefix);
  }, timeout);
}

module.exports = {
  sleep,
  clearSession,
  goTo,
  waitForPath,
  getCurrentPath,
  loginAs,
  loginEmployeeSession,
  loginManagerSession,
  loginAuthoritySession,
  registerEmployee,
  forceLogout,
  logout,
  bodyText,
  isLoginPage,
  elementExists,
  clickNavLink,
  raiseComplaint,
  waitForRedirectAway,
  By,
  until,
};
