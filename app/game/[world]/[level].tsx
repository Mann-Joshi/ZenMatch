import { BlurView } from 'expo-blur';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AmbientBackground } from '@/components/AmbientBackground';
import { AnimatedCheckmark } from '@/components/AnimatedCheckmark';
import { HintButton } from '@/components/HintButton';
import { PillButton } from '@/components/PillButton';
import { TileBoard } from '@/components/TileBoard';
import { calculateFinalScore } from '@/game/mahjongLogic';
import { useGameStore } from '@/store/gameStore';
import { useProgressStore } from '@/store/progressStore';
import { useSettingsStore } from '@/store/settingsStore';
import { getAppPalette, getWorldTheme } from '@/theme/worlds';
import { playWorldMusic, stopWorldMusic } from '@/utils/audio';

function formatSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function formatScore(n: number): string {
  return n.toLocaleString();
}

// ── Confetti piece component ─────────────────────────────────────────────────
function ConfettiPiece({ color, startX, delay }: { color: string; startX: number; delay: number }) {
  const translateY = useSharedValue(-20);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(delay, withTiming(700, { duration: 1800, easing: Easing.out(Easing.quad) }));
    opacity.value = withDelay(delay, withSequence(withTiming(1, { duration: 100 }), withDelay(1200, withTiming(0, { duration: 500 }))));
    rotate.value = withDelay(delay, withTiming(360 * (Math.random() > 0.5 ? 1 : -1), { duration: 1800 }));
  }, [delay, opacity, rotate, translateY]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { rotate: `${rotate.value}deg` }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: startX,
          top: 0,
          width: 10,
          height: 10,
          borderRadius: Math.random() > 0.5 ? 5 : 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

// ── Combo toast component ─────────────────────────────────────────────────────
function ComboToast({
  visible,
  text,
  accentColor,
}: {
  visible: boolean;
  text: string;
  accentColor: string;
}) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      return;
    }
    translateY.value = 0;
    opacity.value = 1;
    translateY.value = withTiming(-70, { duration: 900, easing: Easing.out(Easing.quad) });
    opacity.value = withSequence(withTiming(1, { duration: 80 }), withDelay(600, withTiming(0, { duration: 320 })));
  }, [visible, text, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[comboToastStyles.wrap, style]} pointerEvents="none">
      <Text style={[comboToastStyles.text, { color: accentColor }]}>{text}</Text>
    </Animated.View>
  );
}

const comboToastStyles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignSelf: 'center',
    top: '45%',
    zIndex: 50,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  text: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

