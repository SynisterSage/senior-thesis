import Mapbox from '@rnmapbox/maps';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { SFSymbol } from 'sf-symbols-typescript';
import type { Feature, FeatureCollection, LineString, Point, Position } from 'geojson';
import { grandPrismaticMoments, type PreparedTrailMoment } from '@/lib/trail-moments';
import { clearActiveHikeDraft, getSavedTrailStory, saveTrailStory, type CapturedTrailMoment } from '@/lib/trail-stories';
import { getPublishedTrail } from '@/lib/trails';

const center: Position = [-110.836, 44.520];
const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
if (token) Mapbox.setAccessToken(token);
type Moment = { note: string; moment?: PreparedTrailMoment; captured?: CapturedTrailMoment };
type MomentAddition = { image?: number; thought?: string };
type Route = Feature<LineString>;
type StoryMapStyle = 'terrain' | 'classic' | 'dark' | 'unicorn' | 'lichen' | 'night-trail' | 'sunset';
const storyMapStyles: Record<StoryMapStyle, string> = {
  terrain: Mapbox.StyleURL.Outdoors,
  classic: Mapbox.StyleURL.Light,
  dark: Mapbox.StyleURL.Dark,
  unicorn: 'mapbox://styles/lex-ferguson/cmwhge46101qh01s6gh6ugbdx',
  lichen: 'mapbox://styles/lex-ferguson/cmwhgb67601qf01s6540t7u4k',
  'night-trail': 'mapbox://styles/lex-ferguson/cmwhgaodc01qe01s61qzp0ulp',
  sunset: 'mapbox://styles/lex-ferguson/cmwhg8tl201oz01s4gdhz9o1q',
};
const photoChoices = [grandPrismaticMoments[0].image, grandPrismaticMoments[2].image, grandPrismaticMoments[3].image].filter((image): image is number => Boolean(image));
const mapMoodOptions: { id: StoryMapStyle; label: string; colors: [string, string] }[] = [
  { id: 'terrain', label: 'Terrain', colors: ['#C8D8B7', '#88AAC0'] },
  { id: 'classic', label: 'Classic', colors: ['#E9E6D9', '#B8CED2'] },
  { id: 'dark', label: 'Dark', colors: ['#1D2C31', '#526971'] },
  { id: 'unicorn', label: 'Unicorn', colors: ['#E2D6FA', '#9BCFE0'] },
  { id: 'lichen', label: 'Lichen 3D', colors: ['#B5C6A7', '#6A9081'] },
  { id: 'night-trail', label: 'Night trail', colors: ['#182A31', '#35505A'] },
  { id: 'sunset', label: 'Sunset', colors: ['#E6B880', '#BD7964'] },
];

export default function RecapScreen() {
  const params = useLocalSearchParams<{ markedCount?: string; notes?: string; momentIds?: string; marks?: string; routeCoordinates?: string; storyId?: string; focus?: string }>();
  const saved = useMemo(() => params.storyId ? getSavedTrailStory(params.storyId) : undefined, [params.storyId]);
  const notes = useMemo(() => saved?.notes ?? parse<string>(params.notes), [saved, params.notes]);
  const ids = useMemo(() => saved?.momentIds ?? parse<string>(params.momentIds), [saved, params.momentIds]);
  const marks = useMemo(() => saved?.marks ?? parse<CapturedTrailMoment>(params.marks), [saved, params.marks]);
  const coordinates = useMemo(() => saved?.routeCoordinates ?? parse<number[]>(params.routeCoordinates), [saved, params.routeCoordinates]);
  const total = saved?.momentIds.length ?? Math.max(0, Number(params.markedCount) || 0);
  const noticingFocus = saved?.noticingFocus ?? params.focus?.trim() ?? '';
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
      saveTrailStory({ title: title.trim() || 'Grand Prismatic Overlook', location: 'Yellowstone National Park', momentIds: ids, notes, marks, routeCoordinates: route?.geometry.coordinates ?? coordinates, noticingFocus });
      clearActiveHikeDraft();
    }
    router.dismissAll();
    router.replace('/(tabs)/archive');
  };
  return <SafeAreaView edges={['top']} style={s.screen}>
    <View style={s.header}><Text style={s.headerTitle}>Your trail story</Text><Button label="Done" onPress={save} quiet /></View>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.page}>
      <View style={s.portrait}>
        <StoryMap route={route} moments={moments} active={-1} mapStyle="classic" reducedMotion={reducedMotion} hero />
        {noticingFocus ? <View style={s.portraitFocusBadge}><Text style={s.portraitFocusBadgeText}>Noticing {noticingFocus}</Text></View> : null}
        <View style={s.portraitCaption}><Text style={s.portraitSmall}>Yellowstone National Park</Text><Text accessibilityRole="header" style={s.portraitTitle}>{saved?.title ?? 'Grand Prismatic\nOverlook'}</Text><Text style={s.portraitMeta}>{total} {total === 1 ? 'moment' : 'moments'} you kept</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Share story" onPress={() => setComposer(true)} style={({ pressed }) => [s.heroStoryButton, pressed && s.pressed]}><TrailSymbol name="square.and.arrow.up" androidName="share" size={15} color="#FFFFFF" /><Text style={s.heroStoryButtonText}>Share story</Text></Pressable>
      </View>
      <View style={s.momentIntro}><Text style={s.sectionTitle}>Your moments</Text><Text style={s.secondary}>{noticingFocus ? `Places and words · ${noticingFocus}` : 'Places and words you chose to keep.'}</Text></View>
      {moments.map((item, index) => <View key={`${item.captured?.id ?? index}`} style={s.chapter}>
        <View style={s.chapterHeading}><View style={s.number}><Text style={s.numberText}>{index + 1}</Text></View><Text style={s.chapterTitle}>{item.moment?.title ?? 'A place you marked'}</Text></View>
        {item.moment?.image ? <Image source={item.moment.image} contentFit="cover" style={s.chapterImage} /> : null}
        {item.note.trim() ? <Text style={s.chapterQuote}>{item.note}</Text> : null}
        <Text style={s.context}>{item.moment?.context ?? 'A moment saved along your walk.'}</Text>
      </View>)}
    </ScrollView>
    <SafeAreaView edges={['bottom']} style={s.dock}><Button label={saved ? 'Back to Archive' : 'Save story'} onPress={save} /></SafeAreaView>
    <Modal visible={composer} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setComposer(false)}>
      <Composer route={route} moments={moments} title={title} focus={noticingFocus} onTitle={setTitle} onClose={() => setComposer(false)} reducedMotion={reducedMotion} />
    </Modal>
  </SafeAreaView>;
}

