import { memo, useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export const ConfettiPiece = memo(function ConfettiPiece({
  color,
  startX,
  delay,
  borderRadius,
}: {
  color: string;
  startX: number;
  delay: number;
  borderRadius: number;
}) {
  const translateY = useSharedValue(-20);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    const direction = startX % 2 === 0 ? 1 : -1;
    translateY.value = withDelay(delay, withTiming(700, { duration: 1800, easing: Easing.out(Easing.quad) }));
    opacity.value = withDelay(delay, withSequence(withTiming(1, { duration: 100 }), withDelay(1200, withTiming(0, { duration: 500 }))));
    rotate.value = withDelay(delay, withTiming(360 * direction, { duration: 1800 }));
  }, [delay, opacity, rotate, startX, translateY]);

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
          borderRadius,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
});