// ── Animated star ─────────────────────────────────────────────────────────────
function AnimatedStar({ active, delay, accentColor }: { active: boolean; delay: number; accentColor: string }) {
  const scale = useSharedValue(0);

  useEffect(() => {
    if (active) {
      scale.value = withDelay(delay, withSpring(1, { damping: 8, stiffness: 220 }));
    } else {
      scale.value = 0;
    }
  }, [active, delay, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.Text style={[{ fontSize: 28, fontWeight: '900' }, style, { color: active ? accentColor : 'rgba(255,255,255,0.18)' }]}>
      ★
    </Animated.Text>
  );
}

export default function GameScreen() {
  const params = useLocalSearchParams<{
    world?: string;
    level?: string;
    daily?: string;
    seed?: string;
    layoutId?: string;
  }>();
  const world = Number(params.world ?? '1');
  const level = Number(params.level ?? '1');
  const isDailyRoute = params.daily === '1';
  const routeSeed = typeof params.seed === 'string' ? params.seed : new Date().toISOString().slice(0, 10);
  const routeLayoutId = typeof params.layoutId === 'string' ? params.layoutId : 'turtle';

  const tiles = useGameStore((state) => state.tiles);
  const matchedPairs = useGameStore((state) => state.matchedPairs);
  const totalPairs = useGameStore((state) => state.totalPairs);
  const hearts = useGameStore((state) => state.hearts);
  const hintsRemaining = useGameStore((state) => state.hintsRemaining);
  const hintsUsed = useGameStore((state) => state.hintsUsed);
  const reshufflesRemaining = useGameStore((state) => state.reshufflesRemaining);
  const reshufflesUsed = useGameStore((state) => state.reshufflesUsed);
  const undoTokensRemaining = useGameStore((state) => state.undoTokensRemaining);
  const undosUsed = useGameStore((state) => state.undosUsed);
  const timeElapsed = useGameStore((state) => state.timeElapsed);
  const isTimerRunning = useGameStore((state) => state.isTimerRunning);
  const isLevelComplete = useGameStore((state) => state.isLevelComplete);
  const isBoardStuck = useGameStore((state) => state.isBoardStuck);
  const isGameOver = useGameStore((state) => state.isGameOver);
  const timerEnabled = useGameStore((state) => state.timerEnabled);
  const timeLimitSeconds = useGameStore((state) => state.timeLimitSeconds);
  const hintPairIds = useGameStore((state) => state.hintPairIds);
  const mismatchTileIds = useGameStore((state) => state.mismatchTileIds);
  const blockedTileId = useGameStore((state) => state.blockedTileId);
  const blockedTapNonce = useGameStore((state) => state.blockedTapNonce);
  const score = useGameStore((state) => state.score);
  const finalScore = useGameStore((state) => state.finalScore);
  const comboCount = useGameStore((state) => state.comboCount);
  const comboMultiplier = useGameStore((state) => state.comboMultiplier);
  const highlightedTileIds = useGameStore((state) => state.highlightedTileIds);
  const firecrackersRemaining = useGameStore((state) => state.firecrackersRemaining);

  const loadLevel = useGameStore((state) => state.loadLevel);
  const loadDailyChallenge = useGameStore((state) => state.loadDailyChallenge);
  const tapTile = useGameStore((state) => state.tapTile);
  const useHint = useGameStore((state) => state.useHint);
  const useShuffle = useGameStore((state) => state.useShuffle);
  const undoLastMove = useGameStore((state) => state.undoLastMove);
  const restartLevel = useGameStore((state) => state.restartLevel);
  const tickTimer = useGameStore((state) => state.tickTimer);
  const grantShuffleReward = useGameStore((state) => state.grantShuffleReward);
  const useFirecracker = useGameStore((state) => state.useFirecracker);

  const recordLevelResult = useProgressStore((state) => state.recordLevelResult);
  const completeDailyChallenge = useProgressStore((state) => state.completeDailyChallenge);
  const appearanceMode = useSettingsStore((state) => state.appearanceMode);
  const timerModeEnabled = useSettingsStore((state) => state.timerModeEnabled);

  const [paused, setPaused] = useState(false);
  const [reportedCompletion, setReportedCompletion] = useState(false);
  const [displayedScore, setDisplayedScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  // Combo toast state — keyed by comboCount so it re-triggers each match
  const [comboToastKey, setComboToastKey] = useState(0);
  const [comboToastText, setComboToastText] = useState('');
  const [comboToastVisible, setComboToastVisible] = useState(false);
  const prevComboRef = useRef(0);

  const worldTheme = getWorldTheme(world);
  const palette = getAppPalette(appearanceMode);
  const styles = useMemo(() => createStyles(worldTheme, palette), [palette, worldTheme]);

  // Edge glow for 3x+ combos
  const edgeGlow = useSharedValue(0);
  const edgeGlowStyle = useAnimatedStyle(() => ({
    opacity: edgeGlow.value,
  }));

  useEffect(() => {
    setPaused(false);
    setReportedCompletion(false);
    setDisplayedScore(0);
    setShowConfetti(false);
    prevComboRef.current = 0;

    if (isDailyRoute) {
      loadDailyChallenge(world, routeLayoutId, routeSeed);
      return;
    }

    loadLevel(world, level);
  }, [isDailyRoute, level, loadDailyChallenge, loadLevel, routeLayoutId, routeSeed, world]);

  useEffect(() => {
    if (paused || !isTimerRunning) {
      return;
    }

    const interval = setInterval(() => {
      tickTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, paused, tickTimer]);

  useEffect(() => {
    void playWorldMusic(worldTheme.music);

    return () => {
      void stopWorldMusic();
    };
  }, [worldTheme.music]);

  // Combo toast trigger
  useEffect(() => {
    if (comboCount >= 2 && comboCount > prevComboRef.current) {
      const multiplierLabel = comboMultiplier.toFixed(1).replace('.0', '');
      const points = Math.round(100 * comboMultiplier);
      setComboToastText(`+${points} 🔥${multiplierLabel}x`);
      setComboToastKey((k) => k + 1);
      setComboToastVisible(true);
      setTimeout(() => setComboToastVisible(false), 1100);

      if (comboCount >= 3) {
        edgeGlow.value = withSequence(
          withTiming(1, { duration: 120 }),
          withTiming(0, { duration: 500 }),
        );
      }
    }
    prevComboRef.current = comboCount;
  }, [comboCount, comboMultiplier, edgeGlow]);

  // Level complete
  useEffect(() => {
    if (!isLevelComplete || reportedCompletion) {
      return;
    }

    const stars = hintsUsed === 0 ? 3 : hintsUsed <= 2 ? 2 : 1;
    const timeRemaining = timeLimitSeconds ? Math.max(0, timeLimitSeconds - timeElapsed) : 0;
    const computedFinalScore = calculateFinalScore(score, timeRemaining, hintsUsed, reshufflesUsed, undosUsed, true);

    if (isDailyRoute) {
      completeDailyChallenge(new Date().toISOString());
    } else {
      recordLevelResult(world, level, stars, computedFinalScore);
    }

    setReportedCompletion(true);
    setShowConfetti(true);

    let current = 0;
    const step = Math.max(12, Math.floor(computedFinalScore / 40));
    const scoreInterval = setInterval(() => {
      current += step;
      if (current >= computedFinalScore) {
        setDisplayedScore(computedFinalScore);
        clearInterval(scoreInterval);
        return;
      }
      setDisplayedScore(current);
    }, 24);

    return () => clearInterval(scoreInterval);
  }, [
    completeDailyChallenge,
    hintsUsed,
    isDailyRoute,
    isLevelComplete,
    level,
    recordLevelResult,
    reportedCompletion,
    reshufflesUsed,
    score,
    timeElapsed,
    timeLimitSeconds,
    undosUsed,
    world,
  ]);

  const timerDisplay = timerEnabled && timeLimitSeconds ? Math.max(0, timeLimitSeconds - timeElapsed) : timeElapsed;
  const showTimer = timerEnabled && timerModeEnabled;
  const stars = hintsUsed === 0 ? 3 : hintsUsed <= 2 ? 2 : 1;

  // Confetti data — stable across renders
  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        key: i,
        color: worldTheme.particleColors[i % worldTheme.particleColors.length],
        startX: (i / 30) * 380 - 10,
        delay: Math.floor(i * 55),
      })),
    [worldTheme.particleColors],
  );

  function handleNextLevel(): void {
    if (isDailyRoute) {
      router.replace('/daily');
      return;
    }

    if (level >= 21) {
      router.replace('/world-map');
      return;
    }

    router.replace(`/game/${world}/${level + 1}`);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <AmbientBackground variant={worldTheme.ambientParticles} colors={[...worldTheme.particleColors]} />

      {/* Screen edge glow for 3x+ combos */}
      <Animated.View style={[styles.edgeGlow, edgeGlowStyle, { borderColor: worldTheme.accentColor }]} pointerEvents="none" />

      {/* Combo toast */}
      <ComboToast key={comboToastKey} visible={comboToastVisible} text={comboToastText} accentColor={worldTheme.accentColor} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable style={styles.topBarButton} onPress={() => router.back()}>
          <Text style={styles.topBarButtonText}>←</Text>
        </Pressable>

        <View style={styles.topBarCenter}>
          <Text style={styles.topBarTitle}>{isDailyRoute ? 'Daily Challenge' : `${worldTheme.name} / Level ${level}`}</Text>
          <Text style={styles.topBarMeta}>{matchedPairs} / {totalPairs}</Text>
          {/* Live score in top bar */}
          <Text style={[styles.scoreChip, { color: worldTheme.accentColor }]}>
            {formatScore(score)}
          </Text>
        </View>

        <View style={styles.topBarButton}>
          <Text style={styles.topBarTimer}>{showTimer ? formatSeconds(timerDisplay) : '--:--'}</Text>
        </View>
      </View>

      <View style={styles.boardShell}>
        <TileBoard
          tiles={tiles}
          worldTheme={worldTheme}
          onTap={tapTile}
          hintPairIds={hintPairIds}
          mismatchTileIds={mismatchTileIds}
          blockedTileId={blockedTileId}
          blockedTapNonce={blockedTapNonce}
          highlightedTileIds={highlightedTileIds}
        />
      </View>

      {/* Bottom HUD */}
      <View style={styles.bottomHud}>
        <View style={styles.hudCluster}>
          <HintButton
            label="Hint"
            count={hintsRemaining}
            onPress={useHint}
            accentColor={worldTheme.accentColor}
            textColor={palette.primaryText}
            disabled={hintsRemaining <= 0}
          />
          <HintButton
            label="Undo"
            count={undoTokensRemaining}
            onPress={undoLastMove}
            accentColor={worldTheme.accentColor}
            textColor={palette.primaryText}
            disabled={undoTokensRemaining <= 0}
          />
        </View>

        {/* Hearts / lives display */}
        <View style={styles.heartsRow}>
          {Array.from({ length: 3 }, (_, i) => (
            <Text key={`heart-${i}`} style={i < hearts ? styles.heartActive : styles.heartEmpty}>
              ❤
            </Text>
          ))}
        </View>

        <HintButton
          label="Shuffle"
          count={reshufflesRemaining}
          onPress={useShuffle}
          accentColor={worldTheme.accentColor}
          textColor={palette.primaryText}
          disabled={reshufflesRemaining <= 0}
        />

        {/* Firecracker power-up */}
        <Pressable
          style={[styles.firecrackerButton, firecrackersRemaining <= 0 && styles.firecrackerDisabled]}
          onPress={useFirecracker}
          disabled={firecrackersRemaining <= 0}
        >
          <Text style={styles.firecrackerEmoji}>🧨</Text>
          <Text style={[styles.firecrackerCount, { color: worldTheme.accentColor }]}>{firecrackersRemaining}</Text>
        </Pressable>

        <Pressable style={styles.pauseButton} onPress={() => setPaused(true)}>
          <Text style={styles.pauseText}>Pause</Text>
        </Pressable>
      </View>

      {/* ── Pause overlay ─────────────────────────────────────────────────── */}
      {paused ? (
        <View style={styles.overlayWrap}>
          <BlurView intensity={35} tint={appearanceMode === 'dark' ? 'dark' : 'light'} style={styles.overlayCard}>
            <Text style={styles.overlayTitle}>Paused</Text>
            <Text style={styles.overlayCopy}>Take a breath. The board will be right where you left it.</Text>
            <PillButton
              label="Resume"
              onPress={() => setPaused(false)}
              backgroundColor={palette.buttonBackground}
              textColor={palette.buttonText}
              shadowColor={palette.shadowColor}
            />
            <PillButton
              label="Restart Level"
              onPress={restartLevel}
              backgroundColor={palette.buttonBackground}
              textColor={palette.buttonText}
              shadowColor={palette.shadowColor}
            />
          </BlurView>
        </View>
      ) : null}

      {/* ── Board stuck overlay ───────────────────────────────────────────── */}
      {isBoardStuck && !isLevelComplete ? (
        <View style={styles.overlayWrap}>
          <BlurView intensity={35} tint={appearanceMode === 'dark' ? 'dark' : 'light'} style={styles.overlayCard}>
            <Text style={styles.overlayTitle}>No more moves!</Text>
            <Text style={styles.overlayCopy}>Shuffle the board, restart, or watch a rewarded ad for another shuffle.</Text>
            <PillButton
              label="Shuffle Board"
              subtitle={`${reshufflesRemaining} token${reshufflesRemaining === 1 ? '' : 's'} left`}
              onPress={useShuffle}
              backgroundColor={palette.buttonBackground}
              textColor={palette.buttonText}
              shadowColor={palette.shadowColor}
              disabled={reshufflesRemaining <= 0}
            />
            <PillButton
              label="Watch Ad for 1 Shuffle"
              onPress={grantShuffleReward}
              backgroundColor={palette.buttonBackground}
              textColor={palette.buttonText}
              shadowColor={palette.shadowColor}
            />
            <PillButton
              label="Restart Level"
              onPress={restartLevel}
              backgroundColor={palette.buttonBackground}
              textColor={palette.buttonText}
              shadowColor={palette.shadowColor}
            />
          </BlurView>
        </View>
      ) : null}

      {/* ── Game Over overlay ─────────────────────────────────────────────── */}
      {isGameOver ? (
        <View style={styles.overlayWrap}>
          <BlurView intensity={42} tint={appearanceMode === 'dark' ? 'dark' : 'light'} style={styles.overlayCard}>
            <Text style={styles.overlayTitle}>💔 Game Over</Text>
            <Text style={styles.overlayCopy}>
              You ran out of chances. Try again — you almost had it!
            </Text>
            <PillButton
              label="Restart Level"
              onPress={restartLevel}
              backgroundColor={palette.buttonBackground}
              textColor={palette.buttonText}
              shadowColor={palette.shadowColor}
            />
            <PillButton
              label="Back to Menu"
              onPress={() => router.replace('/home')}
              backgroundColor={palette.buttonBackground}
              textColor={palette.buttonText}
              shadowColor={palette.shadowColor}
            />
          </BlurView>
        </View>
      ) : null}

      {/* ── Level Complete overlay ────────────────────────────────────────── */}
      {isLevelComplete ? (
        <View style={styles.overlayWrap}>
          {/* Confetti layer */}
          {showConfetti ? (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              {confettiPieces.map((p) => (
                <ConfettiPiece key={p.key} color={p.color} startX={p.startX} delay={p.delay} />
              ))}
            </View>
          ) : null}

          <BlurView intensity={42} tint={appearanceMode === 'dark' ? 'dark' : 'light'} style={styles.completeCard}>
            <AnimatedCheckmark color={worldTheme.accentColor} />
            <Text style={styles.completeTitle}>Level Complete!</Text>

            {/* Animated stars */}
            <View style={styles.starRow}>
              {Array.from({ length: 3 }, (_, index) => (
                <AnimatedStar
                  key={`star-${index}`}
                  active={index < stars}
                  delay={index * 320}
                  accentColor={worldTheme.accentColor}
                />
              ))}
            </View>

            <Text style={styles.scoreLabel}>Score</Text>
            <Text style={styles.scoreValue}>{formatScore(displayedScore)}</Text>

            <PillButton
              label="Next Level"
              onPress={handleNextLevel}
              backgroundColor={palette.buttonBackground}
              textColor={palette.buttonText}
              shadowColor={palette.shadowColor}
            />
            <PillButton
              label="Replay"
              onPress={restartLevel}
              backgroundColor={palette.buttonBackground}
              textColor={palette.buttonText}
              shadowColor={palette.shadowColor}
            />
          </BlurView>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function createStyles(worldTheme: ReturnType<typeof getWorldTheme>, palette: ReturnType<typeof getAppPalette>) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: worldTheme.background,
      paddingHorizontal: 14,
    },
    edgeGlow: {
      ...StyleSheet.absoluteFillObject,
      borderWidth: 6,
      borderRadius: 20,
      zIndex: 100,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 6,
      marginBottom: 10,
      gap: 12,
    },
    topBarButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.14)',
    },
    topBarButtonText: {
      color: palette.primaryText,
      fontSize: 20,
      fontWeight: '700',
    },
    topBarCenter: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
    },
    topBarTitle: {
      color: palette.primaryText,
      fontSize: 13,
      fontWeight: '700',
      textAlign: 'center',
    },
    topBarMeta: {
      color: palette.primaryText,
      fontSize: 17,
      fontWeight: '800',
      fontFamily: 'serif',
    },
    scoreChip: {
      fontSize: 13,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    topBarTimer: {
      color: palette.primaryText,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.7,
    },
    boardShell: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
    },
    bottomHud: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      paddingBottom: 14,
    },
    hudCluster: {
      flexDirection: 'row',
      gap: 8,
    },
    heartsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    heartActive: {
      color: '#E91E63',
      fontSize: 20,
    },
    heartEmpty: {
      color: 'rgba(200,180,180,0.35)',
      fontSize: 20,
    },
    firecrackerButton: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 10,
      paddingVertical: 10,
      borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1,
      borderColor: worldTheme.accentColor,
      gap: 2,
    },
    firecrackerDisabled: {
      opacity: 0.4,
    },
    firecrackerEmoji: {
      fontSize: 20,
    },
    firecrackerCount: {
      fontSize: 10,
      fontWeight: '900',
    },
    pauseButton: {
      minWidth: 72,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRadius: 999,
      backgroundColor: 'rgba(255,255,255,0.14)',
      borderWidth: 1,
      borderColor: worldTheme.accentColor,
    },
    pauseText: {
      color: palette.primaryText,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    overlayWrap: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 18,
    },
    overlayCard: {
      width: '100%',
      borderRadius: 30,
      overflow: 'hidden',
      paddingHorizontal: 22,
      paddingVertical: 24,
      gap: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
    },
    completeCard: {
      width: '100%',
      borderRadius: 30,
      overflow: 'hidden',
      paddingHorizontal: 22,
      paddingVertical: 28,
      gap: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
    },
    overlayTitle: {
      color: palette.primaryText,
      fontSize: 28,
      fontWeight: '700',
      fontFamily: 'serif',
      textAlign: 'center',
    },
    overlayCopy: {
      color: palette.secondaryText,
      fontSize: 14,
      lineHeight: 22,
      textAlign: 'center',
      marginBottom: 4,
    },
    completeTitle: {
      color: palette.primaryText,
      fontSize: 30,
      fontWeight: '700',
      fontFamily: 'serif',
      textAlign: 'center',
    },
    starRow: {
      flexDirection: 'row',
      gap: 10,
    },
    scoreLabel: {
      color: palette.secondaryText,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 1.1,
      textTransform: 'uppercase',
    },
    scoreValue: {
      color: palette.primaryText,
      fontSize: 38,
      fontWeight: '800',
      fontFamily: 'serif',
    },
  });
}
