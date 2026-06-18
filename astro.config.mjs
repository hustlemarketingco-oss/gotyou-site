// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://gotyou.co',
  output: 'static', // Directory + marketing pages are static. The /api/claim route opts into
                     // server rendering individually via `export const prerender = false`.
  adapter: cloudflare({
    imageService: 'compile',
    platformProxy: { enabled: true },
  }),
});
