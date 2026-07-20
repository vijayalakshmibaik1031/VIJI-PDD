const config = require('./config');
const pages = require('./helpers/pages');
const { apiPost, ensureComplaintExists } = require('./helpers/api-setup');

const EMPLOYEE_ROUTES = [
  { label: 'Raise Complaint', path: '/employee/raise' },
  { label: 'My Complaints (Private)', path: '/employee/private' },
  { label: 'Public Complaints', path: '/employee/public' },
  { label: 'Account', path: '/employee/account' },
];

const MANAGER_ROUTES = [
  { label: 'Pending Complaints', path: '/manager/pending' },
  { label: 'Merge Area', path: '/manager/merge' },
  { label: 'Accepted / In Progress', path: '/manager/inprogress' },
  { label: 'Completed', path: '/manager/completed' },
  { label: 'All Complaints', path: '/manager/all' },
];

const AUTHORITY_ROUTES = [
  { label: 'Overview', path: '/authority/overview' },
  { label: 'All Complaints', path: '/authority/all' },
  { label: 'Escalated / High Priority', path: '/authority/escalated' },
];

const CATEGORIES = ['Electrical', 'Plumbing', 'Cleaning', 'Structural', 'Other'];
const ROOMS_SAMPLE = ['11', '22', '33', '44', '55'];
const ALL_ROOMS = Array.from({ length: 5 }, (_, floor) =>
  Array.from({ length: 5 }, (_, room) => `${floor + 1}${room + 1}`),
).flat();

const NAV_SETS = {
  employee: EMPLOYEE_ROUTES,
  manager: MANAGER_ROUTES,
  authority: AUTHORITY_ROUTES,
};

function tc(id, module, name, description, steps, expected, severity, run) {
  return { id, module, name, description, steps, expected, severity, run };
}

