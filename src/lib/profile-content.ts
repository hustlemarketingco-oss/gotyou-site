// Data-driven copy for business profiles and the city/category "explore" pages.
// Everything here is derived from the listing's own facts (hours, location, categories, accessibility,
// rating breakdown, nearby listings), so every page gets specific, accurate, non-boilerplate text —
// the kind of plain factual sentences search engines and AI answer engines quote.
import type { CollectionEntry } from 'astro:content';
import { DAYS, formatPhone } from './business';

export type Biz = CollectionEntry<'businesses'>['data'];

// ── slugs ────────────────────────────────────────────────────────────────
export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
// City slugs carry the state ("provo-ut") so same-named cities in different states never collide.
export const citySlug = (city: string, state: string) => slugify(`${city} ${state}`);
export const cityPath = (city: string, state: string) => `/explore/${citySlug(city, state)}/`;
export const categoryPath = (city: string, state: string, category: string) => `/explore/${citySlug(city, state)}/${slugify(category)}/`;
/** Minimum listings for a city+category page to exist (avoids thin pages). */
export const MIN_CATEGORY_LISTINGS = 3;

// Plural, human labels for category buckets ("Best ___ in Provo").
export const CATEGORY_PLURAL: Record<string, string> = {
  Restaurant: 'Restaurants',
  'Fast Food': 'Fast Food Spots',
  Pizza: 'Pizza Places',
  'Coffee & Cafe': 'Coffee Shops & Cafes',
  'Desserts & Bakery': 'Dessert Shops & Bakeries',
  'Mexican & Latin': 'Mexican & Latin Restaurants',
  'Asian & Pacific': 'Asian & Pacific Restaurants',
  'Bars & Pubs': 'Bars & Pubs',
  Shopping: 'Shops',
  'Health & Beauty': 'Health & Beauty Spots',
  'Fun & Activities': 'Things to Do',
  'Local Business': 'Local Businesses',
};
/** Buckets that aren't food or drink; restaurant-only topics and copy skip them. */
export const NON_FOOD = new Set(['Shopping', 'Health & Beauty', 'Fun & Activities', 'Local Business']);
export const isFood = (b: { category: string }) => !NON_FOOD.has(b.category);
export const plural = (c: string) => CATEGORY_PLURAL[c] ?? `${c} Spots`;

// ── helpers ──────────────────────────────────────────────────────────────
// Lower-case a category for use mid-sentence, keeping proper adjectives ("Indian restaurant" →
// "Indian restaurant", "Fast food restaurant" → "fast food restaurant").
const PROPER = /^(american|asian|pacific|indian|south|thai|mexican|chinese|japanese|korean|vietnamese|italian|peruvian|hawaiian|latin|mediterranean|greek|salvadoran|venezuelan|filipino|caribbean|native|new|argentinian|southwestern|southern|pan-asian|polynesian|zealand|haitian|cajun|tex-mex|middle|eastern|french|german|brazilian|cuban|colombian|nepalese|mongolian|us\)?|\(us\))$/i;
export const lc = (s: string) =>
  s
    .split(' ')
    .map((w) => (PROPER.test(w.replace(/[(),]/g, '')) ? w.replace(/^./, (c) => c.toUpperCase()) : w.toLowerCase()))
    .join(' ');
const article = (w: string) => (/^[aeiou]/i.test(w) ? 'an' : 'a');
const list = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
export const popularity = (b: Biz) => (b.googleRating ?? 0) * Math.log10((b.googleReviewCount ?? 0) + 10);

