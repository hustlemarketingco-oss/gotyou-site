# GOTYOU — Site + Business Directory

Astro site for gotyou.co, deployed to Cloudflare Pages. Two halves: a marketing
site (home, about, solution, pricing, blog, contact) and an auto-generated
business directory used as the landing target for the email/mailer "claim
your listing" campaign.

## Architecture

```
src/
├── content.config.ts        Content collection schemas (businesses, blog)
├── content/
│   ├── businesses/           One JSON file per business — this is the data
│   │                         the whole directory is generated from
│   └── blog/                 Markdown blog posts
├── pages/
│   ├── businesses/
│   │   ├── index.astro       Directory search/browse (client-side filter island)
│   │   └── [slug].astro      Business profile page — getStaticPaths() turns
│   │                         every content/businesses/*.json into a real page
│   │   └── [slug]/claim.astro    Claim form for that business
│   ├── api/claim.ts          Server route handling claim submissions
│   └── (marketing pages)
├── components/               Shared UI (Nav, Footer, BusinessCard, ClaimSidebar, etc.)
└── lib/constants.ts           Brand colors, nav links, social URLs

scripts/                       The agents (see below)
.github/workflows/             Orchestration — when each agent runs
```

**The core mechanic:** add a JSON file to `src/content/businesses/`, run a
build, and a real page exists at `/businesses/that-slug/`. Nothing else needs
to change. The scripts in `scripts/` exist to populate and maintain that
folder; they're not required for the site to function — you could hand-write
JSON files and it'd work identically.

## The Agents

| Script | Type | What it does | When it runs |
|---|---|---|---|
| `seed-places.js` | Deterministic | Pulls businesses from Google Places API for a city/category list, writes JSON files | Manually, via `workflow_dispatch` when launching a new market |
| `enrich-content.js` | Claude agent | Turns raw Places data into real descriptions, taglines, SEO meta | Runs right after seeding, same workflow |
| `verify-claim.js` | Claude agent | Assesses claim form submissions for plausibility, flags suspicious ones | On the pending-claims queue, manually or on a future schedule |
| `maintain-businesses.js` | Deterministic + flagging | Re-checks existing businesses against Places API, applies non-critical updates, flags closures for human review | Weekly cron |

Only `enrich-content.js` and `verify-claim.js` actually call Claude — the
seeding and maintenance scripts are plain data transformation. That split is
intentional: deterministic steps stay deterministic, and the LLM is used
specifically where judgment or content generation is the point.

## Local Development

```bash
npm install
npm run dev          # localhost:4321
npm run build        # production build to dist/
npm run preview      # preview the production build locally
```

### Running the agents locally

```bash
# Seed a market (dry run first to see what would be created, no API key needed)
node scripts/seed-places.js --city="Salt Lake City, UT" --categories="restaurant,cafe,gym" --dry-run

# Then for real, with GOOGLE_PLACES_API_KEY set
node scripts/seed-places.js --city="Salt Lake City, UT" --categories="restaurant,cafe,gym"

# Enrich whatever was just seeded, with ANTHROPIC_API_KEY set
node scripts/enrich-content.js

# Check existing businesses for drift
node scripts/maintain-businesses.js --dry-run
```

## Deployment

Connected to Cloudflare Pages via the GitHub repo — any push to `main`
triggers a rebuild and deploy automatically. No manual deploy step.

Required secrets (set in GitHub repo settings → Secrets and variables →
Actions):
- `GOOGLE_PLACES_API_KEY`
- `ANTHROPIC_API_KEY`

## Phase 2 — Live App Sync

Everything above treats `claimStatus` and `checkinCount` as static fields in
the content collection, written once and updated manually or via the
maintenance script. Phase 2 replaces that with a live read from the GotYou
app's actual database, so claiming a business via the app and claiming it via
the directory converge on one source of truth instead of two parallel states.

The places this needs to change are marked with `Phase 2` comments:
- `src/content.config.ts` — the `claimStatus`/`checkinCount` schema fields
- `src/pages/api/claim.ts` — currently emails the team; should write to the
  shared app DB instead
- `src/components/ClaimSidebar.astro` — the claim button's destination logic
