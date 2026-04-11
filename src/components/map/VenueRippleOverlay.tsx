import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

export interface VenueScreenCoord {
  id: string;
  x: number;
  y: number;
  heatScore: number;
  category: string;
}

function categoryColor(category: string): string {
  const c = category.toLowerCase();
  if (c.includes('nightclub') || c.includes('club')) return '#9333ea';
  if (c.includes('cocktail')) return '#f59e0b';
  if (c.includes('dive')) return '#ef4444';
  if (c.includes('rooftop')) return '#14b8a6';
  if (c.includes('lgbtq') || c.includes('gay')) return '#ec4899';
  if (c.includes('craft beer') || c.includes('brewery')) return '#22c55e';
  if (c.includes('sports') || c.includes('bar & grill') || c.includes('bar and grill')) return '#f97316';
  if (c.includes('lounge')) return '#8b5cf6';
  return '#3b82f6'; // generic bar
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
  category: string;
}

function RippleDot({ x, y, heatScore, category }: RippleDotProps) {
  const dotScale = useRef(new Animated.Value(1)).current;
  const ringScale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0.8)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const duration = pulseDuration(heatScore);
  const color = categoryColor(category);

  useEffect(() => {
    // Reset to initial state when duration changes (heat tier crossed)
    dotScale.setValue(1);
    glowOpacity.setValue(0);

    // Inner dot pulse + glow expand in sync (both native driver)
    const dotLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(dotScale, { toValue: 1.15, duration: duration / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.4, duration: duration / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(dotScale, { toValue: 1, duration: duration / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0, duration: duration / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
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
      {/* Glow layer — expands with dot at 50% keyframe */}
      <Animated.View
        style={[
          styles.glow,
          {
            backgroundColor: color,
            opacity: glowOpacity,
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
        <RippleDot key={c.id} x={c.x} y={c.y} heatScore={c.heatScore} category={c.category} />
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
    overflow: 'visible',
  },
  glow: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
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
