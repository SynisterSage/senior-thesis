import { router, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, noticingThemes } from '@/constants/trailmark-theme';
import { deleteSavedTrailStory, getSavedTrailStories, type SavedTrailStory } from '@/lib/trail-stories';
import { grandPrismaticMoments } from '@/lib/trail-moments';
import { useTabBarVisibility } from '@/lib/tab-bar-visibility';

const palette = colors.light;
const archiveThemes = {
  default: { id: 'default', label: 'TrailMark original', short: 'Original', accent: '#226C4A', accentSoft: '#E9EFE5', card: '#1C392B', cardText: '#FFFFFF', surface: '#E9EFE5', ink: '#18271E' },
  ...noticingThemes,
};
const topFadeOpacity = Array.from({ length: 56 }, (_, index) => Math.pow(1 - index / 55, 1.7));
const returnWalkImage = require('../../../assets/trails/catalog/fairy-falls.jpg');

type ArchiveWalk = {
  title: string;
  location: string;
  image: number;
  date: string;
  momentCount: number;
  noticingFocus: string;
  noticeTheme: keyof typeof noticingThemes;
};

const archiveWalks: readonly ArchiveWalk[] = [
  { title: 'Fairy Falls', location: 'Yellowstone National Park', image: require('../../../assets/trails/catalog/fairy-falls.jpg'), date: 'Oct 18, 2026', momentCount: 2, noticingFocus: 'The sound of falling water', noticeTheme: 'water' },
  { title: 'Storm Point', location: 'Yellowstone National Park', image: require('../../../assets/trails/catalog/storm-point.jpg'), date: 'Sep 29, 2026', momentCount: 4, noticingFocus: 'Wind on the shoreline', noticeTheme: 'water' },
  { title: 'Midway Geyser Basin', location: 'Yellowstone National Park', image: require('../../../assets/trails/catalog/midway-geyser-basin.jpg'), date: 'Sep 4, 2026', momentCount: 3, noticingFocus: 'Warm ground and rock', noticeTheme: 'earth' },
  { title: 'Lone Star Geyser', location: 'Yellowstone National Park', image: require('../../../assets/trails/catalog/lone-star-geyser.jpg'), date: 'Aug 22, 2026', momentCount: 3, noticingFocus: 'The rhythm of the river', noticeTheme: 'living' },
  { title: 'Mystic Falls', location: 'Yellowstone National Park', image: require('../../../assets/trails/catalog/mystic-falls.jpg'), date: 'Aug 9, 2026', momentCount: 2, noticingFocus: 'The quiet between trees', noticeTheme: 'living' },
  { title: 'Taggart Lake', location: 'Grand Teton National Park', image: require('../../../assets/trails/catalog/taggart-lake.jpg'), date: 'Jul 28, 2026', momentCount: 3, noticingFocus: 'A break in the clouds', noticeTheme: 'earth' },
  { title: 'Phelps Lake', location: 'Grand Teton National Park', image: require('../../../assets/trails/catalog/phelps-lake.jpg'), date: 'Jul 11, 2026', momentCount: 2, noticingFocus: 'Still water below', noticeTheme: 'water' },
];
const relatedVisits: readonly ArchiveWalk[] = [
  { title: 'Jenny Lake Loop', location: 'Grand Teton National Park', image: require('../../../assets/trails/catalog/jenny-lake-loop.jpg'), date: 'Oct 5, 2026', momentCount: 2, noticingFocus: 'The edge of the water', noticeTheme: 'water' },
  { title: 'Jenny Lake Loop', location: 'Grand Teton National Park', image: require('../../../assets/trails/catalog/jenny-lake-loop.jpg'), date: 'Nov 8, 2026', momentCount: 3, noticingFocus: 'A break in the clouds', noticeTheme: 'earth' },
];
const preparedWalkTitles = new Set<string>([...archiveWalks.map((walk) => walk.title), ...relatedVisits.map((walk) => walk.title), 'Grand Prismatic at dusk', 'A windy return', 'Before the colors changed']);

