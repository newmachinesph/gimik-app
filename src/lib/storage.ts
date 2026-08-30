import type { PhotoSource } from '@/components/ui';

import { bundled } from './bundled';

/**
 * Where imagery comes from.
 *
 * Catalog artwork and seeded portraits live in the API's own object store —
 * MinIO locally, R2 later — in a bucket that is public by design: the same
 * image is shown to every account, so presigning each one would cost a round
 * trip and defeat the CDN without protecting anything.
 *
 * `scripts/sync-catalog-storage.mjs` is what puts the catalog there, and it
 * builds the same `catalog/<slug>.webp` path this module reads.
 */
export const CATALOG_BUCKET = 'gora-catalog';

/** The bundled photograph every catalog surface falls back to. */
export const CATALOG_FALLBACK = bundled(() => require('@/assets/images/market.jpg'), 'market.jpg');
const mediaUrl = process.env.EXPO_PUBLIC_MEDIA_URL?.replace(/\/$/, '');

/** Whether the object store is configured at all. */
export const hasMediaStore = Boolean(mediaUrl);

export function catalogPhoto(slug: string): PhotoSource {
  // A bundled photograph rather than a broken tile when the store is not
  // configured — the catalog is the first thing a new person sees.
  if (!mediaUrl) return CATALOG_FALLBACK;
  return `${mediaUrl}/${CATALOG_BUCKET}/catalog/${encodeURIComponent(slug)}.webp`;
}

/**
 * A seeded person's portraits, `people/<id>-1.webp` upward.
 *
 * Returns nothing when the store is not configured, and every surface that
 * shows a person degrades to their initials avatar rather than to a row of
 * broken frames. The backend seed is what fills this prefix; until it does,
 * the app is honest about having no photograph rather than faking one.
 */
export function personPhotos(id: string, count: number): PhotoSource[] {
  if (!mediaUrl || count < 1) return [];
  return Array.from(
    { length: count },
    (_, index) => `${mediaUrl}/${CATALOG_BUCKET}/people/${encodeURIComponent(id)}-${index + 1}.webp`,
  );
}
