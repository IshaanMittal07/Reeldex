import type { ComponentProps } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import Animated, { cubicBezier, type CSSAnimationKeyframes } from 'react-native-reanimated';

// Brand colours are fixed (not themed) so the mark looks the same everywhere,
// like an app icon.
const TILE = '#0E7C4A';
const TILE_EDGE = '#0A5C37';
const PAPER = '#FFFFFF';

// Fast start, long soft landing.
const EASE_OUT = cubicBezier(0.16, 1, 0.3, 1);

/**
 * The Reeldex mark: an emerald tile holding two fanned note cards, the front
 * one carrying a play notch (a reel turned into notes). Built from Views so it
 * renders identically on web and native without an SVG library.
 *
 * `intro` plays the opening animation: the tile pops in, the cards fan out of
 * a stack, the play notch lands and a sheen sweeps across.
 */
export function Logo({ size = 32, intro = false }: { size?: number; intro?: boolean }) {
  const cardW = size * 0.44;
  const cardH = size * 0.56;
  const cardRadius = Math.max(2, size * 0.08);
  const play = size * 0.15;

  const backTransform = [{ translateX: -size * 0.09 }, { translateY: -size * 0.02 }, { rotate: '-12deg' }];
  const frontTransform = [{ translateX: size * 0.07 }, { translateY: size * 0.03 }, { rotate: '6deg' }];

  const animate = (name: CSSAnimationKeyframes<ViewStyle>, delay: number, duration = 700): ComponentProps<typeof Animated.View>['style'] =>
    intro
      ? {
          animationName: name,
          animationDuration: duration,
          animationDelay: delay,
          animationTimingFunction: EASE_OUT,
          animationFillMode: 'both',
        }
      : null;

  return (
    <Animated.View
      accessibilityRole="image"
      accessibilityLabel="Reeldex"
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: size * 0.3,
          borderWidth: Math.max(1, size * 0.02),
        },
        animate(
          {
            from: { opacity: 0, transform: [{ scale: 0.6 }] },
            '60%': { opacity: 1, transform: [{ scale: 1.04 }] },
            to: { opacity: 1, transform: [{ scale: 1 }] },
          },
          0,
          800,
        ),
      ]}>
      {/* Back card, tilted left and translucent. */}
      <Animated.View
        style={[
          styles.card,
          styles.back,
          { width: cardW, height: cardH, borderRadius: cardRadius, transform: backTransform },
          animate(
            {
              from: { opacity: 0, transform: [{ translateX: 0 }, { translateY: size * 0.03 }, { rotate: '6deg' }] },
              to: { opacity: 0.45, transform: backTransform },
            },
            420,
          ),
        ]}
      />
      {/* Front card with the play notch. */}
      <Animated.View
        style={[
          styles.card,
          { width: cardW, height: cardH, borderRadius: cardRadius, transform: frontTransform },
          animate(
            {
              from: {
                opacity: 0,
                transform: [{ translateX: size * 0.07 }, { translateY: size * 0.35 }, { rotate: '0deg' }],
              },
              to: { opacity: 1, transform: frontTransform },
            },
            260,
          ),
        ]}>
        <Animated.View
          style={[
            styles.play,
            {
              borderLeftWidth: play,
              borderTopWidth: play * 0.62,
              borderBottomWidth: play * 0.62,
              marginLeft: play * 0.2,
            },
            animate(
              {
                from: { opacity: 0, transform: [{ scale: 0 }] },
                to: { opacity: 1, transform: [{ scale: 1 }] },
              },
              640,
              500,
            ),
          ]}
        />
      </Animated.View>
      {/* A diagonal sheen that crosses the tile once. */}
      {intro && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.sheen,
            { width: size * 0.35, height: size * 2, top: -size * 0.5 },
            animate(
              {
                from: { transform: [{ translateX: -size * 1.2 }, { rotate: '20deg' }] },
                to: { transform: [{ translateX: size * 1.2 }, { rotate: '20deg' }] },
              },
              900,
              900,
            ),
          ]}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: TILE,
    borderColor: TILE_EDGE,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  card: {
    position: 'absolute',
    backgroundColor: PAPER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: {
    opacity: 0.45,
  },
  // A CSS-style border triangle pointing right.
  play: {
    width: 0,
    height: 0,
    borderLeftColor: TILE,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  sheen: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
});
