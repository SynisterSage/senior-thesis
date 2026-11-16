import Mapbox from '@rnmapbox/maps';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getPublishedTrail, type Trail } from '@/lib/trails';

const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
if (mapboxToken) Mapbox.setAccessToken(mapboxToken);

type Coordinate = [number, number];
type TrailEcho = {
  id: string;
  routeFraction: number;
  fallbackPosition: { left: `${number}%`; top: `${number}%` };
  title: string;
  place: string;
  note: string;
  meta: string;
  image: number;
};
type PositionedEcho = TrailEcho & { coordinate: Coordinate };

const routeCenter: Coordinate = [-110.836, 44.52];
const mapPadding = { paddingTop: 100, paddingBottom: 430, paddingLeft: 24, paddingRight: 24 };
const overviewZoom = 15.1;
const echoZoom = 20.8;

const trailEchoes: TrailEcho[] = [
  {
    id: 'water-light',
    routeFraction: 0.22,
    fallbackPosition: { left: '27%', top: '42%' },
    title: 'The light changed',
    place: 'Near the water',
    note: 'The light changed when I reached the water.',
    meta: 'Shared anonymously',
    image: require('../../assets/trails/grand-prismatic/spring.jpg'),
  },
  {
    id: 'wide-view',
    routeFraction: 0.52,
    fallbackPosition: { left: '53%', top: '30%' },
    title: 'The trail opened up',
    place: 'Overlook approach',
    note: 'I did not expect the trail to feel so open after the trees.',
    meta: 'Shared by Maya',
    image: require('../../assets/trails/grand-prismatic/overlook.jpg'),
  },
  {
    id: 'changing-color',
    routeFraction: 0.8,
    fallbackPosition: { left: '72%', top: '62%' },
    title: 'The colors kept changing',
    place: 'Along the spring',
    note: 'The colors kept changing as the trail opened toward the spring.',
    meta: 'Shared anonymously',
    image: require('../../assets/trails/grand-prismatic/grand-prismatic-spring.jpg'),
  },
];

