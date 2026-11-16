import 'expo-sqlite/localStorage/install';

const storageKey = 'trailmark.return-reflections.v1';

type ReturnReflections = Record<string, string>;

export function getReturnReflection(walkId: string): string {
  try {
    const stored = globalThis.localStorage.getItem(storageKey);
    const reflections = stored ? JSON.parse(stored) as ReturnReflections : {};
    return reflections[walkId] ?? '';
  } catch {
    return '';
  }
}

export function saveReturnReflection(walkId: string, reflection: string): boolean {
  try {
    const stored = globalThis.localStorage.getItem(storageKey);
    const reflections = stored ? JSON.parse(stored) as ReturnReflections : {};
    globalThis.localStorage.setItem(storageKey, JSON.stringify({ ...reflections, [walkId]: reflection }));
    return true;
  } catch {
    return false;
  }
}
