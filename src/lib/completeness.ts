import { useTranslation } from 'react-i18next';

import { useMine } from '@/lib/somedays';
import { useApp } from '@/store';

/**
 * One definition of "profile complete", shared by the profile screen's ring,
 * its chip, and the tab bar's avatar ring: photo, name, city, bio, three
 * kept somedays, one locked date.
 */
export function useProfileCompleteness() {
  const { t } = useTranslation();
  const profile = useApp((state) => state.profile);
  const { kept, locked } = useMine();

  // The name is not a step: it is declared once at sign-up and never edited.
  const steps = [
    { done: profile.photos.length > 0, label: t('s.profile.steps.photo'), href: '/edit-profile' },
    { done: Boolean(profile.city), label: t('s.profile.steps.city'), href: '/city' },
    { done: Boolean(profile.bio), label: t('s.profile.steps.bio'), href: '/edit-profile' },
    { done: Boolean(profile.work || profile.education), label: t('s.profile.steps.workEdu'), href: '/edit-profile' },
    { done: kept.length >= 3, label: t('s.profile.steps.somedays'), href: '/(tabs)/home' },
    { done: locked.length >= 1, label: t('s.profile.steps.lock'), href: '/(tabs)/activity' },
  ];
  const fraction = steps.filter((step) => step.done).length / steps.length;
  const next = steps.find((step) => !step.done);
  return { steps, fraction, next };
}
