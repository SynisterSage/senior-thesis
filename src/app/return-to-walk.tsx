import Mapbox from '@rnmapbox/maps';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, noticingThemes } from '@/constants/trailmark-theme';
import { getReturnReflection, saveReturnReflection } from '@/lib/return-reflections';

const palette = colors.light;
const storyTheme = noticingThemes.water;
const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
const originalStoryMapStyle = 'mapbox://styles/lex-ferguson/cmwi2loq901qo01s6fmxkazc4';
const fairyFallsCoordinate: [number, number] = [-110.855668, 44.52584];
const fairyFallsRoute = {
  type: 'Feature' as const,
  properties: {},
  geometry: {
    type: 'LineString' as const,
    coordinates: [
      [-110.8612, 44.5201],
      [-110.8582, 44.5225],
      [-110.8568, 44.5243],
      fairyFallsCoordinate,
    ],
  },
};
if (mapboxToken) Mapbox.setAccessToken(mapboxToken);
const returnWalkImage = require('../../assets/trails/catalog/fairy-falls.jpg');
const originalNote = 'I heard the water before I saw it, and the whole walk seemed to slow down.';
const walkId = 'fairy-falls-2026-11-08';

export default function ReturnToWalkScreen() {
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [reflection, setReflection] = useState(() => getReturnReflection(walkId));
  const [isEditing, setIsEditing] = useState(() => !getReturnReflection(walkId));
  const [saved, setSaved] = useState(() => Boolean(getReturnReflection(walkId)));
  const trimmedReflection = reflection.trim();

  const keepReflection = () => {
    if (!trimmedReflection) return;
    if (!saveReturnReflection(walkId, trimmedReflection)) return;
    setReflection(trimmedReflection);
    setSaved(true);
    setIsEditing(false);
  };

  const openOriginalStory = () => router.push({
    pathname: '/recap',
    params: {
      title: 'Fairy Falls',
      location: 'Yellowstone National Park',
      markedCount: '1',
      notes: JSON.stringify([originalNote]),
      momentIds: JSON.stringify(['firehole-river-approach']),
      focus: 'The sound of falling water',
      noticeTheme: 'water',
    },
  });

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to Archive" onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={20} weight="semibold" tintColor={palette.accent} />
          <Text style={styles.backLabel}>Archive</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Return</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={52}>
        <ScrollView ref={scrollRef} automaticallyAdjustKeyboardInsets contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
          <View style={styles.hero}>
            <Image source={returnWalkImage} contentFit="cover" style={styles.heroImage} />
            <View style={styles.heroShade} />
            <View style={styles.heroCopy}>
              <Text style={styles.heroKicker}>A WALK TO RETURN TO</Text>
              <Text accessibilityRole="header" style={styles.heroTitle}>Fairy Falls</Text>
              <Text style={styles.heroMeta}>Yellowstone National Park · Nov 8, 2026</Text>
            </View>
            <View style={[styles.heroMapCard, { backgroundColor: storyTheme.surface, borderColor: `${storyTheme.accent}55` }]}>
              <View style={styles.heroMapFrame}>
                {mapboxToken && Platform.OS !== 'web' ? <Mapbox.MapView style={styles.heroMap} styleURL={originalStoryMapStyle} logoEnabled={false} attributionEnabled={false} compassEnabled={false} scaleBarEnabled={false} scrollEnabled={false} zoomEnabled={false} rotateEnabled={false} pitchEnabled={false}>
                  <Mapbox.Camera defaultSettings={{ centerCoordinate: fairyFallsCoordinate, zoomLevel: 12.4 }} />
                  <Mapbox.ShapeSource id="return-fairy-falls-route" shape={fairyFallsRoute}>
                    <Mapbox.LineLayer id="return-fairy-falls-route-line" style={{ lineColor: storyTheme.accent, lineWidth: 3, lineCap: 'round', lineJoin: 'round' }} />
                  </Mapbox.ShapeSource>
                  <Mapbox.PointAnnotation id="return-fairy-falls-point" coordinate={fairyFallsCoordinate}>
                    <View style={[styles.heroMapPin, { backgroundColor: storyTheme.accent, borderColor: storyTheme.surface }]} />
                  </Mapbox.PointAnnotation>
                </Mapbox.MapView> : <View style={[styles.heroMapFallback, { backgroundColor: storyTheme.accentSoft }]}><View style={[styles.heroMapFallbackRoute, { borderColor: storyTheme.accent }]} /><View style={[styles.heroMapPin, { backgroundColor: storyTheme.accent, borderColor: storyTheme.surface }]} /></View>}
              </View>
            </View>
          </View>
          <Text style={styles.introCopy}>A little time has passed. Notice what comes back first.</Text>

          <View style={styles.originalMemory}>
            <View style={styles.memoryHeading}>
            <Text style={[styles.memoryEyebrow, { color: storyTheme.accent }]}>LAST TIME</Text>
              <SymbolView name={{ ios: 'quote.opening', android: 'format_quote', web: 'format_quote' }} size={17} weight="semibold" tintColor={storyTheme.accent} />
            </View>
            <Text style={styles.originalMemoryText}>{originalNote}</Text>
          </View>
          <View style={styles.reflectionSection}>
            <View style={styles.sectionHeading}>
              <View>
                <Text style={styles.sectionTitle}>{saved ? 'Your return note' : 'What comes back now?'}</Text>
                <Text style={styles.sectionDetail}>{saved ? 'Saved on this device' : 'A sound, color, feeling, or small detail.'}</Text>
              </View>
              {saved && !isEditing ? <Pressable accessibilityRole="button" onPress={() => setIsEditing(true)} style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}><Text style={styles.editText}>Edit</Text></Pressable> : null}
            </View>

            {isEditing ? <>
              <TextInput accessibilityLabel="Your return note" multiline value={reflection} onChangeText={setReflection} onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120)} placeholder="What do you remember now?" placeholderTextColor="#7A8986" style={styles.input} textAlignVertical="top" />
              <Pressable accessibilityRole="button" accessibilityState={{ disabled: !trimmedReflection }} disabled={!trimmedReflection} onPress={keepReflection} style={({ pressed }) => [styles.primaryButton, { backgroundColor: storyTheme.accent }, !trimmedReflection && styles.disabledButton, pressed && trimmedReflection && styles.pressed]}><Text style={styles.primaryText}>{saved ? 'Save changes' : 'Keep this note'}</Text></Pressable>
              {saved ? <Pressable accessibilityRole="button" onPress={() => { setReflection(getReturnReflection(walkId)); setIsEditing(false); }} style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}><Text style={styles.cancelText}>Cancel</Text></Pressable> : null}
            </> : <Text style={styles.savedText}>{reflection}</Text>}
          </View>

          {saved ? <View style={styles.thenNow}>
            <View style={styles.thenNowHeader}>
              <View><Text style={styles.sectionTitle}>Then and now</Text><Text style={styles.sectionDetail}>Same trail. Something changed.</Text></View>
              <SymbolView name={{ ios: 'arrow.left.arrow.right', android: 'compare_arrows', web: 'compare_arrows' }} size={18} weight="semibold" tintColor={palette.accent} />
            </View>
            <View style={styles.note}><Text style={styles.noteLabel}>THEN</Text><Text style={styles.noteText}>{originalNote}</Text></View>
            <View style={[styles.note, styles.nowNote]}><Text style={[styles.noteLabel, styles.nowLabel]}>NOW</Text><Text style={styles.noteText}>{reflection}</Text></View>
          </View> : null}

          <View style={styles.storyActions}>
            <View style={styles.storyButton}>
              <Text style={[styles.storyButtonText, { color: storyTheme.accent }]}>Open this trail</Text>
              <SymbolView name={{ ios: 'map', android: 'map', web: 'map' }} size={18} weight="semibold" tintColor={storyTheme.accent} />
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Open the original Fairy Falls story" onPress={openOriginalStory} style={({ pressed }) => [styles.storyButton, pressed && styles.pressed]}>
              <Text style={[styles.storyButtonText, { color: storyTheme.accent }]}>View original story</Text>
              <SymbolView name={{ ios: 'arrow.up.right', android: 'arrow_forward', web: 'arrow_forward' }} size={18} weight="semibold" tintColor={storyTheme.accent} />
            </Pressable>
          </View>
          <Text style={styles.localNote}>Your return note stays on this device.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  flex: { flex: 1 },
  header: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  backButton: { minHeight: 44, minWidth: 92, flexDirection: 'row', alignItems: 'center', gap: 3 },
  backLabel: { color: palette.accent, fontSize: 16, fontWeight: '600' },
  headerTitle: { color: palette.text, fontSize: 17, fontWeight: '700' },
  headerSpacer: { width: 92 },
  content: { paddingBottom: 32 },
  hero: { height: 258, marginHorizontal: 12, overflow: 'hidden', borderRadius: 24, backgroundColor: '#D9E8DE' },
  heroImage: StyleSheet.absoluteFill,
  heroShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(10, 28, 19, 0.34)' },
  heroCopy: { position: 'absolute', left: 20, right: 126, bottom: 20 },
  heroKicker: { color: 'rgba(255,255,255,0.82)', fontSize: 11, fontWeight: '800', letterSpacing: 1.15 },
  heroTitle: { color: '#FFFFFF', fontSize: 36, lineHeight: 41, fontWeight: '800', letterSpacing: -1, marginTop: 5 },
  heroMeta: { color: 'rgba(255,255,255,0.86)', fontSize: 13, fontWeight: '600', marginTop: 5 },
  heroMapCard: { position: 'absolute', top: 14, right: 14, width: 102, padding: 6, borderRadius: 16, borderWidth: 1 },
  heroMapFrame: { height: 98, overflow: 'hidden', borderRadius: 11, backgroundColor: '#D8EEF4' },
  heroMap: { flex: 1 },
  heroMapFallback: { flex: 1, position: 'relative', overflow: 'hidden' },
  heroMapFallbackRoute: { position: 'absolute', width: 104, height: 150, left: 22, top: -28, borderLeftWidth: 3, borderBottomWidth: 3, borderRadius: 54, transform: [{ rotate: '-25deg' }] },
  heroMapPin: { width: 12, height: 12, borderRadius: 6, borderWidth: 3 },
  introCopy: { color: palette.text, fontSize: 18, lineHeight: 25, fontWeight: '600', marginHorizontal: 24, marginTop: 20, maxWidth: 340 },
  originalMemory: { marginHorizontal: 18, marginTop: 18, padding: 17, borderRadius: 20, backgroundColor: '#E5F3F6' },
  memoryHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  memoryEyebrow: { color: palette.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  originalMemoryText: { color: palette.text, fontSize: 17, lineHeight: 24, fontWeight: '700', marginTop: 10 },
  reflectionSection: { marginHorizontal: 18, marginTop: 14, padding: 17, borderRadius: 20, backgroundColor: palette.surface },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  sectionTitle: { color: palette.text, fontSize: 19, lineHeight: 24, fontWeight: '700', letterSpacing: -0.25 },
  sectionDetail: { color: palette.secondary, fontSize: 13, lineHeight: 18, marginTop: 4 },
  editButton: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 8 },
  editText: { color: palette.accent, fontSize: 15, fontWeight: '700' },
  input: { minHeight: 112, color: palette.text, fontSize: 16, lineHeight: 23, marginTop: 15, padding: 13, borderRadius: 14, backgroundColor: '#F1F5F0' },
  primaryButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', marginTop: 12, borderRadius: 14, backgroundColor: palette.accent },
  disabledButton: { opacity: 0.42 },
  primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  cancelButton: { minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: palette.secondary, fontSize: 15, fontWeight: '600' },
  savedText: { color: palette.text, fontSize: 16, lineHeight: 24, marginTop: 16 },
  thenNow: { marginHorizontal: 18, marginTop: 18, padding: 17, borderRadius: 20, borderWidth: 1, borderColor: palette.line, backgroundColor: 'transparent' },
  thenNowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  note: { marginTop: 15, padding: 13, borderRadius: 14, backgroundColor: '#EAF0E9' },
  nowNote: { backgroundColor: '#E0F0E4' },
  noteLabel: { color: palette.secondary, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  nowLabel: { color: palette.accent },
  noteText: { color: palette.text, fontSize: 15, lineHeight: 21, marginTop: 5 },
  awaiting: { color: palette.secondary, fontSize: 14, lineHeight: 20, marginTop: 14 },
  storyActions: { gap: 8, marginTop: 18 },
  storyButton: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 18, borderRadius: 14, backgroundColor: '#D8EEF4' },
  storyButtonText: { color: palette.accent, fontSize: 15, fontWeight: '700' },
  localNote: { color: palette.secondary, fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 15, paddingHorizontal: 36 },
  pressed: { opacity: 0.72 },
});
