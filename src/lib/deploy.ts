// True on Cloudflare preview deploys (any branch but `main`, e.g. redesign-gotyou-site.*.workers.dev).
// Previews must stay out of search indexes so they never compete with gotyou.co. The value is
// computed in astro.config.mjs from WORKERS_CI_BRANCH and inlined at build time.
declare const __IS_PREVIEW__: boolean;
export const IS_PREVIEW: boolean = __IS_PREVIEW__;
