const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const config = require('../config');

async function createDriver() {
  const options = new chrome.Options();
  if (config.headless) {
    options.addArguments('--headless=new', '--disable-gpu');
  }
  options.addArguments('--window-size=1920,1080', '--no-sandbox', '--disable-dev-shm-usage', '--disable-notifications');

  return new Builder().forBrowser('chrome').setChromeOptions(options).build();
}

module.exports = { createDriver };
