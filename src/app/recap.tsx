import Mapbox from '@rnmapbox/maps';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Feature, LineString, Position } from 'geojson';
import { grandPrismaticMoments, type PreparedTrailMoment } from '@/lib/trail-moments';
import { clearActiveHikeDraft, getSavedTrailStory, saveTrailStory, type CapturedTrailMoment } from '@/lib/trail-stories';
import { getPublishedTrail } from '@/lib/trails';

const center: Position = [-110.836, 44.520];
const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
if (token) Mapbox.setAccessToken(token);
type Moment = { note: string; moment?: PreparedTrailMoment; captured?: CapturedTrailMoment };
type Route = Feature<LineString>;

export default function RecapScreen() {
  const params = useLocalSearchParams<{ markedCount?: string; notes?: string; momentIds?: string; marks?: string; routeCoordinates?: string; storyId?: string }>();
  const saved = useMemo(() => params.storyId ? getSavedTrailStory(params.storyId) : undefined, [params.storyId]);
  const notes = useMemo(() => saved?.notes ?? parse<string>(params.notes), [saved, params.notes]);
  const ids = useMemo(() => saved?.momentIds ?? parse<string>(params.momentIds), [saved, params.momentIds]);
  const marks = useMemo(() => saved?.marks ?? parse<CapturedTrailMoment>(params.marks), [saved, params.marks]);
  const coordinates = useMemo(() => saved?.routeCoordinates ?? parse<number[]>(params.routeCoordinates), [saved, params.routeCoordinates]);
  const total = saved?.momentIds.length ?? Math.max(0, Number(params.markedCount) || 0);
  const moments = useMemo<Moment[]>(() => Array.from({ length: total }, (_, index) => ({ note: notes[index] ?? '', captured: marks[index], moment: grandPrismaticMoments.find((moment) => moment.id === ids[index]) })), [ids, marks, notes, total]);
  const [route, setRoute] = useState<Route | null>(() => shape(coordinates));
  const [composer, setComposer] = useState(false);
  const [title, setTitle] = useState(saved?.title ?? 'Grand Prismatic Overlook');
  const [reducedMotion, setReducedMotion] = useState(true);
  useEffect(() => {
    let active = true;
    if (!coordinates.length) void getPublishedTrail('grand-prismatic-overlook').then((trail) => { if (active) setRoute(trail?.route_geojson ?? null); });
    return () => { active = false; };
  }, [coordinates]);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => subscription.remove();
  }, []);
  const save = () => {
    if (!saved) {
      saveTrailStory({ title: title.trim() || 'Grand Prismatic Overlook', location: 'Yellowstone National Park', momentIds: ids, notes, marks, routeCoordinates: route?.geometry.coordinates ?? coordinates });
      clearActiveHikeDraft();
    }
    router.dismissAll();
    router.replace('/(tabs)/archive');
  };
  return <SafeAreaView edges={['top']} style={s.screen}>
    <View style={s.header}><Text style={s.headerTitle}>Your trail story</Text><Button label={saved ? 'Done' : 'Save'} onPress={save} quiet /></View>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.page}>
      <View style={s.portrait}>
        <StoryMap route={route} moments={moments} active={-1} terrain={false} reducedMotion={reducedMotion} hero />
        <View style={s.portraitCaption}><Text style={s.portraitSmall}>Yellowstone National Park</Text><Text accessibilityRole="header" style={s.portraitTitle}>{saved?.title ?? 'Grand Prismatic\nOverlook'}</Text><Text style={s.portraitMeta}>{total} {total === 1 ? 'moment' : 'moments'} you kept</Text></View>
        <Pressable accessibilityRole="button" onPress={() => setComposer(true)} style={({ pressed }) => [s.heroStoryButton, pressed && s.pressed]}><Text style={s.heroStoryButtonText}>Play your story →</Text></Pressable>
      </View>
      <View style={s.momentIntro}><Text style={s.sectionTitle}>Your moments</Text><Text style={s.secondary}>The places and words you chose to keep.</Text></View>
      {moments.map((item, index) => <View key={`${item.captured?.id ?? index}`} style={s.chapter}>
        <View style={s.chapterHeading}><View style={s.number}><Text style={s.numberText}>{index + 1}</Text></View><Text style={s.chapterTitle}>{item.moment?.title ?? 'A place you marked'}</Text></View>
        {item.moment?.image ? <Image source={item.moment.image} contentFit="cover" style={s.chapterImage} /> : null}
        {item.note.trim() ? <Text style={s.chapterQuote}>{item.note}</Text> : null}
        <Text style={s.context}>{item.moment?.context ?? 'A moment saved along your walk.'}</Text>
      </View>)}
    </ScrollView>
    <SafeAreaView edges={['bottom']} style={s.dock}><Button label={saved ? 'Back to Archive' : 'Save story'} onPress={save} /></SafeAreaView>
    <Modal visible={composer} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setComposer(false)}>
      <Composer route={route} moments={moments} title={title} onTitle={setTitle} onClose={() => setComposer(false)} reducedMotion={reducedMotion} />
    </Modal>
  </SafeAreaView>;
}

