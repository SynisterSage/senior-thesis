import { Tabs, type BottomTabBarProps } from 'expo-router/js-tabs';
import { SymbolView } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/trailmark-theme';
import { TabBarVisibilityProvider, useRegisterTabBar } from '@/lib/tab-bar-visibility';

const palette = colors.light;

const tabDefinitions = {
  trails: { label: 'Explore', icon: 'map', selectedIcon: 'map.fill', androidIcon: 'map' },
  archive: { label: 'Archive', icon: 'square.stack', selectedIcon: 'square.stack.fill', androidIcon: 'collections_bookmark' },
  nod: { label: 'Nod', icon: 'hand.tap', selectedIcon: 'hand.tap.fill', androidIcon: 'touch_app' },
} as const;

export default function TabLayout() {
  return <TabBarVisibilityProvider>
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <FloatingTabBar {...props} />}>
      <Tabs.Screen name="trails" options={{ title: 'Explore' }} />
      <Tabs.Screen name="archive" options={{ title: 'Archive' }} />
      <Tabs.Screen name="nod" options={{ title: 'Nod' }} />
    </Tabs>
  </TabBarVisibilityProvider>;
}

function FloatingTabBar({ state, descriptors, navigateToTab, insets }: BottomTabBarProps) {
  const safeInsets = useSafeAreaInsets();
  const [dockProgress] = useState(() => new Animated.Value(0));
  const [dockIsVisible, setDockIsVisible] = useState(true);
  const dockVisible = useRef(true);

  useEffect(() => {
    Animated.spring(dockProgress, { toValue: 1, damping: 18, stiffness: 220, mass: 0.7, useNativeDriver: true }).start();
  }, [dockProgress]);

  const setDockVisible = useCallback((visible: boolean) => {
    if (dockVisible.current === visible) return;
    dockVisible.current = visible;
    setDockIsVisible(visible);
    Animated.spring(dockProgress, { toValue: visible ? 1 : 0, damping: 22, stiffness: 240, mass: 0.8, useNativeDriver: true }).start();
  }, [dockProgress]);
  useRegisterTabBar(setDockVisible);

  return (
    <View pointerEvents="box-none" style={[styles.dockPosition, { paddingBottom: Math.max(Math.max(insets.bottom, safeInsets.bottom) - 5, 6) }]}>
      <Animated.View pointerEvents={dockIsVisible ? 'auto' : 'none'} style={[styles.dock, { opacity: dockProgress, transform: [{ translateY: dockProgress.interpolate({ inputRange: [0, 1], outputRange: [90, 0] }) }] }]}>
        {state.routes.map((route, index) => {
          const definition = tabDefinitions[route.name as keyof typeof tabDefinitions];
          if (!definition) return null;
          const focused = state.index === index;
          const options = descriptors[route.key]?.options;
          const label = typeof options?.tabBarLabel === 'string' ? options.tabBarLabel : definition.label;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={options?.tabBarAccessibilityLabel ?? label}
              accessibilityState={{ selected: focused }}
              onPress={() => navigateToTab(route.key)}
              style={({ pressed }) => [styles.tab, focused && styles.tabFocused, pressed && styles.pressed]}
            >
              <View style={[styles.iconWrap, focused && styles.iconWrapFocused]}>
                <SymbolView name={{ ios: (focused ? definition.selectedIcon : definition.icon) as SFSymbol, android: definition.androidIcon as never, web: definition.androidIcon as never }} size={19} weight={focused ? 'semibold' : 'medium'} tintColor={focused ? palette.accent : palette.secondary} />
              </View>
              <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
            </Pressable>
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  dockPosition: { position: 'absolute', left: 16, right: 16, bottom: 0 },
  dock: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', minHeight: 70, paddingHorizontal: 8, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.96)', borderWidth: 1, borderColor: '#D9E3DA', shadowColor: '#193323', shadowOpacity: 0.14, shadowRadius: 16, shadowOffset: { width: 0, height: 5 }, elevation: 8 },
  tab: { flex: 1, minHeight: 58, alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: 18 },
  tabFocused: { backgroundColor: '#E4F1E6' },
  iconWrap: { width: 30, height: 27, alignItems: 'center', justifyContent: 'center', borderRadius: 13 },
  iconWrapFocused: { backgroundColor: '#D1E9D6' },
  label: { color: palette.secondary, fontSize: 11, lineHeight: 14, fontWeight: '600' },
  labelFocused: { color: palette.accent, fontWeight: '800' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
