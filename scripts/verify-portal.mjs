#!/usr/bin/env node
// Safe post-deployment smoke test for one existing, active workshop hostname.
// Sends no customer access links, credentials, or session cookies.
import { randomBytes } from 'node:crypto';

const provided = process.argv[2] ?? '';
const input = provided.includes('://') ? provided : `https://${provided}`;
let parsed;
try {
  parsed = new URL(input);
  if (
    parsed.protocol !== 'https:' ||
    parsed.username || parsed.password || parsed.port ||
    parsed.pathname !== '/' || parsed.search || parsed.hash ||
    !/^[a-z0-9-]+(?:\\.[a-z0-9-]+){2,}$/.test(parsed.hostname)
  ) throw new Error('Invalid hostname');
} catch {
  console.error('Usage: npm run verify:portal -- <active-workshop>.customer.cubixgear.tech');
  console.error('Pass only a hostname; never pass a customer access URL or token.');
  process.exit(2);
}

const base = parsed.origin;
const suffix = parsed.hostname.slice(parsed.hostname.indexOf('.') + 1);
const randomHost = `portal-probe-${randomBytes(6).toString('hex')}.${suffix}`;

async function check(host, route, expectedStatus, label) {
  const response = await fetch(`https://${host}${route}`, {
    redirect: 'manual',
    cache: 'no-store',
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  });
  if (response.status !== expectedStatus) {
    throw new Error(`${label}: expected HTTP ${expectedStatus}, got ${response.status}`);
  }
  if (label === 'Public branding') {
    const data = await response.json();
    if (!data || typeof data.name !== 'string' || !data.name.trim()) {
      throw new Error('Public branding: response has no workshop name');
    }
  }
  console.log(`PASS ${label} (HTTP ${response.status})`);
}

try {
  console.log(`Checking customer website at ${base} ...`);
  await check(parsed.hostname, '/api/portal/branding', 200, 'Public branding');
  await check(parsed.hostname, '/api/portal/session', 401, 'Unauthenticated session');
  await check(randomHost, '/api/portal/branding', 404, 'Unknown workshop denied');
  console.log('Smoke checks passed. Verify an actual test-customer access link manually before enabling links.');
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  console.error('Check wildcard DNS/HTTPS, Vercel deployment, and matching Django/Next.js portal environment values.');
  process.exitCode = 1;
}
