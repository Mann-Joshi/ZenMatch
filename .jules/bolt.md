## 2025-02-18 - Optimized array operations in Mahjong logic

**Learning:** In heavily populated Mahjong grids, generating arrays via `.map()` inside frequent hot paths like `computeFreeTiles` or using spread syntax (`...`) inside loops like `getNearbyTiles` introduces measurable performance overhead and memory allocation pressure.

**Action:** Replace `Array.prototype.map()` in critical hot loops with pre-allocated arrays (`new Array(length)`) and standard `for` loops. Replace spread syntax `.push(...bucket)` with explicit `for` loop iterations to prevent potential call stack issues and reduce overhead.
