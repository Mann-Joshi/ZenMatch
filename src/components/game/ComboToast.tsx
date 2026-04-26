import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export function ComboToast({
  visible,
  text,
  accentColor,
  nonce,
}: {
  visible: boolean;
  text: string;
  accentColor: string;
  nonce: number;
}) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      return;
    }
    cancelAnimation(translateY);
    cancelAnimation(opacity);

    translateY.value = 0;
    opacity.value = 1;
    translateY.value = withTiming(-70, { duration: 900, easing: Easing.out(Easing.quad) });
    opacity.value = withSequence(withTiming(1, { duration: 80 }), withDelay(600, withTiming(0, { duration: 320 })));
  }, [visible, text, nonce, opacity, translateY]);

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
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  text: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
