import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { setNodConnected } from '@/lib/onboarding';
import { colors } from '@/constants/trailmark-theme';

const palette = colors.light;
type PairingState = 'ready' | 'connecting' | 'connected';

export default function PairNodScreen() {
  const [pairingState, setPairingState] = useState<PairingState>('ready');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const beginPairing = () => {
    setPairingState('connecting');
    timer.current = setTimeout(() => {
      setNodConnected(true);
      setPairingState('connected');
    }, 900);
  };

  const finish = () => router.replace('/(tabs)/trails');

  return <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
    <StatusBar style="dark" />
    <View style={styles.topbar}><Text style={styles.brand}>TRAILMARK</Text></View>
    <View style={styles.content}>
      <Text accessibilityRole="header" style={styles.title}>{pairingState === 'connected' ? 'Nod is connected.' : 'Pair Nod.'}</Text>
      <Text style={styles.description}>{pairingState === 'connected' ? 'You can now mark a moment with one press while you hike.' : 'Keep Nod nearby, then press its button once.'}</Text>
      <NodDevice state={pairingState} />
      <Text accessibilityLiveRegion="polite" style={styles.status}>{pairingState === 'ready' ? 'Ready to pair' : pairingState === 'connecting' ? 'Looking for Nod…' : 'Connected'}</Text>
    </View>
    <View style={styles.actions}>
      {pairingState === 'ready' ? <><Action label="Pair Nod" onPress={beginPairing} /><Pressable accessibilityRole="button" onPress={finish} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>Set up later</Text></Pressable></> : null}
      {pairingState === 'connecting' ? <Action label="Connecting…" disabled onPress={() => {}} /> : null}
      {pairingState === 'connected' ? <Action label="Start exploring" onPress={finish} /> : null}
    </View>
  </SafeAreaView>;
}

function NodDevice({ state }: { state: PairingState }) {
  const connected = state === 'connected';
  return <View accessibilityElementsHidden style={[styles.device, connected && styles.deviceConnected]}>
    <Text style={styles.deviceName}>TRAILMARK</Text>
    <View style={styles.outerRing}><View style={styles.middleRing}><View style={styles.innerRing}><View style={styles.buttonCenter} /></View></View></View>
    <View style={[styles.deviceLight, connected && styles.deviceLightConnected]}>{state === 'connecting' ? <ActivityIndicator size="small" color="#D8E9DA" /> : null}</View>
  </View>;
}

function Action({ label, disabled = false, onPress }: { label: string; disabled?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.action, disabled && styles.actionDisabled, pressed && !disabled && styles.actionPressed]}><Text style={styles.actionText}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  topbar: { height: 54, justifyContent: 'center', paddingHorizontal: 25 }, brand: { color: palette.text, fontSize: 11, fontWeight: '800', letterSpacing: 1.8 },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 26, paddingTop: 64 }, title: { color: palette.text, fontSize: 33, lineHeight: 39, fontWeight: '700', letterSpacing: -1, textAlign: 'center' }, description: { maxWidth: 300, color: palette.secondary, fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 12 },
  device: { width: 198, height: 234, alignItems: 'center', justifyContent: 'center', borderRadius: 76, borderWidth: 1, borderColor: '#59625D', backgroundColor: '#303733', shadowColor: '#142219', shadowOpacity: 0.22, shadowRadius: 20, shadowOffset: { width: 0, height: 14 }, elevation: 8, marginTop: 43 }, deviceConnected: { backgroundColor: '#35443A' }, deviceName: { position: 'absolute', top: 23, color: '#CFD5CF', fontSize: 9, fontWeight: '700', letterSpacing: 2.1 }, outerRing: { width: 137, height: 137, alignItems: 'center', justifyContent: 'center', borderRadius: 69, borderWidth: 2, borderColor: '#171C19', backgroundColor: '#252B27' }, middleRing: { width: 118, height: 118, alignItems: 'center', justifyContent: 'center', borderRadius: 59, borderWidth: 2, borderColor: '#4D5650' }, innerRing: { width: 98, height: 98, alignItems: 'center', justifyContent: 'center', borderRadius: 49, borderWidth: 2, borderColor: '#606A62', backgroundColor: '#424A44' }, buttonCenter: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: '#78817A', backgroundColor: '#505952' }, deviceLight: { position: 'absolute', bottom: 23, width: 34, height: 5, alignItems: 'center', justifyContent: 'center', borderRadius: 3, backgroundColor: '#59615C' }, deviceLightConnected: { backgroundColor: '#A9D7AE', shadowColor: '#A9D7AE', shadowOpacity: 0.85, shadowRadius: 8, elevation: 5 }, status: { minHeight: 22, color: palette.secondary, fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 31 },
  actions: { paddingHorizontal: 25, paddingBottom: 17 }, action: { height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: palette.accent }, actionDisabled: { backgroundColor: '#5C8169' }, actionPressed: { opacity: 0.84, transform: [{ scale: 0.99 }] }, actionText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }, secondaryAction: { height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 8 }, secondaryActionText: { color: palette.secondary, fontSize: 15, fontWeight: '600' },
});
