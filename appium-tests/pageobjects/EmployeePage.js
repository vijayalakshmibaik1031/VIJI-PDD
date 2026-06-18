const BasePage = require('./BasePage');
const { switchToWebView } = require('../helpers/context');

class EmployeePage extends BasePage {
  async selectRoom(room) {
    await switchToWebView();
    const btn = await $(`//main//button[normalize-space()="${room}"]`);
    await btn.waitForDisplayed({ timeout: 10000 });
    await btn.click();
  }

  async selectCategory(category) {
    await switchToWebView();
    const select = await $('//main//select[1]');
    await select.waitForDisplayed({ timeout: 10000 });
    await select.selectByAttribute('value', category);
  }

  async setDescription(text) {
    await switchToWebView();
    const textarea = await $('//main//textarea');
    await textarea.waitForDisplayed({ timeout: 10000 });
    await textarea.clearValue();
    await textarea.setValue(text);
  }

  async submit() {
    await switchToWebView();
    const btn = await $('//main//button[contains(.,"Submit")]');
    await btn.click();
  }
}

module.exports = new EmployeePage();
