# Load Test

Baseline load test for FacilityDesk.

## What it does

- Runs 100 virtual users for 60 seconds.
- Sends requests continuously against the target base URL.
- Captures requests per second, response times, status codes, and endpoint breakdowns.
- Generates an Excel workbook in `load test/reports/`.

## Files

- `run-load-test.js` - executes the load test and writes JSON metrics.
- `generate-report.js` - converts the JSON metrics into an Excel workbook.
- `reports/Load_Test_Report.xlsx` - generated workbook.
- `reports/Load_Test_Report.json` - raw metrics.

## Run

```powershell
cd "load test"
node run-load-test.js
node generate-report.js
```

## Defaults

- Users: `100`
- Duration: `60` seconds
- Think time: `100ms`
- Target URL: `https://viji-pdd-production-7c95.up.railway.app`

## Override

```powershell
$env:LOAD_BASE_URL='https://viji-pdd-production-7c95.up.railway.app'
$env:LOAD_USERS='100'
$env:LOAD_DURATION_SECONDS='60'
node run-load-test.js
node generate-report.js
```
