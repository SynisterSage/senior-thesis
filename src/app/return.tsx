import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/trailmark-theme';

const palette = colors.light;
const memoryImages = [
  require('../../assets/trails/grand-prismatic/trailhead.jpg'),
  require('../../assets/trails/grand-prismatic/midway.jpg'),
  require('../../assets/trails/grand-prismatic/spring.jpg'),
  require('../../assets/trails/grand-prismatic/overlook.jpg'),
];

export default function ReturnScreen() {
  const { markedCount, momentIds: momentIdsParam } = useLocalSearchParams<{ markedCount?: string; momentIds?: string }>();
  const total = Math.max(0, Number(markedCount) || 0);
  const momentLabel = total === 1 ? 'moment' : 'moments';
  const [topAnimation] = useState(() => new Animated.Value(0));
  const [trailAnimation] = useState(() => new Animated.Value(0));
  const [bottomAnimation] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const entrance = Animated.stagger(100, [topAnimation, trailAnimation, bottomAnimation].map((animation) => Animated.spring(animation, { toValue: 1, damping: 17, stiffness: 165, mass: 0.75, useNativeDriver: true })));
    entrance.start();
    return () => entrance.stop();
  }, [bottomAnimation, topAnimation, trailAnimation]);

  const revisitMoments = () => {
    router.replace({
      pathname: '/reflect',
      params: {
        markedCount: String(total),
        momentIds: momentIdsParam ?? '[]',
      },
    });
  };

  if (!total) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.emptyContent}>
          <View style={styles.emptyMark}><View style={styles.emptyMarkCore} /></View>
          <Text accessibilityRole="header" style={styles.title}>You’re back.</Text>
          <Text style={styles.description}>This walk is still yours to keep. Mark a moment when something catches your attention.</Text>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Text style={styles.secondaryLabel}>Return to hike</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Animated.View style={[styles.topCopy, entranceStyle(topAnimation)]}>
          <Text accessibilityRole="header" style={styles.title}>You’re back.</Text>
          <Text style={styles.description}>You kept {total} {momentLabel} from this walk.</Text>
        </Animated.View>

        <Animated.View accessibilityLabel={`${total} blurred trail moments waiting to be revisited`} style={[styles.memoryMosaic, entranceStyle(trailAnimation)]}>
          {memoryImages.slice(0, total).map((source, index) => (
            <View key={index} style={styles.memoryTile}>
              <Image source={source} contentFit="cover" blurRadius={18} style={styles.memoryImage} />
              <View style={styles.memoryShade} />
              <Text style={styles.memoryNumber}>{String(index + 1).padStart(2, '0')}</Text>
            </View>
          ))}
          <View pointerEvents="none" style={styles.mosaicBorder} />
          <Text style={styles.memoryCaption}>The details can come back in their own time.</Text>
        </Animated.View>

        <Animated.View style={[styles.bottomCopy, entranceStyle(bottomAnimation)]}>
          <Text style={styles.invitation}>Before TrailMark shows you where they happened, take a moment to remember what stayed with you.</Text>
          <Pressable accessibilityRole="button" onPress={revisitMoments} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryLabel}>Revisit {total} {momentLabel}</Text>
            <Text style={styles.arrow}>→</Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

function entranceStyle(animation: Animated.Value) {
  return { opacity: animation, transform: [{ translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] };
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  content: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 42, paddingBottom: 24 },
  topCopy: { gap: 10 },
  title: { color: palette.text, fontSize: 42, lineHeight: 47, fontWeight: '800', letterSpacing: -1.2 },
  description: { color: palette.secondary, fontSize: 18, lineHeight: 26 },
  memoryMosaic: { height: 232, flexDirection: 'row', gap: 3, padding: 4, overflow: 'hidden', borderRadius: 24, backgroundColor: '#173326' },
  memoryTile: { flex: 1, overflow: 'hidden', borderRadius: 17, backgroundColor: '#315A45' },
  memoryImage: { ...StyleSheet.absoluteFill, transform: [{ scale: 1.16 }] },
  memoryShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(11, 31, 20, 0.27)' },
  memoryNumber: { position: 'absolute', left: 11, top: 11, color: 'rgba(255,255,255,0.88)', fontSize: 11, fontWeight: '800' },
  mosaicBorder: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 77, backgroundColor: 'rgba(14, 33, 22, 0.62)' },
  memoryCaption: { position: 'absolute', left: 18, right: 18, bottom: 19, color: '#FFFFFF', fontSize: 17, lineHeight: 23, fontWeight: '700', letterSpacing: -0.2 },
  bottomCopy: { gap: 22 },
  invitation: { color: palette.text, fontSize: 20, lineHeight: 29, fontWeight: '700', letterSpacing: -0.25 },
  primaryButton: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 18, backgroundColor: palette.accent },
  primaryLabel: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  arrow: { color: '#FFFFFF', fontSize: 22, fontWeight: '600' },
  emptyContent: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  emptyMark: { width: 62, height: 62, marginBottom: 28, borderRadius: 31, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E2F1E5' },
  emptyMarkCore: { width: 18, height: 18, borderRadius: 9, backgroundColor: palette.accent },
  secondaryButton: { minHeight: 54, alignItems: 'center', justifyContent: 'center', marginTop: 28, borderRadius: 16, borderWidth: 1, borderColor: palette.line, backgroundColor: '#FFFFFF' },
  secondaryLabel: { color: palette.text, fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.78 },
});
