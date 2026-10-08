// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
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

// Cloudflare Workers Builds sets WORKERS_CI_BRANCH; any branch other than main is a preview deploy.
// Read it here (Node) and inline it, since pages prerender in the workerd runtime without build env vars.
const branch = process.env.WORKERS_CI_BRANCH;
const isPreview = Boolean(branch && branch !== 'main');

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
  integrations: [
    sitemap({
      // Claim forms are utility pages, not content.
      filter: (page) => !/\/claim\/?$/.test(page) && !page.includes('/mockups/'),
    }),
  ],
  // Inline page CSS into the HTML: removes render-blocking stylesheet requests (pages' CSS is small).
  build: { inlineStylesheets: 'always' },
  vite: {
    define: { __IS_PREVIEW__: JSON.stringify(isPreview) },
  },
  output: 'static', // Directory + marketing pages are static. The /api/claim route opts into
                     // server rendering individually via `export const prerender = false`.
  adapter: cloudflare({
    imageService: 'compile',
    platformProxy: { enabled: true },
  }),
});
