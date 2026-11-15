import { router, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/trailmark-theme';
import { deleteSavedTrailStory, getSavedTrailStories, type SavedTrailStory } from '@/lib/trail-stories';
import { grandPrismaticMoments } from '@/lib/trail-moments';

const palette = colors.light;

const seededWalks = [
  { title: 'Fairy Falls', location: 'Yellowstone National Park', image: require('../../../assets/trails/catalog/fairy-falls.jpg'), date: 'Oct 18, 2026', count: '2 moments', note: 'The trail opened up beside the river, then disappeared into the trees.' },
  { title: 'Storm Point', location: 'Yellowstone National Park', image: require('../../../assets/trails/catalog/storm-point.jpg'), date: 'Sep 29, 2026', count: '4 moments', note: 'Wind, water, and a long view across the lake.' },
  { title: 'Jenny Lake Loop', location: 'Grand Teton National Park', image: require('../../../assets/trails/catalog/jenny-lake-loop.jpg'), date: 'Sep 4, 2026', count: '3 moments', note: 'A quiet stretch of shoreline before the mountains came into view.' },
] as const;

export default function ArchiveScreen() {
  const [stories, setStories] = useState<SavedTrailStory[]>([]);

  useFocusEffect(useCallback(() => {
    setStories(getSavedTrailStories());
  }, []));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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
    </SafeAreaView>
  );
}

function confirmDelete(story: SavedTrailStory, setStories: (stories: SavedTrailStory[]) => void) {
  Alert.alert('Delete this story?', 'This walk and its reflections will be removed from your Archive.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => { deleteSavedTrailStory(story.id); setStories(getSavedTrailStories()); } },
  ]);
}

function SeededArchiveCard({ title, location, image, date, count, note }: (typeof seededWalks)[number]) {
  return (
    <View accessibilityLabel={`${title}, saved walk`} style={styles.storyCard}>
      <Image source={image} contentFit="cover" style={styles.cardImage} />
      <View style={styles.cardShade} />
      <View style={styles.cardTop}><Text style={styles.cardDate}>{date}</Text><Text style={styles.cardCount}>{count}</Text></View>
      <View style={styles.cardCopy}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.cardLocation}>{location}</Text><Text numberOfLines={2} style={styles.cardExcerpt}>“{note}”</Text></View>
      <View style={styles.cardFooter}><Text style={styles.cardAction}>Saved walk</Text></View>
    </View>
  );
}

function ArchiveCard({ story, onPress, onDelete }: { story: SavedTrailStory; onPress: () => void; onDelete: () => void }) {
  const firstNote = story.notes.find((note) => note.trim()) || 'A walk told through the moments you chose to keep.';
  const momentLabel = story.momentIds.length === 1 ? 'moment' : 'moments';
  const cover = grandPrismaticMoments.find((moment) => story.momentIds.includes(moment.id) && moment.image)?.image ?? grandPrismaticMoments[3]?.image;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Open ${story.title}`} accessibilityHint="Double tap to open. Press and hold for story actions." onPress={onPress} onLongPress={onDelete} delayLongPress={500} style={({ pressed }) => [styles.storyCard, pressed && styles.pressed]}>
      {cover ? <Image source={cover} contentFit="cover" style={styles.cardImage} /> : null}
      <View style={styles.cardShade} />
      <View style={styles.cardTop}><Text style={styles.cardDate}>{formatDate(story.createdAt)}</Text><Text style={styles.cardCount}>{story.momentIds.length} {momentLabel}</Text></View>
      <View style={styles.cardCopy}><Text style={styles.cardTitle}>{story.title}</Text><Text style={styles.cardLocation}>{story.location}</Text><Text numberOfLines={2} style={styles.cardExcerpt}>“{firstNote}”</Text></View>
      <View style={styles.cardFooter}><Text style={styles.cardAction}>Revisit story</Text><Text style={styles.cardArrow}>→</Text></View>
    </Pressable>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  scroll: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 22, paddingBottom: 112 },
  title: { color: palette.text, fontSize: 34, lineHeight: 39, fontWeight: '800', letterSpacing: -0.9 },
  description: { color: palette.secondary, fontSize: 16, lineHeight: 23, marginTop: 7, maxWidth: 310 },
  storyList: { gap: 12, marginTop: 34 },
  seededList: { gap: 12, marginTop: 28 },
  sectionLabel: { color: palette.secondary, fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 1 },
  storyCard: { minHeight: 300, justifyContent: 'space-between', padding: 19, borderRadius: 23, overflow: 'hidden', backgroundColor: '#1D392B' },
  cardImage: { ...StyleSheet.absoluteFill },
  cardShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(10,27,18,0.48)' },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardDate: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  cardCount: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  cardCopy: { marginTop: 'auto', paddingTop: 44 },
  cardTitle: { color: '#FFFFFF', fontSize: 25, lineHeight: 30, fontWeight: '800', letterSpacing: -0.5 },
  cardLocation: { color: '#E4EEE7', fontSize: 13, fontWeight: '700', marginTop: 5 },
  cardExcerpt: { color: '#FFFFFF', fontSize: 15, lineHeight: 22, marginTop: 16 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 13, marginTop: 18, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.42)' },
  cardAction: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  cardArrow: { color: '#A6D6B3', fontSize: 21, fontWeight: '600' },
  pressed: { opacity: 0.8 },
});
