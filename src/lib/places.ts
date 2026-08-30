import { hasApi } from '@/lib/api/client';
import { places as placesApi } from '@/lib/api/endpoints';

/**
 * Place search, served by gora-backend-v2.
 *
 * A someday like "eat at a 5-star restaurant" becomes a plan at THE restaurant
 * - The Peninsula, Toyo Eatery - not a category.
 *
 * The app used to call LocationIQ directly with a key shipped in EXPO_PUBLIC_*,
 * which meant the key was extractable from any build. It now calls
 * `/places/search`, where the key lives server-side and every answer is cached
 * into the backend's own places table - so a place anyone has already picked
 * costs no provider request at all.
 */

export type PlacePick = {
  id: string;
  name: string;
  /** The part a person says out loud: "Chino Roces Ave, Makati". */
  area: string;
  lat: number;
  lon: number;
};

const cache = new Map<string, PlacePick[]>();

export async function searchPlaces(query: string): Promise<PlacePick[]> {
  const q = query.trim();
  // Demo builds have no API to ask. Free-text places work everywhere this is
  // used, so an empty list is a supported state rather than a failure.
  if (q.length < 3 || !hasApi) return [];

  const key = q.toLowerCase();
  const hit = cache.get(key);
  if (hit) return hit;

  try {
    const rows = await placesApi.search(q);
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
    return picks;
  } catch {
    // Offline, rate limited, or nothing found all look the same to the caller.
    return [];
  }
}

/** The string a plan stores: name plus just enough area to disambiguate. */
export function placeLabel(pick: PlacePick): string {
  return pick.area ? `${pick.name} · ${pick.area}` : pick.name;
}
