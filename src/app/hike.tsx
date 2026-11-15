import Mapbox from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import type { Feature, LineString, Position } from 'geojson';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getPublishedTrail } from '@/lib/trails';
import { getNoticingPrompt, grandPrismaticMoments } from '@/lib/trail-moments';
import { clearActiveHikeDraft, getActiveHikeDraft, saveActiveHikeDraft, type CapturedTrailMoment } from '@/lib/trail-stories';
import { isNodConnected } from '@/lib/onboarding';
import { getLiveMapStyle, type LiveMapStyle } from '@/lib/trailmark-preferences';
import { startHikeBackgroundTracking, stopHikeBackgroundTracking } from '@/lib/hike-background';

const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
const fallbackMarkCoordinate: Position = [-110.836, 44.520];
const routeCenter: Position = [-110.836, 44.520];
const storyCameraPadding = { paddingTop: 75, paddingBottom: 250, paddingLeft: 24, paddingRight: 24 };
const anchorCameraPadding = { paddingTop: 80, paddingBottom: 340, paddingLeft: 24, paddingRight: 24 };
type MarkSource = 'nod' | 'phone';
type TrailAnchor = {
  title: string;
  subtitle: string;
  context: string;
  image: number;
};

type NearbyFeature = TrailAnchor & {
  id: string;
  coordinate: Position;
};

const excelsiorImage = require('../../assets/trails/grand-prismatic/excelsior.jpg');
const midwayImage = require('../../assets/trails/grand-prismatic/midway.jpg');
const gooseLakeImage = require('../../assets/trails/grand-prismatic/goose-lake-context.jpg');
const grandPrismaticSpringImage = require('../../assets/trails/grand-prismatic/grand-prismatic-spring.jpg');
const porcupineHillsImage = require('../../assets/trails/grand-prismatic/twin-buttes-view.jpg');
const morningGloryImage = require('../../assets/trails/grand-prismatic/morning-glory-pool.jpg');
const geyserHillImage = require('../../assets/trails/grand-prismatic/geyser-hill.jpg');
const fairyMeadowsImage = require('../../assets/trails/grand-prismatic/fairy-falls.jpg');
const mysticFallsImage = require('../../assets/trails/grand-prismatic/mystic-falls.jpg');
const imperialMeadowsImage = require('../../assets/trails/grand-prismatic/overlook.jpg');
const storyMomentImages = [
  require('../../assets/trails/grand-prismatic/trailhead.jpg'),
  require('../../assets/trails/grand-prismatic/midway.jpg'),
  require('../../assets/trails/grand-prismatic/spring.jpg'),
  require('../../assets/trails/grand-prismatic/overlook.jpg'),
];

const trailAnchors: TrailAnchor[] = [
  {
    title: 'Fairy Falls trailhead',
    subtitle: 'Start of the walk',
    context: 'The route begins near the Firehole River and the Fairy Falls parking area.',
    image: require('../../assets/trails/grand-prismatic/trailhead.jpg'),
  },
  {
    title: 'Grand Prismatic Overlook',
    subtitle: 'Destination',
    context: 'The trail climbs to an elevated view over Grand Prismatic Spring and Midway Geyser Basin.',
    image: require('../../assets/trails/grand-prismatic/overlook.jpg'),
  },
];

const nearbyFeatures: NearbyFeature[] = [
  {
    id: 'excelsior-geyser',
    title: 'Excelsior Geyser Crater',
    subtitle: 'Nearby feature',
    context: 'A massive hot spring crater in Midway Geyser Basin that discharges into the Firehole River.',
    image: excelsiorImage,
    coordinate: [-110.8369, 44.52628],
  },
  {
    id: 'midway-geyser-basin',
    title: 'Midway Geyser Basin',
    subtitle: 'Nearby feature',
    context: 'A compact hydrothermal basin home to Excelsior Geyser and Grand Prismatic Spring.',
    image: midwayImage,
    coordinate: [-110.836253, 44.528424],
  },
  {
    id: 'goose-lake',
    title: 'Goose Lake',
    subtitle: 'Nearby lake',
    context: 'A lake in the Lower Geyser Basin, surrounded by the forests and thermal landscapes of Yellowstone.',
    image: gooseLakeImage,
    coordinate: [-110.84237, 44.54135],
  },
  {
    id: 'grand-prismatic-spring',
    title: 'Grand Prismatic Spring',
    subtitle: 'Nearby feature',
    context: 'Yellowstone’s largest hot spring, viewed from the overlook across Midway Geyser Basin.',
    image: grandPrismaticSpringImage,
    coordinate: [-110.83819, 44.52505],
  },
  {
    id: 'porcupine-hills',
    title: 'Porcupine Hills',
    subtitle: 'Nearby ridgeline',
    context: 'A higher, quieter stretch of forest and open hillside beyond the main thermal basin.',
    image: porcupineHillsImage,
    coordinate: [-110.8069, 44.5694],
  },
  {
    id: 'morning-glory-pool',
    title: 'Morning Glory Pool',
    subtitle: 'Upper Geyser Basin',
    context: 'A vivid hot spring along the Upper Geyser Basin boardwalk, known for its changing bands of color.',
    image: morningGloryImage,
    coordinate: [-110.8435, 44.4750],
  },
  {
    id: 'geyser-hill',
    title: 'Geyser Hill',
    subtitle: 'Upper Geyser Basin',
    context: 'A boardwalk loop through a dense collection of geysers, springs, and steaming ground near Old Faithful.',
    image: geyserHillImage,
    coordinate: [-110.8295, 44.4638],
  },
  {
    id: 'fairy-meadows',
    title: 'Fairy Meadows',
    subtitle: 'Backcountry campsite',
    context: 'A backcountry campsite reached from the Fairy Falls area, set just off the main trail in the forested thermal landscape.',
    image: fairyMeadowsImage,
    coordinate: [-110.85566836, 44.52584032],
  },
  {
    id: 'mystic-falls',
    title: 'Mystic Falls',
    subtitle: 'Waterfall trail',
    context: 'A waterfall on the Little Firehole River, reached from the Biscuit Basin side of the park.',
    image: mysticFallsImage,
    coordinate: [-110.8739, 44.4842],
  },
  {
    id: 'imperial-meadows',
    title: 'Imperial Meadows',
    subtitle: 'Hiking trail',
    context: 'A meadow route near the Imperial Geyser and Fairy Falls area, extending beyond the main thermal basin.',
    image: imperialMeadowsImage,
    coordinate: [-110.8493, 44.5506],
  },
];

function isNearbyFeature(anchor: TrailAnchor): anchor is NearbyFeature {
  return 'id' in anchor;
}

if (mapboxToken) Mapbox.setAccessToken(mapboxToken);