function Composer({ route, moments, title, onTitle, onClose, reducedMotion }: { route: Route | null; moments: Moment[]; title: string; onTitle: (title: string) => void; onClose: () => void; reducedMotion: boolean }) {
  const [active, setActive] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [terrain, setTerrain] = useState(true);
  const [showNotes, setShowNotes] = useState(true);
  const [speed, setSpeed] = useState(3600);
  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => {
      if (active >= moments.length - 1) { setActive(-1); setPlaying(false); }
      else setActive(active + 1);
    }, active === -1 ? 1800 : speed);
    return () => clearTimeout(timer);
  }, [active, moments.length, playing, speed]);
  const current = moments[active];
  return <SafeAreaView style={s.screen}>
    <View style={s.header}><Button label="Close" quiet onPress={onClose} /><Text style={s.headerTitle}>Make it yours</Text><Button label={playing ? 'Pause' : 'Replay'} quiet onPress={() => { if (!playing) setActive(-1); setPlaying(!playing); }} /></View>
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.composerContent}>
      <View style={s.film}>
        <StoryMap route={route} moments={moments} active={active} terrain={terrain} reducedMotion={reducedMotion} />
        <View pointerEvents="none" style={s.filmTop}><Text style={s.filmBrand}>TrailMark</Text><Text style={s.filmMeta}>{active < 0 ? 'Your walk, remembered' : `Moment ${active + 1} of ${moments.length}`}</Text></View>
        <View pointerEvents="none" style={s.filmCaption}>
          {current?.moment?.image ? <Image source={current.moment.image} contentFit="cover" style={s.filmPhoto} /> : null}
          <Text style={s.filmTitle}>{current ? current.moment?.title ?? 'A marked moment' : title}</Text>
          <Text style={s.filmDescription}>{current ? showNotes && current.note.trim() ? `“${current.note}”` : 'A moment you chose to keep.' : `${moments.length} moments · Yellowstone National Park`}</Text>
        </View>
      </View>
      <View style={s.playback}><Text style={s.secondary}>Vertical story · {Math.round((1800 + moments.length * speed) / 1000)} sec</Text><Button quiet label={playing ? 'Pause' : 'Play story'} onPress={() => setPlaying(!playing)} /></View>
      <Text style={s.fieldLabel}>Story title</Text><TextInput accessibilityLabel="Story title" value={title} onChangeText={onTitle} maxLength={80} style={s.titleInput} placeholder="Name your walk" />
      <View style={s.options}><Button quiet label={terrain ? '✓ Terrain' : 'Terrain'} onPress={() => setTerrain(true)} /><Button quiet label={!terrain ? '✓ Classic' : 'Classic'} onPress={() => setTerrain(false)} /><Button quiet label={speed === 3600 ? 'Pace · Gentle' : 'Pace · Quick'} onPress={() => setSpeed(speed === 3600 ? 2400 : 3600)} /></View>
      <View style={s.playback}><Text style={s.fieldLabel}>Include my words</Text><Switch accessibilityLabel="Include my reflection notes" value={showNotes} onValueChange={setShowNotes} trackColor={{ true: '#226C4A' }} /></View>
      <Text style={s.exportNote}>Animated preview · Video export is being built.</Text>
    </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

