// "Topics" for programmatic landing pages, Yelp-style: /explore/<city>/<topic>/ and
// /explore/<city>/<topic>/<modifier>/ ("Pizza Deals in Provo", "Late-Night Sushi in Provo").
// Every page is a filter over real listing data and only exists with at least MIN_LISTINGS matches,
// so each one has a distinct, useful list rather than a thin doorway page.
import { MIN_CATEGORY_LISTINGS, citySlug, hoursFacts, isFood, popularity, slugify, type Biz } from './profile-content';

export const MIN_LISTINGS = MIN_CATEGORY_LISTINGS;

const cats = (b: Biz) => [b.googleCategory ?? '', ...b.secondaryCategories].join(' | ').toLowerCase();

export type TopicKind = 'cuisine' | 'category' | 'feature';
export interface Topic {
  slug: string;
  kind: TopicKind;
  /** Page heading noun, plural: "Sushi Restaurants" */
  label: string;
  /** Mid-sentence noun: "sushi", "late-night food" */
  short: string;
  /** schema.org servesCuisine value, for cuisines */
  cuisine?: string;
  match: (b: Biz) => boolean;
  /** Per-listing highlight line on the page */
  note?: (b: Biz) => string | undefined;
}

// ── cuisines (matched on Google categories, plus the name for a few obvious ones) ──
const C = (label: string, short: string, slug: string, re: RegExp, cuisine: string, byName?: RegExp): Topic => ({
  slug,
  kind: 'cuisine',
  label,
  short,
  cuisine,
  match: (b) => isFood(b) && (re.test(cats(b)) || (!!byName && byName.test(b.name))),
});
export const CUISINES: Topic[] = [
  C('Pizza Places', 'pizza', 'pizza', /pizza/, 'Pizza', /pizz/i),
  C('Burger Joints', 'burgers', 'burgers', /hamburger|burger/, 'Burgers', /burger|brgr/i),
  C('Sushi Restaurants', 'sushi', 'sushi', /sushi|poke/, 'Sushi', /sushi/i),
  C('Mexican Restaurants', 'Mexican food', 'mexican', /mexican|burrito|taco|tex-mex/, 'Mexican', /taco|mexican/i),
  C('Taco Spots', 'tacos', 'tacos', /taco/, 'Mexican', /taco/i),
  C('Thai Restaurants', 'Thai food', 'thai', /\bthai\b/, 'Thai'),
  C('Chinese Restaurants', 'Chinese food', 'chinese', /chinese|dumpling|hot pot/, 'Chinese'),
  C('Japanese Restaurants', 'Japanese food', 'japanese', /japanese|ramen|sushi/, 'Japanese'),
  C('Korean Restaurants', 'Korean food', 'korean', /korean/, 'Korean'),
  C('Indian Restaurants', 'Indian food', 'indian', /indian|south asian/, 'Indian'),
  C('Vietnamese Restaurants', 'Vietnamese food', 'vietnamese', /vietnamese|\bpho\b/, 'Vietnamese'),
  C('Hawaiian Restaurants', 'Hawaiian food', 'hawaiian', /hawaiian|polynesian/, 'Hawaiian'),
  C('Peruvian Restaurants', 'Peruvian food', 'peruvian', /peruvian/, 'Peruvian'),
  C('Latin American Restaurants', 'Latin American food', 'latin-american', /latin american|peruvian|venezuelan|salvadoran|caribbean|argentinian|colombian|cuban/, 'Latin American'),
  C('Italian Restaurants', 'Italian food', 'italian', /italian|pasta/, 'Italian'),
  C('Chicken Spots', 'chicken', 'chicken', /chicken/, 'Chicken', /chicken|wings/i),
  C('Sandwich Shops', 'sandwiches', 'sandwiches', /sandwich|deli\b|cheesesteak|sub /, 'Sandwiches', /subs?\b|sandwich/i),
  C('Ice Cream Shops', 'ice cream', 'ice-cream', /ice cream|frozen yogurt|custard/, 'Ice Cream', /creamery|ice cream/i),
  C('Bakeries', 'bakeries', 'bakeries', /bakery|pastry|donut|bagel|cake shop|cupcake/, 'Bakery', /bakery|donut|kolache|bagel/i),
  C('Coffee Shops', 'coffee', 'coffee', /coffee|espresso/, 'Coffee', /coffee|java|brew/i),
  C('Breakfast & Brunch Spots', 'breakfast', 'breakfast-and-brunch', /breakfast|brunch/, 'Breakfast'),
  C('Healthy Restaurants', 'healthy food', 'healthy', /health food|vegan|vegetarian|salad|juice/, 'Healthy'),
  C('Vegan & Vegetarian Restaurants', 'vegan and vegetarian food', 'vegan', /vegan|vegetarian/, 'Vegan'),
  C('Buffets', 'buffets', 'buffets', /buffet/, 'Buffet'),
  C('Steakhouses', 'steak', 'steakhouses', /steak/, 'Steakhouse'),
  C('Boba & Tea Shops', 'boba tea', 'boba', /bubble tea|boba|tea house/, 'Bubble Tea', /boba|taichi/i),
];

