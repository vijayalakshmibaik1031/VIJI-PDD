const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', '..', 'selenium-tests', 'test-cases.js'), 'utf8');
let s = src;

const replacements = [
  [/async \(d\) =>/g, 'async () =>'],
  [/pages\.clearSession\(d\)/g, 'pages.clearSession()'],
  [/pages\.goTo\(d, /g, 'pages.navigateTo('],
  [/pages\.bodyText\(d\)/g, 'pages.bodyText()'],
  [/pages\.loginAs\(d,/g, 'pages.loginAs('],
  [/pages\.getCurrentPath\(d\)/g, 'pages.currentPath()'],
  [/pages\.isLoginPage\(d\)/g, 'pages.isLoginScreen()'],
  [/pages\.loginEmployeeSession\(d\)/g, 'pages.loginEmployeeSession()'],
  [/pages\.loginManagerSession\(d\)/g, 'pages.loginManagerSession()'],
  [/pages\.loginAuthoritySession\(d\)/g, 'pages.loginAuthoritySession()'],
  [/pages\.registerEmployee\(d,/g, 'pages.registerEmployee('],
  [/pages\.logout\(d\)/g, 'pages.logout()'],
  [/pages\.raiseComplaint\(d,/g, 'pages.raiseComplaint('],
  [/pages\.waitForRedirectAway\(d,/g, 'pages.waitForRedirectAway('],
  [/pages\.elementExists\(d, /g, 'pages.xpathExists('],
];

for (const [pattern, repl] of replacements) s = s.replace(pattern, repl);

s = s.replace(
  /await d\.findElement\(pages\.By\.css\(`option\[value="\$\{role\}"\]`\)\)\.click\(\);\s*const val = await d\.findElement\(pages\.By\.css\('select'\)\)\.getAttribute\('value'\);/g,
  "await pages.selectRoleOption(role);\n        const val = await pages.byTestId('rolePicker').then((el) => el.getValue());",
);

s = s.replace(
  /await pages\.clearSession\(\);\s*await pages\.navigateTo\('\/'\);\s*await d\.findElement\(pages\.By\.css\('option\[value="manager"\]'\)\)\.click\(\);/g,
  "await pages.clearSession();\n      await pages.navigateTo('/');\n      await pages.selectRoleOption('manager');",
);

s = s.replace(
  /await pages\.clearSession\(\);\s*await pages\.navigateTo\('\/'\);\s*await d\.findElement\(pages\.By\.css\('option\[value="authority"\]'\)\)\.click\(\);/g,
  "await pages.clearSession();\n      await pages.navigateTo('/');\n      await pages.selectRoleOption('authority');",
);

s = s.replace(
  /await pages\.clearSession\(\);\s*await pages\.navigateTo\('\/'\);\s*await d\.findElement\(pages\.By\.css\('option\[value="employee"\]'\)\)\.click\(\);/g,
  "await pages.clearSession();\n      await pages.navigateTo('/');\n      await pages.selectRoleOption('employee');",
);

s = s.replace(
  /await d\.findElement\(pages\.By\.css\('input\[type="password"\]'\)\)\.sendKeys\('x'\);\s*await d\.findElement\(pages\.By\.css\('button\[type="submit"\]'\)\)\.click\(\);/g,
  "await pages.byTestId('password').then((el) => el.setValue('x'));\n      await pages.byTestId('loginButton').then((el) => el.click());",
);

s = s.replace(
  /await d\.findElement\(pages\.By\.xpath\("\/\/label\[normalize-space\(\)='User ID'\]\/following-sibling::input\[1\]"\)\)\.sendKeys\('manager'\);\s*await d\.findElement\(pages\.By\.css\('button\[type="submit"\]'\)\)\.click\(\);/g,
  "await pages.byTestId('userId').then((el) => el.setValue('manager'));\n      await pages.byTestId('loginButton').then((el) => el.click());",
);

s = s.replace(
  /await d\.findElement\(pages\.By\.xpath\("\/\/a\[normalize-space\(\)='Login'\]"\)\)\.click\(\);/g,
  "await pages.xpathClick(\"//a[normalize-space()='Login']\");",
);

s = s.replace(
  /await pages\.clearSession\(\);\s*await pages\.navigateTo\('\/register'\);\s*await d\.findElement\(pages\.By\.xpath\("\/\/label\[normalize-space\(\)='Name'\]\/following-sibling::input\[1\]"\)\)\.sendKeys\('Dup B'\);\s*await d\.findElement\(pages\.By\.xpath\("\/\/label\[normalize-space\(\)='Employee ID'\]\/following-sibling::input\[1\]"\)\)\.sendKeys\(uid\);\s*await d\.findElement\(pages\.By\.xpath\("\/\/label\[normalize-space\(\)='Password'\]\/following-sibling::input\[1\]"\)\)\.sendKeys\('pass5678'\);\s*await d\.findElement\(pages\.By\.css\('button\[type="submit"\]'\)\)\.click\(\);/g,
  "await pages.clearSession();\n      await pages.navigateTo('/register');\n      await pages.RegisterPage.register({ name: 'Dup B', id: uid, password: 'pass5678' });",
);

s = s.replace(
  /await pages\.clearSession\(\);\s*await pages\.navigateTo\('\/register'\);\s*await d\.findElement\(pages\.By\.xpath\("\/\/label\[normalize-space\(\)='Employee ID'\]\/following-sibling::input\[1\]"\)\)\.sendKeys\('x'\);\s*await d\.findElement\(pages\.By\.xpath\("\/\/label\[normalize-space\(\)='Password'\]\/following-sibling::input\[1\]"\)\)\.sendKeys\('pass'\);\s*await d\.findElement\(pages\.By\.css\('button\[type="submit"\]'\)\)\.click\(\);/g,
  "await pages.clearSession();\n      await pages.navigateTo('/register');\n      await pages.byTestId('registerEmployeeId').then((el) => el.setValue('x'));\n      await pages.byTestId('registerPassword').then((el) => el.setValue('pass'));\n      await pages.byTestId('registerSubmit').then((el) => el.click());",
);

s = s.replace(
  /await d\.findElement\(pages\.By\.xpath\(`\/\/main\/\/button\[normalize-space\(\)='\$\{room\}'\]`\)\)\.click\(\);/g,
  'await pages.EmployeePage.selectRoom(room);',
);

s = s.replace(
  /const opts = await d\.findElements\(pages\.By\.css\('select option'\)\);\s*const vals = await Promise\.all\(opts\.map\(\(o\) => o\.getAttribute\('value'\)\)\);/g,
  'const vals = await pages.getSelectOptions();',
);

s = s.replace(
  /const inputs = await d\.findElements\(pages\.By\.css\('input\[type="date"\]'\)\);\s*return \{ pass: inputs\.length >= 2, actual: `\$\{inputs\.length\} date inputs` \};/g,
  "const count = await pages.countElements('input[type=\"date\"]');\n      return { pass: count >= 2, actual: `${count} date inputs` };",
);

const appLaunch = `
  tests.unshift(
    tc(id(), 'App Launch', 'App launches successfully', 'Verify Android app starts', 'Launch APK', 'Activity returned', 'Critical', async () => {
      const activity = await driver.getCurrentActivity();
      return { pass: !!activity, actual: activity || 'none' };
    }),
    tc(id(), 'App Launch', 'Login screen visible after launch', 'First screen is login', 'Launch and wait', 'Login button visible', 'Critical', async () => {
      await pages.clearSession();
      const ok = await pages.elementExists('loginButton', 15000);
      return { pass: ok, actual: ok ? 'login visible' : 'missing' };
    }),
  );

  // ── LOGIN`;

s = s.replace('  // ── LOGIN ───────────────────────────────────────────────────', appLaunch);

fs.writeFileSync(path.join(__dirname, '..', 'test-cases.js'), s);
const { buildTestCases } = require('../test-cases');
console.log(`Generated ${buildTestCases().length} Appium test cases`);
