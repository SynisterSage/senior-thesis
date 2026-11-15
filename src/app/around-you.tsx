import Mapbox from '@rnmapbox/maps';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/trailmark-theme';

const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
if (token) Mapbox.setAccessToken(token);
const palette = colors.light;
type Coordinate = [number, number];
const center: Coordinate = [-110.8381, 44.525];
const echoes = [
  { id: 'open-sky', coordinate: [-110.839, 44.523] as Coordinate, title: 'The trees opened up', place: 'Overlook approach', note: 'I did not expect the trail to feel so open after the trees.', image: require('../../assets/trails/grand-prismatic/overlook.jpg') },
  { id: 'steam', coordinate: [-110.833, 44.519] as Coordinate, title: 'A quieter kind of morning', place: 'By the spring', note: 'The steam softened everything around me for a minute.', image: require('../../assets/trails/grand-prismatic/spring.jpg') },
  { id: 'water', coordinate: [-110.842, 44.517] as Coordinate, title: 'Heard it before I saw it', place: 'Fairy Falls trail', note: 'The water reached me through the trees before the falls came into view.', image: require('../../assets/trails/catalog/fairy-falls.jpg') },
];
const echoSets: Record<string, typeof echoes> = {
  'grand-prismatic': echoes,
  midway: [
    { id: 'midway-steam', coordinate: center, title: 'The steam kept moving', place: 'Midway Geyser Basin', note: 'The steam kept moving across the boardwalk, so the whole place felt alive.', image: require('../../assets/trails/catalog/midway-geyser-basin.jpg') },
    { id: 'midway-color', coordinate: center, title: 'Color under the surface', place: 'By the basin', note: 'The brightest color was always just below where I was looking.', image: require('../../assets/trails/grand-prismatic/spring.jpg') },
    { id: 'midway-boardwalk', coordinate: center, title: 'A slower pace', place: 'Boardwalk bend', note: 'The boardwalk made me slow down and notice the little changes in the water.', image: require('../../assets/trails/catalog/midway-geyser-basin.jpg') },
  ],
  'fairy-falls': [
    { id: 'fairy-water', coordinate: center, title: 'Heard it before I saw it', place: 'Fairy Falls trail', note: 'The water reached me through the trees before the falls came into view.', image: require('../../assets/trails/catalog/fairy-falls.jpg') },
    { id: 'fairy-trees', coordinate: center, title: 'The forest got darker', place: 'Fairy Falls trailhead', note: 'The trail dipped into the trees and everything around me got quieter.', image: require('../../assets/trails/grand-prismatic/firehole-bridge.jpg') },
    { id: 'fairy-open', coordinate: center, title: 'A sudden opening', place: 'Falls approach', note: 'The view arrived all at once after the last turn in the trail.', image: require('../../assets/trails/grand-prismatic/fairy-falls.jpg') },
  ],
  'mystic-falls': [
    { id: 'mystic-river', coordinate: center, title: 'The river pulled me in', place: 'River overlook', note: 'I stopped longer than I planned because the river kept changing shape.', image: require('../../assets/trails/catalog/mystic-falls.jpg') },
    { id: 'mystic-quiet', coordinate: center, title: 'Quiet between the water', place: 'Forest bend', note: 'There was a small quiet space between the sound of the water and the wind.', image: require('../../assets/trails/grand-prismatic/mystic-falls.jpg') },
    { id: 'mystic-light', coordinate: center, title: 'Light through the trees', place: 'Falls approach', note: 'The light broke through the trees in small moving pieces.', image: require('../../assets/trails/grand-prismatic/mystic-falls.jpg') },
  ],
  excelsior: [
    { id: 'excelsior-steam', coordinate: center, title: 'The steam rolled over the edge', place: 'Excelsior Geyser', note: 'The steam rolled over the edge of the crater and disappeared into the river.', image: require('../../assets/trails/grand-prismatic/excelsior.jpg') },
    { id: 'excelsior-river', coordinate: center, title: 'Heat beside cold water', place: 'Firehole River', note: 'The warm basin and cold river sat right next to each other.', image: require('../../assets/trails/grand-prismatic/firehole-bridge.jpg') },
    { id: 'excelsior-view', coordinate: center, title: 'A wide view of the basin', place: 'Basin overlook', note: 'From higher up, the whole basin felt connected by the boardwalk and river.', image: require('../../assets/trails/grand-prismatic/twin-buttes-view.jpg') },
  ],
  'goose-lake': [
    { id: 'goose-stillness', coordinate: center, title: 'The lake held the sky', place: 'Goose Lake shore', note: 'The water was still enough to keep the pale sky in one piece.', image: require('../../assets/trails/grand-prismatic/goose-lake-context.jpg') },
    { id: 'goose-grass', coordinate: center, title: 'Grass at the edge', place: 'Lakeside meadow', note: 'The meadow was louder than the lake once I stopped walking.', image: require('../../assets/trails/grand-prismatic/goose-lake-context.jpg') },
    { id: 'goose-distance', coordinate: center, title: 'A long way from the road', place: 'Lake approach', note: 'The distance from the road made the place feel held apart from everything else.', image: require('../../assets/trails/grand-prismatic/goose-lake-context.jpg') },
  ],
  'porcupine-hills': [
    { id: 'porcupine-ridge', coordinate: center, title: 'The basin looked smaller', place: 'Porcupine Hills ridge', note: 'From the ridge, the thermal basin looked smaller and the horizon took over.', image: require('../../assets/trails/grand-prismatic/twin-buttes-view.jpg') },
    { id: 'porcupine-wind', coordinate: center, title: 'Wind on the hillside', place: 'Open hillside', note: 'The wind moved through the grass before it reached me.', image: require('../../assets/trails/grand-prismatic/twin-buttes-view.jpg') },
    { id: 'porcupine-pines', coordinate: center, title: 'Pines below the rise', place: 'Forest edge', note: 'The pines gathered below the rise and made the hill feel even higher.', image: require('../../assets/trails/grand-prismatic/twin-buttes-view.jpg') },
  ],
  'morning-glory-pool': [
    { id: 'morning-glory-blue', coordinate: center, title: 'Blue at the center', place: 'Morning Glory Pool', note: 'The center looked impossibly blue against the quieter colors around it.', image: require('../../assets/trails/grand-prismatic/morning-glory-pool.jpg') },
    { id: 'morning-glory-boardwalk', coordinate: center, title: 'The boardwalk slowed everyone', place: 'Upper Geyser Basin', note: 'Everyone moved more slowly here, even when the rest of the basin was busy.', image: require('../../assets/trails/grand-prismatic/morning-glory-pool.jpg') },
    { id: 'morning-glory-steam', coordinate: center, title: 'Steam in the distance', place: 'Basin trail', note: 'Steam kept appearing between the trees as I followed the boardwalk.', image: require('../../assets/trails/grand-prismatic/morning-glory-pool.jpg') },
  ],
  'geyser-hill': [
    { id: 'geyser-hill-breathing', coordinate: center, title: 'The ground kept breathing', place: 'Geyser Hill', note: 'Steam rose in small bursts from places I almost missed at first.', image: require('../../assets/trails/grand-prismatic/geyser-hill.jpg') },
    { id: 'geyser-hill-sound', coordinate: center, title: 'A sound from the ground', place: 'Upper Geyser Basin', note: 'The sound of the water was quieter than the feeling that it was everywhere.', image: require('../../assets/trails/grand-prismatic/geyser-hill.jpg') },
    { id: 'geyser-hill-path', coordinate: center, title: 'The path kept turning', place: 'Boardwalk loop', note: 'Each turn made a different spring feel like the main event.', image: require('../../assets/trails/grand-prismatic/geyser-hill.jpg') },
  ],
  'imperial-meadows': [
    { id: 'imperial-meadow-light', coordinate: center, title: 'Light over the meadow', place: 'Imperial Meadows', note: 'The light moved quickly across the meadow while the trees stayed dark.', image: require('../../assets/trails/grand-prismatic/overlook.jpg') },
    { id: 'imperial-meadow-water', coordinate: center, title: 'Water under the grass', place: 'Meadow crossing', note: 'The ground felt soft near the water and made me watch every step.', image: require('../../assets/trails/grand-prismatic/fairy-falls.jpg') },
    { id: 'imperial-meadow-quiet', coordinate: center, title: 'Further from the crowd', place: 'Trail beyond the basin', note: 'A few minutes past the busier trail, the whole meadow went quiet.', image: require('../../assets/trails/grand-prismatic/overlook.jpg') },
  ],
};
const echoOffsets: Record<string, Array<[number, number]>> = {
  'grand-prismatic': [[-0.006, -0.005], [0.0, 0.008], [0.006, -0.005]],
  midway: [[-0.005, -0.004], [0.004, 0.006], [0.007, -0.002]],
  'fairy-falls': [[-0.006, 0.002], [0.002, 0.007], [0.007, -0.004]],
  'mystic-falls': [[-0.005, -0.003], [0.004, 0.006], [0.007, -0.002]],
  excelsior: [[-0.006, -0.004], [0.002, 0.007], [0.007, -0.003]],
  'goose-lake': [[-0.006, -0.004], [0.003, 0.007], [0.007, -0.002]],
  'porcupine-hills': [[-0.007, -0.003], [0.001, 0.007], [0.007, -0.004]],
  'morning-glory-pool': [[-0.005, -0.004], [0.004, 0.006], [0.007, -0.003]],
  'geyser-hill': [[-0.006, -0.004], [0.002, 0.007], [0.007, -0.003]],
  'imperial-meadows': [[-0.007, -0.003], [0.002, 0.007], [0.007, -0.004]],
};
const nearbyPlaces = [
  { id: 'midway', coordinate: [-110.836253, 44.528424] as Coordinate, title: 'Midway Geyser Basin', detail: '0.8 mi · Easy', image: require('../../assets/trails/catalog/midway-geyser-basin.jpg'), slug: 'grand-prismatic-overlook' },
  { id: 'fairy-falls', coordinate: [-110.855668, 44.52584] as Coordinate, title: 'Fairy Falls', detail: '5.4 mi · Moderate', image: require('../../assets/trails/catalog/fairy-falls.jpg'), slug: 'grand-prismatic-overlook' },
  { id: 'mystic-falls', coordinate: [-110.87389, 44.48417] as Coordinate, title: 'Mystic Falls', detail: '3.2 mi · Moderate', image: require('../../assets/trails/catalog/mystic-falls.jpg'), slug: 'grand-prismatic-overlook' },
  { id: 'excelsior', coordinate: [-110.8369, 44.52628] as Coordinate, title: 'Excelsior Geyser', detail: 'Nearby · Boardwalk', image: require('../../assets/trails/grand-prismatic/excelsior.jpg'), slug: 'grand-prismatic-overlook' },
  { id: 'goose-lake', coordinate: [-110.84237, 44.54135] as Coordinate, title: 'Goose Lake', detail: 'Lower Geyser Basin', image: require('../../assets/trails/grand-prismatic/goose-lake-context.jpg'), slug: 'grand-prismatic-overlook' },
  { id: 'porcupine-hills', coordinate: [-110.8069, 44.5694] as Coordinate, title: 'Porcupine Hills', detail: 'Nearby ridgeline', image: require('../../assets/trails/grand-prismatic/twin-buttes-view.jpg'), slug: 'grand-prismatic-overlook' },
  { id: 'morning-glory-pool', coordinate: [-110.84351, 44.47503] as Coordinate, title: 'Morning Glory Pool', detail: 'Upper Geyser Basin', image: require('../../assets/trails/grand-prismatic/morning-glory-pool.jpg'), slug: 'grand-prismatic-overlook' },
  { id: 'geyser-hill', coordinate: [-110.8295, 44.4638] as Coordinate, title: 'Geyser Hill', detail: 'Upper Geyser Basin', image: require('../../assets/trails/grand-prismatic/geyser-hill.jpg'), slug: 'grand-prismatic-overlook' },
  { id: 'imperial-meadows', coordinate: [-110.8493, 44.5506] as Coordinate, title: 'Imperial Meadows', detail: 'Hiking trail', image: require('../../assets/trails/grand-prismatic/overlook.jpg'), slug: 'grand-prismatic-overlook' },
];
const allPlaces = [{ id: 'grand-prismatic', coordinate: center, title: 'Grand Prismatic', detail: '1.2 mi · Easy', image: require('../../assets/trails/grand-prismatic/overlook.jpg'), slug: 'grand-prismatic-overlook' }, ...nearbyPlaces];

