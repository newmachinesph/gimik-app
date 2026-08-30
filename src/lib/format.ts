import { i18n } from '@/i18n';
import { formatDate } from '@/i18n/format';

/** Dates the way the app speaks them: SAT 14 MAR, or a countdown when close. */
export function dayLabel(iso: string): string {
  return formatDate(new Date(`${iso}T00:00:00`), { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
}

export function countdown(iso: string): string {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(`${iso}T00:00:00`);
  const days = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return i18n.t('s.time.daysAgo', { count: -days });
  if (days === 0) return i18n.t('s.time.today');
  if (days === 1) return i18n.t('s.time.tomorrow');
  if (days < 14) return i18n.t('s.time.inDays', { count: days });
  return dayLabel(iso);
}

/** Day label for a full timestamp, in the device's timezone - an ISO slice would be UTC's day, not the user's. */
export function timestampDayLabel(iso: string): string {
  return formatDate(new Date(iso), { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
}

export function ageFrom(birthday: string | null): number | null {
  if (!birthday) return null;
  const born = new Date(birthday); const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  if (now < new Date(now.getFullYear(), born.getMonth(), born.getDate())) age -= 1;
  return age;
}

export function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return i18n.t('s.time.now');
  if (minutes < 60) return i18n.t('s.time.m', { count: minutes });
  const hours = Math.round(minutes / 60);
  if (hours < 24) return i18n.t('s.time.h', { count: hours });
  return i18n.t('s.time.d', { count: Math.round(hours / 24) });
}
