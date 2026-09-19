const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

module.exports = function withBilling(config) {
  return withAndroidManifest(config, (cfg) => {
    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(cfg.modResults);
    // External bank verification must not cancel an in-flight Play purchase.
    activity.$['android:launchMode'] = 'singleTop';
    return cfg;
  });
};
