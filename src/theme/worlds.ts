export interface WorldTheme {
  id: number;
  name: string;
  background: string;
  tileBackground: string;
  tileShadow: string;
  accentColor: string;
  particleColors: [string, string, string] | [string, string, string, string];
  ambientParticles: 'petals' | 'leaves' | 'fireflies' | 'bubbles' | 'sparks';
  music: 'peaceful_koto' | 'bamboo_breeze' | 'temple_night' | 'ocean_calm' | 'imperial_gold';
  text: string;
}

export type AppearanceMode = 'dark' | 'light';

export const WORLDS: Record<number, WorldTheme> = {
  1: {
    id: 1,
    name: 'Cherry Blossom',
    background: '#FDF0F0',
    tileBackground: '#FFFAF8',
    tileShadow: '#E8C5C5',
    accentColor: '#E91E8C',
    particleColors: ['#FF4081', '#F48FB1', '#FCE4EC'],
    ambientParticles: 'petals',
    music: 'peaceful_koto',
    text: '#31102A',
  },
  2: {
    id: 2,
    name: 'Bamboo Forest',
    background: '#E8F5E9',
    tileBackground: '#F1F8E9',
    tileShadow: '#A5D6A7',
    accentColor: '#2E7D32',
    particleColors: ['#4CAF50', '#81C784', '#C8E6C9'],
    ambientParticles: 'leaves',
    music: 'bamboo_breeze',
    text: '#112211',
  },
  3: {
    id: 3,
    name: 'Night Temple',
    background: '#0A0F1E',
    tileBackground: '#1A2035',
    tileShadow: '#0D1117',
    accentColor: '#FFD700',
    particleColors: ['#FFD700', '#FFF176', '#FFECB3'],
    ambientParticles: 'fireflies',
    music: 'temple_night',
    text: '#F5ECCD',
  },
  4: {
    id: 4,
    name: 'Ocean Mist',
    background: '#E3F2FD',
    tileBackground: '#F3F9FF',
    tileShadow: '#90CAF9',
    accentColor: '#0277BD',
    particleColors: ['#29B6F6', '#81D4FA', '#E1F5FE'],
    ambientParticles: 'bubbles',
    music: 'ocean_calm',
    text: '#0B233E',
  },
  5: {
    id: 5,
    name: 'Golden Palace',
    background: '#1A0A00',
    tileBackground: '#2C1A00',
    tileShadow: '#0D0500',
    accentColor: '#FFD700',
    particleColors: ['#FFD700', '#FF8F00', '#FFECB3'],
    ambientParticles: 'sparks',
    music: 'imperial_gold',
    text: '#FDE4C9',
  },
};

export interface AppPalette {
  background: string;
  surface: string;
  elevatedSurface: string;
  primaryText: string;
  secondaryText: string;
  border: string;
  buttonText: string;
  buttonBackground: string;
  shadowColor: string;
}

export function getAppPalette(mode: AppearanceMode): AppPalette {
  if (mode === 'light') {
    return {
      background: '#F7F1E5',
      surface: '#FFF9F0',
      elevatedSurface: '#FFFFFF',
      primaryText: '#10203B',
      secondaryText: '#4E5C77',
      border: '#D8C9AE',
      buttonText: '#0A0F1E',
      buttonBackground: '#F0EDE6',
      shadowColor: '#BBAE96',
    };
  }

  return {
    background: '#0A0F1E',
    surface: '#121A30',
    elevatedSurface: '#18233F',
    primaryText: '#F0EDE6',
    secondaryText: '#AEB5C5',
    border: '#33415F',
    buttonText: '#0A0F1E',
    buttonBackground: '#F0EDE6',
    shadowColor: '#030610',
  };
}

export function getWorldTheme(world: number): WorldTheme {
  return WORLDS[world] ?? WORLDS[1];
}
