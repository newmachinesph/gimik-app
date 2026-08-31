import { ApiError, hasApi } from '@/lib/api/client';
import { places as placesApi } from '@/lib/api/endpoints';

/**
 * Place search, served by gora-backend-v2.
 *
 * A someday like "eat at a 5-star restaurant" becomes a plan at THE restaurant
 * - The Peninsula, Toyo Eatery - not a category.
 *
 * The app used to call a geocoder directly with a key shipped in EXPO_PUBLIC_*,
 * which meant the key was extractable from any build. It now calls
 * `/places/search`, where the key lives server-side and every answer is cached
 * into the backend's own places table - so a place anyone has already picked
 * costs no provider request at all.
 *
 * Coordinates come back null: the provider's autocomplete does not carry them
 * and nothing here reads them, because a plan records the place as the words
 * someone would say out loud.
 */

/**
 * Why a search came back empty.
 *
 * "Nothing matched" and "this is a Plus feature" both used to arrive as an
 * empty list, which meant the field could only ever offer the free-text hint -
 * including to the person for whom the feature simply was not switched on.
 */
export type PlaceSearch = {
  picks: PlacePick[];
  needsPlus: boolean;
};

export type PlacePick = {
  id: string;
  name: string;
  /** The part a person says out loud: "Chino Roces Ave, Makati". */
  area: string;
  /** Null unless something has had a reason to resolve them. Nothing yet does. */
  lat: number | null;
  lon: number | null;
};

const cache = new Map<string, PlacePick[]>();

/**
 * Forget every cached search.
 *
 * Called on sign-out for the same reason the directory and registry are: the
 * next person to use this device must not be handed the previous one's
 * results, however harmless a restaurant name looks.
 */
export function resetPlaceCache(): void {
  cache.clear();
}

export async function searchPlaces(query: string, session?: string): Promise<PlaceSearch> {
  const q = query.trim();
  // Demo builds have no API to ask. Free-text places work everywhere this is
  // used, so an empty list is a supported state rather than a failure.
  if (q.length < 3 || !hasApi) return { picks: [], needsPlus: false };

  const key = q.toLowerCase();
  const hit = cache.get(key);
  if (hit) return { picks: hit, needsPlus: false };

  try {
    const rows = await placesApi.search(q, session);
    const picks: PlacePick[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      area: row.area,
      lat: row.lat,
      lon: row.lon,
    }));
    // Only successful answers are cached, so a network blip does not pin an
    // empty result to a query the user is still typing.
    if (picks.length) cache.set(key, picks);
    return { picks, needsPlus: false };
  } catch (error) {
    // A 402 is the one failure worth naming: the search would have worked, and
    // saying so is the difference between a dead end and an offer. Everything
    // else - offline, rate limited, nothing found - stays indistinguishable.
    if (error instanceof ApiError && error.needsPlus) return { picks: [], needsPlus: true };
    return { picks: [], needsPlus: false };
  }
}

/**
 * A token for one search - from the first keystroke to the place being picked.
 *
 * The provider bills a session rather than a request, so every keystroke that
 * shares this string is one charge instead of several. It is deliberately not
 * a hook: the field owns the lifetime, and the lifetime ends on a pick.
 */
export function newSearchSession(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

/** The string a plan stores: name plus just enough area to disambiguate. */
export function placeLabel(pick: PlacePick): string {
  return pick.area ? `${pick.name} · ${pick.area}` : pick.name;
}