export default function TrailStoriesScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const cameraRef = useRef<Mapbox.Camera>(null);
  const [pulse] = useState(() => new Animated.Value(0));
  const [guidanceOpacity] = useState(() => new Animated.Value(1));
  const [guidanceOffset] = useState(() => new Animated.Value(0));
  const hasPlayedIntro = useRef(false);
  const hasOpenedFirstEcho = useRef(false);
  const guidanceDismissed = useRef(false);
  const [trail, setTrail] = useState<Trail | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [showGuidance, setShowGuidance] = useState(true);
  const [selectedEcho, setSelectedEcho] = useState<PositionedEcho | null>(null);
  const [zoomLevel, setZoomLevel] = useState(overviewZoom);
  const trailName = trail?.name?.replace(/ Trail$/, '') ?? 'Grand Prismatic Overlook';
  const routeCoordinates = useMemo(() => outboundRouteCoordinates(trail?.route_geojson?.geometry.coordinates ?? []), [trail]);
  const positionedEchoes = useMemo(() => {
    return trailEchoes.map((echo) => ({ ...echo, coordinate: coordinateAtFraction(routeCoordinates, echo.routeFraction) }));
  }, [routeCoordinates]);

  useEffect(() => {
    if (!slug) return;
    void getPublishedTrail(slug).then(setTrail);
  }, [slug]);

  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 1000, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  useEffect(() => {
    if (!mapReady || hasPlayedIntro.current || !trail?.route_geojson) return;
    hasPlayedIntro.current = true;
    const timer = setTimeout(() => {
      cameraRef.current?.setCamera({
        centerCoordinate: routeCenter,
        zoomLevel: overviewZoom,
        pitch: 38,
        heading: 22,
        padding: mapPadding,
        animationDuration: 1500,
        animationMode: 'flyTo',
      });
    }, 120);
    const firstEchoTimer = setTimeout(() => {
      if (hasOpenedFirstEcho.current || !positionedEchoes[0]) return;
      hasOpenedFirstEcho.current = true;
      const firstEcho = positionedEchoes[0];
      setSelectedEcho(firstEcho);
      cameraRef.current?.setCamera({
        centerCoordinate: firstEcho.coordinate,
        zoomLevel: echoZoom,
        pitch: 56,
        heading: 26,
        padding: mapPadding,
        animationDuration: 1250,
        animationMode: 'flyTo',
      });
    }, 1900);
    return () => {
      clearTimeout(timer);
      clearTimeout(firstEchoTimer);
    };
  }, [mapReady, positionedEchoes, trail]);

  const hideGuidance = useCallback(() => {
    if (guidanceDismissed.current) return;
    guidanceDismissed.current = true;
    Animated.parallel([
      Animated.timing(guidanceOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(guidanceOffset, { toValue: 12, duration: 220, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) setShowGuidance(false);
    });
  }, [guidanceOffset, guidanceOpacity]);

  useEffect(() => {
    if (mapboxToken && !mapReady) return;
    const timer = setTimeout(hideGuidance, 4200);
    return () => clearTimeout(timer);
  }, [hideGuidance, mapReady]);

  const shareInvite = () => {
    void Share.share({
      title: `Trail echoes from ${trailName}`,
      message: `See what people noticed along ${trailName} in TrailMark.`,
    });
  };

  const focusTrail = () => {
    setSelectedEcho(null);
    setZoomLevel(overviewZoom);
    cameraRef.current?.setCamera({
      centerCoordinate: routeCenter,
      zoomLevel: overviewZoom,
      pitch: 38,
      heading: 22,
      padding: mapPadding,
      animationDuration: 1050,
      animationMode: 'flyTo',
    });
  };

  const selectEcho = (echo: PositionedEcho, index: number) => {
    hideGuidance();
    setSelectedEcho(echo);
    cameraRef.current?.setCamera({
      centerCoordinate: echo.coordinate,
      zoomLevel: echoZoom,
      pitch: 56,
      heading: 26 + index * 12,
      padding: mapPadding,
      animationDuration: 1250,
      animationMode: 'flyTo',
    });
  };

  const nextEcho = () => {
    if (!selectedEcho) return;
    const currentIndex = positionedEchoes.findIndex((echo) => echo.id === selectedEcho.id);
    const nextIndex = (currentIndex + 1) % positionedEchoes.length;
    selectEcho(positionedEchoes[nextIndex], nextIndex);
  };

  const selectedEchoIndex = selectedEcho ? positionedEchoes.findIndex((echo) => echo.id === selectedEcho.id) : -1;
  const isLastEcho = selectedEchoIndex === positionedEchoes.length - 1;

  const zoomMap = (delta: number) => {
    hideGuidance();
    const nextZoom = Math.min(21.5, Math.max(11.8, zoomLevel + delta));
    setZoomLevel(nextZoom);
    cameraRef.current?.setCamera({ zoomLevel: nextZoom, animationDuration: 420, animationMode: 'easeTo' });
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      {mapboxToken ? (
        <Mapbox.MapView
          style={styles.map}
          styleURL={Mapbox.StyleURL.Outdoors}
          onDidFinishLoadingStyle={() => setMapReady(true)}
          scrollEnabled
          zoomEnabled
          rotateEnabled
          pitchEnabled
          logoEnabled={false}
          attributionEnabled={false}
          compassEnabled={false}
          scaleBarEnabled={false}
        >
          <Mapbox.Camera ref={cameraRef} defaultSettings={{ centerCoordinate: routeCenter, zoomLevel: overviewZoom, pitch: 0, heading: 0 }} />
          <Mapbox.RasterDemSource id="trail-echoes-terrain" url="mapbox://mapbox.mapbox-terrain-dem-v1" maxZoomLevel={14}>
            <Mapbox.Terrain style={{ exaggeration: 1.15 }} />
          </Mapbox.RasterDemSource>
          {trail?.route_geojson ? <>
            <Mapbox.ShapeSource id="trail-echoes-route" shape={trail.route_geojson}>
              <Mapbox.LineLayer id="trail-echoes-route-line" style={{ lineColor: '#277D54', lineWidth: 5, lineCap: 'round', lineJoin: 'round', lineOpacity: 0.95 }} />
            </Mapbox.ShapeSource>
            {routeCoordinates.length > 0 ? <>
              <Mapbox.MarkerView id="trail-echoes-start-point" coordinate={routeCoordinates[0]} allowOverlap>
                <View style={styles.anchorHitTarget}><View style={styles.startPoint} /></View>
              </Mapbox.MarkerView>
              <Mapbox.MarkerView id="trail-echoes-end-point" coordinate={routeCoordinates[routeCoordinates.length - 1]} allowOverlap>
                <View style={styles.anchorHitTarget}><View style={styles.endPoint} /></View>
              </Mapbox.MarkerView>
            </> : null}
          </> : null}
          {positionedEchoes.map((echo, index) => <Mapbox.MarkerView key={echo.id} id={`trail-echo-${echo.id}`} coordinate={echo.coordinate} allowOverlap>
            <Pressable accessibilityRole="button" accessibilityLabel={`Open echo from ${echo.place}`} onPress={() => selectEcho(echo, index)} style={styles.echoHitTarget}>
              <Animated.View style={[styles.echoPulse, selectedEcho?.id === echo.id && styles.echoPulseSelected, { transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.18] }) }] }]}>
                <View style={styles.echoCore} />
              </Animated.View>
            </Pressable>
          </Mapbox.MarkerView>)}
        </Mapbox.MapView>
      ) : (
        <View style={styles.mapFallback}>
          <View style={styles.fallbackRoute} />
          <View style={[styles.fallbackStartPoint, { left: '10%', top: '47%' }]} />
          <View style={[styles.fallbackEndPoint, { right: '12%', top: '78%' }]} />
          {trailEchoes.map((echo, index) => <Pressable key={echo.id} accessibilityRole="button" accessibilityLabel={`Open echo from ${echo.place}`} onPress={() => selectEcho({ ...echo, coordinate: routeCenter }, index)} style={[styles.fallbackMoment, echo.fallbackPosition, selectedEcho?.id === echo.id && styles.fallbackMomentSelected]} />)}
        </View>
      )}

      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']} pointerEvents="box-none">
        {selectedEcho ? <Pressable accessibilityRole="button" accessibilityLabel="Close echo" onPress={focusTrail} style={styles.dismissLayer} /> : null}
        <View style={styles.topBar}>
          <View style={styles.titleBlock}>
            <Text style={styles.eyebrow}>Trail echoes</Text>
            <Text numberOfLines={1} style={styles.title}>{trailName}</Text>
            <Text style={styles.subtitle}>A few featured moments from this trail</Text>
          </View>
        </View>

        <View style={styles.mapControls}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={({ pressed }) => [styles.mapControl, styles.leaveControl, pressed && styles.pressed]}>
            <TrailSymbol name="xmark" androidName="close" size={18} color="#FFFFFF" />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Share trail echoes" onPress={shareInvite} style={({ pressed }) => [styles.mapControl, pressed && styles.pressed]}>
            <TrailSymbol name="square.and.arrow.up" androidName="share" size={17} color="#FFFFFF" />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Recenter trail echoes" onPress={focusTrail} style={({ pressed }) => [styles.mapControl, pressed && styles.pressed]}>
            <TrailSymbol name="scope" androidName="center_focus_strong" size={18} color="#FFFFFF" />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Zoom in" onPress={() => zoomMap(1)} style={({ pressed }) => [styles.mapControl, pressed && styles.pressed]}>
            <TrailSymbol name="plus" androidName="add" size={19} color="#FFFFFF" />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Zoom out" onPress={() => zoomMap(-1)} style={({ pressed }) => [styles.mapControl, pressed && styles.pressed]}>
            <TrailSymbol name="minus" androidName="remove" size={19} color="#FFFFFF" />
          </Pressable>
        </View>

        {selectedEcho ? <View style={styles.bottomArea}>
          <View style={styles.echoSheet}>
            <Image source={selectedEcho.image} contentFit="cover" style={styles.echoImage} />
            <View style={styles.echoCopy}>
              <View style={styles.echoHeading}>
                <View style={styles.echoTextBlock}>
                  <Text style={styles.echoEyebrow}>Featured moment · {selectedEchoIndex + 1} of {positionedEchoes.length}</Text>
                  <Text style={styles.echoTitle}>{selectedEcho.title}</Text>
                  <Text style={styles.echoSubtitle}>{selectedEcho.place} · {selectedEcho.meta}</Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel="Close echo" onPress={focusTrail} style={styles.echoClose}>
                  <TrailSymbol name="xmark" androidName="close" size={15} color="#193323" />
                </Pressable>
              </View>
              <Text style={styles.echoContext}>“{selectedEcho.note}”</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={isLastEcho ? 'Return to trail overview' : 'Show the next trail echo'} onPress={isLastEcho ? focusTrail : nextEcho} style={({ pressed }) => [styles.echoAction, pressed && styles.pressed]}>
                <TrailSymbol name={isLastEcho ? 'arrow.uturn.backward' : 'arrow.right'} androidName={isLastEcho ? 'undo' : 'arrow_forward'} size={16} color="#FFFFFF" />
                <Text style={styles.echoActionText}>{isLastEcho ? 'Return to trail overview' : 'Keep exploring the trail'}</Text>
              </Pressable>
            </View>
          </View>
        </View> : showGuidance ? <View style={styles.guideArea}>
          <Animated.View pointerEvents="none" style={[styles.statusCard, { opacity: guidanceOpacity, transform: [{ translateY: guidanceOffset }] }]}>
            <View style={styles.statusIcon}><TrailSymbol name="sparkles" androidName="auto_awesome" size={17} color="#DDF2E3" /></View>
            <View style={styles.statusCopy}><Text style={styles.statusTitle}>Explore the trail’s echoes</Text><Text style={styles.statusText}>Tap a glow to hear what someone chose to remember here.</Text></View>
          </Animated.View>
        </View> : null}
      </SafeAreaView>
    </View>
  );
}

