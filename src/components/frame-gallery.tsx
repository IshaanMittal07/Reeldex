import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CardSection, TimestampPill } from './card-sections';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Frame } from '@/lib/types';

type Props = {
  frames: Frame[];
  urls: Record<string, string>;
  pending?: boolean;
  onOpen: (index: number) => void;
};

const TILE_WIDTH = 132;

// Frames cut from the reel at the moments Gemini picked, as a filmstrip. Tap
// one to see it full screen.
export function FrameGallery({ frames, urls, pending, onOpen }: Props) {
  const theme = useTheme();

  if (!frames.length) {
    return pending ? (
      <CardSection title="From the reel">
        <View style={[styles.pending, { borderColor: theme.border }]}>
          <ThemedText type="small" themeColor="textSecondary">
            Cutting frames from the video… they&apos;ll show up here in a minute.
          </ThemedText>
        </View>
      </CardSection>
    ) : null;
  }

  return (
    <CardSection title="From the reel">
      {/* Bleeds into the page gutter so the strip scrolls edge to edge. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.strip}
        contentContainerStyle={styles.row}>
        {frames.map((frame, i) => (
          <Pressable
            key={frame.path}
            onPress={() => onOpen(i)}
            accessibilityRole="imagebutton"
            accessibilityLabel={frame.caption}
            style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
            <ThemedView type="backgroundElement" style={[styles.thumbFrame, { borderColor: theme.border }]}>
              <Image source={urls[frame.path]} style={styles.thumb} contentFit="cover" transition={150} />
              <View style={styles.stamp}>
                <TimestampPill value={frame.timestamp} />
              </View>
            </ThemedView>
            {!!frame.caption && (
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={3}>
                {frame.caption}
              </ThemedText>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </CardSection>
  );
}

const styles = StyleSheet.create({
  pending: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.medium,
    padding: Spacing.three,
  },
  strip: {
    marginHorizontal: -Spacing.three,
  },
  row: {
    gap: Spacing.three - Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  tile: {
    width: TILE_WIDTH,
    gap: Spacing.two,
  },
  thumbFrame: {
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  // Reels are 9:16.
  thumb: {
    width: TILE_WIDTH,
    aspectRatio: 9 / 16,
  },
  stamp: {
    position: 'absolute',
    left: Spacing.two,
    bottom: Spacing.two,
  },
  pressed: {
    opacity: 0.75,
  },
});
