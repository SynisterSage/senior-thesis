import { router, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, getNoticingThemeId, noticingThemes, type NoticingThemeId } from '@/constants/trailmark-theme';
import { deleteSavedTrailStory, getSavedTrailStories, type SavedTrailStory } from '@/lib/trail-stories';
import { grandPrismaticMoments } from '@/lib/trail-moments';

const palette = colors.light;
const topFadeOpacity = Array.from({ length: 56 }, (_, index) => Math.pow(1 - index / 55, 1.7));

const seededWalks = [
  { title: 'Fairy Falls', location: 'Yellowstone National Park', image: require('../../../assets/trails/catalog/fairy-falls.jpg'), date: 'Oct 18, 2026', count: '2 moments', note: 'The trail opened up beside the river, then disappeared into the trees.', noticingFocus: 'The sound of falling water', noticeTheme: 'water' },
  { title: 'Storm Point', location: 'Yellowstone National Park', image: require('../../../assets/trails/catalog/storm-point.jpg'), date: 'Sep 29, 2026', count: '4 moments', note: 'Wind, water, and a long view across the lake.', noticingFocus: 'Wind on the shoreline', noticeTheme: 'water' },
  { title: 'Jenny Lake Loop', location: 'Grand Teton National Park', image: require('../../../assets/trails/catalog/jenny-lake-loop.jpg'), date: 'Sep 4, 2026', count: '3 moments', note: 'A quiet stretch of shoreline before the mountains came into view.', noticingFocus: 'Mountain and lake scale', noticeTheme: 'earth' },
] as const;

export default function ArchiveScreen() {
  const insets = useSafeAreaInsets();
  const [stories, setStories] = useState<SavedTrailStory[]>([]);

  useFocusEffect(useCallback(() => {
    setStories(getSavedTrailStories());
  }, []));

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <ScrollView automaticallyAdjustContentInsets={false} contentInsetAdjustmentBehavior="never" contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 22 }]} showsVerticalScrollIndicator={false}>
        <Text accessibilityRole="header" style={styles.title}>Archive</Text>
        <Text style={styles.description}>The walks you chose to keep.</Text>

        {stories.length ? (
          <View style={styles.storyList}>
            <Text style={styles.sectionLabel}>RECENT WALKS</Text>
            {stories.map((story) => <ArchiveCard key={story.id} story={story} onPress={() => router.push({ pathname: '/recap', params: { storyId: story.id } })} onDelete={() => confirmDelete(story, setStories)} />)}
          </View>
        ) : null}

        <View style={styles.seededList}>
          <Text style={styles.sectionLabel}>{stories.length ? 'MORE WALKS' : 'RECENT WALKS'}</Text>
          {seededWalks.map((walk) => <SeededArchiveCard key={walk.title} {...walk} />)}
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

function SeededArchiveCard({ title, location, image, date, count, noticingFocus, noticeTheme }: (typeof seededWalks)[number]) {
  const theme = noticingThemes[noticeTheme];
  return (
    <View accessibilityLabel={`${title}, saved walk`} style={styles.storyCard}>
      <Image source={image} contentFit="cover" style={styles.cardImage} />
      <View style={[styles.cardShade, { backgroundColor: theme.card }]} />
      <View style={styles.cardTop}><Text style={styles.cardDate}>{date}</Text><Text style={styles.cardCount}>{count}</Text></View>
      <View style={styles.cardCopy}><Text numberOfLines={1} style={styles.cardTitle}>{title}</Text><Text numberOfLines={1} style={styles.cardLocation}>{location}</Text><View style={[styles.focusBadge, { backgroundColor: theme.accent }]}><Text style={styles.focusBadgeText}>{noticingFocus}</Text></View></View>
      <View style={[styles.cardFooter, { borderColor: theme.cardText + '70' }]}><Text style={[styles.cardAction, { color: theme.cardText }]}>Saved walk</Text><Text style={[styles.cardArrow, { color: theme.cardText }]}>→</Text></View>
    </View>
  );
}

function ArchiveCard({ story, onPress, onDelete }: { story: SavedTrailStory; onPress: () => void; onDelete: () => void }) {
  const momentLabel = story.momentIds.length === 1 ? 'moment' : 'moments';
  const cover = grandPrismaticMoments.find((moment) => story.momentIds.includes(moment.id) && moment.image)?.image ?? grandPrismaticMoments[3]?.image;
  const themeId: NoticingThemeId | undefined = story.noticeTheme ?? (story.noticingFocus ? getNoticingThemeId(story.noticingFocus) : undefined);
  const theme = themeId ? noticingThemes[themeId] : undefined;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Open ${story.title}`} accessibilityHint="Double tap to open. Press and hold for story actions." onPress={onPress} onLongPress={onDelete} delayLongPress={500} style={({ pressed }) => [styles.storyCard, { backgroundColor: theme?.card ?? '#1D392B' }, pressed && styles.pressed]}>
      {cover ? <Image source={cover} contentFit="cover" style={styles.cardImage} /> : null}
      <View style={[styles.cardShade, { backgroundColor: theme?.card ?? '#1D392B' }]} />
      <View style={styles.cardTop}><Text style={styles.cardDate}>{formatDate(story.createdAt)}</Text><Text style={styles.cardCount}>{story.momentIds.length} {momentLabel}</Text></View>
      <View style={styles.cardCopy}><Text numberOfLines={1} style={styles.cardTitle}>{story.title}</Text><Text numberOfLines={1} style={styles.cardLocation}>{story.location}</Text>{theme ? <View style={[styles.focusBadge, { backgroundColor: theme.accent }]}><Text style={styles.focusBadgeText}>{story.noticingFocus || theme.label}</Text></View> : null}</View>
      <View style={[styles.cardFooter, { borderColor: theme ? theme.cardText + '70' : 'rgba(255,255,255,0.42)' }]}><Text style={[styles.cardAction, theme && { color: theme.cardText }]}>Revisit story</Text><Text style={[styles.cardArrow, theme && { color: theme.cardText }]}>→</Text></View>
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
  storyList: { gap: 12, marginTop: 34 },
  seededList: { gap: 12, marginTop: 28 },
  sectionLabel: { color: palette.secondary, fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 1 },
  storyCard: { height: 252, justifyContent: 'space-between', padding: 18, borderRadius: 23, overflow: 'hidden', backgroundColor: '#1D392B' },
  cardImage: { ...StyleSheet.absoluteFill },
  cardShade: { ...StyleSheet.absoluteFill, opacity: 0.68 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardDate: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  cardCount: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  cardCopy: { marginTop: 'auto', paddingTop: 26 },
  cardTitle: { color: '#FFFFFF', fontSize: 24, lineHeight: 29, fontWeight: '800', letterSpacing: -0.5 },
  cardLocation: { color: '#E4EEE7', fontSize: 13, fontWeight: '700', marginTop: 5 },
  focusBadge: { alignSelf: 'flex-start', maxWidth: '100%', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginTop: 13 },
  focusBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 11, marginTop: 12, borderTopWidth: 1 },
  cardAction: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  cardArrow: { color: '#FFFFFF', fontSize: 21, fontWeight: '600' },
  pressed: { opacity: 0.8 },
});
