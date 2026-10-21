import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { CATEGORY_LABELS, type Category } from '@/lib/types';

type Props = {
  categories: Category[];
  selected: Category | null;
  onSelect: (category: Category | null) => void;
};

export function CategoryChips({ categories, selected, onSelect }: Props) {
  const options: (Category | null)[] = [null, ...categories];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map((category) => {
        const active = category === selected;
        return (
          <Pressable
            key={category ?? 'all'}
            onPress={() => onSelect(category)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}>
            <ThemedView type={active ? 'backgroundSelected' : 'backgroundElement'} style={styles.chip}>
              <ThemedText type="small" themeColor={active ? 'text' : 'textSecondary'}>
                {category ? CATEGORY_LABELS[category] : 'All'}
              </ThemedText>
            </ThemedView>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  chip: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.four,
  },
});
