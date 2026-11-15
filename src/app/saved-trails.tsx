import { router, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/trailmark-theme';
import { getSavedTrails, removeSavedTrail, type SavedTrail } from '@/lib/saved-trails';

const palette = colors.light;
const savedTrailImages: Record<string, number> = {
  'grand-prismatic': require('../../assets/trails/grand-prismatic/overlook.jpg'),
  'fairy-falls': require('../../assets/trails/catalog/fairy-falls.jpg'),
  'avalanche-peak': require('../../assets/trails/catalog/avalanche-peak.jpg'),
  'jenny-lake': require('../../assets/trails/catalog/jenny-lake-loop.jpg'),
  'phelps-lake': require('../../assets/trails/catalog/phelps-lake.jpg'),
  'midway-basin': require('../../assets/trails/catalog/midway-geyser-basin.jpg'),
  'mystic-falls': require('../../assets/trails/catalog/mystic-falls.jpg'),
  'storm-point': require('../../assets/trails/catalog/storm-point.jpg'),
  'lone-star': require('../../assets/trails/catalog/lone-star-geyser.jpg'),
  'taggart-lake': require('../../assets/trails/catalog/taggart-lake.jpg'),
};

export default function SavedTrailsScreen() {
  const insets = useSafeAreaInsets();
  const [trails, setTrails] = useState<SavedTrail[]>([]);

  useFocusEffect(useCallback(() => {
    setTrails(getSavedTrails());
  }, []));

  const openTrail = (trail: SavedTrail) => {
    if (trail.available) {
      router.push({ pathname: '/trail-preview', params: { slug: 'grand-prismatic-overlook' } });
      return;
    }
    Alert.alert('Preview trail', 'Grand Prismatic Overlook is the complete trail available in this prototype.');
  };

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 18 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back to Explore" onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={19} tintColor={palette.text} />
          </Pressable>
          <Text accessibilityRole="header" style={styles.title}>Saved for later</Text>
        </View>

        {trails.length ? <View style={styles.list}>{trails.map((trail) => <SavedTrailCard key={trail.id} trail={trail} onOpen={() => openTrail(trail)} onRemove={() => setTrails((current) => { removeSavedTrail(trail.id); return current.filter((saved) => saved.id !== trail.id); })} />)}</View> : <EmptySavedTrails />}
      </ScrollView>
    </SafeAreaView>
  );
}

function EmptySavedTrails() {
  return <View style={styles.empty}>
    <View style={styles.emptyIcon}><SymbolView name={{ ios: 'heart', android: 'favorite_border', web: 'favorite_border' }} size={25} tintColor={palette.accent} /></View>
    <Text style={styles.emptyTitle}>Nothing saved yet</Text>
    <Text style={styles.emptyText}>Use the heart on any trail in Explore to keep it for another day.</Text>
    <Pressable accessibilityRole="button" onPress={() => router.back()} style={({ pressed }) => [styles.exploreButton, pressed && styles.pressed]}><Text style={styles.exploreButtonText}>Explore trails</Text></Pressable>
  </View>;
}

function SavedTrailCard({ trail, onOpen, onRemove }: { trail: SavedTrail; onOpen: () => void; onRemove: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`Open ${trail.title}`} onPress={onOpen} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
    {trail.imageKey && savedTrailImages[trail.imageKey] ? <Image source={savedTrailImages[trail.imageKey]} contentFit="cover" style={styles.cardImage} /> : <View style={styles.cardIcon}><SymbolView name={{ ios: 'map.fill', android: 'map', web: 'map' }} size={19} tintColor={palette.accent} /></View>}
    <View style={styles.cardCopy}><Text style={styles.cardTitle}>{trail.title}</Text><Text style={styles.cardLocation}>{trail.location}</Text><Text style={styles.cardDetail}>{trail.detail}  ·  ★ {trail.rating}</Text></View>
    <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${trail.title} from saved trails`} hitSlop={8} onPress={(event) => { event.stopPropagation(); onRemove(); }} style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}><SymbolView name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }} size={17} tintColor="#B65751" /></Pressable>
  </Pressable>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background }, scroll: { flexGrow: 1, paddingHorizontal: 18, paddingBottom: 42 }, header: { flexDirection: 'row', alignItems: 'center', gap: 14 }, backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCE7E1' }, title: { color: palette.text, fontSize: 21, fontWeight: '800', letterSpacing: -0.35 }, list: { gap: 11, marginTop: 24 }, card: { minHeight: 110, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 19, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCE7E1' }, cardImage: { width: 82, alignSelf: 'stretch', borderRadius: 13, backgroundColor: '#E5F0E7' }, cardIcon: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: '#E5F0E7' }, cardCopy: { flex: 1, gap: 3 }, cardTitle: { color: palette.text, fontSize: 15, lineHeight: 19, fontWeight: '800' }, cardLocation: { color: palette.secondary, fontSize: 11, fontWeight: '600' }, cardDetail: { color: '#597166', fontSize: 11, fontWeight: '700', marginTop: 2 }, removeButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: '#F9EEEE' }, empty: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 105 }, emptyIcon: { width: 62, height: 62, alignItems: 'center', justifyContent: 'center', borderRadius: 31, backgroundColor: '#E5F0E7' }, emptyTitle: { color: palette.text, fontSize: 19, fontWeight: '800', marginTop: 17 }, emptyText: { color: palette.secondary, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7 }, exploreButton: { marginTop: 20, paddingHorizontal: 17, paddingVertical: 12, borderRadius: 14, backgroundColor: palette.accent }, exploreButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' }, pressed: { opacity: 0.76 },
});
