import { inquiryConfig, receiveInquiry, type Env } from './inquiry';

export type Asset = { body: string; type: string; etag: string };
export type Assets = Record<string, Asset>;
const legacy: Record<string, string> = { 'insurance-2': 'insurance', 'income-tax-2': 'income-tax', 'contact-8': 'contact' };
export const routes = ['insurance', 'income-tax', 'dmv-services', 'real-estate-mortgage', 'business-formation', 'our-team', 'contact'];
export function canonicalPath(path: string): string | undefined {
  const slug = path.replace(/\/+$/g, '').replace(/^\/+/, '');
  if (legacy[slug]) return `/${legacy[slug]}/`;
  if (routes.includes(slug) && path !== `/${slug}/`) return `/${slug}/`;
  if (path === '/index.html') return '/';
  for (const route of routes) if (path === `/${route}/index.html`) return `/${route}/`;
  return undefined;
}
export function createHandler(assets: Assets, indexable = false) {
  return {
    async fetch(request: Request, env: Env = {}): Promise<Response> {
      const url = new URL(request.url);
      if (url.pathname === '/api/inquiry-config') return request.method === 'GET' ? inquiryConfig(env) : new Response(null, { status: 405, headers: { Allow: 'GET' } });
      if (url.pathname === '/api/inquiry') return receiveInquiry(request, env);
      if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
      const redirect = canonicalPath(url.pathname);
      if (redirect) { url.pathname = redirect; return Response.redirect(url.href, 301); }
      const file = url.pathname.endsWith('/') ? `${url.pathname}index.html` : url.pathname;
      const asset = assets[file] || assets['/404.html'];
      if (!asset) return new Response('Not found', { status: 404 });
      const status = assets[file] ? 200 : 404;
      const headers: Record<string, string> = {
        'Content-Type': asset.type, 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        'Cache-Control': /\.(avif|webp|woff2|js|css)$/.test(file) ? 'public, max-age=86400' : 'public, max-age=0, must-revalidate',
        'ETag': asset.etag,
        'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'",
      };
      if (!indexable || status === 404) headers['X-Robots-Tag'] = 'noindex, nofollow';
      if (status === 200 && request.headers.get('If-None-Match') === asset.etag) return new Response(null, { status: 304, headers });
      if (request.method === 'HEAD') return new Response(null, { status, headers });
      const binary = atob(asset.body);
      const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
      return new Response(bytes, { status, headers });
    },
  };
}
