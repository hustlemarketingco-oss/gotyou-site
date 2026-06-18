// Single source of truth for brand values referenced across layouts/components.
// Pulled from the actual GotYou brand assets (logo + app screenshots), not the
// old WordPress theme defaults.

export const BRAND = {
  name: 'GOTYOU',
  tagline: 'Empowering Digital First Consumers',
  domain: 'gotyou.co',
  appUrl: 'https://app.gotyou.co',
  supportEmail: 'info@gotyou.co',
  address: 'Santa Monica, CA 90401',
} as const;

export const COLORS = {
  blue: '#1565D8',
  blue2: '#0F52C1',
  blue3: '#0A3D9E',
  blueLight: '#E8F0FF',
  yellow: '#F5C518',
  yellow2: '#E0B010',
  bg: '#F5F3EE',
  text: '#111827',
  muted: '#5C6478',
  border: '#DDE1EA',
  green: '#22C55E',
} as const;

export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/about' },
  { label: 'Businesses', href: '/businesses' },
  { label: 'Blog', href: '/blog' },
  { label: 'Solution', href: '/solution' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Contact', href: '/contact' },
] as const;

export const SOCIAL_LINKS = [
  { label: 'Twitter/X', icon: 'ti-brand-x', href: 'https://x.com/Gotyou_official' },
  { label: 'Facebook', icon: 'ti-brand-facebook', href: 'https://www.facebook.com/profile.php?id=100083573553559' },
  { label: 'Instagram', icon: 'ti-brand-instagram', href: 'https://www.instagram.com/thegotyouapp/' },
  { label: 'TikTok', icon: 'ti-brand-tiktok', href: 'https://www.tiktok.com/@thegotyouapp' },
] as const;

// Categories seeded by default when running the Places seeding script.
// Kept here so the seed script, the directory filter pills, and any future
// admin tooling all reference the same list instead of drifting.
export const DEFAULT_CATEGORIES = [
  'Restaurant',
  'Coffee & Cafe',
  'Fitness',
  'Beauty & Spa',
  'Healthcare',
  'Retail',
  'Automotive',
  'Education',
  'Home Services',
  'Professional Services',
] as const;