function Composer({ route, moments, title, focus, onTitle, onClose, reducedMotion }: { route: Route | null; moments: Moment[]; title: string; focus: string; onTitle: (title: string) => void; onClose: () => void; reducedMotion: boolean }) {
  const [active, setActive] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const [mapStyle, setMapStyle] = useState<StoryMapStyle>('terrain');
  const [showNotes, setShowNotes] = useState(true);
  const [speed, setSpeed] = useState(3600);
  const [addTarget, setAddTarget] = useState<number | null>(null);
  const [addMode, setAddMode] = useState<'menu' | 'photo' | 'thought'>('menu');
  const [additions, setAdditions] = useState<Record<number, MomentAddition>>({});
  const [draftThought, setDraftThought] = useState('');
  const [storyThread, setStoryThread] = useState(() => buildStoryThread(moments, focus, {}));
  const [addSheetProgress] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (addTarget === null) return;
    addSheetProgress.setValue(0);
    Animated.timing(addSheetProgress, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, [addSheetProgress, addTarget]);
  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => {
      if (active >= moments.length - 1) { setPlaying(false); setFinished(true); }
      else setActive(active + 1);
    }, active === -1 ? 1800 : speed);
    return () => clearTimeout(timer);
  }, [active, moments.length, playing, speed]);
  const togglePlayback = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (finished) {
      setActive(0);
      setFinished(false);
    } else if (active < 0) setActive(0);
    setPlaying(true);
  };
  const current = moments[active];
  const currentAddition = active >= 0 ? additions[active] : undefined;
  const openAdd = () => { setDraftThought(currentAddition?.thought ?? ''); setAddMode('menu'); setAddTarget(active); };
  const closeAdd = () => setAddTarget(null);
  const choosePhoto = (image: number) => { if (addTarget === null) return; setAdditions((existing) => ({ ...existing, [addTarget]: { ...existing[addTarget], image } })); closeAdd(); };
  const saveThought = () => { if (addTarget === null) return; setAdditions((existing) => ({ ...existing, [addTarget]: { ...existing[addTarget], thought: draftThought.trim() } })); closeAdd(); };
  const draftStoryThread = () => setStoryThread(buildStoryThread(moments, focus, additions));
  const shareStory = () => void Share.share({ title, message: [title, storyThread, focus ? `Noticing ${focus}` : undefined, 'Made with TrailMark.'].filter(Boolean).join('\n\n') });
  const storyLength = Math.round((1800 + moments.length * speed) / 1000);
  return <SafeAreaView edges={['top', 'left', 'right']} style={s.screen}>
    <View style={s.header}><Button label="Close" quiet onPress={onClose} /><Text style={s.headerTitle}>Make it yours</Text><Pressable accessibilityRole="button" accessibilityLabel={playing ? 'Pause replay' : finished ? 'Restart story' : active >= 0 ? 'Resume replay' : 'Play story'} onPress={togglePlayback} style={({ pressed }) => [s.playbackIconButton, pressed && s.pressed]}><TrailSymbol name={playing ? 'pause.fill' : finished ? 'arrow.counterclockwise' : 'play.fill'} androidName={playing ? 'pause' : finished ? 'replay' : 'play_arrow'} size={19} color="#226C4A" /></Pressable></View>
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.composerContent}>
      <View style={s.film}>
        
        <StoryMap route={route} moments={moments} active={active} mapStyle={mapStyle} reducedMotion={reducedMotion} hero />
        <View pointerEvents="none" style={s.filmTop}><Text style={s.filmBrand}>TrailMark</Text><Text style={s.filmMeta}>{active < 0 ? 'Story preview' : `Moment ${active + 1} of ${moments.length}`}</Text>{focus ? <Text style={s.filmFocus}>Noticing {focus}</Text> : null}</View>
        <View style={s.filmCaption}>
          {current ? <View style={s.filmPhotoRow}>
            {current.moment?.image ? <Image source={current.moment.image} contentFit="cover" style={[s.filmPhoto, s.filmPhotoOverride]} /> : null}
            {currentAddition?.image ? <Image source={currentAddition.image} contentFit="cover" style={[s.filmPhoto, s.filmPhotoOverride]} /> : null}
            <Pressable accessibilityRole="button" accessibilityLabel="Add a photo or thought to this moment" onPress={openAdd} style={({ pressed }) => [s.addMomentButton, pressed && s.pressed]}><Text style={s.addMomentText}>＋</Text></Pressable>
          </View> : null}
          <Text style={s.filmTitle}>{current ? current.moment?.title ?? 'A marked moment' : title}</Text>
          {current ? <Text style={s.filmDescription}>{showNotes && (currentAddition?.thought?.trim() || current.note.trim()) ? `“${currentAddition?.thought?.trim() || current.note.trim()}”` : 'A moment you chose to keep.'}</Text> : <View style={s.filmBadges}><View style={s.filmBadge}><Text style={s.filmBadgeText}>{moments.length} {moments.length === 1 ? 'moment' : 'moments'}</Text></View><View style={s.filmBadge}><Text style={s.filmBadgeText}>Yellowstone</Text></View><View style={s.filmBadge}><Text style={s.filmBadgeText}>{storyLength} sec</Text></View></View>}
        </View>
      </View>
      <View style={s.editorSection}>
        <Text style={s.sectionHeading}>Story details</Text>
        <Text style={s.fieldLabel}>Title</Text><TextInput accessibilityLabel="Story title" value={title} onChangeText={onTitle} maxLength={80} style={s.titleInput} placeholder="Name your walk" />
        <View style={s.summaryHeader}><Text style={[s.fieldLabel, s.summaryHeaderLabel]}>Story thread</Text><Pressable accessibilityRole="button" accessibilityLabel="Draft story thread" onPress={draftStoryThread} style={({ pressed }) => [s.summaryAction, pressed && s.pressed]}><TrailSymbol name="sparkles" androidName="auto_awesome" size={18} color="#226C4A" /></Pressable></View>
        <TextInput accessibilityLabel="Editable story thread" multiline textAlignVertical="top" value={storyThread} onChangeText={setStoryThread} style={s.summaryInput} />
        <View style={s.settingGroup}>
          <View style={s.settingRow}><View><Text style={s.settingTitle}>Replay pace</Text><Text style={s.settingDetail}>How your moments unfold</Text></View><View style={s.segmented}><Pressable accessibilityRole="button" accessibilityState={{ selected: speed === 3600 }} onPress={() => setSpeed(3600)} style={[s.segment, speed === 3600 && s.segmentActive]}><Text style={[s.segmentText, speed === 3600 && s.segmentTextActive]}>Gentle</Text></Pressable><Pressable accessibilityRole="button" accessibilityState={{ selected: speed === 2400 }} onPress={() => setSpeed(2400)} style={[s.segment, speed === 2400 && s.segmentActive]}><Text style={[s.segmentText, speed === 2400 && s.segmentTextActive]}>Quick</Text></Pressable></View></View>
          <View style={s.settingDivider} />
          <View style={s.settingRow}><View><Text style={s.settingTitle}>Include my words</Text><Text style={s.settingDetail}>Show your reflections in the replay</Text></View><Switch accessibilityLabel="Include my reflection notes" value={showNotes} onValueChange={setShowNotes} trackColor={{ true: '#226C4A' }} /></View>
        </View>
      </View>
      <View style={s.mapMoodSection}><Text style={s.sectionHeading}>Map mood</Text><Text style={s.secondary}>Choose the atmosphere for your story.</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.moodScroller} contentContainerStyle={s.moodScrollFixed}>{mapMoodOptions.map((option) => <MapMoodOption key={option.id} option={option} selected={mapStyle === option.id} onPress={() => setMapStyle(option.id)} />)}</ScrollView></View>
    </ScrollView>
    </KeyboardAvoidingView>
    <SafeAreaView edges={['bottom']} style={s.composerDock}><Pressable accessibilityRole="button" accessibilityLabel="Share story" onPress={shareStory} style={({ pressed }) => [s.composerShareButton, pressed && s.pressed]}><TrailSymbol name="square.and.arrow.up" androidName="share" size={17} color="#FFFFFF" /><Text style={s.composerShareText}>Share story</Text></Pressable></SafeAreaView>
    <Modal visible={addTarget !== null} transparent animationType="none" onRequestClose={closeAdd}>
      <View style={s.addOverlay}><Pressable style={s.addBackdrop} onPress={closeAdd}><Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: addSheetProgress }]} /></Pressable><KeyboardAvoidingView style={s.addKeyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><Animated.View style={[s.addSheet, { transform: [{ translateY: addSheetProgress.interpolate({ inputRange: [0, 1], outputRange: [360, 0] }) }] }]}>
        {addMode === 'menu' ? <><Text style={s.addTitle}>Add to this moment</Text><Text style={s.addSubtitle}>Make this part of the story yours.</Text><Pressable accessibilityRole="button" onPress={() => setAddMode('photo')} style={s.addOption}><Text style={s.addOptionTitle}>Add a photo</Text><Text style={s.addOptionDetail}>Choose from your camera roll</Text></Pressable><Pressable accessibilityRole="button" onPress={() => setAddMode('thought')} style={s.addOption}><Text style={s.addOptionTitle}>Add a thought</Text><Text style={s.addOptionDetail}>Write one more thing you want to remember</Text></Pressable></> : null}
        {addMode === 'photo' ? <><Text style={s.addTitle}>Choose a photo</Text><Text style={s.addSubtitle}>Mock picker for the story preview.</Text><View style={s.photoChoices}>{photoChoices.map((image, index) => <Pressable key={index} accessibilityRole="button" accessibilityLabel={`Choose photo ${index + 1}`} onPress={() => choosePhoto(image)}><Image source={image} contentFit="cover" style={s.photoChoice} /></Pressable>)}</View></> : null}
        {addMode === 'thought' ? <><Text style={s.addTitle}>Add a thought</Text><TextInput autoFocus accessibilityLabel="Additional thought" multiline value={draftThought} onChangeText={setDraftThought} placeholder="What else do you want to remember?" placeholderTextColor="#718078" style={s.thoughtInput} /><Pressable accessibilityRole="button" onPress={saveThought} style={s.addSave}><Text style={s.addSaveText}>Add to story</Text></Pressable></> : null}
        {addMode !== 'menu' ? <Pressable accessibilityRole="button" onPress={() => setAddMode('menu')} style={s.addCancel}><Text style={s.addCancelText}>Back</Text></Pressable> : <Pressable accessibilityRole="button" onPress={closeAdd} style={s.addCancel}><Text style={s.addCancelText}>Cancel</Text></Pressable>}
      </Animated.View></KeyboardAvoidingView></View>
    </Modal>
  </SafeAreaView>;
}