export default function HikeScreen() {
  const { slug, focusId, notice } = useLocalSearchParams<{ slug?: string; focusId?: string; notice?: string }>();
  const nodConnected = isNodConnected();
  const storedDraft = getActiveHikeDraft();
  const matchingDraft = storedDraft?.slug === (slug ?? 'grand-prismatic-overlook') ? storedDraft : undefined;
  const cameraRef = useRef<Mapbox.Camera>(null);
  const storyCameraTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const arrivalCameraTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const routeDrawDelay = useRef<ReturnType<typeof setTimeout> | null>(null);
  const routeDrawFrame = useRef<number | null>(null);
  const hasPlayedArrivalCamera = useRef(false);
  const hasPlayedRouteDraw = useRef(false);
  const markingRef = useRef(false);
  const markSequenceRef = useRef(matchingDraft?.marks.length ?? 0);
  const [routeShape, setRouteShape] = useState<Feature<LineString> | null>(null);
  const [routeDrawProgress, setRouteDrawProgress] = useState(0);
  const [liveMapStyle, setLiveMapStyle] = useState<LiveMapStyle>(getLiveMapStyle());
  const [zoomLevel, setZoomLevel] = useState(14.5);
  const [trailName, setTrailName] = useState('Grand Prismatic Overlook');
  const [noticingFocus] = useState(() => matchingDraft?.noticingFocus ?? notice?.trim() ?? '');
  const [noticingFocusId] = useState(() => matchingDraft?.noticingFocusId ?? focusId);
  const [markedMoments, setMarkedMoments] = useState<CapturedTrailMoment[]>(() => matchingDraft?.marks ?? []);
  const [latestMarkId, setLatestMarkId] = useState<string | null>(() => matchingDraft?.marks[matchingDraft.marks.length - 1]?.id ?? null);
  const [lastMarkedTitle, setLastMarkedTitle] = useState<string | null>(null);
  const [showMarkNotice, setShowMarkNotice] = useState(false);
  const [nodSheetOpen, setNodSheetOpen] = useState(false);
  const [markNoticeOpacity] = useState(() => new Animated.Value(1));
  const [markNoticeOffset] = useState(() => new Animated.Value(0));
  const [nodConnectionPulse] = useState(() => new Animated.Value(1));
  const [markBloomScale] = useState(() => new Animated.Value(0.8));
  const [markBloomOpacity] = useState(() => new Animated.Value(0));
  const [selectedAnchor, setSelectedAnchor] = useState<TrailAnchor | null>(null);
  const [nextWalkTitle, setNextWalkTitle] = useState<string | null>(null);
  const [anchorSheetOffset] = useState(() => new Animated.Value(360));
  const [actionsOpacity] = useState(() => new Animated.Value(1));
  const [actionsOffset] = useState(() => new Animated.Value(0));
  const [showGuidance, setShowGuidance] = useState(true);
  const [storyIntro, setStoryIntro] = useState(false);
  const [storyStyleLoaded, setStoryStyleLoaded] = useState(true);
  const [storyIndex, setStoryIndex] = useState<number | null>(null);
  const [storyProgressIndex, setStoryProgressIndex] = useState<number | null>(null);
  const [storyNote, setStoryNote] = useState('');
  const [storyRevealed, setStoryRevealed] = useState(false);
  const [storyReviewing, setStoryReviewing] = useState(false);
  const [storySheetOpen, setStorySheetOpen] = useState(false);
  const [storyNotes, setStoryNotes] = useState<string[]>(() => matchingDraft?.notes ?? []);
  const [storySheetOffset] = useState(() => new Animated.Value(420));
  const [storyPulse] = useState(() => new Animated.Value(1));
  const [storyImageIndex, setStoryImageIndex] = useState(0);
  const [storyImageOpacity] = useState(() => new Animated.Value(1));
  const [guidanceOpacity] = useState(() => new Animated.Value(1));
  const [guidanceOffset] = useState(() => new Animated.Value(0));
  const [nodSheetOffset] = useState(() => new Animated.Value(360));
  const guidanceDismissed = useRef(false);
  useFocusEffect(useCallback(() => {
    setLiveMapStyle(getLiveMapStyle());
  }, []));
  useEffect(() => () => {
    if (storyCameraTimer.current) clearTimeout(storyCameraTimer.current);
    if (arrivalCameraTimer.current) clearTimeout(arrivalCameraTimer.current);
    if (routeDrawDelay.current) clearTimeout(routeDrawDelay.current);
    if (routeDrawFrame.current) cancelAnimationFrame(routeDrawFrame.current);
  }, []);

  useEffect(() => {
    if (!nodConnected) return;
    const pulse = Animated.loop(Animated.sequence([
      Animated.delay(4200),
      Animated.timing(nodConnectionPulse, { toValue: 1.13, duration: 260, useNativeDriver: true }),
      Animated.timing(nodConnectionPulse, { toValue: 1, duration: 420, useNativeDriver: true }),
    ]));
    pulse.start();
    return () => pulse.stop();
  }, [nodConnected, nodConnectionPulse]);

  useEffect(() => {
    void Location.requestForegroundPermissionsAsync();
    if (slug) void getPublishedTrail(slug).then((trail) => {
      setRouteShape(trail?.route_geojson ?? null);
      if (trail?.name) setTrailName(trail.name.replace(/ Trail$/, ''));
    });
  }, [slug]);

  useEffect(() => {
    void startHikeBackgroundTracking();
    return () => {
      // The active session remains registered while the app is backgrounded.
      // It is explicitly stopped when the user finishes or discards the hike.
    };
  }, []);

  useEffect(() => {
    if (!routeShape || hasPlayedArrivalCamera.current) return;
    hasPlayedArrivalCamera.current = true;
    arrivalCameraTimer.current = setTimeout(() => {
      setZoomLevel(14.6);
      cameraRef.current?.setCamera({
        centerCoordinate: routeCenter,
        zoomLevel: 14.6,
        pitch: 32,
        heading: 18,
        animationDuration: 1500,
        animationMode: 'flyTo',
      });
      arrivalCameraTimer.current = null;
    }, 500);

    return () => {
      if (arrivalCameraTimer.current) clearTimeout(arrivalCameraTimer.current);
    };
  }, [routeShape]);

  useEffect(() => {
    if (!routeShape || !storyStyleLoaded || hasPlayedRouteDraw.current) return;
    hasPlayedRouteDraw.current = true;
    const duration = 1350;
    routeDrawDelay.current = setTimeout(() => {
      const startedAt = Date.now();
      const draw = () => {
        const progress = Math.min((Date.now() - startedAt) / duration, 1);
        setRouteDrawProgress(progress);
        if (progress < 1) routeDrawFrame.current = requestAnimationFrame(draw);
        else routeDrawFrame.current = null;
      };
      routeDrawFrame.current = requestAnimationFrame(draw);
      routeDrawDelay.current = null;
    }, 180);

    return () => {
      if (routeDrawDelay.current) clearTimeout(routeDrawDelay.current);
      if (routeDrawFrame.current) cancelAnimationFrame(routeDrawFrame.current);
    };
  }, [routeShape, storyStyleLoaded]);

  const dismissGuidance = useCallback(() => {
    if (guidanceDismissed.current || !showGuidance) return;
    guidanceDismissed.current = true;
    Animated.parallel([
      Animated.timing(guidanceOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(guidanceOffset, { toValue: 12, duration: 220, useNativeDriver: true }),
    ]).start(() => setShowGuidance(false));
  }, [guidanceOffset, guidanceOpacity, showGuidance]);

  useEffect(() => {
    if (!showGuidance) return;
    const timeout = setTimeout(dismissGuidance, 4500);
    return () => clearTimeout(timeout);
  }, [dismissGuidance, showGuidance]);

  const fullRouteCoordinates = routeShape?.geometry.coordinates ?? [];
  const routeCoordinates = outboundRouteCoordinates(fullRouteCoordinates);
  const visibleRouteShape = routeShape ? routeShapeToProgress(routeShape, routeDrawProgress) : null;
  const memoryTrailShape = memoryTrailAlongRoute(routeCoordinates, markedMoments);
  const nearbyFeatureCoordinates = nearbyFeatures;
  const markedCount = markedMoments.length;
  const nodMarkedCount = markedMoments.filter((moment) => moment.source === 'nod').length;
  const demoComplete = markedCount >= grandPrismaticMoments.length;
  const remainingMoments = Math.max(0, grandPrismaticMoments.length - markedCount);
  const sessionLabel = markedCount ? `${markedCount} ${markedCount === 1 ? 'moment' : 'moments'} kept` : 'Ready to keep a moment';
  const activeStoryMoment = storyIndex === null ? undefined : grandPrismaticMoments.find((moment) => moment.id === markedMoments[storyIndex]?.momentId);
  const activeStoryImages = activeStoryMoment?.images ?? (activeStoryMoment?.image ? [activeStoryMoment.image] : [storyMomentImages[(storyIndex ?? 0) % storyMomentImages.length]]);
  const persistDraft = (marks: CapturedTrailMoment[], notes: string[]) => saveActiveHikeDraft({
    slug: slug ?? 'grand-prismatic-overlook',
    title: trailName,
    location: 'Yellowstone National Park',
    routeCoordinates,
    marks,
    notes,
    noticingFocusId,
    noticingFocus,
  });
  const markMoment = (source: MarkSource) => {
    if (demoComplete || markingRef.current) return;
    markingRef.current = true;
    const nextIndex = markedMoments.length;
    const preparedMoment = grandPrismaticMoments[nextIndex];
    const coordinate = preparedMoment.routeEnd ? (routeCoordinates[routeCoordinates.length - 1] ?? fallbackMarkCoordinate) : coordinateAtFraction(routeCoordinates, preparedMoment.routeFraction);
    const moment: CapturedTrailMoment = { id: `moment-${markSequenceRef.current++}`, momentId: preparedMoment.id, coordinate, source, createdAt: new Date().toISOString() };
    const nextMoments = [...markedMoments, moment];
    setMarkedMoments(nextMoments);
    persistDraft(nextMoments, storyNotes);
    setLatestMarkId(moment.id);
    if (source === 'nod') {
      setZoomLevel(15.15);
      cameraRef.current?.setCamera({
        centerCoordinate: coordinate,
        zoomLevel: 15.15,
        pitch: 28,
        heading: 18 + nextIndex * 8,
        padding: storyCameraPadding,
        animationDuration: 950,
        animationMode: 'flyTo',
      });
    }
    markBloomScale.setValue(0.8);
    markBloomOpacity.setValue(0.62);
    Animated.parallel([
      Animated.timing(markBloomScale, { toValue: 2, duration: 520, useNativeDriver: true }),
      Animated.timing(markBloomOpacity, { toValue: 0, duration: 520, useNativeDriver: true }),
    ]).start();
    setLastMarkedTitle(preparedMoment.title);
    setShowMarkNotice(true);
    dismissGuidance();
    setTimeout(() => {
      markingRef.current = false;
    }, 350);
  };

  useEffect(() => {
    if (!showMarkNotice) return;
    markNoticeOpacity.setValue(1);
    markNoticeOffset.setValue(0);
    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(markNoticeOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(markNoticeOffset, { toValue: 12, duration: 220, useNativeDriver: true }),
      ]).start(() => setShowMarkNotice(false));
    }, 2200);
    return () => clearTimeout(timeout);
  }, [markNoticeOffset, markNoticeOpacity, showMarkNotice]);

  const centerRoute = () => {
    setZoomLevel(14.5);
    cameraRef.current?.setCamera({ centerCoordinate: routeCenter, zoomLevel: 14.5, pitch: 0, heading: 0, padding: { paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 }, animationDuration: 700, animationMode: 'easeTo' });
  };
  const confirmLeaveHike = () => {
    Alert.alert('Leave this hike?', 'Your captured moments will be discarded, and this trail will start fresh next time.', [
      { text: 'Keep hiking', style: 'cancel' },
      { text: 'Discard and leave', style: 'destructive', onPress: () => { void stopHikeBackgroundTracking(); clearActiveHikeDraft(); router.back(); } },
    ]);
  };
  const returnToHike = () => {
    setStoryStyleLoaded(false);
    setStoryIntro(false);
    setStoryIndex(null);
    setStoryProgressIndex(null);
    setStoryRevealed(false);
    setStorySheetOpen(false);
    setStoryReviewing(false);
    storySheetOffset.setValue(420);
    cameraRef.current?.setCamera({ centerCoordinate: routeCenter, zoomLevel: 14.5, pitch: 0, heading: 0, padding: { paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 }, animationDuration: 800, animationMode: 'easeTo' });
  };
  const openNodSheet = () => {
    setNodSheetOpen(true);
    Animated.parallel([
      Animated.timing(actionsOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(actionsOffset, { toValue: 6, duration: 150, useNativeDriver: true }),
    ]).start();
    Animated.spring(nodSheetOffset, { toValue: 0, damping: 19, stiffness: 150, useNativeDriver: true }).start();
  };
  const closeNodSheet = () => {
    Animated.timing(nodSheetOffset, { toValue: 360, duration: 180, useNativeDriver: true }).start(() => setNodSheetOpen(false));
    Animated.parallel([
      Animated.timing(actionsOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(actionsOffset, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
  };
  const finishHike = () => {
    void stopHikeBackgroundTracking();
    if (storyCameraTimer.current) clearTimeout(storyCameraTimer.current);
    setStoryStyleLoaded(false);
    setStoryIntro(true);
    dismissGuidance();
    setShowMarkNotice(false);
    cameraRef.current?.setCamera({ centerCoordinate: routeCenter, zoomLevel: 13.2, pitch: 38, heading: 22, padding: storyCameraPadding, animationDuration: 1900, animationMode: 'flyTo' });
  };
  const startStory = () => {
    setStoryStyleLoaded(false);
    setStoryIntro(false);
    setStoryIndex(0);
    setStoryProgressIndex(0);
    setStoryReviewing(false);
    setStoryNote('');
    setStoryRevealed(false);
    setStorySheetOpen(false);
    const first = markedMoments[0];
    if (first) cameraRef.current?.setCamera({ centerCoordinate: first.coordinate, zoomLevel: 15, pitch: 48, heading: 28, padding: storyCameraPadding, animationDuration: 1700, animationMode: 'flyTo' });
    storySheetOffset.setValue(420);
  };
  useEffect(() => {
    if (storyProgressIndex === null || storyRevealed) return;
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(storyPulse, { toValue: 1.28, duration: 650, useNativeDriver: true }),
      Animated.timing(storyPulse, { toValue: 1, duration: 650, useNativeDriver: true }),
    ]));
    pulse.start();
    return () => pulse.stop();
  }, [storyProgressIndex, storyPulse, storyRevealed]);
  const openStorySheet = () => {
    setStorySheetOpen(true);
    Animated.spring(storySheetOffset, { toValue: 0, damping: 19, stiffness: 150, useNativeDriver: true }).start();
  };
  const revealStoryMoment = (noteToSave = storyNote) => {
    const nextNotes = [...storyNotes, noteToSave.trim()];
    setStoryNotes(nextNotes);
    persistDraft(markedMoments, nextNotes);
    setStoryImageIndex(0);
    storyImageOpacity.setValue(1);
    setStoryRevealed(true);
  };
  const reviewStoryMoment = (index: number) => {
    if (storyCameraTimer.current) clearTimeout(storyCameraTimer.current);
    storyCameraTimer.current = null;
    setStoryIndex(index);
    setStoryNote(storyNotes[index] ?? '');
    setStoryImageIndex(0);
    storyImageOpacity.setValue(1);
    setStoryReviewing(true);
    setStoryRevealed(true);
    setStorySheetOpen(true);
    storySheetOffset.setValue(420);
    Animated.spring(storySheetOffset, { toValue: 0, damping: 19, stiffness: 150, useNativeDriver: true }).start();
    const moment = markedMoments[index];
    if (moment) cameraRef.current?.setCamera({ centerCoordinate: moment.coordinate, zoomLevel: 15, pitch: 48, heading: 28 + index * 8, padding: storyCameraPadding, animationDuration: 850, animationMode: 'easeTo' });
  };
  const returnToCurrentStoryMoment = () => {
    if (storyProgressIndex === null) return;
    if (storyCameraTimer.current) clearTimeout(storyCameraTimer.current);
    storyCameraTimer.current = null;
    setStoryReviewing(false);
    setStoryIndex(storyProgressIndex);
    setStoryNote('');
    setStoryRevealed(false);
    setStorySheetOpen(false);
    storySheetOffset.setValue(420);
    const moment = markedMoments[storyProgressIndex];
    if (moment) cameraRef.current?.setCamera({ centerCoordinate: moment.coordinate, zoomLevel: 15, pitch: 48, heading: 28 + storyProgressIndex * 8, padding: storyCameraPadding, animationDuration: 850, animationMode: 'easeTo' });
  };
  useEffect(() => {
    if (!storyRevealed || storyIndex === null || activeStoryImages.length < 2) return;
    const cycleImages = () => {
      Animated.timing(storyImageOpacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(({ finished }) => {
        if (!finished) return;
        setStoryImageIndex((current) => (current + 1) % activeStoryImages.length);
        Animated.timing(storyImageOpacity, { toValue: 1, duration: 260, useNativeDriver: true }).start();
      });
    };
    const interval = setInterval(cycleImages, 3400);
    return () => clearInterval(interval);
  }, [activeStoryImages.length, storyImageOpacity, storyIndex, storyRevealed]);
  const nextStoryMoment = () => {
    if (storyReviewing) {
      returnToCurrentStoryMoment();
      return;
    }
    const next = (storyProgressIndex ?? 0) + 1;
    if (next >= markedMoments.length) {
      if (storyCameraTimer.current) clearTimeout(storyCameraTimer.current);
      setStoryProgressIndex(null);
      setStoryIndex(null);
      setStoryRevealed(false);
      setStorySheetOpen(false);
      cameraRef.current?.setCamera({ centerCoordinate: routeCenter, zoomLevel: 13.2, pitch: 0, heading: 0, animationDuration: 450, animationMode: 'easeTo' });
      router.push({ pathname: '/recap', params: { markedCount: String(markedMoments.length), notes: JSON.stringify(storyNotes), momentIds: JSON.stringify(markedMoments.map((moment) => moment.momentId)), marks: JSON.stringify(markedMoments), routeCoordinates: JSON.stringify(routeCoordinates), focusId: noticingFocusId, focus: noticingFocus } });
      return;
    }
    setStoryIndex(next);
    setStoryProgressIndex(next);
    setStoryNote('');
    setStoryRevealed(false);
    setStorySheetOpen(false);
    setStoryImageIndex(0);
    storyImageOpacity.setValue(1);
    storySheetOffset.setValue(420);
    cameraRef.current?.setCamera({ centerCoordinate: markedMoments[next].coordinate, zoomLevel: 14.1, pitch: 35, heading: 22 + next * 8, padding: storyCameraPadding, animationDuration: 750, animationMode: 'flyTo' });
    if (storyCameraTimer.current) clearTimeout(storyCameraTimer.current);
    storyCameraTimer.current = setTimeout(() => {
      cameraRef.current?.setCamera({ centerCoordinate: markedMoments[next].coordinate, zoomLevel: 15, pitch: 48, heading: 28 + next * 8, padding: storyCameraPadding, animationDuration: 750, animationMode: 'easeTo' });
      storyCameraTimer.current = null;
    }, 760);
  };
  const zoomMap = (direction: 1 | -1) => {
    const nextZoom = Math.max(10, Math.min(18, zoomLevel + direction));
    setZoomLevel(nextZoom);
    cameraRef.current?.setCamera({ zoomLevel: nextZoom, animationDuration: 220, animationMode: 'easeTo' });
  };
  const openAnchor = (anchor: TrailAnchor, coordinate?: Position) => {
    setSelectedAnchor(anchor);
    anchorSheetOffset.setValue(360);
    if (coordinate) {
      cameraRef.current?.setCamera({ centerCoordinate: coordinate, zoomLevel: 14.45, pitch: 38, heading: 20, padding: anchorCameraPadding, animationDuration: 850, animationMode: 'flyTo' });
    }
    Animated.parallel([
      Animated.timing(actionsOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(actionsOffset, { toValue: 6, duration: 150, useNativeDriver: true }),
    ]).start();
    Animated.spring(anchorSheetOffset, { toValue: 0, damping: 18, stiffness: 180, mass: 0.8, useNativeDriver: true }).start();
  };
  const closeAnchor = (returnToRoute = true) => {
    Animated.timing(anchorSheetOffset, { toValue: 360, duration: 180, useNativeDriver: true }).start(() => {
      setSelectedAnchor(null);
      if (returnToRoute) centerRoute();
      Animated.parallel([
        Animated.timing(actionsOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(actionsOffset, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    });
  };
  const planNextWalk = (feature: NearbyFeature) => {
    setNextWalkTitle(feature.title);
    setZoomLevel(13.25);
    cameraRef.current?.setCamera({ centerCoordinate: feature.coordinate, zoomLevel: 13.25, pitch: 24, heading: 14, animationDuration: 1050, animationMode: 'flyTo' });
    closeAnchor(false);
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <Mapbox.MapView
        style={styles.map}
        styleURL={storyIntro || storyProgressIndex !== null || liveMapStyle === 'terrain' ? Mapbox.StyleURL.Outdoors : Mapbox.StyleURL.Light}
        onDidFinishLoadingStyle={() => setStoryStyleLoaded(true)}
        scaleBarEnabled={false}
        compassEnabled={false}
        scrollEnabled
        zoomEnabled
        rotateEnabled={false}
        pitchEnabled={false}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <Mapbox.Camera
          ref={cameraRef}
          defaultSettings={{ centerCoordinate: routeCenter, zoomLevel: 13.15 }}
        />
        {storyIntro || storyProgressIndex !== null ? <Mapbox.RasterDemSource id="story-terrain-dem" url="mapbox://mapbox.mapbox-terrain-dem-v1" maxZoomLevel={14}><Mapbox.Terrain style={{ exaggeration: 1.15 }} /></Mapbox.RasterDemSource> : <Mapbox.RasterDemSource id="trail-terrain-dem" url="mapbox://mapbox.mapbox-terrain-dem-v1" maxZoomLevel={14}><Mapbox.Terrain style={{ exaggeration: 0.8 }} /></Mapbox.RasterDemSource>}
        {visibleRouteShape && storyStyleLoaded ? (
          <>
            <Mapbox.ShapeSource id="trailmark-route" shape={visibleRouteShape}>
              <Mapbox.LineLayer id="trailmark-route-line" style={{ lineColor: storyIntro || storyProgressIndex !== null ? '#277D54' : '#39A9E8', lineWidth: storyIntro || storyProgressIndex !== null ? 4 : 5, lineCap: 'round', lineJoin: 'round' }} />
            </Mapbox.ShapeSource>
            {routeCoordinates.length > 0 ? (
              <>
                <Mapbox.MarkerView id="hike-start-point" coordinate={routeCoordinates[0]} allowOverlap>
                  <Pressable accessibilityRole="button" accessibilityLabel="Open Fairy Falls trailhead information" onPress={() => openAnchor(trailAnchors[0], routeCoordinates[0])} style={styles.anchorHitTarget}>
                    <View style={styles.startPoint} />
                  </Pressable>
                </Mapbox.MarkerView>
                {nearbyFeatureCoordinates.map((feature) => (
                  <Mapbox.MarkerView key={feature.id} id={feature.id} coordinate={feature.coordinate} allowOverlap>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Open ${feature.title} information`} onPress={() => openAnchor(feature, feature.coordinate)} style={styles.featureHitTarget}>
                      <View style={styles.featurePoint}><View style={styles.featurePointCore} /></View>
                    </Pressable>
                  </Mapbox.MarkerView>
                ))}
              </>
            ) : null}
          </>
        ) : null}
        {memoryTrailShape && storyStyleLoaded && !storyIntro && storyIndex === null ? (
          <Mapbox.ShapeSource id="trailmark-memory-trail" shape={memoryTrailShape}>
            <Mapbox.LineLayer id="trailmark-memory-trail-line" style={{ lineColor: '#2E7B55', lineWidth: 2.5, lineOpacity: 0.58, lineDasharray: [1, 2.2], lineCap: 'round', lineJoin: 'round' }} />
          </Mapbox.ShapeSource>
        ) : null}
        {markedMoments.map((moment) => (
          <Mapbox.MarkerView key={moment.id} coordinate={moment.coordinate} allowOverlap allowOverlapWithPuck>
            {storyProgressIndex === markedMoments.indexOf(moment) && !storyRevealed ? <Pressable accessibilityRole="button" accessibilityLabel={`Open moment ${storyProgressIndex + 1}`} onPress={openStorySheet} style={styles.storyPinTarget}><Animated.View style={[styles.storyPulseRing, { transform: [{ scale: storyPulse }] }]} /><View style={styles.storyPin}><Text style={styles.storyPinText}>{storyProgressIndex + 1}</Text></View></Pressable> : storyProgressIndex !== null && markedMoments.indexOf(moment) < storyProgressIndex ? <Pressable accessibilityRole="button" accessibilityLabel={`Review moment ${markedMoments.indexOf(moment) + 1}`} onPress={() => reviewStoryMoment(markedMoments.indexOf(moment))} style={styles.storyPinTarget}><View style={styles.storyPin}><Text style={styles.storyPinText}>{markedMoments.indexOf(moment) + 1}</Text></View></Pressable> : <View style={[styles.momentMarker, moment.momentId === grandPrismaticMoments[grandPrismaticMoments.length - 1]?.id && styles.finishMomentMarker, latestMarkId === moment.id && styles.momentMarkerLatest]}>{latestMarkId === moment.id ? <Animated.View pointerEvents="none" style={[styles.momentMarkerBloom, { opacity: markBloomOpacity, transform: [{ scale: markBloomScale }] }]} /> : null}<View style={[styles.momentMarkerCore, moment.momentId === grandPrismaticMoments[grandPrismaticMoments.length - 1]?.id && styles.finishMomentMarkerCore]} /></View>}
          </Mapbox.MarkerView>
        ))}
        {routeCoordinates.length > 0 && !storyIntro && storyIndex === null ? (
          <Mapbox.MarkerView id="hike-end-point" coordinate={routeCoordinates[routeCoordinates.length - 1]} allowOverlap>
            <Pressable accessibilityRole="button" accessibilityLabel="Open Grand Prismatic Overlook information" onPress={() => openAnchor(trailAnchors[1], routeCoordinates[routeCoordinates.length - 1])} style={styles.anchorHitTarget}>
              <View style={styles.endPoint} />
            </Pressable>
          </Mapbox.MarkerView>
        ) : null}
        <Mapbox.UserLocation visible={!storyIntro && storyProgressIndex === null} animated />
      </Mapbox.MapView>

      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']} pointerEvents="box-none">
        {!storyIntro && storyIndex === null && <View style={styles.topBar}>
          <View style={styles.titleBlock}>
            <Text numberOfLines={1} style={styles.title}>{trailName}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={nodConnected ? 'Open Nod status' : 'Open phone marking status'} onPress={openNodSheet} style={({ pressed }) => [styles.sessionState, pressed && styles.pressed]}><Animated.View style={[styles.connectionIcon, nodConnected && { transform: [{ scale: nodConnectionPulse }] }]}><TrailSymbol name={nodConnected ? 'dot.radiowaves.left.and.right' : 'iphone'} androidName={nodConnected ? 'bluetooth_connected' : 'phone_iphone'} size={13} color="#24794C" /></Animated.View><Text style={styles.subtitle}>{nodConnected ? 'Nod connected' : 'Phone marking'} · {sessionLabel}</Text><TrailSymbol name="chevron.right" androidName="chevron_right" size={12} color="#718279" /></Pressable>
            {nextWalkTitle ? <Text numberOfLines={1} style={styles.nextWalk}>Next walk · {nextWalkTitle}</Text> : null}
          </View>
        </View>}

        {!storyIntro && storyIndex === null && <View style={styles.mapControls}>
          <Pressable accessibilityRole="button" accessibilityLabel="Leave hike" onPress={confirmLeaveHike} style={({ pressed }) => [styles.mapControl, styles.leaveControl, pressed && styles.pressed]}>
            <TrailSymbol name="xmark" androidName="close" size={18} color="#FFFFFF" />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Open settings" onPress={() => router.push('/settings')} style={({ pressed }) => [styles.mapControl, pressed && styles.pressed]}>
            <TrailSymbol name="gearshape" androidName="settings" size={18} color="#FFFFFF" />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Recenter route" onPress={centerRoute} style={({ pressed }) => [styles.mapControl, pressed && styles.pressed]}>
            <TrailSymbol name="scope" androidName="center_focus_strong" size={18} color="#FFFFFF" />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Zoom in" onPress={() => zoomMap(1)} style={({ pressed }) => [styles.mapControl, pressed && styles.pressed]}>
            <TrailSymbol name="plus" androidName="add" size={19} color="#FFFFFF" />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Zoom out" onPress={() => zoomMap(-1)} style={({ pressed }) => [styles.mapControl, pressed && styles.pressed]}>
            <TrailSymbol name="minus" androidName="remove" size={19} color="#FFFFFF" />
          </Pressable>
        </View>}
        {storyIndex !== null ? <View style={styles.storyExitControls}><Pressable accessibilityRole="button" accessibilityLabel="Skip revisiting for now and return to hike" onPress={returnToHike} style={({ pressed }) => [styles.storyExitControl, pressed && styles.pressed]}><TrailSymbol name="xmark" androidName="close" size={18} color="#193323" /></Pressable></View> : null}

        {selectedAnchor ? <>
          <Pressable accessibilityRole="button" accessibilityLabel="Close trail information" onPress={() => closeAnchor()} style={styles.anchorDismissLayer} />
          <Animated.View style={[styles.anchorSheet, { transform: [{ translateY: anchorSheetOffset }] }]}>
          <Image source={selectedAnchor.image} contentFit="cover" style={styles.anchorImage} />
          <View style={styles.anchorCopy}>
            <View style={styles.anchorHeading}>
              <View style={styles.anchorTextBlock}>
                <Text style={styles.anchorTitle}>{selectedAnchor.title}</Text>
                <Text style={styles.anchorSubtitle}>{selectedAnchor.subtitle}</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close trail information" onPress={() => closeAnchor()} style={styles.anchorClose}>
                <TrailSymbol name="xmark" androidName="close" size={16} color="#193323" />
              </Pressable>
            </View>
            <Text style={styles.anchorContext}>{selectedAnchor.context}</Text>
            {isNearbyFeature(selectedAnchor) ? <Pressable accessibilityRole="button" onPress={() => planNextWalk(selectedAnchor)} style={({ pressed }) => [styles.anchorPlanButton, pressed && styles.pressed]}><TrailSymbol name="mappin.and.ellipse" androidName="place" size={16} color="#FFFFFF" /><Text style={styles.anchorPlanButtonText}>Set as next walk</Text></Pressable> : null}
          </View>
          </Animated.View>
        </> : null}

        {nodSheetOpen && !storyIntro && storyIndex === null ? <>
          <Pressable accessibilityRole="button" accessibilityLabel="Close Nod status" onPress={closeNodSheet} style={styles.nodSheetDismiss} />
          <Animated.View style={[styles.nodSheet, selectedAnchor && styles.nodSheetAboveAnchor, { transform: [{ translateY: nodSheetOffset }] }]}> 
            <View style={styles.sheetHandle} />
            <View style={styles.nodSheetHeading}>
              <View style={[styles.connectionIcon, styles.nodSheetIcon]}><TrailSymbol name={nodConnected ? 'dot.radiowaves.left.and.right' : 'iphone'} androidName={nodConnected ? 'bluetooth_connected' : 'phone_iphone'} size={15} color="#24794C" /></View>
              <View style={styles.nodSheetCopy}><Text style={styles.nodSheetTitle}>{nodConnected ? 'Nod is ready' : 'Phone marking'}</Text><Text style={styles.nodSheetSubtitle}>{nodConnected ? 'Press once when something catches your attention.' : 'You can still keep a moment with your phone.'}</Text></View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close Nod status" onPress={closeNodSheet} style={styles.anchorClose}><TrailSymbol name="xmark" androidName="close" size={16} color="#193323" /></Pressable>
            </View>
            <View style={styles.nodSheetCount}><Text style={styles.nodSheetCountValue}>{markedCount}</Text><Text style={styles.nodSheetCountLabel}>{markedCount === 1 ? 'moment kept on this walk' : 'moments kept on this walk'}</Text></View>
            <Pressable accessibilityRole="button" onPress={() => { closeNodSheet(); router.push(nodConnected ? { pathname: '/settings', params: { open: 'nod' } } : '/pair-nod'); }} style={({ pressed }) => [styles.nodSheetAction, pressed && styles.pressed]}><Text style={styles.nodSheetActionText}>{nodConnected ? 'Manage Nod' : 'Set up Nod'}</Text><TrailSymbol name="arrow.up.right" androidName="north_east" size={16} color="#FFFFFF" /></Pressable>
            <Pressable accessibilityRole="button" onPress={closeNodSheet} style={({ pressed }) => [styles.nodSheetSecondary, pressed && styles.pressed]}><Text style={styles.nodSheetSecondaryText}>Back to the walk</Text></Pressable>
          </Animated.View>
        </> : null}

        {storyIntro ? <View style={styles.storyIntro}>
          <View style={styles.storyIntroHeader}><Text accessibilityRole="header" style={styles.storyTitle}>You’re back.</Text><Pressable accessibilityRole="button" accessibilityLabel="Skip revisiting for now and return to hike" onPress={returnToHike} style={styles.storyIntroClose}><TrailSymbol name="xmark" androidName="close" size={16} color="#4D5E53" /></Pressable></View>
          <Text style={styles.storyDescription}>{markedCount ? `${nodMarkedCount ? `Nod helped you keep ${nodMarkedCount} ${nodMarkedCount === 1 ? 'moment' : 'moments'}. ` : ''}${markedCount === 1 ? 'Your moment is' : 'Your moments are'} waiting along this walk.` : 'There are no moments kept on this walk yet.'}</Text>
          {markedCount > 0 ? <Pressable accessibilityRole="button" onPress={startStory} style={styles.storyButton}><Text style={styles.storyButtonText}>Begin revisiting →</Text></Pressable> : null}
          <Pressable accessibilityRole="button" onPress={returnToHike} style={styles.storyBack}><Text style={styles.storyBackText}>Skip for now</Text></Pressable>
        </View> : storyIndex === null ? <View style={styles.bottomArea}>
          <Animated.View pointerEvents="none" style={[styles.bottomFeedback, { opacity: actionsOpacity, transform: [{ translateY: actionsOffset }] }]}>
            {showGuidance && !demoComplete ? (
              <Animated.View style={[styles.statusCard, { opacity: guidanceOpacity, transform: [{ translateY: guidanceOffset }] }]}>
                <View style={styles.statusIcon}><TrailSymbol name={nodConnected ? 'dot.radiowaves.left.and.right' : 'iphone'} androidName={nodConnected ? 'bluetooth_connected' : 'phone_iphone'} size={17} color="#DDF2E3" /></View>
                <View style={styles.statusCopy}>
                  <Text style={styles.statusTitle}>{markedCount ? `${markedCount} moment${markedCount === 1 ? '' : 's'} captured` : nodConnected ? 'Nod is ready' : 'Ready to mark'}</Text>
                  <Text style={styles.statusText}>{markedCount ? `${remainingMoments} more ${remainingMoments === 1 ? 'moment' : 'moments'} in this demo route.` : nodConnected ? 'Press Nod once when something catches your attention.' : 'Press when a moment is worth keeping.'}</Text>
                </View>
              </Animated.View>
            ) : null}
            {showMarkNotice ? <Animated.View style={[styles.markNotice, { opacity: markNoticeOpacity, transform: [{ translateY: markNoticeOffset }] }]}><View style={styles.markNoticeIcon}><TrailSymbol name="checkmark" androidName="check" size={15} color="#FFFFFF" /></View><View style={styles.statusCopy}><Text style={styles.statusTitle}>{nodConnected ? 'Nod marked' : 'Moment marked'}</Text><Text style={styles.statusText}>{lastMarkedTitle ?? 'You can make sense of it after the hike.'}</Text></View></Animated.View> : null}
          </Animated.View>
          <Animated.View pointerEvents={selectedAnchor ? 'none' : 'auto'} style={[styles.actions, { opacity: actionsOpacity, transform: [{ translateY: actionsOffset }] }]}>
            <Pressable accessibilityRole="button" accessibilityLabel={demoComplete ? 'All demo moments captured' : nodConnected ? 'Mark with Nod' : 'Mark a moment'} disabled={demoComplete} onPress={() => markMoment(nodConnected ? 'nod' : 'phone')} style={({ pressed }) => [styles.markButton, demoComplete && styles.markButtonComplete, pressed && styles.pressed]}>
              <TrailSymbol name={nodConnected ? 'hand.tap.fill' : 'circle.fill'} androidName={nodConnected ? 'touch_app' : 'radio_button_checked'} size={17} color="#193323" />
              <Text style={styles.markText}>{demoComplete ? 'Moments captured' : nodConnected ? 'Mark with Nod' : 'Mark moment'}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Finish hike" onPress={finishHike} style={({ pressed }) => [styles.finishButton, pressed && styles.pressed]}>
              <Text style={styles.finishText}>Finish</Text>
            </Pressable>
          </Animated.View>
          <View pointerEvents="none" style={[styles.attribution, styles.attributionLight]}><Text style={[styles.attributionText, styles.attributionTextLight]}>© Mapbox · © OpenStreetMap</Text></View>
        </View> : null}
        {storyIndex !== null && storySheetOpen ? <View pointerEvents="none" style={styles.storyScrim} /> : null}
        {storyIndex !== null && storySheetOpen ? <>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.chapterKeyboardAvoider}>
          <Animated.View style={[styles.chapterSheet, { transform: [{ translateY: storySheetOffset }] }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.chapterProgress}><Text style={styles.chapterProgressText}>Moment {storyIndex + 1}</Text><Text style={styles.chapterProgressText}>{storyIndex + 1} of {markedCount}</Text></View>
            <View style={styles.chapterProgressTrack}>{markedMoments.map((moment, index) => <View key={moment.id} style={[styles.chapterProgressStep, index <= storyIndex && styles.chapterProgressStepActive]} />)}</View>
            {!storyRevealed ? <>
              <Text style={styles.chapterTitle}>What do you remember?</Text>
              <Text style={styles.chapterPrompt}>{activeStoryMoment ? getNoticingPrompt(activeStoryMoment, noticingFocus) : null}</Text>
              <TextInput accessibilityLabel="Write what you remember" multiline value={storyNote} onChangeText={setStoryNote} placeholder="A color, a view, a feeling, something small..." placeholderTextColor="#75857C" style={styles.chapterInput} />
              <Pressable accessibilityRole="button" onPress={() => revealStoryMoment()} style={styles.chapterButton}><Text style={styles.chapterButtonText}>Reveal this moment →</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => { setStoryNote(''); revealStoryMoment(''); }} style={styles.chapterSkip}><Text style={styles.chapterSkipText}>I’ll come back to this</Text></Pressable>
            </> : <>
              <Animated.View style={[styles.chapterImageWrap, { opacity: storyImageOpacity }]}>
                <Image source={activeStoryImages[storyImageIndex % activeStoryImages.length]} contentFit="cover" style={styles.chapterImage} />
              </Animated.View>
              <View style={styles.chapterRevealHeading}>
                <View style={styles.chapterMomentPill}><Text style={styles.chapterMomentPillText}>{markedMoments[storyIndex]?.source === 'nod' ? 'Kept with Nod' : 'Marked with phone'}</Text></View>
                <Text style={styles.chapterPlace}>{activeStoryMoment?.title}</Text>
              </View>
              <Text style={styles.chapterContext}>{activeStoryMoment?.context}</Text>
              {storyNote.trim() ? <View style={styles.chapterMemoryCard}><Text style={styles.chapterMemoryLabel}>Your memory</Text><Text style={styles.chapterMemory}>{storyNote.trim()}</Text></View> : null}
              <Pressable accessibilityRole="button" onPress={nextStoryMoment} style={styles.chapterButton}><Text style={styles.chapterButtonText}>{storyReviewing ? 'Return to current moment →' : storyIndex + 1 === markedCount ? 'Finish story →' : 'Next moment →'}</Text></Pressable>
            </>}
          </Animated.View>
          </KeyboardAvoidingView>
        </> : null}
      </SafeAreaView>
    </View>
  );
}

function TrailSymbol({ name, androidName, size, color }: { name: string; androidName: string; size: number; color: string }) {
  return <SymbolView name={{ ios: name as SFSymbol, android: androidName as never, web: androidName as never }} size={size} weight="medium" tintColor={color} />;
}

function coordinateAtFraction(coordinates: Position[], fraction: number): Position {
  if (coordinates.length < 2) return coordinates[0] ?? fallbackMarkCoordinate;

  const segments = coordinates.slice(1).map((coordinate, index) => {
    const previous = coordinates[index];
    const longitudeDelta = coordinate[0] - previous[0];
    const latitudeDelta = coordinate[1] - previous[1];
    return Math.sqrt(longitudeDelta * longitudeDelta + latitudeDelta * latitudeDelta);
  });
  const totalDistance = segments.reduce((sum, distance) => sum + distance, 0);
  const targetDistance = totalDistance * Math.max(0, Math.min(1, fraction));
  let traveled = 0;

  for (let index = 0; index < segments.length; index += 1) {
    const segmentDistance = segments[index];
    if (traveled + segmentDistance >= targetDistance) {
      const progress = segmentDistance ? (targetDistance - traveled) / segmentDistance : 0;
      const start = coordinates[index];
      const end = coordinates[index + 1];
      return [start[0] + (end[0] - start[0]) * progress, start[1] + (end[1] - start[1]) * progress];
    }
    traveled += segmentDistance;
  }

  return coordinates[coordinates.length - 1];
}

function routeShapeToProgress(route: Feature<LineString>, progress: number): Feature<LineString> {
  if (progress >= 1) return route;
  const coordinates = route.geometry.coordinates;
  if (coordinates.length < 2) return route;

  const clampedProgress = Math.max(0, Math.min(1, progress));
  const segmentProgress = clampedProgress * (coordinates.length - 1);
  const completedIndex = Math.floor(segmentProgress);
  const localProgress = segmentProgress - completedIndex;
  const partialCoordinates = coordinates.slice(0, completedIndex + 1);
  const segmentStart = coordinates[completedIndex];
  const segmentEnd = coordinates[Math.min(completedIndex + 1, coordinates.length - 1)];

  if (localProgress > 0 && segmentStart && segmentEnd) {
    partialCoordinates.push([
      segmentStart[0] + (segmentEnd[0] - segmentStart[0]) * localProgress,
      segmentStart[1] + (segmentEnd[1] - segmentStart[1]) * localProgress,
    ]);
  }

  return partialCoordinates.length > 1 ? { ...route, geometry: { ...route.geometry, coordinates: partialCoordinates } } : { ...route, geometry: { ...route.geometry, coordinates: [coordinates[0], coordinates[0]] } };
}

function memoryTrailAlongRoute(routeCoordinates: Position[], moments: CapturedTrailMoment[]): Feature<LineString> | null {
  if (moments.length < 2 || routeCoordinates.length < 2) return null;

  const routeIndices = moments.map((moment) => routeCoordinates.reduce((nearestIndex, coordinate, index) => {
    const nearest = routeCoordinates[nearestIndex];
    const nearestDistance = (nearest[0] - moment.coordinate[0]) ** 2 + (nearest[1] - moment.coordinate[1]) ** 2;
    const candidateDistance = (coordinate[0] - moment.coordinate[0]) ** 2 + (coordinate[1] - moment.coordinate[1]) ** 2;
    return candidateDistance < nearestDistance ? index : nearestIndex;
  }, 0));
  const start = Math.min(...routeIndices);
  const end = Math.max(...routeIndices);
  const coordinates = routeCoordinates.slice(start, end + 1);

  return coordinates.length > 1 ? { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } } : null;
}

/**
 * The prepared Grand Prismatic route is an out-and-back LineString: it starts
 * at the trailhead, reaches the overlook, then returns to the trailhead. For
 * the marking sequence we use only the outbound leg so marks progress toward
 * the overlook instead of jumping back along the return leg.
 */
function outboundRouteCoordinates(coordinates: Position[]): Position[] {
  if (coordinates.length < 2) return coordinates;

  const start = coordinates[0];
  let turnaroundIndex = coordinates.length - 1;
  let farthestDistance = -1;

  coordinates.forEach((coordinate, index) => {
    const longitudeDelta = coordinate[0] - start[0];
    const latitudeDelta = coordinate[1] - start[1];
    const distanceFromStart = longitudeDelta * longitudeDelta + latitudeDelta * latitudeDelta;
    if (distanceFromStart > farthestDistance) {
      farthestDistance = distanceFromStart;
      turnaroundIndex = index;
    }
  });

  return coordinates.slice(0, turnaroundIndex + 1);
}

const styles = StyleSheet.create({
  storyScrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(12, 25, 17, 0.22)' },
  storyPinTarget: { width: 68, height: 68, alignItems: 'center', justifyContent: 'center' },
  storyPulseRing: { position: 'absolute', width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(34,108,74,0.24)', borderWidth: 2, borderColor: '#FFFFFF' },
  storyPin: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#226C4A', borderWidth: 3, borderColor: '#FFFFFF' },
  storyPinText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  chapterKeyboardAvoider: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  chapterSheet: { marginHorizontal: 10, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: '#F5F7F3' },
  sheetHandle: { width: 38, height: 4, alignSelf: 'center', marginBottom: 18, borderRadius: 2, backgroundColor: '#C5D0C8' },
  chapterProgress: { flexDirection: 'row', justifyContent: 'space-between' },
  chapterProgressText: { color: '#4D5E53', fontSize: 13, fontWeight: '700' },
  chapterProgressTrack: { flexDirection: 'row', gap: 5, marginTop: 11, marginBottom: 17 },
  chapterProgressStep: { height: 4, flex: 1, borderRadius: 2, backgroundColor: '#D9E3DA' },
  chapterProgressStepActive: { backgroundColor: '#226C4A' },
  chapterImageWrap: { width: '100%', height: 142, borderRadius: 18, overflow: 'hidden' },
  chapterImage: { width: '100%', height: '100%' },
  chapterTitle: { color: '#15241C', fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.6, marginTop: 4 },
  chapterPrompt: { color: '#4D5E53', fontSize: 16, lineHeight: 23, marginTop: 7 },
  chapterInput: { minHeight: 110, maxHeight: 140, padding: 15, marginTop: 15, borderRadius: 16, borderWidth: 1, borderColor: '#D9E3DA', backgroundColor: '#FFFFFF', color: '#15241C', fontSize: 16, lineHeight: 23, textAlignVertical: 'top' },
  chapterButton: { minHeight: 54, alignItems: 'center', justifyContent: 'center', marginTop: 15, borderRadius: 16, backgroundColor: '#226C4A' },
  chapterButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  chapterSkip: { alignItems: 'center', paddingVertical: 12 },
  chapterSkipText: { color: '#4D5E53', fontSize: 14, fontWeight: '700' },
  chapterRevealHeading: { gap: 7, marginTop: 16 },
  chapterMomentPill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: '#DFEADF' },
  chapterMomentPillText: { color: '#226C4A', fontSize: 12, fontWeight: '800' },
  chapterPlace: { color: '#15241C', fontSize: 25, lineHeight: 30, fontWeight: '800', letterSpacing: -0.4 },
  chapterContext: { color: '#4D5E53', fontSize: 15, lineHeight: 21, marginTop: 8 },
  chapterMemoryCard: { marginTop: 16, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#D9E3DA', backgroundColor: '#FFFFFF' },
  chapterMemoryLabel: { color: '#4D5E53', fontSize: 13, fontWeight: '800', marginBottom: 7 },
  chapterMemory: { color: '#15241C', fontSize: 17, lineHeight: 25, fontWeight: '700' },
  storyIntro: { width: '100%', marginTop: 'auto', marginBottom: 8, padding: 22, borderRadius: 24, backgroundColor: 'rgba(245,247,243,0.97)', gap: 10 },
  storyIntroHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  storyIntroClose: { width: 36, height: 36, marginTop: -4, marginRight: -4, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#E9EFE5' },
  storyTitle: { color: '#15241C', fontSize: 34, fontWeight: '800', letterSpacing: -0.8 },
  storyDescription: { color: '#4D5E53', fontSize: 16, lineHeight: 23 },
  storyButton: { minHeight: 54, marginTop: 10, borderRadius: 16, backgroundColor: '#226C4A', alignItems: 'center', justifyContent: 'center' },
  storyButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  storyBack: { alignItems: 'center', padding: 10 },
  storyBackText: { color: '#4D5E53', fontSize: 14, fontWeight: '700' },
  screen: { flex: 1, backgroundColor: '#101714' },
  map: { ...StyleSheet.absoluteFill, backgroundColor: '#101714' },
  overlay: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  topBar: { alignSelf: 'flex-start', maxWidth: '92%', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.92)' },
  roundControl: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#183126', borderWidth: 1, borderColor: '#2C5A43' },
  mapControls: { position: 'absolute', right: 12, top: 285, gap: 9 },
  mapControl: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(24, 49, 38, 0.94)', borderWidth: 1, borderColor: '#2C5A43' },
  storyExitControls: { position: 'absolute', top: 68, right: 12 },
  storyExitControl: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(245,247,243,0.96)', borderWidth: 1, borderColor: '#D7E3DD' },
  leaveControl: { backgroundColor: '#C7463D', borderColor: '#E1766D' },
  titleBlock: { alignItems: 'flex-start', gap: 5, paddingHorizontal: 2 },
  title: { color: '#183126', fontSize: 17, fontWeight: '800', letterSpacing: -0.2, textAlign: 'left' },
  sessionState: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  connectionIcon: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E4F4E8' },
  subtitle: { color: '#496255', fontSize: 12, textAlign: 'left' },
  startPoint: { width: 15, height: 15, borderRadius: 8, backgroundColor: '#72D48B', borderWidth: 3, borderColor: '#FFFFFF' },
  endPoint: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#F07455', borderWidth: 4, borderColor: '#FFFFFF', shadowColor: '#8E301D', shadowOpacity: 0.28, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  anchorHitTarget: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  featureHitTarget: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  featurePoint: { width: 19, height: 19, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#4B8B6A' },
  featurePointCore: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4B8B6A' },
  momentMarker: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1B4B37', borderWidth: 3, borderColor: '#FFFFFF' },
  finishMomentMarker: { backgroundColor: '#F07455', borderColor: '#FFFFFF' },
  momentMarkerLatest: { width: 30, height: 30, borderRadius: 15, borderColor: '#C5F0CE' },
  momentMarkerBloom: { position: 'absolute', width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#A8DFB6', backgroundColor: 'rgba(168,223,182,0.26)' },
  momentMarkerCore: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#A8DFB6' },
  finishMomentMarkerCore: { backgroundColor: '#FFFFFF' },
  anchorSheet: { position: 'absolute', left: 16, right: 16, bottom: 88, overflow: 'hidden', borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.97)', borderWidth: 1, borderColor: '#D7E3DD', shadowColor: '#193323', shadowOpacity: 0.16, shadowRadius: 16, shadowOffset: { width: 0, height: 5 }, elevation: 8 },
  anchorDismissLayer: StyleSheet.absoluteFill,
  anchorImage: { width: '100%', height: 164 },
  anchorCopy: { padding: 15, gap: 9 },
  anchorHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  anchorTextBlock: { flex: 1, gap: 3 },
  anchorTitle: { color: '#193323', fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  anchorSubtitle: { color: '#718279', fontSize: 13, fontWeight: '600' },
  anchorContext: { color: '#496255', fontSize: 14, lineHeight: 20 },
  anchorPlanButton: { minHeight: 48, marginTop: 3, borderRadius: 14, backgroundColor: '#226C4A', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  anchorPlanButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  anchorClose: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF1EC' },
  nodSheetDismiss: { ...StyleSheet.absoluteFill, zIndex: 20, backgroundColor: 'rgba(12, 25, 17, 0.18)' },
  nodSheet: { position: 'absolute', left: 10, right: 10, bottom: 8, zIndex: 21, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: '#F5F7F3', shadowColor: '#193323', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: -4 }, elevation: 10 },
  nodSheetAboveAnchor: { bottom: 104 },
  nodSheetHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  nodSheetIcon: { width: 36, height: 36, borderRadius: 18, marginTop: 1 },
  nodSheetCopy: { flex: 1, gap: 3 },
  nodSheetTitle: { color: '#193323', fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  nodSheetSubtitle: { color: '#4D6053', fontSize: 14, lineHeight: 20 },
  nodSheetCount: { flexDirection: 'row', alignItems: 'baseline', gap: 7, marginTop: 20, padding: 14, borderRadius: 16, backgroundColor: '#E5F0E6' },
  nodSheetCountValue: { color: '#226C4A', fontSize: 24, fontWeight: '800' },
  nodSheetCountLabel: { color: '#4D6053', fontSize: 14, fontWeight: '700' },
  nodSheetAction: { minHeight: 52, marginTop: 12, borderRadius: 16, backgroundColor: '#226C4A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  nodSheetActionText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  nodSheetSecondary: { alignItems: 'center', paddingVertical: 12 },
  nodSheetSecondaryText: { color: '#4D6053', fontSize: 14, fontWeight: '700' },
  nextWalk: { color: '#24794C', fontSize: 12, fontWeight: '700', marginTop: 2 },
  attribution: { alignSelf: 'flex-start', marginLeft: 2, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 6 },
  attributionLight: { backgroundColor: 'rgba(255,255,255,0.72)' },
  attributionDark: { backgroundColor: 'rgba(17,31,24,0.72)' },
  attributionText: { fontSize: 9, fontWeight: '600' },
  attributionTextLight: { color: '#53645A' },
  attributionTextDark: { color: '#B9CFC1' },
  bottomArea: { gap: 10 },
  bottomFeedback: { gap: 10 },
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, borderRadius: 18, backgroundColor: 'rgba(19, 39, 29, 0.94)', borderWidth: 1, borderColor: '#345640' },
  markNotice: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, borderRadius: 18, backgroundColor: 'rgba(19, 39, 29, 0.96)', borderWidth: 1, borderColor: '#4D8A61' },
  statusIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#24794C' },
  markNoticeIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#3F9B59' },
  statusCopy: { flex: 1, gap: 2 },
  statusTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  statusText: { color: '#B9D2C0', fontSize: 12, lineHeight: 17 },
  actions: { flexDirection: 'row', gap: 10 },
  markButton: { flex: 1, minHeight: 56, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#A8DFB6' },
  markButtonComplete: { backgroundColor: '#DDE9E1', borderColor: '#DDE9E1' },
  markText: { color: '#193323', fontSize: 16, fontWeight: '800' },
  finishButton: { minWidth: 94, minHeight: 56, paddingHorizontal: 18, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EB7657' },
  finishText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.78 },
});
