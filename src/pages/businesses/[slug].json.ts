// Machine-readable facts for each business (linked from the profile via <link rel="alternate">),
// so AI assistants and other tools can read hours/location/contact without scraping HTML.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { formatPhone } from '../../lib/business';
import { profileContent } from '../../lib/profile-content';

export async function getStaticPaths() {
  const all = await getCollection('businesses');
  return all.map((b) => ({ params: { slug: b.data.slug }, props: { b: b.data, all: all.map((x) => x.data) } }));
}

export const GET: APIRoute = ({ props, site }) => {
  const { b, all } = props as { b: any; all: any[] };
  const c = profileContent(b, all.filter((x) => !x.temporarilyClosed));
  const url = new URL(`/businesses/${b.slug}/`, site).href;
  const body = {
    name: b.name,
    url,
    summary: c.summary,
    category: b.googleCategory ?? b.category,
    categories: [b.googleCategory ?? b.category, ...b.secondaryCategories],
    address: { street: b.address, city: b.city, state: b.state, postalCode: b.zip, country: 'US' },
    geo: b.lat != null ? { lat: b.lat, lng: b.lng } : undefined,
    phone: formatPhone(b.phone),
    website: b.website,
    hours: b.hours,
    timezone: b.timezone,
    priceRange: b.priceRange,
    accessibility: b.amenities,
    rating: b.googleRating ? { source: 'Google', average: b.googleRating, count: b.googleReviewCount } : undefined,
    temporarilyClosed: b.temporarilyClosed || undefined,
    onGotyou: b.claimStatus === 'claimed',
    faq: c.faqs,
    lastUpdated: b.updatedAt,
  };
  return new Response(JSON.stringify(body, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
