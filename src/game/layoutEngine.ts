import crossLayout from '@/data/layouts/cross.json';
import dragonLayout from '@/data/layouts/dragon.json';
import flowerLayout from '@/data/layouts/flower.json';
import pyramidLayout from '@/data/layouts/pyramid.json';
import towerLayout from '@/data/layouts/tower.json';
import turtleLayout from '@/data/layouts/turtle.json';
import { getShuffledPairTypes } from '@/data/tilesets/standard';
import { computeFreeTiles, type Tile } from '@/game/mahjongLogic';
import { createSeededRandom, shuffleArray, type SeedInput } from '@/utils/random';

export interface TilePosition {
  row: number;
  col: number;
  layer: number;
}

export interface BoardLayout {
  id: string;
  name: string;
  tileCount: number;
  positions: TilePosition[];
}

export interface LevelBlueprint {
  layoutId: string;
  tileCount: number;
  timerEnabled: boolean;
  timeLimitSeconds: number | null;
  boss: boolean;
  freeHints: number;
  freeUndos: number;
  freeShuffles: number;
}

export type DifficultyTier = 'easy' | 'medium' | 'hard' | 'boss';

export interface DifficultyConfig {
  tier: DifficultyTier;
  tileCount: number;
  layoutId: string;
  timerEnabled: boolean;
  timeLimitSeconds: number | null;
  freeHints: number;
  freeUndos: number;
  freeShuffles: number;
}

/**
 * Returns the difficulty configuration for a given world/level combination.
 * World 1 uses the following tier thresholds:
 *   L1-7   → Easy
 *   L8-14  → Medium
 *   L15-20 → Hard
 *   L21    → Boss
 */
export function getDifficultyConfig(world: number, level: number): DifficultyConfig {
  // Boss level
  if (level >= 21) {
    return {
      tier: 'boss',
      tileCount: 144,
      layoutId: 'dragon',
      timerEnabled: true,
      timeLimitSeconds: 600,
      freeHints: 0,
      freeUndos: 0,
      freeShuffles: 0,
    };
  }
  // Hard levels
  if (level >= 15) {
    return {
      tier: 'hard',
      tileCount: level >= 18 ? 144 : 108,
      layoutId: 'turtle',
      timerEnabled: true,
      timeLimitSeconds: 900,
      freeHints: 1,
      freeUndos: 1,
      freeShuffles: 1,
    };
  }
  // Medium levels
  if (level >= 8) {
    return {
      tier: 'medium',
      tileCount: level >= 11 ? 96 : 72,
      layoutId: level >= 11 ? 'flower' : 'cross',
      timerEnabled: false,
      timeLimitSeconds: null,
      freeHints: 2,
      freeUndos: 2,
      freeShuffles: 1,
    };
  }
  // Easy levels (default)
  return {
    tier: 'easy',
    tileCount: 60,
    layoutId: 'pyramid',
    timerEnabled: false,
    timeLimitSeconds: null,
    freeHints: 3,
    freeUndos: 3,
    freeShuffles: 2,
  };
}

const LAYOUTS: Record<string, BoardLayout> = {
  turtle: turtleLayout as BoardLayout,
  dragon: dragonLayout as BoardLayout,
  pyramid: pyramidLayout as BoardLayout,
  cross: crossLayout as BoardLayout,
  flower: flowerLayout as BoardLayout,
  tower: towerLayout as BoardLayout,
};

function getLayoutCenter(layout: BoardLayout): { centerRow: number; centerCol: number } {
  const rows = layout.positions.map((position) => position.row);
  const cols = layout.positions.map((position) => position.col);

  const centerRow = (Math.min(...rows) + Math.max(...rows)) / 2;
  const centerCol = (Math.min(...cols) + Math.max(...cols)) / 2;
  return { centerRow, centerCol };
}

function trimPositions(layout: BoardLayout, tileCount: number): TilePosition[] {
  if (tileCount >= layout.positions.length) {
    return [...layout.positions];
  }

  const safeTileCount = tileCount - (tileCount % 2);
  const { centerRow, centerCol } = getLayoutCenter(layout);

  return [...layout.positions]
    .sort((left, right) => {
      if (left.layer !== right.layer) {
        return left.layer - right.layer;
      }

      const leftDistance = Math.abs(left.row - centerRow) + Math.abs(left.col - centerCol);
      const rightDistance = Math.abs(right.row - centerRow) + Math.abs(right.col - centerCol);
      return leftDistance - rightDistance;
    })
    .slice(0, safeTileCount);
}

