import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CardRow } from '@/components/card-row';
import { CategoryChips } from '@/components/category-chips';
import { JobsBanner } from '@/components/jobs-banner';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useCards } from '@/hooks/use-cards';
import { useFrameUrls } from '@/hooks/use-frame-urls';
import { useOpenJobs } from '@/hooks/use-open-jobs';
import type { Card, Category } from '@/lib/types';

function matches(card: Card, query: string) {
  const haystack = [
    card.title,
    card.summary,
    card.creator_handle,
    ...card.data.key_points.map((p) => p.text),
    ...card.data.action_items,
  ]
    .join(' ')
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .every((word) => haystack.includes(word));
}

export default function LibraryScreen() {
  const { cards, error, isLoading, refresh } = useCards();
  const jobs = useOpenJobs();
  const [category, setCategory] = useState<Category | null>(null);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const thumbs = useFrameUrls(cards.flatMap((c) => (c.frames[0] ? [c.frames[0].path] : [])));
  const categories = useMemo(() => [...new Set(cards.map((c) => c.category))], [cards]);
  const visible = cards.filter(
    (c) => (!category || c.category === category) && (!query.trim() || matches(c, query.trim())),
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <FlatList
          data={visible}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <CardRow card={item} thumbUrl={item.frames[0] && thumbs[item.frames[0].path]} />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await refresh();
                setRefreshing(false);
              }}
            />
          }
          ListHeaderComponent={
            <View style={styles.header}>
              <ThemedText type="subtitle">Library</ThemedText>
              <TextField
                placeholder="Search your reels"
                value={query}
                onChangeText={setQuery}
                clearButtonMode="while-editing"
              />
              {categories.length > 1 && (
                <CategoryChips categories={categories} selected={category} onSelect={setCategory} />
              )}
              <JobsBanner jobs={jobs} />
              {error && <ThemedText themeColor="warning">{error}</ThemedText>}
            </View>
          }
          ListEmptyComponent={
            isLoading ? (
              <ActivityIndicator />
            ) : (
              <ThemedText themeColor="textSecondary" style={styles.empty}>
                {cards.length
                  ? 'Nothing matches.'
                  : 'No cards yet. Download a reel in Instagram, then share it from Photos to the Reeldex Shortcut.'}
              </ThemedText>
            )
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  list: {
    gap: Spacing.two,
    padding: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  header: {
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  empty: {
    textAlign: 'center',
    marginTop: Spacing.five,
  },
});
