import Mapbox from '@rnmapbox/maps';
import { requestPermissionsAsync, saveToLibraryAsync } from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { SFSymbol } from 'sf-symbols-typescript';
import type { Feature, FeatureCollection, LineString, Point, Position } from 'geojson';
import { captureRef } from 'react-native-view-shot';
import { grandPrismaticMoments, type PreparedTrailMoment } from '@/lib/trail-moments';
import { clearActiveHikeDraft, getSavedTrailStory, saveTrailStory, updateTrailStory, type CapturedTrailMoment } from '@/lib/trail-stories';
import { getPublishedTrail } from '@/lib/trails';
import { noticingThemes } from '@/constants/trailmark-theme';
import { getIncludeWords, getReplayPace } from '@/lib/trailmark-preferences';

const center: Position = [-110.836, 44.520];
const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
if (token) Mapbox.setAccessToken(token);
type Moment = { note: string; moment?: PreparedTrailMoment; captured?: CapturedTrailMoment };
type MomentAddition = { image?: number; thought?: string };
type Route = Feature<LineString>;
type StoryMapStyle = 'terrain' | 'classic' | 'dark' | 'unicorn' | 'blue-dream' | 'lichen' | 'night-trail' | 'sunset';
const storyMapStyles: Record<StoryMapStyle, string> = {
  terrain: Mapbox.StyleURL.Outdoors,
  classic: Mapbox.StyleURL.Light,
  dark: Mapbox.StyleURL.Dark,
  unicorn: 'mapbox://styles/lex-ferguson/cmwhge46101qh01s6gh6ugbdx',
  'blue-dream': 'mapbox://styles/lex-ferguson/cmwi2loq901qo01s6fmxkazc4',
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
  { id: 'blue-dream', label: 'Blue dream', colors: ['#D2EBF8', '#35B8E8'] },
  { id: 'lichen', label: 'Lichen 3D', colors: ['#B5C6A7', '#6A9081'] },
  { id: 'night-trail', label: 'Night trail', colors: ['#182A31', '#35505A'] },
  { id: 'sunset', label: 'Sunset', colors: ['#E6B880', '#BD7964'] },
];
type StoryMapPalette = {
  trail: string;
  progress: string;
  edgeFill: string;
  edgeText: string;
  edgeStroke: string;
};
const storyMapPalettes: Record<StoryMapStyle, StoryMapPalette> = {
  terrain: { trail: '#2F7D59', progress: '#9AD5A8', edgeFill: '#F4F8EF', edgeText: '#2F7D59', edgeStroke: '#2F7D59' },
  classic: { trail: '#226C4A', progress: '#A8E5B5', edgeFill: '#FFFFFF', edgeText: '#226C4A', edgeStroke: '#226C4A' },
  dark: { trail: '#D4B653', progress: '#FFF0A8', edgeFill: '#24352F', edgeText: '#F5D477', edgeStroke: '#F5D477' },
  unicorn: { trail: '#167EAE', progress: '#7AD8F2', edgeFill: '#E8F8FF', edgeText: '#167EAE', edgeStroke: '#167EAE' },
  'blue-dream': { trail: '#167EAE', progress: '#7AD8F2', edgeFill: '#E8F8FF', edgeText: '#167EAE', edgeStroke: '#167EAE' },
  lichen: { trail: '#567A62', progress: '#A8CF9A', edgeFill: '#EEF4E7', edgeText: '#567A62', edgeStroke: '#567A62' },
  'night-trail': { trail: '#67C7C4', progress: '#B6F0E2', edgeFill: '#213B40', edgeText: '#8FE8DD', edgeStroke: '#8FE8DD' },
  sunset: { trail: '#B75F4F', progress: '#F6C08A', edgeFill: '#FFF0DC', edgeText: '#B75F4F', edgeStroke: '#B75F4F' },
};
const defaultNoticeTheme = { id: 'default', label: 'TrailMark original', short: 'Original', detail: 'TrailMark green', accent: '#226C4A', accentSoft: '#E9EFE5', card: '#1C392B', cardText: '#FFFFFF', surface: '#E9EFE5', ink: '#18271E', artwork: ['#C9DCCB', '#7DAF88', '#E9EFE5'] as const };
const noticingLenses = [defaultNoticeTheme, ...Object.values(noticingThemes)];
type StoryNoticeThemeId = 'default' | keyof typeof noticingThemes;

