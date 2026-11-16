import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/trailmark-theme';

const palette = colors.light;
const nodAsset = require('../../assets/images/transparent-nod.png');
type Step = 0 | 1 | 2 | 3;

export default function NodTutorialScreen() {
  const [step, setStep] = useState<Step>(0);
  const [pressed, setPressed] = useState(false);
  const [pulse] = useState(() => new Animated.Value(0));
  const [imageScale] = useState(() => new Animated.Value(0.92));
  const [imageOpacity] = useState(() => new Animated.Value(0));
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
  const advance = () => { if (isTry) { setPressed(true); setStep(3); return; } if (step < 3) setStep((step + 1) as Step); };
  return <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
    <StatusBar style="dark" />
    <View style={styles.topbar}><Pressable accessibilityRole="button" accessibilityLabel="Close Nod tutorial" onPress={() => router.back()}><Text style={styles.close}>Close</Text></Pressable></View>
    <View style={styles.content}>
      <View style={styles.copy}><Text accessibilityRole="header" style={styles.title}>{step === 0 ? 'Meet Nod.' : step === 1 ? 'Stay in the moment.' : step === 2 ? 'Press when it matters.' : 'Keep moving.'}</Text><Text style={styles.description}>{step === 0 ? 'A small, screenless companion for moments you do not want to interrupt.' : step === 1 ? 'Keep your phone away. Nod keeps the interaction to one intentional press.' : step === 2 ? 'No screen. No sorting. Just press Nod and keep walking.' : 'A quiet cue confirms TrailMark received it. Make sense of the moment later.'}</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel={isTry ? 'Press Nod to try it' : 'Nod device'} onPress={isTry ? advance : undefined} disabled={!isTry} style={({ pressed: isPressed }) => [styles.device, isTry && styles.deviceReady, isPressed && styles.devicePressed]}>
        {isTry ? <Animated.View pointerEvents="none" style={[styles.listeningAura, { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.42, 0] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1.16] }) }] }]} /> : null}
        <Animated.View style={{ opacity: imageOpacity, transform: [{ scale: imageScale }] }}><Image source={nodAsset} contentFit="contain" style={styles.deviceImage} /></Animated.View>
      </Pressable>
      <Text accessibilityLiveRegion="polite" style={styles.hint}>{isTry ? 'Tap Nod above' : step === 3 ? (pressed ? 'Moment saved' : 'You’re ready to walk') : ' '}</Text>
    </View>
    <View style={styles.bottom}><View style={styles.progress}>{[0, 1, 2, 3].map((index) => <View key={index} style={[styles.progressDot, index === step && styles.progressDotActive]} />)}</View>{step < 3 ? <Pressable accessibilityRole="button" onPress={advance} style={({ pressed: isPressed }) => [styles.action, isPressed && styles.actionPressed]}><Text style={styles.actionText}>{isTry ? 'Try it' : 'Continue'}</Text></Pressable> : <Pressable accessibilityRole="button" onPress={() => router.back()} style={({ pressed: isPressed }) => [styles.action, isPressed && styles.actionPressed]}><Text style={styles.actionText}>Done</Text></Pressable>}</View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: palette.background }, topbar: { height: 56, justifyContent: 'center', paddingHorizontal: 25 }, close: { color: palette.secondary, fontSize: 15, fontWeight: '600' }, content: { flex: 1, alignItems: 'center', paddingHorizontal: 26, paddingTop: 52 }, copy: { alignItems: 'center', minHeight: 138 }, title: { color: palette.text, fontSize: 34, lineHeight: 40, fontWeight: '700', letterSpacing: -1, textAlign: 'center' }, description: { maxWidth: 310, color: palette.secondary, fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 13 }, device: { width: 286, height: 224, alignItems: 'center', justifyContent: 'center', marginTop: 20 }, deviceReady: { borderRadius: 120, backgroundColor: '#EAF3EA', shadowColor: '#A9D7AE', shadowOpacity: 0.65, shadowRadius: 26, elevation: 8 }, devicePressed: { transform: [{ scale: 0.96 }] }, deviceImage: { width: 262, height: 205 }, listeningAura: { position: 'absolute', width: 210, height: 210, borderRadius: 105, backgroundColor: '#DDF0DF', shadowColor: '#A9D7AE', shadowOpacity: 0.38, shadowRadius: 30, elevation: 10 }, hint: { minHeight: 22, color: palette.secondary, fontSize: 14, fontWeight: '600', marginTop: 19 }, bottom: { paddingHorizontal: 25, paddingBottom: 16 }, progress: { flexDirection: 'row', alignSelf: 'center', gap: 6, marginBottom: 19 }, progressDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#BECABF' }, progressDotActive: { width: 19, backgroundColor: palette.accent }, action: { height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: palette.accent }, actionPressed: { opacity: 0.84, transform: [{ scale: 0.99 }] }, actionText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' } });
