
## 2024-05-07 - Unified Grid Traversal for Blocker Checks
**Learning:** Mahjong tile blocker checks (`computeFreeTiles`) caused severe performance overhead by redundantly traversing the spatial grid for each direction (`top`, `left`, `right`) and allocating intermediate arrays.
**Action:** Combined blocker logic into a single, unified grid traversal using shared bucket lookups with early-exit conditions. This preserves functionality while halving calculation time per loop, which is critical for smooth frame rates in heavily populated boards.
