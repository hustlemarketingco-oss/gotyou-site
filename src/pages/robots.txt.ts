import type { APIRoute } from 'astro';
import { IS_PREVIEW } from '../lib/deploy';

// Search and AI crawlers are explicitly welcome on production; previews are closed to everyone.
const AI_BOTS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Bingbot', 'CCBot'];

export const GET: APIRoute = ({ site }) => {
  const body = IS_PREVIEW
    ? 'User-agent: *\nDisallow: /\n'
    : [
        'User-agent: *',
        'Allow: /',
        'Disallow: /api/',
        'Disallow: /businesses/*/claim/',
        '',
        ...AI_BOTS.flatMap((bot) => [`User-agent: ${bot}`, 'Allow: /', '']),
        `Sitemap: ${new URL('/sitemap-index.xml', site).href}`,
        `# AI-readable site guide: ${new URL('/llms.txt', site).href}`,
        '',
      ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
