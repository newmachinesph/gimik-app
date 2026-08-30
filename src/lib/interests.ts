/**
 * The interest bank: Bumble's thirteen shelves, restocked for the Philippines.
 * Every interest is an emoji + a name, a person wears at most ten, and each
 * carries the catalog categories it leans toward so onboarding can score
 * starter somedays from the same picks.
 *
 * Identity guardrail: interests, languages, hometown - yes. Body statistics -
 * never.
 */

export const MAX_INTERESTS = 10;

export type Interest = { slug: string; emoji: string; label: string; cats: string[] };
export type InterestGroup = { slug: string; emoji: string; label: string; items: Interest[] };

export const INTEREST_GROUPS: InterestGroup[] = [
  {
    slug: 'selfcare', emoji: '\u{1F33F}', label: 'Self-care',
    items: [
      { slug: 'beach-day', emoji: '\u{1F3DD}', label: 'Beach day', cats: ['Water', 'Nature'] },
      { slug: 'nature-walks', emoji: '\u{1F343}', label: 'Nature walks', cats: ['Nature'] },
      { slug: 'slow-mornings', emoji: '\u{2615}', label: 'Slow mornings', cats: ['Food'] },
      { slug: 'meditation', emoji: '\u{1F9D8}', label: 'Meditation', cats: ['Nature', 'Skills'] },
      { slug: 'spa-day', emoji: '\u{1F486}', label: 'Spa day', cats: ['Cities'] },
      { slug: 'journaling', emoji: '\u{270D}\u{FE0F}', label: 'Journaling', cats: ['Skills'] },
    ],
  },
  {
    slug: 'sports', emoji: '\u{1F3C0}', label: 'Sports',
    items: [
      { slug: 'basketball', emoji: '\u{1F3C0}', label: 'Basketball', cats: ['Fitness'] },
      { slug: 'volleyball', emoji: '\u{1F3D0}', label: 'Volleyball', cats: ['Fitness'] },
      { slug: 'badminton', emoji: '\u{1F3F8}', label: 'Badminton', cats: ['Fitness'] },
      { slug: 'running', emoji: '\u{1F3C3}', label: 'Running', cats: ['Fitness'] },
      { slug: 'boxing', emoji: '\u{1F94A}', label: 'Boxing', cats: ['Fitness'] },
      { slug: 'cycling', emoji: '\u{1F6B4}', label: 'Cycling', cats: ['Fitness', 'Adventure'] },
      { slug: 'swimming', emoji: '\u{1F3CA}', label: 'Swimming', cats: ['Water', 'Fitness'] },
      { slug: 'surfing', emoji: '\u{1F3C4}', label: 'Surfing', cats: ['Water', 'Adventure'] },
      { slug: 'freediving', emoji: '\u{1F93F}', label: 'Freediving', cats: ['Water', 'Adventure'] },
      { slug: 'hiking', emoji: '\u{1F97E}', label: 'Hiking', cats: ['Adventure', 'Nature'] },
      { slug: 'climbing', emoji: '\u{1F9D7}', label: 'Climbing', cats: ['Adventure', 'Fitness'] },
    ],
  },
  {
    slug: 'creativity', emoji: '\u{1F3A8}', label: 'Creativity',
    items: [
      { slug: 'photography', emoji: '\u{1F4F7}', label: 'Photography', cats: ['Cities', 'Nature'] },
      { slug: 'art', emoji: '\u{1F3A8}', label: 'Art', cats: ['Culture', 'Skills'] },
      { slug: 'crafts', emoji: '\u{1F9F6}', label: 'Crafts', cats: ['Skills', 'Culture'] },
      { slug: 'dance', emoji: '\u{1F483}', label: 'Dance', cats: ['Fitness', 'Culture'] },
      { slug: 'writing', emoji: '\u{1F58B}', label: 'Writing', cats: ['Skills'] },
      { slug: 'content-making', emoji: '\u{1F3AC}', label: 'Content making', cats: ['Cities', 'Skills'] },
    ],
  },
  {
    slug: 'goingout', emoji: '\u{1F389}', label: 'Going out',
    items: [
      { slug: 'karaoke', emoji: '\u{1F3A4}', label: 'Karaoke', cats: ['Culture', 'Community'] },
      { slug: 'inuman', emoji: '\u{1F37B}', label: 'Inuman sessions', cats: ['Food', 'Community'] },
      { slug: 'night-markets', emoji: '\u{1F303}', label: 'Night markets', cats: ['Food', 'Cities'] },
      { slug: 'live-gigs', emoji: '\u{1F3B6}', label: 'Live gigs', cats: ['Culture', 'Cities'] },
      { slug: 'fiestas', emoji: '\u{1F38A}', label: 'Fiestas', cats: ['Culture', 'Community'] },
      { slug: 'cafe-hopping', emoji: '\u{2615}', label: 'Café hopping', cats: ['Food', 'Cities'] },
      { slug: 'malling', emoji: '\u{1F6CD}', label: 'Malling', cats: ['Cities'] },
    ],
  },
  {
    slug: 'stayingin', emoji: '\u{1F3E1}', label: 'Staying in',
    items: [
      { slug: 'gaming', emoji: '\u{1F3AE}', label: 'Gaming', cats: ['Skills'] },
      { slug: 'board-games', emoji: '\u{1F3B2}', label: 'Board games', cats: ['Community', 'Skills'] },
      { slug: 'movie-nights', emoji: '\u{1F37F}', label: 'Movie nights', cats: ['Culture'] },
      { slug: 'plantita', emoji: '\u{1FAB4}', label: 'Plantita life', cats: ['Nature'] },
      { slug: 'home-workouts', emoji: '\u{1F4AA}', label: 'Home workouts', cats: ['Fitness'] },
    ],
  },
  {
    slug: 'filmtv', emoji: '\u{1F3AC}', label: 'Film & TV',
    items: [
      { slug: 'filipino-cinema', emoji: '\u{1F39E}', label: 'Filipino cinema', cats: ['Culture'] },
      { slug: 'kdramas', emoji: '\u{1F4FA}', label: 'K-dramas', cats: ['Culture'] },
      { slug: 'anime', emoji: '\u{1F363}', label: 'Anime', cats: ['Culture'] },
      { slug: 'documentaries', emoji: '\u{1F4FD}', label: 'Documentaries', cats: ['Culture'] },
      { slug: 'teleserye', emoji: '\u{1F4FA}', label: 'Teleserye', cats: ['Culture'] },
    ],
  },
  {
    slug: 'reading', emoji: '\u{1F4DA}', label: 'Reading',
    items: [
      { slug: 'books', emoji: '\u{1F4DA}', label: 'Books', cats: ['Skills'] },
      { slug: 'komiks', emoji: '\u{1F4D6}', label: 'Komiks', cats: ['Culture'] },
      { slug: 'poetry', emoji: '\u{1F4DC}', label: 'Poetry', cats: ['Culture'] },
      { slug: 'book-clubs', emoji: '\u{1F465}', label: 'Book clubs', cats: ['Community'] },
    ],
  },
  {
    slug: 'music', emoji: '\u{1F3A7}', label: 'Music',
    items: [
      { slug: 'opm', emoji: '\u{1F1F5}\u{1F1ED}', label: 'OPM', cats: ['Culture'] },
      { slug: 'playing-music', emoji: '\u{1F3B8}', label: 'Playing music', cats: ['Skills', 'Culture'] },
      { slug: 'concerts', emoji: '\u{1F3A4}', label: 'Concerts', cats: ['Culture', 'Cities'] },
      { slug: 'playlists', emoji: '\u{1F3A7}', label: 'Playlists', cats: ['Culture'] },
      { slug: 'choir', emoji: '\u{1F3B5}', label: 'Choir', cats: ['Community', 'Culture'] },
    ],
  },
  {
    slug: 'fooddrink', emoji: '\u{1F35C}', label: 'Food & drink',
    items: [
      { slug: 'street-food', emoji: '\u{1F362}', label: 'Street food', cats: ['Food'] },
      { slug: 'home-cooking', emoji: '\u{1F373}', label: 'Home cooking', cats: ['Food', 'Skills'] },
      { slug: 'baking', emoji: '\u{1F9C1}', label: 'Baking', cats: ['Food', 'Skills'] },
      { slug: 'coffee', emoji: '\u{2615}', label: 'Coffee', cats: ['Food'] },
      { slug: 'milk-tea', emoji: '\u{1F9CB}', label: 'Milk tea', cats: ['Food'] },
      { slug: 'seafood', emoji: '\u{1F990}', label: 'Seafood', cats: ['Food', 'Water'] },
      { slug: 'vegetarian', emoji: '\u{1F957}', label: 'Vegetarian', cats: ['Food'] },
    ],
  },
  {
    slug: 'traveling', emoji: '\u{2708}\u{FE0F}', label: 'Traveling',
    items: [
      { slug: 'island-hopping', emoji: '\u{1F6A4}', label: 'Island hopping', cats: ['Water', 'Adventure'] },
      { slug: 'road-trips', emoji: '\u{1F699}', label: 'Road trips', cats: ['Adventure', 'Cities'] },
      { slug: 'camping', emoji: '\u{26FA}', label: 'Camping', cats: ['Nature', 'Adventure'] },
      { slug: 'mountains', emoji: '\u{26F0}', label: 'Mountains', cats: ['Adventure', 'Nature'] },
      { slug: 'waterfalls', emoji: '\u{1F4A6}', label: 'Waterfalls', cats: ['Nature', 'Water'] },
      { slug: 'heritage-towns', emoji: '\u{1F3DB}', label: 'Heritage towns', cats: ['Culture', 'Cities'] },
      { slug: 'abroad', emoji: '\u{1F30F}', label: 'Traveling abroad', cats: ['Cities', 'Adventure'] },
    ],
  },
  {
    slug: 'pets', emoji: '\u{1F43E}', label: 'Pets',
    items: [
      { slug: 'dogs', emoji: '\u{1F436}', label: 'Dogs', cats: ['Nature', 'Community'] },
      { slug: 'cats', emoji: '\u{1F431}', label: 'Cats', cats: ['Nature'] },
      { slug: 'aspins-puspins', emoji: '\u{1F415}', label: 'Aspins & puspins', cats: ['Community'] },
      { slug: 'fish-keeping', emoji: '\u{1F420}', label: 'Fish keeping', cats: ['Water'] },
    ],
  },
  {
    slug: 'personality', emoji: '\u{2728}', label: 'Personality',
    items: [
      { slug: 'early-riser', emoji: '\u{1F305}', label: 'Early riser', cats: ['Nature', 'Fitness'] },
      { slug: 'night-owl', emoji: '\u{1F989}', label: 'Night owl', cats: ['Cities'] },
      { slug: 'planner', emoji: '\u{1F5FA}', label: 'Planner', cats: ['Skills'] },
      { slug: 'spontaneous', emoji: '\u{1F3B2}', label: 'Spontaneous', cats: ['Adventure'] },
      { slug: 'introvert', emoji: '\u{1F92B}', label: 'Introvert', cats: ['Skills', 'Nature'] },
      { slug: 'extrovert', emoji: '\u{1F38A}', label: 'Extrovert', cats: ['Community', 'Cities'] },
    ],
  },
  {
    slug: 'values', emoji: '\u{1F91D}', label: 'Values & allyship',
    items: [
      { slug: 'lgbtq-ally', emoji: '\u{1F3F3}\u{FE0F}\u{200D}\u{1F308}', label: 'LGBTQ+ ally', cats: ['Community'] },
      { slug: 'environmentalism', emoji: '\u{267B}\u{FE0F}', label: 'Environmentalism', cats: ['Nature', 'Community'] },
      { slug: 'volunteering', emoji: '\u{1F91D}', label: 'Volunteering', cats: ['Community'] },
      { slug: 'animal-welfare', emoji: '\u{1F43E}', label: 'Animal welfare', cats: ['Community', 'Nature'] },
      { slug: 'bayanihan', emoji: '\u{1F3D8}', label: 'Bayanihan', cats: ['Community'] },
      { slug: 'inclusivity', emoji: '\u{270A}', label: 'Inclusivity', cats: ['Community'] },
    ],
  },
];

