#!/usr/bin/env node
/**
 * scripts/maintain-businesses.js
 *
 * Runs on a schedule (see .github/workflows/maintain-businesses.yml) to
 * check whether existing business records have gone stale: closed
 * locations, changed hours, changed phone numbers. Re-queries Google
 * Places by placeId for each business and diffs against the stored record.
 *
 * Non-critical field changes (hours, phone, rating) are applied
 * automatically. Critical changes (business_status no longer OPERATIONAL)
 * are flagged for manual review rather than silently removing a business
 * that might be mid-claim-flow or have an active token offer running.
 *
 * Usage:
 *   node scripts/maintain-businesses.js
 *   node scripts/maintain-businesses.js --dry-run
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'businesses');

function parseArgs(argv) {
  const args = {};
  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--')) args[arg.slice(2).split('=')[0]] = true;
  }
  return args;
}

async function fetchPlaceDetails(apiKey, placeId) {
  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'businessStatus,nationalPhoneNumber,regularOpeningHours,rating,userRatingCount',
    },
  });

  if (!res.ok) {
    throw new Error(`Places API error (${res.status}): ${await res.text()}`);
  }

  return res.json();
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

async function main() {
  const args = parseArgs(process.argv);
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const dryRun = Boolean(args['dry-run']);

  if (!apiKey) {
    console.error('Missing GOOGLE_PLACES_API_KEY in environment.');
    process.exit(1);
  }

  const files = (await readdir(CONTENT_DIR)).filter((f) => f.endsWith('.json'));
  console.log(`Checking ${files.length} business record(s) for drift...`);

  const flaggedForReview = [];
  let updatedCount = 0;
  let unchangedCount = 0;

  for (const file of files) {
    const filePath = path.join(CONTENT_DIR, file);
    const business = JSON.parse(await readFile(filePath, 'utf-8'));

    if (!business.placeId) {
      console.log(`  Skipping ${file} — no placeId on record (manually added, not from Places).`);
      continue;
    }

    try {
      const fresh = await fetchPlaceDetails(apiKey, business.placeId);
      let changed = false;
      const updated = { ...business };

      // Critical: business no longer operational. Don't silently drop it —
      // a closed-but-claimed business with an active token offer needs a
      // human decision, not an automated deletion.
      if (fresh.businessStatus && fresh.businessStatus !== 'OPERATIONAL') {
        flaggedForReview.push({
          slug: business.slug,
          name: business.name,
          reason: `Google reports status: ${fresh.businessStatus}`,
        });
      }

      // Non-critical: apply directly
      if (fresh.nationalPhoneNumber && fresh.nationalPhoneNumber !== business.phone) {
        updated.phone = fresh.nationalPhoneNumber;
        changed = true;
      }
      if (fresh.rating && fresh.rating !== business.googleRating) {
        updated.googleRating = fresh.rating;
        changed = true;
      }
      if (fresh.userRatingCount && fresh.userRatingCount !== business.googleReviewCount) {
        updated.googleReviewCount = fresh.userRatingCount;
        changed = true;
      }
      const freshHours = mapDayHours(fresh.regularOpeningHours?.periods);
      if (freshHours && JSON.stringify(freshHours) !== JSON.stringify(business.hours)) {
        updated.hours = freshHours;
        changed = true;
      }

      if (changed) {
        updated.updatedAt = new Date().toISOString();
        if (dryRun) {
          console.log(`  [dry-run] Would update: ${business.name}`);
        } else {
          await writeFile(filePath, JSON.stringify(updated, null, 2) + '\n', 'utf-8');
          console.log(`  Updated: ${business.name}`);
        }
        updatedCount += 1;
      } else {
        unchangedCount += 1;
      }
    } catch (err) {
      console.error(`  Error checking ${business.name}: ${err.message}`);
    }

    // Be polite to the API
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\nDone. ${updatedCount} updated, ${unchangedCount} unchanged.`);

  if (flaggedForReview.length) {
    console.log(`\n⚠ ${flaggedForReview.length} business(es) flagged for manual review:`);
    for (const flag of flaggedForReview) {
      console.log(`  - ${flag.name} (${flag.slug}): ${flag.reason}`);
    }
    // Non-zero exit so the GitHub Action surfaces this as a visible failure
    // rather than a silently successful run when something needs eyes on it.
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
