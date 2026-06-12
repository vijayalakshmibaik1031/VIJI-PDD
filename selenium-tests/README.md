# FacilityDesk Selenium E2E Tests

End-to-end browser tests for the FacilityDesk web-admin (React + Vite).

## Prerequisites

1. **Backend** running: `cd backend && node server.js` → `http://localhost:5000`
2. **Frontend** running: `cd web-admin && npm run dev` → `http://localhost:5173`
3. **Google Chrome** installed (Selenium 4 auto-downloads ChromeDriver)

## Install

```bash
cd selenium-tests
npm install
```

## Run tests

```bash
# Visible Chrome window
npm test

# Headless (CI / faster)
npm run test:headless
```

Or from project root:

```bash
cd selenium-tests && set HEADLESS=true&& node run-tests.js
```

## Output

- Terminal: live pass/fail per test case
- Excel report: `selenium-tests/reports/E2E_Test_Report_FacilityDesk_<timestamp>.xlsx`
  - **Summary** — Test Suite, Total, Passed, Failed, Pass Rate %, Duration, Start/End Time
  - **Passed Tests** — No., Category, Test Name, Time (sec), Status
  - **Failed Tests** — No., Category, Test Name, Error, Status, Timestamp
  - **Execution Log** — Timestamp, Level, Message
  - **Test Details** — No., Category, Test Name, Status, Error Details

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `http://localhost:5173` | Frontend URL |
| `API_URL` | `http://localhost:5000` | Backend URL |
| `HEADLESS` | `false` | Set `true` for headless Chrome |
| `TIMEOUT_MS` | `12000` | Element wait timeout |

## Test coverage (104 cases)

- Login / Register / role validation
- Employee, Manager, Authority portal navigation
- Complaint raise flow, filters, access control
- SQLi / XSS UI probes
- API integration health checks
