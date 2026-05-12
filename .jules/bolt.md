
## 2024-05-13 - [Optimize Tile Freeness Check]
**Learning:** Checking for Mahjong tile blockers independently (`hasTopBlocker`, `hasSideBlocker('left')`, `hasSideBlocker('right')`) leads to redundant map lookups, grid traversals, and multiple array allocations (since `getNearbyTiles` returns an array of candidates each time).
**Action:** Combine these checks into a single unified spatial grid traversal (`checkBlockers`) that loops through the nearby area once, checks top/left/right simultaneously, and can early return immediately if all blockers are found. This pattern reduces memory allocations and roughly halves execution time in hot loops (`computeFreeTiles` and hint evaluation).
