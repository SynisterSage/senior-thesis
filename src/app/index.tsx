import { Redirect } from 'expo-router';

import { hasCompletedOnboarding } from '@/lib/onboarding';

export default function Index() {
  return <Redirect href={hasCompletedOnboarding() ? '/(tabs)/trails' : '/onboarding'} />;
}
