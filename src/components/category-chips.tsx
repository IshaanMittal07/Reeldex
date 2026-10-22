import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { CATEGORY_LABELS, type Category } from '@/lib/types';

type Props = {
  categories: Category[];
  selected: Category | null;
  onSelect: (category: Category | null) => void;
};

export function CategoryChips({ categories, selected, onSelect }: Props) {
  const theme = useTheme();
  const options: (Category | null)[] = [null, ...categories];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroller}>
      {options.map((category) => {
        const active = category === selected;
        return (
          <Pressable
            key={category ?? 'all'}
            onPress={() => onSelect(category)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
              styles.chip,
              active
                ? { backgroundColor: theme.accent, borderColor: theme.accent }
                : { backgroundColor: theme.surface, borderColor: theme.border },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold" themeColor={active ? 'onAccent' : 'textSecondary'} style={styles.label}>
              {category ? CATEGORY_LABELS[category] : 'All'}
            </ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Let chips run to the screen edge instead of clipping at the list padding.
  scroller: {
    marginHorizontal: -Spacing.three,
  },
  row: {
    gap: Spacing.two,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.three,
  },
  chip: {
    paddingVertical: Spacing.one + Spacing.half,
    paddingHorizontal: Spacing.three - Spacing.one,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.7,
  },
});
