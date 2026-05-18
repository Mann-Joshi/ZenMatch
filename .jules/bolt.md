## 2024-05-18 - Single-Pass Iteration in Hot Paths
**Learning:** `computeHighlightedIds` chained `.filter().filter().map()` causes unnecessary memory allocations and is ~33% slower than a single `for` loop. The codebase heavily relies on this in store updates.
**Action:** Consolidate chained array operations into a single `for` loop, especially when filtering and mapping arrays of tiles.
