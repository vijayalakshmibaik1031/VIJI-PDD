const BasePage = require('./BasePage');
const LoginPage = require('./LoginPage');

class RegisterPage extends BasePage {
  async openFromLogin() {
    await LoginPage.waitForIsShown();
    await LoginPage.clickTestId('registerLink');
    await this.waitForTestId('registerTitle');
  }

  async register({ name, id, password }) {
    await this.setTestIdValue('registerName', name);
    await this.setTestIdValue('registerEmployeeId', id);
    await this.setTestIdValue('registerPassword', password);
    await this.clickTestId('registerSubmit');
  }

  async goToLogin() {
    await this.clickTestId('backToLoginLink');
  }
}

module.exports = new RegisterPage();
