const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const os = require('os');
const path = require('path');

/**
 * Sign debug builds with this machine's own debug keystore rather than the one
 * Expo's template ships.
 *
 * Why this exists. Google ties an Android OAuth client to a package name *and*
 * a signing fingerprint, and hands back no ID token when they disagree - with a
 * DEVELOPER_ERROR that says nothing about which half is wrong. The template
 * keystore is identical in every Expo project on earth, so registering its
 * fingerprint would let any app built from that template and claiming this
 * package name mint tokens for our client.
 *
 * Doing it as a plugin rather than by hand matters: `expo prebuild --clean`
 * rewrites android/ from the template every time, so a manual copy survives
 * exactly until the next prebuild and then breaks sign-in with no diff to
 * explain it.
 *
 * If no personal keystore exists yet, this does nothing and the template one
 * stays - the build still works, only Google sign-in would not.
 */
module.exports = function withDebugKeystore(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const source = path.join(os.homedir(), '.android', 'debug.keystore');
      const target = path.join(cfg.modRequest.platformProjectRoot, 'app', 'debug.keystore');
      if (fs.existsSync(source)) {
        fs.copyFileSync(source, target);
        console.log('› Using ~/.android/debug.keystore for debug signing');
      } else {
        console.warn('› No ~/.android/debug.keystore; keeping the Expo template keystore.');
      }
      return cfg;
    },
  ]);
};
