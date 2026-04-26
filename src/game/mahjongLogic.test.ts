import { computeFreeTiles, Tile } from './mahjongLogic';

export function createTestTile(
  id: string,
  x: number,
  y: number,
  z: number,
  overrides?: Partial<Tile>
): Tile {
  return {
    id,
    tileType: 'test',
    symbolKey: 'test',
    x,
    y,
    z,
    layer: z,
    row: y,
    col: x,
    isMatched: false,
    isSelected: false,
    isFree: false,
    ...overrides,
  };
}

describe('computeFreeTiles', () => {
  it('should mark a single isolated tile as free', () => {
    const tiles = [createTestTile('1', 0, 0, 0)];
    const result = computeFreeTiles(tiles);
    expect(result[0].isFree).toBe(true);
  });

  it('should mark a tile with a top blocker as not free', () => {
    const tiles = [
      createTestTile('1', 0, 0, 0), // Bottom tile
      createTestTile('2', 0, 0, 1)  // Top blocker
    ];
    const result = computeFreeTiles(tiles);
    expect(result.find(t => t.id === '1')?.isFree).toBe(false);
    expect(result.find(t => t.id === '2')?.isFree).toBe(true); // Top tile is free
  });

  it('should mark a tile with only a left blocker as free', () => {
    const tiles = [
      createTestTile('1', 0, 0, 0),    // Main tile
      createTestTile('2', -1, 0, 0)    // Left blocker
    ];
    const result = computeFreeTiles(tiles);
    expect(result.find(t => t.id === '1')?.isFree).toBe(true); // Right side is open
  });

  it('should mark a tile with only a right blocker as free', () => {
    const tiles = [
      createTestTile('1', 0, 0, 0),    // Main tile
      createTestTile('2', 1, 0, 0)     // Right blocker
    ];
    const result = computeFreeTiles(tiles);
    expect(result.find(t => t.id === '1')?.isFree).toBe(true); // Left side is open
  });

  it('should mark a tile with both left and right blockers as not free', () => {
    const tiles = [
      createTestTile('1', 0, 0, 0),    // Main tile
      createTestTile('2', -1, 0, 0),   // Left blocker
      createTestTile('3', 1, 0, 0)     // Right blocker
    ];
    const result = computeFreeTiles(tiles);
    expect(result.find(t => t.id === '1')?.isFree).toBe(false); // Both sides blocked
  });

  it('should ensure matched tiles have isFree=false and isSelected=false', () => {
    const tiles = [
      createTestTile('1', 0, 0, 0, { isMatched: true, isFree: true, isSelected: true })
    ];
    const result = computeFreeTiles(tiles);
    expect(result[0].isFree).toBe(false);
    expect(result[0].isSelected).toBe(false);
  });

  it('should not consider matched tiles as blockers', () => {
    const tiles = [
      createTestTile('1', 0, 0, 0), // Main tile
      createTestTile('2', 0, 0, 1, { isMatched: true }), // Top blocker, but matched
      createTestTile('3', -1, 0, 0, { isMatched: true }), // Left blocker, but matched
      createTestTile('4', 1, 0, 0, { isMatched: true }) // Right blocker, but matched
    ];
    const result = computeFreeTiles(tiles);
    expect(result.find(t => t.id === '1')?.isFree).toBe(true); // All blockers are matched
  });
});
