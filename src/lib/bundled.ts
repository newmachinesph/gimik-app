import type { PhotoSource } from '@/components/ui';

/**
 * A bundled asset, or a stand-in when there is no bundler.
 *
 * Metro rewrites `require('...jpg')` to an asset id at build time. The unit
 * tests run under plain node, where that call throws and would take down every
 * module that merely imports an image constant - which is most of them. The
 * loader stays a literal require at the call site so Metro's static analysis
 * still finds it; only the failure is handled.
 */
export function bundled(loader: () => number, name: string): PhotoSource {
  try {
    return loader();
  } catch {
    return `asset://${name}`;
  }
}
