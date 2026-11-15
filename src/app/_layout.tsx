import { Stack } from 'expo-router';

import { colors } from '@/constants/trailmark-theme';

export default function RootLayout() {
  const palette = colors.light;

  return (
    <Stack screenOptions={{
      headerTintColor: palette.text,
      headerStyle: { backgroundColor: palette.background },
      contentStyle: { backgroundColor: palette.background },
    }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="pair-nod" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
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
