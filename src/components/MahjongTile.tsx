import { memo, useCallback, useEffect, useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { getTileFace } from '@/data/tilesets/standard';
import { TILE_IMAGES } from '@/data/tilesets/tileImages';
import type { Tile } from '@/game/mahjongLogic';
import type { WorldTheme } from '@/theme/worlds';

// ── Reduced to 6 particles (was 8) ── pre-allocate, never dynamic ────────────
const PARTICLE_COUNT = 6;

interface MahjongTileProps {
  tile: Tile;
  worldTheme: WorldTheme;
  isSelected: boolean;
  onTap: (id: string) => void;
  tileWidth: number;
  tileHeight: number;
  appearDelayMs: number;
  hintActive: boolean;
  errorActive: boolean;
  blockedTapNonce: number;
  isBlockedTile: boolean;
  isHighlighted: boolean;
}

// ── MatchParticle: pre-rendered, always mounted, animated on match ────────────
function MatchParticle({
  active,
  color,
  tileWidth,
  tileHeight,
  index,
}: {
  active: boolean;
  color: string;
  tileWidth: number;
  tileHeight: number;
  index: number;
}) {
  const travel = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      return;
    }
    travel.value = 0;
    opacity.value = 1;
    travel.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) });
    opacity.value = withTiming(0, { duration: 520 });
  }, [active, opacity, travel]);

  const angle = (Math.PI * 2 * index) / PARTICLE_COUNT;
  const radius = Math.max(tileWidth, tileHeight) * 0.52;

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: Math.cos(angle) * radius * travel.value },
      { translateY: Math.sin(angle) * radius * travel.value },
      { scale: 0.6 + travel.value * 0.6 },
    ],
  }));

  const styles = useMemo(
    () => createParticleStyles(color, tileWidth, tileHeight),
    [color, tileHeight, tileWidth],
  );
  return <Animated.View style={[styles.particle, animatedStyle]} />;
}

