import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/trailmark-theme';
import { getNoticingFocus } from '@/lib/noticing-focuses';

const palette = colors.light;
const nearbyTrails = [
  { title: 'Grand Prismatic Overlook', place: 'Yellowstone · 1.2 mi', image: require('../../assets/trails/grand-prismatic/overlook.jpg'), slug: 'grand-prismatic-overlook' },
  { title: 'Fairy Falls', place: 'Yellowstone · 5.4 mi', image: require('../../assets/trails/catalog/fairy-falls.jpg'), slug: 'fairy-falls' },
  { title: 'Midway Geyser Basin', place: 'Yellowstone · 0.8 mi', image: require('../../assets/trails/catalog/midway-geyser-basin.jpg'), slug: 'midway-basin' },
];

export default function NoticingFocusScreen() {
  const { focusId } = useLocalSearchParams<{ focusId?: string }>();
  const focus = getNoticingFocus(focusId) ?? getNoticingFocus('color')!;
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [selectedTrail, setSelectedTrail] = useState(0);
  const heroHeight = Math.min(Math.max(height * 0.49, 340), 470);
  const [titleOpacity] = useState(() => new Animated.Value(0));
  const [titleOffset] = useState(() => new Animated.Value(12));

  useEffect(() => {
    titleOpacity.setValue(0);
    titleOffset.setValue(12);
    Animated.parallel([
      Animated.timing(titleOpacity, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(titleOffset, { toValue: 0, damping: 18, stiffness: 150, mass: 0.8, useNativeDriver: true }),
    ]).start();
  }, [focus.id, titleOpacity, titleOffset]);

  const trail = nearbyTrails[selectedTrail] ?? nearbyTrails[0];
  const startWithTrail = () => router.push({ pathname: '/trail-preview', params: { slug: trail.slug, focusId: focus.id, notice: focus.focus } });

  return (
    <View style={styles.page}>
      <StatusBar style="light" />
      <View style={[styles.hero, { height: heroHeight }]}> 
        <Image source={focus.image} contentFit="cover" style={StyleSheet.absoluteFill} />
        <View style={styles.heroShade} />
        <SafeAreaView edges={['top']} style={styles.heroSafe}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={18} weight="semibold" tintColor={palette.text} />
          </Pressable>
        </SafeAreaView>
        <Animated.View style={[styles.heroCopy, { opacity: titleOpacity, transform: [{ translateY: titleOffset }] }]}>
          <Text style={styles.eyebrow}>A noticing lens</Text>
          <Text accessibilityRole="header" style={styles.title}>{focus.title}</Text>
          <Text style={styles.heroPrompt}>{focus.prompt}</Text>
        </Animated.View>
      </View>

      <ScrollView style={styles.detailsScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.body}>
          <Text style={styles.description}>{focus.description}</Text>
          <View style={styles.examples}>
            <Text style={styles.sectionTitle}>A few things to look for</Text>
            {focus.examples.map((example, index) => <View key={example} style={styles.exampleRow}><Text style={styles.exampleIndex}>0{index + 1}</Text><Text style={styles.exampleText}>{example}</Text></View>)}
          </View>

          <View style={styles.trailSection}>
            <View style={styles.trailHeading}>
              <View><Text style={styles.sectionTitle}>Pick a trail</Text><Text style={styles.sectionSubtitle}>Choose where you want to try this lens.</Text></View>
              <Text style={styles.nearbyLabel}>NEARBY</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trailRail}>
              {nearbyTrails.map((item, index) => <Pressable key={item.slug} accessibilityRole="button" accessibilityState={{ selected: selectedTrail === index }} accessibilityLabel={`${item.title}, ${item.place}`} onPress={() => setSelectedTrail(index)} style={({ pressed }) => [styles.trailCard, selectedTrail === index && styles.trailCardSelected, pressed && styles.pressed]}>
                <Image source={item.image} contentFit="cover" style={styles.trailPhoto} />
                <View style={styles.trailText}><Text numberOfLines={1} style={styles.trailName}>{item.title}</Text><Text style={styles.trailPlace}>{item.place}</Text></View>
                {selectedTrail === index ? <View style={styles.selectedMark}><SymbolView name={{ ios: 'checkmark', android: 'check', web: 'check' }} size={12} weight="bold" tintColor="#FFFFFF" /></View> : null}
              </Pressable>)}
            </ScrollView>
          </View>

          <View style={styles.nodNote}>
            <View style={styles.nodIcon}><SymbolView name={{ ios: 'hand.tap.fill', android: 'touch_app', web: 'touch_app' }} size={17} tintColor={palette.accent} /></View>
            <Text style={styles.nodText}>When something catches your attention, mark it with Nod. This lens is just a place to begin.</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Choose ${trail.title} with ${focus.title}`} onPress={startWithTrail} style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}>
          <Text style={styles.primaryText}>Continue with {trail.title}</Text>
          <SymbolView name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }} size={18} weight="semibold" tintColor="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.background },
  detailsScroll: { flex: 1 },
  scrollContent: { paddingBottom: 18 },
  hero: { overflow: 'hidden', backgroundColor: '#315849' },
  heroShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(9, 27, 22, 0.30)' },
  heroSafe: { paddingHorizontal: 20 },
  backButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(248,250,247,0.94)' },
  heroCopy: { position: 'absolute', left: 24, right: 24, bottom: 30, gap: 5 },
  eyebrow: { color: '#E1EAE3', fontSize: 12, fontWeight: '800', letterSpacing: 1.1, textTransform: 'uppercase' },
  title: { color: '#FFFFFF', fontSize: 37, lineHeight: 42, fontWeight: '800', letterSpacing: -1.1 },
  heroPrompt: { maxWidth: 350, marginTop: 3, color: '#FFFFFF', fontSize: 16, lineHeight: 22, fontWeight: '600' },
  body: { paddingTop: 24 },
  description: { paddingHorizontal: 22, color: palette.text, fontSize: 18, lineHeight: 26, fontWeight: '600' },
  examples: { marginTop: 26, paddingHorizontal: 22, gap: 12 },
  sectionTitle: { color: palette.text, fontSize: 18, lineHeight: 23, fontWeight: '800', letterSpacing: -0.25 },
  exampleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  exampleIndex: { width: 24, color: palette.accent, fontSize: 12, lineHeight: 21, fontWeight: '800' },
  exampleText: { flex: 1, color: palette.secondary, fontSize: 15, lineHeight: 21 },
  trailSection: { marginTop: 30 },
  trailHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, marginBottom: 13 },
  sectionSubtitle: { marginTop: 3, color: palette.secondary, fontSize: 12, lineHeight: 17 },
  nearbyLabel: { color: palette.accent, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  trailRail: { gap: 11, paddingHorizontal: 22, paddingBottom: 3 },
  trailCard: { width: 230, minHeight: 86, flexDirection: 'row', alignItems: 'center', padding: 7, borderRadius: 17, borderWidth: 1.5, borderColor: '#E0E8E4', backgroundColor: '#FFFFFF' },
  trailCardSelected: { borderColor: palette.accent, backgroundColor: '#F1F6F1' },
  trailPhoto: { width: 68, height: 68, borderRadius: 12 },
  trailText: { flex: 1, paddingHorizontal: 10, gap: 4 },
  trailName: { color: palette.text, fontSize: 13, fontWeight: '800' },
  trailPlace: { color: palette.secondary, fontSize: 10, lineHeight: 14 },
  selectedMark: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.accent },
  nodNote: { flexDirection: 'row', alignItems: 'center', gap: 11, marginHorizontal: 22, marginTop: 24, paddingVertical: 13, borderTopWidth: 1, borderTopColor: '#E0E8E4' },
  nodIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E7F0E9' },
  nodText: { flex: 1, color: palette.secondary, fontSize: 12, lineHeight: 17 },
  bottomBar: { paddingTop: 12, paddingHorizontal: 20, backgroundColor: palette.background, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#DCE5E0' },
  primaryButton: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingHorizontal: 18, borderRadius: 17, backgroundColor: palette.accent },
  primaryText: { flex: 1, color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.82 }, buttonPressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
});
