import { useMemo } from 'react';
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

function buildBoardMetrics(tiles: Tile[], screenWidth: number, screenHeight: number): TileMetrics {
  if (tiles.length === 0) {
    return {
      tileWidth: 52,
      tileHeight: 68,
      boardWidth: 52,
      boardHeight: 68,
      positions: {},
    };
  }

  const rows = tiles.map((tile) => tile.row);
  const cols = tiles.map((tile) => tile.col);
  const maxLayer = Math.max(...tiles.map((tile) => tile.layer), 0);
  const minRow = Math.min(...rows);
  const maxRow = Math.max(...rows);
  const minCol = Math.min(...cols);
  const maxCol = Math.max(...cols);

  const availableWidth = screenWidth * 0.9;
  const availableHeight = screenHeight * 0.58;
  const widthUnits = Math.max(1, (maxCol - minCol) * 0.5 + 1.4);
  const heightUnits = Math.max(1, (maxRow - minRow) * 0.76 + 1.3);
  const tileWidth = Math.max(28, Math.min(52, availableWidth / (widthUnits + maxLayer * 0.18), (availableHeight / (heightUnits + maxLayer * 0.08)) * 0.76));
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

  const boardWidth = (maxCol - minCol) * halfStep + tileWidth + maxLayer * layerOffset + tileWidth * 0.08;
  const boardHeight = (maxRow - minRow) * rowStep + tileHeight + maxLayer * layerOffset + tileWidth * 0.08;

  return {
    tileWidth,
    tileHeight,
    boardWidth,
    boardHeight,
    positions,
  };
}

export function TileBoard({
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
  const orderedTiles = useMemo(
    () =>
      [...tiles].sort((left, right) => {
        if (left.layer !== right.layer) {
          return left.layer - right.layer;
        }
        if (left.row !== right.row) {
          return left.row - right.row;
        }
        return left.col - right.col;
      }),
    [tiles],
  );

  const metrics = useMemo(() => buildBoardMetrics(orderedTiles, width, height), [height, orderedTiles, width]);
  const boardStyles = useMemo(() => createBoardStyles(metrics.boardWidth, metrics.boardHeight), [metrics.boardHeight, metrics.boardWidth]);
  const positionStyles = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(metrics.positions).map(([tileId, position]) => [
          tileId,
          StyleSheet.create({
            position: {
              position: 'absolute',
              left: position.left,
              top: position.top,
            },
          }).position,
        ]),
      ) as Record<string, ReturnType<typeof StyleSheet.create>['position']>,
    [metrics.positions],
  );

  if (orderedTiles.length === 0) {
    return <View style={emptyStyles.board} />;
  }

  return (
    <View style={boardStyles.board}>
      {orderedTiles.map((tile, index) => (
        <View
          key={tile.id}
          style={positionStyles[tile.id]}
          // Matched tiles fade to opacity-0 via animation but on React-Native-Web
          // `disabled` alone does NOT remove pointer events from a Pressable.
          // Without this, invisible matched tiles intercept taps on the free
          // tiles that were unblocked by the match.
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
            hintActive={hintPairIds?.includes(tile.id) ?? false}
            errorActive={mismatchTileIds.includes(tile.id)}
            blockedTapNonce={blockedTileId === tile.id ? blockedTapNonce : 0}
            isBlockedTile={blockedTileId === tile.id}
            isHighlighted={highlightedTileIds.includes(tile.id)}
          />
        </View>
      ))}
    </View>
  );

}

const emptyStyles = StyleSheet.create({
  board: {
    width: 52,
    height: 68,
    alignSelf: 'center',
  },
});

function createBoardStyles(boardWidth: number, boardHeight: number) {
  return StyleSheet.create({
    board: {
      width: boardWidth,
      height: boardHeight,
      alignSelf: 'center',
    },
  });
}
