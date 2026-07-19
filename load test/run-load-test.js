const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.LOAD_BASE_URL || 'https://viji-pdd-production-7c95.up.railway.app';
const VIRTUAL_USERS = Number(process.env.LOAD_USERS || 100);
const DURATION_SECONDS = Number(process.env.LOAD_DURATION_SECONDS || 60);
const THINK_TIME_MS = Number(process.env.LOAD_THINK_TIME_MS || 100);
const REQUEST_TIMEOUT_MS = Number(process.env.LOAD_REQUEST_TIMEOUT_MS || 15000);

const ENDPOINTS = [
  { method: 'GET', path: '/' },
  { method: 'GET', path: '/swagger.json' },
  { method: 'GET', path: '/v3/api-docs' },
  { method: 'GET', path: '/api-docs' },
  { method: 'GET', path: '/openapi.json' },
  { method: 'GET', path: '/swagger-ui' },
];

const REPORT_DIR = path.join(__dirname, 'reports');
const JSON_REPORT = path.join(REPORT_DIR, 'Load_Test_Report.json');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

async function requestEndpoint(endpoint) {
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error('timeout')), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${BASE_URL}${endpoint.path}`, {
      method: endpoint.method,
      signal: controller.signal,
      headers: {
        'User-Agent': 'FacilityDesk-LoadTest/1.0',
        'Accept': 'application/json,text/html,*/*',
      },
    });
    const body = await response.text().catch(() => '');
    return {
      ok: response.ok,
      status: response.status,
      contentType: response.headers.get('content-type') || '',
      responseTimeMs: Date.now() - started,
      bodySize: body.length,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      contentType: '',
      responseTimeMs: Date.now() - started,
      error: error.message,
      bodySize: 0,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function worker(userIndex, endTime, metrics, timeline, endpointStats) {
  let iteration = 0;
  while (Date.now() < endTime) {
    const endpoint = ENDPOINTS[(userIndex + iteration) % ENDPOINTS.length];
    const requestStarted = Date.now();
    const result = await requestEndpoint(endpoint);
    const completedAt = Date.now();

    metrics.totalRequests += 1;
    metrics.latencies.push(result.responseTimeMs);
    metrics.statusCounts[result.status] = (metrics.statusCounts[result.status] || 0) + 1;
    if (result.ok) {
      metrics.successes += 1;
    } else {
      metrics.failures += 1;
    }

    const secondBucket = Math.min(DURATION_SECONDS - 1, Math.max(0, Math.floor((completedAt - metrics.startedAt) / 1000)));
    timeline[secondBucket].requests += 1;
    timeline[secondBucket].latencies.push(result.responseTimeMs);

    const endpointKey = `${endpoint.method} ${endpoint.path}`;
    const endpointEntry = endpointStats[endpointKey] || {
      endpoint: endpointKey,
      requests: 0,
      successes: 0,
      failures: 0,
      latencies: [],
    };
    endpointEntry.requests += 1;
    endpointEntry.latencies.push(result.responseTimeMs);
    if (result.ok) endpointEntry.successes += 1;
    else endpointEntry.failures += 1;
    endpointStats[endpointKey] = endpointEntry;

    metrics.requestLog.push({
      user: userIndex + 1,
      endpoint: endpointKey,
      status: result.status,
      responseTimeMs: result.responseTimeMs,
      startedAt: new Date(requestStarted).toISOString(),
      completedAt: new Date(completedAt).toISOString(),
    });

    iteration += 1;
    await sleep(THINK_TIME_MS);
  }
}

async function main() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const startedAt = Date.now();
  const endTime = startedAt + (DURATION_SECONDS * 1000);
  const timeline = Array.from({ length: DURATION_SECONDS }, () => ({ requests: 0, latencies: [] }));
  const endpointStats = {};
  const metrics = {
    startedAt,
    endedAt: 0,
    totalRequests: 0,
    successes: 0,
    failures: 0,
    latencies: [],
    statusCounts: {},
    requestLog: [],
  };

  console.log(`Starting load test: ${VIRTUAL_USERS} virtual users for ${DURATION_SECONDS}s against ${BASE_URL}`);
  await Promise.all(Array.from({ length: VIRTUAL_USERS }, (_, index) => worker(index, endTime, metrics, timeline, endpointStats)));
  metrics.endedAt = Date.now();

  const durationSec = (metrics.endedAt - metrics.startedAt) / 1000;
  const latencyMin = metrics.latencies.length ? Math.min(...metrics.latencies) : 0;
  const latencyMax = metrics.latencies.length ? Math.max(...metrics.latencies) : 0;
  const latencyAvg = metrics.latencies.length ? metrics.latencies.reduce((sum, value) => sum + value, 0) / metrics.latencies.length : 0;
  const latencyP95 = percentile(metrics.latencies, 95);
  const rps = metrics.totalRequests / DURATION_SECONDS;
  const peakRps = Math.max(...timeline.map((bucket) => bucket.requests), 0);

  const result = {
    meta: {
      baseUrl: BASE_URL,
      virtualUsers: VIRTUAL_USERS,
      durationSeconds: DURATION_SECONDS,
      thinkTimeMs: THINK_TIME_MS,
      requestTimeoutMs: REQUEST_TIMEOUT_MS,
      startedAt: new Date(metrics.startedAt).toISOString(),
      endedAt: new Date(metrics.endedAt).toISOString(),
      actualDurationSec: Number(durationSec.toFixed(2)),
      totalRequests: metrics.totalRequests,
      requestsPerSecond: Number(rps.toFixed(2)),
      peakRequestsPerSecond: peakRps,
      successes: metrics.successes,
      failures: metrics.failures,
      successRate: metrics.totalRequests ? Number(((metrics.successes / metrics.totalRequests) * 100).toFixed(2)) : 0,
      latencyMinMs: latencyMin,
      latencyAvgMs: Number(latencyAvg.toFixed(2)),
      latencyP95Ms: latencyP95,
      latencyMaxMs: latencyMax,
    },
    timeline,
    endpointStats: Object.values(endpointStats),
    statusCounts: metrics.statusCounts,
    requestLog: metrics.requestLog,
  };

  fs.writeFileSync(JSON_REPORT, JSON.stringify(result, null, 2), 'utf8');
  console.log(`Load test completed. Requests: ${metrics.totalRequests}, RPS: ${rps.toFixed(2)}, Avg: ${latencyAvg.toFixed(2)}ms`);
  console.log(`JSON report written to ${JSON_REPORT}`);
}

main().catch((error) => {
  console.error('Load test failed:', error);
  process.exit(1);
});
