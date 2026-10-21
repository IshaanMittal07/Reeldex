import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { CATEGORY_LABELS, type Card } from '@/lib/types';

export function CardRow({ card, thumbUrl }: { card: Card; thumbUrl?: string }) {
  return (
    <Link href={{ pathname: '/card/[id]', params: { id: card.id } }} asChild>
      <Pressable style={({ pressed }) => pressed && styles.pressed}>
        <ThemedView type="backgroundElement" style={styles.row}>
          <View style={styles.text}>
            <ThemedText type="smallBold" themeColor="accent">
              {CATEGORY_LABELS[card.category] ?? card.category}
              {card.creator_handle ? `  ·  ${card.creator_handle}` : ''}
            </ThemedText>
            <ThemedText type="default" style={styles.title}>
              {card.title}
            </ThemedText>
            {card.summary && (
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                {card.summary}
              </ThemedText>
            )}
          </View>
          {thumbUrl && <Image source={thumbUrl} style={styles.thumb} contentFit="cover" />}
        </ThemedView>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  text: {
    flex: 1,
    gap: Spacing.one,
  },
  thumb: {
    width: 56,
    height: 100,
    borderRadius: Spacing.two,
  },
  title: {
    fontWeight: 700,
  },
  pressed: {
    opacity: 0.7,
  },
});