export const INTEREST_BY_SLUG = new Map<string, Interest>(
  INTEREST_GROUPS.flatMap((group) => group.items.map((item) => [item.slug, item] as const)),
);

/** "🏄 Surfing" - or undefined for a slug that left the bank. */
export function interestBadge(slug: string): string | undefined {
  const item = INTEREST_BY_SLUG.get(slug);
  return item ? `${item.emoji} ${item.label}` : undefined;
}

/** Catalog categories a set of picked interests leans toward, for starter scoring. */
export function interestCategories(slugs: string[]): Set<string> {
  const cats = new Set<string>();
  for (const slug of slugs) {
    for (const cat of INTEREST_BY_SLUG.get(slug)?.cats ?? []) cats.add(cat);
  }
  return cats;
}

/**
 * The first interest picker was the thirteen "needs" (calm, fun, awe...).
 * Anyone who onboarded then still carries those slugs, and they would render
 * as nothing at all. Each maps to its nearest neighbour in the bank so their
 * badges survive the change rather than silently emptying.
 */
const LEGACY_NEEDS: Record<string, string> = {
  calm: 'slow-mornings',
  fun: 'karaoke',
  health: 'running',
  adventure: 'hiking',
  awe: 'mountains',
  growth: 'books',
  creativity: 'art',
  connection: 'board-games',
  romance: 'beach-day',
  courage: 'climbing',
  family: 'movie-nights',
  community: 'volunteering',
  legacy: 'environmentalism',
};

