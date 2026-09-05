import { CANONICAL_CATEGORIES, canonical } from '@/lib/taxonomy';
import type { PhotoSource } from '@/components/ui';
import { i18n } from '@/i18n';
import { dateFromIso, formatDate } from '@/i18n/format';
import { CATALOG, type CatalogEntry, type Party, type Register } from './catalog';
import { PHOTO } from './photos';
import { catalogPhoto } from './storage';

// Hard-coded sample content so the screens have something real to lay out. The
// catalog below is baked from the bucket-list database at release rather than
// fetched; only its artwork travels, from the object store.
//
// Two sources feed the catalog. Fourteen wants are hand-authored: they carry the
// places, notes and real activities nothing generated can supply. The rest are
// derived from the bundled `CATALOG`, so the browsable list is real catalog
// content with its own photography rather than twenty-six repeated stock frames.
//
// Nothing here carries a date or a set of people. Those exist only because the
// signed-in person made them, which is what keeps a new account's first screen
// theirs rather than someone else's history.

/**
 * The filter chips. 'All' is the absence of a filter, then the nine canonical
 * shelves the API serves - see `@/lib/taxonomy`. The bundled catalog predates
 * these names and is mapped through `canonical` where WANTS is built, so demo
 * and live builds filter on the same vocabulary.
 */
export const CATEGORIES = ['All', ...CANONICAL_CATEGORIES] as const;
export type Category = (typeof CATEGORIES)[number];

export type Place = {
  id: string;
  provider: 'manual';
  providerPlaceId?: string;
  name: string;
  area: string;
  address?: string;
  latitude: number;
  longitude: number;
  kind: 'area' | 'venue';
};

export type RealActivity = {
  name: string;
  sourceLabel: string;
};

/**
 * A Want is the placeless primitive: something you want to do, recorded before it
 * has a date or a location. It becomes a plan when `planned` is set — that
 * promotion is the core product move, so it lives on the type from day one.
 */
export type Want = {
  id: string;
  title: string;
  /** The catalog concept used for matching when the visible activity is specific. */
  canonicalTitle?: string;
  category: Category;
  subcategory?: string;
  tags?: string[];
  photo: PhotoSource;
  note?: string;
  saves: number;
  kind?: 'want' | 'need' | 'goal';
  /** The catalog entry this came from. Absent on wants a person typed themselves. */
  slug?: string;
  /** How big a lift it is: an evening, a project, a once-in-a-lifetime. */
  register: Register;
  /** Who it takes. `any` means the item puts no requirement on the party at all. */
  party: Party;
  /** Closed-vocabulary needs from the catalog. Most entries carry none. */
  needs: string[];
  /** Broad scope keeps the Want matchable without pretending it has an exact pin. */
  locationScope?: string;
  /** A real map result. Exact place data does not get copied into the title. */
  place?: Place;
  /** A named, real-world offering attached to the canonical Want. */
  activity?: RealActivity;
  /** ISO date. Present once the Want has been promoted to a plan. Never authored:
   *  a date only exists because the person locked one. */
  planned?: string;
};

const BY_SLUG = new Map(CATALOG.map((entry) => [entry.slug, entry]));

/** Facets a hand-authored want inherits from its catalog concept, never retyped. */
function facetsOf(slug: string): Pick<Want, 'slug' | 'register' | 'party' | 'needs'> {
  const entry = BY_SLUG.get(slug);
  if (!entry) return { register: 'project', party: 'any', needs: [] };
  return { slug, register: entry.register, party: entry.party, needs: entry.needs };
}

/**
 * The authored fourteen. `category` here is the author's, not the catalog's —
 * "Learn to surf a real break" reads as Water on this list even though the
 * catalog files the concept under Skills.
 */
// Authored in the legacy one-word vocabulary, like the generated catalog it
// sits beside. `category` is widened to string here and narrowed back by
// `canonical()` where WANTS is built, so the demo rows need no rewriting.
type AuthoredWant = Omit<Want, 'register' | 'party' | 'needs' | 'category'> & {
  slug: string;
  category: string;
};

