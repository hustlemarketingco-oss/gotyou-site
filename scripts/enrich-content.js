#!/usr/bin/env node
/**
 * scripts/enrich-content.js
 *
 * The actual LLM agent in this pipeline. Scans src/content/businesses/ for
 * records that haven't been enriched yet (no `enrichedAt` timestamp), sends
 * each one's raw Google Places data to Claude, and writes back a generated
 * description, tagline, and SEO meta fields.
 *
 * This mirrors the same pattern as the CallRail transcript classification
 * pipeline: Claude API call inside a script, structured JSON out, write to
 * file, commit. Runs via GitHub Actions after seed-places.js, or manually:
 *
 *   node scripts/enrich-content.js
 *   node scripts/enrich-content.js --slug=firehouse-pizza-salt-lake-city  (single business)
 *   node scripts/enrich-content.js --dry-run
 *
 * Requires ANTHROPIC_API_KEY in the environment.
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'businesses');
const MODEL = 'claude-sonnet-4-6';

function parseArgs(argv) {
  const args = {};
  for (const arg of argv.slice(2)) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) args[match[1]] = match[2];
    else if (arg.startsWith('--')) args[arg.slice(2)] = true;
  }
  return args;
}

function buildPrompt(business) {
  return `Generate marketing copy for a local business directory profile page. Here is the raw business data:

Name: ${business.name}
Category: ${business.category}
City: ${business.city}, ${business.state}
${business.googleRating ? `Google Rating: ${business.googleRating} (${business.googleReviewCount} reviews)` : ''}
${business.website ? `Website: ${business.website}` : ''}

This page is for GOTYOU, a local business directory and rewards platform. The tone should be warm, specific, and locally-grounded — not generic corporate copy. Avoid superlatives that aren't earned by the data (don't say "the best" or "legendary" unless reviews clearly support it).

Respond with ONLY valid JSON, no markdown formatting, no code fences, no preamble. Use this exact shape:
{
  "description": "2-3 sentence description of the business for its profile page",
  "tagline": "A short 4-7 word tagline capturing its character",
  "metaTitle": "SEO title, format: '{Name} — {City} | GOTYOU', under 60 characters",
  "metaDescription": "SEO meta description under 155 characters, should mention checking in to earn $GET tokens"
}`;
}

async function enrichBusiness(apiKey, business) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 500,
      messages: [{ role: 'user', content: buildPrompt(business) }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Claude API error (${res.status}): ${text}`);
  }

  const data = await res.json();
  const textBlock = data.content?.find((block) => block.type === 'text');
  if (!textBlock) throw new Error('No text content in Claude response');

  // Strip any accidental code fences even though the prompt asks for raw JSON —
  // models occasionally wrap output in ```json blocks despite instructions.
  const cleaned = textBlock.text.replace(/^```json\s*|\s*```$/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Failed to parse Claude response as JSON: ${cleaned.slice(0, 200)}`);
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const dryRun = Boolean(args['dry-run']);

  if (!apiKey) {
    console.error('Missing ANTHROPIC_API_KEY in environment.');
    process.exit(1);
  }

  const allFiles = (await readdir(CONTENT_DIR)).filter((f) => f.endsWith('.json'));
  const targetFiles = args.slug ? allFiles.filter((f) => f === `${args.slug}.json`) : allFiles;

  if (!targetFiles.length) {
    console.log('No matching business files found.');
    return;
  }

  console.log(`Scanning ${targetFiles.length} business file(s) for enrichment...`);

  let enrichedCount = 0;
  let skippedCount = 0;

  for (const file of targetFiles) {
    const filePath = path.join(CONTENT_DIR, file);
    const business = JSON.parse(await readFile(filePath, 'utf-8'));

    // Skip already-enriched records unless explicitly re-targeted by --slug.
    // This is what makes the script safe to re-run on a schedule — it only
    // does work on genuinely new businesses each time.
    if (business.enrichedAt && !args.slug) {
      skippedCount += 1;
      continue;
    }

    console.log(`  Enriching: ${business.name} (${business.city})`);

    try {
      const enrichment = await enrichBusiness(apiKey, business);

      const updated = {
        ...business,
        description: enrichment.description,
        tagline: enrichment.tagline,
        metaTitle: enrichment.metaTitle,
        metaDescription: enrichment.metaDescription,
        enrichedAt: new Date().toISOString(),
      };

      if (dryRun) {
        console.log(`    [dry-run] Generated:`, enrichment);
      } else {
        await writeFile(filePath, JSON.stringify(updated, null, 2) + '\n', 'utf-8');
        console.log(`    Wrote enriched content to ${file}`);
      }

      enrichedCount += 1;
    } catch (err) {
      console.error(`    Error enriching ${business.name}: ${err.message}`);
    }

    // Light rate limiting between requests
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\nDone. ${enrichedCount} enriched, ${skippedCount} already up to date.`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
