import Mapbox from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Feature, LineString, Position } from 'geojson';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getPublishedTrail } from '@/lib/trails';
import { grandPrismaticMoments } from '@/lib/trail-moments';

const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
const fallbackMarkCoordinate: Position = [-110.836, 44.520];
const nodConnected = true;
type MarkSource = 'nod' | 'phone';

if (mapboxToken) Mapbox.setAccessToken(mapboxToken);

export default function HikeScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const cameraRef = useRef<Mapbox.Camera>(null);
  const markingRef = useRef(false);
  const [routeShape, setRouteShape] = useState<Feature<LineString> | null>(null);
  const [trailName, setTrailName] = useState('Grand Prismatic Overlook');
  const [markedMoments, setMarkedMoments] = useState<{ id: string; momentId: string; coordinate: Position; source: MarkSource }[]>([]);
  const [latestMarkId, setLatestMarkId] = useState<string | null>(null);
  const [lastMarkedTitle, setLastMarkedTitle] = useState<string | null>(null);
  const [showMarkNotice, setShowMarkNotice] = useState(false);
  const [markNoticeOpacity] = useState(() => new Animated.Value(1));
  const [markNoticeOffset] = useState(() => new Animated.Value(0));
  const [showGuidance, setShowGuidance] = useState(true);
  const [guidanceOpacity] = useState(() => new Animated.Value(1));
  const [guidanceOffset] = useState(() => new Animated.Value(0));
  const guidanceDismissed = useRef(false);

  useEffect(() => {
    void Location.requestForegroundPermissionsAsync();
    if (slug) void getPublishedTrail(slug).then((trail) => {
      setRouteShape(trail?.route_geojson ?? null);
      if (trail?.name) setTrailName(trail.name.replace(/ Trail$/, ''));
    });
  }, [slug]);

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
  const markedCount = markedMoments.length;
  const demoComplete = markedCount >= grandPrismaticMoments.length;
  const remainingMoments = Math.max(0, grandPrismaticMoments.length - markedCount);
  const sessionLabel = markedCount ? 'Recording' : 'Ready';
  const markMoment = (source: MarkSource) => {
    if (demoComplete || markingRef.current) return;
    markingRef.current = true;
    const nextIndex = markedMoments.length;
    const preparedMoment = grandPrismaticMoments[nextIndex];
    const coordinate = preparedMoment.routeEnd ? (routeCoordinates[routeCoordinates.length - 1] ?? fallbackMarkCoordinate) : coordinateAtFraction(routeCoordinates, preparedMoment.routeFraction);
    const moment = { id: `moment-${Date.now()}`, momentId: preparedMoment.id, coordinate, source };
    setMarkedMoments((moments) => [...moments, moment]);
    setLatestMarkId(moment.id);
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

  const centerRoute = () => cameraRef.current?.setCamera({ centerCoordinate: [-110.836, 44.520], zoomLevel: 14.5, animationDuration: 600, animationMode: 'easeTo' });

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <Mapbox.MapView
        style={styles.map}
        styleURL={Mapbox.StyleURL.Light}
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
          defaultSettings={{ centerCoordinate: [-110.836, 44.520], zoomLevel: 12.2 }}
          centerCoordinate={[-110.836, 44.520]}
          zoomLevel={14.5}
          animationMode="flyTo"
          animationDuration={1100}
        />
        {routeShape ? (
          <>
            <Mapbox.ShapeSource id="trailmark-route" shape={routeShape}>
              <Mapbox.LineLayer id="trailmark-route-line" style={{ lineColor: '#39A9E8', lineWidth: 5, lineCap: 'round', lineJoin: 'round' }} />
            </Mapbox.ShapeSource>
            {routeCoordinates.length > 0 ? (
              <>
                <Mapbox.PointAnnotation id="hike-start-point" coordinate={routeCoordinates[0]}>
                  <View style={styles.startPoint} />
                </Mapbox.PointAnnotation>
                <Mapbox.PointAnnotation id="hike-end-point" coordinate={routeCoordinates[routeCoordinates.length - 1]}>
                  <View style={styles.endPoint} />
                </Mapbox.PointAnnotation>
              </>
            ) : null}
          </>
        ) : null}
        {markedMoments.map((moment) => (
          <Mapbox.MarkerView key={moment.id} coordinate={moment.coordinate} allowOverlap allowOverlapWithPuck pointerEvents="none">
            <View style={[styles.momentMarker, latestMarkId === moment.id && styles.momentMarkerLatest]}><View style={styles.momentMarkerCore} /></View>
          </Mapbox.MarkerView>
        ))}
        <Mapbox.UserLocation visible animated />
      </Mapbox.MapView>

      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']} pointerEvents="box-none">
        <View style={styles.topBar}>
          <View style={styles.titleBlock}>
            <Text numberOfLines={1} style={styles.title}>{trailName}</Text>
            <View style={styles.sessionState}><View style={[styles.recordingDot, demoComplete && styles.completeDot, !markedCount && styles.readyDot]} /><Text style={styles.subtitle}>{sessionLabel} · {nodConnected ? 'Nod connected' : 'Phone marking'} · {markedCount} {markedCount === 1 ? 'moment' : 'moments'}</Text></View>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Show full trail" onPress={centerRoute} style={styles.roundControl}>
            <TrailSymbol name="scope" androidName="center_focus_strong" size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        <View pointerEvents="none" style={[styles.attribution, styles.attributionLight]}><Text style={[styles.attributionText, styles.attributionTextLight]}>© Mapbox · © OpenStreetMap</Text></View>

        <View style={styles.bottomArea}>
          {showGuidance && !demoComplete ? (
            <Animated.View pointerEvents="none" style={[styles.statusCard, { opacity: guidanceOpacity, transform: [{ translateY: guidanceOffset }] }]}>
              <View style={styles.statusIcon}><TrailSymbol name={nodConnected ? 'dot.radiowaves.left.and.right' : 'iphone'} androidName={nodConnected ? 'bluetooth_connected' : 'phone_iphone'} size={17} color="#DDF2E3" /></View>
              <View style={styles.statusCopy}>
                <Text style={styles.statusTitle}>{markedCount ? `${markedCount} moment${markedCount === 1 ? '' : 's'} captured` : nodConnected ? 'Nod is ready' : 'Ready to mark'}</Text>
                <Text style={styles.statusText}>{markedCount ? `${remainingMoments} more ${remainingMoments === 1 ? 'moment' : 'moments'} in this demo route.` : nodConnected ? 'Press Nod once when something catches your attention.' : 'Press when a moment is worth keeping.'}</Text>
              </View>
            </Animated.View>
          ) : null}
          {showMarkNotice ? <Animated.View pointerEvents="none" style={[styles.markNotice, { opacity: markNoticeOpacity, transform: [{ translateY: markNoticeOffset }] }]}><View style={styles.markNoticeIcon}><TrailSymbol name="checkmark" androidName="check" size={15} color="#FFFFFF" /></View><View style={styles.statusCopy}><Text style={styles.statusTitle}>{`Moment ${markedCount} of ${grandPrismaticMoments.length} marked`}</Text><Text style={styles.statusText}>{lastMarkedTitle ?? 'You can make sense of it after the hike.'}</Text></View></Animated.View> : null}
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" accessibilityLabel={demoComplete ? 'All demo moments captured' : nodConnected ? 'Use phone fallback to mark a moment' : 'Mark a moment'} disabled={demoComplete} onPress={() => markMoment(nodConnected ? 'phone' : 'nod')} style={({ pressed }) => [styles.markButton, nodConnected && styles.phoneMarkButton, demoComplete && styles.markButtonComplete, pressed && styles.pressed]}>
              <TrailSymbol name={nodConnected ? 'iphone' : 'circle.fill'} androidName={nodConnected ? 'phone_iphone' : 'radio_button_checked'} size={17} color="#193323" />
              <Text style={styles.markText}>{demoComplete ? 'Moments captured' : nodConnected ? 'Mark on phone' : 'Mark moment'}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Finish hike" onPress={() => router.push({ pathname: '/reflect', params: { markedCount: String(markedCount), momentIds: JSON.stringify(markedMoments.map((moment) => moment.momentId)) } })} style={({ pressed }) => [styles.finishButton, pressed && styles.pressed]}>
              <Text style={styles.finishText}>Finish</Text>
            </Pressable>
          </View>
        </View>
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
  screen: { flex: 1, backgroundColor: '#101714' },
  map: { ...StyleSheet.absoluteFill, backgroundColor: '#101714' },
  overlay: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)' },
  roundControl: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#183126', borderWidth: 1, borderColor: '#2C5A43' },
  titleBlock: { flex: 1, alignItems: 'flex-start', gap: 5, paddingHorizontal: 2 },
  title: { color: '#183126', fontSize: 17, fontWeight: '800', letterSpacing: -0.2, textAlign: 'left' },
  sessionState: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recordingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D85A45' },
  readyDot: { backgroundColor: '#D5A441' },
  completeDot: { backgroundColor: '#4AAB67' },
  subtitle: { color: '#496255', fontSize: 12, textAlign: 'left' },
  startPoint: { width: 15, height: 15, borderRadius: 8, backgroundColor: '#72D48B', borderWidth: 3, borderColor: '#FFFFFF' },
  endPoint: { width: 15, height: 15, borderRadius: 8, backgroundColor: '#F07455', borderWidth: 3, borderColor: '#FFFFFF' },
  momentMarker: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1B4B37', borderWidth: 3, borderColor: '#FFFFFF' },
  momentMarkerLatest: { width: 30, height: 30, borderRadius: 15, borderColor: '#C5F0CE' },
  momentMarkerCore: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#A8DFB6' },
  attribution: { position: 'absolute', left: 18, bottom: 148, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 6 },
  attributionLight: { backgroundColor: 'rgba(255,255,255,0.72)' },
  attributionDark: { backgroundColor: 'rgba(17,31,24,0.72)' },
  attributionText: { fontSize: 9, fontWeight: '600' },
  attributionTextLight: { color: '#53645A' },
  attributionTextDark: { color: '#B9CFC1' },
  bottomArea: { gap: 10 },
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, borderRadius: 18, backgroundColor: 'rgba(19, 39, 29, 0.94)', borderWidth: 1, borderColor: '#345640' },
  markNotice: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, borderRadius: 18, backgroundColor: 'rgba(19, 39, 29, 0.96)', borderWidth: 1, borderColor: '#4D8A61' },
  statusIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#24794C' },
  markNoticeIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#3F9B59' },
  statusCopy: { flex: 1, gap: 2 },
  statusTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  statusText: { color: '#B9D2C0', fontSize: 12, lineHeight: 17 },
  actions: { flexDirection: 'row', gap: 10 },
  markButton: { flex: 1, minHeight: 56, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#A8DFB6' },
  phoneMarkButton: { backgroundColor: 'rgba(255,255,255,0.94)', borderWidth: 1, borderColor: '#D7E3DD' },
  markButtonComplete: { backgroundColor: '#DDE9E1', borderColor: '#DDE9E1' },
  markText: { color: '#193323', fontSize: 16, fontWeight: '800' },
  finishButton: { minWidth: 94, minHeight: 56, paddingHorizontal: 18, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EB7657' },
  finishText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.78 },
});
