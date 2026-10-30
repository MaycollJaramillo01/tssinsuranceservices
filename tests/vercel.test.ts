import test from 'node:test';
import assert from 'node:assert/strict';
import inquiry from '../api/inquiry';
import config from '../api/inquiry-config';
import { issueToken } from '../server/inquiry';

test('Vercel config keeps the public form disabled without credentials and rejects POST', async () => {
  const original = process.env.RESEND_API_KEY;
  process.env.RESEND_API_KEY = '';
  try {
    const response = await config.fetch(new Request('https://tss.test/api/inquiry-config'));
    assert.deepEqual(await response.json(), { enabled: false });
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal((await config.fetch(new Request('https://tss.test/api/inquiry-config', { method: 'POST' }))).status, 405);
    assert.equal((await inquiry.fetch(new Request('https://tss.test/api/inquiry', { method: 'POST' }))).status, 503);
  } finally {
    if (original === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = original;
  }
});

test('Vercel inquiry uses the platform IP for rate limiting and ignores a spoofed Cloudflare header', async () => {
  const fixture = { RESEND_API_KEY: 'test-only', MAIL_FROM: 'Test <fixture@example.com>', UPSTASH_REDIS_REST_URL: 'https://test.upstash.io', UPSTASH_REDIS_REST_TOKEN: 'test-only', RATE_LIMIT_SALT: 'test-only-secret-with-at-least-32-characters' };
  const saved = Object.fromEntries(Object.keys(fixture).map(key => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  Object.assign(process.env, fixture);
  const keys: string[] = [];
  globalThis.fetch = (async (url, options) => {
    if (String(url) === fixture.UPSTASH_REDIS_REST_URL) {
      keys.push(JSON.parse(String(options?.body))[3]);
      return Response.json({ result: 1 });
    }
    assert.equal(String(url), 'https://api.resend.com/emails');
    return Response.json({ id: 'local-test-acceptance' });
  }) as typeof fetch;
  try {
    const token = await issueToken(fixture.RATE_LIMIT_SALT, Date.now() - 4000);
    for (const [platformIp, spoofedIp] of [['192.0.2.1', 'spoof-a'], ['192.0.2.1', 'spoof-b'], ['192.0.2.2', 'spoof-b']]) {
      const request = new Request('https://tss.test/api/inquiry', {
        method: 'POST', headers: { Origin: 'https://tss.test', 'Content-Type': 'application/json', 'x-vercel-forwarded-for': platformIp, 'CF-Connecting-IP': spoofedIp },
        body: JSON.stringify({ firstName: 'Alex', email: 'alex@example.com', service: 'insurance', message: 'Local fixture inquiry.', companyWebsite: '', token }),
      });
      assert.equal((await inquiry.fetch(request)).status, 200);
    }
    assert.equal(keys[0], keys[1]);
    assert.notEqual(keys[1], keys[2]);
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of Object.keys(fixture)) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
});
