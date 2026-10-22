import { useEffect, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Job } from '@/lib/types';

// A soft breathing dot: calmer than a spinner for work that takes minutes.
function PulseDot({ color }: { color: string }) {
  const [pulse] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: Platform.OS !== 'web',
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.dotWrap}>
      <Animated.View
        style={[
          styles.halo,
          {
            backgroundColor: color,
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] }),
            transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] }) }],
          },
        ]}
      />
      <View style={[styles.dot, { backgroundColor: color }]} />
    </View>
  );
}

export function JobsBanner({ jobs }: { jobs: Job[] }) {
  const theme = useTheme();
  const running = jobs.filter((j) => j.status === 'queued' || j.status === 'processing');
  const failed = jobs.filter((j) => j.status === 'failed');
  if (!running.length && !failed.length) return null;

  return (
    <View style={styles.stack}>
      {running.length > 0 && (
        <View style={[styles.banner, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <PulseDot color={theme.accent} />
          <View style={styles.text}>
            <ThemedText type="smallBold">
              Processing {running.length} reel{running.length > 1 ? 's' : ''}…
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              New cards appear here when ready.
            </ThemedText>
          </View>
        </View>
      )}
      {failed.map((job) => (
        <View
          key={job.id}
          style={[styles.banner, { backgroundColor: theme.warningBackground, borderColor: theme.warningBackground }]}>
          <View style={[styles.dot, styles.failDot, { backgroundColor: theme.warning }]} />
          <View style={styles.text}>
            <ThemedText type="smallBold" themeColor="warning">
              A reel couldn’t be processed
            </ThemedText>
            <ThemedText type="small" themeColor="warning" numberOfLines={3}>
              {job.error ?? 'Unknown error'}
            </ThemedText>
          </View>
        </View>
      ))}
    </View>
  );
}

const DOT = 8;

const styles = StyleSheet.create({
  stack: {
    gap: Spacing.two,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three - Spacing.one,
    paddingVertical: Spacing.two + Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
  },
  text: {
    flex: 1,
  },
  // Centres the dot on the first line of text (lineHeight 20).
  dotWrap: {
    width: DOT,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
  },
  halo: {
    position: 'absolute',
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
  },
  failDot: {
    marginTop: (20 - DOT) / 2,
  },
});
