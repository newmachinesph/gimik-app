import { ApiError, hasApi } from '@/lib/api/client';
import { places as placesApi } from '@/lib/api/endpoints';

export type PlaceSearch = { picks: PlacePick[]; needsPlus: boolean };
export type PlacePick = {
  id: string;
  name: string;
  area: string;
  lat: number | null;
  lon: number | null;
  provider?: string;
};

// Kept for the sign-out API. No result cache: every submitted search reaches
// the backend, which records demand and reuses its licensed catalogue.
export function resetPlaceCache(): void {}

export async function searchPlaces(query: string, session?: string, activity?: string): Promise<PlaceSearch> {
  const q = query.trim();
  if (!hasApi || (q.length < 3 && (q.length > 0 || !activity))) return { picks: [], needsPlus: false };
  try {
    const rows = await placesApi.search(q, session, activity);
    return { picks: rows, needsPlus: false };
  } catch (error) {
    if (error instanceof ApiError && error.needsPlus) return { picks: [], needsPlus: true };
    return { picks: [], needsPlus: false };
  }
}

/** Autocomplete session identifier. Billing also requires valid termination. */
export function newSearchSession(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function placeLabel(pick: PlacePick): string {
  return pick.area ? `${pick.name} · ${pick.area}` : pick.name;
}
