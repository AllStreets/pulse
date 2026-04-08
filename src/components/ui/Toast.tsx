import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';

interface Props {
  message: string;
  visible: boolean;
}

export function Toast({ message, visible }: Props) {
  const translateY = useSharedValue(-60);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSequence(
        withTiming(0, { duration: 250, easing: Easing.out(Easing.ease) }),
        withDelay(2000, withTiming(-60, { duration: 300 }))
      );
      opacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(2000, withTiming(0, { duration: 300 }))
      );
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.toast, animStyle]} pointerEvents="none">
      <Animated.Text style={styles.text}>{message}</Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 56,
    alignSelf: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    zIndex: 100,
  },
  text: { color: '#aaa', fontSize: 13, fontWeight: '500' },
});
