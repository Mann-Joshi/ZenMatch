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
const PARTICLE_INDICES = Array.from({ length: PARTICLE_COUNT }, (_, index) => index);

interface MahjongTileProps {
  id: string;
  symbolKey: string;
  x: number;
  y: number;
  z: number;
  tile: Tile;
  worldTheme: WorldTheme;
  isSelected: boolean;
  isBlocked: boolean;
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
const MatchParticle = memo(function MatchParticle({
  active,
  color,
  index,
}: {
  active: boolean;
  color: string;
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

  const tileWidth = 64;
  const tileHeight = 80;
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
    () => createParticleStyles(color),
    [color],
  );
  return <Animated.View style={[styles.particle, animatedStyle]} />;
});

// ── MahjongTile: wrapped in memo with custom comparison ─────────────────────
// Only re-renders when the specific tile properties that affect display change.
export const MahjongTile = memo(
  function MahjongTile({
    tile,
    id,
    symbolKey,
    x,
    y,
    z,
    worldTheme,
    isSelected,
    isBlocked,
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
    const face = getTileFace(symbolKey);
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
      opacity.value = withTiming(isBlocked ? 0.56 : 1, { duration: 180 });
      scale.value = withSpring(isSelected ? 1.08 : 1, { damping: 12, stiffness: 180 });
    }, [isBlocked, isSelected, matchedProgress, opacity, scale, tile.isMatched]);

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
        shadowOpacity: interpolate(activeGlow, [0, 1], [0.6, 1.0]),
      };
    });

    const errorOverlayStyle = useAnimatedStyle(() => ({
      opacity: errorFlash.value * 0.55,
    }));

    const styles = useMemo(
      () =>
        createStyles(worldTheme, isSelected, isHighlighted, face.accentColor),
      [face.accentColor, isHighlighted, isSelected, worldTheme],
    );

    // Stable onPress callback — avoids referential inequality on every render
    const handlePress = useCallback(() => {
      onTap(id);
    }, [id, onTap]);

    return (
      // react-native-gesture-handler TouchableOpacity runs on native thread
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={tile.isFree ? 0.75 : 1.0}
        disabled={tile.isMatched}
        style={styles.pressable}
      >
        <Animated.View style={[styles.tileShell, animatedStyle]}>
          <Image
            source={require('../../assets/images/64/tile.png')}
            style={styles.tileBgImage}
            fadeDuration={0}
          />
          <View style={styles.symbolLayer} pointerEvents="none">
            {TILE_IMAGES[symbolKey] != null ? (
              <Image
                source={TILE_IMAGES[symbolKey]}
                style={styles.symbolImage}
                resizeMode="contain"
                fadeDuration={0}
              />
            ) : (
            <View style={styles.textFallback}>
              <Text style={styles.symbol}>{face.centerSymbol}</Text>
              <Text style={styles.title}>{face.displayName}</Text>
              <Text style={styles.label}>{face.suitLabel}</Text>
            </View>
            )}
          </View>
          <Animated.View style={[styles.errorOverlay, errorOverlayStyle]} pointerEvents="none" />
          {!tile.isFree && !tile.isMatched ? (
            <View style={styles.blockedOverlay} pointerEvents="none" />
          ) : null}
          {/* Pre-rendered particles — 6 pieces, hidden when inactive */}
          {PARTICLE_INDICES.map((index) => (
            <MatchParticle
              key={`${tile.id}-p-${index}`}
              active={tile.isMatched}
              color={worldTheme.particleColors[index % worldTheme.particleColors.length]}
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
      prev.id === next.id &&
      prev.symbolKey === next.symbolKey &&
      prev.x === next.x &&
      prev.y === next.y &&
      prev.z === next.z &&
      prev.worldTheme.id === next.worldTheme.id &&
      prev.isSelected === next.isSelected &&
      prev.isBlocked === next.isBlocked &&
      prev.isHighlighted === next.isHighlighted &&
      prev.hintActive === next.hintActive &&
      prev.errorActive === next.errorActive &&
      prev.isBlockedTile === next.isBlockedTile &&
      prev.blockedTapNonce === next.blockedTapNonce &&
      prev.appearDelayMs === next.appearDelayMs
    );
  },
);

// ── Styles ────────────────────────────────────────────────────────────────────
function createStyles(
  worldTheme: WorldTheme,
  isSelected: boolean,
  isHighlighted: boolean,
  symbolColor: string,
) {
  return StyleSheet.create({
    pressable: {
      width: 64,
      height: 80,
    },
    tileShell: {
      width: 64,
      height: 80,
      shadowColor: '#000000',
      shadowOpacity: 0.8,
      shadowRadius: 5,
      shadowOffset: { width: -3, height: 5 },
      elevation: 7,
      borderWidth: isSelected || isHighlighted ? 2 : 0,
      borderColor: isSelected
        ? worldTheme.accentColor
        : isHighlighted
          ? `${worldTheme.accentColor}99`
          : 'transparent',
      borderRadius: 14, // Assuming the tile bg still warrants some rounded corners for the overlay
    },
    tileBgImage: {
      position: 'absolute',
      width: 64,
      height: 80,
      resizeMode: 'contain',
    },
    symbolLayer: {
      position: 'absolute',
      width: '100%',
      height: '100%',
    },
    symbolImage: {
      position: 'absolute',
      width: '60%',
      height: '60%',
      top: '20%',
      left: '20%',
      resizeMode: 'contain',
    },
    textFallback: {
      position: 'absolute',
      width: '60%',
      height: '60%',
      top: '20%',
      left: '20%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    blockedOverlay: {
      position: 'absolute',
      left: 0,
      top: 0,
      width: 64,
      height: 80,
      borderRadius: 14,
      backgroundColor: 'rgba(0,0,0,0.22)',
    },
    symbol: {
      color: symbolColor,
      fontSize: 26,
      fontWeight: '700',
      fontFamily: 'serif',
    },
    title: {
      color: '#47506A',
      fontSize: 8,
      textAlign: 'center',
      fontWeight: '600',
    },
    label: {
      alignSelf: 'flex-end',
      color: '#6B665E',
      fontSize: 8,
      fontWeight: '800',
      letterSpacing: 0.6,
    },
    errorOverlay: {
      position: 'absolute',
      left: 0,
      top: 0,
      width: 64,
      height: 80,
      borderRadius: 14,
      backgroundColor: '#C62828',
    },
  });
}

function createParticleStyles(color: string) {
  return StyleSheet.create({
    particle: {
      position: 'absolute',
      left: 32,
      top: 40,
      width: 6,
      height: 6,
      borderRadius: 999,
      backgroundColor: color,
    },
  });
}