// ── MahjongTile: wrapped in memo with custom comparison ─────────────────────
// Only re-renders when the specific tile properties that affect display change.
export const MahjongTile = memo(
  function MahjongTile({
    tile,
    worldTheme,
    isSelected,
    onTap,
    tileWidth,
    tileHeight,
    appearDelayMs,
    hintActive,
    errorActive,
    blockedTapNonce,
    isBlockedTile,
    isHighlighted,
  }: MahjongTileProps) {
    const face = getTileFace(tile.tileType);
    const scale = useSharedValue(0.8);
    const opacity = useSharedValue(tile.isMatched ? 0 : 1);
    const shake = useSharedValue(0);
    const glow = useSharedValue(0);
    const hintGlow = useSharedValue(0);
    const errorFlash = useSharedValue(0);
    const matchedProgress = useSharedValue(tile.isMatched ? 1 : 0);
    const highlightGlow = useSharedValue(0);

    // ── Appear animation ──────────────────────────────────────────────────────
    useEffect(() => {
      scale.value = withDelay(
        appearDelayMs,
        withSpring(tile.isMatched ? 0 : 1, { damping: 12, stiffness: 180 }),
      );
    }, [appearDelayMs, scale, tile.isMatched]);

    // ── Match / deselect animation ────────────────────────────────────────────
    useEffect(() => {
      if (tile.isMatched) {
        scale.value = withSpring(0, { damping: 11, stiffness: 160 });
        opacity.value = withTiming(0, { duration: 280 });
        matchedProgress.value = withTiming(1, { duration: 520 });
        return;
      }
      matchedProgress.value = withTiming(0, { duration: 180 });
      opacity.value = withTiming(tile.isFree ? 1 : 0.65, { duration: 180 });
      scale.value = withSpring(isSelected ? 1.08 : 1, { damping: 12, stiffness: 180 });
    }, [isSelected, matchedProgress, opacity, scale, tile.isFree, tile.isMatched]);

    // ── Selection glow ────────────────────────────────────────────────────────
    useEffect(() => {
      glow.value = withTiming(isSelected ? 1 : 0, { duration: 220 });
    }, [glow, isSelected]);

    // ── Hint pulse ────────────────────────────────────────────────────────────
    useEffect(() => {
      if (!hintActive) {
        cancelAnimation(hintGlow);
        hintGlow.value = withTiming(0, { duration: 180 });
        return;
      }
      hintGlow.value = withRepeat(withTiming(1, { duration: 650 }), 4, true);
    }, [hintActive, hintGlow]);

    // ── Highlight glow ────────────────────────────────────────────────────────
    useEffect(() => {
      highlightGlow.value = withTiming(isHighlighted ? 1 : 0, { duration: 200 });
    }, [isHighlighted, highlightGlow]);

    // ── Error flash ───────────────────────────────────────────────────────────
    useEffect(() => {
      if (!errorActive) {
        errorFlash.value = withTiming(0, { duration: 140 });
        return;
      }
      errorFlash.value = withSequence(
        withTiming(1, { duration: 110 }),
        withTiming(0, { duration: 200 }),
      );
    }, [errorActive, errorFlash]);

    // ── Shake on blocked tap ──────────────────────────────────────────────────
    useEffect(() => {
      if (!isBlockedTile) {
        return;
      }
      shake.value = withSequence(
        withTiming(3, { duration: 55 }),
        withTiming(-3, { duration: 55 }),
        withTiming(2, { duration: 45 }),
        withTiming(-2, { duration: 45 }),
        withTiming(0, { duration: 45 }),
      );
    }, [blockedTapNonce, isBlockedTile, shake]);

    // ── Animated styles (all run on native thread via worklets) ───────────────
    const animatedStyle = useAnimatedStyle(() => {
      const activeGlow = Math.max(glow.value, hintGlow.value, highlightGlow.value);
      return {
        opacity: opacity.value,
        transform: [{ translateX: shake.value }, { scale: scale.value }],
        shadowOpacity: interpolate(activeGlow, [0, 1], [0.12, 0.42]),
      };
    });

    const errorOverlayStyle = useAnimatedStyle(() => ({
      opacity: errorFlash.value * 0.55,
    }));

    const styles = useMemo(
      () =>
        createStyles(worldTheme, tileWidth, tileHeight, isSelected, isHighlighted, face.accentColor),
      [face.accentColor, isHighlighted, isSelected, tileHeight, tileWidth, worldTheme],
    );

    // Stable onPress callback — avoids referential inequality on every render
    const handlePress = useCallback(() => {
      onTap(tile.id);
    }, [onTap, tile.id]);

    return (
      // react-native-gesture-handler TouchableOpacity runs on native thread
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={tile.isFree ? 0.75 : 1.0}
        disabled={tile.isMatched}
        style={styles.pressable}
      >
        <Animated.View style={[styles.tileShell, animatedStyle]}>
          <View style={styles.rightEdge} />
          <View style={styles.bottomEdge} />
          <View style={styles.face}>
            {TILE_IMAGES[tile.tileType] != null ? (
              <Image
                source={TILE_IMAGES[tile.tileType]}
                style={styles.tileImage}
                resizeMode="contain"
                fadeDuration={0}          // critical: prevents Android fade jank
              />
            ) : (
              <>
                <Text style={styles.symbol}>{face.centerSymbol}</Text>
                <Text style={styles.title}>{face.displayName}</Text>
                <Text style={styles.label}>{face.suitLabel}</Text>
              </>
            )}
          </View>
          <Animated.View style={[styles.errorOverlay, errorOverlayStyle]} />
          {!tile.isFree && !tile.isMatched ? (
            <View style={styles.blockedOverlay} />
          ) : null}
          {/* Pre-rendered particles — 6 pieces, hidden when inactive */}
          {Array.from({ length: PARTICLE_COUNT }, (_, index) => (
            <MatchParticle
              key={`${tile.id}-p-${index}`}
              active={tile.isMatched}
              color={worldTheme.particleColors[index % worldTheme.particleColors.length]}
              tileWidth={tileWidth}
              tileHeight={tileHeight}
              index={index}
            />
          ))}
        </Animated.View>
      </TouchableOpacity>
    );
  },
  // ── Custom memo comparison ─────────────────────────────────────────────────
  // Only re-render this tile if the properties that affect its visuals changed.
  (prev, next) => {
    return (
      prev.tile.isMatched === next.tile.isMatched &&
      prev.tile.isFree === next.tile.isFree &&
      prev.isSelected === next.isSelected &&
      prev.isHighlighted === next.isHighlighted &&
      prev.hintActive === next.hintActive &&
      prev.errorActive === next.errorActive &&
      prev.isBlockedTile === next.isBlockedTile &&
      prev.blockedTapNonce === next.blockedTapNonce &&
      prev.tileWidth === next.tileWidth &&
      prev.tileHeight === next.tileHeight
    );
  },
);

