## 2024-05-19 - [Referential Equality in Tile Arrays]
**Learning:** Returning a newly mapped array in `computeFreeTiles` every frame causes massive React re-renders in `TileBoard` even when actual tile states haven't changed.
**Action:** Always maintain array reference equality for unchanged board states by looping over the existing array and only copying elements when state changes.
