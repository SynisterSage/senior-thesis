import Mapbox from '@rnmapbox/maps';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/trailmark-theme';
import { getPublishedTrail, type Trail } from '@/lib/trails';

const palette = colors.light;
const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
if (mapboxToken) Mapbox.setAccessToken(mapboxToken);

const storyImage = require('../../assets/trails/grand-prismatic/spring.jpg');
const storyImageTwo = require('../../assets/trails/grand-prismatic/overlook.jpg');

const sampleStories = [
  {
    id: 'quiet-water',
    title: 'A quiet morning at the lake',
    note: 'The light changed when I reached the water.',
    meta: '4 moments · Shared anonymously',
    image: storyImage,
  },
  {
    id: 'wide-view',
    title: 'The trail opened up',
    note: 'I did not expect the overlook to feel so open after the trees.',
    meta: '3 moments · Shared by Maya',
    image: storyImageTwo,
  },
  {
    id: 'first-visit',
    title: 'First time through',
    note: 'Mostly birds, wind, and the sound of my own steps.',
    meta: '5 moments · Shared anonymously',
    image: storyImage,
  },
] as const;

export default function TrailStoriesScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const [trail, setTrail] = useState<Trail | null>(null);
  const trailName = trail?.name?.replace(/ Trail$/, '') ?? 'Grand Prismatic Overlook';

  useEffect(() => {
    if (!slug) return;
    void getPublishedTrail(slug).then(setTrail);
  }, [slug]);

  const shareInvite = () => {
    void Share.share({
      title: `Trail stories from ${trailName}`,
      message: `See shared moments from ${trailName} in TrailMark.`,
    });
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>Trail stories</Text>
            <Text numberOfLines={1} style={styles.headerTitle}>{trailName}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Share trail stories" onPress={shareInvite} style={styles.headerButton}>
            <TrailSymbol name="square.and.arrow.up" androidName="share" size={17} color={palette.text} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={styles.title}>What people noticed here</Text>
          <Text style={styles.subtitle}>Nod moments from the same trail, shared by the people who walked it.</Text>
        </View>

        <View style={styles.mapCard}>
          <View style={styles.mapCardHeader}>
            <View>
              <Text style={styles.mapLabel}>Nod moments shared here</Text>
              <Text style={styles.mapCount}>18 stories · 42 moments</Text>
            </View>
            <TrailSymbol name="sparkles" androidName="auto_awesome" size={20} color={palette.accent} />
          </View>
          <View style={styles.mapFrame}>
            {mapboxToken ? (
              <Mapbox.MapView style={styles.map} styleURL={Mapbox.StyleURL.Outdoors} logoEnabled={false} attributionEnabled={false} scaleBarEnabled={false} scrollEnabled={false} zoomEnabled={false} rotateEnabled={false} pitchEnabled={false}>
                <Mapbox.Camera defaultSettings={{ centerCoordinate: [-110.836, 44.52], zoomLevel: 11.8 }} />
                {trail?.route_geojson ? <Mapbox.ShapeSource id="shared-stories-route" shape={trail.route_geojson}><Mapbox.LineLayer id="shared-stories-route-line" style={{ lineColor: palette.accent, lineWidth: 4, lineCap: 'round', lineJoin: 'round' }} /></Mapbox.ShapeSource> : null}
                <Mapbox.PointAnnotation id="shared-moment-one" coordinate={[-110.84, 44.522]}><View style={styles.mapMoment}><View style={styles.mapMomentCore} /></View></Mapbox.PointAnnotation>
                <Mapbox.PointAnnotation id="shared-moment-two" coordinate={[-110.834, 44.519]}><View style={styles.mapMoment}><View style={styles.mapMomentCore} /></View></Mapbox.PointAnnotation>
                <Mapbox.PointAnnotation id="shared-moment-three" coordinate={[-110.829, 44.518]}><View style={styles.mapMoment}><View style={styles.mapMomentCore} /></View></Mapbox.PointAnnotation>
              </Mapbox.MapView>
            ) : <View style={styles.mapFallback}><View style={styles.fallbackRoute} /><View style={[styles.fallbackMoment, { left: '27%', top: '42%' }]} /><View style={[styles.fallbackMoment, { left: '53%', top: '30%' }]} /><View style={[styles.fallbackMoment, { left: '72%', top: '62%' }]} /></View>}
          </View>
          <Text style={styles.mapFootnote}>Each point represents a place someone chose to remember.</Text>
        </View>

        <View style={styles.sectionHeader}>
          <View><Text style={styles.sectionTitle}>Shared stories</Text><Text style={styles.sectionSubtitle}>Open a story to walk through someone else’s moments.</Text></View>
          <Text style={styles.sectionMeta}>3 of 18</Text>
        </View>

        <View style={styles.storyList}>
          {sampleStories.map((story) => <SharedStoryCard key={story.id} {...story} onPress={() => router.push({ pathname: '/shared-story', params: { storyId: story.id, trailName } })} />)}
        </View>

        <View style={styles.sharePrompt}>
          <View style={styles.sharePromptIcon}><TrailSymbol name="bubble.left.and.bubble.right.fill" androidName="forum" size={20} color={palette.accent} /></View>
          <View style={styles.sharePromptCopy}><Text style={styles.sharePromptTitle}>Have a moment from this trail?</Text><Text style={styles.sharePromptText}>Finish your hike story to share it here.</Text></View>
          <TrailSymbol name="chevron.right" androidName="chevron_right" size={17} color={palette.secondary} />
        </View>
      </ScrollView>
    </View>
  );
}

