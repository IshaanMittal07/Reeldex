import { Image } from 'expo-image';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { TimestampPill } from './card-sections';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Card } from '@/lib/types';
import { CATEGORY_LABELS } from '@/lib/types';

type Props = {
  card: Card;
  coverUrl?: string;
  framesPending: boolean;
  onOpenCover: () => void;
};

// Stepped bands standing in for a gradient (no gradient module in the app):
// a soft darkening at the foot of the cover.
const FADE = [0.02, 0.04, 0.07, 0.1, 0.14, 0.18];

// Top of the card page: the first frame as a cover (or a pale green band until
// frames arrive), then category, title, summary and a quiet meta line.
export function CardHero({ card, coverUrl, framesPending, onOpenCover }: Props) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  // 4:5 on a phone, capped so a wide window doesn't get a wall of image.
  const coverHeight = Math.min(((Math.min(width, MaxContentWidth) - Spacing.three * 2) * 5) / 4, 440);
  const category = CATEGORY_LABELS[card.category] ?? card.category;
  const cover = card.frames[0];
  const saved = new Date(card.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <View style={styles.hero}>
      {cover ? (
        <Pressable
          onPress={onOpenCover}
          accessibilityRole="imagebutton"
          accessibilityLabel={cover.caption || 'Open frame'}
          style={({ pressed }) => pressed && styles.pressed}>
          <ThemedView type="backgroundElement" style={[styles.cover, { height: coverHeight, borderColor: theme.border }]}>
            <Image source={coverUrl} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
            <View style={styles.fade}>
              {FADE.map((o) => (
                <View key={o} style={[styles.fadeBand, { backgroundColor: `rgba(0,0,0,${o})` }]} />
              ))}
            </View>
            <View style={styles.coverStamp}>
              <TimestampPill value={cover.timestamp} />
            </View>
          </ThemedView>
        </Pressable>
      ) : (
        <ThemedView type="accentSoft" style={styles.band}>
          <ThemedText type="eyebrow" themeColor="accent">
            {framesPending ? 'Frames on the way…' : 'Reeldex card'}
          </ThemedText>
          <ThemedText type="title" themeColor="accentStrong" style={styles.bandTitle}>
            {category}
          </ThemedText>
        </ThemedView>
      )}

      <View style={styles.text}>
        {cover && (
          <ThemedText type="eyebrow" themeColor="accent">
            {category}
          </ThemedText>
        )}
        <ThemedText type="subtitle" style={styles.title} selectable>
          {card.title}
        </ThemedText>
        {card.summary && (
          <ThemedText themeColor="textSecondary" style={styles.lead} selectable>
            {card.summary}
          </ThemedText>
        )}
        <ThemedText type="small" themeColor="textTertiary">
          {[card.creator_handle, `Saved ${saved}`].filter(Boolean).join('  ·  ')}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: Spacing.four,
  },
  cover: {
    width: '100%',
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '30%',
    pointerEvents: 'none',
  },
  fadeBand: {
    flex: 1,
  },
  coverStamp: {
    position: 'absolute',
    left: Spacing.three,
    bottom: Spacing.three,
  },
  band: {
    minHeight: 148,
    justifyContent: 'flex-end',
    gap: Spacing.one,
    padding: Spacing.four,
    borderRadius: Radius.large,
  },
  bandTitle: {
    fontSize: 34,
    lineHeight: 40,
  },
  text: {
    gap: Spacing.two + Spacing.one,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
  },
  lead: {
    fontSize: 18,
    lineHeight: 28,
  },
  pressed: {
    opacity: 0.85,
  },
});
