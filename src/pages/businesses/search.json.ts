// Search index for the /businesses directory (DirectorySearch.astro fetches it on demand).
// Rows are tuples rather than objects and categories are indexed, which roughly halves the download.
import type { APIRoute } from 'astro';
import { activeBusinesses } from '../../lib/explore';
import { sizedPhoto } from '../../lib/business';

const STATUS = ['unclaimed', 'pending', 'claimed'];

export const GET: APIRoute = async () => {
  const all = await activeBusinesses();
  const cats = [...new Set(all.map((b) => b.category))];
  const rows = all.map((b) => [
    b.slug,
    b.name,
    cats.indexOf(b.category),
    b.googleCategory ?? b.category,
    b.city,
    b.state,
    b.address,
    STATUS.indexOf(b.claimStatus),
    b.googleRating ?? 0,
    b.googleReviewCount ?? 0,
    b.priceRange ?? '',
    sizedPhoto(b.photoUrl, 640, 420) ?? '',
  ]);
  return new Response(JSON.stringify({ cats, rows }), { headers: { 'Content-Type': 'application/json' } });
};