export default function AroundYouScreen() {
  const cameraRef = useRef<Mapbox.Camera>(null);
  const [selected, setSelected] = useState<typeof echoes[number] | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<typeof allPlaces[number] | null>(null);
  const activeEchoes = selectedPlace ? echoSets[selectedPlace.id] ?? echoes : echoes;
  const activeEchoOffsets = selectedPlace ? echoOffsets[selectedPlace.id] ?? echoOffsets['grand-prismatic'] : echoOffsets['grand-prismatic'];
  const [showHint, setShowHint] = useState(true);
  const [hintOpacity] = useState(() => new Animated.Value(1));
  const [hintOffset] = useState(() => new Animated.Value(0));
  const placeScales = useRef(allPlaces.map(() => new Animated.Value(0.86))).current;
  const placeOpacities = useRef(allPlaces.map(() => new Animated.Value(0))).current;
  const echoScales = useRef(echoes.map(() => new Animated.Value(0))).current;

  const dismissHint = () => {
    if (!showHint) return;
    Animated.parallel([
      Animated.timing(hintOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(hintOffset, { toValue: 12, duration: 220, useNativeDriver: true }),
    ]).start(() => setShowHint(false));
  };

  const selectPlace = (place: typeof allPlaces[number]) => {
    dismissHint();
    setSelectedPlace(place);
    setSelected(null);
    cameraRef.current?.setCamera({ centerCoordinate: place.coordinate, zoomLevel: 13.7, pitch: 38, heading: 16, animationDuration: 850, animationMode: 'flyTo' });
    echoScales.forEach((scale) => scale.setValue(0));
    Animated.stagger(90, echoScales.map((scale) => Animated.spring(scale, { toValue: 1, damping: 13, stiffness: 180, mass: 0.7, useNativeDriver: true }))).start();
  };

  const showNearbyPlaces = () => {
    setSelected(null);
    setSelectedPlace(null);
    cameraRef.current?.setCamera({ centerCoordinate: center, zoomLevel: 10.9, pitch: 20, heading: 0, animationDuration: 850, animationMode: 'flyTo' });
  };

  useEffect(() => {
    const timeout = setTimeout(dismissHint, 4500);
    return () => clearTimeout(timeout);
  }, [hintOffset, hintOpacity]);

  useEffect(() => {
    Animated.stagger(90, allPlaces.flatMap((_, index) => [
      Animated.parallel([
        Animated.timing(placeOpacities[index], { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(placeScales[index], { toValue: 1, damping: 14, stiffness: 180, mass: 0.7, useNativeDriver: true }),
      ]),
    ])).start();
  }, [placeOpacities, placeScales]);

  return <View style={styles.screen}>
    <StatusBar style="dark" />
    {token && Platform.OS !== 'web' ? <Mapbox.MapView style={styles.map} styleURL={Mapbox.StyleURL.Outdoors} scrollEnabled zoomEnabled rotateEnabled pitchEnabled logoEnabled={false} attributionEnabled={false} compassEnabled={false} scaleBarEnabled={false}>
      <Mapbox.Camera ref={cameraRef} defaultSettings={{ centerCoordinate: center, zoomLevel: 10.9, pitch: 20, heading: 0 }} />
      <Mapbox.RasterDemSource id="around-terrain" url="mapbox://mapbox.mapbox-terrain-dem-v1" maxZoomLevel={14}><Mapbox.Terrain style={{ exaggeration: 1.1 }} /></Mapbox.RasterDemSource>
      {!selectedPlace ? allPlaces.map((place, index) => <Mapbox.MarkerView key={place.id} id={`place-${place.id}`} coordinate={place.coordinate} allowOverlap><Animated.View style={{ opacity: placeOpacities[index], transform: [{ scale: placeScales[index] }] }}><Pressable accessibilityRole="button" accessibilityLabel={`Show ${place.title} echoes`} onPress={() => selectPlace(place)} style={styles.placePill}><Image source={place.image} contentFit="cover" style={styles.placeImage} /><View style={styles.placeCopy}><Text numberOfLines={1} style={styles.placeTitle}>{place.title}</Text><Text style={styles.placeDetail}>{place.detail}</Text></View></Pressable></Animated.View></Mapbox.MarkerView>) : activeEchoes.map((echo, index) => <Mapbox.MarkerView key={echo.id} id={`echo-${echo.id}`} coordinate={[selectedPlace.coordinate[0] + activeEchoOffsets[index][0], selectedPlace.coordinate[1] + activeEchoOffsets[index][1]]} allowOverlap><Animated.View style={{ transform: [{ scale: echoScales[index] }] }}><Pressable accessibilityRole="button" accessibilityLabel={`Read Echo: ${echo.title}`} onPress={() => setSelected(echo)} style={[styles.marker, selected?.id === echo.id && styles.markerSelected]}><TrailSymbol name="sparkles" androidName="auto_awesome" size={15} color="#FFFFFF" /></Pressable></Animated.View></Mapbox.MarkerView>)}
    </Mapbox.MapView> : <View style={styles.mapFallback}><View style={styles.fallbackContour} /><View style={[styles.fallbackContour, styles.fallbackContourTwo]} /><View style={styles.fallbackRoute} />{!selectedPlace ? allPlaces.map((place, index) => <Animated.View key={place.id} style={[styles.fallbackPlace, index === 0 ? { top: '51%', left: '40%' } : index === 1 ? { top: '25%', left: '8%' } : index === 2 ? { top: '44%', left: '6%' } : { top: '51%', right: '4%' }, { opacity: placeOpacities[index], transform: [{ scale: placeScales[index] }] }]}><Pressable accessibilityRole="button" accessibilityLabel={`Show ${place.title} echoes`} onPress={() => selectPlace(place)} style={styles.placePill}><Image source={place.image} contentFit="cover" style={styles.placeImage} /><View style={styles.placeCopy}><Text numberOfLines={1} style={styles.placeTitle}>{place.title}</Text><Text style={styles.placeDetail}>{place.detail}</Text></View></Pressable></Animated.View>) : activeEchoes.map((echo, index) => <Animated.View key={echo.id} style={[styles.marker, styles.fallbackEcho, index === 0 ? { top: '42%', left: '30%' } : index === 1 ? { top: '51%', left: '53%' } : { top: '61%', left: '40%' }, { transform: [{ scale: echoScales[index] }] }]}><Pressable accessibilityRole="button" accessibilityLabel={`Read Echo: ${echo.title}`} onPress={() => setSelected(echo)}><TrailSymbol name="sparkles" androidName="auto_awesome" size={15} color="#FFFFFF" /></Pressable></Animated.View>)}</View>}
    <SafeAreaView style={styles.overlay} edges={['top','bottom']} pointerEvents="box-none">
      <View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel="Back to Explore" onPress={() => router.back()} style={styles.back}><TrailSymbol name="chevron.left" androidName="arrow_back" size={17} color={palette.text} /></Pressable><View style={styles.heading}><Text style={styles.eyebrow}>EXPLORE THE PLACE</Text><Text style={styles.title}>Around you</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Show nearby places" onPress={showNearbyPlaces} style={styles.recenter}><TrailSymbol name="location" androidName="my_location" size={17} color={palette.accent} /></Pressable></View>
      {selectedPlace && !selected ? <View style={styles.selectedPlace}><View style={styles.selectedPlaceDot} /><Text style={styles.selectedPlaceText}>Echos from {selectedPlace.title}</Text><Pressable accessibilityRole="button" accessibilityLabel="Show nearby trails again" onPress={showNearbyPlaces} style={styles.selectedPlaceClose}><TrailSymbol name="xmark" androidName="close" size={13} color={palette.text} /></Pressable></View> : null}
      {selected ? <View style={styles.sheet}><View style={styles.sheetMain}><Image source={selected.image} contentFit="cover" style={styles.image} /><View style={styles.sheetCopy}><View style={styles.sheetTop}><View style={styles.sheetText}><Text style={styles.sheetEyebrow}>ECHO · {selected.place.toUpperCase()}</Text><Text style={styles.sheetTitle}>{selected.title}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close Echo" onPress={() => setSelected(null)} style={styles.close}><TrailSymbol name="xmark" androidName="close" size={15} color={palette.text} /></Pressable></View><Text style={styles.note}>“{selected.note}”</Text><Text style={styles.source}>Shared anonymously</Text></View></View><Pressable accessibilityRole="button" onPress={() => { setSelected(null); router.push({ pathname: '/trail-preview', params: { slug: 'grand-prismatic-overlook' } }); }} style={styles.action}><Text style={styles.actionText}>Explore this trail</Text><TrailSymbol name="arrow.right" androidName="arrow_forward" size={16} color="#FFFFFF" /></Pressable></View> : showHint ? <Animated.View style={{ opacity: hintOpacity, transform: [{ translateY: hintOffset }] }}><View style={styles.hint}><Text style={styles.hintTitle}>Follow a little curiosity</Text><Text style={styles.hintText}>Pan around and tap an Echo to find a moment someone noticed here.</Text></View></Animated.View> : null}
    </SafeAreaView>
  </View>;
}

function TrailSymbol({ name, androidName, size, color }: { name: string; androidName: string; size: number; color: string }) { return <SymbolView name={{ ios: name as SFSymbol, android: androidName as never, web: androidName as never }} size={size} weight="medium" tintColor={color} />; }

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#DCE8DF' }, map: { ...StyleSheet.absoluteFill }, mapFallback: { ...StyleSheet.absoluteFill, backgroundColor: '#DCE8DF', overflow: 'hidden' }, fallbackContour: { position: 'absolute', width: 420, height: 210, top: '25%', left: '-15%', borderRadius: 200, borderWidth: 2, borderColor: 'rgba(108,145,119,0.22)', transform: [{ rotate: '-28deg' }] }, fallbackContourTwo: { top: '46%', left: '22%', width: 360, height: 220, transform: [{ rotate: '22deg' }] }, fallbackRoute: { position: 'absolute', width: 3, height: '44%', top: '26%', left: '52%', backgroundColor: '#277D54', borderRadius: 4, transform: [{ rotate: '32deg' }] }, overlay: { ...StyleSheet.absoluteFill, justifyContent: 'space-between', paddingHorizontal: 18, paddingBottom: 12 }, header: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.94)', borderWidth: 1, borderColor: '#E1E9E3' }, back: { width: 38, height: 38, borderRadius: 14, backgroundColor: '#EFF4EF', alignItems: 'center', justifyContent: 'center' }, heading: { flex: 1, gap: 2 }, eyebrow: { color: palette.accent, fontSize: 9, fontWeight: '800', letterSpacing: 1 }, title: { color: palette.text, fontSize: 20, fontWeight: '800' }, recenter: { width: 38, height: 38, borderRadius: 14, backgroundColor: '#EFF4EF', alignItems: 'center', justifyContent: 'center' }, selectedPlace: { position: 'absolute', alignSelf: 'center', bottom: 32, flexDirection: 'row', alignItems: 'center', gap: 7, paddingLeft: 11, paddingRight: 5, paddingVertical: 6, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.95)' }, selectedPlaceDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.accent }, selectedPlaceText: { color: palette.text, fontSize: 11, fontWeight: '800' }, selectedPlaceClose: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF4EF' }, location: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10, marginLeft: 4, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.93)' }, locationText: { color: palette.accent, fontSize: 11, fontWeight: '700' }, legend: { position: 'absolute', right: 0, top: 119, gap: 9, padding: 10, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.94)' }, legendItem: { flexDirection: 'row', alignItems: 'center', gap: 7 }, legendEcho: { width: 21, height: 21, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#277D54' }, legendTrail: { width: 20, height: 4, borderRadius: 2, backgroundColor: '#277D54' }, legendText: { color: palette.text, fontSize: 10, fontWeight: '700' }, marker: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#277D54', borderWidth: 3, borderColor: '#FFFFFF', shadowColor: '#193323', shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 }, markerSelected: { backgroundColor: '#C98239', transform: [{ scale: 1.12 }] }, fallbackMarker: { position: 'absolute' }, placePill: { flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: 190, padding: 6, paddingRight: 10, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E1E9E3' }, placeImage: { width: 32, height: 32, borderRadius: 13 }, placeCopy: { flexShrink: 1, gap: 1 }, placeTitle: { color: palette.text, fontSize: 10, fontWeight: '800' }, placeDetail: { color: palette.secondary, fontSize: 8, fontWeight: '600' }, fallbackPlace: { position: 'absolute' }, fallbackEcho: { position: 'absolute' }, trailPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 16, backgroundColor: '#FFFFFF' }, trailDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#277D54' }, trailPillText: { color: palette.text, fontSize: 11, fontWeight: '800' }, hint: { marginBottom: 5, padding: 17, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.96)', borderWidth: 1, borderColor: '#E1E9E3' }, hintTitle: { color: palette.text, fontSize: 15, fontWeight: '800' }, hintText: { color: palette.secondary, fontSize: 12, lineHeight: 17, marginTop: 5 }, sheet: { gap: 10, marginBottom: 5, padding: 11, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.97)', borderWidth: 1, borderColor: '#E1E9E3' }, sheetMain: { gap: 10 }, image: { width: '100%', height: 118, borderRadius: 15, backgroundColor: '#DCE8DF' }, sheetCopy: { gap: 1 }, sheetTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 }, sheetText: { flex: 1 }, sheetEyebrow: { color: palette.accent, fontSize: 8, fontWeight: '800', letterSpacing: 0.5 }, sheetTitle: { color: palette.text, fontSize: 15, lineHeight: 18, fontWeight: '800', marginTop: 4 }, close: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EFF4EF', alignItems: 'center', justifyContent: 'center' }, note: { color: palette.text, fontSize: 11, lineHeight: 15, marginTop: 7 }, source: { color: palette.secondary, fontSize: 9, marginTop: 5 }, action: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 0, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, backgroundColor: palette.accent }, actionText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' } });
