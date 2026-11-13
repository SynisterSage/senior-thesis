import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '@/constants/trailmark-theme';
import { grandPrismaticMoments } from '@/lib/trail-moments';

const palette = colors.light;

export default function ReflectScreen() {
  const { markedCount, momentIds: momentIdsParam } = useLocalSearchParams<{ markedCount?: string; momentIds?: string }>();
  const total = useMemo(() => Math.max(0, Number(markedCount) || 0), [markedCount]);
  const momentIds = useMemo(() => {
    try {
      const parsed = momentIdsParam ? JSON.parse(momentIdsParam) : [];
      return Array.isArray(parsed) ? parsed as string[] : [];
    } catch {
      return [];
    }
  }, [momentIdsParam]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const complete = total === 0 || currentIndex >= total;
  const currentMoment = grandPrismaticMoments.find((moment) => moment.id === momentIds[currentIndex]) ?? grandPrismaticMoments[currentIndex % grandPrismaticMoments.length];

  const revealMoment = () => {
    setNotes((currentNotes) => [...currentNotes, note.trim()]);
    setRevealed(true);
  };

  const continueToNext = () => {
    setNote('');
    setRevealed(false);
    setCurrentIndex((index) => index + 1);
  };

  if (complete) {
    return (
      <ScreenShell title="Your moments" description={total ? 'You have made space for each moment. Read them back when you are ready.' : 'There are no marked moments to reflect on from this hike.'}>
        <View style={styles.completeIcon}><Text style={styles.completeIconText}>✓</Text></View>
        <Text style={styles.completeTitle}>{total ? 'That is the hike, for now.' : 'The hike is still worth keeping.'}</Text>
        <Text style={styles.completeText}>{total ? 'Your notes will become part of the route recap.' : 'You can return to the trail and mark a moment next time.'}</Text>
        <ActionButton label="Build my recap" onPress={() => router.replace({ pathname: '/recap', params: { markedCount: String(total), notes: JSON.stringify(notes), momentIds: JSON.stringify(momentIds) } })} />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="What was happening here?" description="Start with what you remember. The location comes back after you answer.">
      <View style={styles.progressRow}><Text style={styles.progressLabel}>Moment {String(currentIndex + 1).padStart(2, '0')}</Text><Text style={styles.progressCount}>{currentIndex + 1} of {total}</Text></View>
      <View style={styles.promptBlock}><View style={styles.promptMarker} /><Text style={styles.promptText}>{currentMoment.prompt}</Text></View>
      <TextInput accessibilityLabel="Describe what was happening at this moment" multiline textAlignVertical="top" value={note} onChangeText={setNote} placeholder="A sound, a view, a feeling, something you noticed..." placeholderTextColor="#7B8B82" style={styles.input} />
      {!revealed ? <><ActionButton label="Save and reveal" onPress={revealMoment} /><Pressable accessibilityRole="button" onPress={revealMoment} style={styles.skipButton}><Text style={styles.skipText}>Skip for now</Text></Pressable></> : <><View style={styles.referenceCard}>{currentMoment.image ? <Image source={currentMoment.image} contentFit="cover" style={styles.referenceImage} /> : <View style={styles.routeMomentVisual}><View style={styles.routeMomentDot} /><Text style={styles.routeMomentLabel}>Your mark on the route</Text></View>}<View style={styles.referenceCopy}><Text style={styles.referenceEyebrow}>{currentMoment.kind === 'verified-reference' ? 'VERIFIED NPS REFERENCE' : 'PERSONAL ROUTE MOMENT'}</Text><Text style={styles.referenceTitle}>{currentMoment.title}</Text><Text style={styles.referenceText}>{currentMoment.context}</Text></View></View><ActionButton label={currentIndex + 1 === total ? 'Finish reflection' : 'Next moment'} onPress={continueToNext} /></>}
    </ScreenShell>
  );
}

function ScreenShell({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <View style={styles.screen}><View style={styles.content}><View style={styles.accent} /><Text accessibilityRole="header" style={styles.title}>{title}</Text><Text style={styles.description}>{description}</Text>{children}</View></View>;
}

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}><Text style={styles.actionLabel}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 74, paddingBottom: 42 },
  accent: { width: 28, height: 4, marginBottom: 18, borderRadius: 2, backgroundColor: palette.accent },
  title: { color: palette.text, fontSize: 34, lineHeight: 39, fontWeight: '800', letterSpacing: -0.8 },
  description: { color: palette.secondary, fontSize: 16, lineHeight: 24, marginTop: 10 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 48 },
  progressLabel: { color: palette.accent, fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  progressCount: { color: palette.secondary, fontSize: 13, fontWeight: '600' },
  promptBlock: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 28 },
  promptMarker: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#A8DFB6', borderWidth: 3, borderColor: palette.accent },
  promptText: { color: palette.text, fontSize: 20, fontWeight: '700' },
  input: { minHeight: 150, marginTop: 20, padding: 16, borderRadius: 18, backgroundColor: '#FFFFFF', color: palette.text, fontSize: 16, lineHeight: 24, borderWidth: 1, borderColor: palette.line },
  actionButton: { minHeight: 54, marginTop: 22, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.accent },
  actionLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  skipButton: { alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 14, marginTop: 4 },
  skipText: { color: palette.secondary, fontSize: 14, fontWeight: '700' },
  referenceCard: { marginTop: 22, overflow: 'hidden', borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line },
  referenceImage: { width: '100%', height: 170 },
  routeMomentVisual: { height: 170, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#EAF4ED' },
  routeMomentDot: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#1B4B37', borderWidth: 7, borderColor: '#C5F0CE' },
  routeMomentLabel: { color: palette.accent, fontSize: 14, fontWeight: '800' },
  referenceCopy: { padding: 15, gap: 5 },
  referenceEyebrow: { color: palette.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  referenceTitle: { color: palette.text, fontSize: 19, fontWeight: '800' },
  referenceText: { color: palette.secondary, fontSize: 14, lineHeight: 20 },
  completeIcon: { width: 58, height: 58, marginTop: 48, borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: '#A8DFB6' },
  completeIconText: { color: '#193323', fontSize: 28, fontWeight: '800' },
  completeTitle: { color: palette.text, fontSize: 22, fontWeight: '800', marginTop: 24 },
  completeText: { color: palette.secondary, fontSize: 16, lineHeight: 24, marginTop: 8 },
  pressed: { opacity: 0.78 },
});
