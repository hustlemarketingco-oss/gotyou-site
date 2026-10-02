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
// WordPress job board: /jobs/<slug>/ -> /careers/<slug>
const jobRedirects = Object.fromEntries(
  readdirSync('./src/content/jobs')
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''))
    .map((slug) => [`/jobs/${slug}`, `/careers/${slug}`]),
);

// https://astro.build/config
export default defineConfig({
  site: 'https://gotyou.co',
  redirects: {
    '/about-us': '/about',
    '/faq-mobile': '/faq',
    '/earn-today': '/where-gotyou-works',
    '/pricing-2025': '/pricing',
    '/1123drops': '/1123',
    '/1123-2': '/1123',
    '/summer25': '/updates',
    '/summer-update': '/updates',
    '/roi-user': '/earnings-calculator',
    '/checkin1': '/download',
    '/download/app_images': '/download',
    '/stgdeals': '/businesses',
    '/job-openings': '/careers',
    '/jobs/content-media-operations-team': '/careers/content-media-operations-team',
    ...blogRedirects,
    ...jobRedirects,
  },
  output: 'static', // Directory + marketing pages are static. The /api/claim route opts into
                     // server rendering individually via `export const prerender = false`.
  adapter: cloudflare({
    imageService: 'compile',
    platformProxy: { enabled: true },
  }),
});
