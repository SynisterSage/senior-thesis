import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/trailmark-theme';
import { hasCompletedOnboarding } from '@/lib/onboarding';

export default function Index() {
  const [opacity] = useState(() => new Animated.Value(0));
  const [scale] = useState(() => new Animated.Value(0.96));

  useEffect(() => {
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;
    const intro = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, damping: 18, stiffness: 240, mass: 0.7, useNativeDriver: true }),
    ]);

    intro.start(() => {
      redirectTimer = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(({ finished }) => {
          if (finished) router.replace(hasCompletedOnboarding() ? '/(tabs)/trails' : '/onboarding');
        });
      }, 180);
    });

    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
      intro.stop();
      opacity.stopAnimation();
      scale.stopAnimation();
    };
  }, [opacity, scale]);

  return <View accessibilityLabel="TrailMark loading" style={styles.page}>
    <Animated.View style={[styles.brand, { opacity, transform: [{ scale }] }]}>
      <View style={styles.mark}><View style={styles.markCore} /></View>
      <Text style={styles.wordmark}>TrailMark</Text>
    </Animated.View>
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.background },
  brand: { alignItems: 'center', gap: 13 },
  mark: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, borderWidth: 1.5, borderColor: colors.light.accent },
  markCore: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.light.accent },
  wordmark: { color: colors.light.text, fontSize: 19, fontWeight: '700', letterSpacing: 2.2 },
});
