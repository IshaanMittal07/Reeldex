import { StyleSheet, View } from 'react-native';

// Brand colours are fixed (not themed) so the mark looks the same everywhere,
// like an app icon.
const TILE = '#0E7C4A';
const TILE_EDGE = '#0A5C37';
const PAPER = '#FFFFFF';

/**
 * The Reeldex mark: an emerald tile holding two fanned note cards, the front
 * one carrying a play notch (a reel turned into notes). Built from Views so it
 * renders identically on web and native without an SVG library.
 */
export function Logo({ size = 32 }: { size?: number }) {
  const cardW = size * 0.44;
  const cardH = size * 0.56;
  const cardRadius = Math.max(2, size * 0.08);
  const play = size * 0.15;

  return (
    <View
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
      ]}>
      {/* Back card, tilted left and translucent. */}
      <View
        style={[
          styles.card,
          styles.back,
          {
            width: cardW,
            height: cardH,
            borderRadius: cardRadius,
            transform: [{ translateX: -size * 0.09 }, { translateY: -size * 0.02 }, { rotate: '-12deg' }],
          },
        ]}
      />
      {/* Front card with the play notch. */}
      <View
        style={[
          styles.card,
          {
            width: cardW,
            height: cardH,
            borderRadius: cardRadius,
            transform: [{ translateX: size * 0.07 }, { translateY: size * 0.03 }, { rotate: '6deg' }],
          },
        ]}>
        <View
          style={[
            styles.play,
            {
              borderLeftWidth: play,
              borderTopWidth: play * 0.62,
              borderBottomWidth: play * 0.62,
              marginLeft: play * 0.2,
            },
          ]}
        />
      </View>
    </View>
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
});
