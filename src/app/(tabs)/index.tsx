import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Animated, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/trailmark-theme';
import { getSavedTrails, removeSavedTrail, saveTrail } from '@/lib/saved-trails';
import { noticingFocuses } from '@/lib/noticing-focuses';

const palette = colors.light;
const topFadeOpacity = Array.from({ length: 56 }, (_, index) => Math.pow(1 - index / 55, 1.7));
const overlookImage = require('../../../assets/trails/grand-prismatic/overlook.jpg');
const midwayImage = require('../../../assets/trails/catalog/midway-geyser-basin.jpg');
const fairyFallsImage = require('../../../assets/trails/catalog/fairy-falls.jpg');
const mysticFallsImage = require('../../../assets/trails/catalog/mystic-falls.jpg');
const stormPointImage = require('../../../assets/trails/catalog/storm-point.jpg');
const loneStarImage = require('../../../assets/trails/catalog/lone-star-geyser.jpg');
const avalanchePeakImage = require('../../../assets/trails/catalog/avalanche-peak.jpg');
const jennyLakeImage = require('../../../assets/trails/catalog/jenny-lake-loop.jpg');
const taggartLakeImage = require('../../../assets/trails/catalog/taggart-lake.jpg');
const phelpsLakeImage = require('../../../assets/trails/catalog/phelps-lake.jpg');
const grandMapImage = require('../../../assets/trails/maps/grand-prismatic.png');
const midwayMapImage = require('../../../assets/trails/maps/midway-basin.png');
const fairyFallsMapImage = require('../../../assets/trails/maps/fairy-falls.png');
const mysticFallsMapImage = require('../../../assets/trails/maps/mystic-falls.png');
const stormPointMapImage = require('../../../assets/trails/maps/storm-point.png');
const loneStarMapImage = require('../../../assets/trails/maps/lone-star.png');
const avalanchePeakMapImage = require('../../../assets/trails/maps/avalanche-peak.png');
const jennyLakeMapImage = require('../../../assets/trails/maps/jenny-lake.png');
const taggartLakeMapImage = require('../../../assets/trails/maps/taggart-lake.png');
const phelpsLakeMapImage = require('../../../assets/trails/maps/phelps-lake.png');

const categoryOptions = [
  { id: 'forest', icon: 'leaf', androidIcon: 'park', label: 'Forest trails' },
  { id: 'mountain', icon: 'mountain.2', androidIcon: 'terrain', label: 'Mountain trails' },
  { id: 'city', icon: 'building.2', androidIcon: 'location_city', label: 'City hikes' },
  { id: 'coastal', icon: 'water.waves', androidIcon: 'water', label: 'Coastal paths' },
  { id: 'waterfalls', icon: 'drop', androidIcon: 'water_drop', label: 'Waterfalls' },
  { id: 'overlooks', icon: 'binoculars.fill', androidIcon: 'visibility', label: 'Overlooks' },
  { id: 'quiet', icon: 'figure.walk', androidIcon: 'directions_walk', label: 'Quiet walks' },
  { id: 'parks', icon: 'globe.americas.fill', androidIcon: 'public', label: 'National parks' },
] as const;

type CatalogTrail = {
  mapId: string;
  mapImage: number;
  image: number;
  title: string;
  location: string;
  detail: string;
  rating: string;
  categories: string[];
  echo?: string;
  available?: boolean;
};

const yellowstoneTrails: CatalogTrail[] = [
  { available: true, mapId: 'grand-prismatic', mapImage: grandMapImage, image: overlookImage, title: 'Grand Prismatic Overlook', location: 'Yellowstone National Park', detail: 'Easy  ·  1.2 mi', rating: '4.8', categories: ['forest', 'overlooks', 'quiet', 'parks'], echo: '“The trail opened up after the trees.”' },
  { mapId: 'midway-basin', mapImage: midwayMapImage, image: midwayImage, title: 'Midway Geyser Basin', location: 'Yellowstone National Park', detail: 'Easy  ·  0.8 mi', rating: '4.7', categories: ['quiet', 'parks'], echo: '“The steam made the boardwalk feel smaller.”' },
  { mapId: 'fairy-falls', mapImage: fairyFallsMapImage, image: fairyFallsImage, title: 'Fairy Falls', location: 'Yellowstone National Park', detail: 'Moderate  ·  5.4 mi', rating: '4.9', categories: ['forest', 'waterfalls', 'parks'], echo: '“I heard the water before I saw it.”' },
  { mapId: 'mystic-falls', mapImage: mysticFallsMapImage, image: mysticFallsImage, title: 'Mystic Falls', location: 'Yellowstone National Park', detail: 'Moderate  ·  3.2 mi', rating: '4.8', categories: ['forest', 'waterfalls'], echo: '“The quiet between the trees stayed with me.”' },
];

