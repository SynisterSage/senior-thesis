import 'expo-sqlite/localStorage/install';

export type MarkingPreference = 'nod' | 'phone';

const completeKey = 'trailmark.onboarding.complete.v1';
const markingPreferenceKey = 'trailmark.marking-preference.v1';
const nodConnectedKey = 'trailmark.nod.connected.v1';

export function hasCompletedOnboarding(): boolean {
  try {
    return globalThis.localStorage.getItem(completeKey) === 'true';
  } catch {
    return false;
  }
}

export function saveOnboarding(markingPreference: MarkingPreference): void {
  globalThis.localStorage.setItem(markingPreferenceKey, markingPreference);
  globalThis.localStorage.setItem(completeKey, 'true');
}

export function getMarkingPreference(): MarkingPreference | null {
  try {
    const value = globalThis.localStorage.getItem(markingPreferenceKey);
    return value === 'nod' || value === 'phone' ? value : null;
  } catch {
    return null;
  }
}

export function isNodConnected(): boolean {
  try {
    return globalThis.localStorage.getItem(nodConnectedKey) === 'true';
  } catch {
    return false;
  }
}

export function setNodConnected(connected: boolean): void {
  globalThis.localStorage.setItem(nodConnectedKey, String(connected));
}
