import { memo, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import type { Tile } from '@/game/mahjongLogic';
import type { WorldTheme } from '@/theme/worlds';
import { MahjongTile } from '@/components/MahjongTile';

interface TileBoardProps {
  tiles: Tile[];
  worldTheme: WorldTheme;
  onTap: (id: string) => void;
  hintPairIds: [string, string] | null;
  mismatchTileIds: string[];
  blockedTileId: string | null;
  blockedTapNonce: number;
  highlightedTileIds: string[];
}

interface TileMetrics {
  tileWidth: number;
  tileHeight: number;
  boardWidth: number;
  boardHeight: number;
  positions: Record<string, { left: number; top: number }>;
}

// ── Pure function — called only when layout or screen size changes ─────────────
function buildBoardMetrics(tiles: Tile[], screenWidth: number, screenHeight: number): TileMetrics {
  if (tiles.length === 0) {
    return { tileWidth: 52, tileHeight: 68, boardWidth: 52, boardHeight: 68, positions: {} };
  }

  const rows = tiles.map((t) => t.row);
  const cols = tiles.map((t) => t.col);
  const maxLayer = Math.max(...tiles.map((t) => t.layer), 0);
  const minRow = Math.min(...rows);
  const maxRow = Math.max(...rows);
  const minCol = Math.min(...cols);
  const maxCol = Math.max(...cols);

  const availableWidth = screenWidth * 0.9;
  const availableHeight = screenHeight * 0.58;
  const widthUnits = Math.max(1, (maxCol - minCol) * 0.5 + 1.4);
  const heightUnits = Math.max(1, (maxRow - minRow) * 0.76 + 1.3);
  const tileWidth = Math.max(
    28,
    Math.min(
      52,
      availableWidth / (widthUnits + maxLayer * 0.18),
      (availableHeight / (heightUnits + maxLayer * 0.08)) * 0.76,
    ),
  );
  const tileHeight = tileWidth * (68 / 52);
  const halfStep = (tileWidth + tileWidth * 0.08) / 2;
  const rowStep = tileHeight * 0.72;
  const layerOffset = tileWidth * (4 / 52);

  const positions: Record<string, { left: number; top: number }> = {};
  tiles.forEach((tile) => {
    positions[tile.id] = {
      left: (tile.col - minCol) * halfStep + tile.layer * layerOffset,
      top: (tile.row - minRow) * rowStep - tile.layer * layerOffset,
    };
  });

  const boardWidth =
    (maxCol - minCol) * halfStep + tileWidth + maxLayer * layerOffset + tileWidth * 0.08;
  const boardHeight =
    (maxRow - minRow) * rowStep + tileHeight + maxLayer * layerOffset + tileWidth * 0.08;

  return { tileWidth, tileHeight, boardWidth, boardHeight, positions };
}

// ── TileBoard wrapped in React.memo ───────────────────────────────────────────
// React.memo here prevents re-render when parent game screen updates score/timer
// but tiles / hintPairIds etc. haven't changed.
export const TileBoard = memo(function TileBoard({
  tiles,
  worldTheme,
  onTap,
  hintPairIds,
  mismatchTileIds,
  blockedTileId,
  blockedTapNonce,
  highlightedTileIds,
}: TileBoardProps) {
  const { width, height } = useWindowDimensions();

  // Sort tiles for proper z-order — only when tiles array identity changes
  const orderedTiles = useMemo(
    () =>
      [...tiles].sort((a, b) => {
        if (a.layer !== b.layer) return a.layer - b.layer;
        if (a.row !== b.row) return a.row - b.row;
        return a.col - b.col;
      }),
    [tiles],
  );

  // Board metrics are expensive — memoize on tile identity + screen size only.
  // Position of existing tiles never changes during a level.
  // We use orderedTiles.length as an extra guard so a fresh level always
  // recomputes (tiles is a new array reference, but belt-and-suspenders).
  const metrics = useMemo(
    () => buildBoardMetrics(orderedTiles, width, height),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orderedTiles.length, width, height],
  );

  // Pre-build flat style objects once — avoids StyleSheet.create per frame
  const positionStyles = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(metrics.positions).map(([tileId, pos]) => [
          tileId,
          StyleSheet.create({
            p: { position: 'absolute', left: pos.left, top: pos.top },
          }).p,
        ]),
      ) as Record<string, ReturnType<typeof StyleSheet.create>['p']>,
    [metrics.positions],
  );

  const boardStyles = useMemo(
    () =>
      StyleSheet.create({
        board: {
          width: metrics.boardWidth,
          height: metrics.boardHeight,
          alignSelf: 'center' as const,
        },
      }),
    [metrics.boardWidth, metrics.boardHeight],
  );

  if (orderedTiles.length === 0) {
    return <View style={emptyStyles.board} />;
  }

  return (
    <View style={boardStyles.board}>
      {orderedTiles.map((tile, index) => {
        // Compute per-tile derived booleans here so MahjongTile gets primitives —
        // primitives are compared by value in memo comparator, not by reference.
        const isHintActive = hintPairIds?.includes(tile.id) ?? false;
        const isErrorActive = mismatchTileIds.includes(tile.id);
        const isThisBlocked = blockedTileId === tile.id;
        const isHighlighted = highlightedTileIds.includes(tile.id);

        return (
          <View
            key={tile.id}
            style={positionStyles[tile.id]}
            // Matched tiles: remove pointer events so invisible tiles
            // don't swallow taps on newly-freed tiles (web + Android fix)
            pointerEvents={tile.isMatched ? 'none' : 'auto'}
          >
            <MahjongTile
              tile={tile}
              worldTheme={worldTheme}
              isSelected={tile.isSelected}
              onTap={onTap}
              tileWidth={metrics.tileWidth}
              tileHeight={metrics.tileHeight}
              appearDelayMs={index * 24}
              hintActive={isHintActive}
              errorActive={isErrorActive}
              blockedTapNonce={isThisBlocked ? blockedTapNonce : 0}
              isBlockedTile={isThisBlocked}
              isHighlighted={isHighlighted}
            />
          </View>
        );
      })}
    </View>
  );
});

const emptyStyles = StyleSheet.create({
  board: { width: 52, height: 68, alignSelf: 'center' },
});