const popularTrails: CatalogTrail[] = [
  { mapId: 'storm-point', mapImage: stormPointMapImage, image: stormPointImage, title: 'Storm Point', location: 'Yellowstone National Park', detail: 'Easy  ·  2.3 mi', rating: '4.6', categories: ['coastal', 'quiet', 'parks'] },
  { mapId: 'lone-star', mapImage: loneStarMapImage, image: loneStarImage, title: 'Lone Star Geyser', location: 'Yellowstone National Park', detail: 'Easy  ·  5.0 mi', rating: '4.7', categories: ['forest', 'quiet', 'parks'] },
  { mapId: 'avalanche-peak', mapImage: avalanchePeakMapImage, image: avalanchePeakImage, title: 'Avalanche Peak', location: 'Yellowstone National Park', detail: 'Hard  ·  4.5 mi', rating: '4.9', categories: ['mountain', 'overlooks', 'parks'] },
  { mapId: 'jenny-lake', mapImage: jennyLakeMapImage, image: jennyLakeImage, title: 'Jenny Lake Loop', location: 'Grand Teton National Park', detail: 'Moderate  ·  7.1 mi', rating: '4.9', categories: ['forest', 'coastal', 'mountain', 'parks'] },
  { mapId: 'taggart-lake', mapImage: taggartLakeMapImage, image: taggartLakeImage, title: 'Taggart Lake Trail', location: 'Grand Teton National Park', detail: 'Easy  ·  3.0 mi', rating: '4.8', categories: ['forest', 'mountain', 'overlooks', 'parks'] },
  { mapId: 'phelps-lake', mapImage: phelpsLakeMapImage, image: phelpsLakeImage, title: 'Phelps Lake Trail', location: 'Grand Teton National Park', detail: 'Moderate  ·  3.7 mi', rating: '4.8', categories: ['forest', 'coastal', 'overlooks', 'parks'] },
];

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeYellowstoneIndex, setActiveYellowstoneIndex] = useState(0);
  const [savedTrailIds, setSavedTrailIds] = useState<string[]>([]);
  const [echoTransition] = useState(() => new Animated.Value(1));
  const openSampleTrail = () => Alert.alert('Preview trail', 'Grand Prismatic Overlook is the complete trail available in this prototype.');
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filtering = Boolean(normalizedSearch || selectedCategory);
  const allTrails = [...yellowstoneTrails, ...popularTrails];
  const visibleTrails = (filtering ? allTrails : popularTrails).filter((trail) => {
    const matchesCategory = !selectedCategory || trail.categories.includes(selectedCategory);
    const searchableText = `${trail.title} ${trail.location} ${trail.detail} ${trail.categories.join(' ')}`.toLowerCase();
    return matchesCategory && (!normalizedSearch || searchableText.includes(normalizedSearch));
  });
  const visibleTrailCount = visibleTrails.length;
  const openTrail = (trail: CatalogTrail) => trail.available ? router.push({ pathname: '/trail-preview', params: { slug: 'grand-prismatic-overlook' } }) : openSampleTrail();
  const activeYellowstoneTrail = yellowstoneTrails[activeYellowstoneIndex] ?? yellowstoneTrails[0];

  useFocusEffect(useCallback(() => {
    setSavedTrailIds(getSavedTrails().map((trail) => trail.id));
  }, []));

  useEffect(() => {
    echoTransition.setValue(0);
    Animated.timing(echoTransition, { toValue: 1, duration: 240, useNativeDriver: true }).start();
  }, [activeYellowstoneIndex, echoTransition]);

  const toggleSavedTrail = (trail: CatalogTrail) => {
    if (savedTrailIds.includes(trail.mapId)) {
      removeSavedTrail(trail.mapId);
      setSavedTrailIds((current) => current.filter((id) => id !== trail.mapId));
      return;
    }
    saveTrail({ id: trail.mapId, imageKey: trail.mapId, title: trail.title, location: trail.location, detail: trail.detail, rating: trail.rating, available: Boolean(trail.available) });
    setSavedTrailIds((current) => [trail.mapId, ...current]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <StatusBar style="dark" />
      <ScrollView automaticallyAdjustContentInsets={false} contentInsetAdjustmentBehavior="never" contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}><Text accessibilityRole="header" style={styles.title}>Explore trails</Text><Pressable accessibilityRole="button" accessibilityLabel={`Open saved trails${savedTrailIds.length ? `, ${savedTrailIds.length} saved` : ''}`} onPress={() => router.push('/saved-trails')} style={({ pressed }) => [styles.savedButton, pressed && styles.pressed]}><TrailSymbol name={savedTrailIds.length ? 'heart.fill' : 'heart'} androidName={savedTrailIds.length ? 'favorite' : 'favorite_border'} size={17} color={savedTrailIds.length ? '#B65751' : palette.accent} />{savedTrailIds.length ? <Text style={styles.savedButtonCount}>{savedTrailIds.length}</Text> : null}</Pressable></View>
        <View style={styles.location}><TrailSymbol name="location.fill" androidName="location_on" size={14} color={palette.accent} /><Text style={styles.locationText}>Yellowstone National Park</Text><TrailSymbol name="chevron.down" androidName="expand_more" size={15} color={palette.secondary} /></View>
        <View style={styles.search}><TrailSymbol name="magnifyingglass" androidName="search" size={17} color="#72827E" /><TextInput accessibilityLabel="Search trails, parks, and places" value={searchQuery} onChangeText={setSearchQuery} autoCapitalize="none" autoCorrect={false} returnKeyType="search" placeholder="Search trails, parks, places" placeholderTextColor="#7A8986" style={styles.searchInput} />{searchQuery ? <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setSearchQuery('')} style={styles.clearSearch}><TrailSymbol name="xmark" androidName="close" size={13} color={palette.secondary} /></Pressable> : null}</View>

        <Pressable accessibilityRole="button" accessibilityLabel="Open Around You map to discover trails and echoes" onPress={() => router.push('/around-you')} style={({ pressed }) => [styles.aroundYouCard, pressed && styles.pressed]}>
          <View style={styles.aroundYouIcon}><TrailSymbol name="map.fill" androidName="map" size={17} color={palette.accent} /></View>
          <View style={styles.aroundYouCopy}><Text style={styles.aroundYouTitle}>Around you</Text><Text style={styles.aroundYouText}>Nearby trails and Echos</Text></View>
          <TrailSymbol name="arrow.up.right" androidName="north_east" size={17} color={palette.accent} />
        </Pressable>

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Categories</Text><Text style={styles.sectionMeta}>Browse by feeling</Text></View>
        <View style={styles.categoryRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRail}>
            {categoryOptions.map((category) => <Category key={category.id} {...category} selected={selectedCategory === category.id} onPress={() => setSelectedCategory((current) => current === category.id ? null : category.id)} />)}
          </ScrollView>
          <View pointerEvents="none" style={styles.categoryFadeStrong} />
          <View pointerEvents="none" style={styles.categoryFadeMedium} />
          <View pointerEvents="none" style={styles.categoryFadeSoft} />
        </View>

        {!filtering ? <><View style={styles.sectionHeader}><Text style={styles.sectionTitle}>In Yellowstone</Text><Text style={styles.sectionMeta}>{yellowstoneTrails.length} trails</Text></View><ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trailScroller} contentContainerStyle={styles.trailRail} snapToInterval={306} decelerationRate="fast" disableIntervalMomentum onMomentumScrollEnd={(event) => setActiveYellowstoneIndex(Math.max(0, Math.min(yellowstoneTrails.length - 1, Math.round(event.nativeEvent.contentOffset.x / 306))))}>{yellowstoneTrails.map((trail) => <ExploreCard key={trail.mapId} {...trail} saved={savedTrailIds.includes(trail.mapId)} onSave={() => toggleSavedTrail(trail)} onPress={() => openTrail(trail)} />)}</ScrollView></> : null}

        {!filtering ? <TrailEchoPreview trail={activeYellowstoneTrail} transition={echoTransition} onPress={() => openTrail(activeYellowstoneTrail)} /> : null}

        {!filtering ? <><View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Start with a noticing lens</Text><Text style={styles.sectionMeta}>Choose a focus</Text></View><ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.lensScroller} contentContainerStyle={styles.lensRail}>{noticingFocuses.map((lens) => <Pressable key={lens.id} accessibilityRole="button" accessibilityLabel={`${lens.title}: ${lens.prompt}`} onPress={() => router.push({ pathname: '/noticing-focus', params: { focusId: lens.id } })} style={({ pressed }) => [styles.lensCard, pressed && styles.pressed]}><Image source={lens.image} contentFit="cover" style={styles.lensImage} /><LinearGradient pointerEvents="none" colors={['rgba(9,27,22,0.02)', 'rgba(9,27,22,0.78)']} locations={[0.24, 1]} style={styles.lensShade} /><View style={styles.lensCopy}><Text style={styles.lensTitle}>{lens.title}</Text><Text numberOfLines={2} style={styles.lensPrompt}>{lens.prompt}</Text></View></Pressable>)}</ScrollView></> : null}

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{normalizedSearch ? 'Search results' : selectedCategory ? categoryOptions.find((category) => category.id === selectedCategory)?.label : 'Popular with trailgoers'}</Text><Text style={styles.sectionMeta}>{visibleTrailCount} {visibleTrailCount === 1 ? 'trail' : 'trails'}</Text></View>
        {visibleTrailCount ? <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trailScroller} contentContainerStyle={styles.trailRail} snapToInterval={filtering ? 306 : 262} decelerationRate="fast" disableIntervalMomentum>
          {visibleTrails.map((trail) => <ExploreCard compact={!filtering} key={trail.mapId} {...trail} saved={savedTrailIds.includes(trail.mapId)} onSave={() => toggleSavedTrail(trail)} onPress={() => openTrail(trail)} />)}
        </ScrollView> : <View style={styles.emptySearch}><View style={styles.emptySearchIcon}><TrailSymbol name="magnifyingglass" androidName="search" size={24} color={palette.accent} /></View><Text style={styles.emptySearchTitle}>{normalizedSearch ? `No trails match “${searchQuery.trim()}”` : 'No trails in this category'}</Text><Text style={styles.emptySearchText}>Try another trail, park, place, or category.</Text><Pressable accessibilityRole="button" onPress={() => { setSearchQuery(''); setSelectedCategory(null); }} style={styles.resetButton}><Text style={styles.resetButtonText}>Clear search and filters</Text></Pressable></View>}

      </ScrollView>
      <TopFade safeTop={insets.top} />
    </SafeAreaView>
  );
}

