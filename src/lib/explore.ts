// Grouping helpers for the /explore city and city+category pages.
import { getCollection } from 'astro:content';
import { MIN_CATEGORY_LISTINGS, popularity, slugify, type Biz } from './profile-content';

export async function activeBusinesses(): Promise<Biz[]> {
  return (await getCollection('businesses')).map((b) => b.data).filter((b) => !b.temporarilyClosed);
}

export function byCity(all: Biz[]) {
  const map = new Map<string, Biz[]>();
  for (const b of all) map.set(b.city, [...(map.get(b.city) ?? []), b]);
  return [...map.entries()]
    .map(([city, items]) => ({ city, slug: slugify(city), state: items[0].state, items: items.sort((a, b) => popularity(b) - popularity(a)) }))
    .sort((a, b) => b.items.length - a.items.length);
}

export function categoriesIn(items: Biz[]) {
  const map = new Map<string, Biz[]>();
  for (const b of items) map.set(b.category, [...(map.get(b.category) ?? []), b]);
  return [...map.entries()]
    .map(([category, list]) => ({ category, slug: slugify(category), items: list.sort((a, b) => popularity(b) - popularity(a)), hasPage: list.length >= MIN_CATEGORY_LISTINGS }))
    .sort((a, b) => b.items.length - a.items.length);
}

export function avgRating(items: Biz[]) {
  const rated = items.filter((b) => b.googleRating);
  return rated.length ? rated.reduce((s, b) => s + (b.googleRating ?? 0), 0) / rated.length : null;
}
