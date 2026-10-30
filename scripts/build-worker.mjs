import { readdir, readFile, mkdir, writeFile, copyFile } from 'node:fs/promises';
import { resolve, relative, extname } from 'node:path';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';

const root = resolve('build/client');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2' };
const assets = {};
async function collect(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = resolve(dir, entry.name);
    if (entry.isDirectory()) await collect(file);
    else {
      const content = await readFile(file);
      assets[`/${relative(root, file).replaceAll('\\', '/')}`] = { body: content.toString('base64'), type: types[extname(file)] || 'application/octet-stream', etag: `"${createHash('sha256').update(content).digest('hex').slice(0, 24)}"` };
    }
  }
}
await collect(root);
await mkdir('build/generated', { recursive: true });
await mkdir('dist/server', { recursive: true });
await mkdir('dist/.openai', { recursive: true });
await writeFile('build/generated/assets.json', JSON.stringify(assets));
const home = await readFile('build/client/index.html', 'utf8');
const indexable = !home.includes('noindex, nofollow');
await writeFile('build/generated/worker.ts', `import { createHandler } from '../../server/app';\nimport assets from './assets.json';\nexport default createHandler(assets, ${indexable});\n`);
await build({ entryPoints: ['build/generated/worker.ts'], outfile: 'dist/server/index.js', bundle: true, platform: 'browser', format: 'esm', target: 'es2022', minify: true });
await copyFile('.openai/hosting.json', 'dist/.openai/hosting.json');
console.log(`Worker ESM built with ${Object.keys(assets).length} embedded local assets. Form activation is runtime-only.`);