export default function RecapScreen() {
  const params = useLocalSearchParams<{ markedCount?: string; notes?: string; momentIds?: string; marks?: string; routeCoordinates?: string; storyId?: string; focusId?: string; focus?: string; noticeTheme?: string }>();
  const saved = useMemo(() => params.storyId ? getSavedTrailStory(params.storyId) : undefined, [params.storyId]);
  const notes = useMemo(() => saved?.notes ?? parse<string>(params.notes), [saved, params.notes]);
  const ids = useMemo(() => saved?.momentIds ?? parse<string>(params.momentIds), [saved, params.momentIds]);
  const marks = useMemo(() => saved?.marks ?? parse<CapturedTrailMoment>(params.marks), [saved, params.marks]);
  const coordinates = useMemo(() => saved?.routeCoordinates ?? parse<number[]>(params.routeCoordinates), [saved, params.routeCoordinates]);
  const total = saved?.momentIds.length ?? Math.max(0, Number(params.markedCount) || 0);
  const noticingFocus = saved?.noticingFocus ?? params.focus?.trim() ?? '';
  const moments = useMemo<Moment[]>(() => Array.from({ length: total }, (_, index) => ({ note: notes[index] ?? '', captured: marks[index], moment: grandPrismaticMoments.find((moment) => moment.id === ids[index]) })), [ids, marks, notes, total]);
  const nodMomentCount = useMemo(() => moments.filter((item) => item.captured?.source === 'nod').length, [moments]);
  const [route, setRoute] = useState<Route | null>(() => shape(coordinates));
  const [composer, setComposer] = useState(false);
  const [composerTarget, setComposerTarget] = useState(-1);
  const [momentAddTarget, setMomentAddTarget] = useState<number | null>(null);
  const [momentAdditions, setMomentAdditions] = useState<Record<number, MomentAddition>>(() => Object.fromEntries(Object.entries(saved?.additions ?? {}).map(([key, addition]) => [Number(key), { image: addition.imageIndex === undefined ? undefined : photoChoices[addition.imageIndex], thought: addition.thought }])));
  const [title, setTitle] = useState(saved?.title ?? 'Grand Prismatic Overlook');
  const [noticeTheme, setNoticeTheme] = useState<StoryNoticeThemeId>((saved?.noticeTheme as StoryNoticeThemeId | undefined) ?? (params.noticeTheme as StoryNoticeThemeId | undefined) ?? 'default');
  const activeNoticeTheme = noticeTheme === 'default' ? defaultNoticeTheme : noticingThemes[noticeTheme];
  const [mapMood, setMapMood] = useState<StoryMapStyle>((saved?.mapMood as StoryMapStyle) ?? (noticeTheme === 'water' ? 'blue-dream' : noticeTheme === 'earth' ? 'sunset' : 'terrain'));
  const [savedStoryThread, setSavedStoryThread] = useState(saved?.storyThread ?? '');
  const [reducedMotion, setReducedMotion] = useState(true);
  const openComposer = (target = -1) => { setComposerTarget(target); setComposer(true); };
  const openMomentAdd = (index: number) => setMomentAddTarget(index);
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
    const additions = Object.fromEntries(Object.entries(momentAdditions).map(([key, addition]) => [key, { imageIndex: addition.image === undefined ? undefined : photoChoices.indexOf(addition.image), thought: addition.thought }]));
    const storyUpdate = { title: title.trim() || 'Grand Prismatic Overlook', location: 'Yellowstone National Park', momentIds: ids, notes, marks, routeCoordinates: route?.geometry.coordinates ?? coordinates, noticingFocusId: params.focusId, noticingFocus, noticeTheme, mapMood, storyThread: savedStoryThread, additions };
    if (saved) {
      updateTrailStory(saved.id, storyUpdate);
    } else {
      saveTrailStory(storyUpdate);
      clearActiveHikeDraft();
    }
    router.dismissAll();
    router.replace('/(tabs)/archive');
  };
  return <SafeAreaView edges={['top']} style={s.screen}>
    <View style={s.header}><Text style={s.headerTitle}>Your trail story</Text><Button label="Done" onPress={save} quiet tint={activeNoticeTheme.accent} /></View>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.page}>
      <View style={s.portrait}>
        <StoryMap route={route} moments={moments} active={-1} mapStyle={mapMood} reducedMotion={reducedMotion} hero />
        {noticingFocus ? <View style={[s.portraitFocusBadge, { borderColor: activeNoticeTheme.accent }]}><Text style={[s.portraitFocusBadgeText, { color: activeNoticeTheme.accent }]}>Noticing {noticingFocus}</Text></View> : null}
        <View style={[s.portraitCaption, { backgroundColor: activeNoticeTheme.surface }]}><Text style={s.portraitSmall}>Yellowstone National Park</Text><Text accessibilityRole="header" style={[s.portraitTitle, { color: activeNoticeTheme.ink }]}>{title}</Text><Text style={[s.portraitMeta, { color: activeNoticeTheme.accent }]}>{total} {total === 1 ? 'moment' : 'moments'} you kept</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Share story" onPress={() => openComposer()} style={({ pressed }) => [s.heroStoryButton, { backgroundColor: activeNoticeTheme.accent }, pressed && s.pressed]}><TrailSymbol name="square.and.arrow.up" androidName="share" size={15} color="#FFFFFF" /><Text style={s.heroStoryButtonText}>Share story</Text></Pressable>
      </View>
      <View style={s.momentIntro}><Text style={s.sectionTitle}>Your moments</Text><Text style={s.secondary}>{noticingFocus ? `Places and words · ${noticingFocus}` : 'Places and words you chose to keep.'}</Text>{nodMomentCount ? <View style={s.nodSummary}><View style={s.nodSummaryIcon}><TrailSymbol name="hand.tap.fill" androidName="touch_app" size={14} color="#226C4A" /></View><Text style={s.nodSummaryText}>{nodMomentCount} {nodMomentCount === 1 ? 'moment was' : 'moments were'} kept with Nod</Text></View> : null}</View>
      {moments.map((item, index) => <View key={`${item.captured?.id ?? index}`} style={s.chapter}>
        <View style={s.chapterHeading}><View style={[s.number, { backgroundColor: activeNoticeTheme.accentSoft }]}><Text style={[s.numberText, { color: activeNoticeTheme.accent }]}>{index + 1}</Text></View><Text style={s.chapterTitle}>{item.moment?.title ?? 'A place you marked'}</Text></View>
        {item.moment?.image ? <Image source={item.moment.image} contentFit="cover" style={s.chapterImage} /> : null}
        {momentAdditions[index]?.image ? <Image source={momentAdditions[index].image} contentFit="cover" style={s.chapterAdditionalImage} /> : null}
        {item.note.trim() ? <Text style={s.chapterQuote}>{item.note}</Text> : null}
        {momentAdditions[index]?.thought ? <Text style={s.chapterAdditionQuote}>“{momentAdditions[index].thought}”</Text> : null}
        <Text style={s.context}>{item.moment?.context ?? 'A moment saved along your walk.'}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Add to moment ${index + 1}`} onPress={() => openMomentAdd(index)} style={({ pressed }) => [s.chapterAdd, { borderColor: activeNoticeTheme.accent, backgroundColor: `${activeNoticeTheme.accent}0D` }, pressed && s.pressed]}><Text style={[s.chapterAddPlus, { color: activeNoticeTheme.accent }]}>＋</Text><Text style={[s.chapterAddText, { color: activeNoticeTheme.accent }]}>Add to this moment</Text></Pressable>
      </View>)}
    </ScrollView>
    <SafeAreaView edges={['bottom']} style={s.dock}><Button label={saved ? 'Save changes' : 'Save story'} onPress={save} tint={activeNoticeTheme.accent} /></SafeAreaView>
    <Modal visible={composer} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setComposer(false)}>
      <Composer key={composerTarget} route={route} moments={moments} title={title} focus={noticingFocus} initialNoticeTheme={noticeTheme} initialMapMood={mapMood} initialStoryThread={savedStoryThread} initialActive={composerTarget} onTitle={setTitle} onClose={(nextTheme, nextMood, nextThread) => { setNoticeTheme(nextTheme); setMapMood(nextMood); setSavedStoryThread(nextThread); setComposer(false); }} reducedMotion={reducedMotion} />
    </Modal>
    <MomentAddSheet
      key={momentAddTarget ?? 'closed'}
      visible={momentAddTarget !== null}
      initialThought={momentAddTarget === null ? '' : momentAdditions[momentAddTarget]?.thought ?? ''}
      onClose={() => setMomentAddTarget(null)}
      onPhoto={(image) => { if (momentAddTarget === null) return; setMomentAdditions((existing) => ({ ...existing, [momentAddTarget]: { ...existing[momentAddTarget], image } })); setMomentAddTarget(null); }}
      onThought={(thought) => { if (momentAddTarget === null) return; setMomentAdditions((existing) => ({ ...existing, [momentAddTarget]: { ...existing[momentAddTarget], thought } })); setMomentAddTarget(null); }}
    />
  </SafeAreaView>;
}

function MomentAddSheet({ visible, initialThought, onClose, onPhoto, onThought }: { visible: boolean; initialThought: string; onClose: () => void; onPhoto: (image: number) => void; onThought: (thought: string) => void }) {
  const [mode, setMode] = useState<'menu' | 'photo' | 'thought'>('menu');
  const [draftThought, setDraftThought] = useState(initialThought);
  const [sheetProgress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!visible) return;
    sheetProgress.setValue(0);
    const animation = Animated.timing(sheetProgress, { toValue: 1, duration: 260, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [initialThought, sheetProgress, visible]);

  return <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
    <View style={s.addOverlay}>
      <Pressable accessibilityLabel="Close add to moment" onPress={onClose} style={s.addBackdrop} />
      <KeyboardAvoidingView style={s.addKeyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Animated.View style={[s.addSheet, { transform: [{ translateY: sheetProgress.interpolate({ inputRange: [0, 1], outputRange: [360, 0] }) }] }]}>
          {mode === 'menu' ? <><Text style={s.addTitle}>Add to this moment</Text><Text style={s.addSubtitle}>Make this part of the story yours.</Text><Pressable accessibilityRole="button" onPress={() => setMode('photo')} style={s.addOption}><Text style={s.addOptionTitle}>Add a photo</Text><Text style={s.addOptionDetail}>Choose from the trail photos</Text></Pressable><Pressable accessibilityRole="button" onPress={() => setMode('thought')} style={s.addOption}><Text style={s.addOptionTitle}>Add a thought</Text><Text style={s.addOptionDetail}>Write one more thing you want to remember</Text></Pressable></> : null}
          {mode === 'photo' ? <><Text style={s.addTitle}>Choose a photo</Text><Text style={s.addSubtitle}>Add another image to this moment.</Text><View style={s.photoChoices}>{photoChoices.map((image, index) => <Pressable key={index} accessibilityRole="button" accessibilityLabel={`Choose photo ${index + 1}`} onPress={() => onPhoto(image)}><Image source={image} contentFit="cover" style={s.photoChoice} /></Pressable>)}</View></> : null}
          {mode === 'thought' ? <><Text style={s.addTitle}>Add a thought</Text><TextInput autoFocus accessibilityLabel="Additional thought" multiline value={draftThought} onChangeText={setDraftThought} placeholder="What else do you want to remember?" placeholderTextColor="#718078" style={s.thoughtInput} /><Pressable accessibilityRole="button" onPress={() => onThought(draftThought.trim())} style={s.addSave}><Text style={s.addSaveText}>Add to moment</Text></Pressable></> : null}
          {mode !== 'menu' ? <Pressable accessibilityRole="button" onPress={() => setMode('menu')} style={s.addCancel}><Text style={s.addCancelText}>Back</Text></Pressable> : <Pressable accessibilityRole="button" onPress={onClose} style={s.addCancel}><Text style={s.addCancelText}>Cancel</Text></Pressable>}
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  </Modal>;
}

function Composer({ route, moments, title, focus, initialNoticeTheme, initialMapMood, initialStoryThread, initialActive, onTitle, onClose, reducedMotion }: { route: Route | null; moments: Moment[]; title: string; focus: string; initialNoticeTheme: string; initialMapMood: StoryMapStyle; initialStoryThread: string; initialActive: number; onTitle: (title: string) => void; onClose: (noticeTheme: StoryNoticeThemeId, mapMood: StoryMapStyle, storyThread: string) => void; reducedMotion: boolean }) {
  const filmRef = useRef<React.ComponentRef<typeof View>>(null);
  const stickerRef = useRef<React.ComponentRef<typeof View>>(null);
  const stickerStoryRef = useRef<React.ComponentRef<typeof View>>(null);
  const composerScrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [active, setActive] = useState(initialActive);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const [mapStyle, setMapStyle] = useState<StoryMapStyle>(initialMapMood);
  const [showNotes, setShowNotes] = useState(getIncludeWords);
  const [speed, setSpeed] = useState(() => getReplayPace() === 'quick' ? 2400 : 3600);
  const [addTarget, setAddTarget] = useState<number | null>(null);
  const [addMode, setAddMode] = useState<'menu' | 'photo' | 'thought'>('menu');
  const [additions, setAdditions] = useState<Record<number, MomentAddition>>({});
  const [draftThought, setDraftThought] = useState('');
  const initialLensIndex = Math.max(0, noticingLenses.findIndex((lens) => lens.id === initialNoticeTheme));
  const [lensIndex, setLensIndex] = useState(initialLensIndex);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [storyThread, setStoryThread] = useState(() => initialStoryThread || buildStoryThread(moments, focus, {}));
  const [shareOptionsOpen, setShareOptionsOpen] = useState(false);
  const [stickerEditorOpen, setStickerEditorOpen] = useState(false);
  const [stickerStyle, setStickerStyle] = useState<'light' | 'dark'>('light');
  const [stickerShowsMeta, setStickerShowsMeta] = useState(true);
  const [stickerPhoto, setStickerPhoto] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [addSheetProgress] = useState(() => new Animated.Value(0));
  const [themeFade] = useState(() => new Animated.Value(1));
  const previousLensIndex = useRef(lensIndex);
  useEffect(() => {
    if (previousLensIndex.current === lensIndex) return;
    previousLensIndex.current = lensIndex;
    if (reducedMotion) return;
    themeFade.setValue(0.9);
    const animation = Animated.timing(themeFade, { toValue: 1, duration: 170, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [lensIndex, reducedMotion, themeFade]);
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
    composerScrollRef.current?.scrollTo({ y: 0, animated: true });
    if (finished) {
      setActive(0);
      setFinished(false);
    } else if (active < 0) setActive(0);
    setPlaying(true);
  };
  const current = moments[active];
  const currentAddition = active >= 0 ? additions[active] : undefined;
  const noticeStyle = { backgroundColor: noticingLenses[lensIndex].card };
  const openAdd = () => { setDraftThought(currentAddition?.thought ?? ''); setAddMode('menu'); setAddTarget(active); };
  const closeAdd = () => setAddTarget(null);
  const choosePhoto = (image: number) => { if (addTarget === null) return; setAdditions((existing) => ({ ...existing, [addTarget]: { ...existing[addTarget], image } })); closeAdd(); };
  const saveThought = () => { if (addTarget === null) return; setAdditions((existing) => ({ ...existing, [addTarget]: { ...existing[addTarget], thought: draftThought.trim() } })); closeAdd(); };
  const draftStoryThread = () => setStoryThread(buildStoryThread(moments, focus, additions));
  const chooseLens = (index: number) => {
    const lens = noticingLenses[index];
    setLensIndex(index);
    setMapStyle(lens.id === 'water' ? 'blue-dream' : lens.id === 'earth' ? 'sunset' : 'terrain');
    setColorPickerOpen(false);
  };
  const shareText = () => void Share.share({ title, message: [title, storyThread, focus ? `Noticing ${focus}` : undefined, 'Made with TrailMark.'].filter(Boolean).join('\n\n') });
  const pickStickerPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [9, 16], quality: 1 });
    if (!result.canceled) setStickerPhoto(result.assets[0].uri);
  };
  const exportImage = async (kind: 'card' | 'sticker', action: 'share' | 'save') => {
    const target = kind === 'card' ? filmRef.current : stickerPhoto ? stickerStoryRef.current : stickerRef.current;
    if (!target) return;
    setExporting(true);
    try {
      const uri = await captureRef(target, { format: 'png', quality: 1, result: 'tmpfile', ...(kind === 'sticker' ? { width: stickerPhoto ? 1080 : 1200 } : { width: 1080 }) });
      if (action === 'share') {
        if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: kind === 'sticker' ? 'Share TrailMark sticker' : 'Share TrailMark story' });
        else await Share.share({ title, message: 'Made with TrailMark.' });
      } else {
        const permission = await requestPermissionsAsync();
        if (!permission.granted) return;
        await saveToLibraryAsync(uri);
      }
      setShareOptionsOpen(false);
      setStickerEditorOpen(false);
    } catch (error) {
      console.warn('Unable to export TrailMark image', error);
    } finally {
      setExporting(false);
    }
  };
  const storyLength = Math.round((1800 + moments.length * speed) / 1000);
  return <SafeAreaView edges={['top', 'left', 'right']} style={s.screen}>
    <View style={[s.header, { borderBottomColor: `${noticingLenses[lensIndex].accent}35` }]}><Button label="Close" quiet tint={noticingLenses[lensIndex].accent} onPress={() => onClose(noticingLenses[lensIndex].id as StoryNoticeThemeId, mapStyle, storyThread)} /><Text style={[s.headerTitle, { color: noticingLenses[lensIndex].ink }]}>Make it yours</Text><Pressable accessibilityRole="button" accessibilityLabel={playing ? 'Pause replay' : finished ? 'Restart story' : active >= 0 ? 'Resume replay' : 'Play story'} onPress={togglePlayback} style={({ pressed }) => [s.playbackIconButton, { backgroundColor: `${noticingLenses[lensIndex].accent}14` }, pressed && s.pressed]}><TrailSymbol name={playing ? 'pause.fill' : finished ? 'arrow.counterclockwise' : 'play.fill'} androidName={playing ? 'pause' : finished ? 'replay' : 'play_arrow'} size={19} color={noticingLenses[lensIndex].accent} /></Pressable></View>
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView ref={composerScrollRef} keyboardShouldPersistTaps="handled" contentContainerStyle={s.composerContent}>
      <Animated.View ref={filmRef} collapsable={false} style={[s.film, noticeStyle, { opacity: themeFade }]}>
        <StoryMap route={route} moments={moments} active={active} mapStyle={mapStyle} reducedMotion={reducedMotion} hero />
        <View pointerEvents="none" style={s.filmTop}><Text style={s.filmBrand}>TrailMark</Text><Text style={s.filmMeta}>{active < 0 ? 'A trail story' : `Moment ${active + 1} of ${moments.length}`}</Text><Text style={[s.filmFocus, { color: noticingLenses[lensIndex].accent }]}>{noticingLenses[lensIndex].label}</Text></View>
        <View style={[s.filmCaption, { backgroundColor: noticingLenses[lensIndex].card, borderTopWidth: 5, borderTopColor: noticingLenses[lensIndex].accent }]}>
          {current ? <View style={s.filmPhotoRow}>
            {current.moment?.image ? <Image source={current.moment.image} contentFit="cover" style={[s.filmPhoto, s.filmPhotoOverride, { borderColor: noticingLenses[lensIndex].accent }]} /> : null}
            {currentAddition?.image ? <Image source={currentAddition.image} contentFit="cover" style={[s.filmPhoto, s.filmPhotoOverride, { borderColor: noticingLenses[lensIndex].accent }]} /> : null}
            <Pressable accessibilityRole="button" accessibilityLabel="Add a photo or thought to this moment" onPress={openAdd} style={({ pressed }) => [s.addMomentButton, { backgroundColor: `${noticingLenses[lensIndex].accent}35`, borderColor: noticingLenses[lensIndex].accent }, pressed && s.pressed]}><Text style={s.addMomentText}>＋</Text></Pressable>
          </View> : null}
          <Text style={[s.filmTitle, { color: noticingLenses[lensIndex].cardText }]}>{current ? current.moment?.title ?? 'A marked moment' : title}</Text>
          {current ? <Text style={s.filmDescription}>{showNotes && (currentAddition?.thought?.trim() || current.note.trim()) ? `“${currentAddition?.thought?.trim() || current.note.trim()}”` : 'A moment you chose to keep.'}</Text> : <View style={s.filmBadges}><View style={s.filmBadge}><Text style={s.filmBadgeText}>{moments.length} {moments.length === 1 ? 'moment' : 'moments'}</Text></View><View style={s.filmBadge}><Text style={s.filmBadgeText}>Yellowstone</Text></View><View style={s.filmBadge}><Text style={s.filmBadgeText}>{storyLength} sec</Text></View></View>}
        </View>
      </Animated.View>
      <View style={s.editorSection}>
        <Text style={[s.sectionHeading, { color: noticingLenses[lensIndex].ink }]}>Story details</Text>
        <Text style={[s.fieldLabel, { color: noticingLenses[lensIndex].accent }]}>Title</Text><TextInput accessibilityLabel="Story title" value={title} onChangeText={onTitle} maxLength={80} style={[s.titleInput, { borderColor: `${noticingLenses[lensIndex].accent}70` }]} placeholder="Name your walk" />
        <View style={s.summaryHeader}><Text style={[s.fieldLabel, s.summaryHeaderLabel, { color: noticingLenses[lensIndex].accent }]}>Story thread</Text><Pressable accessibilityRole="button" accessibilityLabel="Draft story thread" onPress={draftStoryThread} style={({ pressed }) => [s.summaryAction, { backgroundColor: `${noticingLenses[lensIndex].accent}18` }, pressed && s.pressed]}><TrailSymbol name="sparkles" androidName="auto_awesome" size={18} color={noticingLenses[lensIndex].accent} /></Pressable></View>
        <TextInput accessibilityLabel="Editable story thread" multiline textAlignVertical="top" value={storyThread} onChangeText={setStoryThread} style={[s.summaryInput, { borderColor: `${noticingLenses[lensIndex].accent}70` }]} />
        <View style={[s.settingGroup, { borderColor: `${noticingLenses[lensIndex].accent}38` }]}>
          <View style={s.settingRow}><View><Text style={[s.settingTitle, { color: noticingLenses[lensIndex].ink }]}>Story color</Text><Text style={[s.settingDetail, { color: noticingLenses[lensIndex].accent }]}>{noticingLenses[lensIndex].detail}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Choose story color" onPress={() => setColorPickerOpen(true)} style={({ pressed }) => [s.colorPickerTrigger, { borderColor: `${noticingLenses[lensIndex].accent}70`, backgroundColor: `${noticingLenses[lensIndex].accent}12` }, pressed && s.pressed]}><View style={[s.colorPickerSwatch, { backgroundColor: noticingLenses[lensIndex].accent }]} /><Text style={[s.colorPickerValue, { color: noticingLenses[lensIndex].accent }]}>{noticingLenses[lensIndex].short}</Text><Text style={[s.colorPickerChevron, { color: noticingLenses[lensIndex].accent }]}>⌄</Text></Pressable></View>
          <View style={s.settingDivider} />
          <View style={s.settingRow}><View><Text style={[s.settingTitle, { color: noticingLenses[lensIndex].ink }]}>Replay pace</Text><Text style={[s.settingDetail, { color: noticingLenses[lensIndex].accent }]}>How your moments unfold</Text></View><View style={s.segmented}><Pressable accessibilityRole="button" accessibilityState={{ selected: speed === 3600 }} onPress={() => setSpeed(3600)} style={[s.segment, speed === 3600 && { backgroundColor: noticingLenses[lensIndex].accent }]}><Text style={[s.segmentText, speed === 3600 && s.segmentTextActive, speed !== 3600 && { color: noticingLenses[lensIndex].accent }]}>Gentle</Text></Pressable><Pressable accessibilityRole="button" accessibilityState={{ selected: speed === 2400 }} onPress={() => setSpeed(2400)} style={[s.segment, speed === 2400 && { backgroundColor: noticingLenses[lensIndex].accent }]}><Text style={[s.segmentText, speed === 2400 && s.segmentTextActive, speed !== 2400 && { color: noticingLenses[lensIndex].accent }]}>Quick</Text></Pressable></View></View>
          <View style={s.settingDivider} />
          <View style={s.settingRow}><View><Text style={[s.settingTitle, { color: noticingLenses[lensIndex].ink }]}>Include my words</Text><Text style={[s.settingDetail, { color: noticingLenses[lensIndex].accent }]}>Show your reflections in the replay</Text></View><Switch accessibilityLabel="Include my reflection notes" value={showNotes} onValueChange={setShowNotes} trackColor={{ true: noticingLenses[lensIndex].accent }} /></View>
        </View>
      </View>
      <View style={s.mapMoodSection}><Text style={[s.sectionHeading, { color: noticingLenses[lensIndex].ink }]}>Map mood</Text><Text style={[s.secondary, { color: noticingLenses[lensIndex].accent }]}>Choose the atmosphere for your story.</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.moodScroller} contentContainerStyle={s.moodScrollFixed}>{mapMoodOptions.map((option) => <MapMoodOption key={option.id} option={option} selected={mapStyle === option.id} tint={noticingLenses[lensIndex].accent} onPress={() => setMapStyle(option.id)} />)}</ScrollView></View>
    </ScrollView>
    </KeyboardAvoidingView>
    <SafeAreaView edges={['bottom']} style={[s.composerDock, { backgroundColor: `${noticingLenses[lensIndex].accent}18`, borderTopColor: `${noticingLenses[lensIndex].accent}44` }]}><Pressable accessibilityRole="button" accessibilityLabel="Share story" onPress={() => setShareOptionsOpen(true)} style={({ pressed }) => [s.composerShareButton, { backgroundColor: noticingLenses[lensIndex].accent }, pressed && s.pressed]}><TrailSymbol name="square.and.arrow.up" androidName="share" size={17} color="#FFFFFF" /><Text style={s.composerShareText}>Share story</Text></Pressable></SafeAreaView>
    <View ref={stickerRef} collapsable={false} pointerEvents="none" style={s.stickerExport}><Sticker title={title} momentCount={moments.length} lens={noticingLenses[lensIndex]} style={stickerStyle} showsMeta={stickerShowsMeta} /></View>
    <View ref={stickerStoryRef} collapsable={false} pointerEvents="none" style={s.stickerStoryExport}>{stickerPhoto ? <><Image source={{ uri: stickerPhoto }} contentFit="cover" style={s.stickerStoryPhoto} /><View style={s.stickerStoryShade} /><View style={s.stickerStorySticker}><Sticker title={title} momentCount={moments.length} lens={noticingLenses[lensIndex]} style={stickerStyle} showsMeta={stickerShowsMeta} /></View></> : null}</View>
    <Modal visible={shareOptionsOpen} transparent animationType="fade" onRequestClose={() => setShareOptionsOpen(false)}>
      <View style={s.shareOverlay}><Pressable accessibilityLabel="Close share options" onPress={() => setShareOptionsOpen(false)} style={s.shareBackdrop} /><View style={s.shareSheet}><View style={s.sheetHandle} /><Text style={s.addTitle}>Share your story</Text><Text style={s.addSubtitle}>Take your TrailMark story with you.</Text>
        <Pressable accessibilityRole="button" disabled={exporting} onPress={() => void exportImage('card', 'share')} style={s.shareOption}><Text style={s.shareOptionTitle}>Share story card</Text><Text style={s.shareOptionDetail}>Map, moments, and story</Text></Pressable>
        <Pressable accessibilityRole="button" disabled={exporting} onPress={() => { setShareOptionsOpen(false); setStickerEditorOpen(true); }} style={s.shareOption}><Text style={s.shareOptionTitle}>Make a share sticker</Text><Text style={s.shareOptionDetail}>Add a title sticker to a photo</Text></Pressable>
        <Pressable accessibilityRole="button" disabled={exporting} onPress={() => void exportImage('card', 'save')} style={s.shareOption}><Text style={s.shareOptionTitle}>Save image</Text><Text style={s.shareOptionDetail}>Save the story card to Photos</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={shareText} style={s.shareOption}><Text style={s.shareOptionTitle}>Share story text</Text><Text style={s.shareOptionDetail}>Send the written story</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => setShareOptionsOpen(false)} style={s.addCancel}><Text style={s.addCancelText}>{exporting ? 'Preparing image…' : 'Cancel'}</Text></Pressable>
      </View></View>
    </Modal>
    <Modal visible={colorPickerOpen} transparent animationType="fade" onRequestClose={() => setColorPickerOpen(false)}>
      <View style={s.shareOverlay}><Pressable accessibilityLabel="Close story color picker" onPress={() => setColorPickerOpen(false)} style={s.shareBackdrop} /><View style={s.shareSheet}><View style={s.sheetHandle} /><Text style={s.addTitle}>Story color</Text><Text style={s.addSubtitle}>Choose the atmosphere for this story.</Text>{noticingLenses.map((lens, index) => <Pressable key={lens.id} accessibilityRole="radio" accessibilityState={{ selected: lensIndex === index }} onPress={() => chooseLens(index)} style={[s.colorPickerOption, lensIndex === index && { borderColor: lens.accent, backgroundColor: `${lens.accent}12` }]}><View style={[s.colorPickerOptionSwatch, { backgroundColor: lens.accent }]} /><View style={s.colorPickerOptionCopy}><Text style={[s.colorPickerOptionTitle, { color: lens.ink }]}>{lens.short}</Text><Text style={s.colorPickerOptionDetail}>{lens.detail}</Text></View>{lensIndex === index ? <Text style={[s.colorPickerCheck, { color: lens.accent }]}>✓</Text> : null}</Pressable>)}<Pressable accessibilityRole="button" onPress={() => setColorPickerOpen(false)} style={s.addCancel}><Text style={s.addCancelText}>Cancel</Text></Pressable></View></View>
    </Modal>
    <Modal visible={stickerEditorOpen} transparent animationType="fade" onRequestClose={() => setStickerEditorOpen(false)}>
      <View style={s.stickerOverlay}><Pressable accessibilityLabel="Close sticker editor" onPress={() => setStickerEditorOpen(false)} style={s.shareBackdrop} /><View style={s.stickerSheet}><View style={s.sheetHandle} /><Text style={[s.addTitle, { color: noticingLenses[lensIndex].ink }]}>Share sticker</Text><Text style={[s.addSubtitle, { color: noticingLenses[lensIndex].accent }]}>Add it to a photo, or send it on its own.</Text>
        <View style={[s.stickerPreview, { backgroundColor: stickerStyle === 'dark' ? noticingLenses[lensIndex].card : noticingLenses[lensIndex].accentSoft }]}>{stickerPhoto ? <Image source={{ uri: stickerPhoto }} contentFit="cover" style={s.stickerPreviewPhoto} /> : null}<View style={s.stickerPreviewSticker}><Sticker title={title} momentCount={moments.length} lens={noticingLenses[lensIndex]} style={stickerStyle} showsMeta={stickerShowsMeta} preview /></View></View>
        <Text style={s.stickerControlLabel}>Background</Text><View style={s.stickerChoices}><Pressable accessibilityRole="button" onPress={pickStickerPhoto} style={s.stickerChoice}><Text style={s.stickerChoiceTitle}>{stickerPhoto ? 'Change photo' : 'Add a photo'}</Text><Text style={s.stickerChoiceDetail}>From your camera roll</Text></Pressable><Pressable accessibilityRole="button" onPress={() => setStickerPhoto(null)} style={[s.stickerChoice, !stickerPhoto && s.stickerChoiceSelected]}><Text style={s.stickerChoiceTitle}>Sticker only</Text><Text style={s.stickerChoiceDetail}>Transparent PNG</Text></Pressable></View>
        <Text style={[s.stickerControlLabel, s.stickerStyleLabel, { color: noticingLenses[lensIndex].ink }]}>Sticker tone</Text><View style={s.stickerChoices}><Pressable accessibilityRole="radio" accessibilityState={{ selected: stickerStyle === 'light' }} onPress={() => setStickerStyle('light')} style={[s.stickerChoice, { borderColor: noticingLenses[lensIndex].accentSoft }, stickerStyle === 'light' && { borderColor: noticingLenses[lensIndex].accent, backgroundColor: noticingLenses[lensIndex].surface }]}><Text style={s.stickerChoiceTitle}>Light</Text></Pressable><Pressable accessibilityRole="radio" accessibilityState={{ selected: stickerStyle === 'dark' }} onPress={() => setStickerStyle('dark')} style={[s.stickerChoice, { borderColor: noticingLenses[lensIndex].accentSoft }, stickerStyle === 'dark' && { borderColor: noticingLenses[lensIndex].accent, backgroundColor: noticingLenses[lensIndex].surface }]}><Text style={s.stickerChoiceTitle}>Dark</Text></Pressable></View>
        <View style={s.stickerMetaRow}><Text style={[s.stickerControlLabel, { color: noticingLenses[lensIndex].ink }]}>Include trip details</Text><View style={[s.inlineChoices, { backgroundColor: noticingLenses[lensIndex].accentSoft }]}><Pressable accessibilityRole="radio" accessibilityState={{ selected: stickerShowsMeta }} onPress={() => setStickerShowsMeta(true)} style={[s.inlineChoice, stickerShowsMeta && { backgroundColor: noticingLenses[lensIndex].accent }]}><Text style={[s.inlineChoiceText, stickerShowsMeta && s.inlineChoiceTextActive]}>On</Text></Pressable><Pressable accessibilityRole="radio" accessibilityState={{ selected: !stickerShowsMeta }} onPress={() => setStickerShowsMeta(false)} style={[s.inlineChoice, !stickerShowsMeta && { backgroundColor: noticingLenses[lensIndex].accent }]}><Text style={[s.inlineChoiceText, !stickerShowsMeta && s.inlineChoiceTextActive]}>Off</Text></Pressable></View></View>
        <Pressable accessibilityRole="button" disabled={exporting} onPress={() => void exportImage('sticker', 'share')} style={({ pressed }) => [s.stickerShareButton, { backgroundColor: noticingLenses[lensIndex].accent }, pressed && s.pressed]}><TrailSymbol name="square.and.arrow.up" androidName="share" size={17} color="#FFFFFF" /><Text style={s.composerShareText}>{exporting ? 'Preparing sticker…' : 'Share to apps'}</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => setStickerEditorOpen(false)} style={s.addCancel}><Text style={s.addCancelText}>Not now</Text></Pressable>
      </View></View>
    </Modal>
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
  const palette = storyMapPalettes[mapStyle];
  return <Mapbox.MapView key={styleURL} style={s.flex} styleURL={styleURL} onWillStartLoadingMap={() => setLoaded(false)} onDidFinishLoadingStyle={() => setLoaded(true)} scrollEnabled={false} zoomEnabled={false} rotateEnabled={false} pitchEnabled={false} logoEnabled={false} attributionEnabled={false} compassEnabled={false} scaleBarEnabled={false}>
    <Mapbox.Camera ref={camera} defaultSettings={{ centerCoordinate: center, zoomLevel: 13.5 }} />
    {loaded && mapStyle === 'terrain' ? <Mapbox.RasterDemSource id="recap-dem" url="mapbox://mapbox.mapbox-terrain-dem-v1"><Mapbox.Terrain style={{ exaggeration: 1 }} /></Mapbox.RasterDemSource> : null}
    {loaded && route ? <Mapbox.ShapeSource id="recap-route" shape={route}><Mapbox.LineLayer id="recap-route-line" style={{ lineColor: palette.trail, lineWidth: 4, lineCap: 'round', lineJoin: 'round' }} /></Mapbox.ShapeSource> : null}
    {loaded && progressRoute ? <Mapbox.ShapeSource id="story-progress-route" shape={progressRoute}><Mapbox.LineLayer id="story-progress-route-line" style={{ lineColor: palette.progress, lineWidth: 6, lineCap: 'round', lineJoin: 'round', lineOpacity: 0.95 }} /></Mapbox.ShapeSource> : null}
    {loaded && markerFeatures ? <Mapbox.ShapeSource id="story-markers" shape={markerFeatures} hitbox={{ width: 24, height: 24 }}>
      <Mapbox.CircleLayer id="story-moment-circles" filter={['==', ['get', 'kind'], 'moment']} style={{ circleColor: palette.trail, circleRadius: ['case', ['==', ['get', 'index'], active], 10, 7], circleStrokeColor: palette.edgeFill, circleStrokeWidth: 2 }} />
      <Mapbox.SymbolLayer id="story-moment-labels" filter={['==', ['get', 'kind'], 'moment']} style={{ textField: ['get', 'label'], textColor: palette.edgeText, textSize: 11, textFont: ['Open Sans Bold'], textAllowOverlap: true, textIgnorePlacement: true }} />
      <Mapbox.CircleLayer id="story-edge-circles" filter={['in', ['get', 'kind'], ['literal', ['start', 'finish']]]} style={{ circleColor: palette.edgeFill, circleRadius: 8, circleStrokeColor: palette.edgeStroke, circleStrokeWidth: 2 }} />
      <Mapbox.SymbolLayer id="story-edge-labels" filter={['in', ['get', 'kind'], ['literal', ['start', 'finish']]]} style={{ textField: ['get', 'label'], textColor: palette.edgeText, textSize: 10, textFont: ['Open Sans Bold'], textOffset: [0, 2.1], textAllowOverlap: true, textIgnorePlacement: true }} />
    </Mapbox.ShapeSource> : null}
  </Mapbox.MapView>;
}

function Sticker({ title, momentCount, lens, style, showsMeta, preview = false }: { title: string; momentCount: number; lens: typeof noticingLenses[number]; style: 'light' | 'dark'; showsMeta: boolean; preview?: boolean }) {
  const dark = style === 'dark';
  return <View style={[s.stickerShape, preview && s.stickerShapePreview, { backgroundColor: dark ? lens.card : lens.surface, borderColor: dark ? lens.cardText : lens.accentSoft, borderWidth: dark ? 0 : 1 }]}>
    <Text style={[s.stickerEyebrow, preview && s.stickerEyebrowPreview, { color: dark ? lens.cardText : lens.ink }]}>TRAILMARK</Text>
    <Text numberOfLines={2} style={[s.stickerTitle, preview && s.stickerTitlePreview, { color: dark ? '#FFFFFF' : lens.ink }]}>{title}</Text>
    {showsMeta ? <Text style={[s.stickerMeta, preview && s.stickerMetaPreview, { color: dark ? lens.cardText : lens.accent }]}>{momentCount} {momentCount === 1 ? 'moment' : 'moments'} · Yellowstone</Text> : null}
  </View>;
}

function Button({ label, onPress, quiet = false, tint = '#226C4A' }: { label: string; onPress: () => void; quiet?: boolean; tint?: string }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [quiet ? s.quietButton : s.primaryButton, !quiet && { backgroundColor: tint }, pressed && s.pressed]}><Text style={[quiet ? s.quietText : s.primaryText, quiet && { color: tint }]}>{label}</Text></Pressable>;
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
  if (!focus.trim() || focus.toLowerCase().includes('color')) {
    const memoryLine = remembered.length ? `At ${remembered[0].title}, you wrote “${remembered[0].note}”${remembered.length > 1 ? `, then carried that color story toward ${remembered[remembered.length - 1].title}.` : '.'}` : 'The memory stayed with the changing bands of color along the walk.';
    return `From ${firstPlace} through ${riverPlace} and ${climbPlace}, the Firehole River and climbing trail changed the colors around you. At ${finalPlace}, Grand Prismatic and Midway Geyser Basin opened into view, with blue water surrounded by orange, yellow, green, and brown bands. ${memoryLine}`;
  }
  const focusLine = focus ? `You set out to notice ${focus.toLowerCase()} along the trail.` : 'You moved through the trail with attention to what changed around you.';
  const placeLine = `From ${firstPlace} to ${finalPlace}, the story follows what held your attention through the trail.`;
  const memoryLine = remembered.length ? `At ${remembered[0].title}, you wrote “${remembered[0].note}”${remembered.length > 1 ? ' Those words became part of the walk too.' : ''}` : 'You kept a few places that made the walk feel like more than a route.';
  return `${focusLine} ${placeLine} ${memoryLine}`;
}
function MapMoodOption({ option, selected, tint, onPress }: { option: { id: StoryMapStyle; label: string; colors: [string, string] }; selected: boolean; tint: string; onPress: () => void }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={`${option.label} map mood`} onPress={onPress} style={({ pressed }) => [s.moodOption, selected && { borderWidth: 2, borderColor: tint, padding: 4 }, pressed && s.pressed]}><View style={[s.moodSwatch, { backgroundColor: option.colors[0] }]}><View style={[s.moodRiver, { backgroundColor: option.colors[1] }]} /><View style={[s.moodRoute, { backgroundColor: tint }]} /></View><Text numberOfLines={1} style={[s.moodLabel, selected && { color: tint, fontWeight: '800' }]}>{selected ? `✓ ${option.label}` : option.label}</Text></Pressable>;
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
  shareOverlay: { flex: 1, justifyContent: 'flex-end' }, shareBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(12,24,18,0.34)' }, shareSheet: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 30, borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: '#F5F7F3' }, sheetHandle: { alignSelf: 'center', width: 38, height: 5, marginBottom: 16, borderRadius: 3, backgroundColor: '#C5D0C8' }, shareOption: { minHeight: 62, justifyContent: 'center', paddingHorizontal: 15, marginTop: 9, borderRadius: 15, borderWidth: 1, borderColor: '#DCE4D9', backgroundColor: '#FFFFFF' }, shareOptionTitle: { color: '#18271E', fontSize: 16, fontWeight: '700' }, shareOptionDetail: { color: '#4D6053', fontSize: 13, marginTop: 3 },
  stickerExport: { position: 'absolute', left: -2000, top: 0, width: 900, height: 420, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' }, stickerStoryExport: { position: 'absolute', left: -2000, top: 0, width: 900, height: 1600, overflow: 'hidden', backgroundColor: '#18271E' }, stickerStoryPhoto: { ...StyleSheet.absoluteFill }, stickerStoryShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(12,20,15,0.18)' }, stickerStorySticker: { position: 'absolute', left: 0, right: 0, bottom: 176, alignItems: 'center' }, stickerShape: { maxWidth: 820, paddingHorizontal: 54, paddingVertical: 42, borderRadius: 44, alignItems: 'center' }, stickerShapeLight: { backgroundColor: '#F7F8F4', borderWidth: 1, borderColor: '#DCE4D9' }, stickerShapeDark: { backgroundColor: '#18271E' }, stickerEyebrow: { fontSize: 25, fontWeight: '900', letterSpacing: 3 }, stickerTextLight: { color: '#355142' }, stickerTextDark: { color: '#C9E3CD' }, stickerTitle: { color: '#18271E', fontSize: 56, fontWeight: '900', marginTop: 14, textAlign: 'center' }, stickerTitleDark: { color: '#FFFFFF' }, stickerMeta: { fontSize: 25, fontWeight: '700', marginTop: 8 }, stickerMetaLight: { color: '#526158' }, stickerMetaDark: { color: '#D5E2D7' },
  stickerOverlay: { flex: 1, justifyContent: 'flex-end' }, stickerSheet: { minHeight: '82%', paddingHorizontal: 22, paddingTop: 12, paddingBottom: 28, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: '#F5F7F3' }, stickerPreview: { height: 248, alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 16, borderRadius: 24, overflow: 'hidden' }, stickerPreviewPhoto: { ...StyleSheet.absoluteFill }, stickerPreviewSticker: { alignItems: 'center', width: '88%' }, stickerShapePreview: { maxWidth: '100%', paddingHorizontal: 28, paddingVertical: 24, borderRadius: 28 }, stickerEyebrowPreview: { fontSize: 13, letterSpacing: 1.8 }, stickerTitlePreview: { fontSize: 31, lineHeight: 35, marginTop: 8 }, stickerMetaPreview: { fontSize: 14, marginTop: 7 }, stickerControlLabel: { color: '#18271E', fontSize: 15, fontWeight: '700' }, stickerStyleLabel: { marginTop: 14 }, stickerChoices: { flexDirection: 'row', gap: 10, marginTop: 8 }, stickerChoice: { flex: 1, minHeight: 54, justifyContent: 'center', paddingHorizontal: 13, borderWidth: 1, borderRadius: 14, borderColor: '#DCE4D9', backgroundColor: '#FFFFFF' }, stickerChoiceSelected: { borderWidth: 2, borderColor: '#226C4A', backgroundColor: '#F2F7F0' }, stickerChoiceTitle: { color: '#18271E', fontSize: 15, fontWeight: '800' }, stickerChoiceDetail: { color: '#4D6053', fontSize: 12, marginTop: 2 }, stickerMetaRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingHorizontal: 2 }, inlineChoices: { flexDirection: 'row', padding: 3, borderRadius: 12 }, inlineChoice: { minWidth: 42, minHeight: 30, paddingHorizontal: 8, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }, inlineChoiceText: { color: '#4D6053', fontSize: 13, fontWeight: '800' }, inlineChoiceTextActive: { color: '#FFFFFF' }, stickerMetaDetail: { color: '#4D6053', fontSize: 13, marginTop: 3 }, stickerShareButton: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 18, marginTop: 4 },
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
  secondary: { fontSize: 14, lineHeight: 20, color: '#4D6053' }, momentIntro: { paddingTop: 28, paddingBottom: 24 }, sectionTitle: { fontSize: 22, fontWeight: '700', color: '#18271E', letterSpacing: -0.35, marginBottom: 6 }, nodSummary: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 13, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: '#E9EFE5' }, nodSummaryIcon: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#CDE5D1' }, nodSummaryText: { color: '#226C4A', fontSize: 12, fontWeight: '800' },
  chapter: { marginBottom: 32 }, chapterHeading: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }, number: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#DFEBDD', alignItems: 'center', justifyContent: 'center' }, numberText: { color: '#226C4A', fontSize: 13, fontWeight: '700' }, chapterTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#18271E' }, chapterImage: { width: '100%', aspectRatio: 1.28, borderRadius: 20 }, chapterAdditionalImage: { width: '100%', aspectRatio: 1.55, borderRadius: 16, marginTop: 10 }, chapterQuote: { fontSize: 22, lineHeight: 30, color: '#18271E', marginTop: 16, fontWeight: '500' }, chapterAdditionQuote: { fontSize: 18, lineHeight: 26, color: '#355142', marginTop: 12, fontWeight: '500' }, context: { fontSize: 15, lineHeight: 23, color: '#4D6053', marginTop: 10 }, chapterAdd: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', gap: 6, marginTop: 20, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: '#C9DACB', backgroundColor: '#F4F8F0' }, chapterAddPlus: { fontSize: 22, lineHeight: 23, fontWeight: '500' }, chapterAddText: { fontSize: 13, fontWeight: '800' },
  colorPickerTrigger: { minWidth: 106, minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 10, borderRadius: 13, borderWidth: 1 }, colorPickerSwatch: { width: 11, height: 11, borderRadius: 6 }, colorPickerValue: { fontSize: 12, fontWeight: '800' }, colorPickerChevron: { fontSize: 17, lineHeight: 17, marginTop: -4 }, colorPickerOption: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, marginTop: 9, borderRadius: 15, borderWidth: 1, borderColor: '#DCE4D9', backgroundColor: '#FFFFFF' }, colorPickerOptionSwatch: { width: 18, height: 18, borderRadius: 9 }, colorPickerOptionCopy: { flex: 1 }, colorPickerOptionTitle: { fontSize: 15, fontWeight: '800' }, colorPickerOptionDetail: { color: '#4D6053', fontSize: 12, marginTop: 2 }, colorPickerCheck: { fontSize: 19, fontWeight: '800' },
  dock: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 10, borderTopWidth: 1, borderTopColor: '#DCE4D9', backgroundColor: '#F5F7F3' }, primaryButton: { minHeight: 54, borderRadius: 18, backgroundColor: '#226C4A', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 }, primaryText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' }, quietButton: { minHeight: 44, paddingHorizontal: 10, justifyContent: 'center' }, quietText: { fontSize: 15, fontWeight: '600', color: '#226C4A' }, pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  composerDock: { paddingHorizontal: 18, paddingTop: 10, backgroundColor: '#F5F7F3', borderTopWidth: 1, borderTopColor: '#DCE4D9' }, composerShareButton: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 18, backgroundColor: '#226C4A' }, composerShareText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  composerContent: { paddingHorizontal: 18, paddingTop: 0, maxWidth: 600, width: '100%', alignSelf: 'center', paddingBottom: 44 }, film: { height: 500, overflow: 'hidden', borderRadius: 28, backgroundColor: '#DFEBDD' }, filmTop: { position: 'absolute', top: 16, left: 16, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 14, backgroundColor: 'rgba(245,247,243,0.94)' }, filmBrand: { fontSize: 14, fontWeight: '800', color: '#18271E' }, filmMeta: { fontSize: 12, color: '#4D6053', marginTop: 1 }, filmCaption: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingTop: 34, backgroundColor: 'rgba(24,39,30,0.88)' }, filmPhoto: { width: 86, height: 64, borderRadius: 10, marginBottom: 10 }, filmTitle: { fontSize: 27, lineHeight: 31, fontWeight: '800', letterSpacing: -0.6, color: '#FFFFFF' }, filmDescription: { fontSize: 14, lineHeight: 20, color: '#DCE8DD', marginTop: 7 }, filmBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 }, filmBadge: { minHeight: 28, justifyContent: 'center', paddingHorizontal: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)' }, filmBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' }, editorSection: { marginTop: 30, marginBottom: 30 }, sectionHeading: { fontSize: 22, fontWeight: '700', color: '#18271E', letterSpacing: -0.3, marginBottom: 16 }, fieldLabel: { fontSize: 15, fontWeight: '600', color: '#18271E', marginBottom: 8 }, titleInput: { minHeight: 54, padding: 14, borderWidth: 1, borderColor: '#C6D3C5', borderRadius: 15, color: '#18271E', fontSize: 17, backgroundColor: '#FFFFFF' }, settingGroup: { marginTop: 16, paddingHorizontal: 16, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCE4D9' }, settingRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 }, settingTitle: { fontSize: 16, fontWeight: '600', color: '#18271E' }, settingDetail: { maxWidth: 190, fontSize: 13, lineHeight: 18, color: '#4D6053', marginTop: 3 }, settingDivider: { height: 1, backgroundColor: '#E3E9E1' }, segmented: { flexDirection: 'row', padding: 3, borderRadius: 11, backgroundColor: '#E9EFE5' }, segment: { minHeight: 34, paddingHorizontal: 10, borderRadius: 8, justifyContent: 'center' }, segmentActive: { backgroundColor: '#226C4A' }, segmentText: { color: '#4D6053', fontSize: 13, fontWeight: '600' }, segmentTextActive: { color: '#FFFFFF' }, mapMoodSection: { marginBottom: 10 }, moodScroll: { gap: 10, paddingTop: 14, paddingBottom: 8, paddingRight: 18 }, moodOption: { width: 104, padding: 5, borderRadius: 16, borderWidth: 1, borderColor: '#D5E0D2', backgroundColor: '#FFFFFF' }, moodOptionSelected: { borderWidth: 2, borderColor: '#226C4A', padding: 4 }, moodSwatch: { height: 76, overflow: 'hidden', borderRadius: 11, justifyContent: 'center' }, moodRiver: { position: 'absolute', height: 21, width: 130, backgroundColor: '#9BC9CF', transform: [{ rotate: '-24deg' }] }, moodRoute: { width: 94, height: 3, borderRadius: 2, backgroundColor: '#226C4A', transform: [{ rotate: '22deg' }] }, moodLabel: { color: '#4D6053', fontSize: 12, fontWeight: '600', marginTop: 8, marginBottom: 3, textAlign: 'center' }, moodLabelSelected: { color: '#226C4A', fontWeight: '800' }, mapPin: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#FFFFFF', backgroundColor: '#226C4A', alignItems: 'center', justifyContent: 'center' }, activePin: { width: 36, height: 36, borderRadius: 18, borderWidth: 3 }, pinText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' }, edgePin: { minHeight: 26, paddingHorizontal: 9, borderRadius: 13, borderWidth: 2, borderColor: '#226C4A', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }, finishPin: { backgroundColor: '#226C4A' }, edgePinText: { color: '#226C4A', fontSize: 11, fontWeight: '800' }, finishPinText: { color: '#FFFFFF' },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 8 }, summaryHeaderLabel: { marginBottom: 0 }, summaryAction: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E9EFE5' }, summaryInput: { minHeight: 100, padding: 14, borderWidth: 1, borderColor: '#C6D3C5', borderRadius: 16, color: '#18271E', fontSize: 15, lineHeight: 21, backgroundColor: '#FFFFFF' }, storyLensSection: { marginTop: 18, padding: 16, borderRadius: 18, backgroundColor: '#F4F8EF', borderWidth: 1, borderColor: '#DCE8D9' }, storyLensHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, storyLensValue: { maxWidth: 145, fontSize: 13, fontWeight: '800', textAlign: 'right' }, lensSlider: { paddingTop: 18, paddingBottom: 2 }, lensTrack: { height: 4, marginHorizontal: 16, borderRadius: 2, backgroundColor: '#D8E5DA' }, lensTrackFill: { height: 4, borderRadius: 2 }, lensOptions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -10 }, lensOption: { alignItems: 'center', gap: 7 }, lensDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 3, borderColor: '#F4F8EF' }, lensDotSelected: { width: 24, height: 24, borderRadius: 12, borderWidth: 4, borderColor: '#FFFFFF', shadowColor: '#233128', shadowOpacity: 0.16, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 }, lensLabel: { color: '#4D6053', fontSize: 11, fontWeight: '600' }, lensLabelSelected: { color: '#18271E', fontWeight: '800' }, storyLensDetail: { color: '#226C4A', fontSize: 13, fontWeight: '700', marginTop: 4 }, noticeSegments: { flexDirection: 'row', padding: 3, borderRadius: 11, backgroundColor: '#E9EFE5' },
});
