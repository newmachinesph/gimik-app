import { LOCALE } from '@/i18n';

/**
 * Intl formatters, built once and reused.
 *
 * Constructing an `Intl.DateTimeFormat` is expensive enough to show up in a
 * list; these caches are keyed by the options object, so a screen pays for its
 * format exactly once per app run.
 */
const dateFormatters = new Map<string, Intl.DateTimeFormat>();
const numberFormatters = new Map<string, Intl.NumberFormat>();

export function formatDate(value: Date | number | string, options: Intl.DateTimeFormatOptions) {
  const cacheKey = JSON.stringify(options);
  let formatter = dateFormatters.get(cacheKey);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(LOCALE, options);
    dateFormatters.set(cacheKey, formatter);
  }
  return formatter.format(value instanceof Date ? value : new Date(value));
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions) {
  const cacheKey = JSON.stringify(options ?? {});
  let formatter = numberFormatters.get(cacheKey);
  if (!formatter) {
    formatter = new Intl.NumberFormat(LOCALE, options);
    numberFormatters.set(cacheKey, formatter);
  }
  return formatter.format(value);
}

/** Noon, so a date-only ISO string cannot slip a day across a timezone. */
export function dateFromIso(iso: string, time = '12:00:00') {
  return new Date(`${iso}T${time}`);
}
