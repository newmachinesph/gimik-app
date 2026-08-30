// NativeWind 4 needs both halves: `jsxImportSource` rewrites JSX so RN components
// accept `className`, and `nativewind/babel` compiles the Tailwind output.
// Dropping either one silently produces unstyled components rather than an error.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
