import { shuffleArray, createSeededRandom } from './random';

describe('random', () => {
  describe('createSeededRandom', () => {
    it('generates a deterministic sequence of numbers for a given number seed', () => {
      const random1 = createSeededRandom(12345);
      const random2 = createSeededRandom(12345);

      expect(random1()).toBe(random2());
      expect(random1()).toBe(random2());
      expect(random1()).toBe(random2());
    });

    it('generates a deterministic sequence of numbers for a given string seed', () => {
      const random1 = createSeededRandom('test-seed');
      const random2 = createSeededRandom('test-seed');

      expect(random1()).toBe(random2());
      expect(random1()).toBe(random2());
      expect(random1()).toBe(random2());
    });

    it('generates different sequences for different seeds', () => {
      const random1 = createSeededRandom('seed-a');
      const random2 = createSeededRandom('seed-b');

      expect(random1()).not.toBe(random2());
    });
  });

  describe('shuffleArray', () => {
    it('does not mutate the original array', () => {
      const original = [1, 2, 3, 4, 5];
      const copy = [...original];
      shuffleArray(original, 'seed');
      expect(original).toEqual(copy);
    });

    it('returns an array with the exact same elements', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffleArray(original, 'seed');
      expect(shuffled).toHaveLength(original.length);
      expect([...shuffled].sort()).toEqual([...original].sort());
    });

    it('provides deterministic shuffling for the same seed', () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const shuffled1 = shuffleArray(items, 'deterministic-seed');
      const shuffled2 = shuffleArray(items, 'deterministic-seed');

      expect(shuffled1).toEqual(shuffled2);
    });

    it('produces different orders for different seeds', () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const shuffled1 = shuffleArray(items, 'seed-1');
      const shuffled2 = shuffleArray(items, 'seed-2');

      expect(shuffled1).not.toEqual(shuffled2);
    });

    it('handles empty arrays', () => {
      expect(shuffleArray([], 'seed')).toEqual([]);
    });

    it('handles arrays with a single element', () => {
      expect(shuffleArray([1], 'seed')).toEqual([1]);
    });
  });
});
