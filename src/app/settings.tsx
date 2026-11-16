import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useState } from 'react';
import { Animated, Linking, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/trailmark-theme';
import { isNodConnected } from '@/lib/onboarding';
import { getNodStatus } from '@/lib/nod';
import { getIncludeWords, getLiveMapStyle, getReplayPace, setIncludeWords, setLiveMapStyle, setReplayPace, type LiveMapStyle, type ReplayPace } from '@/lib/trailmark-preferences';

const palette = colors.light;
// Replace these with the production site URLs when TrailMark is published.
const legalLinks = {
  privacy: 'https://trailmark.app/privacy',
  terms: 'https://trailmark.app/terms',
  help: 'https://trailmark.app/help',
  troubleshooting: 'https://trailmark.app/troubleshooting',
} as const;

export default function SettingsScreen() {
  const { open } = useLocalSearchParams<{ open?: string }>();
  const [nodConnected, setNodConnected] = useState(isNodConnected());
  const [nodManageOpen, setNodManageOpen] = useState(() => open === 'nod');
  const [storyStorageOpen, setStoryStorageOpen] = useState(false);
  const [nodTested, setNodTested] = useState(false);
  const [nodLocating, setNodLocating] = useState(false);
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
        <SettingsRow icon="dot.radiowaves.left.and.right" androidIcon="bluetooth" title="Nod" detail={nodConnected ? 'Connected and ready' : 'Not connected'} action={nodConnected ? 'Manage' : 'Set up'} onPress={() => nodConnected ? setNodManageOpen(true) : router.push({ pathname: '/pair-nod', params: { returnTo: 'settings' } })} />
      </Section>

      <Section label="HIKE AND LOCATION">
        <SettingsRow icon="location.fill" androidIcon="location_on" title="Location access" detail="Used to place moments along your walk" action="Manage" onPress={() => void Linking.openSettings()} />
        <SettingsRow icon="lock.open" androidIcon="lock_open" title="Active hike tracking" detail="Keeps an active hike ready while your phone is locked" action="On" />
        <SettingsRow icon="rectangle.inset.filled.and.person.filled" androidIcon="lock" title="Lock Screen hike status" detail="Manage Live Activities for TrailMark in iPhone Settings" action="Open" onPress={() => void Linking.openSettings()} />
      </Section>

      <Section label="DEFAULTS">
        <PreferenceRow title="Live trail map" detail="Your map while you walk"><ChoiceControl value={liveMapStyle} choices={[['classic', 'Classic'], ['terrain', 'Terrain']]} onChange={(style) => { const next = style as LiveMapStyle; setLiveMapStyleState(next); setLiveMapStyle(next); }} /></PreferenceRow>
        <PreferenceRow title="Replay pace" detail="How moments unfold"><ChoiceControl value={replayPace} choices={[['gentle', 'Gentle'], ['quick', 'Quick']]} onChange={(pace) => { const next = pace as ReplayPace; setReplayPaceState(next); setReplayPace(next); }} /></PreferenceRow>
        <PreferenceRow title="Include my words" detail="Show reflections in new replays"><Switch accessibilityLabel="Include my words by default" value={includeWords} onValueChange={(value) => { setIncludeWordsState(value); setIncludeWords(value); }} trackColor={{ true: palette.accent }} /></PreferenceRow>
      </Section>

      <Section label="YOUR STORIES">
        <SettingsRow icon="square.stack" androidIcon="collections_bookmark" title="Archive" detail="Saved walks stay on this device" action="Open" onPress={() => router.replace('/(tabs)/archive')} />
        <SettingsRow icon="internaldrive" androidIcon="storage" title="Story storage" detail="Stories are saved locally on this device" action="Manage" onPress={() => setStoryStorageOpen(true)} />
      </Section>

      <Section label="HELP">
        <SettingsRow icon="hand.tap" androidIcon="touch_app" title="How Nod works" detail="Learn the physical interaction" action="Open" onPress={() => router.push('/nod-tutorial')} />
        <SettingsRow icon="questionmark.circle" androidIcon="help_outline" title="Troubleshooting" detail="Connection and marking help" action="Read" onPress={() => { void WebBrowser.openBrowserAsync(legalLinks.troubleshooting); }} />
      </Section>

      <Section label="LEGAL">
        <SettingsRow icon="hand.raised" androidIcon="privacy_tip" title="Privacy Policy" detail="How TrailMark handles your data" action="Read" onPress={() => { void WebBrowser.openBrowserAsync(legalLinks.privacy); }} />
        <SettingsRow icon="doc.text" androidIcon="description" title="Terms of Use" detail="Terms for using TrailMark" action="Read" onPress={() => { void WebBrowser.openBrowserAsync(legalLinks.terms); }} />
      </Section>

      <Section label="TRAILMARK">
        <SettingsRow icon="info.circle" androidIcon="info" title="About TrailMark" detail="Version 1.0.0" />
      </Section>
    </ScrollView>
    <NodManagementSheet visible={nodManageOpen} connected={nodConnected} tested={nodTested} locating={nodLocating} onTest={() => setNodTested(true)} onFind={() => { setNodLocating(true); setTimeout(() => setNodLocating(false), 8000); }} onClose={() => setNodManageOpen(false)} />
    <StoryStorageSheet key={storyStorageOpen ? 'open' : 'closed'} visible={storyStorageOpen} onClose={() => setStoryStorageOpen(false)} />
  </SafeAreaView>;
}

function NodManagementSheet({ visible, connected, tested, locating, onTest, onFind, onClose }: { visible: boolean; connected: boolean; tested: boolean; locating: boolean; onTest: () => void; onFind: () => void; onClose: () => void }) {
  const [sheetProgress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!visible) return;
    sheetProgress.setValue(0);
    const animation = Animated.timing(sheetProgress, { toValue: 1, duration: 280, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [sheetProgress, visible]);

  return <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
    <View style={styles.sheetOverlay}>
      <Animated.View pointerEvents="none" style={[styles.sheetBackdrop, { opacity: sheetProgress }]} />
      <Pressable accessibilityLabel="Close Nod management" onPress={onClose} style={styles.sheetDismiss} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetProgress.interpolate({ inputRange: [0, 1], outputRange: [360, 0] }) }] }]}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}><View style={styles.sheetIcon}><SymbolView name={{ ios: 'dot.radiowaves.left.and.right' as never, android: 'bluetooth' as never, web: 'bluetooth' as never }} size={18} weight="medium" tintColor={palette.accent} /></View><View style={styles.sheetCopy}><Text style={styles.sheetTitle}>Manage Nod</Text><Text style={styles.sheetDetail}>{connected ? 'Connected and ready for your next walk.' : 'Nod is not connected.'}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close Nod management" onPress={onClose} style={styles.sheetClose}><Text style={styles.sheetCloseText}>×</Text></Pressable></View>
        {connected ? <>
          <View style={styles.deviceStatus}><View><Text style={styles.deviceStatusLabel}>Nod status</Text><Text style={styles.deviceStatusValue}>Connected · {getNodStatus().batteryPercent}% battery</Text></View><Text style={styles.deviceStatusMeta}>{getNodStatus().lastSyncLabel}</Text></View>
          <Pressable accessibilityRole="button" onPress={onTest} style={({ pressed }) => [styles.sheetPrimary, pressed && styles.pressed]}><Text style={styles.sheetPrimaryText}>{tested ? 'That came through.' : 'Test Nod'}</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={onFind} style={({ pressed }) => [styles.findNodButton, locating && styles.findNodButtonActive, pressed && styles.pressed]}><SymbolView name={{ ios: 'dot.radiowaves.left.and.right' as never, android: 'radar' as never, web: 'radar' as never }} size={17} weight="semibold" tintColor={locating ? '#FFFFFF' : palette.accent} /><View style={styles.findNodCopy}><Text style={[styles.findNodTitle, locating && styles.findNodTitleActive]}>{locating ? 'Nod is signaling nearby' : 'Find Nod'}</Text><Text style={[styles.findNodDetail, locating && styles.findNodDetailActive]}>{locating ? 'The signal ends in a few seconds.' : 'Make Nod pulse when it is nearby.'}</Text></View></Pressable>
          <Text style={styles.findNodNote}>Demo preview: a connected Nod would pulse its light for eight seconds.</Text>
          <Pressable accessibilityRole="button" onPress={() => { onClose(); router.push({ pathname: '/pair-nod', params: { returnTo: 'settings' } }); }} style={({ pressed }) => [styles.sheetSecondary, pressed && styles.pressed]}><Text style={styles.sheetSecondaryText}>Reconnect Nod</Text></Pressable>
        </> : <Pressable accessibilityRole="button" onPress={() => { onClose(); router.push({ pathname: '/pair-nod', params: { returnTo: 'settings' } }); }} style={({ pressed }) => [styles.sheetPrimary, pressed && styles.pressed]}><Text style={styles.sheetPrimaryText}>Set up Nod</Text></Pressable>}
      </Animated.View>
    </View>
  </Modal>;
}

function StoryStorageSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [sheetProgress] = useState(() => new Animated.Value(0));
  const [confirming, setConfirming] = useState(false);
  const [purged, setPurged] = useState(false);

  useEffect(() => {
    if (!visible) return;
    sheetProgress.setValue(0);
    const animation = Animated.timing(sheetProgress, { toValue: 1, duration: 280, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [sheetProgress, visible]);

  return <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
    <View style={styles.sheetOverlay}>
      <Animated.View pointerEvents="none" style={[styles.sheetBackdrop, { opacity: sheetProgress }]} />
      <Pressable accessibilityLabel="Close story storage" onPress={onClose} style={styles.sheetDismiss} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetProgress.interpolate({ inputRange: [0, 1], outputRange: [360, 0] }) }] }] }>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}><View style={styles.sheetIcon}><SymbolView name={{ ios: 'internaldrive' as never, android: 'storage' as never, web: 'storage' as never }} size={18} weight="medium" tintColor={palette.accent} /></View><View style={styles.sheetCopy}><Text style={styles.sheetTitle}>Story storage</Text><Text style={styles.sheetDetail}>Your trail stories are saved on this device.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close story storage" onPress={onClose} style={styles.sheetClose}><Text style={styles.sheetCloseText}>×</Text></Pressable></View>
        {purged ? <><View style={styles.storageDemoState}><Text style={styles.storageDemoTitle}>Demo only</Text><Text style={styles.storageDemoText}>Nothing was deleted. This action is not wired yet.</Text></View><Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.sheetPrimary, pressed && styles.pressed]}><Text style={styles.sheetPrimaryText}>Done</Text></Pressable></> : confirming ? <><View style={styles.storageWarning}><Text style={styles.storageWarningTitle}>Purge all stories?</Text><Text style={styles.storageWarningText}>This would remove saved walks and reflections from this device.</Text></View><Pressable accessibilityRole="button" onPress={() => setPurged(true)} style={({ pressed }) => [styles.sheetDestructive, pressed && styles.pressed]}><Text style={styles.sheetDestructiveText}>Purge stories</Text></Pressable><Pressable accessibilityRole="button" onPress={() => setConfirming(false)} style={({ pressed }) => [styles.sheetSecondary, pressed && styles.pressed]}><Text style={styles.sheetSecondaryText}>Cancel</Text></Pressable></> : <><View style={styles.storageSummary}><Text style={styles.storageSummaryTitle}>Saved locally</Text><Text style={styles.storageSummaryText}>Your Archive stays available without an account or connection.</Text></View><Pressable accessibilityRole="button" onPress={() => setConfirming(true)} style={({ pressed }) => [styles.sheetDestructive, pressed && styles.pressed]}><Text style={styles.sheetDestructiveText}>Clear story storage</Text></Pressable></>}
      </Animated.View>
    </View>
  </Modal>;
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
  sheetOverlay: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(12, 25, 17, 0.24)' },
  sheetDismiss: { ...StyleSheet.absoluteFill },
  sheet: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 28, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: '#F5F7F3' },
  sheetHandle: { width: 38, height: 4, alignSelf: 'center', marginBottom: 18, borderRadius: 2, backgroundColor: '#C5D0C8' },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  sheetIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: '#E7F0E8' },
  sheetCopy: { flex: 1, gap: 3 },
  sheetTitle: { color: palette.text, fontSize: 21, fontWeight: '800', letterSpacing: -0.3 },
  sheetDetail: { color: palette.secondary, fontSize: 14, lineHeight: 20 },
  sheetClose: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: '#E7F0E8' },
  sheetCloseText: { color: palette.text, fontSize: 25, lineHeight: 26, fontWeight: '400' },
  deviceStatus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 22, padding: 14, borderRadius: 16, backgroundColor: '#E7F0E8' },
  deviceStatusLabel: { color: palette.secondary, fontSize: 12, fontWeight: '700' },
  deviceStatusValue: { color: palette.text, fontSize: 15, fontWeight: '800', marginTop: 3 },
  deviceStatusMeta: { color: palette.accent, fontSize: 11, fontWeight: '800' },
  sheetPrimary: { minHeight: 54, alignItems: 'center', justifyContent: 'center', marginTop: 13, borderRadius: 17, backgroundColor: palette.accent },
  sheetPrimaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  findNodButton: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10, paddingHorizontal: 15, borderRadius: 17, borderWidth: 1, borderColor: '#D0E2D3', backgroundColor: '#FFFFFF' },
  findNodButtonActive: { borderColor: palette.accent, backgroundColor: palette.accent },
  findNodCopy: { flex: 1 },
  findNodTitle: { color: palette.text, fontSize: 15, fontWeight: '800' },
  findNodTitleActive: { color: '#FFFFFF' },
  findNodDetail: { color: palette.secondary, fontSize: 12, marginTop: 3 },
  findNodDetailActive: { color: 'rgba(255,255,255,0.82)' },
  findNodNote: { color: palette.secondary, fontSize: 11, lineHeight: 15, marginTop: 7, paddingHorizontal: 2 },
  sheetNote: { color: palette.secondary, fontSize: 14, lineHeight: 20, marginTop: 14 },
  sheetSecondary: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  sheetSecondaryText: { color: palette.secondary, fontSize: 15, fontWeight: '700' },
  sheetDestructive: { minHeight: 54, alignItems: 'center', justifyContent: 'center', marginTop: 13, borderRadius: 17, backgroundColor: '#F6E7E4' },
  sheetDestructiveText: { color: '#B84D43', fontSize: 16, fontWeight: '800' },
  storageSummary: { marginTop: 22, padding: 15, borderRadius: 16, backgroundColor: '#E7F0E8' },
  storageSummaryTitle: { color: palette.text, fontSize: 15, fontWeight: '800' },
  storageSummaryText: { color: palette.secondary, fontSize: 13, lineHeight: 19, marginTop: 4 },
  storageWarning: { marginTop: 22, padding: 15, borderRadius: 16, backgroundColor: '#F6E7E4' },
  storageWarningTitle: { color: '#7B302B', fontSize: 15, fontWeight: '800' },
  storageWarningText: { color: '#8F5A54', fontSize: 13, lineHeight: 19, marginTop: 4 },
  storageDemoState: { marginTop: 22, padding: 15, borderRadius: 16, backgroundColor: '#E7F0E8' },
  storageDemoTitle: { color: palette.accent, fontSize: 15, fontWeight: '800' },
  storageDemoText: { color: palette.secondary, fontSize: 13, lineHeight: 19, marginTop: 4 },
});
