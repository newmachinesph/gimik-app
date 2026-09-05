/**
 * The nine shelves, and the older names that fold into them.
 *
 * This mirrors `app/taxonomy.py` on the server, and has to: the chips send a
 * category as a filter and the cards come back carrying one, so if the two
 * sides disagree about what a category is called, a chip returns an empty grid.
 *
 * The catalog arrived in two waves - 522 concepts written against one-word
 * names (Food, Nature, Skills) and a 2,000-activity export using a broader nine
 * (Food & Drink, Nature & Countryside, Travel & Learning). The export's nine
 * are canonical on both sides. The bundled demo catalog still carries the old
 * names, so it is mapped through `canonical` as it loads and the demo build
 * speaks the same vocabulary the API does.
 *
 * Chip labels live in i18n under `shared.mock.categories.*` and are deliberately
 * shorter than the values ("Adventure", not "Adventure & Outdoors") - the value
 * is what travels, the label is what fits.
 */

export const CANONICAL_CATEGORIES = [
  'Adventure & Outdoors',
  'Nature & Countryside',
  'Water & Islands',
  'Food & Drink',
  'Culture & Heritage',
  'City & Social',
  'Wellness & Sports',
  'Travel & Learning',
  'Signature & Rare',
] as const;

export type CanonicalCategory = (typeof CANONICAL_CATEGORIES)[number];

/** Old one-word names to the shelf they belong on. Kept in step with the server. */
const ALIASES: Record<string, CanonicalCategory> = {
  Adventure: 'Adventure & Outdoors',
  Nature: 'Nature & Countryside',
  Water: 'Water & Islands',
  Food: 'Food & Drink',
  Culture: 'Culture & Heritage',
  Community: 'City & Social',
  Cities: 'City & Social',
  Fitness: 'Wellness & Sports',
  Skills: 'Travel & Learning',
};

/**
 * The canonical name for a category, or the input unchanged.
 *
 * Unknown names pass through rather than throwing, exactly as the server does:
 * a category the app has not heard of should render as itself, not crash a
 * grid. `All` is not a category - it is the absence of a filter - and passes
 * through untouched for the same reason.
 */
export function canonical(category: string): string {
  return ALIASES[category] ?? category;
}
