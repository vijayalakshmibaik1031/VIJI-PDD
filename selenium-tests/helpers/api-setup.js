const config = require('../config');

async function apiPost(path, body, token) {
  const res = await fetch(`${config.apiUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `${path} failed (${res.status})`);
  return data;
}

async function registerAndLoginEmployee() {
  const id = `e2e_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
  const name = 'E2E Test Employee';
  const password = 'TestPass123!';
  await apiPost('/api/employees/register', { id, name, password });
  const data = await apiPost('/api/employees/login', { userId: id, password });
  return { id, name, password, token: data.token, session: data.session };
}

async function loginManagerViaApi() {
  const { userId, password } = config.credentials.manager;
  const data = await apiPost('/api/managers/login', { userId, password });
  return { token: data.token, session: data.session };
}

async function loginAuthorityViaApi() {
  const { userId, password } = config.credentials.authority;
  const data = await apiPost('/api/authorities/login', { userId, password });
  return { token: data.token, session: data.session };
}

async function createComplaint(token, session) {
  const id = `cmp_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
  await apiPost(
    '/api/complaints',
    {
      id,
      employeeId: session.userId,
      employeeName: session.name,
      roomId: '11',
      category: 'Electrical',
      description: 'E2E seeded complaint for filter tests',
    },
    token
  );
  return id;
}

let seededComplaint = false;

async function ensureComplaintExists() {
  if (seededComplaint) return;
  const creds = await registerAndLoginEmployee();
  await createComplaint(creds.token, creds.session);
  seededComplaint = true;
}

async function seedBrowserSession(driver, token, session) {
  await driver.get(config.baseUrl);
  await driver.executeScript(
    `localStorage.setItem('fd_token', arguments[0]);
     localStorage.setItem('fd_session', arguments[1]);`,
    token,
    JSON.stringify(session)
  );
}

module.exports = {
  apiPost,
  registerAndLoginEmployee,
  loginManagerViaApi,
  loginAuthorityViaApi,
  createComplaint,
  ensureComplaintExists,
  seedBrowserSession,
};
