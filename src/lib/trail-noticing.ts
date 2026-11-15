import type { NoticingThemeId } from '@/constants/trailmark-theme';

export type TrailNoticingSuggestion = {
  focus: string;
  palette: NoticingThemeId;
};

const trailSuggestions: Record<string, TrailNoticingSuggestion> = {
  'grand-prismatic-overlook': { focus: 'Color bands around the spring', palette: 'living' },
  'grand-prismatic': { focus: 'Color bands around the spring', palette: 'living' },
  'midway-basin': { focus: 'Color, steam, and shifting surfaces', palette: 'living' },
  'fairy-falls': { focus: 'Water sound and movement', palette: 'water' },
  'mystic-falls': { focus: 'Where the water speeds up', palette: 'water' },
  'storm-point': { focus: 'Wind and wide-open views', palette: 'water' },
  'lone-star': { focus: 'The geyser’s rhythm', palette: 'living' },
  'avalanche-peak': { focus: 'How the view changes as you climb', palette: 'earth' },
  'jenny-lake': { focus: 'From shoreline to mountain scale', palette: 'earth' },
  'jenny-lake-loop': { focus: 'From shoreline to mountain scale', palette: 'earth' },
  'taggart-lake': { focus: 'Light moving across the lake', palette: 'water' },
  'phelps-lake': { focus: 'Where water meets the forest', palette: 'earth' },
};

export function getTrailNoticingSuggestion(slug?: string): TrailNoticingSuggestion | undefined {
  return trailSuggestions[slug ?? 'grand-prismatic-overlook'];
}
