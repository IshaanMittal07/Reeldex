import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ReelTile } from './reel-tile';
import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { CATEGORY_GLYPHS, CATEGORY_LABELS, type Card, type Category } from '@/lib/types';

export const SHELF_TILE_WIDTH = 136;
const GAP = Spacing.three - Spacing.one;

type Props = {
  category: Category;
  cards: Card[];
  thumbs: Record<string, string>;
  onSeeAll: (category: Category) => void;
};

// One category's reels side by side in a row that scrolls sideways.
export function CategoryShelf({ category, cards, thumbs, onSeeAll }: Props) {
  return (
    <View style={styles.shelf}>
      <Pressable
        onPress={() => onSeeAll(category)}
        accessibilityRole="button"
        accessibilityLabel={`See all ${CATEGORY_LABELS[category]}`}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}>
        <ThemedText style={styles.glyph}>{CATEGORY_GLYPHS[category]}</ThemedText>
        <ThemedText type="heading" style={styles.label} numberOfLines={1}>
          {CATEGORY_LABELS[category]}
        </ThemedText>
        <ThemedText type="small" themeColor="textTertiary">
          {cards.length}
        </ThemedText>
        <ThemedText type="linkPrimary" style={styles.seeAll}>
          See all ›
        </ThemedText>
      </Pressable>

      {/* Bleeds into the page gutter so the row scrolls edge to edge. */}
      <FlatList
        horizontal
        data={cards}
        keyExtractor={(c) => c.id}
        showsHorizontalScrollIndicator={false}
        style={styles.row}
        contentContainerStyle={styles.rowContent}
        snapToInterval={SHELF_TILE_WIDTH + GAP}
        decelerationRate="fast"
        renderItem={({ item }) => (
          <ReelTile card={item} thumbUrl={item.frames[0] && thumbs[item.frames[0].path]} width={SHELF_TILE_WIDTH} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shelf: {
    gap: Spacing.three - Spacing.one,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  glyph: {
    fontSize: 18,
    lineHeight: 24,
  },
  label: {
    flexShrink: 1,
    fontSize: 19,
    lineHeight: 24,
  },
  seeAll: {
    marginLeft: 'auto',
    fontSize: 13,
  },
  row: {
    marginHorizontal: -Spacing.three,
  },
  rowContent: {
    gap: GAP,
    paddingHorizontal: Spacing.three,
  },
  pressed: {
    opacity: 0.6,
  },
});
