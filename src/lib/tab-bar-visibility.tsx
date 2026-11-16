import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useFocusEffect } from 'expo-router';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

type DockSetter = (visible: boolean) => void;
type VisibilityContextValue = { registerDock: (setter: DockSetter) => () => void; setDockVisible: DockSetter };
const VisibilityContext = createContext<VisibilityContextValue | null>(null);

export function TabBarVisibilityProvider({ children }: { children: ReactNode }) {
  const [dockSetter, setDockSetter] = useState<DockSetter | null>(null);
  const registerDock = useCallback((setter: DockSetter) => {
    setDockSetter(() => setter);
    return () => setDockSetter(null);
  }, []);
  const setDockVisible = useCallback((visible: boolean) => dockSetter?.(visible), [dockSetter]);
  const value = useMemo(() => ({ registerDock, setDockVisible }), [registerDock, setDockVisible]);
  return <VisibilityContext.Provider value={value}>{children}</VisibilityContext.Provider>;
}

export function useRegisterTabBar(setter: DockSetter) {
  const context = useContext(VisibilityContext);
  useEffect(() => context?.registerDock(setter), [context, setter]);
}

export function useTabBarVisibility() {
  const context = useContext(VisibilityContext);
  const previousOffset = useRef(0);
  if (!context) throw new Error('useTabBarVisibility must be used inside TabBarVisibilityProvider');
  useFocusEffect(useCallback(() => {
    previousOffset.current = 0;
    context.setDockVisible(true);
  }, [context]));
  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = Math.max(0, event.nativeEvent.contentOffset.y);
    const delta = offset - previousOffset.current;
    previousOffset.current = offset;
    if (offset <= 8 || delta < -6) context.setDockVisible(true);
    else if (delta > 6) context.setDockVisible(false);
  }, [context]);
  return { onScroll };
}
