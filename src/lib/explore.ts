// Grouping helpers for the /explore city and city+category pages.
import { getCollection } from 'astro:content';
import { MIN_CATEGORY_LISTINGS, citySlug, popularity, slugify, type Biz } from './profile-content';

// Loaded once per build and shared by every page. Pages must not mutate these arrays or objects.
let everything: Promise<Biz[]> | undefined;
let active: Promise<Biz[]> | undefined;
export const allBusinessData = () => (everything ??= getCollection('businesses').then((c) => c.map((b) => b.data)));
export const activeBusinesses = () => (active ??= allBusinessData().then((all) => all.filter((b) => !b.temporarilyClosed)));

/** Active listings in one state, cached: profile pages only compare a business with its neighbours. */
const byStateCache = new Map<string, Promise<Biz[]>>();
export function activeInState(state: string) {
  let p = byStateCache.get(state);
  if (!p) byStateCache.set(state, (p = activeBusinesses().then((all) => all.filter((b) => b.state === state))));
  return p;
}

export function byCity(all: Biz[]) {
  const map = new Map<string, Biz[]>();
  for (const b of all) {
    const k = citySlug(b.city, b.state);
    const list = map.get(k);
    if (list) list.push(b);
    else map.set(k, [b]);
  }
  return [...map.entries()]
    .map(([slug, items]) => ({ city: items[0].city, slug, state: items[0].state, items: items.sort((a, b) => popularity(b) - popularity(a)) }))
    .sort((a, b) => b.items.length - a.items.length);
}

export function categoriesIn(items: Biz[]) {
  const map = new Map<string, Biz[]>();
  for (const b of items) {
    const list = map.get(b.category);
    if (list) list.push(b);
    else map.set(b.category, [b]);
  }
  return [...map.entries()]
    .map(([category, list]) => ({ category, slug: slugify(category), items: list.sort((a, b) => popularity(b) - popularity(a)), hasPage: list.length >= MIN_CATEGORY_LISTINGS }))
    .sort((a, b) => b.items.length - a.items.length);
}

export function avgRating(items: Biz[]) {
  const rated = items.filter((b) => b.googleRating);
  return rated.length ? rated.reduce((s, b) => s + (b.googleRating ?? 0), 0) / rated.length : null;
}
