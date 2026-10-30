import { validateInquiry, failureMessage, successMessage } from '../src/lib/validation';
import { serviceOptions } from '../src/data/services';

export interface Env {
  RESEND_API_KEY?: string; MAIL_FROM?: string;
  UPSTASH_REDIS_REST_URL?: string; UPSTASH_REDIS_REST_TOKEN?: string;
  RATE_LIMIT_SALT?: string;
}
type Dependencies = { fetcher?: typeof fetch; now?: () => number };
const encoder = new TextEncoder();
const json = (value: unknown, status = 200, extra: Record<string, string> = {}) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store', ...extra } });
export function formEnabled(env: Env): boolean {
  return !!(env.RESEND_API_KEY && env.MAIL_FROM && !/[\r\n]/.test(env.MAIL_FROM) && env.UPSTASH_REDIS_REST_TOKEN && env.RATE_LIMIT_SALT && env.RATE_LIMIT_SALT.length >= 32 && /^https:\/\/[^/]+\.upstash\.io\/?$/.test(env.UPSTASH_REDIS_REST_URL || ''));
}
async function key(secret: string) { return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']); }
async function signature(value: string, secret: string): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', await key(secret), encoder.encode(value)));
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}
export async function issueToken(secret: string, now = Date.now()): Promise<string> {
  const value = `${now}.${crypto.randomUUID()}`;
  return `${value}.${await signature(value, secret)}`;
}
export async function validToken(token: unknown, secret: string, now = Date.now()): Promise<boolean> {
  if (typeof token !== 'string' || !/^\d{13}\.[\da-f-]{36}\.[\da-f]{64}$/.test(token)) return false;
  const [stamp, nonce, mac] = token.split('.');
  const age = now - Number(stamp);
  if (age < 3000 || age > 30 * 60 * 1000) return false;
  const bytes = new Uint8Array(mac.match(/../g)!.map(v => parseInt(v, 16)));
  return crypto.subtle.verify('HMAC', await key(secret), bytes, encoder.encode(`${stamp}.${nonce}`));
}
export async function inquiryConfig(env: Env, now = Date.now()): Promise<Response> {
  return formEnabled(env) ? json({ enabled: true, token: await issueToken(env.RATE_LIMIT_SALT!, now) }) : json({ enabled: false });
}

// One atomic, shared counter per anonymized IP. TTL ensures no persistent IP history.
const rateScript = 'local n=redis.call("INCR",KEYS[1]); if n==1 then redis.call("EXPIRE",KEYS[1],3600) end; return n';
export async function receiveInquiry(request: Request, env: Env, dependencies: Dependencies = {}): Promise<Response> {
  if (!formEnabled(env)) return json({ ok: false, message: failureMessage }, 503);
  if (request.method !== 'POST') return json({ ok: false }, 405, { Allow: 'POST' });
  if (request.headers.get('Origin') !== new URL(request.url).origin) return json({ ok: false, message: failureMessage }, 403);
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return json({ ok: false, message: failureMessage }, 415);
  if (Number(request.headers.get('Content-Length')) > 16000) return json({ ok: false, message: failureMessage }, 413);
  const fetcher = dependencies.fetcher || fetch;
  const now = (dependencies.now || Date.now)();
  try {
    const ip = request.headers.get('CF-Connecting-IP') || 'unavailable';
    const ipHash = await signature(ip, env.RATE_LIMIT_SALT!);
    const rate = await fetcher(env.UPSTASH_REDIS_REST_URL!, {
      method: 'POST', headers: { Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['EVAL', rateScript, '1', `tss:inquiry:${ipHash}`]), signal: AbortSignal.timeout(5000),
    });
    if (!rate.ok) throw new Error('Rate limiter unavailable');
    const limit = await rate.json() as { result?: number; error?: string };
    if (limit.error || typeof limit.result !== 'number') throw new Error('Invalid rate response');
    if (limit.result > 5) return json({ ok: false, message: failureMessage }, 429, { 'Retry-After': '3600' });

    // Bound streamed input as well as Content-Length; reject before retaining a large body.
    const reader = request.body?.getReader();
    if (!reader) return json({ ok: false, message: failureMessage }, 400);
    let size = 0;
    const chunks: Uint8Array[] = [];
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16000) { await reader.cancel(); return json({ ok: false, message: failureMessage }, 413); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    let input: Record<string, unknown>;
    try { input = JSON.parse(new TextDecoder().decode(bytes)); }
    catch { return json({ ok: false, message: failureMessage }, 400); }
    if (!input || typeof input !== 'object' || Array.isArray(input)) return json({ ok: false, message: failureMessage }, 400);
    if (input.companyWebsite || !await validToken(input.token, env.RATE_LIMIT_SALT!, now)) return json({ ok: false, message: failureMessage }, 403);
    const { valid, errors, data } = validateInquiry(input);
    if (!valid) return json({ ok: false, message: failureMessage, errors }, 422);
    const service = serviceOptions.find(s => s.value === data.service)!.label;
    const text = [`Service: ${service}`, `First name: ${data.firstName}`, `Last name: ${data.lastName || '(not provided)'}`, `Email: ${data.email}`, `Phone: ${data.phone || '(not provided)'}`, '', data.message].join('\n');
    const idempotencyKey = await signature(`${input.token}:${JSON.stringify(data)}`, env.RATE_LIMIT_SALT!);
    const delivery = await fetcher('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ from: env.MAIL_FROM, to: ['tssinsuranceservices@gmail.com'], reply_to: data.email, subject: `TSS inquiry: ${service}`, text }), signal: AbortSignal.timeout(12000),
    });
    if (!delivery.ok) throw new Error('Email provider rejected the request');
    const result = await delivery.json() as { id?: string };
    if (!result.id) throw new Error('Email provider did not confirm receipt');
    return json({ ok: true, message: successMessage });
  } catch {
    // Do not log inquiry bodies, credentials or provider responses.
    return json({ ok: false, message: failureMessage }, 502);
  }
}
