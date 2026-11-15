import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, noticingThemes } from '@/constants/trailmark-theme';
import { deleteSavedTrailStory, getSavedTrailStories, type SavedTrailStory } from '@/lib/trail-stories';

const palette = colors.light;
const archiveThemes = {
  default: { id: 'default', label: 'TrailMark original', short: 'Original', accent: '#226C4A', accentSoft: '#E9EFE5', card: '#1C392B', cardText: '#FFFFFF', surface: '#E9EFE5', ink: '#18271E' },
  ...noticingThemes,
};
const topFadeOpacity = Array.from({ length: 56 }, (_, index) => Math.pow(1 - index / 55, 1.7));

const archiveWalks = [
  { title: 'Grand Prismatic at dusk', location: 'Yellowstone National Park', date: 'Oct 18, 2026', momentCount: 2, noticingFocus: 'The sound of falling water', noticeTheme: 'water' },
  { title: 'A windy return', location: 'Yellowstone National Park', date: 'Sep 29, 2026', momentCount: 4, noticingFocus: 'Wind on the shoreline', noticeTheme: 'water' },
  { title: 'Before the colors changed', location: 'Yellowstone National Park', date: 'Sep 4, 2026', momentCount: 3, noticingFocus: 'Mountain and lake scale', noticeTheme: 'earth' },
] as const;
const preparedWalkTitles = new Set<string>(archiveWalks.map((walk) => walk.title));

export default function ArchiveScreen() {
  const insets = useSafeAreaInsets();
  const [stories, setStories] = useState<SavedTrailStory[]>([]);

  useFocusEffect(useCallback(() => {
    setStories(getSavedTrailStories().filter((story) => !preparedWalkTitles.has(story.title)));
  }, []));

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <ScrollView automaticallyAdjustContentInsets={false} contentInsetAdjustmentBehavior="never" contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 22 }]} showsVerticalScrollIndicator={false}>
        <Text accessibilityRole="header" style={styles.title}>Archive</Text>
        <Text style={styles.description}>Walks you chose to keep.</Text>

        {stories.length ? (
          <View style={styles.storyList}>
            <View style={styles.sectionHeading}><Text style={styles.sectionLabel}>Recently saved</Text><Text style={styles.sectionCount}>{stories.length} {stories.length === 1 ? 'story' : 'stories'}</Text></View>
            {stories.map((story) => <ArchiveCard key={story.id} story={story} onPress={() => router.push({ pathname: '/recap', params: { storyId: story.id } })} onDelete={() => confirmDelete(story, setStories)} />)}
          </View>
        ) : null}

        <View style={styles.pastWalks}>
          <View style={styles.sectionHeading}><Text style={styles.sectionLabel}>{stories.length ? 'Earlier walks' : 'Your walks'}</Text></View>
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

function ArchiveWalkCard({ title, location, date, momentCount, noticingFocus, noticeTheme }: (typeof archiveWalks)[number]) {
  const theme = noticingThemes[noticeTheme];
  return (
    <View accessibilityLabel={`${title}, past walk`} style={styles.pastWalkCard}>
      <RoutePreview theme={theme} momentCount={momentCount} compact />
      <View style={styles.rowCopy}><View style={styles.rowTitleLine}><View style={[styles.themeDot, { backgroundColor: theme.accent }]} /><Text numberOfLines={1} style={styles.rowTitle}>{title}</Text></View><Text numberOfLines={1} style={styles.rowLocation}>{location}</Text><Text style={styles.rowMeta}>{date} · {momentCount} moments</Text><Text numberOfLines={1} style={[styles.rowFocus, { color: theme.ink }]}>{noticingFocus}</Text></View>
    </View>
  );
}

