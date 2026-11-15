import 'expo-sqlite/localStorage/install';

export type LiveMapStyle = 'classic' | 'terrain';
export type ReplayPace = 'gentle' | 'quick';

const liveMapStyleKey = 'trailmark.preference.live-map-style.v1';
const replayPaceKey = 'trailmark.preference.replay-pace.v1';
const includeWordsKey = 'trailmark.preference.include-words.v1';

export function getLiveMapStyle(): LiveMapStyle {
  try {
    return globalThis.localStorage.getItem(liveMapStyleKey) === 'terrain' ? 'terrain' : 'classic';
  } catch {
    return 'classic';
  }
}

export function setLiveMapStyle(style: LiveMapStyle) {
  globalThis.localStorage.setItem(liveMapStyleKey, style);
}

export function getReplayPace(): ReplayPace {
  try {
    return globalThis.localStorage.getItem(replayPaceKey) === 'quick' ? 'quick' : 'gentle';
  } catch {
    return 'gentle';
  }
}

export function setReplayPace(pace: ReplayPace) {
  globalThis.localStorage.setItem(replayPaceKey, pace);
}

export function getIncludeWords(): boolean {
  try {
    return globalThis.localStorage.getItem(includeWordsKey) !== 'false';
  } catch {
    return true;
  }
}

export function setIncludeWords(includeWords: boolean) {
  globalThis.localStorage.setItem(includeWordsKey, String(includeWords));
}
