import type { APIRoute } from 'astro';

// Approximate visitor location from Cloudflare's IP lookup (request.cf), so the directory can open on the
// visitor's area without a browser permission prompt. City-level accuracy only; nothing is stored or logged.
export const prerender = false;

export const GET: APIRoute = ({ request }) => {
  const cf = (request as Request & { cf?: Record<string, unknown> }).cf ?? {};
  const num = (v: unknown) => (v == null || v === '' || isNaN(Number(v)) ? null : Number(v));
  const body = {
    lat: num(cf.latitude),
    lng: num(cf.longitude),
    city: typeof cf.city === 'string' ? cf.city : null,
    region: typeof cf.regionCode === 'string' ? cf.regionCode : null,
    country: typeof cf.country === 'string' ? cf.country : null,
  };
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
  });
};
