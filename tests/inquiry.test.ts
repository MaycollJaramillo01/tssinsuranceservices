import test from 'node:test';
import assert from 'node:assert/strict';
import { inquiryConfig, receiveInquiry, issueToken, validToken, type Env } from '../server/inquiry';
import { validateInquiry } from '../src/lib/validation';
import { canonicalPath, createHandler } from '../server/app';
import { readFile } from 'node:fs/promises';

const now = 1800000000000;
const env: Env = { RESEND_API_KEY: 'test-only', MAIL_FROM: 'TSS <inquiries@example.com>', UPSTASH_REDIS_REST_URL: 'https://test.upstash.io', UPSTASH_REDIS_REST_TOKEN: 'test-only', RATE_LIMIT_SALT: 'test-only-secret-with-at-least-32-characters' };
const payload = { firstName: 'Alex', lastName: '', email: 'alex@example.com', phone: '', service: 'insurance', message: 'I have a question about auto insurance.', companyWebsite: '' };
const request = (body: unknown, headers: Record<string,string> = {}) => new Request('https://tss.test/api/inquiry', { method: 'POST', headers: { Origin: 'https://tss.test', 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1', ...headers }, body: JSON.stringify(body) });
const json = (data: unknown, status = 200) => Response.json(data, { status });
const validInput = async () => ({ ...payload, token: await issueToken(env.RATE_LIMIT_SALT!, now - 4000) });

test('public form is disabled with any missing integration, without leaking secrets', async () => {
  for (const key of Object.keys(env)) {
    const partial = { ...env }; delete partial[key as keyof Env];
    const config = await inquiryConfig(partial, now);
    assert.deepEqual(await config.json(), { enabled: false });
    assert.equal((await receiveInquiry(request(payload), partial)).status, 503);
  }
});
test('shared validation checks required fields, service allowlist, email and message limits', () => {
  assert.equal(validateInquiry(payload).valid, true);
  for (const value of [{ ...payload, email: 'wrong' }, { ...payload, firstName: '' }, { ...payload, service: 'invented' }, { ...payload, message: 'x'.repeat(2001) }, { ...payload, phone: '<script>' }]) assert.equal(validateInquiry(value).valid, false);
});
test('signed timing tokens reject early, expired and modified submissions', async () => {
  const token = await issueToken(env.RATE_LIMIT_SALT!, now);
  assert.equal(await validToken(token, env.RATE_LIMIT_SALT!, now + 2000), false);
  assert.equal(await validToken(token, env.RATE_LIMIT_SALT!, now + 4000), true);
  assert.equal(await validToken(token, env.RATE_LIMIT_SALT!, now + 1800001), false);
  assert.equal(await validToken(token.slice(0, -2) + 'zz', env.RATE_LIMIT_SALT!, now + 4000), false);
});
test('cross-origin requests cannot trigger rate-limit or email provider calls', async () => {
  const response = await receiveInquiry(request(await validInput(), { Origin: 'https://other.test' }), env, { fetcher: async () => { throw new Error('Should never run'); } });
  assert.equal(response.status, 403);
});
test('honeypot and invalid input never reach the email provider', async () => {
  for (const input of [{ ...await validInput(), companyWebsite: 'spam' }, { ...await validInput(), email: '' }]) {
    let calls = 0;
    const response = await receiveInquiry(request(input), env, { now: () => now, fetcher: async () => { calls++; return json({ result: 1 }); } });
    assert.ok([403,422].includes(response.status)); assert.equal(calls, 1);
  }
});
test('server only returns success after a provider acceptance ID', async () => {
  for (const [provider, expected] of [[json({ id: 'mock-acceptance-id' }), 200], [json({}, 200), 502], [json({ error: 'failure' }, 500), 502]] as const) {
    let count = 0;
    const response = await receiveInquiry(request(await validInput()), env, { now: () => now, fetcher: async (url, init) => {
      count++;
      if (String(url).includes('upstash')) return json({ result: 1 });
      assert.equal(url, 'https://api.resend.com/emails');
      const body = JSON.parse(String(init?.body));
      assert.deepEqual(body.to, ['tssinsuranceservices@gmail.com']);
      assert.equal(body.reply_to, payload.email);
      assert.ok(new Headers(init?.headers).has('Idempotency-Key'));
      return provider;
    } });
    assert.equal(count, 2);
    assert.equal(response.status, expected);
    const result = await response.json();
    assert.equal(result.ok, response.status === 200);
  }
});
test('shared rate limit rejects the sixth request and fails closed on Redis errors', async () => {
  for (const [rate, expected] of [[json({ result: 6 }), 429], [json({ error: 'offline' }, 500), 502]] as const) {
    let count = 0;
    const response = await receiveInquiry(request(await validInput()), env, { now: () => now, fetcher: async () => { count++; return rate; } });
    assert.equal(response.status, expected); assert.equal(count, 1);
    if (expected === 429) assert.equal(response.headers.get('Retry-After'), '3600');
  }
});
test('oversized body is rejected, even without trusting a Content-Length header', async () => {
  const response = await receiveInquiry(request({ ...await validInput(), message: 'x'.repeat(17000) }), env, { now: () => now, fetcher: async () => json({ result: 1 }) });
  assert.equal(response.status, 413);
});
test('all legacy routes and slash variants redirect directly to final canonical paths', async () => {
  const handler = createHandler({});
  for (const [old, final] of [['insurance-2','insurance'], ['income-tax-2','income-tax'], ['contact-8','contact']]) {
    for (const suffix of ['', '/']) {
      const response = await handler.fetch(new Request(`https://tss.test/${old}${suffix}?service=insurance`));
      assert.equal(response.status, 301); assert.equal(response.headers.get('Location'), `https://tss.test/${final}/?service=insurance`);
      assert.equal(canonicalPath(`/${final}/`), undefined);
    }
  }
});
test('compiled site has exactly eight canonical sitemap entries and one H1 on each page', async () => {
  const paths = ['index.html','insurance/index.html','income-tax/index.html','dmv-services/index.html','real-estate-mortgage/index.html','business-formation/index.html','our-team/index.html','contact/index.html'];
  for (const path of paths) {
    const html = await readFile(`build/client/${path}`, 'utf8');
    assert.equal((html.match(/<h1\b/g) || []).length, 1, path);
    assert.ok(!html.includes('href="#"'), path);
    assert.ok(html.includes('noindex, nofollow'), path);
    assert.ok(!html.includes('Garden Grover'), path);
  }
  const sitemap = await readFile('build/client/sitemap.xml', 'utf8');
  assert.equal((sitemap.match(/<loc>/g)||[]).length, 8);
});
