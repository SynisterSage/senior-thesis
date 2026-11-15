import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image } from 'expo-image';
import Mapbox from '@rnmapbox/maps';
import { Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '@/constants/trailmark-theme';
import { getNoticingPrompt, grandPrismaticMoments } from '@/lib/trail-moments';

const palette = colors.light;

export default function ReflectScreen() {
  const { markedCount, momentIds: momentIdsParam, coordinates: coordinatesParam, focus } = useLocalSearchParams<{ markedCount?: string; momentIds?: string; coordinates?: string; focus?: string }>();
  const cameraRef = useRef<Mapbox.Camera>(null);
  const coordinates = useMemo<number[][]>(() => {
    try { const parsed = JSON.parse(coordinatesParam ?? '[]'); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
  }, [coordinatesParam]);
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
  const [stateAnimation] = useState(() => new Animated.Value(0));
  const complete = total === 0 || currentIndex >= total;
  const currentMoment = grandPrismaticMoments.find((moment) => moment.id === momentIds[currentIndex]) ?? grandPrismaticMoments[currentIndex % grandPrismaticMoments.length];
  const noticingFocus = focus?.trim() ?? '';

  const revealMoment = () => {
    setNotes((currentNotes) => [...currentNotes, note.trim()]);
    setRevealed(true);
  };

  const continueToNext = () => {
    setNote('');
    setRevealed(false);
    setCurrentIndex((index) => index + 1);
  };

  useEffect(() => {
    stateAnimation.setValue(0);
    const entrance = Animated.spring(stateAnimation, { toValue: 1, damping: 18, stiffness: 180, mass: 0.7, useNativeDriver: true });
    entrance.start();
    return () => entrance.stop();
  }, [currentIndex, revealed, stateAnimation]);

  useEffect(() => {
    const coordinate = coordinates[currentIndex];
    if (complete) cameraRef.current?.setCamera({ centerCoordinate: [-110.836, 44.520], zoomLevel: 13.4, animationDuration: 1500, animationMode: 'flyTo' });
    else if (revealed && coordinate?.length >= 2) cameraRef.current?.setCamera({ centerCoordinate: coordinate, zoomLevel: 15, animationDuration: 1400, animationMode: 'flyTo' });
  }, [complete, coordinates, currentIndex, revealed]);

  const map = coordinates.length ? <View style={styles.storyMap}>
    <Mapbox.MapView style={StyleSheet.absoluteFill} styleURL={Mapbox.StyleURL.Light} scrollEnabled={false} zoomEnabled={false} rotateEnabled={false} pitchEnabled={false} scaleBarEnabled={false}>
      <Mapbox.Camera ref={cameraRef} defaultSettings={{ centerCoordinate: [-110.836, 44.520], zoomLevel: 13.4 }} />
      {coordinates.map((coordinate, index) => coordinate.length >= 2 && (complete || (revealed && index === currentIndex)) ? <Mapbox.MarkerView key={index} coordinate={coordinate}><View style={styles.storyMapMarker} /></Mapbox.MarkerView> : null)}
    </Mapbox.MapView>
    {!revealed && !complete ? <View style={styles.mapVeil}><Text style={styles.mapVeilText}>Your next moment is waiting</Text></View> : null}
  </View> : null;

  if (complete) {
    return (
      <ReflectShell map={map}>
        <View style={styles.completeMark}><Text style={styles.completeCheck}>✓</Text></View>
        <Text accessibilityRole="header" style={styles.completeTitle}>{total ? 'That is the walk, for now.' : 'This walk is still worth keeping.'}</Text>
        <Text style={styles.completeText}>{total ? 'Your memories are ready to become a trail story.' : 'Return to the trail when something feels worth holding onto.'}</Text>
        <ActionButton label="Build my trail story" onPress={() => router.replace({ pathname: '/recap', params: { markedCount: String(total), notes: JSON.stringify(notes), momentIds: JSON.stringify(momentIds), focus: noticingFocus } })} />
      </ReflectShell>
    );
  }

  return (
    <ReflectShell map={map}>
      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>Moment {currentIndex + 1}</Text>
        <Text style={styles.progressCount}>{currentIndex + 1} of {total}</Text>
      </View>
      <ProgressMarks currentIndex={currentIndex} total={total} />

      <Animated.View style={{ opacity: stateAnimation, transform: [{ translateY: stateAnimation.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
      {!revealed ? (
        <>
          <Text accessibilityRole="header" style={styles.title}>What do you remember?</Text>
          <Text style={styles.description}>Before TrailMark shows you where this happened, leave yourself a small note about what stayed with you.</Text>
          {noticingFocus ? <View style={styles.focusPill}><Text style={styles.focusLabel}>Your noticing lens</Text><Text style={styles.focusText}>{noticingFocus}</Text></View> : null}
          <View style={styles.promptCard}>
            <View style={styles.promptDot} />
          <Text style={styles.prompt}>{getNoticingPrompt(currentMoment, noticingFocus)}</Text>
          </View>
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Your memory</Text>
            <TextInput
              accessibilityLabel="Describe what you remember about this moment"
              multiline
              textAlignVertical="top"
              value={note}
              onChangeText={setNote}
              placeholder="A sound, a view, a feeling, something small..."
              placeholderTextColor="#75857C"
              style={styles.input}
            />
          </View>
          <ActionButton label="Reveal this moment" onPress={revealMoment} />
          <Pressable accessibilityRole="button" onPress={revealMoment} style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}>
            <Text style={styles.skipText}>I’ll come back to this</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text accessibilityRole="header" style={styles.title}>Here’s where it was.</Text>
          <View style={styles.memoryCard}>
            <Text style={styles.cardLabel}>What you remembered</Text>
            <Text style={[styles.memoryText, !note.trim() && styles.memoryTextEmpty]}>{note.trim() || 'You chose to come back to this moment later.'}</Text>
          </View>
          <View style={styles.contextCard}>
            {currentMoment.image ? <Image source={currentMoment.image} contentFit="cover" style={styles.contextImage} /> : <View style={styles.routeMomentVisual}><View style={styles.routeMomentDot} /><Text style={styles.routeMomentLabel}>Your mark along the route</Text></View>}
            <View style={styles.contextCopy}>
              <Text style={styles.cardLabel}>Along the trail</Text>
              <Text style={styles.contextTitle}>{currentMoment.title}</Text>
              <Text style={styles.contextText}>{currentMoment.context}</Text>
            </View>
          </View>
          <ActionButton label={currentIndex + 1 === total ? 'Finish reflection' : 'Next moment'} onPress={continueToNext} />
        </>
      )}
      </Animated.View>
    </ReflectShell>
  );
}

function ReflectShell({ children, map }: { children: React.ReactNode; map?: React.ReactNode }) {
  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {map}
        <View style={styles.content}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ProgressMarks({ currentIndex, total }: { currentIndex: number; total: number }) {
  return <View accessibilityLabel={`Moment ${currentIndex + 1} of ${total}`} style={styles.progressMarks}>{Array.from({ length: total }, (_, index) => <View key={index} style={[styles.progressMark, index <= currentIndex && styles.progressMarkActive]} />)}</View>;
}

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}><Text style={styles.actionLabel}>{label}</Text><Text style={styles.actionArrow}>→</Text></Pressable>;
}

const styles = StyleSheet.create({
  storyMap: { height: 230, overflow: 'hidden', backgroundColor: '#DCE8DE' },
  mapVeil: { ...StyleSheet.absoluteFill, backgroundColor: '#DCE8DE', alignItems: 'center', justifyContent: 'center' },
  mapVeilText: { color: '#4D5E53', fontSize: 15, fontWeight: '700' },
  storyMapMarker: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#226C4A', borderWidth: 3, borderColor: '#FFFFFF' },
  screen: { flex: 1, backgroundColor: palette.background },
  scroll: { flexGrow: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 26, paddingBottom: 34, backgroundColor: palette.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20 },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressLabel: { color: palette.accent, fontSize: 14, fontWeight: '800' },
  progressCount: { color: palette.secondary, fontSize: 13, fontWeight: '700' },
  progressMarks: { flexDirection: 'row', gap: 6, marginTop: 14 },
  progressMark: { height: 4, flex: 1, borderRadius: 2, backgroundColor: '#D7E3DA' },
  progressMarkActive: { backgroundColor: palette.accent },
  title: { color: palette.text, fontSize: 35, lineHeight: 40, fontWeight: '800', letterSpacing: -0.9, marginTop: 43 },
  description: { color: palette.secondary, fontSize: 16, lineHeight: 24, marginTop: 10 },
  focusPill: { padding: 14, marginTop: 18, borderRadius: 16, backgroundColor: '#EAF2EB' },
  focusLabel: { color: palette.accent, fontSize: 12, fontWeight: '800' },
  focusText: { color: palette.text, fontSize: 15, lineHeight: 21, fontWeight: '700', marginTop: 4 },
  promptCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, padding: 16, marginTop: 28, borderRadius: 18, backgroundColor: '#EAF2EB' },
  promptDot: { width: 12, height: 12, marginTop: 5, borderRadius: 6, backgroundColor: '#B8DCC0', borderWidth: 3, borderColor: palette.accent },
  prompt: { flex: 1, color: palette.text, fontSize: 16, lineHeight: 23, fontWeight: '700' },
  inputCard: { minHeight: 175, marginTop: 16, padding: 17, borderRadius: 20, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface },
  inputLabel: { color: palette.secondary, fontSize: 13, fontWeight: '700' },
  input: { minHeight: 112, paddingTop: 10, color: palette.text, fontSize: 17, lineHeight: 25 },
  actionButton: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 22, borderRadius: 17, backgroundColor: palette.accent },
  actionLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  actionArrow: { color: '#FFFFFF', fontSize: 21, fontWeight: '600' },
  skipButton: { alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 14, marginTop: 3 },
  skipText: { color: palette.secondary, fontSize: 14, fontWeight: '700' },
  memoryCard: { padding: 18, marginTop: 22, borderRadius: 20, backgroundColor: '#1D392B' },
  cardLabel: { color: '#86B899', fontSize: 13, fontWeight: '700' },
  memoryText: { color: '#FFFFFF', fontSize: 20, lineHeight: 29, fontWeight: '700', marginTop: 10, letterSpacing: -0.25 },
  memoryTextEmpty: { color: '#D1E2D5', fontWeight: '600' },
  contextCard: { overflow: 'hidden', marginTop: 14, borderRadius: 20, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface },
  contextImage: { width: '100%', height: 164 },
  routeMomentVisual: { height: 164, alignItems: 'center', justifyContent: 'center', gap: 11, backgroundColor: '#E8F1E9' },
  routeMomentDot: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#1B4B37', borderWidth: 7, borderColor: '#C5F0CE' },
  routeMomentLabel: { color: palette.accent, fontSize: 14, fontWeight: '800' },
  contextCopy: { padding: 17 },
  contextTitle: { color: palette.text, fontSize: 21, lineHeight: 26, fontWeight: '800', letterSpacing: -0.3, marginTop: 6 },
  contextText: { color: palette.secondary, fontSize: 14, lineHeight: 20, marginTop: 5 },
  completeMark: { width: 62, height: 62, alignItems: 'center', justifyContent: 'center', marginTop: 44, borderRadius: 31, backgroundColor: '#DCEFE0' },
  completeCheck: { color: palette.accent, fontSize: 30, fontWeight: '800' },
  completeTitle: { color: palette.text, fontSize: 32, lineHeight: 38, fontWeight: '800', letterSpacing: -0.8, marginTop: 25 },
  completeText: { color: palette.secondary, fontSize: 17, lineHeight: 25, marginTop: 9 },
  pressed: { opacity: 0.78 },
});
