import { shuffleArray, type SeedInput } from '@/utils/random';

export const TILE_TYPES = {
  bamboo: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
  character: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
  circle: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
  wind: ['east', 'south', 'west', 'north'],
  dragon: ['red', 'green', 'white'],
  season: ['spring', 'summer', 'autumn', 'winter'],
  flower: ['plum', 'orchid', 'chrysanthemum', 'bamboo_flower'],
} as const;

export type TileFamily = keyof typeof TILE_TYPES;

export interface TileFace {
  centerSymbol: string;
  suitLabel: string;
  accentColor: string;
  displayName: string;
}

const STANDARD_TILE_TYPES = [
  ...TILE_TYPES.bamboo.map((value) => `bamboo_${value}`),
  ...TILE_TYPES.character.map((value) => `character_${value}`),
  ...TILE_TYPES.circle.map((value) => `circle_${value}`),
  ...TILE_TYPES.wind.map((value) => `wind_${value}`),
  ...TILE_TYPES.dragon.map((value) => `dragon_${value}`),
] as const;

type TileType =
  | (typeof STANDARD_TILE_TYPES)[number]
  | `season_${(typeof TILE_TYPES.season)[number]}`
  | `flower_${(typeof TILE_TYPES.flower)[number]}`;

const standardPairUnits: TileType[][] = STANDARD_TILE_TYPES.flatMap((tileType) => [
  [tileType, tileType],
  [tileType, tileType],
]);

const specialPairUnits: TileType[][] = [
  ['season_spring', 'season_summer'],
  ['season_autumn', 'season_winter'],
  ['flower_plum', 'flower_orchid'],
  ['flower_chrysanthemum', 'flower_bamboo_flower'],
];

const completePairUnits: TileType[][] = [...standardPairUnits, ...specialPairUnits];

export function createShuffledTileDeck(tileCount: number, seed: SeedInput): string[] {
  const safeTileCount = Math.max(0, tileCount - (tileCount % 2));
  const pairCount = safeTileCount / 2;

  // Repeat the pair pool enough times to always satisfy any pairCount
  const repeatCount = Math.ceil(pairCount / completePairUnits.length) + 1;
  const expandedPool: TileType[][] = [];
  for (let i = 0; i < repeatCount; i += 1) {
    expandedPool.push(...completePairUnits);
  }

  const pairUnits = shuffleArray(expandedPool, `${seed}-pairs`).slice(0, pairCount);
  const flattened = pairUnits.flat();
  return shuffleArray(flattened, `${seed}-deck`);
}

/**
 * Returns `pairCount` shuffled tile-type strings — one per pair.
 * Used by the solvable board generator to assign a type to each pair it places.
 */
export function getShuffledPairTypes(pairCount: number, seed: SeedInput): string[] {
  const repeatCount = Math.ceil(pairCount / completePairUnits.length) + 1;
  const expandedPool: TileType[][] = [];
  for (let i = 0; i < repeatCount; i += 1) {
    expandedPool.push(...completePairUnits);
  }
  return shuffleArray(expandedPool, `${seed}-pair-types`)
    .slice(0, pairCount)
    .map((pair) => pair[0]); // each [type, type] pair → just the type string
}


function getTileFamily(tileType: string): TileFamily {
  if (tileType.startsWith('bamboo_')) {
    return 'bamboo';
  }
  if (tileType.startsWith('character_')) {
    return 'character';
  }
  if (tileType.startsWith('circle_')) {
    return 'circle';
  }
  if (tileType.startsWith('wind_')) {
    return 'wind';
  }
  if (tileType.startsWith('dragon_')) {
    return 'dragon';
  }
  if (tileType.startsWith('season_')) {
    return 'season';
  }
  return 'flower';
}

function capitalize(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getTileFace(tileType: string): TileFace {
  const family = getTileFamily(tileType);
  const rawValue = tileType.replace(`${family}_`, '');

  switch (family) {
    case 'bamboo':
      return {
        centerSymbol: rawValue,
        suitLabel: 'BAM',
        accentColor: '#2E7D32',
        displayName: `Bamboo ${rawValue}`,
      };
    case 'character':
      return {
        centerSymbol: rawValue,
        suitLabel: 'CHR',
        accentColor: '#C62828',
        displayName: `Character ${rawValue}`,
      };
    case 'circle':
      return {
        centerSymbol: rawValue,
        suitLabel: 'CIR',
        accentColor: '#1565C0',
        displayName: `Circle ${rawValue}`,
      };
    case 'wind':
      return {
        centerSymbol: rawValue.charAt(0).toUpperCase(),
        suitLabel: 'WND',
        accentColor: '#4A148C',
        displayName: `${capitalize(rawValue)} Wind`,
      };
    case 'dragon':
      return {
        centerSymbol: rawValue.charAt(0).toUpperCase(),
        suitLabel: 'DRG',
        accentColor: '#4A148C',
        displayName: `${capitalize(rawValue)} Dragon`,
      };
    case 'season':
      return {
        centerSymbol: rawValue.charAt(0).toUpperCase(),
        suitLabel: 'SEA',
        accentColor: '#F9A825',
        displayName: capitalize(rawValue),
      };
    default:
      return {
        centerSymbol: '*',
        suitLabel: 'FLR',
        accentColor: '#F9A825',
        displayName: capitalize(rawValue),
      };
  }
}
