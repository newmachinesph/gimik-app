import { Redirect } from 'expo-router';
import { useApp } from '@/store';

/**
 * The root restores the session for every entry point, including deep links.
 */
export default function Boot() {
  const onboarded = useApp((state) => state.onboarded);
  return <Redirect href={onboarded ? '/(tabs)/home' : '/welcome'} />;
}
