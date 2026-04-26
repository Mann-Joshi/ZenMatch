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
  depthOffset: number;
  boardWidth: number;
  boardHeight: number;
  scale: number;
  positions: Record<string, { left: number; top: number }>;
}

function buildBoardMetrics(tiles: Tile[], screenWidth: number, screenHeight: number): TileMetrics {
  const tileWidth = 64;
  const tileHeight = 80;
  const depthOffset = 6;

  if (tiles.length === 0) {
    return { tileWidth, tileHeight, depthOffset, boardWidth: tileWidth, boardHeight: tileHeight, scale: 1, positions: {} };
  }

  let minX = tiles[0].x;
  let maxX = tiles[0].x;
  let minY = tiles[0].y;
  let maxY = tiles[0].y;
  let maxZ = Math.max(tiles[0].z, 0);

  for (let i = 1; i < tiles.length; i++) {
    const tile = tiles[i];
    if (tile.x < minX) minX = tile.x;
    if (tile.x > maxX) maxX = tile.x;
    if (tile.y < minY) minY = tile.y;
    if (tile.y > maxY) maxY = tile.y;
    if (tile.z > maxZ) maxZ = tile.z;
  }

  const positions: Record<string, { left: number; top: number }> = {};
  const xOffset = tileWidth * 0.85;
  const yOffset = tileHeight * 0.85;

  for (const tile of tiles) {
    positions[tile.id] = {
      left: (tile.x - minX) * xOffset + tile.z * depthOffset,
      top: (tile.y - minY) * yOffset - tile.z * depthOffset,
    };
  }

  const boardWidth = (maxX - minX) * xOffset + tileWidth + maxZ * depthOffset;
  const boardHeight = (maxY - minY) * yOffset + tileHeight + maxZ * depthOffset;

  const availableWidth = screenWidth * 0.96;
  const availableHeight = screenHeight * 0.65;
  const scale = Math.min(1, availableWidth / boardWidth, availableHeight / boardHeight);

  return { tileWidth, tileHeight, depthOffset, boardWidth, boardHeight, scale, positions };
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
        if (a.z !== b.z) return a.z - b.z;
        if (a.y !== b.y) return a.y - b.y;
        return a.x - b.x;
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
          transform: [{ scale: metrics.scale }],
        },
      }),
    [metrics.boardWidth, metrics.boardHeight, metrics.scale],
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
              id={tile.id}
              symbolKey={tile.symbolKey}
              x={tile.x}
              y={tile.y}
              z={tile.z}
              tile={tile}
              worldTheme={worldTheme}
              isSelected={tile.isSelected}
              isBlocked={!tile.isFree && !tile.isMatched}
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
