import Mapbox from '@rnmapbox/maps';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Modal, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, useWindowDimensions, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/trailmark-theme';
import { getPublishedTrail, type Trail } from '@/lib/trails';
import { getTrailNoticingSuggestion } from '@/lib/trail-noticing';
import { isNodConnected } from '@/lib/onboarding';

const palette = colors.light;
const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

if (mapboxToken) Mapbox.setAccessToken(mapboxToken);

const heroImage = require('../../assets/trails/grand-prismatic/overlook.jpg');
const trailImagesPhoto = require('../../assets/trails/grand-prismatic/spring.jpg');
const nodAsset = require('../../assets/images/transparent-nod.png');
const photoTourSlides = [
  {
    image: require('../../assets/trails/grand-prismatic/firehole-bridge.jpg'),
    title: 'Begin near the Firehole River',
    description: 'The walk starts through the forest near the river before opening toward the thermal basin.',
    credit: 'NPS/Diane Renkin',
  },
  {
    image: require('../../assets/trails/grand-prismatic/midway.jpg'),
    title: 'Move through Midway Geyser Basin',
    description: 'Boardwalks and steam frame the changing colors and scale of the basin.',
    credit: 'NPS/Neal Herbert',
  },
  {
    image: require('../../assets/trails/grand-prismatic/grand-prismatic-spring.jpg'),
    title: 'See Grand Prismatic open up',
    description: 'The overlook reveals the spring’s blue center and the bands of color around it.',
    credit: 'NPS/Jim Peaco',
  },
  {
    image: require('../../assets/trails/grand-prismatic/excelsior.jpg'),
    title: 'Look back across the basin',
    description: 'From above, the trail becomes part of a much larger thermal landscape.',
    credit: 'NPS/Jim Peaco',
  },
] as const;

