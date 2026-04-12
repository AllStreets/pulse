import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

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
  return '#3b82f6';
}

// Returns an Ionicons name, or null for generic bars (rendered as a custom barstool)
function categoryIcon(category: string): React.ComponentProps<typeof Ionicons>['name'] | null {
  const c = category.toLowerCase();
  if (c.includes('nightclub') || c.includes('club')) return 'musical-notes';
  if (c.includes('cocktail')) return 'wine';
  if (c.includes('dive')) return null;
  if (c.includes('rooftop')) return 'sunny';
  if (c.includes('lgbtq') || c.includes('gay')) return 'heart';
  if (c.includes('craft beer') || c.includes('brewery')) return 'beer';
  if (c.includes('sports') || c.includes('bar & grill') || c.includes('bar and grill')) return 'trophy';
  if (c.includes('lounge')) return 'moon';
  return null; // generic bar → BarstoolIcon
}

interface Props {
  coords: VenueScreenCoord[];
  activeVenueIds: string[];
}

function pulseDuration(heatScore: number): number {
  if (heatScore >= 80) return 1500;
  if (heatScore >= 60) return 2000;
  if (heatScore >= 40) return 2500;
  return 3000;
}

// Dot is 34px diameter (~75% of the 46px stadium badge size)
const DOT_RADIUS = 17;
const CONTAINER_SIZE = 62;
const RING_SIZE = 52;
const GLOW_SIZE = 46;

interface RippleDotProps {
  x: number;
  y: number;
  heatScore: number;
  category: string;
  active: boolean;
}

function RippleDot({ x, y, heatScore, category, active }: RippleDotProps) {
  const dotScale = useRef(new Animated.Value(1)).current;
  const ringScale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0.8)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const duration = pulseDuration(heatScore);
  const color = categoryColor(category);
  const icon = categoryIcon(category);

  useEffect(() => {
    dotScale.setValue(1);
    glowOpacity.setValue(0);
    ringScale.setValue(1);
    ringOpacity.setValue(0.8);

    if (!active) return;

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

    const rippleLoop = Animated.loop(
      Animated.parallel([
        Animated.timing(ringScale, { toValue: 2.2, duration, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 0, duration, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ])
    );

    dotLoop.start();
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
  }, [duration, active]);

  return (
    <View style={[styles.dotContainer, { left: x - CONTAINER_SIZE / 2, top: y - CONTAINER_SIZE / 2 }]}>
      {/* Outer ripple ring — only rendered for active venues */}
      {active && (
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
      )}
      {/* Glow layer — only rendered for active venues */}
      {active && (
        <Animated.View
          style={[styles.glow, { backgroundColor: color, opacity: glowOpacity }]}
        />
      )}
      {/* Dot + icon */}
      <Animated.View
        style={[
          styles.dot,
          {
            backgroundColor: color,
            transform: [{ scale: dotScale }],
            shadowColor: color,
          },
        ]}
      >
        {icon !== null
          ? <Ionicons name={icon} size={18} color="#fff" />
          : <MaterialCommunityIcons name="stool" size={19} color="#fff" />
        }
      </Animated.View>
    </View>
  );
}

export function VenueRippleOverlay({ coords, activeVenueIds }: Props) {
  if (coords.length === 0) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {coords.map(c => (
        <RippleDot
          key={c.id}
          x={c.x}
          y={c.y}
          heatScore={c.heatScore}
          category={c.category}
          active={activeVenueIds.includes(c.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dotContainer: {
    position: 'absolute',
    width: CONTAINER_SIZE,
    height: CONTAINER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  glow: {
    position: 'absolute',
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: GLOW_SIZE / 2,
  },
  dot: {
    width: DOT_RADIUS * 2,
    height: DOT_RADIUS * 2,
    borderRadius: DOT_RADIUS,
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 9,
    elevation: 8,
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 1.5,
  },
});
