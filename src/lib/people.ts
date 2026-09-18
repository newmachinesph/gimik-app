import { canonical } from '@/lib/taxonomy';

import { registeredPeople, registeredPerson } from './registry';
import { CATALOG } from './catalog';
import { personPhotos } from './storage';
import { ME, WANTS, type Category, type Want } from './mock';

/**
 * The seeded world. Matching is the move the product is named for, so it is
 * computed here rather than typed as a constant on a screen: every person below
 * holds a real someday list derived from the catalog, and every overlap number in
 * the app is the size of an intersection with that list.
 *
 * `leans` is the person's taste — the categories they say yes to more often. It
 * is the only authored input; membership itself is derived.
 */
export type Person = {
  id: string;
  name: string;
  /**
   * The API keys people by handle; the app has always keyed them by name,
   * because in a world with no server that is the identity. Carried here so a
   * person the server told us about can be fetched again. Absent on the
   * bundled cast, who have no server rows.
   */
  handle?: string;
  createdAt?: string;
  leans: string[];
  gender: 'woman' | 'man' | 'nonbinary';
  age: number;
  city: string;
  bio: string;
  /** Bumble-style headline facts. */
  work: string;
  education: string;
  hometown: string;
  languages: string[];
  /** How many portraits the object store holds for them, `people/<id>-N.webp`. */
  photoCount: number;
  /**
   * The actual photo URLs, for people the server described.
   *
   * The bundled cast's portraits are editorial, public, and derivable from the
   * id. A real account's are private objects served by presigned URL, so they
   * cannot be composed from anything - guessing `people/<uuid>-1.webp` for a
   * real person just renders a broken image. Present means "use these".
   */
  photos?: string[];
};

/** The seeded world. Gender, age and city are set on each person, never guessed. */
export const PEOPLE: Person[] = [
  { id: 'mara', name: 'Mara Ilagan', leans: ['Nature', 'Adventure', 'Water'], gender: 'woman', age: 27, city: 'Cebu City', bio: 'Weekend diver. Will drive three hours for a good sunrise.', work: 'Marine biologist, Oceana', education: 'BS Biology, UP Cebu', hometown: 'Dumaguete', languages: ['bisaya','filipino','english'], photoCount: 5, },
  { id: 'jon', name: 'Jon Reyes', leans: ['Food', 'Cities', 'Culture'], gender: 'man', age: 31, city: 'Makati', bio: 'Eats his way through every city. Ask me about lechon.', work: 'Sous chef, Toyo Eatery', education: 'Culinary Arts, Enderun', hometown: 'Batangas City', languages: ['filipino','english'], photoCount: 4, },
  { id: 'ana', name: 'Ana Cruz', leans: ['Water', 'Community', 'Fitness'], gender: 'woman', age: 25, city: 'Lapu-Lapu', bio: 'Freediver, beach cleanup regular, terrible at karaoke.', work: 'Dive instructor, Freedive Cebu', education: 'BS Tourism, USC', hometown: 'Lapu-Lapu', languages: ['bisaya','english'], photoCount: 5, },
  { id: 'theo', name: 'Theo Lim', leans: ['Skills', 'Culture', 'Cities'], gender: 'man', age: 29, city: 'Quezon City', bio: 'Learning things for the sake of it. Currently: pottery.', work: 'Software engineer, Canva', education: 'BS Computer Science, Ateneo', hometown: 'Baguio', languages: ['filipino','english','mandarin'], photoCount: 3, },
  { id: 'noor', name: 'Noor Salcedo', leans: ['Food', 'Nature'], gender: 'woman', age: 33, city: 'Davao City', bio: 'Trail runner who plans trips around markets.', work: 'Physical therapist', education: 'BS PT, San Pedro College', hometown: 'Cotabato City', languages: ['maguindanaon','filipino','english'], photoCount: 4, },
  { id: 'kaz', name: 'Kaz Miyamoto', leans: ['Cities', 'Skills', 'Fitness'], gender: 'man', age: 28, city: 'Taguig', bio: 'Runs, climbs, and photographs cities at night.', work: 'Photographer, freelance', education: 'BFA, UST', hometown: 'Osaka', languages: ['japanese','english','filipino'], photoCount: 5, },
  { id: 'ivy', name: 'Ivy Tanaka', leans: ['Culture', 'Community'], gender: 'nonbinary', age: 26, city: 'Iloilo City', bio: 'Museums, folk art, and long train rides.', work: 'Museum programs officer, ILOMOCA', education: 'AB Art Studies, UP Visayas', hometown: 'Iloilo City', languages: ['hiligaynon','filipino','english'], photoCount: 3, },
  { id: 'ren', name: 'Ren Ocampo', leans: ['Adventure', 'Fitness', 'Water'], gender: 'man', age: 30, city: 'Baguio', bio: 'Mountain weekends. Coffee first.', work: 'Mountain guide, Cordillera Treks', education: 'BS Forestry, Benguet State', hometown: 'La Trinidad', languages: ['ilocano','filipino','english'], photoCount: 4, },
  { id: 'dani', name: 'Dani Villar', leans: ['Nature', 'Community', 'Skills'], gender: 'woman', age: 27, city: 'Manila', bio: 'Keeps a long list and a short calendar.', work: 'Project manager, WWF PH', education: 'BS Management, La Salle', hometown: 'Naga', languages: ['bikol','filipino','english'], photoCount: 4, },
];

