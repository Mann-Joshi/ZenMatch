## 2024-06-25 - Avoid Intermediate Allocations and Spread Syntax in Spatial Hot Paths
**Learning:** In heavily accessed grid functions (`computeFreeTiles`, `findAvailablePairs`, `getNearbyTiles`), chaining operations like `.map().filter()` or using the spread operator (`candidates.push(...bucket)`) creates significant memory allocation overhead and risks stack overflows.
**Action:** Always prefer pre-allocated arrays (`new Array(length)`) with explicit `for` loops, fold filter logic directly into iterations, and append elements individually to avoid array restructuring overhead.
