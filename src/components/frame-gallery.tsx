import { Image } from 'expo-image';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Section } from './card-sections';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { useFrameUrls } from '@/hooks/use-frame-urls';
import type { Frame } from '@/lib/types';

// Frames cut from the reel at the moments Gemini picked. Tap one to see it
// full screen.
export function FrameGallery({ frames, pending }: { frames: Frame[]; pending?: boolean }) {
  const urls = useFrameUrls(frames.map((f) => f.path));
  const [open, setOpen] = useState<Frame | null>(null);

  if (!frames.length) {
    return pending ? (
      <Section title="From the reel">
        <ThemedText type="small" themeColor="textSecondary">
          Cutting frames from the video… they&apos;ll show up here in a minute.
        </ThemedText>
      </Section>
    ) : null;
  }

  return (
    <Section title="From the reel">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {frames.map((frame) => (
          <Pressable key={frame.path} onPress={() => setOpen(frame)} accessibilityRole="imagebutton" accessibilityLabel={frame.caption}>
            <ThemedView type="backgroundElement" style={styles.tile}>
              <Image source={urls[frame.path]} style={styles.thumb} contentFit="cover" transition={150} />
              <View style={styles.caption}>
                <ThemedText type="code" themeColor="textSecondary">
                  {frame.timestamp}
                </ThemedText>
                <ThemedText type="small" numberOfLines={2}>
                  {frame.caption}
                </ThemedText>
              </View>
            </ThemedView>
          </Pressable>
        ))}
      </ScrollView>

      <Modal visible={!!open} transparent animationType="fade" onRequestClose={() => setOpen(null)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(null)} accessibilityLabel="Close">
          {open && (
            <>
              <Image source={urls[open.path]} style={styles.full} contentFit="contain" />
              <ThemedText style={styles.fullCaption}>
                {open.timestamp} · {open.caption}
              </ThemedText>
            </>
          )}
        </Pressable>
      </Modal>
    </Section>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: Spacing.two,
  },
  tile: {
    width: 160,
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  thumb: {
    width: 160,
    height: 284,
  },
  caption: {
    gap: Spacing.half,
    padding: Spacing.two,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
    gap: Spacing.three,
  },
  full: {
    width: '100%',
    flex: 1,
  },
  fullCaption: {
    color: '#fff',
    textAlign: 'center',
  },
});
