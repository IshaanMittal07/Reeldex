import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { CATEGORY_GLYPHS, CATEGORY_LABELS, type Card } from '@/lib/types';

function relativeDate(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days < 1) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

type Props = {
  card: Card;
  thumbUrl?: string;
  width: number;
  // Search results mix categories, so each tile says which one it's from.
  showCategory?: boolean;
};

// One reel: its cover frame (or the category glyph until frames arrive), then
// the title and when it was saved.
export function ReelTile({ card, thumbUrl, width, showCategory }: Props) {
  const theme = useTheme();

  // The width sits on a wrapper: Link's asChild drops a Pressable's style function on web.
  return (
    <View style={{ width }}>
      <Link href={{ pathname: '/card/[id]', params: { id: card.id } }} asChild>
        <Pressable accessibilityLabel={card.title} style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
          <View style={[styles.thumb, { backgroundColor: theme.accentSoft, borderColor: theme.border }]}>
            {thumbUrl ? (
              <Image source={thumbUrl} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
            ) : (
              <ThemedText style={styles.glyph}>{CATEGORY_GLYPHS[card.category]}</ThemedText>
            )}
            {card.pinned && (
              <View style={[styles.pin, { backgroundColor: theme.accent, borderColor: theme.surface }]} />
            )}
          </View>

          <View style={styles.text}>
            {showCategory && (
              <ThemedText type="eyebrow" themeColor="accent" numberOfLines={1}>
                {CATEGORY_LABELS[card.category]}
              </ThemedText>
            )}
            <ThemedText numberOfLines={2} style={styles.title}>
              {card.title}
            </ThemedText>
            <ThemedText type="small" themeColor="textTertiary" style={styles.meta} numberOfLines={1}>
              {[relativeDate(card.created_at), card.creator_handle].filter(Boolean).join(' · ')}
            </ThemedText>
          </View>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    gap: Spacing.two,
  },
  // 3:4 crops a 9:16 reel to its middle, where the subject usually is.
  thumb: {
    aspectRatio: 3 / 4,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontSize: 34,
    lineHeight: 42,
  },
  pin: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  text: {
    gap: Spacing.half,
  },
  title: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: 600,
  },
  meta: {
    fontSize: 12,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.75,
  },
});
