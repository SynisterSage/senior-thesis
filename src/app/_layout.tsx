import { Stack } from 'expo-router';

import { colors } from '@/constants/trailmark-theme';
import '@/lib/hike-background';

export default function RootLayout() {
  const palette = colors.light;

  return (
    <Stack screenOptions={{
      headerTintColor: palette.text,
      headerStyle: { backgroundColor: palette.background },
      contentStyle: { backgroundColor: palette.background },
    }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade', animationDuration: 220, animationTypeForReplace: 'push' }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="pair-nod" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="nod-tutorial" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="saved-trails" options={{ headerShown: false }} />
      <Stack.Screen name="return-to-walk" options={{ headerShown: false }} />
      <Stack.Screen name="around-you" options={{ headerShown: false }} />
      <Stack.Screen name="noticing-focus" options={{ headerShown: false }} />
      <Stack.Screen name="trail-preview" options={{ headerShown: false }} />
      <Stack.Screen name="trail-stories" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="hike" options={{ headerShown: false }} />
      <Stack.Screen name="return" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="reflect" options={{ title: 'Reflect', gestureEnabled: false }} />
      <Stack.Screen name="recap" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="moment" options={{ title: 'Moment' }} />
    </Stack>
  );
}
