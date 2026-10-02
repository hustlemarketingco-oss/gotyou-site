// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import { readdirSync } from 'node:fs';

// Old WordPress URLs on gotyou.co -> new site. Blog posts lived at the root (/slug/).
const blogRedirects = Object.fromEntries(
  readdirSync('./src/content/blog')
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''))
    .map((slug) => [`/${slug}`, `/blog/${slug}`]),
);

// https://astro.build/config
export default defineConfig({
  site: 'https://gotyou.co',
  redirects: {
    '/about-us': '/about',
    '/faq-mobile': '/faq',
    '/earn-today': '/where-gotyou-works',
    '/pricing-2025': '/pricing',
    ...blogRedirects,
  },
  output: 'static', // Directory + marketing pages are static. The /api/claim route opts into
                     // server rendering individually via `export const prerender = false`.
  adapter: cloudflare({
    imageService: 'compile',
    platformProxy: { enabled: true },
  }),
});
