import { afterEach, describe, expect, it, vi } from 'vitest';

const { search, hasApi } = vi.hoisted(() => ({ search: vi.fn(), hasApi: { value: true } }));

vi.mock('@/lib/api/endpoints', () => ({ places: { search } }));
vi.mock('@/lib/api/client', async () => {
  // ApiError is the real one: the whole point is that `needsPlus` is read off
  // an instance the client actually produced, not a shape a test invented.
  const actual = await vi.importActual<typeof import('@/lib/api/client')>('@/lib/api/client');
  return { ...actual, get hasApi() { return hasApi.value; } };
});

import { ApiError } from '@/lib/api/client';
import { newSearchSession, placeLabel, resetPlaceCache, searchPlaces } from '@/lib/places';

const ROW = { id: 'p1', name: 'Toyo Eatery', area: 'Chino Roces, Makati', lat: null, lon: null };

afterEach(() => {
  search.mockReset();
  hasApi.value = true;
  // The cache is module state and outlives a test; a hit in one would silently
  // answer the next without ever reaching the mock.
  resetPlaceCache();
});

describe('searchPlaces', () => {
  it('passes the session token through', async () => {
    search.mockResolvedValue([ROW]);
    const session = newSearchSession();
    await searchPlaces('toyo eatery', session);
    expect(search).toHaveBeenCalledWith('toyo eatery', session, undefined);
  });

  it('reports needsPlus on a 402 rather than looking like no match', async () => {
    search.mockRejectedValue(new ApiError(402, 'Place search is part of Gimik Plus.', 'nope'));
    const found = await searchPlaces('toyo eatery', 'sess');
    expect(found).toEqual({ picks: [], needsPlus: true });
  });

  it('treats every other failure as an ordinary empty result', async () => {
    search.mockRejectedValue(new ApiError(500, undefined, 'boom'));
    expect(await searchPlaces('toyo eatery', 'sess')).toEqual({ picks: [], needsPlus: false });
  });

  it('does not call the API below three characters', async () => {
    expect(await searchPlaces('to', 'sess')).toEqual({ picks: [], needsPlus: false });
    expect(search).not.toHaveBeenCalled();
  });

  it('is inert with no API configured, so demo builds still work', async () => {
    hasApi.value = false;
    expect(await searchPlaces('toyo eatery', 'sess')).toEqual({ picks: [], needsPlus: false });
    expect(search).not.toHaveBeenCalled();
  });

  it('mints a different session token each time', () => {
    expect(newSearchSession()).not.toEqual(newSearchSession());
  });

  it('submits repeat searches so the server can record both', async () => {
    search.mockResolvedValue([ROW]);
    await searchPlaces('toyo eatery', 'a');
    await searchPlaces('toyo eatery', 'b');
    expect(search).toHaveBeenCalledTimes(2);
  });

  it('loads activity suggestions before typing', async () => {
    search.mockResolvedValue([ROW]);
    expect((await searchPlaces('', undefined, 'picnic')).picks).toEqual([ROW]);
    expect(search).toHaveBeenCalledWith('', undefined, 'picnic');
  });
});

describe('placeLabel', () => {
  it('joins the name and area a person would say out loud', () => {
    expect(placeLabel(ROW)).toBe('Toyo Eatery · Chino Roces, Makati');
  });

  it('falls back to the bare name when there is no area', () => {
    expect(placeLabel({ ...ROW, area: '' })).toBe('Toyo Eatery');
  });
});
