// Which listings the site publishes right now. Every listing file stays in src/content/businesses;
// anything outside these cities is simply not built (no profile, city, topic, search or sitemap entry).
// To open a new area, add its cities here. Set VISIBLE_AREAS to null to publish everything.
type Area = { name: string; state: string; cities: string[] };

export const VISIBLE_AREAS: Area[] | null = [
  { name: 'East Valley', state: 'AZ', cities: ['Tempe', 'Mesa', 'Chandler', 'Scottsdale', 'Gilbert'] },
  {
    name: 'Utah County',
    state: 'UT',
    cities: [
      'Provo', 'Orem', 'Lehi', 'American Fork', 'Pleasant Grove', 'Springville', 'Spanish Fork',
      'Saratoga Springs', 'Eagle Mountain', 'Highland', 'Lindon', 'Alpine', 'Cedar Hills', 'Mapleton',
      'Vineyard', 'Payson', 'Salem', 'Santaquin', 'Elk Ridge', 'Woodland Hills', 'Genola', 'Goshen',
      'Cedar Fort', 'Fairfield',
    ],
  },
];

const allowed = VISIBLE_AREAS && new Set(VISIBLE_AREAS.flatMap((a) => a.cities.map((c) => `${c.toLowerCase()}|${a.state}`)));

export const isVisible = (b: { city: string; state: string }) => !allowed || allowed.has(`${b.city.toLowerCase()}|${b.state}`);

/** Filter for getCollection('businesses', visibleEntry). */
export const visibleEntry = ({ data }: { data: { city: string; state: string } }) => isVisible(data);

const STATE_NAMES: Record<string, string> = { AZ: 'Arizona', UT: 'Utah', NV: 'Nevada', CO: 'Colorado', ID: 'Idaho', FL: 'Florida', CA: 'California', TX: 'Texas' };
export const stateName = (s: string) => STATE_NAMES[s] ?? s;

const areaByCity = new Map((VISIBLE_AREAS ?? []).flatMap((a) => a.cities.map((c) => [`${c.toLowerCase()}|${a.state}`, a.name])));

/** The directory's area for a listing: its VISIBLE_AREAS entry, or its state when no areas are configured. */
export const areaOf = (b: { city: string; state: string }) => areaByCity.get(`${b.city.toLowerCase()}|${b.state}`) ?? stateName(b.state);