function StoryMap({ route, moments, active, terrain, reducedMotion, hero = false }: { route: Route | null; moments: Moment[]; active: number; terrain: boolean; reducedMotion: boolean; hero?: boolean }) {
  const camera = useRef<Mapbox.Camera>(null);
  const heroTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasPlayedHeroZoom = useRef(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!loaded || !route) return;
    const coordinate = moments[active]?.captured?.coordinate;
    const duration = reducedMotion ? 0 : 1200;
    if (coordinate) camera.current?.setCamera({ centerCoordinate: coordinate, zoomLevel: 15.1, pitch: terrain ? 48 : 0, heading: terrain ? 18 + active * 7 : 0, padding: { paddingTop: 30, paddingBottom: 150, paddingLeft: 20, paddingRight: 20 }, animationDuration: duration, animationMode: 'easeTo' });
    else {
      const points = route.geometry.coordinates;
      const northEast: Position = [Math.max(...points.map((point) => point[0])), Math.max(...points.map((point) => point[1]))];
      const southWest: Position = [Math.min(...points.map((point) => point[0])), Math.min(...points.map((point) => point[1]))];
      if (hero && !hasPlayedHeroZoom.current && !reducedMotion) {
        hasPlayedHeroZoom.current = true;
        camera.current?.fitBounds(northEast, southWest, [66, 66, 206, 66], 0);
        heroTimer.current = setTimeout(() => {
          camera.current?.fitBounds(northEast, southWest, [38, 38, 178, 38], 1350);
          heroTimer.current = null;
        }, 260);
      } else {
        camera.current?.fitBounds(northEast, southWest, [45, 45, 180, 45], duration);
      }
    }
    return () => { if (heroTimer.current) clearTimeout(heroTimer.current); };
  }, [active, hero, loaded, moments, reducedMotion, route, terrain]);
  return <Mapbox.MapView style={s.flex} styleURL={terrain ? Mapbox.StyleURL.Outdoors : Mapbox.StyleURL.Light} onWillStartLoadingMap={() => setLoaded(false)} onDidFinishLoadingStyle={() => setLoaded(true)} scrollEnabled={false} zoomEnabled={false} rotateEnabled={false} pitchEnabled={false} logoEnabled={false} attributionEnabled={false} compassEnabled={false} scaleBarEnabled={false}>
    <Mapbox.Camera ref={camera} defaultSettings={{ centerCoordinate: center, zoomLevel: 13.5 }} />
    {loaded && terrain ? <Mapbox.RasterDemSource id="recap-dem" url="mapbox://mapbox.mapbox-terrain-dem-v1"><Mapbox.Terrain style={{ exaggeration: 1 }} /></Mapbox.RasterDemSource> : null}
    {loaded && route ? <Mapbox.ShapeSource id="recap-route" shape={route}><Mapbox.LineLayer id="recap-route-line" style={{ lineColor: '#226C4A', lineWidth: 4, lineCap: 'round', lineJoin: 'round' }} /></Mapbox.ShapeSource> : null}
    {loaded && route ? moments.map((item, index) => <Mapbox.MarkerView key={index} coordinate={item.captured?.coordinate ?? route.geometry.coordinates[Math.round((route.geometry.coordinates.length - 1) * (item.moment?.routeFraction ?? index / Math.max(1, moments.length - 1)))]} allowOverlap><View style={[s.mapPin, index === active && s.activePin]}><Text style={s.pinText}>{index + 1}</Text></View></Mapbox.MarkerView>) : null}
  </Mapbox.MapView>;
}

