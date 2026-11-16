import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/trailmark-theme';

const palette = colors.light;
const nodAsset = require('../../assets/images/transparent-nod.png');
const momentImages = [
  require('../../assets/trails/grand-prismatic/overlook.jpg'),
  require('../../assets/trails/grand-prismatic/spring.jpg'),
  require('../../assets/trails/grand-prismatic/fairy-falls.jpg'),
];
type Step = 0 | 1 | 2 | 3;

export default function NodTutorialScreen() {
  const [step, setStep] = useState<Step>(0);
  const [pressed, setPressed] = useState(false);
  const [pulse] = useState(() => new Animated.Value(0));
  const [imageScale] = useState(() => new Animated.Value(0.92));
  const [imageOpacity] = useState(() => new Animated.Value(0));
  const [momentGather] = useState(() => new Animated.Value(0));
  const [nodCelebrate] = useState(() => new Animated.Value(0));
  const isTry = step === 2;
  useEffect(() => {
    imageOpacity.setValue(0);
    imageScale.setValue(0.92);
    Animated.parallel([
      Animated.timing(imageOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.spring(imageScale, { toValue: 1, damping: 12, stiffness: 150, mass: 0.7, useNativeDriver: true }),
    ]).start();
  }, [imageOpacity, imageScale, step]);
  useEffect(() => {
    if (!isTry) { pulse.stopAnimation(); pulse.setValue(0); return; }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [isTry, pulse]);
  useEffect(() => {
    if (step !== 3) { momentGather.stopAnimation(); nodCelebrate.stopAnimation(); momentGather.setValue(0); nodCelebrate.setValue(0); return; }
    momentGather.setValue(0);
    nodCelebrate.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(momentGather, { toValue: 1, duration: 1750, useNativeDriver: true }),
      Animated.sequence([
        Animated.spring(nodCelebrate, { toValue: 1, damping: 7, stiffness: 220, mass: 0.45, useNativeDriver: true }),
        Animated.spring(nodCelebrate, { toValue: 0, damping: 9, stiffness: 180, mass: 0.5, useNativeDriver: true }),
      ]),
    ]);
    animation.start();
    return () => animation.stop();
  }, [momentGather, nodCelebrate, step]);
  const advance = () => { if (isTry) { setPressed(true); setStep(3); return; } if (step < 3) setStep((step + 1) as Step); };
  return <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
    <StatusBar style="dark" />
    <View style={styles.topbar}><Pressable accessibilityRole="button" accessibilityLabel="Close Nod tutorial" onPress={() => router.back()}><Text style={styles.close}>Close</Text></Pressable></View>
    <View style={styles.content}>
      <View style={styles.copy}><Text accessibilityRole="header" style={styles.title}>{step === 0 ? 'Meet Nod.' : step === 1 ? 'Stay in the moment.' : step === 2 ? 'Press when it matters.' : 'Keep moving.'}</Text><Text style={styles.description}>{step === 0 ? 'A small, screenless companion for moments you do not want to interrupt.' : step === 1 ? 'Keep your phone away. Nod keeps the interaction to one intentional press.' : step === 2 ? 'No screen. No sorting. Just press Nod and keep walking.' : 'A quiet cue confirms TrailMark received it. Make sense of the moment later.'}</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel={isTry ? 'Press Nod to try it' : 'Nod device'} onPress={isTry ? advance : undefined} disabled={!isTry} style={({ pressed: isPressed }) => [styles.device, isTry && styles.deviceListening, isPressed && styles.devicePressed]}>
        {isTry ? <Animated.View pointerEvents="none" style={[styles.listeningAura, { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.42, 0] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1.16] }) }] }]} /> : null}
        {step === 3 ? <MomentOrbit progress={momentGather} layer="behind" /> : null}
        <Animated.View style={[styles.nodLayer, { opacity: imageOpacity, transform: [{ scale: Animated.multiply(imageScale, nodCelebrate.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] })) }] }]}><Image source={nodAsset} contentFit="contain" style={styles.deviceImage} /></Animated.View>
        {step === 3 ? <MomentOrbit progress={momentGather} layer="front" /> : null}
      </Pressable>
      <Text accessibilityLiveRegion="polite" style={styles.hint}>{isTry ? 'Tap Nod above' : step === 3 ? (pressed ? 'Moment saved' : 'You’re ready to walk') : ' '}</Text>
    </View>
    <View style={styles.bottom}><View style={styles.progress}>{[0, 1, 2, 3].map((index) => <View key={index} style={[styles.progressDot, index === step && styles.progressDotActive]} />)}</View>{step < 3 ? <Pressable accessibilityRole="button" onPress={advance} style={({ pressed: isPressed }) => [styles.action, isPressed && styles.actionPressed]}><Text style={styles.actionText}>{isTry ? 'Try it' : 'Continue'}</Text></Pressable> : <Pressable accessibilityRole="button" onPress={() => router.back()} style={({ pressed: isPressed }) => [styles.action, isPressed && styles.actionPressed]}><Text style={styles.actionText}>Done</Text></Pressable>}</View>
  </SafeAreaView>;
}

