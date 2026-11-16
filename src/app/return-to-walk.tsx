import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/trailmark-theme';
import { getReturnReflection, saveReturnReflection } from '@/lib/return-reflections';

const palette = colors.light;
const returnWalkImage = require('../../assets/trails/catalog/fairy-falls.jpg');
const originalNote = 'I heard the water before I saw it, and the whole walk seemed to slow down.';
const walkId = 'fairy-falls-2026-11-08';

export default function ReturnToWalkScreen() {
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

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Image source={returnWalkImage} contentFit="cover" style={styles.image} />
          <View style={styles.intro}>
            <Text style={styles.kicker}>A WALK TO RETURN TO</Text>
            <Text accessibilityRole="header" style={styles.title}>Fairy Falls</Text>
            <Text style={styles.meta}>Yellowstone National Park · Nov 8, 2026</Text>
            <Text style={styles.copy}>A little time has passed. Notice what comes back first.</Text>
          </View>

          <View style={styles.reflectionSection}>
            <View style={styles.sectionHeading}>
              <View>
                <Text style={styles.sectionTitle}>{saved ? 'Your return note' : 'What stayed with you?'}</Text>
                <Text style={styles.sectionDetail}>{saved ? 'Saved on this device' : 'A sound, color, feeling, or small detail.'}</Text>
              </View>
              {saved && !isEditing ? <Pressable accessibilityRole="button" onPress={() => setIsEditing(true)} style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}><Text style={styles.editText}>Edit</Text></Pressable> : null}
            </View>

            {isEditing ? <>
              <TextInput accessibilityLabel="Your return note" multiline value={reflection} onChangeText={setReflection} placeholder="What do you remember now?" placeholderTextColor="#7A8986" style={styles.input} textAlignVertical="top" />
              <Pressable accessibilityRole="button" accessibilityState={{ disabled: !trimmedReflection }} disabled={!trimmedReflection} onPress={keepReflection} style={({ pressed }) => [styles.primaryButton, !trimmedReflection && styles.disabledButton, pressed && trimmedReflection && styles.pressed]}><Text style={styles.primaryText}>{saved ? 'Save changes' : 'Keep this note'}</Text></Pressable>
              {saved ? <Pressable accessibilityRole="button" onPress={() => { setReflection(getReturnReflection(walkId)); setIsEditing(false); }} style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}><Text style={styles.cancelText}>Cancel</Text></Pressable> : null}
            </> : <Text style={styles.savedText}>{reflection}</Text>}
          </View>

          <View style={styles.thenNow}>
            <Text style={styles.sectionTitle}>Then and now</Text>
            <View style={styles.note}><Text style={styles.noteLabel}>THEN</Text><Text style={styles.noteText}>{originalNote}</Text></View>
            {saved ? <View style={[styles.note, styles.nowNote]}><Text style={[styles.noteLabel, styles.nowLabel]}>NOW</Text><Text style={styles.noteText}>{reflection}</Text></View> : <Text style={styles.awaiting}>Your new note will sit beside the original when you save it.</Text>}
          </View>

          <Pressable accessibilityRole="button" accessibilityLabel="Open the original Fairy Falls story" onPress={openOriginalStory} style={({ pressed }) => [styles.storyButton, pressed && styles.pressed]}>
            <Text style={styles.storyButtonText}>View original story</Text>
            <SymbolView name={{ ios: 'arrow.up.right', android: 'arrow_forward', web: 'arrow_forward' }} size={18} weight="semibold" tintColor={palette.accent} />
          </Pressable>
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
  content: { paddingBottom: 48 },
  image: { height: 214, marginHorizontal: 18, borderRadius: 20, backgroundColor: '#D9E8DE' },
  intro: { paddingHorizontal: 24, paddingTop: 24 },
  kicker: { color: palette.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.05 },
  title: { color: palette.text, fontSize: 32, lineHeight: 38, fontWeight: '800', letterSpacing: -0.8, marginTop: 6 },
  meta: { color: palette.secondary, fontSize: 13, fontWeight: '500', marginTop: 5 },
  copy: { color: palette.text, fontSize: 17, lineHeight: 24, marginTop: 20, maxWidth: 330 },
  reflectionSection: { marginHorizontal: 18, marginTop: 24, padding: 17, borderRadius: 20, backgroundColor: palette.surface },
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
  note: { marginTop: 15, padding: 13, borderRadius: 14, backgroundColor: '#EAF0E9' },
  nowNote: { backgroundColor: '#E0F0E4' },
  noteLabel: { color: palette.secondary, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  nowLabel: { color: palette.accent },
  noteText: { color: palette.text, fontSize: 15, lineHeight: 21, marginTop: 5 },
  awaiting: { color: palette.secondary, fontSize: 14, lineHeight: 20, marginTop: 14 },
  storyButton: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 18, marginTop: 20, borderRadius: 14, backgroundColor: '#E0F0E4' },
  storyButtonText: { color: palette.accent, fontSize: 15, fontWeight: '700' },
  localNote: { color: palette.secondary, fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 15, paddingHorizontal: 36 },
  pressed: { opacity: 0.72 },
});
