import type { APIRoute } from 'astro';

// This route opts OUT of the site's default static output. Everything else
// in the project is prerendered at build time; this is the one endpoint that
// needs to run per-request on Cloudflare's Worker runtime, since it has to
// read form data and call out to an email/storage service.
export const prerender = false;

// Phase 1: send an email notification to the GotYou team for manual review
// (e.g. via Resend, Postmark, or a Cloudflare Email Worker) and optionally
// log the submission to a KV namespace as a lightweight pending-claims queue.
// Phase 2: once the app backend connection exists, this should instead write
// the claim directly into the same database the app reads from, so claiming
// via the directory and claiming via the app converge on one source of truth.
export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();

  const businessSlug = formData.get('businessSlug')?.toString();
  const businessName = formData.get('businessName')?.toString();
  const name = formData.get('name')?.toString();
  const email = formData.get('email')?.toString();
  const phone = formData.get('phone')?.toString();
  const role = formData.get('role')?.toString() || 'Not specified';

  if (!businessSlug || !businessName || !name || !email || !phone) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // --- Basic sanity check, not a substitute for the Claim Verification Agent ---
  // The full agent (see scripts/verify-claim.js) runs asynchronously against
  // the submission queue and checks things like "does the email domain match
  // the business's known website" before auto-approving. This inline check
  // just catches obviously malformed submissions before they're queued.
  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailLooksValid) {
    return new Response(JSON.stringify({ error: 'Invalid email address' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const claimRecord = {
    businessSlug,
    businessName,
    submittedBy: { name, email, phone, role },
    submittedAt: new Date().toISOString(),
    status: 'pending_review' as const,
  };

  // TODO (Phase 1 wiring): replace this with an actual call to your email
  // provider and/or a Cloudflare KV `put` to queue the claim for review.
  // Left as a console.log placeholder so the route is runnable/testable
  // before those integrations are wired up.
  console.log('New claim submission:', claimRecord);

  return new Response(JSON.stringify({ success: true, claim: claimRecord }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
