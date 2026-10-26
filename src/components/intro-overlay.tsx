import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cubicBezier, useReducedMotion } from 'react-native-reanimated';

import { Logo } from './logo';

import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const WORD = 'Reeldex';
const LOGO = 88;
// The mark lands by ~0.9 s, the word by ~1.2 s; hold briefly, then fade into the app.
const EXIT_AT = 1700;
const EXIT_FOR = 450;

const EASE_OUT = cubicBezier(0.16, 1, 0.3, 1);
const EASE_IN_OUT = cubicBezier(0.65, 0, 0.35, 1);

// Once per launch: remounting the layout must not replay it.
let played = false;

const fill = { animationTimingFunction: EASE_OUT, animationFillMode: 'both' as const };

// Opening animation over the first screen: the mark assembles inside two
// expanding rings, the name rises in letter by letter over a drawn line, then
// everything fades into the app. Skipped when Reduce Motion is on.
export function IntroOverlay() {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(!played && !reduceMotion);

  useEffect(() => {
    // Native shows the system splash until the first frame; this takes over from it.
    SplashScreen.hideAsync().catch(() => {});
    played = true;
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), EXIT_AT + EXIT_FOR);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.overlay,
        { backgroundColor: theme.background },
        {
          animationName: { from: { opacity: 1 }, to: { opacity: 0 } },
          animationDuration: EXIT_FOR,
          animationDelay: EXIT_AT,
          animationTimingFunction: EASE_IN_OUT,
          animationFillMode: 'forwards',
        },
      ]}>
      <Animated.View
        style={[
          styles.content,
          {
            animationName: { from: { transform: [{ scale: 1 }] }, to: { transform: [{ scale: 1.08 }] } },
            animationDuration: EXIT_FOR,
            animationDelay: EXIT_AT,
            animationTimingFunction: EASE_IN_OUT,
            animationFillMode: 'forwards',
          },
        ]}>
        <View style={styles.mark}>
          {[0, 1].map((i) => (
            <Animated.View
              key={i}
              style={[
                styles.ring,
                { borderColor: theme.accent },
                {
                  animationName: {
                    from: { opacity: 0.55, transform: [{ scale: 0.7 }] },
                    to: { opacity: 0, transform: [{ scale: 2.1 }] },
                  },
                  animationDuration: 1400,
                  animationDelay: 250 + i * 350,
                  ...fill,
                },
              ]}
            />
          ))}
          <Animated.View
            style={[
              styles.glow,
              { backgroundColor: theme.accentSoft },
              {
                animationName: {
                  from: { opacity: 0, transform: [{ scale: 0.4 }] },
                  to: { opacity: 1, transform: [{ scale: 1 }] },
                },
                animationDuration: 900,
                ...fill,
              },
            ]}
          />
          <Logo size={LOGO} intro />
        </View>

        <View style={styles.wordmark} accessibilityRole="header" accessibilityLabel={WORD}>
          {WORD.split('').map((letter, i) => (
            <Animated.Text
              key={i}
              style={[
                styles.letter,
                { color: theme.text },
                {
                  animationName: {
                    from: { opacity: 0, transform: [{ translateY: 14 }] },
                    to: { opacity: 1, transform: [{ translateY: 0 }] },
                  },
                  animationDuration: 600,
                  animationDelay: 560 + i * 45,
                  ...fill,
                },
              ]}>
              {letter}
            </Animated.Text>
          ))}
        </View>

        <Animated.View
          style={[
            styles.line,
            { backgroundColor: theme.accent },
            {
              animationName: { from: { transform: [{ scaleX: 0 }] }, to: { transform: [{ scaleX: 1 }] } },
              animationDuration: 700,
              animationDelay: 900,
              ...fill,
            },
          ]}
        />

        <Animated.Text
          style={[
            styles.tagline,
            { color: theme.textSecondary },
            {
              animationName: { from: { opacity: 0, letterSpacing: 6 }, to: { opacity: 1, letterSpacing: 2.4 } },
              animationDuration: 800,
              animationDelay: 1050,
              ...fill,
            },
          ]}>
          REELS, TURNED INTO NOTES
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  );
}

const RING = LOGO * 1.25;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  mark: {
    width: RING,
    height: RING,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.four,
  },
  ring: {
    position: 'absolute',
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: 1.5,
  },
  glow: {
    position: 'absolute',
    width: RING,
    height: RING,
    borderRadius: RING / 2,
  },
  wordmark: {
    flexDirection: 'row',
  },
  letter: {
    fontFamily: Fonts.serif,
    fontSize: 44,
    lineHeight: 52,
    fontWeight: 600,
    letterSpacing: -0.6,
  },
  line: {
    width: 56,
    height: 2,
    borderRadius: 1,
    marginTop: Spacing.three,
  },
  tagline: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: 600,
    marginTop: Spacing.three,
  },
});
