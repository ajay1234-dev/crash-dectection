import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '@/constants/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CountdownRingProps {
  totalSeconds: number;
  remainingSeconds: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export default function CountdownRing({
  totalSeconds,
  remainingSeconds,
  size = 220,
  strokeWidth = 10,
  color = Colors.primary,
}: CountdownRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = useSharedValue(1);

  useEffect(() => {
    const targetProgress = remainingSeconds / totalSeconds;
    progress.value = withTiming(targetProgress, {
      duration: 950,
      easing: Easing.linear,
    });
  }, [remainingSeconds, totalSeconds]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - progress.value);
    return {
      strokeDashoffset,
    };
  });

  const isUrgent = remainingSeconds <= 10;
  const ringColor = isUrgent ? Colors.primary : color;
  const textColor = isUrgent ? Colors.primary : Colors.textPrimary;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated progress arc */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.centerContent}>
        <Text style={[styles.countdownNumber, { color: textColor }]}>
          {remainingSeconds}
        </Text>
        <Text style={styles.secondsLabel}>seconds</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownNumber: {
    fontSize: 64,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -2,
    lineHeight: 70,
  },
  secondsLabel: {
    fontSize: 14,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '600',
  },
});
