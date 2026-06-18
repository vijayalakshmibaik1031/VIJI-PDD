const { expect } = require('chai');
describe('Appium Android smoke test', () => {
  it('should launch the app and return an activity name', async () => {
    await browser.pause(8000);
    const currentActivity = await driver.getCurrentActivity();
    expect(currentActivity).to.be.a('string').and.not.empty;
  });
});
