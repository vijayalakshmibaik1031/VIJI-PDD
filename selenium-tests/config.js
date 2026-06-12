module.exports = {
  baseUrl: process.env.BASE_URL || 'http://localhost:5173',
  apiUrl: process.env.API_URL || 'http://localhost:5000',
  headless: process.env.HEADLESS === 'true',
  timeoutMs: Number(process.env.TIMEOUT_MS || 12000),
  credentials: {
    manager: { userId: 'manager', password: 'man123' },
    authority: { userId: 'auth', password: 'auth123' },
  },
};
