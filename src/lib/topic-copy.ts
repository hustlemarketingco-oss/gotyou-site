// Data-driven intros and Q&A for /explore landing pages. Every sentence is computed from the
// listings on the page (counts, leaders, hours), so pages differ meaningfully from each other.
import { avgRating } from './explore';
import { hoursFacts, lc, type Biz } from './profile-content';
import { isLateNight, type Topic } from './topics';

const names = (xs: Biz[], n = 3) => {
  const v = xs.slice(0, n).map((b) => b.name);
  return v.length <= 1 ? v.join('') : `${v.slice(0, -1).join(', ')} and ${v[v.length - 1]}`;
};
const stars = (b: Biz) => (b.googleRating ? `${b.googleRating.toFixed(1)}★ from ${b.googleReviewCount?.toLocaleString()} reviews` : '');
// Latest closing among spots that actually close (24-hour places are reported separately).
const latestOf = (xs: Biz[]) => xs.filter((b) => hoursFacts(b).latest !== null && !open24(b)).sort((a, b) => hoursFacts(b).latest! - hoursFacts(a).latest!)[0];
const open24 = (b: Biz) => hoursFacts(b).days.some((d) => d.ranges?.some((r) => r[0] === 0 && r[1] >= 1440));
const earliestOf = (xs: Biz[]) => xs.filter((b) => hoursFacts(b).earliest !== null).sort((a, b) => hoursFacts(a).earliest! - hoursFacts(b).earliest!)[0];
const sundayOpen = (xs: Biz[]) => xs.filter((b) => b.hours?.sun && b.hours.sun !== 'Closed');
const mostReviewed = (xs: Biz[]) => [...xs].sort((a, b) => (b.googleReviewCount ?? 0) - (a.googleReviewCount ?? 0))[0];

export function topicCopy(t: Topic, city: string, state: string, items: Biz[], cityTotal: number) {
  const n = items.length;
  const best = items[0];
  const avg = avgRating(items);
  const label = lc(t.label);
  const late = items.filter(isLateNight);
  const sun = sundayOpen(items);
  let intro: string;

  switch (t.slug) {
    case 'late-night': {
      const l = latestOf(items);
      const allNight = items.filter(open24);
      intro = `${n} spots in ${city}, ${state} stay open until 11 PM or later${allNight.length ? `, and ${allNight.length} of them are open 24 hours on at least some days` : ''}. ${l ? `Of the rest, ${l.name} stays open latest, until ${hoursFacts(l).clock(hoursFacts(l).latest!)}.` : ''} Top-rated late-night picks: ${names(items)}.`;
      break;
    }
    case 'open-24-hours':
      intro = `${n} places in ${city} are open around the clock on at least some days of the week, including ${names(items)}.`;
      break;
    case 'open-early': {
      const e = earliestOf(items);
      intro = `${n} spots in ${city} open at 7 AM or earlier${e ? ` — ${e.name} is first, at ${hoursFacts(e).clock(hoursFacts(e).earliest!)}` : ''}. Best-rated early options: ${names(items)}.`;
      break;
    }
    case 'open-sunday':
      intro = `${n} of the ${cityTotal} places we list in ${city} are open on Sunday. The best-rated Sunday options are ${names(items)}.`;
      break;
    case 'wheelchair-accessible':
      intro = `${n} spots in ${city} list wheelchair-accessible entrances, parking, restrooms or seating. Highest-rated among them: ${names(items)}.`;
      break;
    case 'top-rated':
      intro = `${n} spots in ${city} average 4.6 stars or better with at least 250 Google reviews each — consistently loved, not just lucky. ${best ? `${best.name} leads at ${stars(best)}.` : ''}`;
      break;
    case 'hidden-gems':
      intro = `${n} spots in ${city} rate 4.7 stars or higher but have fewer than 400 Google reviews — great places more people should know about, led by ${names(items)}.`;
      break;
    default:
      intro = `We ranked ${n} ${label} in ${city}, ${state} by Google rating and review volume${avg ? ` (average ${avg.toFixed(1)}★)` : ''}. ${best ? `${best.name} comes out on top at ${stars(best)}.` : ''}${late.length ? ` ${late.length} ${late.length === 1 ? 'stays' : 'stay'} open until 11 PM or later.` : ''}`;
  }

  const faqs: { q: string; a: string }[] = [];
  if (best) faqs.push({ q: `What are the best ${t.kind === 'feature' ? lc(t.label) : label} in ${city}?`, a: `By Google rating and review volume: ${items.slice(0, 5).map((b) => `${b.name} (${b.googleRating?.toFixed(1) ?? '—'}★)`).join(', ')}.` });
  const mr = mostReviewed(items);
  if (mr?.googleReviewCount) faqs.push({ q: `Which is the most popular?`, a: `${mr.name} has the most Google reviews of the group (${mr.googleReviewCount.toLocaleString()}), with a ${mr.googleRating?.toFixed(1)}-star average.` });
  if (t.slug !== 'late-night' && t.kind !== 'feature' && late.length) {
    const l = latestOf(late);
    faqs.push({ q: `Which ${label} in ${city} are open late?`, a: `${late.length} stay open until 11 PM or later: ${names(late, 4)}${l ? `. ${l.name} is open latest, until ${hoursFacts(l).clock(hoursFacts(l).latest!)}` : ''}.` });
  }
  if (t.slug !== 'open-sunday')
    faqs.push({ q: `Are ${t.kind === 'feature' ? 'these spots' : label} in ${city} open on Sunday?`, a: sun.length ? `${sun.length} of ${n} are open on Sundays, including ${names(sun)}.` : `None of these are open on Sundays.` });
  faqs.push({ q: `How many ${t.kind === 'feature' ? lc(t.label) : label} are in ${city}?`, a: `GOTYOU lists ${n} in ${city}, ${state}. Hours, phone numbers and directions are on each listing.` });
  return { intro, faqs };
}

