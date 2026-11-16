import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type MarkingPreference, saveOnboarding } from '@/lib/onboarding';
import { colors } from '@/constants/trailmark-theme';

const palette = colors.light;
type Step = 'welcome' | 'marking';

export default function OnboardingScreen() {
  const [step, setStep] = useState<Step>('welcome');
  const [markingPreference, setMarkingPreference] = useState<MarkingPreference | null>(null);

  const finish = () => {
    if (!markingPreference) return;
    saveOnboarding(markingPreference);
    router.replace(markingPreference === 'nod' ? '/pair-nod' : '/(tabs)/trails');
  };

  return <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
    <StatusBar style="dark" />
    <View style={styles.topbar}>
      <Text style={styles.brand}>TRAILMARK</Text>
      {step === 'marking' ? <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => setStep('welcome')} hitSlop={12}><Text style={styles.back}>Back</Text></Pressable> : <View style={styles.topbarSpacer} />}
    </View>

    {step === 'welcome' ? <Welcome onContinue={() => setStep('marking')} /> : <MarkingChoice markingPreference={markingPreference} onSelect={setMarkingPreference} onFinish={finish} />}
  </SafeAreaView>;
}

function Welcome({ onContinue }: { onContinue: () => void }) {
  return <View style={styles.fill}>
    <View style={styles.welcomeMain}>
      <View accessibilityElementsHidden style={styles.markVisual}>
        <View style={styles.markRingOne}><View style={styles.markRingTwo}><View style={styles.markDot} /></View></View>
      </View>
      <Text style={styles.welcomeTitle}>Notice what{ '\n' }stays with you.</Text>
      <Text style={styles.welcomeDescription}>TrailMark helps you hold onto the moments you want to revisit after a hike.</Text>
    </View>
    <View style={styles.bottomAction}><PageIndicator active={0} /><PrimaryButton label="Get started" onPress={onContinue} /></View>
  </View>;
}

function MarkingChoice({ markingPreference, onSelect, onFinish }: { markingPreference: MarkingPreference | null; onSelect: (value: MarkingPreference) => void; onFinish: () => void }) {
  return <View style={styles.fill}>
    <View style={styles.choiceMain}>
      <Text style={styles.choiceTitle}>How do you want to{ '\n' }keep a moment?</Text>
      <Text style={styles.choiceDescription}>You can change this anytime.</Text>
      <View style={styles.options}>
        <Choice option="nod" title="Use Nod" description="Press once when something catches your attention." selected={markingPreference === 'nod'} onPress={() => onSelect('nod')} />
        <Choice option="phone" title="Use my phone" description="Tap to keep a moment in TrailMark." selected={markingPreference === 'phone'} onPress={() => onSelect('phone')} />
      </View>
    </View>
    <View style={styles.bottomAction}><PageIndicator active={1} /><PrimaryButton label="Continue" disabled={!markingPreference} onPress={onFinish} /></View>
  </View>;
}

function Choice({ option, title, description, selected, onPress }: { option: MarkingPreference; title: string; description: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} accessibilityLabel={title} accessibilityHint={description} onPress={onPress} style={({ pressed }) => [styles.choice, selected && styles.choiceSelected, pressed && styles.pressed]}>
    <View style={[styles.choiceIcon, selected && styles.choiceIconSelected]}>{option === 'nod' ? <View style={styles.nodGlyph}><View style={styles.nodGlyphInner} /></View> : <View style={styles.phoneGlyph}><View style={styles.phoneGlyphSpeaker} /></View>}</View>
    <View style={styles.choiceCopy}><Text style={[styles.choiceTitleText, selected && styles.choiceTitleTextSelected]}>{title}</Text><Text style={[styles.choiceDescriptionText, selected && styles.choiceDescriptionTextSelected]}>{description}</Text></View>
    <View style={[styles.radio, selected && styles.radioSelected]}>{selected ? <View style={styles.radioDot} /> : null}</View>
  </Pressable>;
}

