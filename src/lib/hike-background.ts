import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { getActiveHikeDraft, saveActiveHikeDraft } from '@/lib/trail-stories';

export const HIKE_LOCATION_TASK = 'trailmark-hike-location';

TaskManager.defineTask(HIKE_LOCATION_TASK, async ({ data, error }) => {
  if (error || !data) return;

  const locations = (data as { locations?: Location.LocationObject[] }).locations;
  const latest = locations?.[locations.length - 1];
  const draft = getActiveHikeDraft();
  if (!latest || !draft) return;

  saveActiveHikeDraft({
    ...draft,
    lastLocation: [latest.coords.longitude, latest.coords.latitude],
    lastLocationAt: new Date(latest.timestamp).toISOString(),
  });
});

export async function startHikeBackgroundTracking() {
  if (Platform.OS === 'web') return false;
  try {
    let foreground = await Location.getForegroundPermissionsAsync();
    if (!foreground.granted) foreground = await Location.requestForegroundPermissionsAsync();
    if (!foreground.granted) return false;

    let background = await Location.getBackgroundPermissionsAsync();
    if (!background.granted) background = await Location.requestBackgroundPermissionsAsync();
    if (!background.granted) return false;

    const alreadyRunning = await Location.hasStartedLocationUpdatesAsync(HIKE_LOCATION_TASK);
    if (alreadyRunning) return true;

    await Location.startLocationUpdatesAsync(HIKE_LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      activityType: Location.ActivityType.Fitness,
      distanceInterval: 10,
      deferredUpdatesDistance: 25,
      deferredUpdatesInterval: 10000,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'TrailMark is keeping your hike active',
        notificationBody: 'Your trail session will stay ready while your phone is locked.',
      },
    });

    return true;
  } catch (error) {
    console.warn('[TrailMark] Could not start background hike tracking.', error);
    return false;
  }
}

export async function stopHikeBackgroundTracking() {
  if (Platform.OS === 'web') return;
  const running = await Location.hasStartedLocationUpdatesAsync(HIKE_LOCATION_TASK);
  if (running) await Location.stopLocationUpdatesAsync(HIKE_LOCATION_TASK);
}
