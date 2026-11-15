import 'expo-sqlite/localStorage/install';

const storageKey = 'trailmark.saved-trails.v1';
const starterSeededKey = 'trailmark.saved-trails.starter-seeded.v1';

export type SavedTrail = {
  id: string;
  title: string;
  location: string;
  detail: string;
  rating: string;
  imageKey?: string;
  available: boolean;
  savedAt: string;
};

type NewSavedTrail = Omit<SavedTrail, 'savedAt'>;

const starterSavedTrails: NewSavedTrail[] = [
  { id: 'grand-prismatic', imageKey: 'grand-prismatic', title: 'Grand Prismatic Overlook', location: 'Yellowstone National Park', detail: 'Easy  ·  1.2 mi', rating: '4.8', available: true },
  { id: 'fairy-falls', imageKey: 'fairy-falls', title: 'Fairy Falls', location: 'Yellowstone National Park', detail: 'Moderate  ·  5.4 mi', rating: '4.9', available: false },
  { id: 'avalanche-peak', imageKey: 'avalanche-peak', title: 'Avalanche Peak', location: 'Yellowstone National Park', detail: 'Hard  ·  4.5 mi', rating: '4.9', available: false },
  { id: 'jenny-lake', imageKey: 'jenny-lake', title: 'Jenny Lake Loop', location: 'Grand Teton National Park', detail: 'Moderate  ·  7.1 mi', rating: '4.9', available: false },
  { id: 'phelps-lake', imageKey: 'phelps-lake', title: 'Phelps Lake', location: 'Grand Teton National Park', detail: 'Moderate  ·  3.7 mi', rating: '4.8', available: false },
];

export function getSavedTrails(): SavedTrail[] {
  try {
    const value = globalThis.localStorage.getItem(storageKey);
    const storedTrails = value ? JSON.parse(value) : [];
    const trails = Array.isArray(storedTrails) ? storedTrails : [];
    if (globalThis.localStorage.getItem(starterSeededKey) === 'true') return trails;

    const starterTrails = starterSavedTrails.filter((starter) => !trails.some((trail: SavedTrail) => trail.id === starter.id)).map((trail) => ({ ...trail, savedAt: new Date().toISOString() }));
    const mergedTrails = [...trails, ...starterTrails];
    globalThis.localStorage.setItem(storageKey, JSON.stringify(mergedTrails));
    globalThis.localStorage.setItem(starterSeededKey, 'true');
    return mergedTrails;
  } catch {
    return [];
  }
}

export function isTrailSaved(id: string) {
  return getSavedTrails().some((trail) => trail.id === id);
}

export function saveTrail(trail: NewSavedTrail) {
  const savedTrail: SavedTrail = { ...trail, savedAt: new Date().toISOString() };
  const savedTrails = getSavedTrails().filter((saved) => saved.id !== trail.id);
  globalThis.localStorage.setItem(storageKey, JSON.stringify([savedTrail, ...savedTrails]));
  return savedTrail;
}

export function removeSavedTrail(id: string) {
  globalThis.localStorage.setItem(storageKey, JSON.stringify(getSavedTrails().filter((trail) => trail.id !== id)));
}
