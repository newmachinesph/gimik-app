const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// `input` is the CSS entry holding the @tailwind directives; it lives in src/.
module.exports = withNativeWind(getDefaultConfig(__dirname), { input: './src/global.css' });
