import 'expo-sqlite/localStorage/install';

const storageKey = 'trailmark.saved-stories.v1';
const draftStorageKey = 'trailmark.active-hike.v1';

export type CapturedTrailMoment = {
  id: string;
  momentId: string;
  coordinate: number[];
  source: 'nod' | 'phone';
  createdAt: string;
};

export type SavedTrailStory = {
  id: string;
  title: string;
  location: string;
  createdAt: string;
  momentIds: string[];
  notes: string[];
  marks?: CapturedTrailMoment[];
  routeCoordinates?: number[][];
};

type NewTrailStory = Omit<SavedTrailStory, 'id' | 'createdAt'>;

export type ActiveHikeDraft = {
  slug: string;
  title: string;
  location: string;
  routeCoordinates: number[][];
  marks: CapturedTrailMoment[];
  notes: string[];
  updatedAt: string;
};

export function getSavedTrailStories(): SavedTrailStory[] {
  try {
    const value = globalThis.localStorage.getItem(storageKey);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed as SavedTrailStory[] : [];
  } catch {
    return [];
  }
}

export function getSavedTrailStory(id: string): SavedTrailStory | undefined {
  return getSavedTrailStories().find((story) => story.id === id);
}

export function saveTrailStory(story: NewTrailStory): SavedTrailStory {
  const savedStory: SavedTrailStory = {
    ...story,
    id: `story-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  globalThis.localStorage.setItem(storageKey, JSON.stringify([savedStory, ...getSavedTrailStories()]));
  return savedStory;
}

export function deleteSavedTrailStory(id: string) {
  const remaining = getSavedTrailStories().filter((story) => story.id !== id);
  globalThis.localStorage.setItem(storageKey, JSON.stringify(remaining));
}

export function getActiveHikeDraft(): ActiveHikeDraft | undefined {
  try {
    const value = globalThis.localStorage.getItem(draftStorageKey);
    const parsed = value ? JSON.parse(value) : undefined;
    return parsed && Array.isArray(parsed.marks) && Array.isArray(parsed.notes) ? parsed as ActiveHikeDraft : undefined;
  } catch {
    return undefined;
  }
}

export function saveActiveHikeDraft(draft: Omit<ActiveHikeDraft, 'updatedAt'>) {
  globalThis.localStorage.setItem(draftStorageKey, JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }));
}

export function clearActiveHikeDraft() {
  globalThis.localStorage.removeItem(draftStorageKey);
}