// ── Styles ────────────────────────────────────────────────────────────────────
function createStyles(
  worldTheme: WorldTheme,
  tileWidth: number,
  tileHeight: number,
  isSelected: boolean,
  isHighlighted: boolean,
  symbolColor: string,
) {
  const depth = Math.max(4, tileWidth * 0.08);

  return StyleSheet.create({
    pressable: {
      width: tileWidth + depth,
      height: tileHeight + depth,
    },
    tileShell: {
      width: tileWidth + depth,
      height: tileHeight + depth,
      shadowColor: worldTheme.accentColor,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
    rightEdge: {
      position: 'absolute',
      right: 0,
      top: depth,
      width: depth,
      height: tileHeight - depth,
      borderTopRightRadius: 11,
      borderBottomRightRadius: 11,
      backgroundColor: worldTheme.tileShadow,
    },
    bottomEdge: {
      position: 'absolute',
      left: depth,
      bottom: 0,
      width: tileWidth - depth,
      height: depth,
      borderBottomLeftRadius: 11,
      borderBottomRightRadius: 11,
      backgroundColor: worldTheme.tileShadow,
    },
    face: {
      position: 'absolute',
      left: 0,
      top: 0,
      width: tileWidth,
      height: tileHeight,
      borderRadius: 14,
      borderWidth: isSelected || isHighlighted ? 2 : 1,
      borderColor: isSelected
        ? worldTheme.accentColor
        : isHighlighted
          ? `${worldTheme.accentColor}99`
          : '#D4C5B0',
      backgroundColor: worldTheme.tileBackground,
      paddingHorizontal: 6,
      paddingTop: 8,
      paddingBottom: 6,
      alignItems: 'center',
      justifyContent: 'space-between',
      overflow: 'hidden',
    },
    tileImage: {
      width: tileWidth,
      height: tileHeight,
      borderRadius: 14,
    },
    blockedOverlay: {
      position: 'absolute',
      left: 0,
      top: 0,
      width: tileWidth,
      height: tileHeight,
      borderRadius: 14,
      backgroundColor: 'rgba(0,0,0,0.22)',
    },
    symbol: {
      color: symbolColor,
      fontSize: Math.max(20, tileWidth * 0.52),
      fontWeight: '700',
      lineHeight: Math.max(22, tileWidth * 0.56),
      fontFamily: 'serif',
    },
    title: {
      color: '#47506A',
      fontSize: Math.max(7, tileWidth * 0.12),
      textAlign: 'center',
      fontWeight: '600',
    },
    label: {
      alignSelf: 'flex-end',
      color: '#6B665E',
      fontSize: Math.max(8, tileWidth * 0.16),
      fontWeight: '800',
      letterSpacing: 0.6,
    },
    errorOverlay: {
      position: 'absolute',
      left: 0,
      top: 0,
      width: tileWidth,
      height: tileHeight,
      borderRadius: 14,
      backgroundColor: '#C62828',
    },
  });
}

function createParticleStyles(color: string, tileWidth: number, tileHeight: number) {
  return StyleSheet.create({
    particle: {
      position: 'absolute',
      left: tileWidth * 0.46,
      top: tileHeight * 0.46,
      width: Math.max(4, tileWidth * 0.08),
      height: Math.max(4, tileWidth * 0.08),
      borderRadius: 999,
      backgroundColor: color,
    },
  });
}