function miles(a: Biz, b: Biz) {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return Infinity;
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
export const fmtMiles = (m: number) => (m < 0.1 ? 'next door' : `${m < 1 ? m.toFixed(1) : m.toFixed(1)} mi`);

type Range = [number, number]; // minutes from midnight; close may exceed 1440 (past midnight)
function parseDay(v?: string): Range[] | null {
  if (!v) return null;
  if (v === 'Closed') return [];
  if (/open 24 hours/i.test(v)) return [[0, 1440]];
  const t = (s: string) => {
    const m = s.trim().match(/^(\d{1,2}):(\d{2}) (AM|PM)$/);
    return m ? ((Number(m[1]) % 12) + (m[3] === 'PM' ? 12 : 0)) * 60 + Number(m[2]) : null;
  };
  return v
    .split(',')
    .map((r) => r.split(' - ').map(t))
    .filter((r): r is [number, number] => r.length === 2 && r[0] !== null && r[1] !== null)
    .map(([o, c]) => [o, c <= o ? c + 1440 : c] as Range);
}
const clock = (mins: number) => {
  const m = mins % 1440;
  const h = Math.floor(m / 60);
  if (m === 0) return 'midnight';
  if (m === 720) return 'noon';
  return `${h % 12 || 12}${m % 60 ? `:${String(m % 60).padStart(2, '0')}` : ''} ${h < 12 ? 'AM' : 'PM'}`;
};

export function hoursFacts(b: Biz) {
  const days = DAYS.map(([key, name]) => ({ key, name, ranges: parseDay(b.hours?.[key]) }));
  const known = days.filter((d) => d.ranges !== null);
  const open = known.filter((d) => d.ranges!.length);
  const closed = known.filter((d) => d.ranges!.length === 0).map((d) => d.name);
  const opens = open.map((d) => Math.min(...d.ranges!.map((r) => r[0])));
  const closes = open.map((d) => Math.max(...d.ranges!.map((r) => r[1])));
  const always = open.length === 7 && open.every((d) => d.ranges!.some((r) => r[0] === 0 && r[1] >= 1440));
  // Days with a midday break (e.g. 11 AM–2 PM, 5 PM–midnight).
  const split = open.filter((d) => d.ranges!.length > 1).length;
  return {
    days,
    known: known.length > 0,
    openDays: open.length,
    closed,
    always,
    split,
    earliest: opens.length ? Math.min(...opens) : null,
    latest: closes.length ? Math.max(...closes) : null,
    sameEveryDay: open.length > 1 && open.every((d) => b.hours?.[d.key] === b.hours?.[open[0].key]),
    hoursFor: (key: string) => b.hours?.[key as keyof NonNullable<Biz['hours']>],
    clock,
  };
}

export function nearbyFacts(b: Biz, all: Biz[]) {
  const others = all.filter((x) => x.slug !== b.slug && !x.temporarilyClosed);
  const sameCat = others
    .filter((x) => x.category === b.category)
    .map((x) => ({ biz: x, mi: miles(b, x) }))
    .filter((x) => x.mi < 50)
    .sort((x, y) => x.mi - y.mi);
  const anyNear = others
    .map((x) => ({ biz: x, mi: miles(b, x) }))
    .filter((x) => x.mi < 50)
    .sort((x, y) => x.mi - y.mi);
  const cityPeers = others.filter((x) => x.city === b.city && x.state === b.state && x.category === b.category);
  const rankInCity =
    [...cityPeers, b].sort((x, y) => popularity(y) - popularity(x)).findIndex((x) => x.slug === b.slug) + 1;
  return {
    sameCategory: sameCat.slice(0, 4),
    within1mi: sameCat.filter((x) => x.mi <= 1).length,
    closestAny: anyNear.slice(0, 4),
    cityPeers: cityPeers.length,
    rankInCity,
  };
}

// ── profile copy ─────────────────────────────────────────────────────────
export function profileContent(b: Biz, all: Biz[]) {
  const kind = lc(b.googleCategory ?? b.category);
  const h = hoursFacts(b);
  const n = nearbyFacts(b, all);
  const phone = formatPhone(b.phone);
  const where = [b.address, b.city, b.state].filter(Boolean).join(', ');
  const total = b.googleReviewCount ?? 0;
  const top = b.ratingBreakdown ? (b.ratingBreakdown['5'] ?? 0) + (b.ratingBreakdown['4'] ?? 0) : 0;
  const pctTop = b.ratingBreakdown && total ? Math.round((top / Object.values(b.ratingBreakdown).reduce((a, c) => a + c, 0)) * 100) : null;
  const access = b.amenities.filter((a) => /wheelchair/i.test(a)).map((a) => a.replace(/^Wheelchair accessible /i, '').toLowerCase());

  // One-sentence summary: the "answer" an AI assistant or featured snippet would quote.
  const days = h.openDays === 7 ? 'daily' : `${h.openDays} days a week`;
  const hoursBit = h.always
    ? 'open 24 hours a day'
    : h.split && h.latest !== null
      ? `open ${days} for lunch and dinner with an afternoon break, until ${clock(h.latest)}`
      : h.sameEveryDay && h.earliest !== null && h.latest !== null
      ? `open ${h.openDays === 7 ? 'daily' : `${h.openDays} days a week`} from ${clock(h.earliest)} to ${clock(h.latest)}`
      : h.openDays
        ? `open ${h.openDays} days a week`
        : '';
  const ratingBit = b.googleRating ? `rated ${b.googleRating.toFixed(1)} out of 5 from ${total.toLocaleString()} Google reviews` : '';
  const summary = `${b.name} is ${article(kind)} ${kind} at ${where}${hoursBit ? `, ${hoursBit}` : ''}${ratingBit ? `, and ${ratingBit}` : ''}.`;

  const paras: string[] = [];
  if (b.description) paras.push(b.description.endsWith('.') ? b.description : `${b.description}.`);

  const cats = b.secondaryCategories.filter((c) => c.toLowerCase() !== kind.toLowerCase()).map((c) => lc(c));
  const p1: string[] = [];
  p1.push(`${b.name} is listed as ${article(kind)} ${kind}${cats.length ? `, and is also categorized under ${list(cats.slice(0, 3))}` : ''}.`);
  if (b.priceRange) p1.push(`Prices are typically ${b.priceRange}.`);
  if (n.cityPeers > 0 && n.rankInCity && b.googleRating)
    p1.push(
      n.rankInCity <= 3
        ? `It ranks #${n.rankInCity} of ${n.cityPeers + 1} ${lc(plural(b.category))} in ${b.city} by rating and review volume on GOTYOU.`
        : `It’s one of ${n.cityPeers + 1} ${lc(plural(b.category))} in ${b.city} listed on GOTYOU.`,
    );
  paras.push(p1.join(' '));

  const p2: string[] = [];
  if (h.always) p2.push(`${b.name} is open 24 hours, seven days a week.`);
  else if (h.known) {
    if (h.split)
      p2.push(`It serves lunch, closes for a break in the afternoon, and reopens for dinner${h.latest !== null ? ` until ${clock(h.latest)}` : ''} — check today’s hours below before heading over.`);
    else if (h.sameEveryDay && h.earliest !== null && h.latest !== null)
      p2.push(`It keeps the same hours every day it’s open: ${clock(h.earliest)} to ${clock(h.latest)}.`);
    else if (h.earliest !== null && h.latest !== null)
      p2.push(`Hours vary by day — the earliest opening is ${clock(h.earliest)} and the latest close is ${clock(h.latest)}.`);
    if (h.closed.length) p2.push(`It’s closed on ${list(h.closed)}.`);
    else if (h.openDays === 7) p2.push('It’s open seven days a week.');
    if (h.latest !== null && h.latest >= 22 * 60) p2.push(`Open until ${clock(h.latest)} on its latest night, it’s a good late-night option.`);
    if (h.earliest !== null && h.earliest <= 7 * 60) p2.push(`Doors open as early as ${clock(h.earliest)}.`);
  }
  if (access.length) p2.push(`Accessibility: wheelchair-accessible ${list(access)}.`);
  if (p2.length) paras.push(p2.join(' '));

  const p3: string[] = [];
  if (b.googleRating && total) {
    p3.push(`On Google, ${b.name} has a ${b.googleRating.toFixed(1)}-star average across ${total.toLocaleString()} reviews`);
    p3[0] += pctTop !== null ? `, with ${pctTop}% of reviewers giving it 4 or 5 stars.` : '.';
  }
  if (n.within1mi > 0)
    p3.push(`There ${n.within1mi === 1 ? 'is 1 other' : `are ${n.within1mi} other`} ${n.within1mi === 1 ? lc(b.category) + ' spot' : lc(plural(b.category))} within a mile.`);
  if (p3.length) paras.push(p3.join(' '));

  // Questions people (and AI assistants) actually ask about a local business.
  const faqs: { q: string; a: string }[] = [];
  if (h.known) {
    const sun = h.hoursFor('sun');
    if (sun) faqs.push({ q: `Is ${b.name} open on Sunday?`, a: sun === 'Closed' ? `No, ${b.name} is closed on Sundays.` : `Yes. On Sundays ${b.name} is open ${sun.replace(' - ', ' to ')}.` });
    const sat = h.hoursFor('sat');
    if (sat && sat !== 'Closed') faqs.push({ q: `What time does ${b.name} close on Saturday?`, a: `On Saturdays ${b.name} is open ${sat.replace(' - ', ' to ')}.` });
    if (h.latest !== null && !h.always) faqs.push({ q: `How late is ${b.name} open?`, a: `${b.name}’s latest closing time is ${clock(h.latest)}${h.sameEveryDay ? ' every day it’s open' : ''}.` });
  }
  faqs.push({ q: `Where is ${b.name} located?`, a: `${b.name} is at ${[b.address, b.city, [b.state, b.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ')}.` });
  if (phone) faqs.push({ q: `What is ${b.name}’s phone number?`, a: `You can call ${b.name} at ${phone}.` });
  if (access.length) faqs.push({ q: `Is ${b.name} wheelchair accessible?`, a: `Yes — it has a wheelchair-accessible ${list(access)}.` });
  if (b.googleRating && total) faqs.push({ q: `Is ${b.name} any good?`, a: `${b.name} averages ${b.googleRating.toFixed(1)} stars from ${total.toLocaleString()} Google reviews${pctTop !== null ? `; ${pctTop}% of reviewers rate it 4 or 5 stars` : ''}.` });
  if (n.sameCategory.length)
    faqs.push({
      q: `What are some ${lc(plural(b.category))} near ${b.name}?`,
      a: `Nearby ${lc(plural(b.category))} include ${list(n.sameCategory.slice(0, 3).map((x) => `${x.biz.name} (${fmtMiles(x.mi)})`))}.`,
    });

  const quick = [
    { label: 'Category', value: b.googleCategory ?? b.category },
    { label: 'Address', value: where },
    ...(phone ? [{ label: 'Phone', value: phone }] : []),
    ...(hoursBit ? [{ label: 'Hours', value: hoursBit.replace(/^open /, '') }] : []),
    ...(b.googleRating ? [{ label: 'Rating', value: `${b.googleRating.toFixed(1)}★ (${total.toLocaleString()} reviews)` }] : []),
    ...(b.priceRange ? [{ label: 'Price', value: b.priceRange }] : []),
  ];

  return { summary, paras, faqs, quick, nearby: n, hours: h };
}
