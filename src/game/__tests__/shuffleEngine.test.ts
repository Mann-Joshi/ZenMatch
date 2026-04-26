import { shuffleBoard } from '@/game/shuffleEngine';
import { findAvailablePairs, type Tile } from '@/game/mahjongLogic';

function createMockTile(overrides: Partial<Tile>): Tile {
  return {
    id: overrides.id || `tile-${Math.random()}`,
    tileType: overrides.tileType || 'bamboo_1',
    symbolKey: overrides.symbolKey || 'bamboo_1',
    group: undefined,
    x: 0,
    y: 0,
    z: 0,
    layer: 0,
    row: 0,
    col: 0,
    isMatched: false,
    isSelected: false,
    isFree: true,
    ...overrides,
  };
}

describe('shuffleBoard', () => {
  it('should return tiles unmodified (via computeFreeTiles) if less than 2 active tiles', () => {
    const tiles: Tile[] = [
      createMockTile({ id: '1', tileType: 'bamboo_1', isMatched: false }),
      createMockTile({ id: '2', tileType: 'bamboo_1', isMatched: true }),
      createMockTile({ id: '3', tileType: 'character_2', isMatched: true }),
    ];

    const result = shuffleBoard(tiles, 'test-seed');
    expect(result.length).toBe(3);
    const activeResult = result.filter(t => !t.isMatched);
    expect(activeResult.length).toBe(1);
    expect(activeResult[0].tileType).toBe('bamboo_1');
  });

  it('should preserve isMatched status and not change tileType of matched tiles', () => {
    const tiles: Tile[] = [
      createMockTile({ id: '1', tileType: 'bamboo_1', isMatched: true, x: 0 }),
      createMockTile({ id: '2', tileType: 'bamboo_2', isMatched: true, x: 2 }),
      createMockTile({ id: '3', tileType: 'dot_1', isMatched: false, x: 4 }),
      createMockTile({ id: '4', tileType: 'dot_2', isMatched: false, x: 6 }),
      createMockTile({ id: '5', tileType: 'dot_3', isMatched: false, x: 8 }),
      createMockTile({ id: '6', tileType: 'dot_4', isMatched: false, x: 10 }),
    ];

    const result = shuffleBoard(tiles, 'test-seed-123');

    const matchedTiles = result.filter(t => t.isMatched);
    expect(matchedTiles.length).toBe(2);
    expect(matchedTiles.find(t => t.id === '1')?.tileType).toBe('bamboo_1');
    expect(matchedTiles.find(t => t.id === '2')?.tileType).toBe('bamboo_2');
  });

  it('should guarantee at least one available pair in the shuffled result', () => {
    const blockedTiles: Tile[] = [
      createMockTile({ id: '1', tileType: 'dot_1', symbolKey: 'dot_1', x: 0, y: 0, z: 0 }),
      createMockTile({ id: '2', tileType: 'dot_1', symbolKey: 'dot_1', x: 0, y: 0, z: 1 }),

      createMockTile({ id: '3', tileType: 'dot_2', symbolKey: 'dot_2', x: 2, y: 0, z: 0 }),
      createMockTile({ id: '4', tileType: 'dot_2', symbolKey: 'dot_2', x: 2, y: 0, z: 1 }),

      createMockTile({ id: '6', tileType: 'dot_3', symbolKey: 'dot_3', x: 4, y: 0, z: 0 }),
      createMockTile({ id: '5', tileType: 'dot_3', symbolKey: 'dot_3', x: 4, y: 0, z: 1 }),
    ];

    expect(findAvailablePairs(blockedTiles).length).toBe(0);

    const result = shuffleBoard(blockedTiles, 'seed-pair-guarantee');

    expect(findAvailablePairs(result).length).toBeGreaterThan(0);
  });

  it('should be deterministic based on the seed', () => {
    const tiles: Tile[] = [
      createMockTile({ id: '1', tileType: 'dot_1', x: 0 }),
      createMockTile({ id: '2', tileType: 'dot_2', x: 2 }),
      createMockTile({ id: '3', tileType: 'bamboo_1', x: 4 }),
      createMockTile({ id: '4', tileType: 'bamboo_2', x: 6 }),
    ];

    const result1 = shuffleBoard(tiles, 'deterministic-seed');
    const result2 = shuffleBoard(tiles, 'deterministic-seed');

    expect(result1.map(t => t.tileType)).toEqual(result2.map(t => t.tileType));

    const result3 = shuffleBoard(tiles, 'different-seed');
    expect(result1.map(t => t.tileType)).not.toEqual(result3.map(t => t.tileType));
  });
});