function PageIndicator({ active }: { active: 0 | 1 }) {
  return <View accessibilityElementsHidden style={styles.indicator}>{[0, 1].map((index) => <View key={index} style={[styles.indicatorDot, active === index && styles.indicatorDotActive]} />)}</View>;
}

function PrimaryButton({ label, disabled = false, onPress }: { label: string; disabled?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.primaryButton, disabled && styles.primaryButtonDisabled, pressed && !disabled && styles.primaryButtonPressed]}><Text style={[styles.primaryButtonText, disabled && styles.primaryButtonTextDisabled]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  topbar: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 25 },
  brand: { color: palette.text, fontSize: 11, fontWeight: '800', letterSpacing: 1.8 }, topbarSpacer: { width: 36 }, back: { color: palette.accent, fontSize: 15, fontWeight: '600' },
  fill: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 25 },
  welcomeMain: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 30 }, markVisual: { width: 128, height: 128, alignItems: 'center', justifyContent: 'center', marginBottom: 39 }, markRingOne: { width: 128, height: 128, alignItems: 'center', justifyContent: 'center', borderRadius: 64, borderWidth: 1, borderColor: '#B4CDB9', backgroundColor: '#E7EFE7' }, markRingTwo: { width: 88, height: 88, alignItems: 'center', justifyContent: 'center', borderRadius: 44, borderWidth: 1, borderColor: '#8DB295', backgroundColor: '#CEE1D1' }, markDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: palette.accent },
  welcomeTitle: { color: palette.text, fontSize: 35, lineHeight: 40, fontWeight: '700', letterSpacing: -1.1, textAlign: 'center' }, welcomeDescription: { maxWidth: 310, color: palette.secondary, fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 15 },
  choiceMain: { flex: 1, paddingTop: 61 }, choiceTitle: { color: palette.text, fontSize: 32, lineHeight: 38, fontWeight: '700', letterSpacing: -1, textAlign: 'center' }, choiceDescription: { maxWidth: 310, alignSelf: 'center', color: palette.secondary, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 13 }, options: { gap: 12, marginTop: 40 }, choice: { minHeight: 105, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 22, borderWidth: 1, borderColor: '#D9E3DA', backgroundColor: palette.surface }, choiceSelected: { borderColor: palette.accent, backgroundColor: '#EEF6EF' }, choiceIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#E8EFE9' }, choiceIconSelected: { backgroundColor: '#D3E7D6' }, nodGlyph: { width: 25, height: 29, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#33433A' }, nodGlyphInner: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#DCE9DE' }, phoneGlyph: { width: 17, height: 29, alignItems: 'center', borderRadius: 5, borderWidth: 2, borderColor: '#33433A', paddingTop: 4 }, phoneGlyphSpeaker: { width: 7, height: 1.5, borderRadius: 1, backgroundColor: '#33433A' }, choiceCopy: { flex: 1 }, choiceTitleText: { color: palette.text, fontSize: 16, fontWeight: '700' }, choiceTitleTextSelected: { color: '#155138' }, choiceDescriptionText: { color: palette.secondary, fontSize: 12, lineHeight: 17, marginTop: 4 }, choiceDescriptionTextSelected: { color: '#356348' }, radio: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderRadius: 11, borderWidth: 1.5, borderColor: '#AAB7AD' }, radioSelected: { borderColor: palette.accent }, radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: palette.accent },
  bottomAction: { paddingTop: 18, paddingBottom: 4 }, indicator: { flexDirection: 'row', alignSelf: 'center', gap: 6, marginBottom: 20 }, indicatorDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#BECABF' }, indicatorDotActive: { width: 19, backgroundColor: palette.accent }, primaryButton: { height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: palette.accent }, primaryButtonDisabled: { backgroundColor: '#D7E0D8' }, primaryButtonPressed: { opacity: 0.84, transform: [{ scale: 0.99 }] }, primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }, primaryButtonTextDisabled: { color: '#849286' }, pressed: { opacity: 0.78 },
});
