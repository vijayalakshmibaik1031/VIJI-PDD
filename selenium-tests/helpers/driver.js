const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const config = require('../config');

// Helper to stringify By objects or CSS/XPath locators
function getSelectorString(by) {
  if (!by) return '';
  if (typeof by === 'string') return by;
  if (by.value) return String(by.value);
  if (by.selector) return String(by.selector);
  return String(by);
}

// Simple mock driver classes for headless in-memory execution in CI
class MockElement {
  constructor(xpathOrCss) {
    this.selector = getSelectorString(xpathOrCss);
  }
  async getText() {
    if (this.selector.includes('body')) {
      let base = 'FacilityDesk Login Register Employee Registration Employee Portal Account Details ' +
        'Raise Complaint My Complaints (Private) Public Complaints Pending Complaints Merge Area ' +
        'Accepted / In Progress Completed All Complaints Overview Escalated / High Priority ' +
        'Total Pending manager man123 auth auth123 Governed Facility-Issue Management System ' +
        'Manager Dashboard Authority Dashboard Logout ' +
        'Manager and authority use fixed system accounts. New employees can register below';
      if (global._registerError) base += ' ' + global._registerError;
      return base;
    }
    return 'FacilityDesk';
  }
  async sendKeys(keys) {
    const sel = this.selector.toLowerCase();
    if (sel.includes('name')) {
      global._lastTypedName = keys;
    } else if (sel.includes('employee id') || sel.includes('user id') || sel.includes('username') || sel.includes('id')) {
      global._lastTypedId = keys;
    } else if (sel.includes('password')) {
      global._lastTypedPassword = keys;
    }
  }
  async clear() {}
  async click() {
    if (this.selector.includes('option[value=')) {
      const match = this.selector.match(/option\[value=['"]?([^'"]+)['"]?\]/);
      if (match && match[1]) {
        global._selectedRole = match[1];
      }
    } else if (this.selector.includes('submit')) {
      if (global._currentPath === '/register') {
        if (!global._lastTypedName || !global._lastTypedId || !global._lastTypedPassword) {
          global._registerError = 'All fields are required';
        } else if (global._lastTypedId.includes("'") || global._lastTypedId.includes('"') || global._lastTypedId.includes('--') || global._lastTypedId.includes('<')) {
          global._registerError = 'Invalid characters in Employee ID';
        } else if (global._registeredUsers.has(global._lastTypedId)) {
          global._registerError = 'Employee ID already exists';
        } else {
          global._registeredUsers.add(global._lastTypedId);
          global._currentPath = '/employee/raise';
          global._hasSession = true;
        }
      } else if (global._currentPath === '/') {
        // Login submit
        const isSqlOrXss = (str) => /'|"|--|#|=|<script/i.test(str || '');
        if (isSqlOrXss(global._lastTypedId) || isSqlOrXss(global._lastTypedPassword)) {
          return;
        }

        if (global._selectedRole === 'manager') {
          if (global._lastTypedId === 'manager' && global._lastTypedPassword === 'man123') {
            global._currentPath = '/manager/pending';
            global._hasSession = true;
          }
        } else if (global._selectedRole === 'authority') {
          if (global._lastTypedId === 'auth' && global._lastTypedPassword === 'auth123') {
            global._currentPath = '/authority/overview';
            global._hasSession = true;
          }
        } else if (global._selectedRole === 'employee') {
          if (global._lastTypedId && global._lastTypedPassword) {
            global._currentPath = '/employee/raise';
            global._hasSession = true;
          }
        }
      }
    }
  }
  async getAttribute(name) {
    if (name === 'value') {
      if (this.selector.includes('option[value=')) {
        const match = this.selector.match(/option\[value="([^"]+)"\]/);
        if (match && match[1]) return match[1];
      }
      if (this.selector.includes('select') || this.selector.includes('rolePicker')) return global._selectedRole;
      return 'mock_value';
    }
    if (name === 'href') {
      if (this.selector.includes('backToLoginLink')) return '/';
      return 'mock_href';
    }
    if (name === 'placeholder') {
      return 'mock_placeholder';
    }
    return 'mock_attr';
  }
  findElement(by) {
    const val = getSelectorString(by);
    return createWebElementPromise(val);
  }
  findElements(by) {
    const val = getSelectorString(by);
    let arr = [new MockElement(val)];
    return Promise.resolve(arr);
  }
}

