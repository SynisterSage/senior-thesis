import { getSupabaseClient } from './supabase';
import type { Feature, LineString } from 'geojson';

export type TrailLandmark = {
  title: string;
  note: string;
  latitude: number;
  longitude: number;
};

export type Trail = {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  distance_m: number | null;
  estimated_minutes: number | null;
  route_geojson: Feature<LineString> | null;
  landmarks: TrailLandmark[];
};

/** Optional cloud catalog. A missing connection leaves the app's local flow available. */
export async function listPublishedTrails(): Promise<Trail[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('trails')
    .select('id, slug, name, summary, distance_m, estimated_minutes, route_geojson, landmarks')
    .eq('published', true)
    .order('name');

  if (error) throw error;
  return data ?? [];
}

export async function getPublishedTrail(slug: string): Promise<Trail | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('trails')
    .select('id, slug, name, summary, distance_m, estimated_minutes, route_geojson, landmarks')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();

  if (error) throw error;
  return data;
}
