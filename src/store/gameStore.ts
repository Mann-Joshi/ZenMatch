import { create } from 'zustand';

import { buildBoardTiles, getLevelBlueprint, materializeLayout, type BoardLayout } from '@/game/layoutEngine';
import {
  areTilesMatching,
  calculateFinalScore,
  calculateMatchScore,
  computeFreeTiles,
  findAvailablePairs,
  getHintPair,
  getNewComboMultiplier,
  isBoardCleared,
  isBoardStuck,
  type Tile,
} from '@/game/mahjongLogic';
import { shuffleBoard } from '@/game/shuffleEngine';
import { useProgressStore } from '@/store/progressStore';
import { playSfx } from '@/utils/audio';
import {
  hapticBoardStuck,
  hapticHint,
  hapticLevelComplete,
  hapticNoMatch,
  hapticTileMatch,
  hapticTileSelect,
} from '@/utils/haptics';

interface UndoEntry {
  tileIds: [string, string];
}

let hintClearTimeout: ReturnType<typeof setTimeout> | null = null;
let mismatchClearTimeout: ReturnType<typeof setTimeout> | null = null;

interface GameState {
  tiles: Tile[];
  selectedTileId: string | null;
  matchedPairs: number;
  totalPairs: number;
  hearts: number;
  hintsRemaining: number;
  hintsUsed: number;
  reshufflesRemaining: number;
  reshufflesUsed: number;
  undoTokensRemaining: number;
  undosUsed: number;
  moves: number;
  timeElapsed: number;
  isTimerRunning: boolean;
  isLevelComplete: boolean;
  isBoardStuck: boolean;
  currentLayout: BoardLayout | null;
  currentWorld: number;
  currentLevel: number;
  currentSeed: string;
  isDailyChallenge: boolean;
  timerEnabled: boolean;
  timeLimitSeconds: number | null;
  hintPairIds: [string, string] | null;
  mismatchTileIds: string[];
  blockedTileId: string | null;
  blockedTapNonce: number;
  /** Running score accumulated per match during the level. */
  score: number;
  /** Final score shown on level complete screen (with bonuses). */
  finalScore: number;
  comboCount: number;
  comboMultiplier: number;
  lastMatchTimestamp: number;
  /** Tile IDs that should glow because they match the current selection. */
  highlightedTileIds: string[];
  undoStack: UndoEntry[];
  isGameOver: boolean;
  firecrackersRemaining: number;

  loadLevel: (world: number, level: number) => void;
  loadDailyChallenge: (world: number, layoutId: string, seed: string) => void;
  tapTile: (tileId: string) => void;
  useHint: () => void;
  useShuffle: () => void;
  undoLastMove: () => void;
  restartLevel: () => void;
  tickTimer: () => void;
  grantHintReward: () => void;
  grantShuffleReward: () => void;
  addHints: (amount: number) => void;
  useFirecracker: () => void;
}

function clearTransientTimers(): void {
  if (hintClearTimeout) {
    clearTimeout(hintClearTimeout);
    hintClearTimeout = null;
  }

  if (mismatchClearTimeout) {
    clearTimeout(mismatchClearTimeout);
    mismatchClearTimeout = null;
  }
}

function resetSelections(tiles: Tile[]): Tile[] {
  return tiles.map((tile) => (tile.isSelected ? { ...tile, isSelected: false } : tile));
}

function setSelectedTile(tiles: Tile[], tileId: string | null): Tile[] {
  return tiles.map((tile) => {
    const isSelected = tileId === tile.id;
    return tile.isSelected === isSelected ? tile : { ...tile, isSelected };
  });
}

/** Returns tile IDs of all free tiles whose type matches the given tile (excluding itself). */
function computeHighlightedIds(tiles: Tile[], selectedTile: Tile): string[] {
  const freeTiles = tiles.filter((t) => t.isFree && !t.isMatched && t.id !== selectedTile.id);
  return freeTiles
    .filter((t) => areTilesMatching(selectedTile, t))
    .map((t) => t.id);
}

