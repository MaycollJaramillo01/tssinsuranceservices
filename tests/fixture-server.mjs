// Local UI fixture only. Never included in the deployment archive.
// All external fetches are intercepted; no email is sent and no Redis is used.
import http from 'node:http';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const worker = (await import(pathToFileURL(resolve('dist/server/index.js')).href)).default;
const env = { RESEND_API_KEY: 'local-fixture', MAIL_FROM: 'Test <fixture@example.com>', UPSTASH_REDIS_REST_URL: 'https://fixture.upstash.io', UPSTASH_REDIS_REST_TOKEN: 'local-fixture', RATE_LIMIT_SALT: 'local-test-fixture-secret-longer-than-32-characters' };
let attempts = 0;
globalThis.fetch = async url => {
  if (String(url).includes('upstash.io')) return Response.json({ result: 1 });
  if (String(url) === 'https://api.resend.com/emails') {
    attempts++;
    return attempts === 1 ? Response.json({ error: 'Local test failure' }, { status: 503 }) : Response.json({ id: 'local-fixture-acceptance' });
  }
  throw new Error('External calls are disabled in the local fixture');
};
const server = http.createServer(async (incoming, outgoing) => {
  const headers = new Headers();
  for (const [name, value] of Object.entries(incoming.headers)) if (value) headers.set(name, String(value));
  headers.set('CF-Connecting-IP', incoming.socket.remoteAddress || 'local');
  const request = new Request(`http://127.0.0.1:4322${incoming.url}`, { method: incoming.method, headers, ...(['GET','HEAD'].includes(incoming.method) ? {} : { body: incoming, duplex: 'half' }) });
  const response = await worker.fetch(request, env);
  outgoing.writeHead(response.status, Object.fromEntries(response.headers));
  outgoing.end(Buffer.from(await response.arrayBuffer()));
});
server.listen(4322, '127.0.0.1', () => console.log('LOCAL TEST FIXTURE ONLY: http://127.0.0.1:4322/ — no external requests'));
