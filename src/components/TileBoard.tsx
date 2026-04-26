import { memo, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions, type ViewStyle } from 'react-native';

import { MahjongTile } from '@/components/MahjongTile';
import type { Tile } from '@/game/mahjongLogic';
import type { WorldTheme } from '@/theme/worlds';

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
  const layoutKey =
    tiles.length === 0 ? 'empty' : `${tiles.length}:${tiles[0]?.id ?? ''}:${tiles[tiles.length - 1]?.id ?? ''}`;

  const tileById = useMemo(() => {
    const next: Record<string, Tile> = {};
    for (const tile of tiles) {
      next[tile.id] = tile;
    }
    return next;
  }, [tiles]);

  const orderedTileIds = useMemo(
    () =>
      [...tiles].sort((a, b) => {
        if (a.layer !== b.layer) return a.layer - b.layer;
        if (a.row !== b.row) return a.row - b.row;
        return a.col - b.col;
      }).map((tile) => tile.id),
    // Re-sort only when a new level/layout is loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layoutKey],
  );

  const orderedTiles = useMemo(
    () => orderedTileIds.map((tileId) => tileById[tileId]).filter(Boolean),
    [orderedTileIds, tileById],
  );

  const metrics = useMemo(
    () => buildBoardMetrics(orderedTiles, width, height),
    // Board geometry is static during a level.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layoutKey, width, height],
  );

  const positionStyles = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(metrics.positions).map(([tileId, pos]) => [
          tileId,
          StyleSheet.create({
            p: { position: 'absolute', left: pos.left, top: pos.top },
          }).p,
        ]),
      ) as Record<string, ViewStyle>,
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

  const hintIds = useMemo(() => new Set(hintPairIds ?? []), [hintPairIds]);
  const mismatchIds = useMemo(() => new Set(mismatchTileIds), [mismatchTileIds]);
  const highlightedIds = useMemo(() => new Set(highlightedTileIds), [highlightedTileIds]);

  if (orderedTiles.length === 0) {
    return <View style={emptyStyles.board} />;
  }

  return (
    <View style={boardStyles.board}>
      {orderedTiles.map((tile, index) => {
        const isThisBlocked = blockedTileId === tile.id;

        return (
          <View
            key={tile.id}
            style={positionStyles[tile.id]}
            pointerEvents={tile.isMatched ? 'none' : 'auto'}
          >
            <MahjongTile
              tile={tile}
              worldTheme={worldTheme}
              isSelected={tile.isSelected}
              onTap={onTap}
              tileWidth={metrics.tileWidth}
              tileHeight={metrics.tileHeight}
              appearDelayMs={Math.min(index * 12, 420)}
              hintActive={hintIds.has(tile.id)}
              errorActive={mismatchIds.has(tile.id)}
              blockedTapNonce={isThisBlocked ? blockedTapNonce : 0}
              isBlockedTile={isThisBlocked}
              isHighlighted={highlightedIds.has(tile.id)}
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
