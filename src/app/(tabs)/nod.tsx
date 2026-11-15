import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isNodConnected } from '@/lib/onboarding';
import { colors } from '@/constants/trailmark-theme';

const palette = colors.light;
const nodAsset = require('../../../assets/images/transparent-nod.png');

export default function NodScreen() {
  const [didPress, setDidPress] = useState(false);
  const connected = isNodConnected();
  const [imageOpacity] = useState(() => new Animated.Value(0));
  const [imageScale] = useState(() => new Animated.Value(0.88));
  const [imageOffset] = useState(() => new Animated.Value(18));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(imageOpacity, { toValue: 1, duration: 520, delay: 80, useNativeDriver: true }),
      Animated.spring(imageScale, { toValue: 1, friction: 8, tension: 58, delay: 80, useNativeDriver: true }),
      Animated.timing(imageOffset, { toValue: 0, duration: 520, delay: 80, useNativeDriver: true }),
    ]).start();
  }, [imageOpacity, imageOffset, imageScale]);

  return <View style={styles.screen}>
    <StatusBar style="dark" />
    <SafeAreaView edges={['top']} style={styles.safeTop}>
      <View style={styles.header} />
    </SafeAreaView>

    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.intro}><Text style={styles.headline}>{connected ? 'Keep the moment.\nKeep moving.' : 'Meet Nod.\nKeep moving.'}</Text><Text style={styles.description}>{connected ? 'When something catches your attention, press once. TrailMark gives it a place to return to.' : 'A quiet way to keep something that catches your attention while your phone stays away.'}</Text></View>

      <View style={styles.deviceArea}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={connected ? 'Try Nod’s button' : 'Nod is not connected'}
          accessibilityHint={connected ? 'Tests a moment press.' : 'Use Set up Nod to pair your device.'}
          accessibilityState={{ disabled: !connected }}
          disabled={!connected}
          onPress={() => setDidPress(true)}
          style={({ pressed }) => [styles.device, !connected && styles.deviceOffline, pressed && connected && styles.devicePressed]}
        >
          <Animated.View pointerEvents="none" style={[styles.deviceImageWrap, { opacity: imageOpacity, transform: [{ translateY: imageOffset }, { scale: imageScale }] }]}>
            <Image source={nodAsset} contentFit="contain" style={styles.deviceImage} />
          </Animated.View>
        </Pressable>
      </View>

      {connected ? <Text accessibilityLiveRegion="polite" style={styles.pressFeedback}>{didPress ? 'That came through.' : 'Press Nod to try a moment'}</Text> : <Pressable accessibilityRole="button" onPress={() => router.push('/pair-nod')} style={({ pressed }) => [styles.connectButton, pressed && styles.connectButtonPressed]}><Text style={styles.connectButtonText}>Set up Nod</Text></Pressable>}

    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  safeTop: { backgroundColor: palette.background },
  header: { height: 22 },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26, paddingTop: 28, paddingBottom: 132 },
  intro: { width: '100%', maxWidth: 420, alignItems: 'center' },
  headline: { color: palette.text, fontSize: 30, lineHeight: 35, fontWeight: '700', letterSpacing: -0.9, textAlign: 'center' },
  description: { maxWidth: 310, color: palette.secondary, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 11 },
  deviceArea: { minHeight: 276, width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: 5 },
  device: { width: 320, height: 235, alignItems: 'center', justifyContent: 'center' },
  devicePressed: { transform: [{ scale: 0.975 }] }, deviceOffline: { opacity: 0.72 },
  deviceImageWrap: { width: '100%', height: '100%' }, deviceImage: { width: '100%', height: '100%' },
  pressFeedback: { minHeight: 22, color: palette.secondary, fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: -2 }, connectButton: { minWidth: 144, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: palette.accent, marginTop: 0 }, connectButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' }, connectButtonPressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
});
