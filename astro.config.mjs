import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV || 'production', process.cwd(), '');
const site = env.SITE_URL || 'https://tss-insurance-services-review.cozyowlet1030.chatgpt.site';
if (new URL(site).protocol !== 'https:') throw new Error('SITE_URL must use HTTPS.');

export default defineConfig({
  site,
  output: 'static',
  outDir: './build/client',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'never' },
  vite: { build: { assetsInlineLimit: 0 }, define: { 'import.meta.env.PUBLIC_SITE_URL': JSON.stringify(site) } },
});
