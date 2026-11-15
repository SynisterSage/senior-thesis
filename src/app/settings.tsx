import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/trailmark-theme';
import { isNodConnected } from '@/lib/onboarding';
import { getIncludeWords, getLiveMapStyle, getReplayPace, setIncludeWords, setLiveMapStyle, setReplayPace, type LiveMapStyle, type ReplayPace } from '@/lib/trailmark-preferences';

const palette = colors.light;
// Replace these with the production site URLs when TrailMark is published.
const legalLinks = {
  privacy: 'https://trailmark.app/privacy',
  terms: 'https://trailmark.app/terms',
} as const;

export default function SettingsScreen() {
  const [nodConnected, setNodConnected] = useState(isNodConnected());
  const [liveMapStyle, setLiveMapStyleState] = useState<LiveMapStyle>(getLiveMapStyle());
  const [replayPace, setReplayPaceState] = useState<ReplayPace>(getReplayPace());
  const [includeWords, setIncludeWordsState] = useState(getIncludeWords());

  useFocusEffect(useCallback(() => {
    setNodConnected(isNodConnected());
    setLiveMapStyleState(getLiveMapStyle());
    setReplayPaceState(getReplayPace());
    setIncludeWordsState(getIncludeWords());
  }, []));

  return <SafeAreaView style={styles.screen} edges={['top']}>
    <StatusBar style="dark" />
    <View style={styles.topbar}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close settings" onPress={() => router.back()} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}><Text style={styles.closeText}>Close</Text></Pressable>
    </View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text accessibilityRole="header" style={styles.title}>Settings</Text>

      <Section label="MARKING">
        <SettingsRow icon="dot.radiowaves.left.and.right" androidIcon="bluetooth" title="Nod" detail={nodConnected ? 'Connected and ready' : 'Not connected'} action={nodConnected ? 'Manage' : 'Set up'} onPress={() => router.push('/pair-nod')} />
        <SettingsRow icon="iphone" androidIcon="phone_iphone" title="Phone marking" detail="Always available on this device" />
      </Section>

      <Section label="DEFAULTS">
        <PreferenceRow title="Live trail map" detail="Your map while you walk"><ChoiceControl value={liveMapStyle} choices={[['classic', 'Classic'], ['terrain', 'Terrain']]} onChange={(style) => { const next = style as LiveMapStyle; setLiveMapStyleState(next); setLiveMapStyle(next); }} /></PreferenceRow>
        <PreferenceRow title="Replay pace" detail="How moments unfold"><ChoiceControl value={replayPace} choices={[['gentle', 'Gentle'], ['quick', 'Quick']]} onChange={(pace) => { const next = pace as ReplayPace; setReplayPaceState(next); setReplayPace(next); }} /></PreferenceRow>
        <PreferenceRow title="Include my words" detail="Show reflections in new replays"><Switch accessibilityLabel="Include my words by default" value={includeWords} onValueChange={(value) => { setIncludeWordsState(value); setIncludeWords(value); }} trackColor={{ true: palette.accent }} /></PreferenceRow>
      </Section>

      <Section label="YOUR STORIES">
        <SettingsRow icon="square.stack" androidIcon="collections_bookmark" title="Archive" detail="Saved walks stay on this device" action="Open" onPress={() => router.replace('/(tabs)/archive')} />
      </Section>

      <Section label="LEGAL">
        <SettingsRow icon="hand.raised" androidIcon="privacy_tip" title="Privacy Policy" detail="How TrailMark handles your data" action="Read" onPress={() => { void WebBrowser.openBrowserAsync(legalLinks.privacy); }} />
        <SettingsRow icon="doc.text" androidIcon="description" title="Terms of Use" detail="Terms for using TrailMark" action="Read" onPress={() => { void WebBrowser.openBrowserAsync(legalLinks.terms); }} />
      </Section>

      <Section label="TRAILMARK">
        <SettingsRow icon="info.circle" androidIcon="info" title="About TrailMark" detail="Prototype · November 2026" />
      </Section>
    </ScrollView>
  </SafeAreaView>;
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return <View style={styles.section}><Text style={styles.sectionLabel}>{label}</Text><View style={styles.sectionCard}>{children}</View></View>;
}

function SettingsRow({ icon, androidIcon, title, detail, action, onPress }: { icon: string; androidIcon: string; title: string; detail: string; action?: string; onPress?: () => void }) {
  const row = <View style={styles.row}><View style={styles.rowIcon}><SymbolView name={{ ios: icon as never, android: androidIcon as never, web: androidIcon as never }} size={19} weight="medium" tintColor={palette.accent} /></View><View style={styles.rowCopy}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowDetail}>{detail}</Text></View>{action ? <Text style={styles.rowAction}>{action} ›</Text> : null}</View>;
  return onPress ? <Pressable accessibilityRole="button" accessibilityLabel={`${action} ${title}`} onPress={onPress} style={({ pressed }) => [styles.rowButton, pressed && styles.pressed]}>{row}</Pressable> : row;
}

function PreferenceRow({ title, detail, children }: { title: string; detail: string; children: React.ReactNode }) {
  return <View style={styles.preferenceRow}><View style={styles.preferenceCopy}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowDetail}>{detail}</Text></View>{children}</View>;
}

function ChoiceControl({ value, choices, onChange }: { value: string; choices: [string, string][]; onChange: (value: string) => void }) {
  return <View accessibilityRole="radiogroup" style={styles.choices}>{choices.map(([id, label]) => <Pressable key={id} accessibilityRole="radio" accessibilityState={{ selected: value === id }} onPress={() => onChange(id)} style={[styles.choice, value === id && styles.choiceSelected]}><Text style={[styles.choiceText, value === id && styles.choiceTextSelected]}>{label}</Text></Pressable>)}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  topbar: { height: 48, justifyContent: 'center', paddingHorizontal: 18 },
  closeButton: { alignSelf: 'flex-start', minHeight: 40, justifyContent: 'center', paddingHorizontal: 4 },
  closeText: { color: palette.accent, fontSize: 16, fontWeight: '800' },
  content: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 48 },
  title: { color: palette.text, fontSize: 34, lineHeight: 39, fontWeight: '800', letterSpacing: -0.9 },
  section: { marginTop: 34 },
  sectionLabel: { color: palette.secondary, fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 9 },
  sectionCard: { overflow: 'hidden', borderRadius: 18, borderWidth: 1, borderColor: palette.line, backgroundColor: '#FFFFFF' },
  rowButton: { borderBottomWidth: 1, borderBottomColor: palette.line },
  row: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  rowIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: '#E7F0E8' },
  rowCopy: { flex: 1 },
  rowTitle: { color: palette.text, fontSize: 16, fontWeight: '800' },
  rowDetail: { color: palette.secondary, fontSize: 12, marginTop: 3 },
  rowAction: { color: palette.accent, fontSize: 13, fontWeight: '800' },
  preferenceRow: { minHeight: 80, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: palette.line },
  preferenceCopy: { flex: 1 },
  choices: { flexDirection: 'row', padding: 3, borderRadius: 13, backgroundColor: '#EAF0EA' },
  choice: { minWidth: 60, minHeight: 32, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, borderRadius: 10 },
  choiceSelected: { backgroundColor: palette.accent },
  choiceText: { color: palette.secondary, fontSize: 11, fontWeight: '800' },
  choiceTextSelected: { color: '#FFFFFF' },
  pressed: { opacity: 0.7 },
});
