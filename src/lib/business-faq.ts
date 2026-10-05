// Business-owner FAQ: loyalty programs, customer acquisition and community-led marketing.
// The questions mirror what local owners actually search for; answers give genuinely useful
// guidance first, then explain where GOTYOU fits. Facts about GOTYOU (plans, prices, guarantee,
// Counter Tap, 11:23 Daily Drop) come from the live gotyou.co pricing and solution pages.
// Answers may contain HTML links; the FAQPage JSON-LD strips tags.

const blog = (slug: string, text: string) => `<a href="/blog/${slug}/">${text}</a>`;

export const BUSINESS_FAQ_GROUPS = [
  {
    title: 'Loyalty & rewards programs',
    icon: 'ti-heart-handshake',
    items: [
      [
        'What is a customer loyalty program?',
        'A loyalty program rewards customers for coming back — points, punch cards, perks, member pricing or cash back. The goal isn’t the reward itself; it’s turning a one-time visit into a habit, because a returning customer costs far less to bring in than a brand-new one.',
      ],
      [
        'Do loyalty programs actually work for small businesses?',
        `They work when the reward is easy to understand, easy to earn, and worth something the customer cares about. They fail when customers have to download a separate app for every shop, carry a card, or wait months to earn anything. Most small-business programs stall at sign-up: people join once and never come back to redeem. Read more in ${blog('whats-wrong-with-traditional-loyalty-programs', 'What’s wrong with traditional loyalty programs')}.`,
      ],
      [
        'What’s wrong with punch cards and points apps?',
        'Punch cards get lost, can’t tell you who your customers are, and reward people who would have come back anyway. Single-store points apps add friction — customers won’t install an app for every café they visit — and the points usually have no value anywhere else. Neither one shows you which marketing brought someone in the first time.',
      ],
      [
        'How do I reward customers without giving away my margins?',
        `Reward the behavior you want — a return visit, a review, a referral, a visit during a slow hour — instead of discounting every purchase. Small, frequent rewards and status perks often beat big percentage-off coupons, which train people to wait for the next deal. See ${blog('how-local-businesses-can-thrive-without-discounts-a-lesson-from-starbucks-and-taco-bell', 'how local businesses can thrive without discounts')} and ${blog('turn-walk-ins-into-loyal-promoters-without-sacrificing-profits', 'turning walk-ins into loyal promoters without sacrificing profits')}.`,
      ],
      [
        'Are coupons and discount sites worth it?',
        `Deal sites can deliver a burst of traffic, but the customer often belongs to the platform, not to you, and many never return at full price. If you use offers, make them targeted (new customers, slow hours, lapsed regulars) and make sure you can see who redeemed them. More in ${blog('the-real-future-of-local-commerce-beyond-coupons-and-discounts', 'the real future of local commerce, beyond coupons and discounts')}.`,
      ],
      [
        'How is GOTYOU different from a typical loyalty app?',
        'Customers use one free app across every participating business, so there’s nothing new to install for your shop. Their rewards have real cash value instead of store-only points. And every visit is verified with a tap on the GOTYOU Counter Tap pad at your counter, so you know exactly who came in, how often, and what brought them — a customer list you own, not one rented from a platform.',
      ],
      [
        'Can I keep my existing loyalty program?',
        'Yes. GOTYOU works alongside the loyalty program you already run — customers can use both. Many businesses use GOTYOU to bring in new customers and verify visits, and keep their existing program for regulars.',
      ],
    ],
  },
  {
    title: 'Getting more customers',
    icon: 'ti-users-plus',
    items: [
      [
        'How do I get more customers for my local business?',
        `Start with the basics: make sure your hours, phone, address and photos are accurate everywhere people search, because a wrong listing loses customers you already earned. Then give people a specific reason to come in this week, show up when they’re deciding where to go (late morning for lunch, evenings for dinner), and give first-time visitors a reason to return. Finally, measure which channel actually puts people in the door, and spend more there. ${blog('your-next-customer-is-scrolling-be-there-or-be-forgotten', 'Your next customer is scrolling')} covers the discovery side.`,
      ],
      [
        'How do I get first-time customers to try my business?',
        'Make trying you low-risk and well-timed: a strong first-visit offer, delivered to people nearby when they’re deciding where to eat or shop. GOTYOU’s 11:23 Daily Drop does exactly that — every day at 11:23 AM, your offer goes out to opted-in locals nearby, and paid plans guarantee a set number of first-time visitors each month (we never count the same person twice). <a href="/pricing/">See plans.</a>',
      ],
      [
        'How do I bring back customers who only visited once?',
        'You need to know who they are first — which anonymous foot traffic and cash sales never tell you. With verified check-ins, every visitor becomes a named customer in your GOTYOU dashboard, so you can reach lapsed customers again with an offer worth coming back for. Bringing past customers back typically costs a fraction of finding new ones; on GOTYOU it runs through a Demand Budget you control.',
      ],
      [
        'How do I fill my slow hours?',
        'Offer something that only applies during the slow window (a 2–5 PM drink, a weekday lunch special) and get it in front of nearby people right before that window. On GOTYOU, Power Hour lets you push an offer when you need traffic, and the dashboard shows whether it actually filled the room.',
      ],
      [
        'Is Google or Facebook advertising worth it for a small business?',
        `It can be, but you pay for clicks and impressions, not visits — and ad costs keep rising while a click rarely turns into a measurable walk-in. Before spending more, make sure you can connect ad spend to people actually standing in your store. ${blog('why-local-advertising-is-broken-and-what-comes-next', 'Why local advertising is broken')} and ${blog('the-real-cost-of-advertising', 'the real cost of advertising')} go deeper.`,
      ],
      [
        'How do I know which marketing is actually working?',
        'Tie every offer to a redemption you can see. On GOTYOU, a customer claims an offer wherever they found it — a flyer, Instagram, an event, the Daily Drop — then taps to redeem in-store, and the visit is attributed to that source. You pay for real visits, not impressions, and you can compare channels side by side. Try the <a href="/roi/">ROI calculator</a> to estimate your return.',
      ],
      [
        'How much should a small business spend on marketing?',
        'A common rule of thumb is a single-digit percentage of revenue — roughly 4–6% for restaurants, 7–9% for retail, 3–8% for services — though new or growing businesses often spend more. What matters more than the number is spending it where you can measure real customers. Our <a href="/roi/">ROI calculator</a> uses those ranges to suggest a starting budget.',
      ],
      [
        'How do I keep my business information accurate online?',
        'Check your hours, phone, address and website on every directory you appear on, and update them whenever something changes — especially holiday hours. If your business is listed in the <a href="/businesses/">GOTYOU directory</a>, you can claim it for free to keep your details accurate and see who’s checking in.',
      ],
    ],
  },
  {
    title: 'Community-led marketing',
    icon: 'ti-building-community',
    items: [
      [
        'What is community-led marketing?',
        `Marketing that grows through the people around your business — regulars, neighbors, other local shops, campus groups — instead of through ad platforms. Customers recommend you, post about you and bring friends because they’re rewarded for it and feel part of something local. ${blog('how-gotyou-builds-a-better-community', 'How GOTYOU builds a better community')} explains our approach.`,
      ],
      [
        'How do I turn customers into word-of-mouth promoters?',
        'Make sharing easy and worth it: reward a referral when the friend actually visits, ask every customer for honest feedback, and give regulars status they can see. One caution: Google and Yelp don’t allow incentives for reviews posted on their sites, so keep rewards for feedback inside your own channels. On GOTYOU, customers earn for checking in, sharing and rating in the app, and referral rewards turn happy customers into ambassadors.',
      ],
      [
        'Does user-generated content help small businesses?',
        `Yes — photos, posts and reviews from real customers are more trusted than ads and keep your business visible on the platforms people actually browse. Encourage it by making it easy (good lighting, a photo-worthy item, a reason to post); if you reward posts, ask customers to disclose it. More in ${blog('leveling-the-playing-field-the-power-of-user-generated-content-for-small-businesses', 'the power of user-generated content for small businesses')} and ${blog('social-is-the-new-google', 'Social is the new Google')}.`,
      ],
      [
        'How can local businesses work together to grow?',
        `Cross-promote with complementary neighbors (a coffee shop and a bookstore, a gym and a smoothie bar), run joint events, and share audiences instead of competing for the same ad slots. A shared rewards network means a customer earning at one local spot is nudged toward the next. See ${blog('the-value-of-partnerships-within-the-community', 'the value of partnerships within the community')}.`,
      ],
      [
        'How do I market my business to college students?',
        'Students respond to timely, social, low-cost reasons to go somewhere with friends — and they move in groups. Be present near campus, time offers around class schedules and evenings, and lean on peer referrals and campus ambassadors. GOTYOU runs zones near major universities and a <a href="/ambassador/">college ambassador program</a>.',
      ],
      [
        'What is Verified Physical Commerce?',
        'It’s the category GOTYOU is building: e-commerce-style intelligence for in-person businesses. A merchant runs an offer, a real person shows up to redeem it, and a tap confirms the visit — so the customer becomes named, real and yours to bring back, and every visit builds a record of who comes in and what moves them. <a href="/about/">Read more about our mission.</a>',
      ],
    ],
  },
  {
    title: 'Getting started with GOTYOU',
    icon: 'ti-rocket',
    items: [
      [
        'How much does GOTYOU cost for businesses?',
        'The platform — merchant dashboard, AI customer discovery, local map listing, check-in and attribution tracking — is included at $0/month. You pay for customer demand: a $1 trial, or plans that guarantee 50, 100 or 200 first-time customers a month for $175, $300 or $500. <a href="/pricing/">Compare plans.</a>',
      ],
      [
        'Is there a contract?',
        'No. Every plan is month-to-month with no setup fee. Upgrade, downgrade or cancel anytime from your merchant dashboard.',
      ],
      [
        'What happens if GOTYOU doesn’t deliver the customers I paid for?',
        'Paid plans guarantee a specific number of first-time visitors each billing cycle. If we fall short, we keep running your campaign until we deliver, or refund the undelivered portion.',
      ],
      [
        'What kinds of businesses is GOTYOU best for?',
        'Standard plans are built for everyday, high-frequency businesses with an average ticket under $25 — coffee shops, bakeries, quick-service restaurants and casual retail. For spas, salons, fine dining, medical and other higher-ticket businesses, we build a custom Demand Plan. <a href="mailto:hello@gotyou.co?subject=Custom%20GOTYOU%20Demand%20Plan">Ask about a custom plan.</a>',
      ],
      [
        'Do I need special hardware?',
        'Check-ins use the GOTYOU Counter Tap NFC pad at your counter. The In-Store Kit (pad, table tents and window stickers) is included free with GOTYOU 50, 100 and 200, or $50 on its own.',
      ],
      [
        'How quickly can I get started?',
        'Setup takes minutes — your first 11:23 Daily Drop can run tomorrow. <a href="https://app.gotyou.co">Create your merchant account</a>, or <a href="/solution/">see how it works for merchants</a>.',
      ],
    ],
  },
] as const;
