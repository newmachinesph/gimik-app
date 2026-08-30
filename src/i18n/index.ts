import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en';

/**
 * Gora speaks English. One locale, no preference, no switcher.
 *
 * The i18n layer stays because it is what keeps copy out of the components —
 * every user-visible string resolves through `t()`, so the wording of the
 * product lives in `locales/` and gets reviewed in one place. It is a typed
 * copy deck, not a translation system.
 */
export const LOCALE = 'en-US';

const i18n = createInstance();

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: { en: { translation: en } },
    lng: 'en',
    fallbackLng: 'en',
    supportedLngs: ['en'],
    initAsync: false,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export { i18n };
export default i18n;
