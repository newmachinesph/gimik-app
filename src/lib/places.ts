/**
 * Place search for the demo: LocationIQ autocomplete over OpenStreetMap,
 * Philippines only. A someday like "eat at a 5-star restaurant" becomes a plan
 * at THE restaurant - The Peninsula, Toyo Eatery - not a category.
 *
 * The key is a free-tier dev key riding in EXPO_PUBLIC_* for the demo. When
 * the API arrives, the app calls /places/search on gora-backend-v2 instead:
 * same result shape, server-side key, and every pick cached into the backend's
 * own places table so repeat searches never leave the house.
 */

export type PlacePick = {
  id: string;
  name: string;
  /** The part a person says out loud: "Chino Roces Ave, Makati". */
  area: string;
  lat: number;
  lon: number;
};

const KEY = process.env.EXPO_PUBLIC_LOCATIONIQ_KEY;
const cache = new Map<string, PlacePick[]>();

function areaOf(address: Record<string, string | undefined>, displayAddress: string): string {
  const bits = [address.road, address.neighbourhood ?? address.suburb, address.city ?? address.state];
  const area = bits.filter(Boolean).slice(0, 2).join(', ');
  return area || displayAddress.split(',').slice(0, 2).join(',').trim();
}

export async function searchPlaces(query: string): Promise<PlacePick[]> {
  const q = query.trim();
  if (q.length < 3 || !KEY) return [];
  const hit = cache.get(q.toLowerCase());
  if (hit) return hit;
  try {
    const url = `https://api.locationiq.com/v1/autocomplete?key=${KEY}&q=${encodeURIComponent(q)}&countrycodes=ph&limit=6&dedupe=1`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const rows = (await response.json()) as {
      place_id: string;
      display_place?: string;
      display_name: string;
      display_address?: string;
      lat: string;
      lon: string;
      address?: Record<string, string>;
    }[];
    const picks: PlacePick[] = rows.map((row) => ({
      id: row.place_id,
      name: row.display_place ?? row.display_name.split(',')[0],
      area: areaOf(row.address ?? {}, row.display_address ?? row.display_name),
      lat: Number(row.lat),
      lon: Number(row.lon),
    }));
    cache.set(q.toLowerCase(), picks);
    return picks;
  } catch {
    // Offline or rate-limited: typing a place by hand still works everywhere
    // this is used, so an empty list is the whole failure mode.
    return [];
  }
}

/** The string a plan stores: name plus just enough area to disambiguate. */
export function placeLabel(pick: PlacePick): string {
  return pick.area ? `${pick.name} · ${pick.area}` : pick.name;
}
