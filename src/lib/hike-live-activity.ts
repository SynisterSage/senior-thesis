import { NativeModules, Platform } from 'react-native';

type LiveActivityModule = {
  start: (trailName: string, momentsKept: number, nodConnected: boolean) => Promise<boolean>;
  update: (trailName: string, momentsKept: number, nodConnected: boolean, phase: LiveActivityPhase, lastEvent?: string) => Promise<boolean>;
  end: (trailName: string) => Promise<boolean>;
};

export type LiveActivityPhase = 'walking' | 'moment' | 'disconnected' | 'complete';

const liveActivity = NativeModules.TrailMarkLiveActivity as Partial<LiveActivityModule> | undefined;

export function startHikeLiveActivity(trailName: string, momentsKept: number, nodConnected: boolean) {
  if (Platform.OS !== 'ios' || typeof liveActivity?.start !== 'function') return Promise.resolve(false);
  return liveActivity.start(trailName, momentsKept, nodConnected).catch(() => false);
}

export function updateHikeLiveActivity(trailName: string, momentsKept: number, nodConnected: boolean, phase: LiveActivityPhase = 'walking', lastEvent?: string) {
  if (Platform.OS !== 'ios' || typeof liveActivity?.update !== 'function') return Promise.resolve(false);
  return liveActivity.update(trailName, momentsKept, nodConnected, phase, lastEvent).catch(() => false);
}

export function endHikeLiveActivity(trailName: string) {
  if (Platform.OS !== 'ios' || typeof liveActivity?.end !== 'function') return Promise.resolve(false);
  return liveActivity.end(trailName).catch(() => false);
}
