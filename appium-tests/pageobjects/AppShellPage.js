const BasePage = require('./BasePage');

class AppShellPage extends BasePage {
  async logout() {
    await this.clickTestId('logoutButton');
  }

  async isLogoutVisible() {
    try {
      await this.waitForTestId('logoutButton', 5000);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = new AppShellPage();
