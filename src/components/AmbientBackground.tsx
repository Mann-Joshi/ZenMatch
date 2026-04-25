import { useEffect, useMemo, useState } from 'react';
import { AppState, Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type AmbientVariant = 'home' | 'petals' | 'leaves' | 'fireflies' | 'bubbles' | 'sparks';

interface AmbientBackgroundProps {
  variant: AmbientVariant;
  colors: string[];
}

interface ParticleSeed {
  id: string;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  tilt: number;
  color: string;
}

function getParticleCount(variant: AmbientVariant): number {
  switch (variant) {
    case 'petals':
      return 6;  // was 12
    case 'leaves':
      return 5;  // was 8
    case 'fireflies':
      return 6;  // was 15
    case 'bubbles':
      return 5;  // was 10
    case 'sparks':
      return 6;  // was 20
    default:
      return 5;  // was 10
  }
}

function buildParticles(variant: AmbientVariant, colors: string[]): ParticleSeed[] {
  const { width, height } = Dimensions.get('window');
  const count = getParticleCount(variant);

  return Array.from({ length: count }, (_, index) => ({
    id: `${variant}-${index}`,
    x: (width / count) * index + (index % 3) * 11,
    y: (height / count) * ((index * 5) % count),
    size:
      variant === 'leaves'
        ? 12
        : variant === 'sparks'
          ? 4
          : variant === 'petals'
            ? 14
            : variant === 'home'
              ? 10
              : 8 + (index % 4) * 2,
    duration: 7000 + index * 330,
    delay: index * 180,
    tilt: ((index % 5) - 2) * 8,
    color: colors[index % colors.length] ?? colors[0] ?? '#FFFFFF',
  }));
}

function AmbientParticle({ particle, variant, paused }: { particle: ParticleSeed; variant: AmbientVariant; paused: boolean }) {
  const progress = useSharedValue(0);
  const fade = useSharedValue(0);

  useEffect(() => {
    if (paused) {
      cancelAnimation(progress);
      cancelAnimation(fade);
      return;
    }

    progress.value = 0;
    fade.value = 0;
    progress.value = withRepeat(
      withTiming(1, {
        duration: particle.duration,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
    fade.value = withRepeat(
      withTiming(1, {
        duration: Math.max(2200, particle.duration / 2),
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [fade, particle.duration, paused, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const baseTranslateY = interpolate(progress.value, [0, 1], [0, variant === 'petals' ? 220 : -280]);
    const baseTranslateX = interpolate(progress.value, [0, 0.5, 1], [0, particle.tilt, particle.tilt * 1.5]);
    const opacity =
      variant === 'fireflies'
        ? interpolate(fade.value, [0, 1], [0.28, 0.84])
        : interpolate(fade.value, [0, 1], [0.12, 0.34]);

    return {
      opacity,
      transform: [
        { translateX: baseTranslateX },
        { translateY: baseTranslateY },
        { rotate: `${particle.tilt * progress.value}deg` },
        { scale: variant === 'bubbles' ? 0.85 + progress.value * 0.4 : 1 },
      ],
    };
  });

  const styles = useMemo(() => createParticleStyles(particle, variant), [particle, variant]);
  return <Animated.View style={[styles.particle, animatedStyle]} />;
}

export function AmbientBackground({ variant, colors }: AmbientBackgroundProps) {
  const [paused, setPaused] = useState(false);
  const particles = useMemo(() => buildParticles(variant, colors), [colors, variant]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      setPaused(state !== 'active');
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <View pointerEvents="none" style={styles.container}>
      {particles.map((particle) => (
        <AmbientParticle key={particle.id} particle={particle} variant={variant} paused={paused} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
});

function createParticleStyles(particle: ParticleSeed, variant: AmbientVariant) {
  const borderRadius = variant === 'leaves' ? 6 : 999;
  const width = variant === 'leaves' ? particle.size * 0.46 : particle.size;
  const height = variant === 'home' ? particle.size : variant === 'leaves' ? particle.size * 1.8 : particle.size;

  return StyleSheet.create({
    particle: {
      position: 'absolute',
      left: particle.x,
      top: particle.y,
      width,
      height,
      borderRadius,
      backgroundColor: particle.color,
    },
  });
}
