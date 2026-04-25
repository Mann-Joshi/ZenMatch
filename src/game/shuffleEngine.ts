import { computeFreeTiles, findAvailablePairs, type Tile } from '@/game/mahjongLogic';
import { shuffleArray, type SeedInput } from '@/utils/random';

export function shuffleBoard(tiles: Tile[], seed: SeedInput): Tile[] {
  const activeTiles = tiles.filter((tile) => !tile.isMatched);
  if (activeTiles.length < 2) {
    return computeFreeTiles(tiles);
  }

  const tileTypes = activeTiles.map((tile) => tile.tileType);
  // Start with original board as the fallback candidate
  let candidateTiles = computeFreeTiles(tiles);

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const shuffledTypes = shuffleArray(tileTypes, `${seed}-${attempt}`);
    let typeIndex = 0;

    const shuffledBoard = tiles.map((tile) => {
      if (tile.isMatched) {
        return { ...tile, isSelected: false };
      }

      const nextTile = {
        ...tile,
        tileType: shuffledTypes[typeIndex],
        isSelected: false,
      };

      typeIndex += 1;
      return nextTile;
    });

    // Always persist the last attempt so we never return the original stuck board
    candidateTiles = computeFreeTiles(shuffledBoard);
    if (findAvailablePairs(candidateTiles).length > 0) {
      break;
    }
  }

  return candidateTiles;
}

