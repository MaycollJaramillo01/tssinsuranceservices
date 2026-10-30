import { receiveInquiry, type Env } from '../server/inquiry';

export default {
  fetch(request: Request): Promise<Response> {
    const headers = new Headers(request.headers);
    // Vercel overwrites its forwarding headers. Ignore a caller-supplied Cloudflare IP.
    const ip = headers.get('x-vercel-forwarded-for') || headers.get('x-forwarded-for') || 'unavailable';
    headers.set('CF-Connecting-IP', ip.split(',')[0].trim());
    return receiveInquiry(new Request(request, { headers }), process.env as Env);
  },
};
