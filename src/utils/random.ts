export type SeedInput = number | string;

function hashSeed(seed: SeedInput): number {
  const value = String(seed);
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function createSeededRandom(seed: SeedInput): () => number {
  let state = hashSeed(seed) || 1;

  return () => {
    state += 0x6d2b79f5;
    let result = Math.imul(state ^ (state >>> 15), 1 | state);
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleArray<T>(items: readonly T[], seed: SeedInput): T[] {
  const random = createSeededRandom(seed);
  const values = [...items];

  for (let index = values.length - 1; index > 0; index -= 1) {
    const targetIndex = Math.floor(random() * (index + 1));
    const current = values[index];
    values[index] = values[targetIndex];
    values[targetIndex] = current;
  }

  return values;
}