export default function ArchiveScreen() {
  const insets = useSafeAreaInsets();
  const { onScroll } = useTabBarVisibility();
  const [stories, setStories] = useState<SavedTrailStory[]>([]);
  const [relatedVisitsOpen, setRelatedVisitsOpen] = useState(false);

  useFocusEffect(useCallback(() => {
    setStories(getSavedTrailStories().filter((story) => !preparedWalkTitles.has(story.title)));
  }, []));

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <ScrollView automaticallyAdjustContentInsets={false} contentInsetAdjustmentBehavior="never" contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 22 }]} showsVerticalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={16}>
        <Text accessibilityRole="header" style={styles.title}>Archive</Text>
        <Text style={styles.description}>Walks you chose to keep.</Text>

        <Pressable accessibilityRole="button" accessibilityLabel="Return to your Fairy Falls walk" accessibilityHint="Reflect on what has stayed with you since this walk." onPress={() => router.push('/return-to-walk')} style={({ pressed }) => [styles.returnHero, pressed && styles.pressed]}>
          <Image source={returnWalkImage} contentFit="cover" style={styles.returnHeroImage} />
          <LinearGradient pointerEvents="none" colors={['rgba(10,25,18,0.03)', 'rgba(10,25,18,0.82)']} locations={[0.2, 1]} style={styles.returnHeroShade} />
          <View style={styles.returnHeroCopy}><Text style={styles.returnEyebrow}>A WALK TO RETURN TO</Text><Text style={styles.returnTitle}>Fairy Falls</Text><Text style={styles.returnDetail}>Yellowstone National Park · One week ago</Text></View>
          <View style={styles.returnHeroAction}><Text style={styles.returnHeroActionText}>Return</Text><Text style={styles.returnArrow}>›</Text></View>
        </Pressable>

        {stories.length ? (
          <View style={styles.storyList}>
            <View style={styles.sectionHeading}><Text style={styles.sectionLabel}>Recently saved</Text><Text style={styles.sectionCount}>{stories.length} {stories.length === 1 ? 'story' : 'stories'}</Text></View>
            {stories.map((story) => <ArchiveCard key={story.id} story={story} onPress={() => router.push({ pathname: '/recap', params: { storyId: story.id } })} onDelete={() => confirmDelete(story, setStories)} />)}
          </View>
        ) : null}

        <View style={styles.pastWalks}>
          <View style={styles.sectionHeading}><Text style={styles.sectionLabel}>{stories.length ? 'Earlier walks' : 'Your walks'}</Text><Text style={styles.sectionCount}>{archiveWalks.length} walks</Text></View>
          <View style={styles.relatedVisits}><Pressable accessibilityRole="button" accessibilityState={{ expanded: relatedVisitsOpen }} accessibilityLabel={`${relatedVisitsOpen ? 'Hide' : 'Show'} two Jenny Lake Loop visits`} onPress={() => setRelatedVisitsOpen((open) => !open)} style={({ pressed }) => [styles.relatedVisitsHeader, pressed && styles.pressed]}><View><Text style={styles.relatedVisitsTitle}>Jenny Lake Loop</Text><Text style={styles.relatedVisitsDetail}>2 walks · Same trail, noticed differently.</Text></View><View style={styles.relatedVisitsControl}><View style={styles.relatedVisitsCount}><Text style={styles.relatedVisitsCountText}>2</Text></View><SymbolView name={{ ios: (relatedVisitsOpen ? 'chevron.up' : 'chevron.down') as never, android: relatedVisitsOpen ? 'keyboard_arrow_up' as never : 'keyboard_arrow_down' as never, web: relatedVisitsOpen ? 'keyboard_arrow_up' as never : 'keyboard_arrow_down' as never }} size={17} weight="semibold" tintColor={palette.accent} /></View></Pressable>{relatedVisitsOpen ? <View style={styles.relatedVisitsList}>{relatedVisits.map((walk) => <ArchiveWalkCard key={walk.date} {...walk} />)}</View> : null}</View>
          {archiveWalks.map((walk) => <ArchiveWalkCard key={walk.title} {...walk} />)}
        </View>
      </ScrollView>
      <TopFade safeTop={insets.top} />
    </SafeAreaView>
  );
}

function TopFade({ safeTop }: { safeTop: number }) {
  return <View pointerEvents="none" style={[styles.topFade, { height: safeTop + 30 }]}>{topFadeOpacity.map((opacity, index) => <View key={index} style={[styles.topFadeStrip, { opacity }]} />)}</View>;
}

function confirmDelete(story: SavedTrailStory, setStories: (stories: SavedTrailStory[]) => void) {
  Alert.alert('Delete this story?', 'This walk and its reflections will be removed from your Archive.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => { deleteSavedTrailStory(story.id); setStories(getSavedTrailStories()); } },
  ]);
}

function ArchiveWalkCard({ title, location, image, date, momentCount, noticingFocus, noticeTheme }: ArchiveWalk) {
  const theme = noticingThemes[noticeTheme];
  return (
    <View accessibilityLabel={`${title}, past walk`} style={styles.pastWalkCard}>
      <Image source={image} contentFit="cover" style={styles.pastWalkImage} />
      <View style={styles.rowCopy}><View style={styles.rowTitleLine}><View style={[styles.themeDot, { backgroundColor: theme.accent }]} /><Text numberOfLines={1} style={styles.rowTitle}>{title}</Text></View><Text numberOfLines={1} style={styles.rowLocation}>{location}</Text><Text style={styles.rowMeta}>{date} · {momentCount} moments</Text><Text numberOfLines={1} style={[styles.rowFocus, { color: theme.ink }]}>{noticingFocus}</Text></View>
    </View>
  );
}