export function getLayoutById(layoutId: string): BoardLayout {
  return LAYOUTS[layoutId] ?? LAYOUTS.turtle;
}

export function materializeLayout(layoutId: string, tileCount?: number): BoardLayout {
  const baseLayout = getLayoutById(layoutId);
  const positions = trimPositions(baseLayout, tileCount ?? baseLayout.tileCount);
  return {
    ...baseLayout,
    tileCount: positions.length,
    positions,
  };
}

export function getLevelBlueprint(world: number, level: number): LevelBlueprint {
  const cfg = getDifficultyConfig(world, level);
  return {
    layoutId: cfg.layoutId,
    tileCount: cfg.tileCount,
    timerEnabled: cfg.timerEnabled,
    timeLimitSeconds: cfg.timeLimitSeconds,
    boss: cfg.tier === 'boss',
    freeHints: cfg.freeHints,
    freeUndos: cfg.freeUndos,
    freeShuffles: cfg.freeShuffles,
  };
}

/**
 * Builds a GUARANTEED-SOLVABLE board by assigning tile-type pairs only to
 * positions that are currently free (no top-blocker, at least one open side).
 *
 * Algorithm (works forward, not random):
 *   1. Create placeholder tiles for all positions (no tile type yet).
 *   2. Compute which placeholders are "free" right now.
 *   3. Pick 2 free ones at random → assign them the same tile type (a matching pair).
 *   4. Remove those two from the active set, recompute free tiles.
 *   5. Repeat until all positions have a type assigned.
 *
 * Because every pair is placed on tiles that are free at placement time,
 * the player will always be able to make a match — the board will never
 * get stuck as long as it was generated by this routine.
 */
export function buildBoardTiles(layout: BoardLayout, seed: SeedInput): Tile[] {
  const positions = layout.positions;
  const tileCount = positions.length;
  const pairCount = Math.floor(tileCount / 2);

  // One tile-type string per pair, shuffled with the seed
  const pairTypes = getShuffledPairTypes(pairCount, seed);

  // Seeded RNG for picking positions — deterministic per seed
  const random = createSeededRandom(`${seed}-pick`);

  // Placeholder tiles: real row/col/layer geometry, no type yet
  let active: Tile[] = positions.map((pos, i) => ({
    id: String(i),
    tileType: '__placeholder__',
    layer: pos.layer,
    row: pos.row,
    col: pos.col,
    isMatched: false,
    isSelected: false,
    isFree: false,
  }));

  // assignment[positionIndex] = tile type string
  const assignment: string[] = new Array(tileCount).fill('bamboo_1');
  let pairIndex = 0;

  // Greedily assign matching pairs to currently-free positions
  while (active.length >= 2 && pairIndex < pairTypes.length) {
    const computed = computeFreeTiles(active);
    const free = computed.filter((t) => t.isFree);

    if (free.length < 2) {
      // Safety: if only 1 free tile exists (rare degenerate layout),
      // force-assign the last remaining pair and break.
      if (active.length === 2) {
        const type = pairTypes[pairIndex] ?? 'bamboo_1';
        assignment[Number(active[0].id)] = type;
        assignment[Number(active[1].id)] = type;
      }
      break;
    }

    // Pick 2 random free tiles using the seeded RNG
    const i1 = Math.floor(random() * free.length);
    let i2 = Math.floor(random() * (free.length - 1));
    if (i2 >= i1) i2 += 1;

    const a = free[i1];
    const b = free[i2];
    const type = pairTypes[pairIndex];

    assignment[Number(a.id)] = type;
    assignment[Number(b.id)] = type;
    pairIndex += 1;

    // Remove the two assigned tiles from the active set
    const removedIds = new Set([a.id, b.id]);
    active = active.filter((t) => !removedIds.has(t.id));
  }

  // Build final tiles with stable IDs and the computed type assignments
  const finalTiles: Tile[] = positions.map((pos, i) => ({
    id: `${layout.id}-${seed}-${i}`,
    tileType: assignment[i],
    layer: pos.layer,
    row: pos.row,
    col: pos.col,
    isMatched: false,
    isSelected: false,
    isFree: false,
  }));

  return computeFreeTiles(finalTiles);
}