const PEOPLE_BY_NAME = new Map(PEOPLE.map((person) => [person.name, person]));

/** A person's portraits, newest-first ordering fixed by the seed. Empty until
 *  the object store is configured, which every caller renders as initials. */
export function photosOf(person: Person) {
  return person.photos ?? personPhotos(person.id, person.photoCount);
}

/** How often a person says yes, in percent, inside and outside their taste. */
const LEAN_APPETITE = 44;
const BASE_APPETITE = 12;

/** FNV-1a. Deterministic across reloads, which is the whole point — an overlap
 *  that reshuffles on every render is a slot machine, not a match. */
function hash(value: string): number {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return Math.abs(result);
}

/**
 * Does this person hold this someday? Only catalog concepts can be held: a
 * sentence someone typed thirty seconds ago exists on exactly one list, and
 * saying otherwise is the lie this replaces.
 */
export function holds(person: Person, want: Pick<Want, 'slug' | 'category'>): boolean {
  if (!want.slug) return false;
  const appetite = person.leans.includes(want.category) ? LEAN_APPETITE : BASE_APPETITE;
  return hash(`${person.id}:${want.slug}`) % 100 < appetite;
}

/** Everyone in the seeded world who holds this someday. */
export function holdersOf(want: Pick<Want, 'slug' | 'category'>): string[] {
  return PEOPLE.filter((person) => holds(person, want)).map((person) => person.name);
}

/** One person's someday list, drawn from the same catalog the user browses. */
export function somedaysOf(name: string): Want[] {
  const person = PEOPLE_BY_NAME.get(name);
  if (!person) return [];
  return WANTS.filter((want) => holds(person, want));
}

export type Overlap = {
  /** People you are connected to — through a crew — who hold this. */
  friends: string[];
  /** People you have not met who hold it. Visible, thin, never actionable. */
  strangers: number;
  /** Everyone in the seeded world, friends included. */
  total: number;
};

export function overlapFor(
  want: Pick<Want, 'slug' | 'category'>,
  friendNames: string[],
): Overlap {
  const holders = holdersOf(want);
  const friends = holders.filter((name) => friendNames.includes(name));
  return { friends, strangers: holders.length - friends.length, total: holders.length };
}

/** The people actually on a plan: you, plus the friends who hold the someday. */
export function planPeopleFor(
  want: Pick<Want, 'slug' | 'category'>,
  friendNames: string[],
  mode: 'solo' | 'duo' | 'group',
): string[] {
  if (mode === 'solo') return [ME];
  const friends = overlapFor(want, friendNames).friends;
  if (mode === 'duo') return [ME, ...friends.slice(0, 1)];
  return [ME, ...friends];
}

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'at', 'for', 'from', 'go', 'i', 'in', 'into', 'it', 'me', 'my',
  'of', 'on', 'once', 'one', 'real', 'some', 'the', 'through', 'to', 'try', 'up',
  'want', 'wanna', 'we', 'with', 'would',
]);

function tokensOf(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

const CATALOG_MATCH_DATA = CATALOG.map((entry) => ({
  entry,
  englishTokens: tokensOf(entry.title),
}));

export type CanonicalMatch = {
  slug: string;
  title: string;
  category: Want['category'];
};

/**
 * Resolve a sentence onto a catalog concept. "street food tour" and "try
 * street food" have to land on the same someday. No match is a legitimate
 * answer — the item is then custom and held by exactly one person.
 */
export function matchCatalog(sentence: string): CanonicalMatch | undefined {
  const englishInput = tokensOf(sentence);

  let best: { entry: (typeof CATALOG)[number]; score: number } | undefined;
  for (const { entry, englishTokens } of CATALOG_MATCH_DATA) {
    const shared = englishTokens.filter((token) => englishInput.includes(token)).length;
    // Reward covering the catalog title, not merely brushing against it.
    const score = shared && englishInput.length
      ? shared / englishTokens.length + shared / englishInput.length
      : 0;
    if (!best || score > best.score) best = { entry, score };
  }
  if (!best || best.score < 1) return undefined;
  return { slug: best.entry.slug, title: best.entry.title, category: canonical(best.entry.category) as Category };
}

const BUNDLED_BY_NAME = new Map(PEOPLE.map((person) => [person.name, person]));

/**
 * Everyone this build can describe: the seeded cast, plus anyone the server has
 * mentioned this session. Exposed with `.get` so the twelve call sites that
 * already read it as a Map keep working unchanged - bundled first, because a
 * seeded person carries authored taste the wire shape does not have.
 */
export const PERSON_BY_NAME = {
  get: (name: string): Person | undefined => BUNDLED_BY_NAME.get(name) ?? registeredPerson(name),
  has: (name: string): boolean => BUNDLED_BY_NAME.has(name) || registeredPerson(name) !== undefined,
};

/** Everyone, bundled and server-known, for the screens that list rather than look up. */
export const allPeople = (): Person[] => [
  ...PEOPLE,
  ...registeredPeople().filter((person) => !BUNDLED_BY_NAME.has(person.name)),
];
export const genderMark = (gender: Person['gender']) => (gender === 'woman' ? '♀' : gender === 'man' ? '♂' : '⚥');
