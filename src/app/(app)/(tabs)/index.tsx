import { useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, SectionList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CardRow } from '@/components/card-row';
import { CategoryChips } from '@/components/category-chips';
import { JobsBanner } from '@/components/jobs-banner';
import { LibraryEmptyState, LibraryNoMatches } from '@/components/library-empty-state';
import { Logo } from '@/components/logo';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useCards } from '@/hooks/use-cards';
import { useFrameUrls } from '@/hooks/use-frame-urls';
import { useOpenJobs } from '@/hooks/use-open-jobs';
import { useTheme } from '@/hooks/use-theme';
import { CATEGORY_LABELS, type Card, type Category } from '@/lib/types';

function matches(card: Card, query: string) {
  const haystack = [
    card.title,
    card.summary,
    card.creator_handle,
    ...(card.data.takeaways ?? []),
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

function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return 'Up late';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function LibraryScreen() {
  const { cards, error, isLoading, refresh } = useCards();
  const jobs = useOpenJobs();
  const theme = useTheme();
  const [category, setCategory] = useState<Category | null>(null);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const thumbs = useFrameUrls(cards.flatMap((c) => (c.frames[0] ? [c.frames[0].path] : [])));
  const categories = useMemo(() => [...new Set(cards.map((c) => c.category))], [cards]);
  const visible = cards.filter(
    (c) => (!category || c.category === category) && (!query.trim() || matches(c, query.trim())),
  );
  // One group per category, the most recently used category first (cards come newest first).
  const groups = new Map<Category, Card[]>();
  for (const card of visible) groups.set(card.category, [...(groups.get(card.category) ?? []), card]);
  const sections = [...groups].map(([key, data]) => ({ key, data }));

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <SectionList
          sections={sections}
          keyExtractor={(c) => c.id}
          stickySectionHeadersEnabled={false}
          renderItem={({ item, index, section }) => (
            <CardRow
              card={item}
              thumbUrl={item.frames[0] && thumbs[item.frames[0].path]}
              isFirst={index === 0}
              isLast={index === section.data.length - 1}
            />
          )}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <ThemedText type="eyebrow" themeColor="textSecondary">
                {CATEGORY_LABELS[section.key] ?? section.key}
              </ThemedText>
              <ThemedText type="eyebrow" themeColor="textTertiary">
                {section.data.length}
              </ThemedText>
            </View>
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              tintColor={theme.accent}
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
              <View style={styles.brand}>
                <Logo size={30} />
                <ThemedText type="heading" style={styles.wordmark}>
                  Reeldex
                </ThemedText>
              </View>
              <View style={styles.intro}>
                <ThemedText type="heading">{greeting()}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {cards.length
                    ? `${cards.length} reel${cards.length > 1 ? 's' : ''} saved as notes.`
                    : 'Reels you save become notes here.'}
                </ThemedText>
              </View>
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
              <ActivityIndicator color={theme.accent} style={styles.loading} />
            ) : cards.length ? (
              <LibraryNoMatches />
            ) : (
              <LibraryEmptyState />
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
    padding: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  header: {
    gap: Spacing.three,
    marginBottom: Spacing.one,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + Spacing.half,
    paddingTop: Spacing.two,
  },
  wordmark: {
    fontSize: 22,
    letterSpacing: -0.3,
  },
  intro: {
    gap: Spacing.half,
    marginTop: Spacing.two,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.one,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  loading: {
    marginTop: Spacing.five,
  },
});
