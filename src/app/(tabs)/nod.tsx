import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isNodConnected } from '@/lib/onboarding';
import { colors } from '@/constants/trailmark-theme';

const palette = colors.light;

export default function NodScreen() {
  const [didPress, setDidPress] = useState(false);
  const connected = isNodConnected();

  return <View style={styles.screen}>
    <StatusBar style="dark" />
    <SafeAreaView edges={['top']} style={styles.safeTop}>
      <View style={styles.header}><Text accessibilityRole="header" style={styles.pageTitle}>Nod</Text></View>
    </SafeAreaView>

    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.intro}><Text style={styles.headline}>{connected ? 'Keep the moment.\nKeep moving.' : 'Nod is ready\nwhen you are.'}</Text><Text style={styles.description}>{connected ? 'When something catches your attention, mark it with one press.' : 'Connect Nod to mark moments while your phone stays away.'}</Text></View>

      <View style={styles.deviceArea}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={connected ? 'Try Nod’s button' : 'Nod is not connected'}
          accessibilityHint={connected ? 'Plays a visual press confirmation.' : 'Use Connect Nod to pair your device.'}
          accessibilityState={{ disabled: !connected }}
          disabled={!connected}
          onPress={() => setDidPress(true)}
          style={({ pressed }) => [styles.device, !connected && styles.deviceOffline, pressed && connected && styles.devicePressed]}
        >
          <Text style={styles.deviceName}>TRAILMARK</Text>
          <View pointerEvents="none" style={styles.buttonOuterRing}>
            <View style={styles.buttonRingTwo}>
              <View style={styles.buttonRingThree}>
                <View style={styles.buttonFace}>
                  <View style={styles.buttonCenter} />
                </View>
              </View>
            </View>
          </View>
          <View style={[styles.statusLight, didPress && styles.statusLightOn]} />
        </Pressable>
      </View>

      {connected ? <Text accessibilityLiveRegion="polite" style={styles.pressFeedback}>{didPress ? 'Nod pressed' : 'Tap the button to try it'}</Text> : <Pressable accessibilityRole="button" onPress={() => router.push('/pair-nod')} style={({ pressed }) => [styles.connectButton, pressed && styles.connectButtonPressed]}><Text style={styles.connectButtonText}>Connect Nod</Text></Pressable>}

      <View style={styles.divider} />
      <Text style={styles.supportingCopy}>TrailMark gives each moment a place to return to later.</Text>
      <Text style={styles.footer}>TrailMark works with or without Nod.</Text>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  safeTop: { backgroundColor: palette.background },
  header: { height: 50, justifyContent: 'center', paddingHorizontal: 22 },
  pageTitle: { color: palette.text, fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  content: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 26, paddingTop: 30, paddingBottom: 28 },
  intro: { width: '100%', maxWidth: 420, alignItems: 'center' },
  headline: { color: palette.text, fontSize: 30, lineHeight: 35, fontWeight: '700', letterSpacing: -0.9, textAlign: 'center' },
  description: { maxWidth: 310, color: palette.secondary, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 11 },
  deviceArea: { minHeight: 320, width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: 15 },
  device: { width: 218, height: 258, alignItems: 'center', justifyContent: 'center', borderRadius: 82, borderWidth: 1, borderColor: '#59625D', backgroundColor: '#303733', shadowColor: '#142219', shadowOpacity: 0.22, shadowRadius: 20, shadowOffset: { width: 0, height: 14 }, elevation: 8 },
  devicePressed: { transform: [{ scale: 0.985 }], backgroundColor: '#39423C' }, deviceOffline: { opacity: 0.7 },
  deviceName: { position: 'absolute', top: 24, color: '#CFD5CF', fontSize: 10, fontWeight: '700', letterSpacing: 2.2 },
  buttonOuterRing: { width: 151, height: 151, alignItems: 'center', justifyContent: 'center', borderRadius: 76, borderWidth: 2, borderColor: '#171C19', backgroundColor: '#252B27', shadowColor: '#111713', shadowOpacity: 0.45, shadowRadius: 8, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  buttonRingTwo: { width: 132, height: 132, alignItems: 'center', justifyContent: 'center', borderRadius: 66, borderWidth: 2, borderColor: '#454D48' },
  buttonRingThree: { width: 111, height: 111, alignItems: 'center', justifyContent: 'center', borderRadius: 56, borderWidth: 2, borderColor: '#555E58' },
  buttonFace: { width: 91, height: 91, alignItems: 'center', justifyContent: 'center', borderRadius: 46, borderWidth: 1, borderColor: '#646D67', backgroundColor: '#424A44', shadowColor: '#151A17', shadowOpacity: 0.38, shadowRadius: 5, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  buttonCenter: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#78817A', backgroundColor: '#505952' },
  statusLight: { position: 'absolute', bottom: 25, width: 35, height: 5, borderRadius: 3, backgroundColor: '#59615C' },
  statusLightOn: { backgroundColor: '#A9D7AE', shadowColor: '#A9D7AE', shadowOpacity: 0.9, shadowRadius: 8, elevation: 5 },
  pressFeedback: { minHeight: 22, color: palette.secondary, fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 2 }, connectButton: { minWidth: 144, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: palette.accent, marginTop: 2 }, connectButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' }, connectButtonPressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
  divider: { width: 36, height: 1, backgroundColor: '#BFCBC0', marginTop: 25, marginBottom: 18 },
  supportingCopy: { maxWidth: 300, color: palette.text, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  footer: { color: palette.secondary, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 19 },
});
