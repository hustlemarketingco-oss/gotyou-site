#!/usr/bin/env node
/**
 * scripts/seed-places.js
 *
 * Pulls businesses from the Google Places API for a given city + category
 * list and writes one JSON file per business into src/content/businesses/.
 * This is intentionally NOT an LLM agent — it's deterministic data
 * transformation. The Claude-powered step is enrich-content.js, which runs
 * afterward to turn this raw data into real page copy.
 *
 * Usage:
 *   node scripts/seed-places.js --city="Salt Lake City, UT" --categories="restaurant,beauty_salon,gym"
 *   node scripts/seed-places.js --city="Salt Lake City, UT" --categories="restaurant" --dry-run
 *
 * Requires GOOGLE_PLACES_API_KEY in the environment.
 *
 * Cost note: roughly $15-20 per mid-size city across ~10-20 categories
 * (Text Search at $32/1k requests + Place Details at $17/1k requests).
 * Google's $200/mo free tier covers most single-city seed runs.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'businesses');

const GOOGLE_CATEGORY_MAP = {
  restaurant: 'Restaurant',
  cafe: 'Coffee & Cafe',
  gym: 'Fitness',
  beauty_salon: 'Beauty & Spa',
  hair_care: 'Beauty & Spa',
  dentist: 'Healthcare',
  doctor: 'Healthcare',
  store: 'Retail',
  car_repair: 'Automotive',
  school: 'Education',
  plumber: 'Home Services',
  electrician: 'Home Services',
  lawyer: 'Professional Services',
  accounting: 'Professional Services',
};

function parseArgs(argv) {
  const args = {};
  for (const arg of argv.slice(2)) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) args[match[1]] = match[2];
    else if (arg.startsWith('--')) args[arg.slice(2)] = true;
  }
  return args;
}

function slugify(name, city) {
  const clean = (s) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  return `${clean(name)}-${clean(city)}`;
}

async function textSearch(apiKey, query, pageToken) {
  const url = new URL('https://places.googleapis.com/v1/places:searchText');
  const body = {
    textQuery: query,
    ...(pageToken ? { pageToken } : {}),
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.addressComponents,places.location,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.regularOpeningHours,places.primaryType,nextPageToken',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Places API error (${res.status}): ${text}`);
  }

  return res.json();
}

function extractAddressPart(components, type) {
  const match = components?.find((c) => c.types?.includes(type));
  return match?.shortText || match?.longText || undefined;
}

function mapDayHours(periods) {
  if (!periods?.length) return undefined;
  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const hours = {};
  for (const period of periods) {
    const day = dayNames[period.open?.day];
    if (!day || !period.open || !period.close) continue;
    const fmt = (t) => `${String(t.hour).padStart(2, '0')}:${String(t.minute || 0).padStart(2, '0')}`;
    hours[day] = `${fmt(period.open)} - ${fmt(period.close)}`;
  }
  return Object.keys(hours).length ? hours : undefined;
}

function placeToBusinessRecord(place, fallbackCategory) {
  const name = place.displayName?.text || 'Unknown Business';
  const city =
    extractAddressPart(place.addressComponents, 'locality') ||
    extractAddressPart(place.addressComponents, 'postal_town') ||
    'Unknown City';
  const state = extractAddressPart(place.addressComponents, 'administrative_area_level_1') || '';
  const zip = extractAddressPart(place.addressComponents, 'postal_code');

  return {
    slug: slugify(name, city),
    name,
    category: GOOGLE_CATEGORY_MAP[fallbackCategory] || 'Local Business',
    secondaryCategories: place.primaryType ? [place.primaryType] : [],
    address: place.formattedAddress?.split(',')[0] || place.formattedAddress || '',
    city,
    state,
    ...(zip ? { zip } : {}),
    ...(place.location ? { lat: place.location.latitude, lng: place.location.longitude } : {}),
    ...(place.nationalPhoneNumber ? { phone: place.nationalPhoneNumber } : {}),
    ...(place.websiteUri ? { website: place.websiteUri } : {}),
    placeId: place.id,
    ...(place.rating ? { googleRating: place.rating } : {}),
    ...(place.userRatingCount ? { googleReviewCount: place.userRatingCount } : {}),
    ...(place.regularOpeningHours?.periods
      ? { hours: mapDayHours(place.regularOpeningHours.periods) }
      : {}),
    claimStatus: 'unclaimed',
    checkinCount: 0,
    seededAt: new Date().toISOString(),
  };
}

async function seedCategory(apiKey, city, category, { dryRun, seen }) {
  const query = `${category.replace(/_/g, ' ')} in ${city}`;
  console.log(`  Searching: "${query}"`);

  let pageToken;
  let totalFound = 0;
  let pageCount = 0;

  do {
    const result = await textSearch(apiKey, query, pageToken);
    const places = result.places || [];

    for (const place of places) {
      if (seen.has(place.id)) continue; // dedupe across categories
      seen.add(place.id);

      const record = placeToBusinessRecord(place, category);
      totalFound += 1;

      if (dryRun) {
        console.log(`    [dry-run] Would write: ${record.name} (${record.city})`);
        continue;
      }

      const filePath = path.join(CONTENT_DIR, `${record.slug}.json`);
      if (existsSync(filePath)) {
        console.log(`    Skipping (already exists): ${record.slug}.json`);
        continue;
      }

      await writeFile(filePath, JSON.stringify(record, null, 2) + '\n', 'utf-8');
      console.log(`    Wrote: ${record.slug}.json`);
    }

    pageToken = result.nextPageToken;
    pageCount += 1;
    // Google's pageToken needs a short delay before it's valid for the next request
    if (pageToken) await new Promise((r) => setTimeout(r, 2000));
  } while (pageToken && pageCount < 3); // Google caps useful pagination at 3 pages (60 results) per query

  console.log(`  -> ${totalFound} businesses found for "${category}"`);
  return totalFound;
}

async function main() {
  const args = parseArgs(process.argv);
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const dryRun = Boolean(args['dry-run']);

  if (!args.city) {
    console.error('Usage: node scripts/seed-places.js --city="City, ST" --categories="restaurant,cafe,gym"');
    process.exit(1);
  }
  if (!apiKey && !dryRun) {
    console.error('Missing GOOGLE_PLACES_API_KEY in environment. Use --dry-run to test without an API key.');
    process.exit(1);
  }

  const categories = (args.categories || Object.keys(GOOGLE_CATEGORY_MAP).join(','))
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);

  if (!dryRun) await mkdir(CONTENT_DIR, { recursive: true });

  console.log(`Seeding businesses for "${args.city}" across ${categories.length} categories...`);
  if (dryRun) console.log('(dry run — no files will be written)\n');

  const seen = new Set(); // placeId dedup across categories — a restaurant can match both "restaurant" and "cafe"
  let grandTotal = 0;

  for (const category of categories) {
    try {
      grandTotal += await seedCategory(apiKey, args.city, category, { dryRun, seen });
    } catch (err) {
      console.error(`  Error seeding "${category}": ${err.message}`);
    }
    // Be polite to the API between categories
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\nDone. ${grandTotal} unique businesses processed for ${args.city}.`);
  if (!dryRun) {
    console.log(`Next step: node scripts/enrich-content.js to generate descriptions and SEO copy.`);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
