import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// ─── Businesses ──────────────────────────────────────────────────────────
// One entry per business in the directory. Populated by scripts/seed-places.js
// (raw Google Places data) and enriched by scripts/enrich-content.js (Claude-
// generated description/SEO copy). Claimed status is the field that Phase 2
// will sync from the live GotYou app database instead of living here statically.
//
// Astro's Content Layer API (current since Astro 5+) requires an explicit
// `loader`, not just `type: 'data'` — the older type-based convention silently
// registers nothing in this version, which is why this needs `glob()` here.
const businesses = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/businesses' }),
  schema: z.object({
    // Identity
    slug: z.string(), // URL-safe, e.g. "firehouse-pizza-salt-lake-city"
    name: z.string(),
    category: z.string(), // GotYou display bucket, e.g. "Restaurant", "Coffee & Cafe", "Pizza"
    googleCategory: z.string().optional(), // the specific Google category, e.g. "Thai restaurant"
    secondaryCategories: z.array(z.string()).default([]),

    // Location
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),

    // Contact
    phone: z.string().optional(),
    website: z.string().url().optional(),

    // Google Places source data (raw, for re-sync/dedup)
    placeId: z.string().optional(),
    googleRating: z.number().optional(),
    googleReviewCount: z.number().optional(),
    googlePhotoRef: z.string().optional(), // photo reference, not the binary
    googleMapsUrl: z.string().url().optional(),
    photoUrl: z.string().url().optional(), // hosted Google photo URL (from the directory scraper)
    priceRange: z.string().optional(),
    amenities: z.array(z.string()).default([]),
    ratingBreakdown: z.record(z.string(), z.number()).optional(), // Google star counts, e.g. {"5": 2783, "4": 661}
    ownerPhotoUrl: z.string().optional(), // photo supplied by the merchant after claiming; preferred over photoUrl // e.g. "Wheelchair accessible entrance", "Dine-in"
    timezone: z.string().optional(), // IANA, e.g. "America/Denver" — used for the "Open now" badge
    temporarilyClosed: z.boolean().default(false),
    source: z.string().optional(), // "gmaps-scraper" when written by directory-pipeline/export_gotyou.py

    // Enriched content (written by enrich-content.js)
    description: z.string().optional(), // 2-3 sentence Claude-generated description
    tagline: z.string().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),

    // Hours — simple string per day, optional
    hours: z
      .object({
        mon: z.string().optional(),
        tue: z.string().optional(),
        wed: z.string().optional(),
        thu: z.string().optional(),
        fri: z.string().optional(),
        sat: z.string().optional(),
        sun: z.string().optional(),
      })
      .optional(),

    // GotYou platform state — Phase 1 these are static/manual.
    // Phase 2 replaces reads of this block with a live API call to the app DB.
    claimStatus: z.enum(['unclaimed', 'pending', 'claimed']).default('unclaimed'),
    checkinCount: z.number().default(0), // placeholder until live app data is wired in

    // Housekeeping
    seededAt: z.string().datetime().optional(), // when seed-places.js first created this record
    enrichedAt: z.string().datetime().optional(), // when enrich-content.js last wrote description copy
    updatedAt: z.string().datetime().optional(), // when maintain-businesses.js last refreshed this record
  }),
});

// ─── Blog ────────────────────────────────────────────────────────────────
// Markdown content, migrated from the existing WordPress posts.
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    author: z.string().default('GOTYOU Team'),
    tag: z.string().default('Insights'),
    heroImage: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

// ─── Legal ───────────────────────────────────────────────────────────────
// Privacy policy and terms, copied verbatim from the WordPress site.
const legal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/legal' }),
  schema: z.object({ title: z.string() }),
});

// ─── Jobs ────────────────────────────────────────────────────────────────
// Open roles, migrated from the WordPress job board (gotyou.co/job-openings).
const jobs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/jobs' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    posted: z.coerce.date(),
    location: z.string().default('USA'),
  }),
});

export const collections = { businesses, blog, legal, jobs };
