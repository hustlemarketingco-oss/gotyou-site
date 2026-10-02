// Shared helpers for business listings (directory cards + profile pages).

/** Google-hosted photo URLs carry their size (=w1200-h800-k-no); ask for the rendition we need. */
export function sizedPhoto(url: string | undefined, w: number, h: number): string | undefined {
  if (!url) return undefined;
  return /=w\d+-h\d+(-k-no)?$/.test(url) ? url.replace(/=w\d+-h\d+(-k-no)?$/, `=w${w}-h${h}-k-no`) : url;
}

/** +18015551234 -> (801) 555-1234; anything else is returned unchanged. */
export function formatPhone(phone: string | undefined): string | undefined {
  const m = phone?.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : phone;
}

/** Display host for a website link, without tracking params: "locations.wendys.com". */
export function websiteHost(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export const DAYS = [
  ['mon', 'Monday'],
  ['tue', 'Tuesday'],
  ['wed', 'Wednesday'],
  ['thu', 'Thursday'],
  ['fri', 'Friday'],
  ['sat', 'Saturday'],
  ['sun', 'Sunday'],
] as const;

/** "11:00 AM - 9:00 PM, 5:00 PM - 9:00 PM" -> schema.org openingHours ranges ["11:00-21:00", ...]. */
export function to24hRanges(value: string): string[] {
  if (/open 24 hours/i.test(value)) return ['00:00-23:59'];
  const t = (s: string) => {
    const m = s.trim().match(/^(\d{1,2}):(\d{2}) (AM|PM)$/);
    if (!m) return null;
    const h = (Number(m[1]) % 12) + (m[3] === 'PM' ? 12 : 0);
    return `${String(h).padStart(2, '0')}:${m[2]}`;
  };
  return value
    .split(',')
    .map((r) => r.split(' - ').map(t))
    .filter((p): p is [string, string] => p.length === 2 && !!p[0] && !!p[1])
    .map(([a, b]) => `${a}-${b}`);
}

/** Tabler icon per GotYou display bucket. */
export const CATEGORY_ICONS: Record<string, string> = {
  Restaurant: 'ti-tools-kitchen-2',
  'Fast Food': 'ti-burger',
  Pizza: 'ti-pizza',
  'Coffee & Cafe': 'ti-coffee',
  'Desserts & Bakery': 'ti-ice-cream',
  'Mexican & Latin': 'ti-pepper',
  'Asian & Pacific': 'ti-bowl-chopsticks',
  'Bars & Pubs': 'ti-beer',
};
export const categoryIcon = (c: string) => CATEGORY_ICONS[c] ?? 'ti-building-store';
