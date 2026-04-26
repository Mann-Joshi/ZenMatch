export type SeedInput = number | string;

/**
 * A buffer to avoid repeated allocations when using crypto.getRandomValues.
 */
const RANDOM_BUFFER = new Uint32Array(1024);
let bufferIndex = RANDOM_BUFFER.length;

/**
 * Fills the RANDOM_BUFFER using cryptographically secure random values.
 */
function fillBuffer(): void {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(RANDOM_BUFFER);
  } else {
    // Fallback for environments where crypto might not be available.
    // While Math.random is not CSPRNG, this is a last resort.
    for (let i = 0; i < RANDOM_BUFFER.length; i++) {
      RANDOM_BUFFER[i] = (Math.random() * 0xffffffff) >>> 0;
    }
  }
  bufferIndex = 0;
}

/**
 * Returns a cryptographically secure random number in the range [0, 1).
 */
export function secureRandom(): number {
  if (bufferIndex >= RANDOM_BUFFER.length) {
    fillBuffer();
  }
  const value = RANDOM_BUFFER[bufferIndex];
  bufferIndex += 1;
  return value / 0x100000000;
}

/**
 * A robust 32-bit hash function (cyrb128) to seed the PRNG.
 */
function cyrb128(str: string): [number, number, number, number] {
  let h1 = 1779033703, h2 = 3144134277,
      h3 = 1013904242, h4 = 2773480762;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return [(h1^h2^h3^h4)>>>0, (h2^h1)>>>0, (h3^h1)>>>0, (h4^h1)>>>0];
}

/**
 * A robust seeded PRNG (SFC32).
 */
function sfc32(a: number, b: number, c: number, d: number): () => number {
  return function() {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b | 0) + d | 0;
    d = d + 1 | 0;
    a = b ^ b >>> 9;
    b = c + (c << 3) | 0;
    c = (c << 21 | c >>> 11);
    c = c + t | 0;
    return (t >>> 0) / 4294967296;
  };
}

/**
 * Creates a random number generator. If a seed is provided, it returns a
 * deterministic PRNG (SFC32). Otherwise, it returns a cryptographically
 * secure non-deterministic generator.
 */
export function createSeededRandom(seed?: SeedInput): () => number {
  if (seed === undefined || seed === null) {
    return secureRandom;
  }
  const [a, b, c, d] = cyrb128(String(seed));
  return sfc32(a, b, c, d);
}

/**
 * Shuffles an array. If a seed is provided, the shuffle is deterministic.
 * Otherwise, it uses cryptographically secure random values.
 */
export function shuffleArray<T>(items: readonly T[], seed?: SeedInput): T[] {
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
