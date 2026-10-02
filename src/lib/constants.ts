// Single source of truth for brand values referenced across layouts/components.
// Copy and links mirror the live gotyou.co site and the GOTYOU app.

export const BRAND = {
  name: 'GOTYOU',
  tagline: 'Your city. One drop a day.',
  promise: 'The daily match between locals and the businesses near them.',
  domain: 'gotyou.co',
  appUrl: 'https://app.gotyou.co',
  merchantSignupUrl: 'https://app.gotyou.co/signup',
  supportEmail: 'info@gotyou.co',
  helloEmail: 'hello@gotyou.co',
  address: 'Santa Monica, CA 90401',
  appStoreUrl: 'https://apps.apple.com/us/app/gotyou-connect-earn/id6449746388',
  playStoreUrl: 'https://play.google.com/store/apps/details?id=com.gotyou.mobile',
  jobsUrl: 'https://gotyou.co/job-openings/',
} as const;

export const NAV_LINKS = [
  { label: 'Explore', href: '/businesses' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'For business', href: '/solution' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Blog', href: '/blog' },
] as const;

export const FOOTER_LINKS = [
  {
    title: 'GOTYOU app',
    links: [
      { label: 'Download the app', href: '/download' },
      { label: 'Explore local spots', href: '/businesses' },
      { label: 'Where GOTYOU works', href: '/where-gotyou-works' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  {
    title: 'For business',
    links: [
      { label: 'How it works for merchants', href: '/solution' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Claim your listing', href: '/businesses' },
      { label: 'Merchant login', href: 'https://app.gotyou.co' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About us', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Careers', href: 'https://gotyou.co/job-openings/' },
      { label: 'Contact', href: '/contact' },
    ],
  },
] as const;

export const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms & Conditions', href: '/terms-and-conditions' },
  { label: 'Terms of Service', href: '/terms-of-service' },
] as const;

export const SOCIAL_LINKS = [
  { label: 'Instagram', icon: 'ti-brand-instagram', href: 'https://www.instagram.com/thegotyouapp/' },
  { label: 'TikTok', icon: 'ti-brand-tiktok', href: 'https://www.tiktok.com/@thegotyouapp' },
  { label: 'Facebook', icon: 'ti-brand-facebook', href: 'https://www.facebook.com/profile.php?id=100083573553559' },
  { label: 'X', icon: 'ti-brand-x', href: 'https://x.com/Gotyou_official' },
] as const;

// From gotyou.co/earn-today ("Where GOTYOU Works"). drops = when 11:23 Daily Drops go live.
export const ZONES = [
  { state: 'Utah', cities: [['St George', 'Live'], ['Provo', 'Q1 2026'], ['American Fork', 'Q2 2026']] },
  { state: 'Arizona', cities: [['Tempe', 'Q1 2026']] },
  { state: 'California', cities: [['Irvine', 'Q2 2026']] },
  { state: 'Texas', cities: [['Austin', 'Q2 2026'], ['College Station', 'Q2 2026'], ['Waco', 'Q2 2026']] },
  { state: 'Florida', cities: [['Gainesville', 'Q2 2026'], ['Davie', 'Q2 2026']] },
  { state: 'Georgia', cities: [['Athens', 'Q2 2026'], ['Savannah', 'Q2 2026']] },
  { state: 'Tennessee', cities: [['Knoxville', 'Q1 2026']] },
  { state: 'Louisiana', cities: [['Baton Rouge', 'Q1 2026']] },
  { state: 'North Carolina', cities: [['Raleigh', 'Q2 2026'], ['Durham', 'Q2 2026'], ['Chapel Hill', 'Q2 2026']] },
  { state: 'South Carolina', cities: [['Greenville', 'Q2 2026']] },
  { state: 'Virginia', cities: [['Richmond', 'Q2 2026']] },
  { state: 'Kentucky', cities: [['Lexington', 'Q2 2026']] },
] as const;
