import type { APIRoute } from 'astro';
import { indexable } from '../data/site';
export const GET: APIRoute = ({ site }) => new Response(indexable ? `User-agent: *\nAllow: /\nSitemap: ${new URL('/sitemap.xml', site)}\n` : 'User-agent: *\nDisallow: /\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