function Button({ label, onPress, quiet = false }: { label: string; onPress: () => void; quiet?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [quiet ? s.quietButton : s.primaryButton, pressed && s.pressed]}><Text style={quiet ? s.quietText : s.primaryText}>{label}</Text></Pressable>;
}
function parse<T>(value?: string): T[] { try { const data = JSON.parse(value ?? '[]'); return Array.isArray(data) ? data : []; } catch { return []; } }
function shape(coordinates: number[][]): Route | null { return coordinates.length > 1 ? { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } } : null; }

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F7F3' }, flex: { flex: 1 },
  header: { minHeight: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, headerTitle: { color: '#18271E', fontSize: 17, fontWeight: '700' },
  page: { paddingHorizontal: 18, paddingBottom: 16, alignSelf: 'center', width: '100%', maxWidth: 680 },
  portrait: { height: 460, borderRadius: 26, overflow: 'hidden', backgroundColor: '#DEE8DB' },
  portraitCaption: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 22, backgroundColor: '#E9EFE5' },
  portraitSmall: { fontSize: 13, color: '#45594A', marginBottom: 8 }, portraitTitle: { fontSize: 33, lineHeight: 36, letterSpacing: -1, color: '#18271E', fontWeight: '800' }, portraitMeta: { fontSize: 16, color: '#226C4A', marginTop: 10, fontWeight: '600' },
  heroStoryButton: { position: 'absolute', right: 18, bottom: 18, minHeight: 46, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, borderRadius: 14, backgroundColor: '#226C4A' }, heroStoryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  secondary: { fontSize: 14, lineHeight: 20, color: '#4D6053' }, momentIntro: { paddingTop: 28, paddingBottom: 24 }, sectionTitle: { fontSize: 22, fontWeight: '700', color: '#18271E', letterSpacing: -0.35, marginBottom: 6 },
  chapter: { marginBottom: 32 }, chapterHeading: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }, number: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#DFEBDD', alignItems: 'center', justifyContent: 'center' }, numberText: { color: '#226C4A', fontSize: 13, fontWeight: '700' }, chapterTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#18271E' }, chapterImage: { width: '100%', aspectRatio: 1.28, borderRadius: 20 }, chapterQuote: { fontSize: 22, lineHeight: 30, color: '#18271E', marginTop: 16, fontWeight: '500' }, context: { fontSize: 15, lineHeight: 23, color: '#4D6053', marginTop: 10 },
  dock: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 10, borderTopWidth: 1, borderTopColor: '#DCE4D9', backgroundColor: '#F5F7F3' }, primaryButton: { minHeight: 54, borderRadius: 18, backgroundColor: '#226C4A', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 }, primaryText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' }, quietButton: { minHeight: 44, paddingHorizontal: 10, justifyContent: 'center' }, quietText: { fontSize: 15, fontWeight: '600', color: '#226C4A' }, pressed: { opacity: 0.65 },
  composerContent: { padding: 18, maxWidth: 600, width: '100%', alignSelf: 'center', paddingBottom: 30 }, film: { height: 470, overflow: 'hidden', borderRadius: 24, backgroundColor: '#DFEBDD' }, filmTop: { position: 'absolute', top: 0, left: 0, right: 0, padding: 18, backgroundColor: '#E9EFE5' }, filmBrand: { fontSize: 17, fontWeight: '800', color: '#18271E' }, filmMeta: { fontSize: 12, color: '#4D6053', marginTop: 4 }, filmCaption: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 18, backgroundColor: '#E9EFE5' }, filmPhoto: { width: 86, height: 64, borderRadius: 10, marginBottom: 10 }, filmTitle: { fontSize: 23, lineHeight: 28, fontWeight: '800', color: '#18271E' }, filmDescription: { fontSize: 14, lineHeight: 20, color: '#4D6053', marginTop: 6 }, playback: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 }, fieldLabel: { fontSize: 15, fontWeight: '600', color: '#18271E' }, titleInput: { minHeight: 50, marginTop: 10, padding: 13, borderWidth: 1, borderColor: '#C6D3C5', borderRadius: 13, color: '#18271E', fontSize: 17, backgroundColor: '#FFFFFF' }, options: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }, exportNote: { fontSize: 13, lineHeight: 20, textAlign: 'center', color: '#4D6053', marginTop: 10 }, mapPin: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#FFFFFF', backgroundColor: '#226C4A', alignItems: 'center', justifyContent: 'center' }, activePin: { width: 36, height: 36, borderRadius: 18, borderWidth: 3 }, pinText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
});
