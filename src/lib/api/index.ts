/**
 * Gimik API v2, ready to be wired.
 *
 * Nothing in `src/app` imports this yet: the screens read the demo store, and
 * that is deliberate - the store's shapes were written to mirror these DTOs so
 * the swap is a binding layer, not a rewrite. See `docs/integration.md` for the
 * one real impedance mismatch and the order to close it in.
 */
export { ApiError, NetworkError, hasApi, isSignedIn, loadTokens, setTokens } from './client';
export { auth, catalog, groups, media, ops, places, plans, social, threads } from './endpoints';
export type * from './schema';
