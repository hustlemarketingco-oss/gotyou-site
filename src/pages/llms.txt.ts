// /llms.txt — a plain-language map of the site for AI assistants (llmstxt.org convention).
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { activeBusinesses, byCity } from '../lib/explore';
import { cityPath } from '../lib/profile-content';
import { topicsForCity, modifiersFor, topicPath } from '../lib/topics';
import { BRAND } from '../lib/constants';

export const GET: APIRoute = async ({ site }) => {
  const u = (p: string) => new URL(p, site).href;
  const all = await activeBusinesses();
  const cities = byCity(all);
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()).slice(0, 15);

  const lines = [
    '# GOTYOU',
    '',
    `> ${BRAND.promise} GOTYOU is a free app that points people to local spots and pays them real cash for showing up (check-ins, feedback, referrals), plus a daily 11:23 AM "Daily Drop" offer from a nearby business. For merchants, GOTYOU is Verified Physical Commerce: offers redeemed with an in-store tap, so businesses pay for real visits and own the customer relationship.`,
    '',
    `The site also hosts a public directory of ${all.length} local businesses with hours, addresses, phone numbers, accessibility details and ratings. Each business page has a one-sentence summary, a Q&A section, schema.org LocalBusiness data, and a JSON version at /businesses/<slug>.json.`,
    '',
    '## Key pages',
    `- [How GOTYOU works](${u('/#how-it-works')}): the consumer app — Explore, check in, earn`,
    `- [The 11:23 Daily Drop](${u('/1123/')}): one local deal every day at 11:23 AM`,
    `- [For business](${u('/solution/')}): Verified Physical Commerce for merchants`,
    `- [Pricing](${u('/pricing/')}): $1 trial; 50/100/200 guaranteed new customers a month for $175/$300/$500`,
    `- [Where GOTYOU works](${u('/where-gotyou-works/')}): live cities and zones`,
    `- [FAQ](${u('/faq/')})`,
    `- [About](${u('/about/')})`,
    '',
    '## Local business directory',
    `- [All businesses](${u('/businesses/')})`,
    `- [Explore by city](${u('/explore/')})`,
    ...cities.flatMap((c) => [
      `- [${c.city}, ${c.state}](${u(cityPath(c.city))}): ${c.items.length} businesses`,
      ...topicsForCity(c.items).flatMap((t) => [
        `  - [${t.topic.kind === 'feature' ? t.topic.label : `Best ${t.topic.label}`} in ${c.city}](${u(topicPath(c.city, t.topic))}): ${t.items.length}`,
        ...modifiersFor(t.topic, t.items).map((m) => `    - [${m.mod.title(t.topic, c.city)}](${u(topicPath(c.city, t.topic, m.mod.slug))})`),
      ]),
    ]),
    '',
    '## Recent articles',
    ...posts.map((p) => `- [${p.data.title}](${u(`/blog/${p.id}/`)})`),
    '',
    '## Optional',
    `- [Sitemap](${u('/sitemap-index.xml')})`,
    `- [Contact](${u('/contact/')}): ${BRAND.supportEmail}`,
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
