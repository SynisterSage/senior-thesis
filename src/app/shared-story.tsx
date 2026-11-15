import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/trailmark-theme';

const palette = colors.light;
const storyImage = require('../../assets/trails/grand-prismatic/spring.jpg');

export default function SharedStoryScreen() {
  const { trailName = 'Grand Prismatic Overlook', storyId = 'quiet-water' } = useLocalSearchParams<{ trailName?: string; storyId?: string }>();
  const story = storyId === 'wide-view'
    ? { title: 'The trail opened up', note: 'I did not expect the overlook to feel so open after the trees.', meta: '3 moments · Shared by Maya' }
    : storyId === 'first-visit'
      ? { title: 'First time through', note: 'Mostly birds, wind, and the sound of my own steps.', meta: '5 moments · Shared anonymously' }
      : { title: 'A quiet morning at the lake', note: 'The light changed when I reached the water.', meta: '4 moments · Shared anonymously' };

  const shareStory = () => void Share.share({ title: story.title, message: `${story.title}\n${story.note}\n${trailName}\nMade with TrailMark.` });

  return <View style={styles.screen}>
    <StatusBar style="light" />
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.cover}>
        <Image source={storyImage} contentFit="cover" style={styles.coverImage} />
        <View style={styles.coverShade} />
        <SafeAreaView edges={['top']} style={styles.coverTop}><Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.closeButton}><Text style={styles.closeText}>‹</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Share story" onPress={shareStory} style={styles.closeButton}><Text style={styles.shareText}>↗</Text></Pressable></SafeAreaView>
        <View style={styles.coverCopy}><Text style={styles.eyebrow}>A shared trail story</Text><Text style={styles.title}>{story.title}</Text><Text style={styles.meta}>{trailName} · {story.meta}</Text></View>
      </View>
      <View style={styles.body}><Text style={styles.note}>“{story.note}”</Text><View style={styles.route}><View style={styles.routeLine} /><View style={[styles.routePoint, { left: '18%' }]} /><View style={[styles.routePoint, { left: '49%' }]} /><View style={[styles.routePoint, { left: '79%' }]} /></View><Text style={styles.routeLabel}>A few places chosen to remember</Text><Text style={styles.prompt}>This story was shared from TrailMark. You can make one after your own walk.</Text><Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backAction}><Text style={styles.backActionText}>Back to trail stories</Text></Pressable></View>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background }, scroll: { padding: 18, paddingBottom: 38 }, cover: { height: 500, overflow: 'hidden', borderRadius: 28, backgroundColor: '#1C392B', justifyContent: 'flex-end' }, coverImage: { ...StyleSheet.absoluteFill }, coverShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(7,24,15,0.34)' }, coverTop: { position: 'absolute', left: 0, right: 0, top: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 }, closeButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.78)' }, closeText: { color: palette.text, fontSize: 30, lineHeight: 30, fontWeight: '300', marginTop: -4 }, shareText: { color: palette.text, fontSize: 21, fontWeight: '700' }, coverCopy: { padding: 23, paddingBottom: 26, gap: 8 }, eyebrow: { color: '#D3E4D8', fontSize: 12, fontWeight: '800', letterSpacing: 0.7, textTransform: 'uppercase' }, title: { color: '#FFFFFF', fontSize: 36, lineHeight: 40, fontWeight: '800', letterSpacing: -1 }, meta: { color: '#E6F0E8', fontSize: 13, lineHeight: 18 }, body: { paddingHorizontal: 4, paddingTop: 27 }, note: { color: palette.text, fontSize: 23, lineHeight: 31, fontWeight: '700' }, route: { position: 'relative', height: 42, marginTop: 28 }, routeLine: { position: 'absolute', left: '10%', right: '10%', top: 19, height: 4, borderRadius: 2, backgroundColor: palette.accent }, routePoint: { position: 'absolute', top: 11, width: 17, height: 17, borderRadius: 9, backgroundColor: palette.accent, borderWidth: 3, borderColor: palette.background }, routeLabel: { color: palette.secondary, fontSize: 12, marginTop: 1 }, prompt: { color: palette.secondary, fontSize: 14, lineHeight: 21, marginTop: 30 }, backAction: { alignItems: 'center', justifyContent: 'center', minHeight: 52, marginTop: 24, borderRadius: 17, backgroundColor: palette.accent }, backActionText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
