/**
 * Client-generated ids, everywhere the app mints one.
 *
 * Hermes has no Web Crypto: `globalThis.crypto` is undefined on device, so the
 * bare `crypto.randomUUID()` this replaced threw before the surrounding call ran
 * — and because it sat in default parameters, every mutation in the app failed
 * at the call site and looked like a delivery problem instead of a crash.
 *
 * These ids are idempotency keys and local list keys, not secrets, so the
 * fallback needs uniqueness rather than cryptographic strength. Math.random is
 * enough for that; the UUID shape is kept so ids read the same across platforms.
 */
export function randomId(): string {
  const webCrypto = globalThis.crypto;
  if (webCrypto?.randomUUID) return webCrypto.randomUUID();

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}
