const { switchToWebView } = require('../helpers/context');

class BasePage {
  async $(testId) {
    await switchToWebView();
    return $(`[data-testid="${testId}"]`);
  }

  async waitForTestId(testId, timeout = 15000) {
    const el = await this.$(testId);
    await el.waitForDisplayed({ timeout });
    return el;
  }

  async clickTestId(testId) {
    const el = await this.waitForTestId(testId);
    await el.click();
  }

  async setTestIdValue(testId, value) {
    const el = await this.waitForTestId(testId);
    await el.clearValue();
    await el.setValue(value);
  }

  async getTestIdText(testId) {
    const el = await this.waitForTestId(testId);
    return el.getText();
  }
}

module.exports = BasePage;
