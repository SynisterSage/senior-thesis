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
      <Stack.Screen name="trail-preview" options={{ headerShown: false }} />
      <Stack.Screen name="hike" options={{ headerShown: false }} />
      <Stack.Screen name="reflect" options={{ title: 'Reflect', gestureEnabled: false }} />
      <Stack.Screen name="recap" options={{ title: 'Hike recap', gestureEnabled: false }} />
      <Stack.Screen name="moment" options={{ title: 'Moment' }} />
    </Stack>
  );
}
