import { Image } from 'expo-image';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import type { Frame } from '@/lib/types';

type Props = {
  frames: Frame[];
  urls: Record<string, string>;
  index: number | null;
  onChange: (index: number | null) => void;
};

// Full-screen look at one frame. Tap the picture to close; the arrows step
// through the others.
export function FrameViewer({ frames, urls, index, onChange }: Props) {
  const frame = index === null ? null : frames[index];
  const close = () => onChange(null);
  const hasPrev = index !== null && index > 0;
  const hasNext = index !== null && index < frames.length - 1;

  return (
    <Modal visible={!!frame} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        {frame && index !== null && (
          <>
            <Pressable style={styles.imageWrap} onPress={close} accessibilityLabel="Close">
              <Image source={urls[frame.path]} style={styles.full} contentFit="contain" />
            </Pressable>
            <View style={styles.footer}>
              <View style={styles.meta}>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>{frame.timestamp}</Text>
                </View>
                {frames.length > 1 && (
                  <Text style={styles.counter}>
                    {index + 1} / {frames.length}
                  </Text>
                )}
              </View>
              {!!frame.caption && <Text style={styles.caption}>{frame.caption}</Text>}
              <View style={styles.nav}>
                <NavButton label="‹ Prev" disabled={!hasPrev} onPress={() => onChange(index - 1)} />
                <NavButton label="Close" onPress={close} />
                <NavButton label="Next ›" disabled={!hasNext} onPress={() => onChange(index + 1)} />
              </View>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

function NavButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      hitSlop={8}
      style={({ pressed }) => [styles.navButton, (disabled || pressed) && styles.dim]}>
      <Text style={styles.navText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8,12,9,0.94)',
    paddingTop: Spacing.five,
    paddingBottom: Spacing.four,
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  imageWrap: {
    flex: 1,
  },
  full: {
    width: '100%',
    height: '100%',
  },
  footer: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 560,
    gap: Spacing.two,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  pill: {
    borderRadius: Radius.pill,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  pillText: {
    color: '#fff',
    fontFamily: Fonts.mono,
    fontSize: 12,
    lineHeight: 17,
  },
  counter: {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: Fonts.sans,
    fontSize: 13,
  },
  caption: {
    color: '#fff',
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 22,
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
  },
  navButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  navText: {
    color: '#fff',
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: 500,
  },
  dim: {
    opacity: 0.35,
  },
});
