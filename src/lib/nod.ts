import { isNodConnected } from '@/lib/onboarding';
import { getSavedTrailStories, type SavedTrailStory } from '@/lib/trail-stories';

export type NodStatus = {
  connected: boolean;
  batteryPercent: number | null;
  lastSyncLabel: string;
};

export type NodUsageStats = {
  momentsKept: number;
  walksWithNod: number;
  lastUsedAt?: string;
  lastWalkId?: string;
  lastMomentId?: string;
  lastWalkTitle?: string;
  lastWalkLocation?: string;
};

// This is intentionally one shared demo snapshot for the Wizard-of-Oz build.
// The BLE/device layer can replace this without changing the Nod screens.
export function getNodStatus(): NodStatus {
  const connected = isNodConnected();
  return {
    connected,
    batteryPercent: connected ? 87 : null,
    lastSyncLabel: connected ? 'Synced just now' : 'Not synced',
  };
}

export function getNodUsageStats(): NodUsageStats {
  const stories = getSavedTrailStories();
  const nodMarks = stories.flatMap((story) => (story.marks ?? []).filter((mark) => mark.source === 'nod'));
  const walksWithNod = stories.filter((story) => (story.marks ?? []).some((mark) => mark.source === 'nod')).length;
  const latestStory = stories
    .map((story) => ({ story, latestMark: (story.marks ?? []).filter((mark) => mark.source === 'nod').map((mark) => mark.createdAt).sort().at(-1) }))
    .filter((entry): entry is { story: SavedTrailStory; latestMark: string } => Boolean(entry.latestMark))
    .sort((a, b) => a.latestMark.localeCompare(b.latestMark))
    .at(-1);

  return {
    momentsKept: nodMarks.length,
    walksWithNod,
    lastUsedAt: latestStory?.latestMark,
    lastWalkId: latestStory?.story.id,
    lastMomentId: latestStory?.story.marks?.filter((mark) => mark.source === 'nod').sort((a, b) => a.createdAt.localeCompare(b.createdAt)).at(-1)?.momentId,
    lastWalkTitle: latestStory?.story.title,
    lastWalkLocation: latestStory?.story.location,
  };
}