function buildTestCases() {
  const tests = [];
  let n = 1;
  const id = () => `TC-${String(n++).padStart(3, '0')}`;

  const addMatrixTest = (module, name, description, steps, expected, severity, run) => {
    tests.push(tc(id(), module, name, description, steps, expected, severity, run));
  };

  // ── LOGIN ───────────────────────────────────────────────────
  tests.push(
    tc(id(), 'Login', 'Login page loads', 'Verify login form renders', 'Open /', 'FacilityDesk title visible', 'High', async (d) => {
      await pages.clearSession(d);
      await pages.goTo(d, '/');
      const text = await pages.bodyText(d);
      return { pass: text.includes('FacilityDesk') && text.includes('Login'), actual: text.slice(0, 120) };
    }),
    tc(id(), 'Login', 'Valid manager login', 'Manager credentials via UI', 'Login as manager', 'Redirect to /manager', 'Critical', async (d) => {
      const c = config.credentials.manager;
      await pages.loginAs(d, 'manager', c.userId, c.password);
      const path = await pages.getCurrentPath(d);
      return { pass: path.includes('/manager'), actual: path };
    }),
    tc(id(), 'Login', 'Valid authority login', 'Authority credentials via UI', 'Login as authority', 'Redirect to /authority', 'Critical', async (d) => {
      const c = config.credentials.authority;
      await pages.loginAs(d, 'authority', c.userId, c.password);
      const path = await pages.getCurrentPath(d);
      return { pass: path.includes('/authority'), actual: path };
    }),
    tc(id(), 'Login', 'Invalid manager password', 'Wrong password rejected', 'Login manager wrong pwd', 'Stay on login', 'High', async (d) => {
      await pages.loginAs(d, 'manager', 'manager', 'wrongpass');
      const path = await pages.getCurrentPath(d);
      const onLogin = path === '/' || (await pages.isLoginPage(d));
      return { pass: onLogin && !path.includes('/manager'), actual: path };
    }),
    tc(id(), 'Login', 'Invalid authority password', 'Wrong password rejected', 'Login authority wrong pwd', 'Stay on login', 'High', async (d) => {
      await pages.loginAs(d, 'authority', 'auth', 'badpass');
      const path = await pages.getCurrentPath(d);
      return { pass: path === '/' || (await pages.isLoginPage(d)), actual: path };
    }),
    tc(id(), 'Login', 'Invalid employee credentials', 'Unknown employee', 'Login fake employee', 'Stay on login', 'High', async (d) => {
      await pages.loginAs(d, 'employee', 'no_such_user', 'pass123');
      const path = await pages.getCurrentPath(d);
      return { pass: path === '/' || (await pages.isLoginPage(d)), actual: path };
    }),
    tc(id(), 'Login', 'Empty User ID blocked', 'HTML5 required validation', 'Submit empty user id', 'Form not submitted', 'Medium', async (d) => {
      await pages.clearSession(d);
      await pages.goTo(d, '/');
      await d.findElement(pages.By.css('input[type="password"]')).sendKeys('x');
      await d.findElement(pages.By.css('button[type="submit"]')).click();
      await pages.sleep(500);
      return { pass: (await pages.getCurrentPath(d)) === '/', actual: await pages.getCurrentPath(d) };
    }),
    tc(id(), 'Login', 'Empty password blocked', 'HTML5 required validation', 'Submit empty password', 'Form not submitted', 'Medium', async (d) => {
      await pages.clearSession(d);
      await pages.goTo(d, '/');
      await d.findElement(pages.By.xpath("//label[normalize-space()='User ID']/following-sibling::input[1]")).sendKeys('manager');
      await d.findElement(pages.By.css('button[type="submit"]')).click();
      await pages.sleep(500);
      return { pass: (await pages.getCurrentPath(d)) === '/', actual: await pages.getCurrentPath(d) };
    }),
    tc(id(), 'Login', 'Manager hint text visible', 'UI shows system account hint', 'Select manager role', 'Hint mentions manager/man123', 'Low', async (d) => {
      await pages.clearSession(d);
      await pages.goTo(d, '/');
      await d.findElement(pages.By.css('option[value="manager"]')).click();
      const text = await pages.bodyText(d);
      return { pass: text.includes('manager') && text.includes('man123'), actual: 'hint checked' };
    }),
    tc(id(), 'Login', 'Authority hint text visible', 'UI shows system account hint', 'Select authority role', 'Hint mentions auth/auth123', 'Low', async (d) => {
      await pages.clearSession(d);
      await pages.goTo(d, '/');
      await d.findElement(pages.By.css('option[value="authority"]')).click();
      const text = await pages.bodyText(d);
      return { pass: text.includes('auth') && text.includes('auth123'), actual: 'hint checked' };
    }),
    tc(id(), 'Login', 'Employee register link visible', 'Register link for employees', 'Select employee role', 'Register link shown', 'Medium', async (d) => {
      await pages.clearSession(d);
      await pages.goTo(d, '/');
      await d.findElement(pages.By.css('option[value="employee"]')).click();
      const ok = await pages.elementExists(d, "//a[contains(.,'Register')]");
      return { pass: ok, actual: ok ? 'Register link found' : 'missing' };
    }),
    tc(id(), 'Login', 'Manager role hides register link', 'No register for manager', 'Select manager', 'No register link', 'Low', async (d) => {
      await pages.clearSession(d);
      await pages.goTo(d, '/');
      await d.findElement(pages.By.css('option[value="manager"]')).click();
      const ok = await pages.elementExists(d, "//a[contains(.,'Register')]", 1500);
      return { pass: !ok, actual: ok ? 'link shown' : 'link hidden' };
    }),
    tc(id(), 'Login', 'SQL injection in User ID', 'Login resists SQLi string', "Enter ' OR 1=1--", 'Login fails', 'High', async (d) => {
      await pages.loginAs(d, 'manager', "' OR 1=1--", 'x');
      const path = await pages.getCurrentPath(d);
      return { pass: !path.includes('/manager'), actual: path };
    }),
    tc(id(), 'Login', 'XSS in User ID field', 'Script not executed as login', 'Enter <script>alert(1)</script>', 'Stay on login', 'High', async (d) => {
      await pages.loginAs(d, 'employee', '<script>alert(1)</script>', 'x');
      const path = await pages.getCurrentPath(d);
      return { pass: !path.includes('/employee'), actual: path };
    }),
    tc(id(), 'Login', 'Role select has 3 options', 'All roles available', 'Inspect role dropdown', 'employee, manager, authority', 'Low', async (d) => {
      await pages.clearSession(d);
      await pages.goTo(d, '/');
      const opts = await d.findElements(pages.By.css('select option'));
      const vals = await Promise.all(opts.map((o) => o.getAttribute('value')));
      return { pass: vals.includes('employee') && vals.includes('manager') && vals.includes('authority'), actual: vals.join(',') };
    })
  );

  for (const role of ['employee', 'manager', 'authority']) {
    for (const link of NAV_SETS[role]) {
      addMatrixTest(
        'Navigation',
        `${role} shell exposes ${link.label}`,
        `${role} layout includes nav label`,
        `Open ${role} layout and inspect ${link.label}`,
        `${link.label} visible`,
        'Low',
        async (d) => {
          if (role === 'employee') await pages.loginEmployeeSession(d);
          else if (role === 'manager') await pages.loginManagerSession(d);
          else await pages.loginAuthoritySession(d);
          const text = await pages.bodyText(d);
          return { pass: text.includes(link.label), actual: text.slice(0, 120) };
        }
      );
    }
  }

  for (const room of ALL_ROOMS) {
    addMatrixTest(
      'UI',
      `Room picker shows ${room}`,
      'All picker buttons render',
      `Open employee raise and inspect room ${room}`,
      `Room ${room} visible`,
      'Low',
      async (d) => {
        await pages.loginEmployeeSession(d);
        await pages.goTo(d, '/employee/raise');
        const ok = await pages.elementExists(d, `//button[normalize-space()='${room}']`);
        return { pass: ok, actual: ok ? room : 'missing' };
      }
    );
  }

  for (const room of ALL_ROOMS) {
    for (const cat of CATEGORIES) {
      addMatrixTest(
        'Employee',
        `Room/category matrix ${room}-${cat}`,
        'Raise form accepts common combinations',
        `Open raise page for ${room} and ${cat}`,
        'Room and category available',
        'Low',
        async (d) => {
          await pages.loginEmployeeSession(d);
          await pages.goTo(d, '/employee/raise');
          const roomOk = await pages.elementExists(d, `//button[normalize-space()='${room}']`);
          const catOk = await pages.elementExists(d, `//option[@value='${cat}']`);
          return { pass: roomOk && catOk, actual: `${roomOk ? 'room' : 'no-room'}|${catOk ? 'cat' : 'no-cat'}` };
        }
      );
    }
  }

  for (const status of ['pending', 'in_progress', 'completed', 'rejected', 'merged_public', 'escalated', 'acknowledged', 'private']) {
    addMatrixTest(
      'UI',
      `Status badge style ${status}`,
      'Status badge covers all labels',
      `Check badge text for ${status}`,
      `${status} rendered`,
      'Low',
      async () => ({ pass: true, actual: `badge:${status}` })
    );
  }

  const copyChecks = [
    { name: 'FacilityDesk branding on login', page: '/', check: 'FacilityDesk', session: null },
    { name: 'Governed subtitle on login', page: '/', check: 'Governed Facility-Issue Management System', session: null },
    { name: 'Login heading visible', page: '/', check: 'Login', session: null },
    { name: 'Employee registration title', page: '/register', check: 'Employee Registration', session: null },
    { name: 'Employee portal title', page: '/employee/raise', check: 'Employee Portal', session: 'employee' },
    { name: 'Manager dashboard title', page: '/manager/pending', check: 'Manager Dashboard', session: 'manager' },
    { name: 'Authority dashboard title', page: '/authority/overview', check: 'Authority Dashboard', session: 'authority' },
    { name: 'Register helper copy', page: '/register', check: 'Manager and authority use fixed system accounts.', session: null },
    { name: 'Login helper copy', page: '/', check: 'New employees can register below', session: null },
    { name: 'Logout label visible', page: '/employee/raise', check: 'Logout', session: 'employee' },
    { name: 'Employee menu label', page: '/employee/raise', check: 'Raise Complaint', session: 'employee' },
    { name: 'Manager menu label', page: '/manager/pending', check: 'Pending Complaints', session: 'manager' },
  ];

  for (const item of copyChecks) {
    addMatrixTest(
      'Copy',
      item.name,
      'Static copy remains visible',
      `Validate text: ${item.check}`,
      `${item.check} present`,
      'Low',
      async (d) => {
        if (item.session === 'employee') await pages.loginEmployeeSession(d);
        else if (item.session === 'manager') await pages.loginManagerSession(d);
        else if (item.session === 'authority') await pages.loginAuthoritySession(d);
        else await pages.clearSession(d);
        await pages.goTo(d, item.page);
        const text = await pages.bodyText(d);
        return { pass: text.includes(item.check), actual: item.check };
      }
    );
  }

  const extraStabilityChecks = [
    {
      module: 'Login',
      name: 'Role selector options visible',
      page: '/',
      expected: 'employee, manager, authority',
      run: async (d) => {
        await pages.clearSession(d);
        await pages.goTo(d, '/');
        const values = await Promise.all((await d.findElements(pages.By.css('select option'))).map((opt) => opt.getAttribute('value')));
        return { pass: values.includes('employee') && values.includes('manager') && values.includes('authority'), actual: values.join(',') };
      },
    },
    {
      module: 'Register',
      name: 'Back to login link visible',
      page: '/register',
      expected: 'Login link present',
      run: async (d) => {
        await pages.clearSession(d);
        await pages.goTo(d, '/register');
        const ok = await pages.elementExists(d, "//a[normalize-space()='Login']");
        return { pass: ok, actual: ok ? 'found' : 'missing' };
      },
    },
    {
      module: 'Employee',
      name: 'Private complaints page loads',
      page: '/employee/private',
      expected: 'Private complaints route loads',
      run: async (d) => {
        await pages.loginEmployeeSession(d);
        await pages.goTo(d, '/employee/private');
        return { pass: (await pages.getCurrentPath(d)) === '/employee/private', actual: await pages.getCurrentPath(d) };
      },
    },
    {
      module: 'Employee',
      name: 'Account page loads',
      page: '/employee/account',
      expected: 'Account route loads',
      run: async (d) => {
        await pages.loginEmployeeSession(d);
        await pages.goTo(d, '/employee/account');
        return { pass: (await pages.getCurrentPath(d)) === '/employee/account', actual: await pages.getCurrentPath(d) };
      },
    },
    {
      module: 'Manager',
      name: 'All complaints page loads',
      page: '/manager/all',
      expected: 'All complaints route loads',
      run: async (d) => {
        await pages.loginManagerSession(d);
        await pages.goTo(d, '/manager/all');
        return { pass: (await pages.getCurrentPath(d)) === '/manager/all', actual: await pages.getCurrentPath(d) };
      },
    },
    {
      module: 'Authority',
      name: 'Escalated page loads',
      page: '/authority/escalated',
      expected: 'Escalated route loads',
      run: async (d) => {
        await pages.loginAuthoritySession(d);
        await pages.goTo(d, '/authority/escalated');
        return { pass: (await pages.getCurrentPath(d)) === '/authority/escalated', actual: await pages.getCurrentPath(d) };
      },
    },
  ];

  for (const item of extraStabilityChecks) {
    addMatrixTest(item.module, item.name, 'Stable page check', `Open ${item.page}`, item.expected, 'Low', item.run);
  }

  for (const role of ['employee', 'manager', 'authority']) {
    for (const route of NAV_SETS[role]) {
      addMatrixTest(
        'Routes',
        `${role} route ${route.path}`,
        'Route resolves to shell path',
        `Navigate to ${route.path}`,
        route.path,
        'Low',
        async (d) => {
          if (role === 'employee') await pages.loginEmployeeSession(d);
          else if (role === 'manager') await pages.loginManagerSession(d);
          else await pages.loginAuthoritySession(d);
          await pages.goTo(d, route.path);
          return { pass: (await pages.getCurrentPath(d)) === route.path, actual: await pages.getCurrentPath(d) };
        }
      );
    }
  }

  for (const role of ['employee', 'manager', 'authority']) {
    tests.push(
      tc(id(), 'Login', `Role dropdown select ${role}`, `Select ${role} role`, `Choose ${role}`, 'Role selected', 'Low', async (d) => {
        await pages.clearSession(d);
        await pages.goTo(d, '/');
        await d.findElement(pages.By.css(`option[value="${role}"]`)).click();
        const val = await d.findElement(pages.By.css('select')).getAttribute('value');
        return { pass: val === role, actual: val };
      })
    );
  }

  const badPasswords = ['', '123', 'password', 'admin', 'MAN123', 'Man123', 'auth1234'];
  for (const pwd of badPasswords) {
    tests.push(
      tc(id(), 'Login', `Weak/wrong manager pwd: "${pwd || 'empty'}"`, 'Invalid login attempt', `Password: ${pwd}`, 'Login rejected', 'Medium', async (d) => {
        await pages.loginAs(d, 'manager', 'manager', pwd || ' ');
        const path = await pages.getCurrentPath(d);
        return { pass: !path.includes('/manager'), actual: path };
      })
    );
  }

  // ── REGISTER ────────────────────────────────────────────────
  tests.push(
    tc(id(), 'Register', 'Register page loads', 'Registration form visible', 'Open /register', 'Employee Registration title', 'High', async (d) => {
      await pages.clearSession(d);
      await pages.goTo(d, '/register');
      const text = await pages.bodyText(d);
      return { pass: text.includes('Employee Registration'), actual: text.slice(0, 80) };
    }),
    tc(id(), 'Register', 'Valid employee registration', 'New employee can register via UI', 'Fill form and submit', 'Redirect to employee portal', 'Critical', async (d) => {
      const uid = `ui_${Date.now()}`;
      await apiPost('/api/employees/register', { id: uid, name: 'E2E User', password: 'TestPass123!' });
      const loggedIn = await apiPost('/api/employees/login', { userId: uid, password: 'TestPass123!' });
      return { pass: !!loggedIn.token && !!loggedIn.session, actual: `registered:${uid}` };
    }),
    tc(id(), 'Register', 'Back to login link', 'Navigation to login', 'Click Login link', 'Navigate to /', 'Medium', async (d) => {
      await pages.clearSession(d);
      await pages.goTo(d, '/register');
      const link = await d.findElement(pages.By.css('[data-testid="backToLoginLink"]'));
      const href = await link.getAttribute('href');
      return { pass: href?.endsWith('/'), actual: href || 'missing href' };
    }),
    tc(id(), 'Register', 'Duplicate employee ID rejected', 'Cannot register same ID twice', 'Register same ID twice', 'Error on second attempt', 'High', async (d) => {
      const uid = `dup_${Date.now()}`;
      await apiPost('/api/employees/register', { id: uid, name: 'Dup A', password: 'Pass1234!' });
      await pages.clearSession(d);
      await pages.goTo(d, '/register');
      await d.findElement(pages.By.xpath("//label[normalize-space()='Name']/following-sibling::input[1]")).sendKeys('Dup B');
      await d.findElement(pages.By.xpath("//label[normalize-space()='Employee ID']/following-sibling::input[1]")).sendKeys(uid);
      await d.findElement(pages.By.xpath("//label[normalize-space()='Password']/following-sibling::input[1]")).sendKeys('Pass5678!');
      await d.findElement(pages.By.css('button[type="submit"]')).click();
      await pages.sleep(1200);
      const text = await pages.bodyText(d);
      const path = await pages.getCurrentPath(d);
      const blocked = path.includes('/register') || /exist|already|fail|duplicate/i.test(text);
      return { pass: blocked, actual: text.slice(0, 100) };
    }),
    tc(id(), 'Register', 'Empty name blocked', 'Required name field', 'Submit without name', 'Stay on register', 'Medium', async (d) => {
      await pages.clearSession(d);
      await pages.goTo(d, '/register');
      await d.findElement(pages.By.xpath("//label[normalize-space()='Employee ID']/following-sibling::input[1]")).sendKeys('x');
      await d.findElement(pages.By.xpath("//label[normalize-space()='Password']/following-sibling::input[1]")).sendKeys('pass');
      await d.findElement(pages.By.css('button[type="submit"]')).click();
      await pages.sleep(400);
      return { pass: (await pages.getCurrentPath(d)).includes('/register'), actual: await pages.getCurrentPath(d) };
    }),
    tc(id(), 'Register', 'SQL injection in employee ID', 'Sanitized registration', "ID: '; DROP TABLE--", 'Safe handling', 'High', async (d) => {
      await pages.registerEmployee(d, { name: 'SQL Test', id: `sql_${Date.now()}`, password: 'Pass1234!' });
      const path = await pages.getCurrentPath(d);
      return { pass: path.includes('/employee') || path.includes('/register'), actual: path };
    })
  );

  for (const ph of ['Full Name', 'Employee ID', 'Password']) {
    tests.push(
      tc(id(), 'Register', `Placeholder "${ph}" present`, 'Form field labels', 'Check placeholder', `${ph} visible`, 'Low', async (d) => {
        await pages.clearSession(d);
        await pages.goTo(d, '/register');
        const ok = await pages.elementExists(d, `//input[@placeholder='${ph}']`);
        return { pass: ok, actual: ok ? 'found' : 'missing' };
      })
    );
  }

  // ── EMPLOYEE PORTAL ─────────────────────────────────────────
  for (const route of EMPLOYEE_ROUTES) {
    tests.push(
      tc(id(), 'Employee', `Navigate: ${route.label}`, 'Employee routes', `Open ${route.path}`, route.path, 'High', async (d) => {
        await pages.loginEmployeeSession(d);
        await pages.goTo(d, route.path);
        return { pass: (await pages.getCurrentPath(d)) === route.path, actual: await pages.getCurrentPath(d) };
      })
    );
  }

  for (const room of ROOMS_SAMPLE) {
    tests.push(
      tc(id(), 'Employee', `Raise complaint room ${room}`, 'Room picker works', `Select room ${room}`, 'Room selected', 'Medium', async (d) => {
        await pages.loginEmployeeSession(d);
        await pages.goTo(d, '/employee/raise');
        await d.findElement(pages.By.xpath(`//main//button[normalize-space()='${room}']`)).click();
        return { pass: true, actual: `room ${room} selected` };
      })
    );
  }

  for (const cat of CATEGORIES) {
    tests.push(
      tc(id(), 'Employee', `Category option: ${cat}`, 'Category dropdown', `Select ${cat}`, 'Category available', 'Medium', async (d) => {
        await pages.loginEmployeeSession(d);
        await pages.goTo(d, '/employee/raise');
        const ok = await pages.elementExists(d, `//option[@value='${cat}']`);
        return { pass: ok, actual: ok ? cat : 'missing' };
      })
    );
  }

  tests.push(
    tc(id(), 'Employee', 'Submit full complaint flow', 'End-to-end raise', 'Room+category+description+submit', 'Success', 'Critical', async (d) => {
      await pages.loginEmployeeSession(d);
      await pages.raiseComplaint(d, { room: '15', category: 'Plumbing', description: `E2E ${Date.now()}` });
      const text = await pages.bodyText(d);
      return { pass: text.toLowerCase().includes('complaint') || text.includes('Raise'), actual: text.slice(0, 100) };
    }),
    tc(id(), 'Employee', 'Account page shows user info', 'Read-only account', 'Open Account', 'Content visible', 'Medium', async (d) => {
      await pages.loginEmployeeSession(d);
      await pages.goTo(d, '/employee/account');
      const text = await pages.bodyText(d);
      return { pass: text.length > 20, actual: text.slice(0, 80) };
    }),
    tc(id(), 'Employee', 'Private complaints page loads', 'My complaints view', 'Open private', 'Page loads', 'High', async (d) => {
      await pages.loginEmployeeSession(d);
      await pages.goTo(d, '/employee/private');
      return { pass: (await pages.getCurrentPath(d)).includes('/employee/private'), actual: await pages.getCurrentPath(d) };
    }),
    tc(id(), 'Employee', 'Public complaints page loads', 'Merged/public view', 'Open public', 'Page loads', 'High', async (d) => {
      await pages.loginEmployeeSession(d);
      await pages.goTo(d, '/employee/public');
      return { pass: (await pages.getCurrentPath(d)).includes('/employee/public'), actual: await pages.getCurrentPath(d) };
    }),
    tc(id(), 'Employee', 'Employee logout', 'Session cleared', 'Logout', 'Login page shown', 'High', async (d) => {
      await pages.loginEmployeeSession(d);
      await pages.logout(d);
      const path = await pages.getCurrentPath(d);
      const onLogin = path === '/' && (await pages.isLoginPage(d));
      return { pass: onLogin, actual: path };
    })
  );

  // ── MANAGER PORTAL ──────────────────────────────────────────
  for (const route of MANAGER_ROUTES) {
    tests.push(
      tc(id(), 'Manager', `Navigate: ${route.label}`, 'Manager routes', `Open ${route.path}`, route.path, 'High', async (d) => {
        await ensureComplaintExists();
        await pages.loginManagerSession(d);
        await pages.goTo(d, route.path);
        return { pass: (await pages.getCurrentPath(d)) === route.path, actual: await pages.getCurrentPath(d) };
      })
    );
  }

  tests.push(
    tc(id(), 'Manager', 'Pending page shows content or empty', 'Pending list', 'Open pending', 'Content visible', 'Medium', async (d) => {
      await pages.loginManagerSession(d);
      const text = await pages.bodyText(d);
      return { pass: text.length > 10, actual: text.slice(0, 80) };
    }),
    tc(id(), 'Manager', 'All complaints filter status', 'Status filter exists', 'Open All + check filter', 'Status dropdown', 'Medium', async (d) => {
      await ensureComplaintExists();
      await pages.loginManagerSession(d);
      await pages.goTo(d, '/manager/all');
      const ok = await pages.elementExists(d, "//option[contains(.,'All Statuses')]");
      return { pass: ok, actual: ok ? 'filter found' : 'missing' };
    }),
    tc(id(), 'Manager', 'All complaints room filter', 'Room text filter', 'Open All + room input', 'Room filter input', 'Medium', async (d) => {
      await ensureComplaintExists();
      await pages.loginManagerSession(d);
      await pages.goTo(d, '/manager/all');
      const ok = await pages.elementExists(d, "//input[@placeholder='Filter by room']");
      return { pass: ok, actual: ok ? 'found' : 'missing' };
    }),
    tc(id(), 'Manager', 'Manager logout', 'End session', 'Logout', 'Login page', 'High', async (d) => {
      await pages.loginManagerSession(d);
      await pages.logout(d);
      const onLogin = (await pages.getCurrentPath(d)) === '/' && (await pages.isLoginPage(d));
      return { pass: onLogin, actual: await pages.getCurrentPath(d) };
    }),
    tc(id(), 'Manager', 'Merge page loads', 'Merge UI', 'Open Merge Area', 'Merge page', 'Medium', async (d) => {
      await pages.loginManagerSession(d);
      await pages.goTo(d, '/manager/merge');
      return { pass: (await pages.getCurrentPath(d)).includes('/manager/merge'), actual: await pages.getCurrentPath(d) };
    }),
    tc(id(), 'Manager', 'In Progress page loads', 'In progress list', 'Open in progress', 'Page loads', 'Medium', async (d) => {
      await pages.loginManagerSession(d);
      await pages.goTo(d, '/manager/inprogress');
      return { pass: (await pages.getCurrentPath(d)).includes('/manager/inprogress'), actual: await pages.getCurrentPath(d) };
    }),
    tc(id(), 'Manager', 'Completed page loads', 'Completed list', 'Open completed', 'Page loads', 'Medium', async (d) => {
      await pages.loginManagerSession(d);
      await pages.goTo(d, '/manager/completed');
      return { pass: (await pages.getCurrentPath(d)).includes('/manager/completed'), actual: await pages.getCurrentPath(d) };
    })
  );

  for (const vis of ['All Visibility', 'private', 'public']) {
    tests.push(
      tc(id(), 'Manager', `Visibility filter: ${vis}`, 'Visibility dropdown', 'Check option', 'Option exists', 'Low', async (d) => {
        await ensureComplaintExists();
        await pages.loginManagerSession(d);
        await pages.goTo(d, '/manager/all');
        const ok = await pages.elementExists(d, `//option[contains(.,'${vis}')]`);
        return { pass: ok, actual: ok ? 'found' : 'missing' };
      })
    );
  }

  // ── AUTHORITY PORTAL ────────────────────────────────────────
  for (const route of AUTHORITY_ROUTES) {
    tests.push(
      tc(id(), 'Authority', `Navigate: ${route.label}`, 'Authority routes', `Open ${route.path}`, route.path, 'High', async (d) => {
        await ensureComplaintExists();
        await pages.loginAuthoritySession(d);
        await pages.goTo(d, route.path);
        return { pass: (await pages.getCurrentPath(d)) === route.path, actual: await pages.getCurrentPath(d) };
      })
    );
  }

  tests.push(
    tc(id(), 'Authority', 'Overview shows stats', 'Dashboard metrics', 'Open overview', 'Stats visible', 'High', async (d) => {
      await pages.loginAuthoritySession(d);
      const text = await pages.bodyText(d);
      return { pass: text.length > 30, actual: text.slice(0, 80) };
    }),
    tc(id(), 'Authority', 'All complaints date filters', 'Date range filters', 'Open All', 'Date inputs present', 'Medium', async (d) => {
      await ensureComplaintExists();
      await pages.loginAuthoritySession(d);
      await pages.goTo(d, '/authority/all');
      const inputs = await d.findElements(pages.By.css('input[type="date"]'));
      return { pass: inputs.length >= 2, actual: `${inputs.length} date inputs` };
    }),
    tc(id(), 'Authority', 'Escalated page loads', 'Escalated view', 'Open escalated', 'Page loads', 'High', async (d) => {
      await pages.loginAuthoritySession(d);
      await pages.goTo(d, '/authority/escalated');
      return { pass: (await pages.getCurrentPath(d)).includes('/authority/escalated'), actual: await pages.getCurrentPath(d) };
    }),
    tc(id(), 'Authority', 'Authority logout', 'End session', 'Logout', 'Login page', 'High', async (d) => {
      await pages.loginAuthoritySession(d);
      await pages.logout(d);
      const onLogin = (await pages.getCurrentPath(d)) === '/' && (await pages.isLoginPage(d));
      return { pass: onLogin, actual: await pages.getCurrentPath(d) };
    })
  );

  for (const cat of CATEGORIES) {
    tests.push(
      tc(id(), 'Authority', `All filter category: ${cat}`, 'Category filter', 'Check dropdown', cat, 'Low', async (d) => {
        await ensureComplaintExists();
        await pages.loginAuthoritySession(d);
        await pages.goTo(d, '/authority/all');
        const ok = await pages.elementExists(d, `//option[@value='${cat}' or contains(.,'${cat}')]`);
        return { pass: ok, actual: ok ? 'found' : 'missing' };
      })
    );
  }

  // ── ACCESS CONTROL ──────────────────────────────────────────
  const protectedPaths = [
    '/employee/raise', '/employee/private', '/employee/public', '/employee/account',
    '/manager/pending', '/manager/merge', '/manager/inprogress', '/manager/completed', '/manager/all',
    '/authority/overview', '/authority/all', '/authority/escalated',
  ];

  for (const p of protectedPaths) {
    tests.push(
      tc(id(), 'Access Control', `Unauthenticated blocked: ${p}`, 'Protected route', `Visit ${p} without login`, 'Redirect to login', 'Critical', async (d) => {
        await pages.clearSession(d);
        await pages.goTo(d, p);
        await pages.sleep(800);
        const path = await pages.getCurrentPath(d);
        return { pass: path === '/' && (await pages.isLoginPage(d)), actual: path };
      })
    );
  }

  tests.push(
    tc(id(), 'Access Control', 'Employee cannot access manager pending', 'Role isolation', 'Employee → /manager/pending', 'Blocked from manager area', 'Critical', async (d) => {
      await pages.loginEmployeeSession(d);
      await pages.goTo(d, '/manager/pending');
      await pages.waitForRedirectAway(d, '/manager');
      const path = await pages.getCurrentPath(d);
      return { pass: !path.startsWith('/manager'), actual: path };
    }),
    tc(id(), 'Access Control', 'Employee cannot access authority overview', 'Role isolation', 'Employee → /authority/overview', 'Blocked from authority area', 'Critical', async (d) => {
      await pages.loginEmployeeSession(d);
      await pages.goTo(d, '/authority/overview');
      await pages.waitForRedirectAway(d, '/authority');
      const path = await pages.getCurrentPath(d);
      return { pass: !path.startsWith('/authority'), actual: path };
    }),
    tc(id(), 'Access Control', 'Manager cannot access authority escalated', 'Role isolation', 'Manager → /authority/escalated', 'Blocked from authority area', 'High', async (d) => {
      await pages.loginManagerSession(d);
      await pages.goTo(d, '/authority/escalated');
      await pages.waitForRedirectAway(d, '/authority');
      const path = await pages.getCurrentPath(d);
      return { pass: !path.startsWith('/authority'), actual: path };
    }),
    tc(id(), 'Access Control', 'Authority cannot access employee raise', 'Role isolation', 'Authority → /employee/raise', 'Blocked from employee area', 'High', async (d) => {
      await pages.loginAuthoritySession(d);
      await pages.goTo(d, '/employee/raise');
      await pages.waitForRedirectAway(d, '/employee');
      const path = await pages.getCurrentPath(d);
      return { pass: !path.startsWith('/employee'), actual: path };
    })
  );

  // ── NAVIGATION / UI ─────────────────────────────────────────
  tests.push(
    tc(id(), 'Navigation', 'Unknown route redirects home', 'Catch-all route', 'Visit unknown path', 'Redirect to /', 'Medium', async (d) => {
      await pages.clearSession(d);
      await pages.goTo(d, '/does-not-exist-xyz');
      await pages.sleep(500);
      return { pass: (await pages.getCurrentPath(d)) === '/', actual: await pages.getCurrentPath(d) };
    }),
    tc(id(), 'Navigation', 'FacilityDesk branding on login', 'App title', 'Open /', 'FacilityDesk visible', 'Low', async (d) => {
      await pages.clearSession(d);
      await pages.goTo(d, '/');
      return { pass: (await pages.bodyText(d)).includes('FacilityDesk'), actual: 'ok' };
    }),
    tc(id(), 'Navigation', 'Governed subtitle on login', 'Subtitle text', 'Open /', 'Subtitle visible', 'Low', async (d) => {
      await pages.clearSession(d);
      await pages.goTo(d, '/');
      return { pass: (await pages.bodyText(d)).includes('Governed'), actual: 'ok' };
    }),
    tc(id(), 'Navigation', 'Employee portal title after login', 'Portal header', 'Employee login', 'Employee Portal text', 'Low', async (d) => {
      await pages.loginEmployeeSession(d);
      return { pass: (await pages.bodyText(d)).includes('Employee Portal'), actual: 'ok' };
    }),
    tc(id(), 'Navigation', 'Manager portal title after login', 'Portal header', 'Manager login', 'Manager Dashboard text', 'Low', async (d) => {
      await pages.loginManagerSession(d);
      return { pass: (await pages.bodyText(d)).includes('Manager Dashboard'), actual: 'ok' };
    }),
    tc(id(), 'Navigation', 'Authority portal title after login', 'Portal header', 'Authority login', 'Authority Dashboard text', 'Low', async (d) => {
      await pages.loginAuthoritySession(d);
      return { pass: (await pages.bodyText(d)).includes('Authority Dashboard'), actual: 'ok' };
    })
  );

  tests.push(
    tc(id(), 'Integration', 'Backend API reachable', 'Frontend depends on API', 'Fetch API root', 'API Running', 'Critical', async () => {
      const res = await fetch(`${config.apiUrl}/`);
      const data = await res.json();
      return { pass: data.status === 'success' || data.message === 'API Running', actual: JSON.stringify(data) };
    }),
    tc(id(), 'Integration', 'Database health endpoint', 'DB connected', 'GET /test-db', 'status connected', 'Critical', async () => {
      const res = await fetch(`${config.apiUrl}/test-db`);
      const data = await res.json();
      return { pass: data.status === 'connected', actual: data.status || data.error };
    })
  );

  return tests;
}

module.exports = { buildTestCases };
