import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { heatColor } from '@/lib/heatColor';

export interface VenueScreenCoord {
  id: string;
  x: number;
  y: number;
  heatScore: number;
}

interface Props {
  coords: VenueScreenCoord[];
}

function pulseDuration(heatScore: number): number {
  if (heatScore >= 80) return 1500;
  if (heatScore >= 60) return 2000;
  if (heatScore >= 40) return 2500;
  return 3000;
}

interface RippleDotProps {
  x: number;
  y: number;
  heatScore: number;
}

function RippleDot({ x, y, heatScore }: RippleDotProps) {
  const dotScale = useRef(new Animated.Value(1)).current;
  const ringScale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0.8)).current;
  const duration = pulseDuration(heatScore);
  const color = heatColor(heatScore);

  useEffect(() => {
    // Inner dot pulse loop
    const dotLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(dotScale, { toValue: 1.15, duration: duration / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(dotScale, { toValue: 1, duration: duration / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );

    // Outer ripple loop
    const rippleLoop = Animated.loop(
      Animated.parallel([
        Animated.timing(ringScale, { toValue: 2.2, duration, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 0, duration, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ])
    );

    dotLoop.start();
    // Stagger ring slightly behind dot
    const timeout = setTimeout(() => {
      ringScale.setValue(1);
      ringOpacity.setValue(0.8);
      rippleLoop.start();
    }, duration * 0.25);

    return () => {
      dotLoop.stop();
      rippleLoop.stop();
      clearTimeout(timeout);
    };
  }, [duration]);

  return (
    <View style={[styles.dotContainer, { left: x - 14, top: y - 14 }]}>
      {/* Outer ripple ring */}
      <Animated.View
        style={[
          styles.ring,
          {
            borderColor: color,
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          },
        ]}
      />
      {/* Inner dot */}
      <Animated.View
        style={[
          styles.dot,
          {
            backgroundColor: color,
            transform: [{ scale: dotScale }],
            shadowColor: color,
          },
        ]}
      />
    </View>
  );
}

export function VenueRippleOverlay({ coords }: Props) {
  if (coords.length === 0) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {coords.map(c => (
        <RippleDot key={c.id} x={c.x} y={c.y} heatScore={c.heatScore} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dotContainer: {
    position: 'absolute',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  ring: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
  },
});