function coordinateAtFraction(coordinates: number[][], fraction: number): Coordinate {
  if (coordinates.length < 2) return [-110.836, 44.52];

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

  const last = coordinates[coordinates.length - 1];
  return [last[0], last[1]];
}

function outboundRouteCoordinates(coordinates: number[][]): number[][] {
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

function TrailSymbol({ name, androidName, size, color }: { name: string; androidName: string; size: number; color: string }) {
  return <SymbolView name={{ ios: name as SFSymbol, android: androidName as never, web: androidName as never }} size={size} weight="medium" tintColor={color} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#DCE9DE' },
  map: { ...StyleSheet.absoluteFill },
  mapFallback: { ...StyleSheet.absoluteFill, backgroundColor: '#DCE9DE' },
  fallbackRoute: { position: 'absolute', left: '10%', top: '47%', width: '78%', height: 5, borderRadius: 3, backgroundColor: '#277D54', transform: [{ rotate: '22deg' }] },
  fallbackStartPoint: { position: 'absolute', width: 15, height: 15, marginLeft: -7.5, marginTop: -7.5, borderRadius: 8, backgroundColor: '#72D48B', borderWidth: 3, borderColor: '#FFFFFF' },
  fallbackEndPoint: { position: 'absolute', width: 20, height: 20, marginRight: -10, marginTop: -10, borderRadius: 10, backgroundColor: '#F07455', borderWidth: 4, borderColor: '#FFFFFF', shadowColor: '#8E301D', shadowOpacity: 0.28, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  fallbackMoment: { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: '#277D54', borderWidth: 4, borderColor: '#FFFFFF' },
  fallbackMomentSelected: { width: 31, height: 31, borderRadius: 16, marginLeft: -5.5, marginTop: -5.5, backgroundColor: '#B5D9C0' },
  overlay: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  topBar: { alignSelf: 'flex-start', maxWidth: '92%', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.92)' },
  titleBlock: { alignItems: 'flex-start', gap: 5, paddingHorizontal: 2 },
  eyebrow: { color: '#24794C', fontSize: 10, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  title: { color: '#193323', fontSize: 18, lineHeight: 22, fontWeight: '800', marginTop: 2 },
  subtitle: { color: '#4D6053', fontSize: 11, lineHeight: 15, marginTop: 2 },
  mapControls: { alignSelf: 'flex-end', gap: 10, marginTop: 'auto', marginBottom: 212 },
  mapControl: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: '#193F30', borderWidth: 1, borderColor: '#2F6D50', shadowColor: '#102419', shadowOpacity: 0.16, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  leaveControl: { backgroundColor: '#C7463D', borderColor: '#E1766D' },
  bottomArea: { position: 'absolute', left: 0, right: 0, bottom: 12 },
  guideArea: { position: 'absolute', left: 16, right: 16, bottom: 12 },
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, borderRadius: 18, backgroundColor: 'rgba(19,39,29,0.94)', borderWidth: 1, borderColor: '#345640' },
  statusIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#24794C' },
  statusCopy: { flex: 1, gap: 2 },
  statusTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  statusText: { color: '#B9D2C0', fontSize: 12, lineHeight: 17 },
  dismissLayer: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(17,35,25,0.08)' },
  echoSheet: { marginHorizontal: 16, overflow: 'hidden', borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.97)', borderWidth: 1, borderColor: '#D7E3DD', shadowColor: '#193323', shadowOpacity: 0.16, shadowRadius: 16, shadowOffset: { width: 0, height: 5 }, elevation: 8 },
  echoImage: { width: '100%', height: 164 },
  echoCopy: { padding: 15, gap: 9 },
  echoHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  echoTextBlock: { flex: 1, gap: 3 },
  echoEyebrow: { color: '#24794C', fontSize: 10, fontWeight: '800', letterSpacing: 0.7, textTransform: 'uppercase' },
  echoTitle: { color: '#193323', fontSize: 20, lineHeight: 24, fontWeight: '800', letterSpacing: -0.3 },
  echoSubtitle: { color: '#718279', fontSize: 13, lineHeight: 17, fontWeight: '600' },
  echoContext: { color: '#496255', fontSize: 14, lineHeight: 20 },
  echoClose: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#EAF1EC' },
  echoAction: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 3, borderRadius: 14, backgroundColor: '#226C4A' },
  echoActionText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  echoHitTarget: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center' },
  anchorHitTarget: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  startPoint: { width: 15, height: 15, borderRadius: 8, backgroundColor: '#72D48B', borderWidth: 3, borderColor: '#FFFFFF' },
  endPoint: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#F07455', borderWidth: 4, borderColor: '#FFFFFF', shadowColor: '#8E301D', shadowOpacity: 0.28, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  echoPulse: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: 'rgba(39,125,84,0.28)' },
  echoPulseSelected: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(39,125,84,0.42)' },
  echoCore: { width: 13, height: 13, borderRadius: 7, backgroundColor: '#277D54', borderWidth: 3, borderColor: '#FFFFFF' },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
});
