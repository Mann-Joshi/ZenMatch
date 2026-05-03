## 2024-03-24 - [MahjongLogic performance optimization]
**Learning:** Found a major bottleneck in `computeFreeTiles` caused by `getNearbyTiles` returning arrays and looping multiple times.
**Action:** Inlined the nearby search loop into `computeFreeTiles` and `getHintPair` using unified loop iteration, and avoided array creation (`push`). Doing so drastically improved the performance by >70% (~2700ms down to ~770ms for 5000 runs).
