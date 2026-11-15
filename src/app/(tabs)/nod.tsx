import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { getNodStatus, getNodUsageStats, type NodUsageStats } from '@/lib/nod';
import { grandPrismaticMoments } from '@/lib/trail-moments';
import { colors } from '@/constants/trailmark-theme';

const palette = colors.light;
const nodAsset = require('../../../assets/images/transparent-nod.png');
const topFadeOpacity = Array.from({ length: 56 }, (_, index) => Math.pow(1 - index / 55, 1.7));

export default function NodScreen() {
  const insets = useSafeAreaInsets();
  const [didPress, setDidPress] = useState(false);
  const [nod, setNod] = useState(getNodStatus());
  const [usage, setUsage] = useState<NodUsageStats>(getNodUsageStats());
  const connected = nod.connected;
  const latestMoment = grandPrismaticMoments.find((moment) => moment.id === usage.lastMomentId) ?? grandPrismaticMoments[grandPrismaticMoments.length - 1];
  const momentThumbnails = grandPrismaticMoments.slice(0, Math.min(usage.momentsKept, 4));
  const [imageOpacity] = useState(() => new Animated.Value(0));
  const [imageScale] = useState(() => new Animated.Value(0.88));
  const [imageOffset] = useState(() => new Animated.Value(18));

  useFocusEffect(useCallback(() => {
    setNod(getNodStatus());
    setUsage(getNodUsageStats());
  }, []));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(imageOpacity, { toValue: 1, duration: 520, delay: 80, useNativeDriver: true }),
      Animated.spring(imageScale, { toValue: 1, friction: 8, tension: 58, delay: 80, useNativeDriver: true }),
      Animated.timing(imageOffset, { toValue: 0, duration: 520, delay: 80, useNativeDriver: true }),
    ]).start();
  }, [imageOpacity, imageOffset, imageScale]);

  return <View style={styles.screen}>
    <StatusBar style="dark" />
    <SafeAreaView edges={[]} style={styles.safe}>
      <ScrollView automaticallyAdjustContentInsets={false} contentInsetAdjustmentBehavior="never" contentContainerStyle={[styles.content, { paddingTop: insets.top + 22 }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel="Open Nod settings" onPress={() => router.push('/settings')} style={({ pressed }) => [styles.settingsButton, pressed && styles.settingsButtonPressed]}><SymbolView name={{ ios: 'gearshape' as never, android: 'settings' as never, web: 'settings' as never }} size={19} weight="medium" tintColor={palette.secondary} /></Pressable></View>
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

      {connected ? <>
        <View style={styles.statusCard}>
          <View style={styles.statusHeading}><View style={styles.statusDot} /><Text style={styles.statusTitle}>Nod ready</Text></View>
          <View style={styles.statusMeta}><Text style={styles.statusBattery}>{nod.batteryPercent}% battery</Text><Text style={styles.statusSync}>{nod.lastSyncLabel.replace('Synced ', '')}</Text></View>
        </View>

        <View style={styles.usageSection}><Text style={styles.sectionTitle}>Your Nod moments</Text><View style={styles.momentsCard}><View style={styles.momentsHeader}><View><Text style={styles.momentsCount}>{usage.momentsKept}</Text><Text style={styles.momentsLabel}>moments kept</Text></View><View style={styles.walkCount}><Text style={styles.walkCountValue}>{usage.walksWithNod}</Text><Text style={styles.walkCountLabel}>{usage.walksWithNod === 1 ? 'walk with Nod' : 'walks with Nod'}</Text></View></View>{usage.momentsKept > 0 ? <View style={styles.momentStrip}>{momentThumbnails.map((moment) => <Pressable key={moment.id} accessibilityRole="button" accessibilityLabel={`Open ${moment.title}`} accessibilityHint="Revisit this Nod story." disabled={!usage.lastWalkId} onPress={() => usage.lastWalkId && router.push({ pathname: '/recap', params: { storyId: usage.lastWalkId } })} style={({ pressed }) => [styles.momentThumbnailButton, pressed && styles.cardPressed]}><Image source={moment.image ?? nodAsset} contentFit="cover" style={styles.momentThumbnail} /></Pressable>)}{usage.momentsKept > momentThumbnails.length ? <Pressable accessibilityRole="button" accessibilityLabel={`Open ${usage.momentsKept - momentThumbnails.length} more Nod moments`} onPress={() => usage.lastWalkId && router.push({ pathname: '/recap', params: { storyId: usage.lastWalkId } })} style={({ pressed }) => [styles.moreMoments, pressed && styles.cardPressed]}><Text style={styles.moreMomentsText}>+{usage.momentsKept - momentThumbnails.length}</Text></Pressable> : null}</View> : <Text style={styles.lastUsed}>Your first Nod moment will appear here.</Text>}</View>{usage.lastUsedAt ? <Pressable accessibilityRole="button" accessibilityLabel={`Open your latest Nod walk, ${usage.lastWalkTitle}`} accessibilityHint="Revisit this story." onPress={() => usage.lastWalkId && router.push({ pathname: '/recap', params: { storyId: usage.lastWalkId } })} style={({ pressed }) => [styles.lastWalk, pressed && styles.cardPressed]}><View style={styles.lastWalkImageWrap}><Image source={latestMoment.image ?? nodAsset} contentFit="cover" style={styles.lastWalkImage} /></View><View style={styles.lastWalkCopy}><Text style={styles.lastWalkLabel}>Last used {formatLastUsed(usage.lastUsedAt)}</Text><Text style={styles.lastWalkTitle} numberOfLines={1}>{usage.lastWalkTitle}</Text><Text style={styles.lastWalkLocation} numberOfLines={1}>{usage.lastWalkLocation}</Text></View><Text style={styles.lastWalkArrow}>›</Text></Pressable> : null}</View>

        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/settings', params: { open: 'nod' } })} style={({ pressed }) => [styles.manageButton, pressed && styles.connectButtonPressed]}><Text style={styles.manageButtonText}>Manage Nod</Text><Text style={styles.manageChevron}>›</Text></Pressable>
      </> : null}

      </ScrollView>
      <TopFade safeTop={insets.top} />
    </SafeAreaView>
  </View>;
}

function TopFade({ safeTop }: { safeTop: number }) {
  return <View pointerEvents="none" style={[styles.topFade, { height: safeTop + 30 }]}>{topFadeOpacity.map((opacity, index) => <View key={index} style={[styles.topFadeStrip, { opacity }]} />)}</View>;
}

function formatLastUsed(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'recently';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  safe: { flex: 1, backgroundColor: palette.background },
  header: { width: '100%', height: 44, alignItems: 'flex-end', justifyContent: 'center', marginBottom: 28, marginRight: -8 },
  settingsButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E9E8' },
  settingsButtonPressed: { opacity: 0.68 },
  content: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 26, paddingBottom: 132 },
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }, topFadeStrip: { flex: 1, backgroundColor: palette.background },
  intro: { width: '100%', maxWidth: 420, alignItems: 'center' },
  headline: { color: palette.text, fontSize: 30, lineHeight: 35, fontWeight: '700', letterSpacing: -0.9, textAlign: 'center' },
  description: { maxWidth: 310, color: palette.secondary, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 11 },
  deviceArea: { minHeight: 248, width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: 5 },
  device: { width: 320, height: 235, alignItems: 'center', justifyContent: 'center' },
  devicePressed: { transform: [{ scale: 0.975 }] }, deviceOffline: { opacity: 0.72 },
  deviceImageWrap: { width: '100%', height: '100%' }, deviceImage: { width: '100%', height: '100%' },
  pressFeedback: { minHeight: 22, color: palette.secondary, fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: -2 }, connectButton: { minWidth: 144, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: palette.accent, marginTop: 0 }, connectButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' }, connectButtonPressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
  statusCard: { width: '100%', minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 28, paddingHorizontal: 16, borderRadius: 18, backgroundColor: '#E7F0E8' },
  statusHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 }, statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.accent }, statusTitle: { color: palette.text, fontSize: 15, fontWeight: '800' },
  statusMeta: { alignItems: 'flex-end', gap: 2 }, statusBattery: { color: palette.text, fontSize: 13, fontWeight: '800' }, statusSync: { color: palette.secondary, fontSize: 11, fontWeight: '600' },
  usageSection: { width: '100%', marginTop: 30 }, sectionTitle: { color: palette.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 }, momentsCard: { marginTop: 12, padding: 16, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line }, momentsHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }, momentsCount: { color: palette.text, fontSize: 32, lineHeight: 35, fontWeight: '800', letterSpacing: -1 }, momentsLabel: { color: palette.secondary, fontSize: 13, fontWeight: '700', marginTop: 2 }, walkCount: { alignItems: 'flex-end', paddingBottom: 2 }, walkCountValue: { color: palette.accent, fontSize: 18, lineHeight: 21, fontWeight: '800' }, walkCountLabel: { color: palette.secondary, fontSize: 11, fontWeight: '600', marginTop: 2 }, momentStrip: { flexDirection: 'row', gap: 8, marginTop: 16 }, momentThumbnailButton: { flex: 1, height: 64, borderRadius: 12 }, momentThumbnail: { width: '100%', height: '100%', borderRadius: 12, backgroundColor: '#E7F0E8' }, moreMoments: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#E7F0E8' }, moreMomentsText: { color: palette.accent, fontSize: 15, fontWeight: '800' }, lastWalk: { minHeight: 84, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, padding: 10, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line }, lastWalkImageWrap: { width: 62, height: 62, overflow: 'hidden', borderRadius: 13, backgroundColor: '#E7F0E8' }, lastWalkImage: { width: '100%', height: '100%' }, lastWalkCopy: { flex: 1 }, lastWalkLabel: { color: palette.secondary, fontSize: 11, fontWeight: '700' }, lastWalkTitle: { color: palette.text, fontSize: 15, fontWeight: '800', marginTop: 4 }, lastWalkLocation: { color: palette.secondary, fontSize: 12, marginTop: 2 }, lastWalkArrow: { color: palette.accent, fontSize: 23, lineHeight: 20, paddingHorizontal: 4 }, lastUsed: { color: palette.secondary, fontSize: 13, marginTop: 12 }, cardPressed: { opacity: 0.72 },
  manageButton: { width: '100%', minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 25, borderRadius: 17, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line }, manageButtonText: { color: palette.accent, fontSize: 15, fontWeight: '800' }, manageChevron: { color: palette.accent, fontSize: 24, lineHeight: 24, marginLeft: 8, marginTop: -2 },
});
