const C = require('./src/lib/colors.js');

// Every palette entry becomes a `brand-*` class automatically. Adding a color to
// colors.js is the only step — the token and the class cannot drift apart.
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: Object.fromEntries(Object.entries(C).map(([k, v]) => [k, v])),
      },
      fontFamily: {
        geist: ['Geist_400Regular'],
        'geist-medium': ['Geist_500Medium'],
        'geist-semibold': ['Geist_600SemiBold'],
        'geist-bold': ['Geist_700Bold'],
        'geist-extrabold': ['Geist_800ExtraBold'],
        'geist-mono': ['GeistMono_400Regular'],
        'geist-mono-medium': ['GeistMono_500Medium'],
        'instrument-serif': ['InstrumentSerif_400Regular_Italic'],
      },
    },
  },
  plugins: [],
};
