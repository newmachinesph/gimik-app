/**
 * The optional identity shelves: hometown, languages, religion, politics.
 * Everything here is opt-in with a quiet default of saying nothing, and none
 * of it is ever required, filtered on, or ranked by. Body statistics (height,
 * weight, and kin) are deliberately absent and stay absent.
 */

export type Option = { slug: string; label: string };

/** Philippine languages first - that is the room we are in - then the usual internationals. */
export const PH_LANGUAGES: Option[] = [
  { slug: 'filipino', label: 'Filipino / Tagalog' },
  { slug: 'bisaya', label: 'Cebuano / Bisaya' },
  { slug: 'ilocano', label: 'Ilocano' },
  { slug: 'hiligaynon', label: 'Hiligaynon / Ilonggo' },
  { slug: 'bikol', label: 'Bikol' },
  { slug: 'waray', label: 'Waray' },
  { slug: 'kapampangan', label: 'Kapampangan' },
  { slug: 'pangasinan', label: 'Pangasinan' },
  { slug: 'chavacano', label: 'Chavacano' },
  { slug: 'maranao', label: 'Maranao' },
  { slug: 'maguindanaon', label: 'Maguindanaon' },
  { slug: 'tausug', label: 'Tausug' },
];

export const INTL_LANGUAGES: Option[] = [
  { slug: 'english', label: 'English' },
  { slug: 'spanish', label: 'Spanish' },
  { slug: 'mandarin', label: 'Mandarin' },
  { slug: 'hokkien', label: 'Hokkien' },
  { slug: 'japanese', label: 'Japanese' },
  { slug: 'korean', label: 'Korean' },
  { slug: 'arabic', label: 'Arabic' },
  { slug: 'french', label: 'French' },
  { slug: 'german', label: 'German' },
];

const LANGUAGE_LABELS = new Map([...PH_LANGUAGES, ...INTL_LANGUAGES].map((o) => [o.slug, o.label]));
export const languageLabel = (slug: string) => LANGUAGE_LABELS.get(slug);

/** PH-shaped, never required. */
export const RELIGIONS: Option[] = [
  { slug: 'catholic', label: 'Catholic' },
  { slug: 'christian', label: 'Christian' },
  { slug: 'inc', label: 'Iglesia ni Cristo' },
  { slug: 'islam', label: 'Islam' },
  { slug: 'buddhist', label: 'Buddhist' },
  { slug: 'hindu', label: 'Hindu' },
  { slug: 'spiritual', label: 'Spiritual' },
  { slug: 'agnostic', label: 'Agnostic' },
  { slug: 'atheist', label: 'Atheist' },
  { slug: 'other', label: 'Other' },
];

export const POLITICS: Option[] = [
  { slug: 'apolitical', label: 'Apolitical' },
  { slug: 'moderate', label: 'Moderate' },
  { slug: 'progressive', label: 'Progressive' },
  { slug: 'conservative', label: 'Conservative' },
];

const RELIGION_LABELS = new Map(RELIGIONS.map((o) => [o.slug, o.label]));
const POLITICS_LABELS = new Map(POLITICS.map((o) => [o.slug, o.label]));
export const religionLabel = (slug: string) => RELIGION_LABELS.get(slug);
export const politicsLabel = (slug: string) => POLITICS_LABELS.get(slug);