export const useGameStore = create<GameState>()((set, get) => ({
  tiles: [],
  selectedTileId: null,
  matchedPairs: 0,
  totalPairs: 0,
  hearts: 3,
  hintsRemaining: 3,
  hintsUsed: 0,
  reshufflesRemaining: 2,
  reshufflesUsed: 0,
  undoTokensRemaining: 3,
  undosUsed: 0,
  moves: 0,
  timeElapsed: 0,
  isTimerRunning: false,
  isLevelComplete: false,
  isBoardStuck: false,
  currentLayout: null,
  currentWorld: 1,
  currentLevel: 1,
  currentSeed: '1-1',
  isDailyChallenge: false,
  timerEnabled: false,
  timeLimitSeconds: null,
  hintPairIds: null,
  mismatchTileIds: [],
  blockedTileId: null,
  blockedTapNonce: 0,
  score: 0,
  finalScore: 0,
  comboCount: 0,
  comboMultiplier: 1.0,
  lastMatchTimestamp: 0,
  highlightedTileIds: [],
  undoStack: [],
  isGameOver: false,
  firecrackersRemaining: 1,

  loadLevel: (world, level) => {
    clearTransientTimers();
    set({
      tiles: [],
      selectedTileId: null,
      isTimerRunning: false,
      hintPairIds: null,
      mismatchTileIds: [],
      blockedTileId: null,
      highlightedTileIds: [],
      undoStack: [],
    });

    const marker = `[perf] loadLevel ${world}-${level}`;
    if (__DEV__) console.time(marker);
    const blueprint = getLevelBlueprint(world, level);
    const layout = materializeLayout(blueprint.layoutId, blueprint.tileCount, blueprint.maxLayer);
    const seed = `${world}-${level}`;
    const tiles = buildBoardTiles(layout, seed);
    if (__DEV__) console.timeEnd(marker);

    // Draw banked hints/shuffles from progressStore, fall back to difficulty defaults
    const progress = useProgressStore.getState();
    const bankedHints = progress.bankedHints ?? 0;
    const bankedShuffles = progress.bankedShuffles ?? 0;
    const hintsRemaining = bankedHints > 0 ? Math.min(bankedHints, blueprint.freeHints + bankedHints) : blueprint.freeHints;
    const shufflesRemaining = bankedShuffles > 0 ? Math.min(bankedShuffles, blueprint.freeShuffles + bankedShuffles) : blueprint.freeShuffles;

    set({
      tiles,
      selectedTileId: null,
      matchedPairs: 0,
      totalPairs: layout.tileCount / 2,
      hearts: 3,
      hintsRemaining,
      hintsUsed: 0,
      reshufflesRemaining: shufflesRemaining,
      reshufflesUsed: 0,
      undoTokensRemaining: blueprint.freeUndos,
      undosUsed: 0,
      moves: 0,
      timeElapsed: 0,
      isTimerRunning: true,
      isLevelComplete: false,
      isBoardStuck: false,
      currentLayout: layout,
      currentWorld: world,
      currentLevel: level,
      currentSeed: seed,
      isDailyChallenge: false,
      timerEnabled: blueprint.timerEnabled,
      timeLimitSeconds: blueprint.timeLimitSeconds,
      hintPairIds: null,
      mismatchTileIds: [],
      blockedTileId: null,
      blockedTapNonce: 0,
      score: 0,
      finalScore: 0,
      comboCount: 0,
      comboMultiplier: 1.0,
      lastMatchTimestamp: 0,
      highlightedTileIds: [],
      undoStack: [],
      isGameOver: false,
    });
  },

  loadDailyChallenge: (world, layoutId, seed) => {
    clearTransientTimers();
    set({
      tiles: [],
      selectedTileId: null,
      isTimerRunning: false,
      hintPairIds: null,
      mismatchTileIds: [],
      blockedTileId: null,
      highlightedTileIds: [],
      undoStack: [],
    });

    const marker = `[perf] loadDaily ${layoutId}-${seed}`;
    if (__DEV__) console.time(marker);
    const layout = materializeLayout(layoutId);
    const tiles = buildBoardTiles(layout, `daily-${seed}`);
    if (__DEV__) console.timeEnd(marker);

    set({
      tiles,
      selectedTileId: null,
      matchedPairs: 0,
      totalPairs: layout.tileCount / 2,
      hearts: 3,
      hintsRemaining: 4,
      hintsUsed: 0,
      reshufflesRemaining: 3,
      reshufflesUsed: 0,
      undoTokensRemaining: 3,
      undosUsed: 0,
      moves: 0,
      timeElapsed: 0,
      isTimerRunning: true,
      isLevelComplete: false,
      isBoardStuck: false,
      currentLayout: layout,
      currentWorld: world,
      currentLevel: 0,
      currentSeed: seed,
      isDailyChallenge: true,
      timerEnabled: true,
      timeLimitSeconds: 900,
      hintPairIds: null,
      mismatchTileIds: [],
      blockedTileId: null,
      blockedTapNonce: 0,
      score: 0,
      finalScore: 0,
      comboCount: 0,
      comboMultiplier: 1.0,
      lastMatchTimestamp: 0,
      highlightedTileIds: [],
      undoStack: [],
      isGameOver: false,
    });
  },

  tapTile: (tileId) => {
    const state = get();
    const tappedTile = state.tiles.find((tile) => tile.id === tileId);

    if (!tappedTile || tappedTile.isMatched) {
      return;
    }

    if (!tappedTile.isFree) {
      set((current) => ({
        blockedTileId: tileId,
        blockedTapNonce: current.blockedTapNonce + 1,
      }));
      void playSfx('tile_no_match');
      void hapticNoMatch();
      return;
    }

    // ── No tile selected yet — select this one ───────────────────────────
    if (!state.selectedTileId) {
      const tiles = setSelectedTile(state.tiles, tileId);
      set({
        tiles,
        selectedTileId: tileId,
        blockedTileId: null,
        highlightedTileIds: [],
      });
      void playSfx('tile_select');
      void hapticTileSelect();
      return;
    }

    // ── Tap same tile again → deselect ───────────────────────────────────
    if (state.selectedTileId === tileId) {
      set({
        tiles: setSelectedTile(state.tiles, null),
        selectedTileId: null,
        highlightedTileIds: [],
      });
      return;
    }

    const selectedTile = state.tiles.find((tile) => tile.id === state.selectedTileId);
    if (!selectedTile) {
      set({
        selectedTileId: null,
        tiles: setSelectedTile(state.tiles, null),
        highlightedTileIds: [],
      });
      return;
    }

    // ── MATCH ─────────────────────────────────────────────────────────────
    if (areTilesMatching(selectedTile, tappedTile)) {
      const now = Date.now();
      const timeSinceLast = state.lastMatchTimestamp > 0 ? now - state.lastMatchTimestamp : 9999;
      const newMultiplier = getNewComboMultiplier(state.comboMultiplier, timeSinceLast);
      const newComboCount = timeSinceLast <= 3000 ? state.comboCount + 1 : 1;
      const matchPoints = calculateMatchScore(100, newMultiplier);
      const newScore = state.score + matchPoints;

      const nextTiles = computeFreeTiles(
        state.tiles.map((tile) => {
          if (tile.id === selectedTile.id || tile.id === tappedTile.id) {
            return { ...tile, isMatched: true, isSelected: false, isFree: false };
          }

          return tile.isSelected ? { ...tile, isSelected: false } : tile;
        }),
      );
      const nextMatchedPairs = state.matchedPairs + 1;
      const nextCleared = isBoardCleared(nextTiles);
      const nextStuck = !nextCleared && isBoardStuck(nextTiles);
      const timeRemaining = state.timeLimitSeconds ? Math.max(0, state.timeLimitSeconds - state.timeElapsed) : 0;

      const finalScore = nextCleared
        ? calculateFinalScore(newScore, timeRemaining, state.hintsUsed, state.reshufflesUsed, state.undosUsed, true)
        : newScore;

      set({
        tiles: nextTiles,
        selectedTileId: null,
        matchedPairs: nextMatchedPairs,
        isLevelComplete: nextCleared,
        isBoardStuck: nextStuck,
        moves: state.moves + 1,
        undoStack: [...state.undoStack, { tileIds: [selectedTile.id, tappedTile.id] }],
        hintPairIds: null,
        blockedTileId: null,
        mismatchTileIds: [],
        highlightedTileIds: [],
        lastMatchTimestamp: now,
        comboCount: newComboCount,
        comboMultiplier: newMultiplier,
        score: newScore,
        finalScore,
        isTimerRunning: !nextCleared,
      });

      void (async () => {
        await playSfx(newComboCount >= 3 ? 'combo' : 'tile_match');
        await hapticTileMatch();

        if (nextCleared) {
          await playSfx('level_complete');
          await hapticLevelComplete();
        } else if (nextStuck) {
          await playSfx('board_stuck');
          await hapticBoardStuck();
        }
      })();

      return;
    }

    // ── MISMATCH ──────────────────────────────────────────────────────────
    const nextHearts = state.hearts - 1;
    const isGameOver = nextHearts <= 0;

    set({
      tiles: setSelectedTile(state.tiles, null),
      selectedTileId: null,
      mismatchTileIds: [selectedTile.id, tappedTile.id],
      blockedTileId: null,
      highlightedTileIds: [],
      hearts: nextHearts,
      isGameOver,
      isTimerRunning: !isGameOver,
      // Mismatch resets combo
      comboCount: 0,
      comboMultiplier: 1.0,
    });

    void playSfx('tile_no_match');
    void hapticNoMatch();
    if (mismatchClearTimeout) {
      clearTimeout(mismatchClearTimeout);
    }
    mismatchClearTimeout = setTimeout(() => {
      if (get().selectedTileId === null) {
        set({ mismatchTileIds: [] });
      }
      mismatchClearTimeout = null;
    }, 420);
  },

  useHint: () => {
    const state = get();
    if (state.hintsRemaining <= 0 || state.isLevelComplete) {
      return;
    }

    const pair = getHintPair(state.tiles);
    if (!pair) {
      return;
    }

    set({
      hintPairIds: pair,
      hintsRemaining: state.hintsRemaining - 1,
      hintsUsed: state.hintsUsed + 1,
    });

    void playSfx('hint_reveal');
    void hapticHint();

    if (hintClearTimeout) {
      clearTimeout(hintClearTimeout);
    }
    hintClearTimeout = setTimeout(() => {
      if (get().hintPairIds?.[0] === pair[0] && get().hintPairIds?.[1] === pair[1]) {
        set({ hintPairIds: null });
      }
      hintClearTimeout = null;
    }, 2000);
  },

  useShuffle: () => {
    const state = get();
    if (state.reshufflesRemaining <= 0 || state.isLevelComplete) {
      return;
    }

    const shuffledTiles = shuffleBoard(state.tiles, `${state.currentSeed}-${state.reshufflesUsed + 1}`);
    set({
      tiles: shuffledTiles,
      selectedTileId: null,
      reshufflesRemaining: state.reshufflesRemaining - 1,
      reshufflesUsed: state.reshufflesUsed + 1,
      isBoardStuck: isBoardStuck(shuffledTiles),
      hintPairIds: null,
      mismatchTileIds: [],
      blockedTileId: null,
      highlightedTileIds: [],
    });
  },

  undoLastMove: () => {
    const state = get();
    const lastEntry = state.undoStack[state.undoStack.length - 1];

    if (!lastEntry || state.undoTokensRemaining <= 0) {
      return;
    }

    const restoredTiles = computeFreeTiles(
      resetSelections(
        state.tiles.map((tile) =>
          lastEntry.tileIds.includes(tile.id)
            ? {
                ...tile,
                isMatched: false,
              }
            : tile,
        ),
      ),
    );

    set({
      tiles: restoredTiles,
      selectedTileId: null,
      matchedPairs: Math.max(0, state.matchedPairs - 1),
      moves: Math.max(0, state.moves - 1),
      isLevelComplete: false,
      isBoardStuck: isBoardStuck(restoredTiles),
      isTimerRunning: true,
      undoTokensRemaining: state.undoTokensRemaining - 1,
      undosUsed: state.undosUsed + 1,
      undoStack: state.undoStack.slice(0, -1),
      mismatchTileIds: [],
      hintPairIds: null,
      blockedTileId: null,
      highlightedTileIds: [],
    });
  },

  restartLevel: () => {
    const state = get();
    if (state.isDailyChallenge && state.currentLayout) {
      get().loadDailyChallenge(state.currentWorld, state.currentLayout.id, state.currentSeed);
      return;
    }

    get().loadLevel(state.currentWorld, state.currentLevel);
  },

  tickTimer: () => {
    const state = get();
    if (!state.isTimerRunning || state.isLevelComplete || state.isBoardStuck || state.isGameOver) {
      return;
    }

    set({
      timeElapsed: state.timeElapsed + 1,
    });
  },

  grantHintReward: () =>
    set((state) => ({
      hintsRemaining: state.hintsRemaining + 1,
    })),

  grantShuffleReward: () =>
    set((state) => ({
      reshufflesRemaining: state.reshufflesRemaining + 1,
      isBoardStuck: false,
    })),

  addHints: (amount) =>
    set((state) => ({
      hintsRemaining: state.hintsRemaining + Math.max(0, amount),
    })),

  useFirecracker: () => {
    const state = get();
    if (state.firecrackersRemaining <= 0 || state.isLevelComplete || state.isGameOver) {
      return;
    }

    // Find up to 3 free pairs
    const pairs = findAvailablePairs(state.tiles).slice(0, 3);
    if (pairs.length === 0) {
      return;
    }

    const removedIds = new Set(pairs.flat());
    const nextTiles = computeFreeTiles(
      resetSelections(
        state.tiles.map((tile) =>
          removedIds.has(tile.id) ? { ...tile, isMatched: true } : tile,
        ),
      ),
    );

    const nextMatchedPairs = state.matchedPairs + pairs.length;
    const nextCleared = isBoardCleared(nextTiles);
    const nextStuck = !nextCleared && isBoardStuck(nextTiles);
    // No combo bonus for firecracker — add flat 100 per pair removed
    const newScore = state.score + pairs.length * 100;
    const timeRemaining = state.timeLimitSeconds ? Math.max(0, state.timeLimitSeconds - state.timeElapsed) : 0;
    const finalScore = nextCleared
      ? calculateFinalScore(newScore, timeRemaining, state.hintsUsed, state.reshufflesUsed, state.undosUsed, true)
      : newScore;

    set({
      tiles: nextTiles,
      firecrackersRemaining: state.firecrackersRemaining - 1,
      matchedPairs: nextMatchedPairs,
      isLevelComplete: nextCleared,
      isBoardStuck: nextStuck,
      score: newScore,
      finalScore,
      isTimerRunning: !nextCleared,
      highlightedTileIds: [],
      selectedTileId: null,
    });

    void playSfx('tile_match');
    void hapticTileMatch();
  },
}));