function StoryMap({ route, moments, active, mapStyle, reducedMotion, hero = false }: { route: Route | null; moments: Moment[]; active: number; mapStyle: StoryMapStyle; reducedMotion: boolean; hero?: boolean }) {
  const camera = useRef<Mapbox.Camera>(null);
  const heroTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasPlayedHeroZoom = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const [routeFraction, setRouteFraction] = useState(0);
  const routeFractionRef = useRef(0);
  useEffect(() => {
    if (!loaded || !route) return;
    const coordinate = moments[active]?.captured?.coordinate;
    const duration = reducedMotion ? 0 : 1200;
    const isThreeDimensional = mapStyle !== 'classic' && mapStyle !== 'dark';
    if (coordinate) camera.current?.setCamera({ centerCoordinate: coordinate, zoomLevel: 15.1, pitch: isThreeDimensional ? 48 : 0, heading: isThreeDimensional ? 18 + active * 7 : 0, padding: { paddingTop: 30, paddingBottom: 150, paddingLeft: 20, paddingRight: 20 }, animationDuration: duration, animationMode: 'easeTo' });
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
  }, [active, hero, loaded, mapStyle, moments, reducedMotion, route]);
  useEffect(() => {
    if (!route) return;
    const targetCoordinate = active >= 0 ? moments[active]?.captured?.coordinate : undefined;
    const target = active < 0 ? 0 : targetCoordinate ? fractionAlongRoute(route, targetCoordinate) : moments[active]?.moment?.routeFraction ?? (active + 1) / Math.max(1, moments.length);
    const start = routeFractionRef.current;
    const duration = reducedMotion ? 0 : 1100;
    if (!duration) {
      const frame = requestAnimationFrame(() => {
        routeFractionRef.current = target;
        setRouteFraction(target);
      });
      return () => cancelAnimationFrame(frame);
    }
    const startedAt = Date.now();
    let frame = 0;
    const tick = () => {
      const progress = Math.min(1, (Date.now() - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = start + (target - start) * eased;
      routeFractionRef.current = value;
      setRouteFraction(value);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, moments, reducedMotion, route]);
  const styleURL = storyMapStyles[mapStyle];
  const markerFeatures: FeatureCollection<Point> | null = route ? {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { kind: 'start', label: 'Start' }, geometry: { type: 'Point', coordinates: route.geometry.coordinates[0] } },
      ...moments.map((item, index) => ({
        type: 'Feature' as const,
        properties: { kind: 'moment', index, label: String(index + 1) },
        geometry: { type: 'Point' as const, coordinates: item.captured?.coordinate ?? route.geometry.coordinates[Math.round((route.geometry.coordinates.length - 1) * (item.moment?.routeFraction ?? index / Math.max(1, moments.length - 1)))] },
      })),
      { type: 'Feature', properties: { kind: 'finish', label: 'Finish' }, geometry: { type: 'Point', coordinates: route.geometry.coordinates[route.geometry.coordinates.length - 1] } },
    ],
  } : null;
  const activeCoordinate = active >= 0 ? moments[active]?.captured?.coordinate : undefined;
  const activeTarget = activeCoordinate ? fractionAlongRoute(route!, activeCoordinate) : 1;
  const progressRoute = route ? lineThroughFraction(route, routeFraction, routeFraction >= activeTarget - 0.001 ? activeCoordinate : undefined) : null;
  const darkMap = mapStyle === 'dark' || mapStyle === 'night-trail';
  const mapAccent = darkMap ? '#F5D477' : '#226C4A';
  const progressAccent = darkMap ? '#FFF0A8' : '#A8E5B5';
  const markerText = darkMap ? '#17231F' : '#FFFFFF';
  const edgeFill = darkMap ? '#FFF8D9' : '#FFFFFF';
  return <Mapbox.MapView key={styleURL} style={s.flex} styleURL={styleURL} onWillStartLoadingMap={() => setLoaded(false)} onDidFinishLoadingStyle={() => setLoaded(true)} scrollEnabled={false} zoomEnabled={false} rotateEnabled={false} pitchEnabled={false} logoEnabled={false} attributionEnabled={false} compassEnabled={false} scaleBarEnabled={false}>
    <Mapbox.Camera ref={camera} defaultSettings={{ centerCoordinate: center, zoomLevel: 13.5 }} />
    {loaded && mapStyle === 'terrain' ? <Mapbox.RasterDemSource id="recap-dem" url="mapbox://mapbox.mapbox-terrain-dem-v1"><Mapbox.Terrain style={{ exaggeration: 1 }} /></Mapbox.RasterDemSource> : null}
    {loaded && route ? <Mapbox.ShapeSource id="recap-route" shape={route}><Mapbox.LineLayer id="recap-route-line" style={{ lineColor: mapAccent, lineWidth: 4, lineCap: 'round', lineJoin: 'round' }} /></Mapbox.ShapeSource> : null}
    {loaded && progressRoute ? <Mapbox.ShapeSource id="story-progress-route" shape={progressRoute}><Mapbox.LineLayer id="story-progress-route-line" style={{ lineColor: progressAccent, lineWidth: 6, lineCap: 'round', lineJoin: 'round', lineOpacity: 0.95 }} /></Mapbox.ShapeSource> : null}
    {loaded && markerFeatures ? <Mapbox.ShapeSource id="story-markers" shape={markerFeatures} hitbox={{ width: 24, height: 24 }}>
      <Mapbox.CircleLayer id="story-moment-circles" filter={['==', ['get', 'kind'], 'moment']} style={{ circleColor: mapAccent, circleRadius: ['case', ['==', ['get', 'index'], active], 10, 7], circleStrokeColor: darkMap ? '#FFF8D9' : '#FFFFFF', circleStrokeWidth: 2 }} />
      <Mapbox.SymbolLayer id="story-moment-labels" filter={['==', ['get', 'kind'], 'moment']} style={{ textField: ['get', 'label'], textColor: markerText, textSize: 11, textFont: ['Open Sans Bold'], textAllowOverlap: true, textIgnorePlacement: true }} />
      <Mapbox.CircleLayer id="story-edge-circles" filter={['in', ['get', 'kind'], ['literal', ['start', 'finish']]]} style={{ circleColor: ['case', ['==', ['get', 'kind'], 'finish'], mapAccent, edgeFill], circleRadius: 8, circleStrokeColor: mapAccent, circleStrokeWidth: 2 }} />
      <Mapbox.SymbolLayer id="story-edge-labels" filter={['in', ['get', 'kind'], ['literal', ['start', 'finish']]]} style={{ textField: ['get', 'label'], textColor: ['case', ['==', ['get', 'kind'], 'finish'], markerText, mapAccent], textSize: 10, textFont: ['Open Sans Bold'], textOffset: [0, 2.1], textAllowOverlap: true, textIgnorePlacement: true }} />
    </Mapbox.ShapeSource> : null}
  </Mapbox.MapView>;
}

function Button({ label, onPress, quiet = false }: { label: string; onPress: () => void; quiet?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [quiet ? s.quietButton : s.primaryButton, pressed && s.pressed]}><Text style={quiet ? s.quietText : s.primaryText}>{label}</Text></Pressable>;
}
function TrailSymbol({ name, androidName, size, color }: { name: string; androidName: string; size: number; color: string }) {
  return <SymbolView name={{ ios: name as SFSymbol, android: androidName as never, web: androidName as never }} size={size} weight="semibold" tintColor={color} />;
}
function buildStoryThread(moments: Moment[], focus: string, additions: Record<number, MomentAddition>): string {
  const remembered = moments.map((item, index) => ({ title: item.moment?.title ?? 'the trail', note: additions[index]?.thought?.trim() || item.note.trim() })).filter((item) => item.note);
  const titles = moments.map((item) => item.moment?.title ?? 'the trail');
  const firstPlace = titles[0] ?? 'Fairy Falls trailhead';
  const riverPlace = titles.find((title) => title.toLowerCase().includes('firehole')) ?? 'Firehole River approach';
  const climbPlace = titles.find((title) => title.toLowerCase().includes('overlook approach')) ?? 'Overlook approach';
  const finalPlace = titles[titles.length - 1] ?? 'Grand Prismatic overlook';
  if (!focus.trim() || focus.toLowerCase().includes('sound')) {
    const memoryLine = remembered.length ? `At ${remembered[0].title}, you wrote “${remembered[0].note}”${remembered.length > 1 ? `, then carried that feeling toward ${remembered[remembered.length - 1].title}.` : '.'}` : 'The memory stayed with the changing rhythm of the walk.';
    return `From ${firstPlace} through ${riverPlace} and ${climbPlace}, the Firehole River and climbing trail shaped what you heard. At ${finalPlace}, Grand Prismatic and Midway Geyser Basin opened into view, but the memory stayed with that changing rhythm. ${memoryLine}`;
  }
  const focusLine = focus ? `You set out to notice ${focus.toLowerCase()} along the trail.` : 'You moved through the trail with attention to what changed around you.';
  const placeLine = `From ${firstPlace} to ${finalPlace}, the story follows what held your attention through the trail.`;
  const memoryLine = remembered.length ? `At ${remembered[0].title}, you wrote “${remembered[0].note}”${remembered.length > 1 ? ' Those words became part of the walk too.' : ''}` : 'You kept a few places that made the walk feel like more than a route.';
  return `${focusLine} ${placeLine} ${memoryLine}`;
}
function MapMoodOption({ option, selected, onPress }: { option: { id: StoryMapStyle; label: string; colors: [string, string] }; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={`${option.label} map mood`} onPress={onPress} style={({ pressed }) => [s.moodOption, selected && s.moodOptionSelected, pressed && s.pressed]}><View style={[s.moodSwatch, { backgroundColor: option.colors[0] }]}><View style={[s.moodRiver, { backgroundColor: option.colors[1] }]} /><View style={s.moodRoute} /></View><Text numberOfLines={1} style={[s.moodLabel, selected && s.moodLabelSelected]}>{selected ? `✓ ${option.label}` : option.label}</Text></Pressable>;
}
function parse<T>(value?: string): T[] { try { const data = JSON.parse(value ?? '[]'); return Array.isArray(data) ? data : []; } catch { return []; } }
function shape(coordinates: number[][]): Route | null { return coordinates.length > 1 ? { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } } : null; }
function fractionAlongRoute(route: Route, coordinate: Position): number {
  const points = route.geometry.coordinates;
  let bestFraction = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const lengthSquared = dx * dx + dy * dy;
    const projection = lengthSquared ? Math.max(0, Math.min(1, ((coordinate[0] - start[0]) * dx + (coordinate[1] - start[1]) * dy) / lengthSquared)) : 0;
    const closest: Position = [start[0] + dx * projection, start[1] + dy * projection];
    const distance = (coordinate[0] - closest[0]) ** 2 + (coordinate[1] - closest[1]) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestFraction = (index + projection) / Math.max(1, points.length - 1);
    }
  }
  return bestFraction;
}
function lineThroughFraction(route: Route, fraction: number, endpoint?: Position): Route {
  const points = route.geometry.coordinates;
  if (points.length < 2) return route;
  const position = Math.max(0, Math.min(1, fraction)) * (points.length - 1);
  const index = Math.floor(position);
  const remainder = position - index;
  const end = points[Math.min(index + 1, points.length - 1)];
  const start = points[index];
  const current: Position = [start[0] + (end[0] - start[0]) * remainder, start[1] + (end[1] - start[1]) * remainder];
  const lineCoordinates = [...points.slice(0, index + 1), endpoint ?? current];
  return { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: lineCoordinates } };
}

