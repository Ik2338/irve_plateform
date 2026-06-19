import assert from 'node:assert/strict';

const baseUrl = process.env.NEXT_INTEGRATION_BASE_URL || 'http://127.0.0.1:3012';
const routes = [
  '/',
  '/installers/search',
  '/messages',
  '/dashboard',
  '/auth/login',
  '/requests/new',
];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/`);
      if (response.ok) return;
    } catch {
      await wait(500);
    }
  }
  throw new Error(`Next server did not start on ${baseUrl}`);
}

async function measureRoute(path) {
  const samples = [];
  let bytes = 0;
  let status = 0;

  for (let index = 0; index < 3; index += 1) {
    const start = performance.now();
    const response = await fetch(`${baseUrl}${path}`);
    const body = await response.text();
    const duration = performance.now() - start;

    status = response.status;
    bytes = body.length;
    samples.push(Math.round(duration));
    assert.equal(response.status, 200, `${path} should return 200`);
    assert.match(body, /<html/i, `${path} should return an HTML page`);
  }

  const avg = Math.round(samples.reduce((total, value) => total + value, 0) / samples.length);
  return { path, status, avgMs: avg, minMs: Math.min(...samples), maxMs: Math.max(...samples), bytes, samples };
}

await waitForServer();
const results = [];
for (const route of routes) {
  results.push(await measureRoute(route));
}

for (const result of results) {
  console.log(
    `NEXT_HTTP path=${result.path} status=${result.status} avgMs=${result.avgMs} minMs=${result.minMs} maxMs=${result.maxMs} bytes=${result.bytes} samples=${result.samples.join(',')}`,
  );
}
