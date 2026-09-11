import { bundled } from './bundled';
import { catalogPhoto } from './storage';

// Full-bleed brand imagery stays bundled so the shell has an offline fallback.
// Catalog artwork is served from the object store and is not shipped in the app.

export const PHOTO = {
  hero: bundled(() => require('@/assets/images/hero.jpg'), 'hero.jpg'),
  aurora: bundled(() => require('@/assets/images/aurora.jpg'), 'aurora.jpg'),
  balloons: bundled(() => require('@/assets/images/balloons.jpg'), 'balloons.jpg'),
  surf: bundled(() => require('@/assets/images/surf.jpg'), 'surf.jpg'),
  market: bundled(() => require('@/assets/images/market.jpg'), 'market.jpg'),
  reef: bundled(() => require('@/assets/images/reef.jpg'), 'reef.jpg'),
  summit: bundled(() => require('@/assets/images/summit.jpg'), 'summit.jpg'),
  bucketAurora: catalogPhoto('see-an-aurora'),
  bucketBalloon: catalogPhoto('ride-a-hot-air-balloon'),
  bucketClimb: catalogPhoto('climb-to-a-mountain-summit'),
  bucketDive: catalogPhoto('dive-a-coral-reef'),
  bucketSkydiving: catalogPhoto('go-skydiving'),
  bucketKayak: catalogPhoto('kayak-through-a-river-canyon'),
  bucketGarden: catalogPhoto('volunteer-at-a-community-garden'),
  bucketFestival: catalogPhoto('attend-an-outdoor-festival'),
  bucketRun: catalogPhoto('run-a-long-distance-course'),
  bucketFood: catalogPhoto('eat-street-food'),
  bucketCamp: catalogPhoto('camp-under-the-stars'),
  bucketDesert: catalogPhoto('explore-a-desert-landscape'),
  // learn-a-traditional-craft did not survive the catalog dedupe, so it has no
  // rendered image; loom weaving is the nearest surviving Crafts entry.
  bucketCraft: catalogPhoto('learn-loom-weaving'),
  bucketMusic: catalogPhoto('learn-to-play-a-musical-instrument'),
  bucketSurf: catalogPhoto('learn-to-surf'),
};

// The transparent marks (assets/images/gimik-mark.png and gimik-mark-orange.png) are
// the icon masters and are deliberately NOT exported here — nothing renders them in
// app right now, and Metro only bundles what is required, so they cost nothing on
// disk. Add an export when a screen actually shows the wordmark.