function ArchiveCard({ story, onPress, onDelete }: { story: SavedTrailStory; onPress: () => void; onDelete: () => void }) {
  const momentLabel = story.momentIds.length === 1 ? 'moment' : 'moments';
  const nodCount = story.marks?.filter((mark) => mark.source === 'nod').length ?? 0;
  const theme = archiveThemes[story.noticeTheme ?? 'default'];
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Open ${story.title}`} accessibilityHint="Double tap to revisit this story. Press and hold to delete." onPress={onPress} onLongPress={onDelete} delayLongPress={500} style={({ pressed }) => [styles.savedStoryCard, pressed && styles.pressed]}>
      <RoutePreview theme={theme} momentCount={story.momentIds.length} />
      <View style={styles.rowCopy}><View style={styles.rowTitleLine}><View style={[styles.themeDot, { backgroundColor: theme.accent }]} /><Text numberOfLines={1} style={styles.rowTitle}>{story.title}</Text></View><Text numberOfLines={1} style={styles.rowLocation}>{story.location}</Text><Text style={styles.rowMeta}>{formatDate(story.createdAt)} · {story.momentIds.length} {momentLabel}{nodCount ? ` · ${nodCount} with Nod` : ''}</Text><Text numberOfLines={1} style={[styles.rowFocus, { color: theme.ink }]}>{story.noticingFocus || theme.short}</Text></View>
    </Pressable>
  );
}

type ArchiveTheme = (typeof archiveThemes)[keyof typeof archiveThemes];

function RoutePreview({ theme, momentCount, compact = false }: { theme: ArchiveTheme; momentCount: number; compact?: boolean }) {
  const visibleMoments = Math.min(Math.max(momentCount, 1), 4);
  return <View style={[styles.routePreview, compact ? styles.routePreviewCompact : styles.routePreviewSaved, { backgroundColor: theme.accentSoft }]}>
    <View style={[styles.routeLand, { backgroundColor: theme.surface }]} />
    <View style={[styles.routeWater, { backgroundColor: `${theme.accent}30` }]} />
    <View style={[styles.routeLine, styles.routeLineOne, { backgroundColor: theme.accent }]} />
    <View style={[styles.routeLine, styles.routeLineTwo, { backgroundColor: theme.accent }]} />
    <View style={[styles.routePin, styles.routePinStart, { borderColor: theme.accent, backgroundColor: theme.surface }]} />
    {Array.from({ length: visibleMoments }, (_, index) => <View key={index} style={[styles.routePin, styles.routePinMoment, index === 1 && styles.routePinMomentSecond, index === 2 && styles.routePinMomentThird, index === 3 && styles.routePinMomentFourth, { backgroundColor: theme.accent, borderColor: theme.surface }]} />)}
  </View>;
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
  storyList: { gap: 10, marginTop: 32 },
  pastWalks: { gap: 10, marginTop: 30 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  sectionLabel: { color: palette.text, fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  sectionCount: { color: palette.secondary, fontSize: 11, fontWeight: '600' },
  savedStoryCard: { minHeight: 126, flexDirection: 'row', alignItems: 'center', gap: 13, padding: 8, borderRadius: 22, borderWidth: 1, borderColor: '#DCE5DC', backgroundColor: palette.surface },
  pastWalkCard: { minHeight: 94, flexDirection: 'row', alignItems: 'center', gap: 13, padding: 8, borderRadius: 19, borderWidth: 1, borderColor: '#E1E8E1', backgroundColor: '#FFFFFF' },
  routePreview: { overflow: 'hidden', borderRadius: 16 },
  routePreviewSaved: { width: 106, alignSelf: 'stretch', minHeight: 110 },
  routePreviewCompact: { width: 78, height: 78, borderRadius: 13 },
  routeLand: { position: 'absolute', width: '88%', height: '65%', right: '-27%', top: '-17%', borderRadius: 28, transform: [{ rotate: '-27deg' }] },
  routeWater: { position: 'absolute', width: '115%', height: '43%', left: '-31%', bottom: '-14%', borderRadius: 30, transform: [{ rotate: '19deg' }] },
  routeLine: { position: 'absolute', height: 5, borderRadius: 3 },
  routeLineOne: { width: '69%', left: '17%', top: '42%', transform: [{ rotate: '47deg' }] },
  routeLineTwo: { width: '43%', left: '46%', top: '63%', transform: [{ rotate: '-35deg' }] },
  routePin: { position: 'absolute', width: 13, height: 13, borderRadius: 7, borderWidth: 3 },
  routePinStart: { left: '12%', top: '28%' },
  routePinMoment: { left: '42%', top: '52%' },
  routePinMomentSecond: { left: '58%', top: '65%' },
  routePinMomentThird: { left: '70%', top: '48%' },
  routePinMomentFourth: { left: '78%', top: '36%' },
  rowCopy: { flex: 1, minWidth: 0, justifyContent: 'center' },
  rowTitleLine: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  themeDot: { width: 8, height: 8, borderRadius: 4 },
  rowTitle: { flex: 1, color: palette.text, fontSize: 17, lineHeight: 21, fontWeight: '800', letterSpacing: -0.25 },
  rowLocation: { color: palette.secondary, fontSize: 13, fontWeight: '600', marginTop: 4 },
  rowMeta: { color: '#718076', fontSize: 12, fontWeight: '600', marginTop: 5 },
  rowFocus: { fontSize: 12, fontWeight: '800', marginTop: 6 },
  pressed: { opacity: 0.8 },
});