function MomentOrbit({ progress, layer }: { progress: Animated.Value; layer: 'behind' | 'front' }) {
  const phases = [0, 0.15, 0.3];
  const positions = [[-62, -30], [58, -40], [12, 57]];
  return <View pointerEvents="none" style={styles.orbit}>{momentImages.map((source, index) => {
    const start = phases[index];
    const end = start + 0.68;
    const p = progress.interpolate({ inputRange: [start, Math.min(start + 0.06, 0.98), Math.min(end, 0.99), 1], outputRange: [0, 0.05, 0.94, 1], extrapolate: 'clamp' });
    const [x, y] = positions[index];
    const layerOpacity = layer === 'behind'
      ? p.interpolate({ inputRange: [0, 0.08, 0.26, 0.36, 1], outputRange: [0, 0.8, 0.85, 0, 0] })
      : p.interpolate({ inputRange: [0, 0.28, 0.38, 0.76, 0.94, 1], outputRange: [0, 0, 1, 1, 0, 0] });
    return <Animated.View key={index} style={[styles.orbitTrack, { transform: [{ perspective: 700 }] }]}><Animated.View style={[styles.moment, { opacity: layerOpacity, transform: [{ translateX: p.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, x, 0] }) }, { translateY: p.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, y, 0] }) }, { scale: p.interpolate({ inputRange: [0, 0.18, 0.5, 0.82, 1], outputRange: [0.3, 0.64, 1.28, 1.08, 0.3] }) }, { rotate: p.interpolate({ inputRange: [0, 0.5, 1], outputRange: [`${index * 4}deg`, `${index === 1 ? 7 : -7}deg`, '0deg'] }) }, { rotateY: p.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['20deg', '0deg', '-20deg'] }) }] }]}><Image source={source} contentFit="cover" style={styles.momentImage} /></Animated.View></Animated.View>;
  })}</View>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: palette.background }, topbar: { height: 56, justifyContent: 'center', paddingHorizontal: 25 }, close: { color: palette.secondary, fontSize: 15, fontWeight: '600' }, content: { flex: 1, alignItems: 'center', paddingHorizontal: 26, paddingTop: 52 }, copy: { alignItems: 'center', minHeight: 138 }, title: { color: palette.text, fontSize: 34, lineHeight: 40, fontWeight: '700', letterSpacing: -1, textAlign: 'center' }, description: { maxWidth: 310, color: palette.secondary, fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 13 }, device: { width: 286, height: 224, alignItems: 'center', justifyContent: 'center', marginTop: 20 }, deviceListening: { shadowColor: '#A9D7AE', shadowOpacity: 0.55, shadowRadius: 22, elevation: 10 }, devicePressed: { transform: [{ scale: 0.96 }] }, nodLayer: { zIndex: 1 }, deviceImage: { width: 262, height: 205 }, listeningAura: { position: 'absolute', width: 210, height: 210, borderRadius: 105, backgroundColor: '#DDF0DF', shadowColor: '#A9D7AE', shadowOpacity: 0.38, shadowRadius: 30, elevation: 10 }, orbit: { position: 'absolute', width: 1, height: 1, alignItems: 'center', justifyContent: 'center' }, orbitTrack: { position: 'absolute', width: 1, height: 1, alignItems: 'center', justifyContent: 'center' }, moment: { position: 'absolute', width: 64, height: 64, overflow: 'hidden', borderRadius: 20, borderWidth: 3, borderColor: '#FFFFFF', shadowColor: '#193323', shadowOpacity: 0.18, shadowRadius: 10, elevation: 5 }, momentImage: { width: '100%', height: '100%' }, hint: { minHeight: 22, color: palette.secondary, fontSize: 14, fontWeight: '600', marginTop: 19 }, bottom: { paddingHorizontal: 25, paddingBottom: 16 }, progress: { flexDirection: 'row', alignSelf: 'center', gap: 6, marginBottom: 19 }, progressDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#BECABF' }, progressDotActive: { width: 19, backgroundColor: palette.accent }, action: { height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: palette.accent }, actionPressed: { opacity: 0.84, transform: [{ scale: 0.99 }] }, actionText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' } });
