import { defineConfig } from 'astro/config';
import { loadEnvironment } from './scripts/environment.mjs';

const env = loadEnvironment(process.env.NODE_ENV || 'production');
const vercelHost = env.VERCEL_PROJECT_PRODUCTION_URL || env.VERCEL_URL;
const site = env.SITE_URL || (vercelHost ? `https://${vercelHost}` : 'https://tss-insurance-services-review.cozyowlet1030.chatgpt.site');
if (new URL(site).protocol !== 'https:') throw new Error('SITE_URL must use HTTPS.');

export default defineConfig({
  site,
  output: 'static',
  outDir: './build/client',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'never' },
  vite: { build: { assetsInlineLimit: 0 }, define: { 'import.meta.env.PUBLIC_SITE_URL': JSON.stringify(site) } },
});
