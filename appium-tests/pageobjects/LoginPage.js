const BasePage = require('./BasePage');
const { switchToWebView } = require('../helpers/context');

class LoginPage extends BasePage {
  get rolePicker() {
    return this.$('rolePicker');
  }

  get userIdInput() {
    return this.$('userId');
  }

  get passwordInput() {
    return this.$('password');
  }

  get loginButton() {
    return this.$('loginButton');
  }

  get loginTitle() {
    return this.$('loginTitle');
  }

  get loginError() {
    return this.$('loginError');
  }

  get registerLink() {
    return this.$('registerLink');
  }

  async waitForIsShown() {
    await this.waitForTestId('loginButton');
  }

  async selectRole(role) {
    await switchToWebView();
    const picker = await this.waitForTestId('rolePicker');
    await picker.selectByAttribute('value', role);
  }

  async login(role, userId, password) {
    await this.waitForIsShown();
    await this.selectRole(role);
    await this.setTestIdValue('userId', userId);
    await this.setTestIdValue('password', password);
    await this.clickTestId('loginButton');
  }

  async getErrorText() {
    try {
      return await this.getTestIdText('loginError');
    } catch {
      return '';
    }
  }
}

module.exports = new LoginPage();
