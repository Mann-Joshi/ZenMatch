## 2024-05-14 - [O(n²) bottleneck in getHintPair]
**Learning:** Found an O(N) array scan for tile lookups within a loop over all possible hint pairs, making the complexity O(P * N) where P is the number of pairs.
**Action:** Always precompute a `Record<string, Tile>` map before running nested loops that need to lookup specific tiles by ID.
