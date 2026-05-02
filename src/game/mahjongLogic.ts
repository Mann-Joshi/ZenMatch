export interface Tile {
  id: string;
  tileType: string;
  symbolKey: string;
  group?: 'flower' | 'season';
  x: number;
  y: number;
  z: number;
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
const POSITION_SCALE = 2;

type TileBuckets = Map<string, Tile[]>;

function isTileActive(tile: Tile): boolean {
  return !tile.isMatched;
}

export function getTileGroup(symbolKey: string): Tile['group'] {
  if (symbolKey.startsWith('flower_')) {
    return 'flower';
  }

  if (symbolKey.startsWith('season_')) {
    return 'season';
  }

  return undefined;
}

function getPositionKey(y: number, x: number): string {
  return `${Math.round(y * POSITION_SCALE)}:${Math.round(x * POSITION_SCALE)}`;
}

function getScaledPosition(tile: Tile): { y: number; x: number } {
  return {
    y: Math.round(tile.y * POSITION_SCALE),
    x: Math.round(tile.x * POSITION_SCALE),
  };
}

function buildTileBuckets(tiles: Tile[]): TileBuckets {
  const buckets: TileBuckets = new Map();

  for (const tile of tiles) {
    if (!isTileActive(tile)) {
      continue;
    }

    const key = getPositionKey(tile.y, tile.x);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(tile);
    } else {
      buckets.set(key, [tile]);
    }
  }

  return buckets;
}

export function isTileFree(tile: Tile, buckets: TileBuckets): boolean {
  const center = getScaledPosition(tile);
  const ySteps = Math.ceil(SIDE_OVERLAP_ROW * POSITION_SCALE);
  const xSteps = Math.ceil(SIDE_OVERLAP_COL * POSITION_SCALE);

  let blockedAbove = false;
  let blockedLeft = false;
  let blockedRight = false;

  for (let y = center.y - ySteps; y <= center.y + ySteps; y += 1) {
    for (let x = center.x - xSteps; x <= center.x + xSteps; x += 1) {
      const bucket = buckets.get(`${y}:${x}`);
      if (!bucket) continue;

      for (let i = 0; i < bucket.length; i++) {
        const candidate = bucket[i];
        if (candidate.id === tile.id || !isTileActive(candidate)) continue;

        if (!blockedAbove && candidate.z > tile.z && candidate.x === tile.x && candidate.y === tile.y) {
          blockedAbove = true;
        }

        if (candidate.z === tile.z) {
          const rowOverlap = Math.abs(candidate.y - tile.y) <= SIDE_OVERLAP_ROW;
          if (rowOverlap) {
            const columnDistance = candidate.x - tile.x;
            if (!blockedLeft && columnDistance < -SIDE_EPSILON && Math.abs(columnDistance) <= SIDE_OVERLAP_COL) {
              blockedLeft = true;
            }
            if (!blockedRight && columnDistance > SIDE_EPSILON && Math.abs(columnDistance) <= SIDE_OVERLAP_COL) {
              blockedRight = true;
            }
          }
        }

        if (blockedAbove || (blockedLeft && blockedRight)) {
          return false;
        }
      }
    }
  }

  return true;
}

export function computeFreeTiles(tiles: Tile[]): Tile[] {
  const buckets = buildTileBuckets(tiles);

  return tiles.map((tile) => {
    if (tile.isMatched) {
      if (!tile.isFree && !tile.isSelected) {
        return tile;
      }

      return { ...tile, isFree: false, isSelected: false };
    }

    const isFree = isTileFree(tile, buckets);

    if (tile.isFree === isFree) {
      return tile;
    }

    return {
      ...tile,
      isFree,
    };
  });
}

export function areTilesMatching(tileA: Tile, tileB: Tile): boolean {
  if (tileA.id === tileB.id) {
    return false;
  }

  const groupA = tileA.group ?? getTileGroup(tileA.symbolKey ?? tileA.tileType);
  const groupB = tileB.group ?? getTileGroup(tileB.symbolKey ?? tileB.tileType);

  if (groupA === 'flower' && groupB === 'flower') {
    return true;
  }

  if (groupA === 'season' && groupB === 'season') {
    return true;
  }

  return (tileA.symbolKey ?? tileA.tileType) === (tileB.symbolKey ?? tileB.tileType);
}

