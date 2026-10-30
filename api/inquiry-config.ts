import { inquiryConfig, type Env } from '../server/inquiry';

export default {
  fetch(request: Request): Promise<Response> | Response {
    if (request.method !== 'GET') return new Response(null, { status: 405, headers: { Allow: 'GET' } });
    return inquiryConfig(process.env as Env);
  },
};
