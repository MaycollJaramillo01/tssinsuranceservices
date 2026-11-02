import { next } from '@vercel/functions';

const MAINTENANCE_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>TSS Insurance Services — Scheduled maintenance</title>
<meta name="robots" content="noindex, nofollow" />
<meta name="theme-color" content="#4B5D2A" />
<link rel="preload" as="font" type="font/woff2" href="/fonts/manrope-latin.woff2" crossorigin />
<link rel="preload" as="font" type="font/woff2" href="/fonts/source-sans-3-latin.woff2" crossorigin />
<link rel="stylesheet" href="/maintenance.css" />
</head>
<body>
<main class="card">
<div class="rule"></div>
<div class="inner">
<span class="wordmark">TSS <span class="rest">Insurance Services</span></span>
<p class="eyebrow">Scheduled maintenance</p>
<h1>We&rsquo;ll be right back.</h1>
<p>Our website is being updated. For insurance, income tax, DMV or business services, our team is ready to help you by phone or email.</p>
<div class="actions">
<a class="button" href="tel:+17145340070">Call 714-534-0070</a>
<a class="button secondary" href="mailto:tssinsuranceservices@gmail.com">Email our team</a>
</div>
<p class="note">Monday&ndash;Friday 10:30 AM&ndash;7 PM &middot; Saturday 10:30 AM&ndash;3 PM. Thank you for your patience.</p>
</div>
</main>
</body>
</html>`;

// ponytail: maintenance is ON by default; set MAINTENANCE_MODE=false in Vercel to bring the site back.
export default function middleware(): Response {
  const flag = (process.env.MAINTENANCE_MODE ?? '').trim().toLowerCase();

  if (flag === 'false' || flag === '0' || flag === 'off') {
    return next();
  }

  return new Response(MAINTENANCE_HTML, {
    status: 503,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store, no-cache, must-revalidate, max-age=0',
      'retry-after': '3600',
      'x-maintenance': 'on',
    },
  });
}