const AUTHORED: AuthoredWant[] = [
  {
    id: 'w1',
    slug: 'see-an-aurora',
    title: 'See the northern lights',
    category: 'Nature',
    photo: PHOTO.bucketAurora,
    note: 'Somewhere with no light pollution.',
    saves: 1284,
    locationScope: 'Tromso, Norway',
  },
  {
    id: 'w2',
    slug: 'ride-a-hot-air-balloon',
    title: 'Ride a balloon at sunrise',
    category: 'Adventure',
    photo: PHOTO.bucketBalloon,
    saves: 942,
    locationScope: 'Cappadocia, Turkiye',
  },
  {
    id: 'w3',
    slug: 'learn-to-surf',
    title: 'Learn to surf a real break',
    category: 'Water',
    photo: PHOTO.bucketSurf,
    note: 'Start somewhere forgiving.',
    saves: 611,
  },
  {
    id: 'w4',
    slug: 'eat-street-food',
    title: 'Friday food crawl',
    canonicalTitle: 'Eat street food',
    category: 'Food',
    photo: PHOTO.bucketFood,
    note: 'Start with lechon, finish with mango sticky rice.',
    saves: 1503,
    place: {
      id: 'place-sugbo',
      provider: 'manual',
      name: 'Sugbo Mercado',
      area: 'Cebu City',
      address: 'Cebu City, Philippines',
      latitude: 10.3309,
      longitude: 123.9067,
      kind: 'venue',
    },
    activity: {
      name: 'Friday night food crawl',
      sourceLabel: 'Added by Bea',
    },
  },
  {
    id: 'w5',
    slug: 'dive-a-coral-reef',
    title: 'Dive a coral reef',
    category: 'Water',
    photo: PHOTO.bucketDive,
    note: 'Get certified first.',
    saves: 788,
    locationScope: 'El Nido, Palawan',
  },
  {
    id: 'w6',
    slug: 'climb-to-a-mountain-summit',
    title: 'Watch sunrise from a summit',
    category: 'Nature',
    photo: PHOTO.bucketClimb,
    saves: 1067,
  },
  {
    id: 'w7',
    slug: 'kayak-through-a-river-canyon',
    title: 'Kayak through the canyon',
    canonicalTitle: 'Go river kayaking',
    category: 'Adventure',
    photo: PHOTO.bucketKayak,
    note: 'Take the quiet route before the crowds arrive.',
    saves: 824,
    place: {
      id: 'place-kawasan',
      provider: 'manual',
      name: 'Kawasan Falls',
      area: 'Badian, Cebu',
      address: 'Badian, Cebu, Philippines',
      latitude: 9.8036,
      longitude: 123.3747,
      kind: 'venue',
    },
  },
  {
    id: 'w8',
    slug: 'learn-loom-weaving',
    title: 'Learn a traditional craft',
    category: 'Skills',
    photo: PHOTO.bucketCraft,
    note: 'Make something worth keeping.',
    saves: 437,
  },
  {
    id: 'w9',
    slug: 'explore-a-desert-landscape',
    title: 'Cross a desert landscape',
    category: 'Nature',
    photo: PHOTO.bucketDesert,
    note: 'Go slowly. Stay for the night sky.',
    saves: 706,
    locationScope: 'Wadi Rum, Jordan',
  },
  {
    id: 'w10',
    slug: 'volunteer-at-a-community-garden',
    title: 'Volunteer in a community garden',
    category: 'Community',
    photo: PHOTO.bucketGarden,
    note: 'A useful Saturday with good people.',
    saves: 319,
  },
  {
    id: 'w11',
    slug: 'attend-an-outdoor-festival',
    title: 'Catch the outdoor music set',
    canonicalTitle: 'Attend an outdoor festival',
    category: 'Culture',
    photo: PHOTO.bucketFestival,
    note: 'Stay for the last set.',
    saves: 552,
    activity: {
      name: 'Friday courtyard sessions',
      sourceLabel: 'Added by Bea',
    },
  },
  {
    id: 'w12',
    slug: 'learn-to-play-a-musical-instrument',
    title: 'Learn one song all the way through',
    category: 'Skills',
    photo: PHOTO.bucketMusic,
    note: 'No fragments. One whole song.',
    saves: 281,
    kind: 'goal',
  },
  {
    id: 'w13',
    slug: 'camp-under-the-stars',
    title: 'Camp under a sky full of stars',
    category: 'Nature',
    photo: PHOTO.bucketCamp,
    saves: 991,
  },
  {
    id: 'w14',
    slug: 'go-skydiving',
    title: 'Go skydiving once',
    category: 'Adventure',
    photo: PHOTO.bucketSkydiving,
    saves: 1208,
  },
];