function Category({ icon, androidIcon, label, selected, onPress }: { icon: string; androidIcon: string; label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.category, pressed && styles.pressed]}><View style={[styles.categoryIcon, selected && styles.categoryIconSelected]}><TrailSymbol name={icon} androidName={androidIcon} size={23} color={selected ? '#FFFFFF' : palette.accent} /></View><Text numberOfLines={2} style={[styles.categoryLabel, selected && styles.categoryLabelSelected]}>{label}</Text></Pressable>;
}

function TrailEchoPreview({ trail, transition, onPress }: { trail: CatalogTrail; transition: Animated.Value; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`Explore trail echoes from ${trail.title}`} onPress={onPress} style={({ pressed }) => [styles.echoPreview, pressed && styles.pressed]}>
    <View style={styles.echoPreviewIcon}><TrailSymbol name="bubble.left.and.bubble.right.fill" androidName="forum" size={17} color={palette.accent} /></View>
    <Animated.View style={[styles.echoPreviewCopy, { opacity: transition, transform: [{ translateY: transition.interpolate({ inputRange: [0, 1], outputRange: [5, 0] }) }] }]}>
      <Text numberOfLines={1} style={styles.echoPreviewEyebrow}>Trail echoes · {trail.title.replace(' Overlook', '')}</Text>
      <Text numberOfLines={1} style={styles.echoPreviewText}>{trail.echo}</Text>
    </Animated.View>
    <TrailSymbol name="chevron.right" androidName="chevron_right" size={16} color={palette.secondary} />
  </Pressable>;
}