/** Old need slugs in, bank slugs out; anything already current passes through. */
export function migrateInterests(slugs: string[]): string[] {
  const migrated = slugs.map((slug) => (INTEREST_BY_SLUG.has(slug) ? slug : LEGACY_NEEDS[slug]));
  return [...new Set(migrated.filter(Boolean))].slice(0, MAX_INTERESTS);
}

/**
 * The interest that explains why a card is in your deck: the first one you
 * picked whose categories include this card's. Undefined when nothing you
 * picked points here - the card then says nothing rather than guessing.
 */
export function matchedInterestLabel(slugs: string[], category: string): string | undefined {
  for (const slug of slugs) {
    const item = INTEREST_BY_SLUG.get(slug);
    if (item?.cats.includes(category)) return `${item.emoji} ${item.label}`;
  }
  return undefined;
}

/** Emoji per catalog category, for seeded people's leans. */
export const CATEGORY_EMOJI: Record<string, string> = {
  Food: '\u{1F35C}',
  Nature: '\u{1F33F}',
  Adventure: '\u{1F9D7}',
  Water: '\u{1F30A}',
  Cities: '\u{1F3D9}',
  Culture: '\u{1F3AD}',
  Fitness: '\u{1F3C3}',
  Skills: '\u{1F6E0}',
  Community: '\u{1F30D}',
};

export function categoryBadge(category: string): string {
  const emoji = CATEGORY_EMOJI[category];
  return emoji ? `${emoji} ${category}` : category;
}

/**
 * A category as a filter chip: the same emoji language the interest bank
 * speaks, wrapped around whatever label the app is currently showing. "All"
 * has no emoji and passes through, which is the point - it is not a category.
 */
export function categoryChip(category: string, label: string): string {
  const emoji = CATEGORY_EMOJI[category];
  return emoji ? `${emoji} ${label}` : label;
}