function SharedStoryCard({ title, note, meta, image, onPress }: { title: string; note: string; meta: string; image: number; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.storyCard, pressed && styles.pressed]}>
    <Image source={image} contentFit="cover" style={styles.storyImage} />
    <View style={styles.storyCopy}>
      <Text style={styles.storyTitle}>{title}</Text>
      <Text numberOfLines={2} style={styles.storyNote}>“{note}”</Text>
      <View style={styles.storyFooter}><Text style={styles.storyMeta}>{meta}</Text><Text style={styles.viewStory}>View story  ›</Text></View>
    </View>
  </Pressable>;
}

function TrailSymbol({ name, androidName, size, color }: { name: string; androidName: string; size: number; color: string }) {
  return <SymbolView name={{ ios: name as SFSymbol, android: androidName as never, web: androidName as never }} size={size} weight="medium" tintColor={color} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  safeTop: { backgroundColor: palette.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 6, paddingBottom: 12 },
  backButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
  backIcon: { color: palette.text, fontSize: 31, lineHeight: 31, fontWeight: '300', marginTop: -4 },
  headerCopy: { flex: 1, gap: 2 },
  eyebrow: { color: palette.accent, fontSize: 11, fontWeight: '800', letterSpacing: 0.7, textTransform: 'uppercase' },
  headerTitle: { color: palette.text, fontSize: 18, fontWeight: '800' },
  headerButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
  scroll: { paddingHorizontal: 18, paddingBottom: 42 },
  intro: { paddingTop: 18, paddingBottom: 20, gap: 7 },
  title: { color: palette.text, fontSize: 29, lineHeight: 34, fontWeight: '800', letterSpacing: -0.8 },
  subtitle: { color: palette.secondary, fontSize: 14, lineHeight: 20 },
  mapCard: { padding: 14, borderRadius: 24, backgroundColor: '#EAF1EA', borderWidth: 1, borderColor: '#D9E5DB' },
  mapCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 11 },
  mapLabel: { color: palette.text, fontSize: 16, fontWeight: '800' },
  mapCount: { color: palette.secondary, fontSize: 12, marginTop: 2 },
  mapFrame: { height: 194, overflow: 'hidden', borderRadius: 17, backgroundColor: '#D6E4D8' },
  map: { ...StyleSheet.absoluteFill },
  mapFootnote: { color: palette.secondary, fontSize: 11, lineHeight: 15, marginTop: 10 },
  mapMoment: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(34,108,74,0.2)' },
  mapMomentCore: { width: 10, height: 10, borderRadius: 5, backgroundColor: palette.accent, borderWidth: 2, borderColor: '#FFFFFF' },
  mapFallback: { ...StyleSheet.absoluteFill, backgroundColor: '#DCE9DE' },
  fallbackRoute: { position: 'absolute', left: '20%', top: '38%', width: '60%', height: 4, borderRadius: 3, backgroundColor: palette.accent, transform: [{ rotate: '-18deg' }] },
  fallbackMoment: { position: 'absolute', width: 15, height: 15, borderRadius: 8, backgroundColor: palette.accent, borderWidth: 3, borderColor: '#FFFFFF' },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 28, marginBottom: 12 },
  sectionTitle: { color: palette.text, fontSize: 21, fontWeight: '800', letterSpacing: -0.3 },
  sectionSubtitle: { color: palette.secondary, fontSize: 12, lineHeight: 17, marginTop: 4 },
  sectionMeta: { color: palette.secondary, fontSize: 11, fontWeight: '700', paddingBottom: 3 },
  storyList: { gap: 12 },
  storyCard: { flexDirection: 'row', minHeight: 130, overflow: 'hidden', borderRadius: 20, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
  storyImage: { width: 112, backgroundColor: '#CBDCCF' },
  storyCopy: { flex: 1, justifyContent: 'center', padding: 14, gap: 7 },
  storyTitle: { color: palette.text, fontSize: 16, lineHeight: 20, fontWeight: '800' },
  storyNote: { color: palette.secondary, fontSize: 13, lineHeight: 18 },
  storyFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 2 },
  storyMeta: { flex: 1, color: '#718178', fontSize: 10, fontWeight: '600' },
  viewStory: { color: palette.accent, fontSize: 11, fontWeight: '800' },
  sharePrompt: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 24, padding: 15, borderRadius: 18, backgroundColor: '#F0F5F0' },
  sharePromptIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DCEDE0' },
  sharePromptCopy: { flex: 1, gap: 3 },
  sharePromptTitle: { color: palette.text, fontSize: 13, fontWeight: '800' },
  sharePromptText: { color: palette.secondary, fontSize: 11, lineHeight: 15 },
  pressed: { opacity: 0.78 },
});