function ExploreCard({ mapImage, image, title, location, detail, rating, available = false, compact = false, saved, onSave, onPress }: { mapId: string; mapImage: number; image: number; title: string; location: string; detail: string; rating: string; available?: boolean; compact?: boolean; saved: boolean; onSave: () => void; onPress: () => void }) {
  return <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.card, compact && styles.cardCompact, pressed && styles.pressed]}><Image source={image} contentFit="cover" style={StyleSheet.absoluteFill} /><View style={styles.cardShade} /><Pressable accessibilityRole="button" accessibilityLabel={saved ? `Remove ${title} from saved trails` : `Save ${title} for later`} hitSlop={6} onPress={(event) => { event.stopPropagation(); onSave(); }} style={({ pressed }) => [styles.saveButton, compact && styles.cardControlCompact, saved && styles.saveButtonSaved, pressed && styles.pressed]}><TrailSymbol name={saved ? 'heart.fill' : 'heart'} androidName={saved ? 'favorite' : 'favorite_border'} size={compact ? 15 : 17} color={saved ? '#B65751' : palette.text} /></Pressable><View pointerEvents="none" style={[styles.openButton, !available && styles.previewButton, compact && styles.cardControlCompact]}><TrailSymbol name={available ? 'arrow.up.right' : 'ellipsis'} androidName={available ? 'north_east' : 'more_horiz'} size={compact ? 15 : 17} color={available ? '#FFFFFF' : palette.text} /></View><View pointerEvents="none" style={[styles.infoPanel, compact && styles.infoPanelCompact]}><View style={styles.infoCopy}><Text numberOfLines={2} style={[styles.cardTitle, compact && styles.cardTitleCompact]}>{title}</Text><Text numberOfLines={1} style={styles.cardLocation}>{location}</Text><View style={styles.cardMetaRow}><TrailSymbol name="star.fill" androidName="star" size={12} color="#C99432" /><Text style={styles.rating}>{rating}</Text><View style={styles.metaDivider} /><Text numberOfLines={1} style={styles.cardDetail}>{detail}</Text></View></View><MapPreview compact={compact} image={mapImage} /></View></Pressable>;
}

