import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { CATEGORY_LABELS, type Card } from '@/lib/types';

export function CardRow({ card }: { card: Card }) {
  return (
    <Link href={{ pathname: '/card/[id]', params: { id: card.id } }} asChild>
      <Pressable style={({ pressed }) => pressed && styles.pressed}>
        <ThemedView type="backgroundElement" style={styles.row}>
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
        </ThemedView>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  title: {
    fontWeight: 700,
  },
  pressed: {
    opacity: 0.7,
  },
});