export const WANTS: Want[] = AUTHORED.map((want) => ({
  ...want,
  ...facetsOf(want.slug),
  // The bundled catalog was authored against the old one-word names; the API
  // speaks the canonical nine. Mapping here means every screen downstream sees
  // one vocabulary whether it is reading demo data or the server.
  category: canonical(want.category) as Category,
}));

const AUTHORED_SLUGS = new Set(AUTHORED.map((want) => want.slug));
const AUTHORED_IDS = new Set(AUTHORED.map((want) => want.id));

/**
 * Ninety-nine catalog entries carry a facet beyond the defaults — a need, a party
 * requirement, or a register other than `project`. Those are the entries the
 * buckets can actually sort, so all of them come in. The remainder is sampled per
 * category so every browse filter has depth without shipping all 522 as one list.
 */
const CATEGORY_SAMPLE = 4;

function isShaped(entry: CatalogEntry): boolean {
  return entry.needs.length > 0 || entry.party !== 'any' || entry.register !== 'project';
}

/** Evenly spaced picks. Taking the head would sample the alphabet, not the category. */
function stride<T>(items: T[], take: number): T[] {
  if (items.length <= take) return items;
  const step = items.length / take;
  return Array.from({ length: take }, (_, index) => items[Math.floor(index * step)]!);
}

/** Round-robin by category so the browse grid never shows twenty Skills in a row. */
function interleaveByCategory(entries: CatalogEntry[]): CatalogEntry[] {
  const lanes = CATEGORIES.filter((category) => category !== 'All').map((category) =>
    entries.filter((entry) => entry.category === category),
  );
  const depth = Math.max(0, ...lanes.map((lane) => lane.length));
  const out: CatalogEntry[] = [];
  for (let row = 0; row < depth; row += 1) {
    for (const lane of lanes) {
      const entry = lane[row];
      if (entry) out.push(entry);
    }
  }
  return out;
}

/** Stable pseudo-save-count. A real number would come from the server; this one
 *  at least does not reshuffle on every reload. */