/** schema.org servesCuisine values for one business. */
export const cuisinesFor = (b: Biz) => [...new Set(CUISINES.filter((c) => c.match(b)).map((c) => c.cuisine!))];

// ── broad GOTYOU categories (existing /explore pages; slugs kept stable) ──
const CATEGORY_LABELS: Record<string, [string, string]> = {
  Restaurant: ['Restaurants', 'restaurants'],
  'Fast Food': ['Fast Food Spots', 'fast food'],
  'Coffee & Cafe': ['Coffee Shops & Cafes', 'coffee and cafes'],
  'Desserts & Bakery': ['Dessert Shops & Bakeries', 'desserts'],
  'Mexican & Latin': ['Mexican & Latin Restaurants', 'Mexican and Latin food'],
  'Asian & Pacific': ['Asian & Pacific Restaurants', 'Asian and Pacific food'],
  'Bars & Pubs': ['Bars & Pubs', 'bars and pubs'],
  Shopping: ['Shops', 'shops'],
  'Health & Beauty': ['Health & Beauty Spots', 'health and beauty'],
  'Fun & Activities': ['Things to Do', 'things to do'],
};
export const CATEGORIES: Topic[] = Object.entries(CATEGORY_LABELS).map(([cat, [label, short]]) => ({
  slug: slugify(cat),
  kind: 'category',
  label,
  short,
  match: (b) => b.category === cat,
}));

// ── features (hours & accessibility) ──
const clockOf = (b: Biz) => hoursFacts(b).clock;
const latestNote = (b: Biz) => {
  const h = hoursFacts(b);
  if (h.always) return 'Open 24 hours';
  const d = h.days.filter((x) => x.ranges?.length).sort((x, y) => Math.max(...y.ranges!.map((r) => r[1])) - Math.max(...x.ranges!.map((r) => r[1])))[0];
  return d && h.latest !== null ? `Open until ${clockOf(b)(h.latest)}${h.sameEveryDay ? ' daily' : ` (${d.name})`}` : undefined;
};
export const isLateNight = (b: Biz) => (hoursFacts(b).latest ?? 0) >= 23 * 60;
const FOOD_FEATURES: Topic[] = [
  { slug: 'late-night', kind: 'feature', label: 'Late-Night Food Spots', short: 'late-night food', match: isLateNight, note: latestNote },
  { slug: 'open-24-hours', kind: 'feature', label: '24-Hour Restaurants', short: 'food open 24 hours', match: (b) => hoursFacts(b).days.some((d) => d.ranges?.some((r) => r[0] === 0 && r[1] >= 1440)), note: (b) => (hoursFacts(b).always ? 'Open 24 hours, every day' : 'Open 24 hours on some days') },
  { slug: 'open-early', kind: 'feature', label: 'Spots Open Early', short: 'early-morning food and coffee', match: (b) => (hoursFacts(b).earliest ?? 9999) <= 7 * 60, note: (b) => `Opens ${clockOf(b)(hoursFacts(b).earliest!)}` },
  { slug: 'open-sunday', kind: 'feature', label: 'Restaurants Open on Sunday', short: 'food open on Sunday', match: (b) => !!b.hours?.sun && b.hours.sun !== 'Closed', note: (b) => `Sunday: ${b.hours?.sun}` },
  { slug: 'wheelchair-accessible', kind: 'feature', label: 'Wheelchair-Accessible Restaurants', short: 'wheelchair-accessible restaurants', match: (b) => b.amenities.some((a) => /wheelchair/i.test(a)), note: (b) => b.amenities.filter((a) => /wheelchair/i.test(a)).map((a) => a.replace(/^Wheelchair accessible /i, '')).join(', ') },
  { slug: 'top-rated', kind: 'feature', label: 'Top-Rated Restaurants', short: 'top-rated food', match: (b) => (b.googleRating ?? 0) >= 4.6 && (b.googleReviewCount ?? 0) >= 250, note: (b) => `${b.googleRating?.toFixed(1)}★ from ${b.googleReviewCount?.toLocaleString()} reviews` },
  { slug: 'hidden-gems', kind: 'feature', label: 'Hidden Gems', short: 'hidden gems', match: (b) => (b.googleRating ?? 0) >= 4.7 && (b.googleReviewCount ?? 0) >= 20 && (b.googleReviewCount ?? 0) < 400, note: (b) => `${b.googleRating?.toFixed(1)}★ · only ${b.googleReviewCount} reviews` },
];