export default function TrailPreviewScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const photoTourScrollRef = useRef<ScrollViewInstance>(null);
  const suggestion = getTrailNoticingSuggestion(slug);
  const [trail, setTrail] = useState<Trail | null>(null);
  const [customNotice, setCustomNotice] = useState(() => suggestion?.focus ?? '');
  const [noticeSaved, setNoticeSaved] = useState(false);
  const [saved, setSaved] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [photoTourOpen, setPhotoTourOpen] = useState(false);
  const [photoTourIndex, setPhotoTourIndex] = useState(0);
  const nodConnected = isNodConnected();
  const suggestionStatus = !customNotice.trim() ? 'Optional' : customNotice.trim() === suggestion?.focus ? 'For this trail' : 'Your detail';

  useEffect(() => {
    if (!slug) return;
    void getPublishedTrail(slug).then(setTrail);
  }, [slug]);

  const distance = useMemo(() => {
    if (!trail?.distance_m) return '—';
    return (trail.distance_m / 1609.34).toFixed(1) + ' mi';
  }, [trail]);

  const duration = useMemo(() => {
    if (!trail?.estimated_minutes) return '—';
    const hours = Math.floor(trail.estimated_minutes / 60);
    const minutes = trail.estimated_minutes % 60;
    return hours ? hours + (minutes ? 'h ' + minutes + 'm' : 'h') : minutes + 'm';
  }, [trail]);

  const trailName = trail?.name?.replace(/ Trail$/, '') ?? 'Grand Prismatic Overlook';

  const shareTrail = async () => {
    await Share.share({
      title: trailName,
      message: 'Take a look at ' + trailName + ' in TrailMark.',
    });
  };

  const startTrip = () => router.push({
    pathname: '/hike',
    params: { slug: trail?.slug ?? slug ?? 'grand-prismatic-overlook', notice: customNotice.trim() },
  });

  const openPhotoTour = () => {
    setPhotoTourIndex(0);
    setPhotoTourOpen(true);
  };

  useEffect(() => {
    if (!photoTourOpen) return;
    const timer = setTimeout(() => {
      const nextIndex = (photoTourIndex + 1) % photoTourSlides.length;
      setPhotoTourIndex(nextIndex);
      photoTourScrollRef.current?.scrollTo({ x: screenWidth * nextIndex, animated: true });
    }, 4500);
    return () => clearTimeout(timer);
  }, [photoTourIndex, photoTourOpen, screenWidth]);

  useEffect(() => {
    if (photoTourOpen) photoTourScrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [photoTourOpen]);

  return (
    <View style={styles.page}>
      <StatusBar style="light" />
      <View style={styles.screenContent}>
        <View style={styles.hero}>
          <Image source={heroImage} contentFit="cover" style={StyleSheet.absoluteFill} />
          <View style={styles.heroShade} />

          <SafeAreaView edges={['top']} style={styles.heroSafe}>
            <View style={styles.heroControls}>
              <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.glassButton}>
                <Text style={styles.backIcon}>‹</Text>
              </Pressable>
              <View style={styles.heroActions}>
                <Pressable accessibilityRole="button" accessibilityLabel="Share trail" onPress={() => void shareTrail()} style={styles.glassButton}>
                  <TrailSymbol name="square.and.arrow.up" androidName="share" size={18} color="#FFFFFF" />
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="More trail actions" onPress={() => setMenuOpen((value) => !value)} style={styles.glassButton}>
                  <TrailSymbol name="ellipsis" androidName="more_vert" size={20} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          </SafeAreaView>

          {menuOpen ? (
            <View style={styles.actionMenu}>
              <Pressable accessibilityRole="button" accessibilityLabel={saved ? 'Remove saved trail' : 'Save trail'} onPress={() => { setSaved((value) => !value); setMenuOpen(false); }} style={styles.menuAction}>
                <TrailSymbol name={saved ? 'bookmark.fill' : 'bookmark'} androidName="bookmark" size={17} color="#233128" />
                <Text style={styles.menuActionText}>{saved ? 'Saved' : 'Save trail'}</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.heroIdentity}>
            <View style={styles.rating}><Text style={styles.ratingStar}>★</Text><Text style={styles.ratingText}>4.8</Text></View>
            <Text style={styles.heroTitle}>{trailName}</Text>
            <Text style={styles.heroLocation}>Fairy Falls → Midway Geyser Basin</Text>
          </View>
        </View>

        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.sheetScrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.routeSummary}>
            <View style={styles.mapCard}>
              <View style={styles.mapHeading}>
                <View style={styles.routeMark}><TrailSymbol name="map.fill" androidName="map" size={18} color={palette.accent} /></View>
                <View style={styles.mapHeadingCopy}>
                  <Text style={styles.cardLabel}>Trail route</Text>
                  <Text numberOfLines={1} style={styles.cardTitle}>Grand Prismatic overlook</Text>
                </View>
              </View>
              <View style={styles.mapFrame}>
                <Mapbox.MapView style={styles.map} styleURL={Mapbox.StyleURL.Outdoors} logoEnabled={false} attributionEnabled={false} scaleBarEnabled={false} scrollEnabled zoomEnabled rotateEnabled={false} pitchEnabled={false}>
                  <Mapbox.Camera
                    defaultSettings={{ centerCoordinate: [-110.836, 44.520], zoomLevel: 11.5 }}
                    centerCoordinate={[-110.836, 44.520]}
                    zoomLevel={13.8}
                    animationMode="flyTo"
                    animationDuration={1100}
                  />
                  {trail?.route_geojson ? (
                    <>
                      <Mapbox.ShapeSource id="preview-route" shape={trail.route_geojson}>
                        <Mapbox.LineLayer id="preview-route-line" style={{ lineColor: palette.accent, lineWidth: 4, lineCap: 'round', lineJoin: 'round' }} />
                      </Mapbox.ShapeSource>
                      <Mapbox.PointAnnotation id="trail-start-point" coordinate={trail.route_geojson.geometry.coordinates[0]}>
                        <View style={styles.routePointStart} />
                      </Mapbox.PointAnnotation>
                      <Mapbox.PointAnnotation id="trail-end-point" coordinate={trail.route_geojson.geometry.coordinates[trail.route_geojson.geometry.coordinates.length - 1]}>
                        <View style={styles.routePointEnd} />
                      </Mapbox.PointAnnotation>
                    </>
                  ) : null}
                </Mapbox.MapView>
              </View>
            </View>

            <View style={styles.statColumn}>
              <StatCard label="Distance" value={distance} symbol="arrow.left.and.right" androidSymbol="swap_horiz" />
              <StatCard label="Elevation" value="105 ft" symbol="mountain.2" androidSymbol="terrain" />
              <StatCard label="Time" value={duration} symbol="clock" androidSymbol="schedule" />
            </View>
          </View>

          <View style={styles.mediaRow}>
            <View style={[styles.mediaTile, styles.nodTile]}>
              <Image source={nodAsset} contentFit="contain" style={styles.nodTileImage} />
              <Text style={styles.nodTileLabel}>{nodConnected ? 'Nod ready' : 'Phone marking'}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Open photo tour" onPress={openPhotoTour} style={({ pressed }) => [styles.mediaTile, pressed && styles.pressed]}>
              <Image source={trailImagesPhoto} contentFit="cover" style={styles.mediaImage} />
              <View style={styles.mediaShade} />
              <View style={styles.mediaPlay}><TrailSymbol name="play.fill" androidName="play_arrow" size={15} color="#FFFFFF" /></View>
              <Text style={styles.mediaLabel}>Photo tour</Text>
            </Pressable>
          </View>

          <View style={styles.briefing}>
            <View style={styles.briefingIntro}>
              <Text style={styles.sectionTitle}>Before you go</Text>
              <Text style={styles.summary}>{trail?.summary ?? 'A short walk to a wide view over Grand Prismatic Spring and Midway Geyser Basin.'}</Text>
            </View>

            <View style={styles.noticeBlock}>
              <View style={styles.noticeHeading}>
                <Text style={styles.smallTitle}>What do you want to notice?</Text>
                <View style={styles.suggestionTag}><TrailSymbol name="sparkles" androidName="auto_awesome" size={14} color={palette.accent} /><Text style={styles.suggestionTagText}>{suggestionStatus}</Text></View>
              </View>
              <View style={styles.noticeInputShell}>
                <TextInput
                  accessibilityLabel="Suggested noticing detail. Edit or clear it to make it your own."
                  placeholder="Add your own detail"
                  placeholderTextColor="#7A897E"
                  value={customNotice}
                  onChangeText={(value) => { setCustomNotice(value); setNoticeSaved(false); }}
                  onFocus={() => setNoticeSaved(false)}
                  onSubmitEditing={() => {
                    if (customNotice.trim()) {
                      setNoticeSaved(true);
                      Keyboard.dismiss();
                    }
                  }}
                  returnKeyType="done"
                  style={styles.noticeInput}
                />
                {noticeSaved ? <View style={styles.noticeSaved}><TrailSymbol name="checkmark" androidName="check" size={16} color={palette.accent} /></View> : null}
              </View>
            </View>

            <View style={styles.routeSection}>
              <View style={styles.routeSectionHeading}>
                <View style={styles.routeHeadingCopy}>
              <Text style={styles.sectionTitle}>Along the way</Text>
                  <Text style={styles.sectionCopy}>A few places to expect as you move through the trail.</Text>
                </View>
                <TrailSymbol name="map" androidName="map" size={20} color={palette.accent} />
              </View>
              {(trail?.landmarks ?? []).map((landmark, index) => <LandmarkRow key={landmark.title} index={index + 1} title={landmark.title} note={landmark.note} accent={palette.accent} soft="#E3F0E7" />)}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Explore what people noticed on this trail"
              onPress={() => router.push({ pathname: '/trail-stories', params: { slug: trail?.slug ?? slug ?? 'grand-prismatic-overlook' } })}
              style={({ pressed }) => [styles.echoLink, pressed && styles.pressed]}
            >
              <View style={styles.echoLinkIcon}><TrailSymbol name="bubble.left.and.bubble.right.fill" androidName="forum" size={20} color={palette.accent} /></View>
              <View style={styles.echoLinkCopy}>
                <Text style={styles.echoLinkEyebrow}>Trail echoes</Text>
                <Text style={styles.echoLinkTitle}>Explore what people noticed here</Text>
                <Text style={styles.echoLinkText}>Moments gathered along this route.</Text>
              </View>
              <Text style={styles.echoLinkArrow}>›</Text>
            </Pressable>

          </View>
          </ScrollView>
        </View>
      </View>

      <SafeAreaView edges={['bottom']} style={styles.footerSafe}>
        <Pressable accessibilityRole="button" accessibilityLabel="Start your trip" onPress={startTrip} style={({ pressed }) => [styles.startButton, pressed && styles.pressed]}>
          <Text style={styles.startText}>Start trip</Text>
          <Text style={styles.startArrow}>→</Text>
        </Pressable>
      </SafeAreaView>

      <Modal visible={photoTourOpen} animationType="fade" presentationStyle="fullScreen" onRequestClose={() => setPhotoTourOpen(false)}>
        <View style={styles.photoTourScreen}>
          <StatusBar style="light" />
          <ScrollView
            ref={photoTourScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            bounces={false}
            onMomentumScrollEnd={(event) => setPhotoTourIndex(Math.round(event.nativeEvent.contentOffset.x / screenWidth))}
          >
            {photoTourSlides.map((slide, index) => (
              <View key={slide.title} style={[styles.photoTourPage, { width: screenWidth, height: screenHeight }]}>
                <Image source={slide.image} contentFit="cover" style={StyleSheet.absoluteFill} />
                <View style={styles.photoTourShade} />
                <LinearGradient
                  pointerEvents="none"
                  colors={['transparent', 'rgba(5, 18, 11, 0.06)', 'rgba(5, 18, 11, 0.42)', 'rgba(5, 18, 11, 0.82)']}
                  locations={[0, 0.36, 0.72, 1]}
                  style={styles.photoTourBottomFade}
                />
                <SafeAreaView style={styles.photoTourOverlay} edges={['top', 'bottom']}>
                  <View style={styles.photoTourTopBar}>
                    <Pressable accessibilityRole="button" accessibilityLabel="Close photo tour" onPress={() => setPhotoTourOpen(false)} style={styles.photoTourClose}>
                      <TrailSymbol name="xmark" androidName="close" size={18} color="#FFFFFF" />
                    </Pressable>
                    <View style={styles.photoTourBadge}><Text style={styles.photoTourBadgeText}>{trailName}</Text></View>
                    <View style={styles.photoTourCount}><Text style={styles.photoTourCountText}>{index + 1} / {photoTourSlides.length}</Text></View>
                  </View>
                  <View style={styles.photoTourBottom}>
                    <View style={styles.photoTourDots}>{photoTourSlides.map((item, dotIndex) => <View key={item.title} style={[styles.photoTourDot, dotIndex === photoTourIndex && styles.photoTourDotActive]} />)}</View>
                    <Text style={styles.photoTourTitle}>{slide.title}</Text>
                    <Text style={styles.photoTourDescription}>{slide.description}</Text>
                    <Text style={styles.photoTourCredit}>{slide.credit} · Yellowstone National Park</Text>
                  </View>
                </SafeAreaView>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function TrailSymbol({ name, androidName, size, color }: { name: string; androidName: string; size: number; color: string }) {
  return <SymbolView name={{ ios: name as SFSymbol, android: androidName as never, web: androidName as never }} size={size} weight="medium" tintColor={color} />;
}

function StatCard({ label, value, symbol, androidSymbol }: { label: string; value: string; symbol: string; androidSymbol: string }) {
  return <View style={styles.statCard}><View style={styles.statLabelRow}><TrailSymbol name={symbol} androidName={androidSymbol} size={15} color={palette.accent} /><Text style={styles.statLabel}>{label}</Text></View><Text style={styles.statValue}>{value}</Text></View>;
}

function LandmarkRow({ index, title, note, accent, soft }: { index: number; title: string; note: string; accent: string; soft: string }) {
  return <View style={styles.landmarkRow}><View style={[styles.landmarkNumber, { backgroundColor: soft }]}><Text style={[styles.landmarkNumberText, { color: accent }]}>{index}</Text></View><View style={styles.landmarkCopy}><Text style={styles.landmarkTitle}>{title}</Text><Text style={styles.landmarkNote}>{note}</Text></View></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.background },
  screenContent: { flex: 1 },
  sheetScrollContent: { paddingBottom: 148 },
  hero: { height: 440, backgroundColor: '#25382D' },
  heroShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(7, 20, 13, 0.18)' },
  heroSafe: { zIndex: 2 },
  heroControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 8 },
  heroActions: { flexDirection: 'row', gap: 10 },
  glassButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(238, 244, 239, 0.27)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  backIcon: { color: '#FFFFFF', fontSize: 34, lineHeight: 34, fontWeight: '300', marginTop: -4 },
  actionMenu: { position: 'absolute', top: 76, right: 18, zIndex: 5, minWidth: 142, padding: 5, borderRadius: 14, backgroundColor: '#FFFFFF', shadowColor: '#000000', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 6 },
  menuAction: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 10 },
  menuActionText: { color: '#233128', fontSize: 14, fontWeight: '700' },
  heroIdentity: { position: 'absolute', left: 20, right: 20, bottom: 42, gap: 6 },
  rating: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.82)' },
  ratingStar: { color: '#E8B82F', fontSize: 14 },
  ratingText: { color: '#233128', fontSize: 13, fontWeight: '800' },
  heroTitle: { color: '#FFFFFF', fontSize: 32, lineHeight: 36, fontWeight: '800', letterSpacing: -0.8 },
  heroLocation: { color: 'rgba(255,255,255,0.82)', fontSize: 14, fontWeight: '600' },
  sheet: { flex: 1, marginTop: -24, paddingHorizontal: 18, paddingTop: 22, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: palette.surface, overflow: 'hidden' },
  routeSummary: { flexDirection: 'row', gap: 10 },
  mapCard: { flex: 1.75, minHeight: 250, borderRadius: 22, padding: 12, backgroundColor: '#F0F4EF' },
  mapHeading: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingBottom: 10 },
  routeMark: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surface },
  routeMarkText: { color: palette.accent, fontSize: 21, fontWeight: '800' },
  mapHeadingCopy: { flex: 1, gap: 2 },
  cardLabel: { color: palette.secondary, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  cardTitle: { color: palette.text, fontSize: 13, fontWeight: '700' },
  mapFrame: { flex: 1, minHeight: 175, overflow: 'hidden', borderRadius: 16, backgroundColor: '#DCE5DC' },
  map: { ...StyleSheet.absoluteFill },
  routePointStart: { width: 16, height: 16, borderRadius: 8, backgroundColor: palette.accent, borderWidth: 3, borderColor: '#FFFFFF' },
  routePointEnd: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#E99A55', borderWidth: 3, borderColor: '#FFFFFF' },
  mediaRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  mediaTile: { flex: 1, height: 126, overflow: 'hidden', borderRadius: 18, backgroundColor: '#DCE5DC' },
  nodTile: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F4EF' },
  nodTileImage: { width: 118, height: 86, marginTop: -4 },
  nodTileLabel: { color: palette.secondary, fontSize: 11, fontWeight: '800', marginTop: -7 },
  mediaImage: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  mediaShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(12, 25, 17, 0.24)' },
  mediaPlay: { position: 'absolute', left: '50%', top: '50%', width: 38, height: 38, marginLeft: -19, marginTop: -19, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(26, 50, 37, 0.62)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.65)' },
  mediaLabel: { position: 'absolute', left: 12, bottom: 10, color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  photoTourScreen: { flex: 1, backgroundColor: '#101714' },
  photoTourPage: { position: 'relative', backgroundColor: '#101714' },
  photoTourShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(5, 18, 11, 0.22)' },
  photoTourBottomFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 340 },
  photoTourOverlay: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 18, paddingBottom: 24 },
  photoTourTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingTop: 8 },
  photoTourClose: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: 'rgba(20, 45, 33, 0.76)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  photoTourBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(245,247,243,0.9)' },
  photoTourBadgeText: { color: '#193323', fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
  photoTourCount: { minWidth: 44, alignItems: 'flex-end' },
  photoTourCountText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  photoTourBottom: { paddingTop: 22, paddingBottom: 4 },
  photoTourDots: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  photoTourDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.46)' },
  photoTourDotActive: { width: 22, backgroundColor: '#FFFFFF' },
  photoTourTitle: { color: '#FFFFFF', fontSize: 30, lineHeight: 35, fontWeight: '800', letterSpacing: -0.6 },
  photoTourDescription: { maxWidth: 350, color: '#E0ECE3', fontSize: 16, lineHeight: 23, marginTop: 8 },
  photoTourCredit: { color: '#C1D4C6', fontSize: 11, lineHeight: 16, marginTop: 13 },
  statColumn: { flex: 1, gap: 8 },
  statCard: { flex: 1, minHeight: 76, justifyContent: 'space-between', borderRadius: 18, padding: 12, backgroundColor: '#F0F4EF' },
  statLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statSymbol: { color: palette.accent, fontSize: 15, fontWeight: '800' },
  statLabel: { color: palette.secondary, fontSize: 11, fontWeight: '600' },
  statValue: { color: palette.text, fontSize: 17, fontWeight: '800' },
  briefing: { paddingTop: 24, gap: 24 },
  briefingIntro: { gap: 8 },
  sectionTitle: { color: palette.text, fontSize: 21, lineHeight: 26, fontWeight: '800', letterSpacing: -0.25 },
  summary: { color: palette.secondary, fontSize: 15, lineHeight: 21 },
  sectionCopy: { color: palette.secondary, fontSize: 13, lineHeight: 18 },
  noticeBlock: { gap: 11, paddingTop: 20, borderTopWidth: 1, borderColor: palette.line },
  noticeHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  suggestionTag: { minHeight: 30, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, borderRadius: 15, backgroundColor: '#F0F4EF' },
  suggestionTagText: { color: palette.accent, fontSize: 11, fontWeight: '800' },
  smallTitle: { color: palette.text, fontSize: 18, fontWeight: '800' },
  noticeInputShell: { minHeight: 58, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: palette.line, borderRadius: 17, backgroundColor: '#F7F9F6' },
  noticeInput: { flex: 1, minHeight: 58, paddingHorizontal: 16, color: palette.text, fontSize: 15 },
  noticeSaved: { width: 34, height: 34, marginRight: 10, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E1F1E6' },
  routeSection: { gap: 10, paddingTop: 2, paddingBottom: 12 },
  routeSectionHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  routeHeadingCopy: { flex: 1, gap: 4 },
  landmarkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, padding: 14, borderRadius: 18, backgroundColor: '#F7F9F6' },
  landmarkNumber: { width: 27, height: 27, borderRadius: 14, backgroundColor: '#E3F0E7', alignItems: 'center', justifyContent: 'center' },
  landmarkNumberText: { color: palette.accent, fontSize: 13, fontWeight: '800' },
  landmarkCopy: { flex: 1, gap: 3 },
  landmarkTitle: { color: palette.text, fontSize: 15, lineHeight: 19, fontWeight: '700' },
  landmarkNote: { color: palette.secondary, fontSize: 13, lineHeight: 18 },
  echoLink: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 15, borderRadius: 20, backgroundColor: '#F0F5F0', borderWidth: 1, borderColor: '#D9E6DA' },
  echoLinkIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: '#DCEDE0' },
  echoLinkCopy: { flex: 1, gap: 3 },
  echoLinkEyebrow: { color: palette.accent, fontSize: 10, fontWeight: '800', letterSpacing: 0.7, textTransform: 'uppercase' },
  echoLinkTitle: { color: palette.text, fontSize: 15, lineHeight: 19, fontWeight: '800' },
  echoLinkText: { color: palette.secondary, fontSize: 12, lineHeight: 17 },
  echoLinkArrow: { fontSize: 27, fontWeight: '300' },
  footerSafe: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 10, backgroundColor: 'rgba(255,255,255,0.96)', borderTopWidth: 1, borderColor: palette.line },
  startButton: { width: '100%', minHeight: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: palette.accent },
  startText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  startArrow: { color: '#FFFFFF', fontSize: 21, fontWeight: '700' },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
});