function ArchiveCard({ story, onPress, onDelete }: { story: SavedTrailStory; onPress: () => void; onDelete: () => void }) {
  const momentLabel = story.momentIds.length === 1 ? 'moment' : 'moments';
  const theme = archiveThemes[story.noticeTheme ?? 'default'];
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Open ${story.title}`} accessibilityHint="Double tap to revisit this story. Press and hold to delete." onPress={onPress} onLongPress={onDelete} delayLongPress={500} style={({ pressed }) => [styles.savedStoryCard, pressed && styles.pressed]}>
      {grandPrismaticMoments.find((moment) => story.momentIds.includes(moment.id) && moment.image)?.image ? <Image source={grandPrismaticMoments.find((moment) => story.momentIds.includes(moment.id) && moment.image)?.image} contentFit="cover" style={styles.savedStoryImage} /> : <View style={[styles.savedStoryImage, { backgroundColor: theme.accentSoft }]} />}
      <View style={styles.rowCopy}><View style={styles.rowTitleLine}><View style={[styles.themeDot, { backgroundColor: theme.accent }]} /><Text numberOfLines={1} style={styles.rowTitle}>{story.title}</Text></View><Text numberOfLines={1} style={styles.rowLocation}>{story.location}</Text><Text style={styles.rowMeta}>{formatDate(story.createdAt)} · {story.momentIds.length} {momentLabel}</Text><Text numberOfLines={1} style={[styles.rowFocus, { color: theme.ink }]}>{story.noticingFocus || theme.short}</Text></View>
    </Pressable>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  scroll: { flexGrow: 1, paddingHorizontal: 18, paddingBottom: 112 },
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  topFadeStrip: { flex: 1, backgroundColor: palette.background },
  title: { color: palette.text, fontSize: 34, lineHeight: 39, fontWeight: '800', letterSpacing: -0.9 },
  description: { color: palette.secondary, fontSize: 16, lineHeight: 23, marginTop: 7, maxWidth: 310 },
  returnHero: { height: 224, overflow: 'hidden', marginTop: 24, borderRadius: 24, backgroundColor: '#294C40' },
  returnHeroImage: { ...StyleSheet.absoluteFill },
  returnHeroShade: { ...StyleSheet.absoluteFill },
  returnHeroCopy: { position: 'absolute', left: 17, right: 17, bottom: 17 },
  returnEyebrow: { color: 'rgba(255,255,255,0.84)', fontSize: 10, fontWeight: '800', letterSpacing: 0.9 },
  returnTitle: { color: '#FFFFFF', fontSize: 23, lineHeight: 27, fontWeight: '800', letterSpacing: -0.35, marginTop: 5 },
  returnDetail: { color: 'rgba(255,255,255,0.88)', fontSize: 12, lineHeight: 17, marginTop: 4 },
  returnHeroAction: { position: 'absolute', top: 13, right: 13, flexDirection: 'row', alignItems: 'center', gap: 2, paddingLeft: 11, paddingRight: 8, paddingVertical: 7, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.92)' },
  returnHeroActionText: { color: palette.accent, fontSize: 12, fontWeight: '800' },
  returnArrow: { color: palette.accent, fontSize: 20, lineHeight: 20, fontWeight: '300' },
  storyList: { gap: 10, marginTop: 32 },
  pastWalks: { gap: 10, marginTop: 30 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  sectionLabel: { color: palette.text, fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  sectionCount: { color: palette.secondary, fontSize: 11, fontWeight: '600' },
  relatedVisits: { overflow: 'hidden', borderRadius: 19, borderWidth: 1, borderColor: '#E1E8E1', backgroundColor: '#FFFFFF' },
  relatedVisitsHeader: { minHeight: 74, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  relatedVisitsTitle: { color: palette.text, fontSize: 16, fontWeight: '800' },
  relatedVisitsDetail: { color: palette.secondary, fontSize: 12, marginTop: 4 },
  relatedVisitsControl: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  relatedVisitsCount: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#DCEEDD' },
  relatedVisitsCountText: { color: palette.accent, fontSize: 12, lineHeight: 15, fontWeight: '800', textAlign: 'center' },
  relatedVisitsList: { gap: 10, padding: 10, paddingTop: 0 },
  savedStoryCard: { minHeight: 126, flexDirection: 'row', alignItems: 'center', gap: 13, padding: 8, borderRadius: 22, borderWidth: 1, borderColor: '#DCE5DC', backgroundColor: palette.surface },
  savedStoryImage: { width: 106, alignSelf: 'stretch', minHeight: 110, borderRadius: 16, overflow: 'hidden' },
  pastWalkCard: { minHeight: 104, flexDirection: 'row', alignItems: 'center', gap: 13, padding: 11, borderRadius: 19, borderWidth: 1, borderColor: '#E1E8E1', backgroundColor: '#FFFFFF' },
  pastWalkImage: { width: 78, height: 78, borderRadius: 13 },
  rowCopy: { flex: 1, minWidth: 0, justifyContent: 'center', paddingRight: 6 },
  rowTitleLine: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  themeDot: { width: 8, height: 8, borderRadius: 4 },
  rowTitle: { flex: 1, color: palette.text, fontSize: 17, lineHeight: 21, fontWeight: '800', letterSpacing: -0.25 },
  rowLocation: { color: palette.secondary, fontSize: 13, fontWeight: '600', marginTop: 4 },
  rowMeta: { color: '#718076', fontSize: 12, fontWeight: '600', marginTop: 5 },
  rowFocus: { fontSize: 12, fontWeight: '800', marginTop: 6 },
  pressed: { opacity: 0.8 },
});
