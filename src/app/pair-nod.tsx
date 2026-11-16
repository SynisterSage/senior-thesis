import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { setNodConnected } from '@/lib/onboarding';
import { colors } from '@/constants/trailmark-theme';

const palette = colors.light;
const nodAsset = require('../../assets/images/transparent-nod.png');
type PairingState = 'ready' | 'listening' | 'connected';

export default function PairNodScreen() {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const [pairingState, setPairingState] = useState<PairingState>('ready');

  const beginPairing = () => {
    setPairingState('listening');
  };

  const confirmButtonPress = () => {
    if (pairingState !== 'listening') return;
    setNodConnected(true);
    setPairingState('connected');
  };

  const finish = () => router.replace(returnTo === 'settings' ? { pathname: '/settings', params: { open: 'nod' } } : '/(tabs)/trails');

  return <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
    <StatusBar style="dark" />
    <View style={styles.content}>
      <Text accessibilityRole="header" style={styles.title}>{pairingState === 'connected' ? 'Nod is ready.' : pairingState === 'listening' ? 'Give Nod a tap.' : 'Meet Nod.'}</Text>
      <Text style={styles.description}>{pairingState === 'connected' ? 'Keep your phone away. Nod will keep the moment.' : pairingState === 'listening' ? 'One tap is all it takes.' : 'A little way to keep what catches your attention.'}</Text>
      <NodDevice state={pairingState} onPress={confirmButtonPress} />
      <View style={styles.statusRow}>
        {pairingState === 'listening' ? <ListeningIndicator /> : <View style={[styles.statusDot, pairingState === 'connected' && styles.statusDotConnected]} />}
        <Text accessibilityLiveRegion="polite" style={styles.status}>{pairingState === 'ready' ? 'Ready when you are' : pairingState === 'listening' ? 'Waiting for your tap' : 'Connected and ready'}</Text>
      </View>
    </View>
    <View style={styles.actions}>
      {pairingState === 'ready' ? <><Pressable accessibilityRole="button" onPress={finish} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>Set up later</Text></Pressable><Action label="Meet Nod" onPress={beginPairing} /></> : null}
      {pairingState === 'connected' ? <Action label="Start exploring" onPress={finish} /> : null}
    </View>
  </SafeAreaView>;
}

function NodDevice({ state, onPress }: { state: PairingState; onPress: () => void }) {
  const connected = state === 'connected';
  const canPress = state === 'listening';
  const [pulse] = useState(() => new Animated.Value(0));
  const [connectionProgress] = useState(() => new Animated.Value(1));
  const [connectionPulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!canPress) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [canPress, pulse]);

  useEffect(() => {
    if (!connected) {
      connectionProgress.setValue(1);
      connectionPulse.setValue(0);
      return;
    }
    connectionProgress.setValue(0);
    connectionPulse.setValue(0);
    const reveal = Animated.spring(connectionProgress, { toValue: 1, damping: 13, stiffness: 180, mass: 0.65, useNativeDriver: true });
    const pulseAnimation = Animated.sequence([
      Animated.timing(connectionPulse, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(connectionPulse, { toValue: 0, duration: 620, useNativeDriver: true }),
    ]);
    reveal.start();
    pulseAnimation.start();
    return () => {
      reveal.stop();
      pulseAnimation.stop();
    };
  }, [connected, connectionProgress, connectionPulse]);

  return <Pressable accessibilityRole="button" accessibilityLabel={canPress ? 'Press Nod to connect' : connected ? 'Nod connected' : 'Nod device'} accessibilityState={{ disabled: !canPress }} disabled={!canPress} onPress={onPress} style={({ pressed }) => [styles.device, canPress && styles.deviceListening, pressed && styles.devicePressed]}>
    {canPress ? <Animated.View pointerEvents="none" style={[styles.listeningAura, { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.42, 0] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1.16] }) }] }]} /> : null}
    {connected ? <Animated.View pointerEvents="none" style={[styles.connectedGlow, { opacity: connectionPulse.interpolate({ inputRange: [0, 1], outputRange: [0, 0.72] }), transform: [{ scale: connectionPulse.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1.2] }) }] }]} /> : null}
    <Animated.View pointerEvents="none" style={[styles.deviceImageWrap, { opacity: connectionProgress.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }), transform: [{ scale: connectionProgress.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }, { scale: connectionPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.055] }) }] }]}>
      <Image source={nodAsset} contentFit="contain" style={styles.deviceImage} />
    </Animated.View>
  </Pressable>;
}

function ListeningIndicator() {
  return <View style={styles.listeningIndicator}><View style={styles.listeningIndicatorCore} /></View>;
}

function Action({ label, disabled = false, onPress }: { label: string; disabled?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.action, disabled && styles.actionDisabled, pressed && !disabled && styles.actionPressed]}><Text style={styles.actionText}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 26, paddingTop: 64 }, title: { color: palette.text, fontSize: 33, lineHeight: 39, fontWeight: '700', letterSpacing: -1, textAlign: 'center' }, description: { width: '100%', maxWidth: 300, height: 46, color: palette.secondary, fontSize: 16, lineHeight: 23, textAlign: 'center', textAlignVertical: 'center', marginTop: 12 },
  device: { width: 246, height: 194, alignItems: 'center', justifyContent: 'center', marginTop: 43 }, deviceListening: { shadowColor: '#A9D7AE', shadowOpacity: 0.55, shadowRadius: 22, elevation: 10 }, devicePressed: { transform: [{ scale: 0.975 }] }, deviceImageWrap: { width: '100%', height: '100%' }, deviceImage: { width: '100%', height: '100%' }, connectedGlow: { position: 'absolute', width: 190, height: 190, borderRadius: 95, backgroundColor: '#CFEAD2', shadowColor: '#A9D7AE', shadowOpacity: 0.7, shadowRadius: 26, elevation: 10 }, listeningAura: { position: 'absolute', width: 210, height: 210, borderRadius: 105, backgroundColor: '#DDF0DF', shadowColor: '#A9D7AE', shadowOpacity: 0.38, shadowRadius: 30, elevation: 10 }, statusRow: { minHeight: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 31 }, status: { color: palette.secondary, fontSize: 14, fontWeight: '600', textAlign: 'center' }, statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#B9C7BB' }, statusDotConnected: { backgroundColor: '#78B986' }, listeningIndicator: { width: 10, height: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 5, backgroundColor: '#D9ECDD' }, listeningIndicatorCore: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#4D9960' },
  actions: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 116, justifyContent: 'flex-end', paddingHorizontal: 25, paddingBottom: 17 }, action: { height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: palette.accent }, actionDisabled: { backgroundColor: '#5C8169' }, actionPressed: { opacity: 0.84, transform: [{ scale: 0.99 }] }, actionText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }, secondaryAction: { height: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }, secondaryActionText: { color: palette.secondary, fontSize: 15, fontWeight: '600' },
});
