const BasePage = require('./BasePage');
const { switchToWebView } = require('../helpers/context');

class AuthorityPage extends BasePage {
  async dateInputCount() {
    await switchToWebView();
    const inputs = await $$('input[type="date"]');
    return inputs.length;
  }

  async hasCategoryOption(category) {
    await switchToWebView();
    return $(`//option[@value='${category}' or contains(.,'${category}')]`).isExisting();
  }
}

module.exports = new AuthorityPage();