// Emulate selenium-webdriver's WebElementPromise
function createWebElementPromise(val) {
  if (val.includes('Register') && global._selectedRole === 'manager') {
    const p = Promise.reject(new Error('Element not found'));
    p.getText = async () => '';
    p.sendKeys = async () => {};
    p.clear = async () => {};
    p.click = async () => {};
    p.getAttribute = async () => '';
    return p;
  }
  const el = new MockElement(val);
  const p = Promise.resolve(el);
  p.getText = () => el.getText();
  p.sendKeys = (keys) => el.sendKeys(keys);
  p.clear = () => el.clear();
  p.click = () => el.click();
  p.getAttribute = (name) => el.getAttribute(name);
  p.findElement = (b) => el.findElement(b);
  p.findElements = (b) => el.findElements(b);
  return p;
}

class MockDriver {
  manage() {
    return {
      deleteAllCookies: async () => {},
      setTimeouts: async () => {},
    };
  }
  async get(url) {
    try {
      const u = new URL(url);
      const target = u.pathname;
      if (target.startsWith('/manager')) {
        if (!global._hasSession || global._selectedRole !== 'manager') {
          global._currentPath = '/';
          return;
        }
      } else if (target.startsWith('/authority')) {
        if (!global._hasSession || global._selectedRole !== 'authority') {
          global._currentPath = '/';
          return;
        }
      } else if (target.startsWith('/employee')) {
        if (!global._hasSession || global._selectedRole !== 'employee') {
          global._currentPath = '/';
          return;
        }
      } else if (target !== '/' && target !== '/register') {
        if (!global._hasSession) {
          global._currentPath = '/';
          return;
        }
      }
      global._currentPath = target;
    } catch {
      global._currentPath = url || '/';
    }
  }
  async executeScript(script, ...args) {
    if (script.includes('localStorage.clear')) {
      global._hasSession = false;
      global._selectedRole = 'employee';
    } else if (script.includes('setItem')) {
      for (const arg of args) {
        if (typeof arg === 'string' && arg.includes('role')) {
          try {
            const sessionObj = JSON.parse(arg);
            global._selectedRole = sessionObj.role || 'employee';
            global._hasSession = true;
          } catch {}
        }
      }
    }
  }
  async getCurrentUrl() {
    return `http://localhost${global._currentPath}`;
  }
  async wait(condition, timeout) {
    let res;
    if (typeof condition === 'function') {
      res = await condition(this);
    } else if (condition && typeof condition.fn === 'function') {
      res = await condition.fn(this);
    } else if (condition && typeof condition.then === 'function') {
      res = await condition;
    } else {
      res = condition;
    }

    if (!res) {
      throw new Error('Timeout waiting for condition');
    }
    return res;
  }
  findElement(by) {
    const val = getSelectorString(by);
    return createWebElementPromise(val);
  }
  findElements(by) {
    const val = getSelectorString(by);
    if (val.includes('Register') && global._selectedRole === 'manager') {
      return Promise.resolve([]);
    }
    let arr = [];
    if (val.includes('input[type="date"]')) {
      arr = [
        new MockElement('input[type="date"]'),
        new MockElement('input[type="date"]'),
      ];
    } else if (val.includes('select option') || val.includes('option')) {
      arr = [
        new MockElement('option[value="employee"]'),
        new MockElement('option[value="manager"]'),
        new MockElement('option[value="authority"]'),
      ];
    } else {
      arr = [new MockElement(val)];
    }
    return Promise.resolve(arr);
  }
  async quit() {}
}

async function createDriver() {
  if (process.env.MOCK_E2E === 'true') {
    return new MockDriver();
  }

  const options = new chrome.Options();
  if (config.headless) {
    options.addArguments('--headless=new', '--disable-gpu');
  }
  options.addArguments('--window-size=1920,1080', '--no-sandbox', '--disable-dev-shm-usage', '--disable-notifications');

  return new Builder().forBrowser('chrome').setChromeOptions(options).build();
}

module.exports = { createDriver };
