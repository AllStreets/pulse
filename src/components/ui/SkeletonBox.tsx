import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface Props {
  width?: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}

export function SkeletonBox({ width = '100%', height, borderRadius = 10, style }: Props) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        styles.box,
        { width: width as any, height, borderRadius },
        animStyle,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: '#1e1e1e' },
});
