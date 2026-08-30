import { coreScreensEn } from './core-screens';
import { screensEn } from './screens';
import { sharedEn } from './shared';

/**
 * Every string in the app, in the one language it ships in.
 *
 * Three namespaces, split by lifetime rather than by screen: `s` is screen
 * copy, `core` is the shell (tabs, boot, chrome), `shared` is vocabulary reused
 * across screens. A key only one screen says belongs in `s`; a key two screens
 * must say identically belongs in `shared`.
 */
const en = {
  ...screensEn,
  ...coreScreensEn,
  ...sharedEn,
} as const;

export default en;
