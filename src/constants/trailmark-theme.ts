export const colors = {
  light: {
    background: '#F5F7F3',
    surface: '#FFFFFF',
    text: '#15241C',
    secondary: '#4D5E53',
    line: '#D9E3DA',
    accent: '#226C4A',
  },
  dark: {
    background: '#151D19',
    surface: '#202B25',
    text: '#F1F6F0',
    secondary: '#B8C9BD',
    line: '#3D5044',
    accent: '#A3D3B2',
  },
} as const;

export const noticingThemes = {
  water: {
    id: 'water',
    label: 'Color of water',
    short: 'Water',
    detail: 'Blue, steam, reflection',
    accent: '#176B88',
    accentSoft: '#D8EEF4',
    card: '#173744',
    cardText: '#BCEFFF',
    surface: '#E5F3F6',
    ink: '#174B63',
    artwork: ['#A9DCE6', '#4AABC4', '#DDF2F5'] as const,
  },
  living: {
    id: 'living',
    label: 'Living color',
    short: 'Living',
    detail: 'Orange, yellow, green',
    accent: '#99520A',
    accentSoft: '#F7E7CE',
    card: '#47331C',
    cardText: '#FFE0A3',
    surface: '#F8EEDC',
    ink: '#604214',
    artwork: ['#F2C778', '#E58E35', '#F5DCA0'] as const,
  },
  earth: {
    id: 'earth',
    label: 'Color of earth',
    short: 'Earth',
    detail: 'Warm ground and rock',
    accent: '#855037',
    accentSoft: '#F0E0D4',
    card: '#3B2922',
    cardText: '#F3C6A8',
    surface: '#F3E9E0',
    ink: '#604331',
    artwork: ['#C99771', '#A96E4F', '#E4C3A5'] as const,
  },
} as const;

export type NoticingThemeId = keyof typeof noticingThemes;

export function getNoticingThemeId(value: string): NoticingThemeId {
  const normalized = value.toLowerCase();
  if (/\b(water|blue|aqua|turquoise|steam|reflection|river|pool|lake|shore|wind|sound|movement|falls)\b/.test(normalized)) return 'water';
  if (/\b(earth|rock|brown|soil|stone|rust|mud|ground|mountain|scale|climb|texture)\b/.test(normalized)) return 'earth';
  return 'living';
}
