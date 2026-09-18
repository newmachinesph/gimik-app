import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('catalog artwork URLs', () => {
  it('uses a custom CDN bucket root without appending a bucket name', async () => {
    vi.stubEnv('EXPO_PUBLIC_CATALOG_URL', 'https://cdn.gimik.app/');
    vi.stubEnv('EXPO_PUBLIC_MEDIA_URL', 'http://localhost:9000');
    const { catalogPhoto, personPhotos } = await import('./storage');
    expect(catalogPhoto('anime-convention-attending')).toBe('https://cdn.gimik.app/catalog/anime-convention-attending.webp');
    expect(personPhotos('qa', 1)).toEqual(['https://cdn.gimik.app/people/qa-1.webp']);
  });

  it.each([
    ['http://localhost:9000/', 'http://localhost:9000/gora-catalog'],
    ['https://pub-test.r2.dev/', 'https://pub-test.r2.dev'],
  ])('preserves the legacy endpoint %s', async (endpoint, root) => {
    vi.stubEnv('EXPO_PUBLIC_CATALOG_URL', '');
    vi.stubEnv('EXPO_PUBLIC_MEDIA_URL', endpoint);
    const { catalogPhoto, personPhotos } = await import('./storage');
    expect(catalogPhoto('aquarium-touring')).toBe(`${root}/catalog/aquarium-touring.webp`);
    expect(personPhotos('qa', 1)).toEqual([`${root}/people/qa-1.webp`]);
  });

  it('retains an offline fallback when no store is configured', async () => {
    vi.stubEnv('EXPO_PUBLIC_CATALOG_URL', '');
    vi.stubEnv('EXPO_PUBLIC_MEDIA_URL', '');
    const { catalogPhoto, CATALOG_FALLBACK, hasMediaStore } = await import('./storage');
    expect(catalogPhoto('anything')).toBe(CATALOG_FALLBACK);
    expect(hasMediaStore).toBe(false);
  });
});
