import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

export function AnimatedStar({ active, delay, accentColor }: { active: boolean; delay: number; accentColor: string }) {
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
