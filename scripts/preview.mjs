import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { loadEnvironment } from './environment.mjs';
const env = loadEnvironment();
const worker = (await import(pathToFileURL(resolve('dist/server/index.js')).href)).default;
const server = http.createServer(async (incoming, outgoing) => {
  try {
    const headers = new Headers();
    for (const [name, value] of Object.entries(incoming.headers)) if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
    // Overwrite the header from the actual socket; never trust client-provided IP headers.
    headers.set('CF-Connecting-IP', incoming.socket.remoteAddress || 'local');
    const origin = `http://${incoming.headers.host || '127.0.0.1:4321'}`;
    const request = new Request(new URL(incoming.url || '/', origin), { method: incoming.method, headers, ...(['GET', 'HEAD'].includes(incoming.method || 'GET') ? {} : { body: incoming, duplex: 'half' }) });
    const response = await worker.fetch(request, env, {});
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch { outgoing.writeHead(500); outgoing.end('Server error'); }
});
server.listen(Number(process.env.PORT || 4321), '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${process.env.PORT || 4321}/`));
