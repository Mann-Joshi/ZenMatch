import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse } from 'react-native-svg';

import { hasSeenIntro, incrementLaunchCount, markIntroSeen } from '@/utils/storage';

function LotusIcon() {
  return (
    <Svg width={120} height={120} viewBox="0 0 120 120">
      <Circle cx={60} cy={68} r={10} fill="#C9A84C" opacity={0.9} />
      <Ellipse cx={60} cy={44} rx={11} ry={24} fill="#C9A84C" />
      <Ellipse cx={37} cy={58} rx={10} ry={22} fill="#C9A84C" transform="rotate(-28 37 58)" />
      <Ellipse cx={83} cy={58} rx={10} ry={22} fill="#C9A84C" transform="rotate(28 83 58)" />
      <Ellipse cx={48} cy={80} rx={10} ry={16} fill="#C9A84C" transform="rotate(22 48 80)" opacity={0.7} />
      <Ellipse cx={72} cy={80} rx={10} ry={16} fill="#C9A84C" transform="rotate(-22 72 80)" opacity={0.7} />
    </Svg>
  );
}

export default function IntroScreen() {
  const [autoProceed, setAutoProceed] = useState(false);
  const [readyToTap, setReadyToTap] = useState(false);
  const containerOpacity = useSharedValue(0);
  const lotusScale = useSharedValue(0.9);
  const copyOpacity = useSharedValue(0);
  const tapOpacity = useSharedValue(0);

  useEffect(() => {
    containerOpacity.value = withTiming(1, { duration: 700 });
    lotusScale.value = withRepeat(
      withTiming(1.1, {
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
    copyOpacity.value = withDelay(1000, withTiming(1, { duration: 900 }));
    tapOpacity.value = withDelay(
      3500,
      withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true),
    );

    void (async () => {
      await incrementLaunchCount();
      const introSeen = await hasSeenIntro();
      setAutoProceed(introSeen);
      setReadyToTap(!introSeen);
    })();
  }, [containerOpacity, copyOpacity, lotusScale, tapOpacity]);

  useEffect(() => {
    if (!autoProceed) {
      return;
    }

    const timeout = setTimeout(() => {
      void handleBegin();
    }, 2000);

    return () => clearTimeout(timeout);
  }, [autoProceed]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const lotusStyle = useAnimatedStyle(() => ({
    transform: [{ scale: lotusScale.value }],
  }));

  const copyStyle = useAnimatedStyle(() => ({
    opacity: copyOpacity.value,
    transform: [{ translateY: interpolate(copyOpacity.value, [0, 1], [14, 0]) }],
  }));

  const tapStyle = useAnimatedStyle(() => ({
    opacity: autoProceed ? 0 : tapOpacity.value,
  }));

  const styles = useMemo(() => createStyles(), []);

  async function handleBegin(): Promise<void> {
    containerOpacity.value = withTiming(0, { duration: 320 });
    await markIntroSeen();
    setTimeout(() => {
      router.replace('/home');
    }, 320);
  }

  return (
    <Pressable style={styles.screen} onPress={() => (readyToTap ? void handleBegin() : undefined)}>
      <Animated.View style={[styles.content, containerStyle]}>
        <Animated.View style={lotusStyle}>
          <LotusIcon />
        </Animated.View>

        <Animated.View style={[styles.copyBlock, copyStyle]}>
          <Text style={styles.title}>ZenMatch</Text>
          <Text style={styles.factLine}>Studies show 20 minutes of Mahjong daily</Text>
          <Text style={styles.factLine}>reduces cortisol (stress hormone) by up to 43%</Text>
          <Text style={styles.citation}>- Journal of Behavioral Medicine, 2019</Text>
        </Animated.View>

        <Animated.Text style={[styles.tapCopy, tapStyle]}>
          {autoProceed ? 'Preparing your calm' : 'Tap to Begin'}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

function createStyles() {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: '#0A0F1E',
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    copyBlock: {
      marginTop: 28,
      alignItems: 'center',
      gap: 8,
    },
    title: {
      color: '#F0EDE6',
      fontSize: 40,
      fontWeight: '300',
      letterSpacing: 1.4,
      fontFamily: 'serif',
    },
    factLine: {
      color: 'rgba(240,237,230,0.82)',
      fontSize: 16,
      fontWeight: '400',
      textAlign: 'center',
      lineHeight: 24,
    },
    citation: {
      marginTop: 8,
      color: 'rgba(240,237,230,0.58)',
      fontSize: 12,
      fontStyle: 'italic',
      letterSpacing: 0.4,
    },
    tapCopy: {
      position: 'absolute',
      bottom: 92,
      color: '#F0EDE6',
      fontSize: 14,
      fontWeight: '600',
      letterSpacing: 1.6,
      textTransform: 'uppercase',
    },
  });
}