function savesFor(slug: string): number {
  let hash = 2166136261;
  for (let index = 0; index < slug.length; index += 1) {
    hash ^= slug.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return 120 + (Math.abs(hash) % 1361);
}

const SAMPLED = CATEGORIES.filter((category) => category !== 'All').flatMap((category) =>
  stride(
    CATALOG.filter((entry) => entry.category === category && !isShaped(entry)),
    CATEGORY_SAMPLE,
  ),
);

const DERIVED = interleaveByCategory(
  [...CATALOG.filter(isShaped), ...SAMPLED].filter((entry) => !AUTHORED_SLUGS.has(entry.slug)),
);

WANTS.push(
  ...DERIVED.map((entry) => ({
    id: entry.slug,
    slug: entry.slug,
    title: entry.title,
    category: canonical(entry.category) as Category,
    photo: catalogPhoto(entry.slug),
    saves: savesFor(entry.slug),
    register: entry.register,
    party: entry.party,
    needs: entry.needs,
  })),
);

/** Specificity is derived from attachments so a stale boolean cannot contradict the data. */
export function specificityOf(want: Want): 'generic' | 'scoped' | 'pinned' | 'activity' | 'planned' {
  if (want.planned) return 'planned';
  if (want.activity) return 'activity';
  if (want.place) return 'pinned';
  if (want.locationScope) return 'scoped';
  return 'generic';
}

/** Stable local label for the signed-in person; the cloud profile supplies their name. */
export const ME = 'You';
export const GORA_MEMBER = 'Gora member';

function translated(key: string, fallback: string): string {
  return i18n.t(key, { defaultValue: fallback });
}

export function personLabel(person: string): string {
  if (person === ME) return translated('shared.common.you', ME);
  if (person === GORA_MEMBER) {
    return translated('shared.common.goraMember', GORA_MEMBER);
  }
  return person;
}

/** Display helpers keep ids, category enums and user-authored source copy stable
 * while the UI reads the active language. Known catalog slugs localize; unknown
 * cloud values pass through unchanged. */
export function categoryLabel(category: Category): string {
  return translated(`shared.mock.categories.${category}`, category);
}

type WantDisplayIdentity = {
  id?: string;
  slug?: string;
  canonicalSlug?: string;
};

function authoredWantId(want: WantDisplayIdentity): string | undefined {
  return want.id && AUTHORED_IDS.has(want.id) ? want.id : undefined;
}

export function wantTitle(want: WantDisplayIdentity & { title: string }): string {
  const authoredId = authoredWantId(want);
  if (authoredId) {
    return translated(`shared.mock.wants.${authoredId}.title`, want.title);
  }

  return want.title;
}

export function wantNote(want: WantDisplayIdentity & { note?: string }): string | undefined {
  if (!want.note) return undefined;
  const authoredId = authoredWantId(want);
  return authoredId
    ? translated(`shared.mock.wants.${authoredId}.note`, want.note)
    : want.note;
}

export function wantCanonicalTitle(
  want: WantDisplayIdentity & { canonicalTitle?: string },
): string | undefined {
  if (!want.canonicalTitle) return undefined;
  const authoredId = authoredWantId(want);
  if (authoredId) {
    return translated(
      `shared.mock.wants.${authoredId}.canonicalTitle`,
      want.canonicalTitle,
    );
  }
  return want.canonicalTitle;
}

export function wantLocationScope(
  want: WantDisplayIdentity & { locationScope?: string },
): string | undefined {
  if (!want.locationScope) return undefined;
  const authoredId = authoredWantId(want);
  if (authoredId) {
    return translated(
      `shared.mock.wants.${authoredId}.locationScope`,
      want.locationScope,
    );
  }
  return want.locationScope === 'Anywhere'
    ? translated('shared.common.anywhere', want.locationScope)
    : want.locationScope;
}

export function wantActivityName(
  want: WantDisplayIdentity & { activity?: RealActivity },
): string | undefined {
  if (!want.activity) return undefined;
  const authoredId = authoredWantId(want);
  return authoredId
    ? translated(
        `shared.mock.wants.${authoredId}.activityName`,
        want.activity.name,
      )
    : want.activity.name;
}

export function wantActivitySourceLabel(
  want: WantDisplayIdentity & { activity?: RealActivity },
): string | undefined {
  if (!want.activity) return undefined;
  const authoredId = authoredWantId(want);
  return authoredId
    ? translated(
        `shared.mock.wants.${authoredId}.activitySource`,
        want.activity.sourceLabel,
      )
    : want.activity.sourceLabel;
}

/** "14 Feb 2027" — unambiguous across locales and short enough for a list row. */
function formatWhen(iso: string): string {
  return formatDate(dateFromIso(iso), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Whole days from today, negative in the past. Compared in UTC so a local
 *  timezone offset can't shift the result by a day. */
function daysUntil(iso: string, today = new Date()): number {
  const MS_PER_DAY = 86_400_000;
  const from = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const d = new Date(iso);
  const to = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((to - from) / MS_PER_DAY);
}

/**
 * A Want reads as "Someday" until it has a date — that contrast is the whole
 * product, so it is derived in one place and every surface uses the same wording.
 */
export function whenLabel(want: Want): string {
  if (!want.planned) return translated('shared.common.someday', 'Someday');
  const d = daysUntil(want.planned);
  if (d < 0) return formatWhen(want.planned);
  if (d === 0) return translated('shared.common.today', 'Today');
  if (d === 1) return translated('shared.common.tomorrow', 'Tomorrow');
  if (d <= 30) {
    return i18n.t('shared.common.inDays', {
      count: d,
      defaultValue: `In ${d} days`,
    });
  }
  return formatWhen(want.planned);
}