export const FEATURES: Topic[] = FOOD_FEATURES.map((t) => ({ ...t, match: (b: Biz) => isFood(b) && t.match(b) }));

export const ALL_TOPICS: Topic[] = (() => {
  const seen = new Set<string>();
  return [...CUISINES, ...CATEGORIES, ...FEATURES].filter((t) => (seen.has(t.slug) ? false : (seen.add(t.slug), true)));
})();

// ── modifiers on a topic: /explore/<city>/<topic>/<modifier>/ ──
export interface Modifier {
  slug: string;
  title: (t: Topic, city: string) => string;
  filter: (b: Biz) => boolean;
  note?: (b: Biz) => string | undefined;
}
export const cap = (s: string) => s.replace(/^./, (c) => c.toUpperCase());
const titleCase = (s: string) => s.replace(/\b(and)\b/g, '&').replace(/(^|\s)([a-z])/g, (_, sp, c) => sp + c.toUpperCase());
// "tacos" -> "Taco Deals", "restaurants" -> "Restaurant Deals", "Mexican food" -> "Mexican Food Deals"
const SINGULAR: Record<string, string> = { tacos: 'taco', burgers: 'burger', sandwiches: 'sandwich', bakeries: 'bakery', buffets: 'buffet', restaurants: 'restaurant', desserts: 'dessert', 'coffee and cafes': 'coffee & cafe', 'bars and pubs': 'bar & pub' };
const dealNoun = (t: Topic) => titleCase(SINGULAR[t.short] ?? t.short);
export const MODIFIERS: Modifier[] = [
  { slug: 'deals', title: (t, city) => `${dealNoun(t)} Deals in ${city}`, filter: () => true },
  { slug: 'late-night', title: (t, city) => `Late-Night ${titleCase(t.short)} in ${city}`, filter: isLateNight, note: latestNote },
];

export const rank = (items: Biz[]) => [...items].sort((a, b) => popularity(b) - popularity(a));

export const topicPath = (city: string, state: string, t: Topic | string, mod?: string) =>
  `/explore/${citySlug(city, state)}/${typeof t === 'string' ? t : t.slug}/${mod ? `${mod}/` : ''}`;

/** All topic pages that exist for a city (≥ MIN_LISTINGS matches). */
export function topicsForCity(items: Biz[]) {
  return ALL_TOPICS.map((t) => ({ topic: t, items: rank(items.filter(t.match)) })).filter((x) => x.items.length >= MIN_LISTINGS);
}
/** Modifier pages for a city's topic (deals for every cuisine/category; others need ≥ MIN_LISTINGS). */
export function modifiersFor(topic: Topic, items: Biz[]) {
  if (topic.kind === 'feature') return [];
  return MODIFIERS.map((m) => ({ mod: m, items: rank(items.filter(m.filter)) })).filter((x) => x.items.length >= MIN_LISTINGS);
}
