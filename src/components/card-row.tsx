import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { CATEGORY_LABELS, type Card, type Category } from '@/lib/types';

// Shown on the cover until the reel's frames are captured.
const CATEGORY_GLYPHS: Record<Category, string> = {
  resume: '📄',
  applying: '📨',
  cold_dm: '💬',
  opportunity: '✨',
  student_benefit: '🎓',
  fitness: '🏋️',
  meal_plan: '🥗',
  grooming: '🪒',
  video_creation: '🎬',
  general: '📌',
};

function relativeDate(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days < 1) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function CardRow({ card, thumbUrl }: { card: Card; thumbUrl?: string }) {
  const theme = useTheme();
  const meta = [card.creator_handle, relativeDate(card.created_at)].filter(Boolean).join('  ·  ');

  return (
    <Link href={{ pathname: '/card/[id]', params: { id: card.id } }} asChild>
      <Pressable
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: theme.surface, borderColor: theme.border },
          pressed && { backgroundColor: theme.backgroundElement, transform: [{ scale: 0.99 }] },
        ]}>
        <View style={[styles.cover, { backgroundColor: theme.accentSoft }]}>
          {thumbUrl ? (
            <Image source={thumbUrl} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
          ) : (
            <ThemedText style={styles.glyph}>{CATEGORY_GLYPHS[card.category] ?? '📌'}</ThemedText>
          )}
          {/* Hairline inner edge so pale frames don't bleed into the card. */}
          <View style={[styles.coverEdge, { borderColor: theme.border }]} pointerEvents="none" />
        </View>

        <View style={styles.text}>
          <View style={styles.topLine}>
            <ThemedText type="eyebrow" themeColor="accent" numberOfLines={1} style={styles.category}>
              {CATEGORY_LABELS[card.category] ?? card.category}
            </ThemedText>
            {card.pinned && (
              <View style={[styles.pin, { backgroundColor: theme.accentSoft }]}>
                <ThemedText type="eyebrow" themeColor="accent" style={styles.pinText}>
                  Pinned
                </ThemedText>
              </View>
            )}
          </View>
          <ThemedText type="heading" numberOfLines={3} style={styles.title}>
            {card.title}
          </ThemedText>
          {card.summary && (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
              {card.summary}
            </ThemedText>
          )}
          <ThemedText type="small" themeColor="textTertiary" numberOfLines={1} style={styles.meta}>
            {meta}
          </ThemedText>
        </View>
      </Pressable>
    </Link>
  );
}

const COVER_WIDTH = 92;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.two + Spacing.one,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cover: {
    width: COVER_WIDTH,
    aspectRatio: 3 / 4,
    alignSelf: 'flex-start',
    borderRadius: Radius.medium,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverEdge: {
    ...StyleSheet.absoluteFill,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
  },
  glyph: {
    fontSize: 30,
    lineHeight: 36,
  },
  text: {
    flex: 1,
    gap: Spacing.one,
    paddingVertical: Spacing.half,
    paddingRight: Spacing.one,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  category: {
    flexShrink: 1,
  },
  pin: {
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.pill,
  },
  pinText: {
    fontSize: 10,
  },
  title: {
    fontSize: 18,
    lineHeight: 23,
  },
  meta: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: Spacing.half,
  },
});