function MapPreview({ image, compact = false }: { image: number; compact?: boolean }) {
  return <View pointerEvents="none" style={[styles.miniMap, compact && styles.miniMapCompact]}><Image source={image} contentFit="cover" transition={0} style={styles.mapThumbnail} /><View style={styles.mapLabel}><Text style={styles.mapLabelText}>Route</Text></View></View>;
}

function TopFade({ safeTop }: { safeTop: number }) {
  return <View pointerEvents="none" style={[styles.topFade, { height: safeTop + 30 }]}>{topFadeOpacity.map((opacity, index) => <View key={index} style={[styles.topFadeStrip, { opacity }]} />)}</View>;
}

function TrailSymbol({ name, androidName, size, color }: { name: string; androidName: string; size: number; color: string }) {
  return <SymbolView name={{ ios: name as never, android: androidName as never, web: androidName as never }} size={size} weight="medium" tintColor={color} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background }, scroll: { paddingHorizontal: 18, paddingTop: 80, paddingBottom: 128 }, topFade: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }, topFadeStrip: { flex: 1, backgroundColor: palette.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, title: { color: palette.text, fontSize: 34, lineHeight: 39, fontWeight: '800', letterSpacing: -0.9 }, savedButton: { minWidth: 42, height: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 11, borderRadius: 21, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCE7E6' }, savedButtonCount: { color: palette.text, fontSize: 12, fontWeight: '800' }, location: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 20 }, locationText: { color: palette.accent, fontSize: 12, fontWeight: '800' }, search: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 46, paddingHorizontal: 13, marginTop: 13, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCE7E6' }, searchInput: { flex: 1, color: palette.text, fontSize: 13 }, clearSearch: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8EFED' },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 28, marginBottom: 12 }, sectionTitle: { color: palette.text, fontSize: 19, fontWeight: '800', letterSpacing: -0.3 }, sectionMeta: { color: palette.secondary, fontSize: 11, fontWeight: '600' }, categoryRow: { position: 'relative', height: 97 }, categoryRail: { gap: 11, paddingRight: 28 }, categoryFadeStrong: { position: 'absolute', top: 0, right: 0, bottom: 0, width: 8, backgroundColor: palette.background, opacity: 0.9 }, categoryFadeMedium: { position: 'absolute', top: 0, right: 8, bottom: 0, width: 8, backgroundColor: palette.background, opacity: 0.62 }, categoryFadeSoft: { position: 'absolute', top: 0, right: 16, bottom: 0, width: 10, backgroundColor: palette.background, opacity: 0.32 }, category: { width: 76, height: 97, alignItems: 'center', gap: 7 }, categoryIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E9E8' }, categoryIconSelected: { backgroundColor: palette.accent, borderColor: palette.accent }, categoryLabel: { width: 76, height: 26, color: palette.secondary, fontSize: 10, lineHeight: 13, textAlign: 'center' }, categoryLabelSelected: { color: palette.accent, fontWeight: '800' },
  aroundYouCard: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 16, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 17, backgroundColor: '#F0F5F0', borderWidth: 1, borderColor: '#D9E6DA' }, aroundYouIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DCEDE0' }, aroundYouCopy: { flex: 1, gap: 2 }, aroundYouTitle: { color: palette.text, fontSize: 14, lineHeight: 17, fontWeight: '800' }, aroundYouText: { color: palette.secondary, fontSize: 11, lineHeight: 14 },
  echoPreview: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 25, paddingHorizontal: 13, paddingVertical: 12, borderRadius: 17, backgroundColor: '#F0F5F0', borderWidth: 1, borderColor: '#D9E6DA' }, echoPreviewIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#DCEDE0' }, echoPreviewCopy: { flex: 1, gap: 3 }, echoPreviewEyebrow: { color: palette.accent, fontSize: 10, fontWeight: '800', letterSpacing: 0.35 }, echoPreviewText: { color: palette.text, fontSize: 13, lineHeight: 17, fontWeight: '600' },
  lensScroller: { marginHorizontal: -18 }, lensRail: { gap: 11, paddingHorizontal: 18 }, lensCard: { width: 186, height: 192, overflow: 'hidden', borderRadius: 20, backgroundColor: '#315849' }, lensImage: { ...StyleSheet.absoluteFill }, lensShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(12,35,25,0.24)' }, lensCopy: { position: 'absolute', left: 13, right: 13, bottom: 13, gap: 4 }, lensTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: -0.25 }, lensPrompt: { color: 'rgba(255,255,255,0.9)', fontSize: 10, lineHeight: 14, fontWeight: '600' }, trailScroller: { marginHorizontal: -18 }, trailRail: { gap: 12, paddingHorizontal: 18 }, emptySearch: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 28, paddingBottom: 18 }, emptySearchIcon: { alignItems: 'center', justifyContent: 'center', marginBottom: 12 }, emptySearchTitle: { color: palette.text, fontSize: 17, fontWeight: '800', textAlign: 'center' }, emptySearchText: { color: palette.secondary, fontSize: 12, marginTop: 6, textAlign: 'center' }, resetButton: { marginTop: 14, paddingHorizontal: 4, paddingVertical: 6 }, resetButtonText: { color: palette.accent, fontSize: 12, fontWeight: '800' }, card: { width: 294, height: 344, overflow: 'hidden', borderRadius: 23, backgroundColor: '#274C42', shadowColor: '#31514A', shadowOpacity: 0.16, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 3 }, cardCompact: { width: 250, height: 284, borderRadius: 21 }, cardShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(12,28,22,0.10)' }, saveButton: { position: 'absolute', left: 12, top: 12, width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.94)', zIndex: 2 }, saveButtonSaved: { backgroundColor: '#F9EEEE' }, openButton: { position: 'absolute', right: 12, top: 12, width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111817' }, cardControlCompact: { width: 34, height: 34, borderRadius: 17 }, previewButton: { backgroundColor: 'rgba(255,255,255,0.94)' }, infoPanel: { position: 'absolute', left: 10, right: 10, bottom: 10, height: 108, flexDirection: 'row', alignItems: 'stretch', overflow: 'hidden', borderRadius: 18, backgroundColor: '#FFFFFF' }, infoPanelCompact: { height: 94, borderRadius: 16 }, infoCopy: { flex: 1, justifyContent: 'center', gap: 4, paddingHorizontal: 13, paddingVertical: 11 }, cardTitle: { color: palette.text, fontSize: 17, lineHeight: 20, fontWeight: '800', letterSpacing: -0.25 }, cardTitleCompact: { fontSize: 15, lineHeight: 18 }, cardLocation: { color: palette.secondary, fontSize: 10, fontWeight: '600' }, cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }, rating: { color: palette.secondary, fontSize: 10, fontWeight: '700' }, metaDivider: { width: 3, height: 3, borderRadius: 2, marginHorizontal: 2, backgroundColor: '#A5B3AE' }, cardDetail: { flexShrink: 1, color: palette.secondary, fontSize: 10, fontWeight: '600' }, miniMap: { position: 'relative', width: 96, overflow: 'hidden', backgroundColor: '#DEE8E3', borderLeftWidth: 1, borderLeftColor: '#E3EAE6' }, miniMapCompact: { width: 78 }, mapThumbnail: { ...StyleSheet.absoluteFill }, mapLabel: { position: 'absolute', left: 8, bottom: 8, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.92)' }, mapLabelText: { color: palette.text, fontSize: 8, fontWeight: '800' }, pressed: { opacity: 0.8 },
});
