const { buildTestCases } = require('../../test-cases');
const { switchToWebView } = require('../../helpers/context');

const MODULES = (process.env.APPIUM_MODULES || 'App Launch,Login,Register').split(',').map((m) => m.trim());

describe(`FacilityDesk Appium — ${MODULES.join(', ')}`, () => {
  before(async () => {
    await switchToWebView();
  });

  buildTestCases()
    .filter((t) => MODULES.includes(t.module))
    .forEach((testCase) => {
      it(`${testCase.id} — ${testCase.name}`, async function () {
        this.test.title = `[${testCase.module}] ${testCase.id} — ${testCase.name}`;
        const result = await testCase.run();
        if (!result.pass) {
          await browser.takeScreenshot();
          throw new Error(`${testCase.id} expected "${testCase.expected}" but got: ${result.actual}`);
        }
      });
    });
});