const s = StyleSheet.create({
  portraitFocusBadge: { position: 'absolute', top: 18, right: 18, maxWidth: '70%', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(245,247,243,0.94)' },
  portraitFocusBadgeText: { color: '#226C4A', fontSize: 12, fontWeight: '800' },
  filmFocus: { color: '#226C4A', fontSize: 11, fontWeight: '800', marginTop: 4 },
  filmPhotoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  filmFace: { ...StyleSheet.absoluteFill, backfaceVisibility: 'hidden' }, filmBack: { backgroundColor: '#1C392B' }, filmBackContent: { flex: 1, justifyContent: 'center', padding: 28 }, filmBackEyebrow: { color: '#A7D4B2', fontSize: 13, fontWeight: '800' }, filmBackTitle: { color: '#FFFFFF', fontSize: 34, lineHeight: 38, fontWeight: '800', marginTop: 10 }, filmBackText: { color: '#D8E7DA', fontSize: 16, lineHeight: 23, marginTop: 9 }, filmBackPrimary: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 28, borderRadius: 16, backgroundColor: '#FFFFFF' }, filmBackPrimaryText: { color: '#1C392B', fontSize: 16, fontWeight: '800' }, filmBackSecondary: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 8 }, filmBackSecondaryText: { color: '#A7D4B2', fontSize: 14, fontWeight: '700' },
  filmPhotoOverride: { marginBottom: 0 },
  addMomentButton: { width: 86, height: 64, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.06)' },
  addMomentText: { color: '#FFFFFF', fontSize: 32, fontWeight: '400', lineHeight: 34 },
  addOverlay: { flex: 1, justifyContent: 'flex-end' },
  addKeyboard: { width: '100%', justifyContent: 'flex-end' },
  addBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(12, 24, 18, 0.32)' },
  addSheet: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 28, borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: '#F5F7F3' },
  addTitle: { color: '#18271E', fontSize: 23, fontWeight: '800', letterSpacing: -0.3 },
  addSubtitle: { color: '#4D6053', fontSize: 14, lineHeight: 20, marginTop: 5, marginBottom: 14 },
  addOption: { minHeight: 62, justifyContent: 'center', paddingHorizontal: 15, marginTop: 9, borderRadius: 15, borderWidth: 1, borderColor: '#DCE4D9', backgroundColor: '#FFFFFF' },
  addOptionTitle: { color: '#18271E', fontSize: 16, fontWeight: '700' },
  addOptionDetail: { color: '#4D6053', fontSize: 13, marginTop: 3 },
  photoChoices: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 6 },
  photoChoice: { width: 96, height: 96, borderRadius: 14, backgroundColor: '#DDE8DF' },
  thoughtInput: { minHeight: 120, padding: 14, marginTop: 10, borderRadius: 15, borderWidth: 1, borderColor: '#C6D3C5', backgroundColor: '#FFFFFF', color: '#18271E', fontSize: 17, lineHeight: 24, textAlignVertical: 'top' },
  addSave: { minHeight: 52, alignItems: 'center', justifyContent: 'center', marginTop: 12, borderRadius: 15, backgroundColor: '#226C4A' },
  addSaveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  addCancel: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  addCancelText: { color: '#226C4A', fontSize: 15, fontWeight: '700' },
  moodScroller: { marginHorizontal: -18 }, moodScrollFixed: { gap: 10, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 8 },
  screen: { flex: 1, backgroundColor: '#F5F7F3' }, flex: { flex: 1 },
  header: { minHeight: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, headerTitle: { color: '#18271E', fontSize: 17, fontWeight: '700' },
  page: { paddingHorizontal: 18, paddingBottom: 16, alignSelf: 'center', width: '100%', maxWidth: 680 },
  portrait: { height: 460, borderRadius: 26, overflow: 'hidden', backgroundColor: '#DEE8DB' },
  heroFace: { ...StyleSheet.absoluteFill, backfaceVisibility: 'hidden' }, heroBack: { backgroundColor: '#1C392B' }, heroBackContent: { flex: 1, justifyContent: 'center', padding: 28 }, heroBackEyebrow: { color: '#A7D4B2', fontSize: 13, fontWeight: '800' }, heroBackTitle: { color: '#FFFFFF', fontSize: 34, lineHeight: 38, fontWeight: '800', marginTop: 10 }, heroBackText: { color: '#D8E7DA', fontSize: 16, lineHeight: 23, marginTop: 9 }, heroBackFocus: { color: '#A7D4B2', fontSize: 14, fontWeight: '700', marginTop: 16 }, heroBackPrimary: { minHeight: 52, alignItems: 'center', justifyContent: 'center', marginTop: 28, borderRadius: 16, backgroundColor: '#FFFFFF' }, heroBackPrimaryText: { color: '#1C392B', fontSize: 16, fontWeight: '800' }, heroBackSecondary: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10, borderRadius: 16, borderWidth: 1, borderColor: '#A7D4B2' }, heroBackSecondaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' }, heroBackClose: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 6 }, heroBackCloseText: { color: '#A7D4B2', fontSize: 14, fontWeight: '700' },
  portraitCaption: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 22, backgroundColor: '#E9EFE5' }, portraitFocus: { color: '#226C4A', fontSize: 13, lineHeight: 18, fontWeight: '700', marginTop: 8 },
  portraitSmall: { fontSize: 13, color: '#45594A', marginBottom: 8 }, portraitTitle: { fontSize: 33, lineHeight: 36, letterSpacing: -1, color: '#18271E', fontWeight: '800' }, portraitMeta: { fontSize: 16, color: '#226C4A', marginTop: 10, fontWeight: '600' },
  heroStoryButton: { position: 'absolute', right: 18, bottom: 18, minHeight: 46, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, borderRadius: 14, backgroundColor: '#226C4A' }, heroStoryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' }, playbackIconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  secondary: { fontSize: 14, lineHeight: 20, color: '#4D6053' }, momentIntro: { paddingTop: 28, paddingBottom: 24 }, sectionTitle: { fontSize: 22, fontWeight: '700', color: '#18271E', letterSpacing: -0.35, marginBottom: 6 },
  chapter: { marginBottom: 32 }, chapterHeading: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }, number: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#DFEBDD', alignItems: 'center', justifyContent: 'center' }, numberText: { color: '#226C4A', fontSize: 13, fontWeight: '700' }, chapterTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#18271E' }, chapterImage: { width: '100%', aspectRatio: 1.28, borderRadius: 20 }, chapterQuote: { fontSize: 22, lineHeight: 30, color: '#18271E', marginTop: 16, fontWeight: '500' }, context: { fontSize: 15, lineHeight: 23, color: '#4D6053', marginTop: 10 },
  dock: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 10, borderTopWidth: 1, borderTopColor: '#DCE4D9', backgroundColor: '#F5F7F3' }, primaryButton: { minHeight: 54, borderRadius: 18, backgroundColor: '#226C4A', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 }, primaryText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' }, quietButton: { minHeight: 44, paddingHorizontal: 10, justifyContent: 'center' }, quietText: { fontSize: 15, fontWeight: '600', color: '#226C4A' }, pressed: { opacity: 0.65 },
  composerDock: { paddingHorizontal: 18, paddingTop: 10, backgroundColor: '#F5F7F3', borderTopWidth: 1, borderTopColor: '#DCE4D9' }, composerShareButton: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 18, backgroundColor: '#226C4A' }, composerShareText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  composerContent: { paddingHorizontal: 18, paddingTop: 0, maxWidth: 600, width: '100%', alignSelf: 'center', paddingBottom: 44 }, film: { height: 500, overflow: 'hidden', borderRadius: 28, backgroundColor: '#DFEBDD' }, filmTop: { position: 'absolute', top: 16, left: 16, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 14, backgroundColor: 'rgba(245,247,243,0.94)' }, filmBrand: { fontSize: 14, fontWeight: '800', color: '#18271E' }, filmMeta: { fontSize: 12, color: '#4D6053', marginTop: 1 }, filmCaption: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingTop: 34, backgroundColor: 'rgba(24,39,30,0.88)' }, filmPhoto: { width: 86, height: 64, borderRadius: 10, marginBottom: 10 }, filmTitle: { fontSize: 27, lineHeight: 31, fontWeight: '800', letterSpacing: -0.6, color: '#FFFFFF' }, filmDescription: { fontSize: 14, lineHeight: 20, color: '#DCE8DD', marginTop: 7 }, filmBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 }, filmBadge: { minHeight: 28, justifyContent: 'center', paddingHorizontal: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)' }, filmBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' }, editorSection: { marginTop: 30, marginBottom: 30 }, sectionHeading: { fontSize: 22, fontWeight: '700', color: '#18271E', letterSpacing: -0.3, marginBottom: 16 }, fieldLabel: { fontSize: 15, fontWeight: '600', color: '#18271E', marginBottom: 8 }, titleInput: { minHeight: 54, padding: 14, borderWidth: 1, borderColor: '#C6D3C5', borderRadius: 15, color: '#18271E', fontSize: 17, backgroundColor: '#FFFFFF' }, settingGroup: { marginTop: 16, paddingHorizontal: 16, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCE4D9' }, settingRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 }, settingTitle: { fontSize: 16, fontWeight: '600', color: '#18271E' }, settingDetail: { maxWidth: 190, fontSize: 13, lineHeight: 18, color: '#4D6053', marginTop: 3 }, settingDivider: { height: 1, backgroundColor: '#E3E9E1' }, segmented: { flexDirection: 'row', padding: 3, borderRadius: 11, backgroundColor: '#E9EFE5' }, segment: { minHeight: 34, paddingHorizontal: 10, borderRadius: 8, justifyContent: 'center' }, segmentActive: { backgroundColor: '#226C4A' }, segmentText: { color: '#4D6053', fontSize: 13, fontWeight: '600' }, segmentTextActive: { color: '#FFFFFF' }, mapMoodSection: { marginBottom: 10 }, moodScroll: { gap: 10, paddingTop: 14, paddingBottom: 8, paddingRight: 18 }, moodOption: { width: 104, padding: 5, borderRadius: 16, borderWidth: 1, borderColor: '#D5E0D2', backgroundColor: '#FFFFFF' }, moodOptionSelected: { borderWidth: 2, borderColor: '#226C4A', padding: 4 }, moodSwatch: { height: 76, overflow: 'hidden', borderRadius: 11, justifyContent: 'center' }, moodRiver: { position: 'absolute', height: 21, width: 130, backgroundColor: '#9BC9CF', transform: [{ rotate: '-24deg' }] }, moodRoute: { width: 94, height: 3, borderRadius: 2, backgroundColor: '#226C4A', transform: [{ rotate: '22deg' }] }, moodLabel: { color: '#4D6053', fontSize: 12, fontWeight: '600', marginTop: 8, marginBottom: 3, textAlign: 'center' }, moodLabelSelected: { color: '#226C4A', fontWeight: '800' }, mapPin: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#FFFFFF', backgroundColor: '#226C4A', alignItems: 'center', justifyContent: 'center' }, activePin: { width: 36, height: 36, borderRadius: 18, borderWidth: 3 }, pinText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' }, edgePin: { minHeight: 26, paddingHorizontal: 9, borderRadius: 13, borderWidth: 2, borderColor: '#226C4A', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }, finishPin: { backgroundColor: '#226C4A' }, edgePinText: { color: '#226C4A', fontSize: 11, fontWeight: '800' }, finishPinText: { color: '#FFFFFF' },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 8 }, summaryHeaderLabel: { marginBottom: 0 }, summaryAction: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E9EFE5' }, summaryInput: { minHeight: 100, padding: 14, borderWidth: 1, borderColor: '#C6D3C5', borderRadius: 16, color: '#18271E', fontSize: 15, lineHeight: 21, backgroundColor: '#FFFFFF' },
});
