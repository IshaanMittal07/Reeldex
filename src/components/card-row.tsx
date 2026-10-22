import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Card, Category } from '@/lib/types';

// Shown in place of the thumbnail until the reel's frames are captured.
export const CATEGORY_GLYPHS: Record<Category, string> = {
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
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

type Props = { card: Card; thumbUrl?: string; isFirst: boolean; isLast: boolean };

// One compact line in a category group: thumbnail, title, one-line summary.
// Rows in a group join into a single paper card split by hairlines.
export function CardRow({ card, thumbUrl, isFirst, isLast }: Props) {
  const theme = useTheme();

  return (
    <Link href={{ pathname: '/card/[id]', params: { id: card.id } }} asChild>
      <Pressable
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: pressed ? theme.backgroundElement : theme.surface, borderColor: theme.border },
          isFirst && styles.first,
          isLast && styles.last,
          !isFirst && { borderTopWidth: 0 },
        ]}>
        <View style={[styles.thumb, { backgroundColor: theme.accentSoft }]}>
          {thumbUrl ? (
            <Image source={thumbUrl} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
          ) : (
            <ThemedText style={styles.glyph}>{CATEGORY_GLYPHS[card.category] ?? '📌'}</ThemedText>
          )}
        </View>

        <View style={[styles.text, !isLast && { borderBottomColor: theme.border }, !isLast && styles.divider]}>
          <View style={styles.titleLine}>
            {card.pinned && <View style={[styles.pin, { backgroundColor: theme.accent }]} />}
            <ThemedText numberOfLines={1} style={styles.title}>
              {card.title}
            </ThemedText>
            <ThemedText type="small" themeColor="textTertiary" style={styles.date}>
              {relativeDate(card.created_at)}
            </ThemedText>
          </View>
          {card.summary && (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {card.summary}
            </ThemedText>
          )}
        </View>
      </Pressable>
    </Link>
  );
}

const THUMB = 44;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - Spacing.one,
    paddingLeft: Spacing.three - Spacing.one,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  first: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: Radius.large,
    borderTopRightRadius: Radius.large,
  },
  last: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomLeftRadius: Radius.large,
    borderBottomRightRadius: Radius.large,
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: Radius.small + 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontSize: 20,
    lineHeight: 26,
  },
  // The divider starts after the thumbnail, like iOS and Notion lists.
  text: {
    flex: 1,
    gap: Spacing.half,
    paddingVertical: Spacing.two + Spacing.one,
    paddingRight: Spacing.three - Spacing.one,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  pin: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  title: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: 600,
  },
  date: {
    fontSize: 12,
    lineHeight: 16,
  },
});