export function findAvailablePairs(tiles: Tile[]): [string, string][] {
  const computedTiles = computeFreeTiles(tiles).filter((tile) => tile.isFree && !tile.isMatched);
  const pairs: [string, string][] = [];

  const buckets = new Map<string, Tile[]>();

  for (const tile of computedTiles) {
    const group = tile.group ?? getTileGroup(tile.symbolKey ?? tile.tileType);
    let key: string;

    if (group === 'flower') {
      key = 'group:flower';
    } else if (group === 'season') {
      key = 'group:season';
    } else {
      key = `exact:${tile.symbolKey ?? tile.tileType}`;
    }

    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(tile);
    } else {
      buckets.set(key, [tile]);
    }
  }

  for (const bucket of buckets.values()) {
    for (let i = 0; i < bucket.length; i += 1) {
      for (let j = i + 1; j < bucket.length; j += 1) {
        if (bucket[i].id !== bucket[j].id) {
          pairs.push([bucket[i].id, bucket[j].id]);
        }
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
  const pairsFound = findAvailablePairs(tiles);
  if (pairsFound.length === 0) {
    return null;
  }

  const computedTiles = computeFreeTiles(tiles);
  let bestPair: [string, string] | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  let freeActiveTilesCount = 0;
  for (let i = 0; i < computedTiles.length; i++) {
    if (computedTiles[i].isFree && !computedTiles[i].isMatched) {
      freeActiveTilesCount++;
    }
  }

  const initialBuckets = buildTileBuckets(computedTiles);

  for (let p = 0; p < pairsFound.length; p++) {
    const pair = pairsFound[p];

    let t1: Tile | undefined;
    let t2: Tile | undefined;
    for (let i = 0; i < computedTiles.length; i++) {
      if (computedTiles[i].id === pair[0]) t1 = computedTiles[i];
      if (computedTiles[i].id === pair[1]) t2 = computedTiles[i];
    }

    if (!t1 || !t2) continue;

    const key1 = getPositionKey(t1.y, t1.x);
    const key2 = getPositionKey(t2.y, t2.x);

    const bucket1 = initialBuckets.get(key1) || [];
    const bucket2 = initialBuckets.get(key2) || [];

    initialBuckets.set(key1, bucket1.filter(t => t.id !== t1!.id));
    if (key1 === key2) {
      initialBuckets.set(key1, (initialBuckets.get(key1) || []).filter(t => t.id !== t2!.id));
    } else {
      initialBuckets.set(key2, bucket2.filter(t => t.id !== t2!.id));
    }

    t1.isMatched = true;
    t2.isMatched = true;

    const ySteps = Math.ceil(SIDE_OVERLAP_ROW * POSITION_SCALE);
    const xSteps = Math.ceil(SIDE_OVERLAP_COL * POSITION_SCALE);

    const candidatesToCheck = new Set<Tile>();

    // Collect candidates near t1
    const center1 = getScaledPosition(t1);
    for (let y = center1.y - ySteps; y <= center1.y + ySteps; y += 1) {
      for (let x = center1.x - xSteps; x <= center1.x + xSteps; x += 1) {
        const bucket = initialBuckets.get(`${y}:${x}`);
        if (bucket) {
          for (let i = 0; i < bucket.length; i++) {
            if (!bucket[i].isMatched) candidatesToCheck.add(bucket[i]);
          }
        }
      }
    }

    // Collect candidates near t2
    const center2 = getScaledPosition(t2);
    for (let y = center2.y - ySteps; y <= center2.y + ySteps; y += 1) {
      for (let x = center2.x - xSteps; x <= center2.x + xSteps; x += 1) {
        const bucket = initialBuckets.get(`${y}:${x}`);
        if (bucket) {
          for (let i = 0; i < bucket.length; i++) {
            if (!bucket[i].isMatched) candidatesToCheck.add(bucket[i]);
          }
        }
      }
    }

    let nextFreeTilesCount = freeActiveTilesCount - 2;

    for (const tile of candidatesToCheck) {
      if (tile.isFree) nextFreeTilesCount--;

      const isFree = isTileFree(tile, initialBuckets);

      if (isFree) nextFreeTilesCount++;
    }

    t1.isMatched = false;
    t2.isMatched = false;
    initialBuckets.set(key1, bucket1);
    initialBuckets.set(key2, bucket2);

    const score = nextFreeTilesCount - freeActiveTilesCount;
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