export function dealsCopy(t: Topic, city: string, state: string, items: Biz[]) {
  const n = items.length;
  const onGotyou = items.filter((b) => b.claimStatus === 'claimed');
  const short = t.short;
  const intro = `Looking for ${short} deals in ${city}? Here are ${n} ${lc(t.label)} in ${city}, ${state}, ranked by rating. With the free GOTYOU app, a local spot drops one offer every day at 11:23 AM, and you earn cash back for checking in at participating businesses.`;
  const faqs = [
    { q: `How do I get ${short} deals in ${city}?`, a: `Download GOTYOU and tune in to the 11:23 Daily Drop — one real local offer a day, live for a limited time. You also earn cash rewards for checking in, leaving feedback and sharing at participating businesses. Offers change daily, so open the app to see what’s live near you.` },
    { q: `Which ${lc(t.label)} in ${city} are on GOTYOU?`, a: onGotyou.length ? `${names(onGotyou, 6)} ${onGotyou.length === 1 ? 'is' : 'are'} on GOTYOU right now.` : `New businesses join GOTYOU every week. If you own one of the ${lc(t.label)} listed here, claim your free listing to start sending offers to locals nearby.` },
    { q: `What are the best ${lc(t.label)} in ${city}?`, a: `By Google rating and review volume: ${items.slice(0, 5).map((b) => `${b.name} (${b.googleRating?.toFixed(1) ?? '—'}★)`).join(', ')}.` },
    { q: `Is GOTYOU free?`, a: `Yes. GOTYOU is free to download and free to use, on iPhone and Android.` },
  ];
  return { intro, faqs };
}

export function lateCopy(t: Topic, city: string, state: string, items: Biz[]) {
  const l = latestOf(items);
  const allNight = items.filter(open24);
  const intro = `${items.length} ${lc(t.label)} in ${city}, ${state} stay open until 11 PM or later${allNight.length ? ` (${names(allNight, 2)} ${allNight.length === 1 ? 'is' : 'are'} open 24 hours on some days)` : ''}${l ? `, and ${l.name} is open until ${hoursFacts(l).clock(hoursFacts(l).latest!)}` : ''}. Ranked by rating: ${names(items)}.`;
  const sun = sundayOpen(items);
  const faqs = [
    { q: `What ${t.short} is open late in ${city}?`, a: `${items.slice(0, 5).map((b) => b.name).join(', ')} all stay open until at least 11 PM on some nights.` },
    ...(l ? [{ q: `What’s the latest-open ${t.short} spot in ${city}?`, a: `${l.name}, open until ${hoursFacts(l).clock(hoursFacts(l).latest!)}.` }] : []),
    { q: `Are any open late on Sunday?`, a: sun.length ? `${sun.length} are open on Sundays: ${names(sun)}. Check each listing for Sunday closing times.` : `None of these are open on Sundays.` },
  ];
  return { intro, faqs };
}
