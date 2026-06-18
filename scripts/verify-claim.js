#!/usr/bin/env node
/**
 * scripts/verify-claim.js
 *
 * Runs against the pending-claims queue (currently just a JSON file written
 * by the /api/claim route — see the TODO there about swapping in real
 * storage). For each pending claim, asks Claude to assess plausibility:
 * does the submitter's email domain match the business name or known
 * website, does the role make sense, anything that looks like spam/abuse.
 *
 * This does NOT auto-approve claims outright — it labels them
 * "likely_legitimate" or "needs_human_review" and writes that verdict back,
 * so a human still makes the final call on anything flagged. The goal is
 * cutting review time on the obvious cases, not removing the human step
 * entirely — claim approval flips real ownership state, so a wrong
 * auto-approval is a worse failure mode than a slower review queue.
 *
 * Usage:
 *   node scripts/verify-claim.js --queue=pending-claims.json
 */

import { readFile, writeFile } from 'node:fs/promises';

const MODEL = 'claude-sonnet-4-6';

function parseArgs(argv) {
  const args = {};
  for (const arg of argv.slice(2)) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) args[match[1]] = match[2];
  }
  return args;
}

function buildPrompt(claim, business) {
  return `Assess whether this business claim submission looks legitimate. Be conservative — when uncertain, flag for human review rather than approving.

Business being claimed: ${business.name}
Business website on file: ${business.website || 'none on file'}
Business city: ${business.city}

Claim submission:
Name: ${claim.submittedBy.name}
Email: ${claim.submittedBy.email}
Phone: ${claim.submittedBy.phone}
Stated role: ${claim.submittedBy.role}

Consider: does the email domain plausibly relate to the business name or its known website? Is the stated role reasonable for someone who'd claim a business listing (owner, manager, etc.) rather than something that suggests unrelated spam? Are there any red flags (clearly fake-looking email, mismatched names, generic/throwaway domains for a business that should have its own domain)?

Respond with ONLY valid JSON, no markdown formatting, no preamble:
{
  "verdict": "likely_legitimate" or "needs_human_review",
  "reasoning": "1-2 sentence explanation",
  "emailDomainMatchesBusiness": true or false
}`;
}

async function verifyClaim(apiKey, claim, business) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 300,
      messages: [{ role: 'user', content: buildPrompt(claim, business) }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Claude API error (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  const textBlock = data.content?.find((block) => block.type === 'text');
  const cleaned = textBlock.text.replace(/^```json\s*|\s*```$/g, '').trim();
  return JSON.parse(cleaned);
}

async function main() {
  const args = parseArgs(process.argv);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const queuePath = args.queue || 'pending-claims.json';

  if (!apiKey) {
    console.error('Missing ANTHROPIC_API_KEY in environment.');
    process.exit(1);
  }

  let queue;
  try {
    queue = JSON.parse(await readFile(queuePath, 'utf-8'));
  } catch {
    console.log(`No pending claims queue found at ${queuePath}. Nothing to verify.`);
    return;
  }

  const pending = queue.filter((c) => c.status === 'pending_review');
  console.log(`Verifying ${pending.length} pending claim(s)...`);

  for (const claim of pending) {
    // In the real pipeline, `business` would be looked up from the content
    // collection or app DB by claim.businessSlug. Left as a stub field here
    // since this script's job is the verification logic, not data wiring.
    const business = claim.business || { name: claim.businessName, city: 'Unknown', website: undefined };

    try {
      const result = await verifyClaim(apiKey, claim, business);
      claim.verification = {
        ...result,
        verifiedAt: new Date().toISOString(),
      };
      console.log(`  ${claim.businessName}: ${result.verdict} — ${result.reasoning}`);
    } catch (err) {
      console.error(`  Error verifying claim for ${claim.businessName}: ${err.message}`);
    }
  }

  await writeFile(queuePath, JSON.stringify(queue, null, 2) + '\n', 'utf-8');
  console.log(`\nDone. Queue written back to ${queuePath}.`);
  console.log('Claims marked "needs_human_review" should be checked manually before approving.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
