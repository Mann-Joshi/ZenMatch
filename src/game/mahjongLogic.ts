export interface Tile {
  id: string;
  tileType: string;
  layer: number;
  row: number;
  col: number;
  isMatched: boolean;
  isSelected: boolean;
  isFree: boolean;
}

const SIDE_EPSILON = 0.01;
const TOP_OVERLAP_ROW = 1;
const TOP_OVERLAP_COL = 1;
const SIDE_OVERLAP_ROW = 0.5;
const SIDE_OVERLAP_COL = 1;

function isTileActive(tile: Tile): boolean {
  return !tile.isMatched;
}

function isSeasonTile(tileType: string): boolean {
  return tileType.startsWith('season_');
}

function isFlowerTile(tileType: string): boolean {
  return tileType.startsWith('flower_');
}

function hasTopBlocker(tile: Tile, tiles: Tile[]): boolean {
  return tiles.some(
    (candidate) =>
      candidate.id !== tile.id &&
      isTileActive(candidate) &&
      candidate.layer > tile.layer &&
      Math.abs(candidate.row - tile.row) <= TOP_OVERLAP_ROW &&
      Math.abs(candidate.col - tile.col) <= TOP_OVERLAP_COL,
  );
}

function hasSideBlocker(tile: Tile, tiles: Tile[], direction: 'left' | 'right'): boolean {
  return tiles.some((candidate) => {
    if (candidate.id === tile.id || !isTileActive(candidate) || candidate.layer !== tile.layer) {
      return false;
    }

    const rowOverlap = Math.abs(candidate.row - tile.row) <= SIDE_OVERLAP_ROW;
    const columnDistance = candidate.col - tile.col;
    const blocksLeft = direction === 'left' && columnDistance < -SIDE_EPSILON && Math.abs(columnDistance) <= SIDE_OVERLAP_COL;
    const blocksRight = direction === 'right' && columnDistance > SIDE_EPSILON && Math.abs(columnDistance) <= SIDE_OVERLAP_COL;
    return rowOverlap && (blocksLeft || blocksRight);
  });
}

export function computeFreeTiles(tiles: Tile[]): Tile[] {
  return tiles.map((tile) => {
    if (tile.isMatched) {
      return { ...tile, isFree: false, isSelected: false };
    }

    const blockedAbove = hasTopBlocker(tile, tiles);
    const blockedLeft = hasSideBlocker(tile, tiles, 'left');
    const blockedRight = hasSideBlocker(tile, tiles, 'right');

    return {
      ...tile,
      isFree: !blockedAbove && (!blockedLeft || !blockedRight),
    };
  });
}

export function areTilesMatching(tileA: Tile, tileB: Tile): boolean {
  if (tileA.id === tileB.id) {
    return false;
  }

  if (tileA.tileType === tileB.tileType) {
    return true;
  }

  if (isSeasonTile(tileA.tileType) && isSeasonTile(tileB.tileType)) {
    return true;
  }

  if (isFlowerTile(tileA.tileType) && isFlowerTile(tileB.tileType)) {
    return true;
  }

  return false;
}

export function findAvailablePairs(tiles: Tile[]): [string, string][] {
  const computedTiles = computeFreeTiles(tiles).filter((tile) => tile.isFree && !tile.isMatched);
  const pairs: [string, string][] = [];

  for (let left = 0; left < computedTiles.length; left += 1) {
    for (let right = left + 1; right < computedTiles.length; right += 1) {
      if (areTilesMatching(computedTiles[left], computedTiles[right])) {
        pairs.push([computedTiles[left].id, computedTiles[right].id]);
      }
    }
  }

  return pairs;
}

export function isBoardStuck(tiles: Tile[]): boolean {
  if (isBoardCleared(tiles)) {
    return false;
  }

  return findAvailablePairs(tiles).length === 0;
}

export function isBoardCleared(tiles: Tile[]): boolean {
  return tiles.every((tile) => tile.isMatched);
}

export function getHintPair(tiles: Tile[]): [string, string] | null {
  const pairs = findAvailablePairs(tiles);
  if (pairs.length === 0) {
    return null;
  }

  let bestPair: [string, string] | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const pair of pairs) {
    const currentFreeTiles = computeFreeTiles(tiles).filter((tile) => tile.isFree && !tile.isMatched).length;
    const simulatedTiles = computeFreeTiles(
      tiles.map((tile) =>
        pair.includes(tile.id)
          ? {
              ...tile,
              isMatched: true,
              isSelected: false,
              isFree: false,
            }
          : tile,
      ),
    );

    const nextFreeTiles = simulatedTiles.filter((tile) => tile.isFree && !tile.isMatched).length;
    const score = nextFreeTiles - currentFreeTiles;

    if (score > bestScore) {
      bestScore = score;
      bestPair = pair;
    }
  }

  return bestPair;
}

export function calculateMatchScore(basePoints: number, comboMultiplier: number): number {
  return Math.round(basePoints * comboMultiplier);
}

/**
 * Returns the new combo multiplier after a match.
 * - If more than 3 seconds elapsed since the last match → reset to 1.0
 * - Otherwise → increase by 0.5, capped at 2.5
 */
export function getNewComboMultiplier(currentMultiplier: number, timeSinceLastMs: number): number {
  if (timeSinceLastMs > 3000) {
    return 1.0;
  }
  return Math.min(currentMultiplier + 0.5, 2.5);
}

/**
 * Full end-of-level bonus calculation.
 */
export function calculateFinalScore(
  runningScore: number,
  timeRemaining: number,
  hintsUsed: number,
  reshufflesUsed: number,
  undosUsed: number,
  allCleared: boolean,
): number {
  const clearBonus = allCleared ? 500 : 0;
  const hintBonus = hintsUsed === 0 ? 300 : 0;
  const shuffleBonus = reshufflesUsed === 0 ? 200 : 0;
  const undoBonus = undosUsed === 0 ? 100 : 0;
  const timeBonus = Math.floor(timeRemaining) * 50;
  return runningScore + clearBonus + hintBonus + shuffleBonus + undoBonus + timeBonus;
}

/** Legacy helper kept for backward compat (level complete screen legacy call). */
export function calculateScore(timeRemaining: number, hintsUsed: number, reshufflesUsed: number): number {
  const unusedHints = Math.max(0, 3 - hintsUsed);
  const reshuffleBonus = reshufflesUsed === 0 ? 200 : 0;
  return 1000 + Math.max(0, Math.floor(timeRemaining)) * 10 + unusedHints * 50 + reshuffleBonus;
}

