import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/trailmark-theme';

export function useTrailmarkColors() {
  return colors.light;
}

export function Screen({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  const palette = useTrailmarkColors();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} contentInsetAdjustmentBehavior="automatic">
        <View style={styles.content}>
          <View style={[styles.accent, { backgroundColor: palette.accent }]} />
          <Text accessibilityRole="header" style={[styles.title, { color: palette.text }]}>{title}</Text>
          {description ? <Text style={[styles.description, { color: palette.secondary }]}>{description}</Text> : null}
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  const palette = useTrailmarkColors();
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={[styles.sectionTitle, { color: palette.text }]}>{title}</Text>
      {children}
    </View>
  );
}

export function Note({ children }: { children: ReactNode }) {
  const palette = useTrailmarkColors();
  return <Text style={[styles.note, { color: palette.secondary }]}>{children}</Text>;
}

export function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  const palette = useTrailmarkColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        { backgroundColor: palette.accent, opacity: pressed ? 0.78 : 1 },
      ]}
    >
      <Text style={styles.actionButtonLabel}>{label}</Text>
    </Pressable>
  );
}

export function TrailCard({
  title,
  detail,
  onPress,
}: {
  title: string;
  detail: string;
  onPress?: () => void;
}) {
  const content = (
    <>
      <Text style={styles.trailEyebrow}>READY TO EXPLORE</Text>
      <Text style={styles.trailTitle}>{title}</Text>
      <Text style={styles.trailDetail}>{detail}</Text>
      <View style={styles.routeLine} accessibilityElementsHidden>
        <View style={styles.routeDot} />
        <View style={styles.routeStroke} />
        <View style={[styles.routeDot, styles.routeDotEnd]} />
      </View>
      <View style={styles.trailFooter}>
        <Text style={styles.trailFooterText}>{onPress ? 'View trail' : 'Trail selected'}</Text>
        {onPress ? <Text style={styles.trailArrow}>→</Text> : null}
      </View>
    </>
  );

  if (!onPress) return <View style={styles.trailCard}>{content}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.trailCard, { opacity: pressed ? 0.86 : 1 }]}
    >
      {content}
    </Pressable>
  );
}

export function DetailRow({ label, value }: { label: string; value: string }) {
  const palette = useTrailmarkColors();
  return (
    <View style={[styles.detailRow, { borderBottomColor: palette.line }]}>
      <Text style={[styles.detailLabel, { color: palette.secondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: palette.text }]}>{value}</Text>
    </View>
  );
}

export function MomentRow({ label, title, detail }: { label: string; title: string; detail: string }) {
  const palette = useTrailmarkColors();
  return (
    <View style={styles.momentRow}>
      <View style={[styles.momentMarker, { backgroundColor: palette.accent }]} />
      <View style={styles.momentCopy}>
        <Text style={[styles.momentLabel, { color: palette.secondary }]}>{label}</Text>
        <Text style={[styles.momentTitle, { color: palette.text }]}>{title}</Text>
        <Text style={[styles.momentDetail, { color: palette.secondary }]}>{detail}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 38, paddingBottom: 44 },
  content: { width: '100%', maxWidth: 640, alignSelf: 'center', gap: 12 },
  accent: { width: 28, height: 4, borderRadius: 2, marginBottom: 10 },
  title: { fontSize: 36, fontWeight: '700', letterSpacing: -0.8 },
  description: { fontSize: 17, lineHeight: 25 },
  section: { marginTop: 36, gap: 14 },
  sectionTitle: { fontSize: 20, fontWeight: '600' },
  note: { fontSize: 16, lineHeight: 24 },
  actionButton: { minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, marginTop: 6 },
  actionButtonLabel: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
  trailCard: { backgroundColor: '#17251F', borderRadius: 24, padding: 22, minHeight: 246, justifyContent: 'space-between', overflow: 'hidden' },
  trailEyebrow: { color: '#9CB7A5', fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  trailTitle: { color: '#FFFFFF', fontSize: 29, fontWeight: '700', letterSpacing: -0.6, marginTop: 18 },
  trailDetail: { color: '#C7D6CC', fontSize: 16, lineHeight: 22, marginTop: 6 },
  routeLine: { flexDirection: 'row', alignItems: 'center', marginTop: 24, paddingHorizontal: 8 },
  routeDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: '#D3E5D7', borderWidth: 3, borderColor: '#517A5D' },
  routeDotEnd: { backgroundColor: '#EE7454', borderColor: '#EE7454' },
  routeStroke: { height: 2, backgroundColor: '#607A68', flex: 1, marginHorizontal: 8 },
  trailFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  trailFooterText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  trailArrow: { color: '#FFFFFF', fontSize: 22 },
  detailRow: { minHeight: 52, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detailLabel: { fontSize: 15 },
  detailValue: { fontSize: 16, fontWeight: '600' },
  momentRow: { flexDirection: 'row', gap: 14, paddingVertical: 8 },
  momentMarker: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  momentCopy: { flex: 1, gap: 3 },
  momentLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  momentTitle: { fontSize: 18, fontWeight: '600' },
  momentDetail: { fontSize: 15, lineHeight: 21 },
});
