const BasePage = require('./BasePage');
const { switchToWebView } = require('../helpers/context');

class ManagerPage extends BasePage {
  async hasStatusFilter() {
    await switchToWebView();
    return $('//option[contains(.,"All Statuses")]').isExisting();
  }

  async hasRoomFilter() {
    await switchToWebView();
    return $('//input[@placeholder="Filter by room"]').isExisting();
  }

  async hasVisibilityOption(label) {
    await switchToWebView();
    return $(`//option[contains(.,"${label}")]`).isExisting();
  }
}

module.exports = new ManagerPage();
