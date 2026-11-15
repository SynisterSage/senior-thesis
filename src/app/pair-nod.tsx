import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { setNodConnected } from '@/lib/onboarding';
import { colors } from '@/constants/trailmark-theme';

const palette = colors.light;
const nodAsset = require('../../assets/images/transparent-nod.png');
type PairingState = 'ready' | 'listening' | 'connected';

export default function PairNodScreen() {
  const [pairingState, setPairingState] = useState<PairingState>('ready');

  const beginPairing = () => {
    setPairingState('listening');
  };

  const confirmButtonPress = () => {
    if (pairingState !== 'listening') return;
    setNodConnected(true);
    setPairingState('connected');
  };

  const finish = () => router.replace('/(tabs)/trails');

  return <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
    <StatusBar style="dark" />
    <View style={styles.topbar}><Text style={styles.brand}>TRAILMARK</Text></View>
    <View style={styles.content}>
      <Text accessibilityRole="header" style={styles.title}>{pairingState === 'connected' ? 'That came through.' : pairingState === 'listening' ? 'Find your Nod.' : 'Meet Nod.'}</Text>
      <Text style={styles.description}>{pairingState === 'connected' ? 'Nod is ready to keep a moment while you keep moving.' : pairingState === 'listening' ? 'Press Nod once to connect it to this hike.' : 'A quiet way to keep something that catches your attention.'}</Text>
      <NodDevice state={pairingState} onPress={confirmButtonPress} />
      <Text accessibilityLiveRegion="polite" style={styles.status}>{pairingState === 'ready' ? 'Ready when you are' : pairingState === 'listening' ? 'Listening for Nod…' : 'Connected and ready'}</Text>
    </View>
    <View style={styles.actions}>
      {pairingState === 'ready' ? <><Action label="Bring Nod to life" onPress={beginPairing} /><Pressable accessibilityRole="button" onPress={finish} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>Set up later</Text></Pressable></> : null}
      {pairingState === 'listening' ? <Action label="Press the device above" disabled onPress={() => {}} /> : null}
      {pairingState === 'connected' ? <Action label="Start exploring" onPress={finish} /> : null}
    </View>
  </SafeAreaView>;
}

function NodDevice({ state, onPress }: { state: PairingState; onPress: () => void }) {
  const connected = state === 'connected';
  const canPress = state === 'listening';
  return <Pressable accessibilityRole="button" accessibilityLabel={canPress ? 'Press Nod to connect' : connected ? 'Nod connected' : 'Nod device'} accessibilityState={{ disabled: !canPress }} disabled={!canPress} onPress={onPress} style={({ pressed }) => [styles.device, connected && styles.deviceConnected, canPress && styles.deviceListening, pressed && styles.devicePressed]}>
    <Image pointerEvents="none" source={nodAsset} contentFit="contain" style={styles.deviceImage} />
    <View style={[styles.deviceLight, connected && styles.deviceLightConnected, canPress && styles.deviceLightListening]}>{state === 'listening' ? <ActivityIndicator size="small" color="#D8E9DA" /> : null}</View>
  </Pressable>;
}

function Action({ label, disabled = false, onPress }: { label: string; disabled?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.action, disabled && styles.actionDisabled, pressed && !disabled && styles.actionPressed]}><Text style={styles.actionText}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  topbar: { height: 54, justifyContent: 'center', paddingHorizontal: 25 }, brand: { color: palette.text, fontSize: 11, fontWeight: '800', letterSpacing: 1.8 },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 26, paddingTop: 64 }, title: { color: palette.text, fontSize: 33, lineHeight: 39, fontWeight: '700', letterSpacing: -1, textAlign: 'center' }, description: { maxWidth: 300, color: palette.secondary, fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 12 },
  device: { width: 246, height: 194, alignItems: 'center', justifyContent: 'center', marginTop: 43 }, deviceConnected: { transform: [{ scale: 1.02 }] }, deviceListening: { shadowColor: '#A9D7AE', shadowOpacity: 0.55, shadowRadius: 22, elevation: 10 }, devicePressed: { transform: [{ scale: 0.975 }] }, deviceImage: { width: '100%', height: '100%' }, deviceLight: { position: 'absolute', bottom: 12, width: 34, height: 5, alignItems: 'center', justifyContent: 'center', borderRadius: 3, backgroundColor: 'transparent' }, deviceLightConnected: { backgroundColor: '#A9D7AE', shadowColor: '#A9D7AE', shadowOpacity: 0.85, shadowRadius: 8, elevation: 5 }, deviceLightListening: { backgroundColor: '#A9D7AE' }, status: { minHeight: 22, color: palette.secondary, fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 31 },
  actions: { paddingHorizontal: 25, paddingBottom: 17 }, action: { height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: palette.accent }, actionDisabled: { backgroundColor: '#5C8169' }, actionPressed: { opacity: 0.84, transform: [{ scale: 0.99 }] }, actionText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }, secondaryAction: { height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 8 }, secondaryActionText: { color: palette.secondary, fontSize: 15, fontWeight: '600' },
});
