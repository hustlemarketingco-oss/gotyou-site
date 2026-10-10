// Machine-readable facts for each business (linked from the profile via <link rel="alternate">),
// so AI assistants and other tools can read hours/location/contact without scraping HTML.
import type { APIRoute } from 'astro';
import { activeInState, allBusinessData } from '../../lib/explore';
import { formatPhone } from '../../lib/business';
import { profileContent } from '../../lib/profile-content';

export async function getStaticPaths() {
  return (await allBusinessData()).map((b) => ({ params: { slug: b.slug }, props: { slug: b.slug } }));
}

export const GET: APIRoute = async ({ props, site }) => {
  const b = (await allBusinessData()).find((x) => x.slug === (props as { slug: string }).slug)!;
  const c = profileContent(b, await activeInState(b.state));
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
