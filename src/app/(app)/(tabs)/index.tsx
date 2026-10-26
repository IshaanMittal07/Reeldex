import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryChips } from '@/components/category-chips';
import { CategoryShelf } from '@/components/category-shelf';
import { JobsBanner } from '@/components/jobs-banner';
import { LibraryEmptyState, LibraryNoMatches } from '@/components/library-empty-state';
import { Logo } from '@/components/logo';
import { ReelTile } from '@/components/reel-tile';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useCards } from '@/hooks/use-cards';
import { useFrameUrls } from '@/hooks/use-frame-urls';
import { useOpenJobs } from '@/hooks/use-open-jobs';
import { useTheme } from '@/hooks/use-theme';
import { CATEGORY_LABELS, type Card, type Category } from '@/lib/types';

const GRID_GAP = Spacing.three - Spacing.one;
const GRID_MIN_TILE = 150;

function matches(card: Card, query: string) {
  const haystack = [
    card.title,
    card.summary,
    card.creator_handle,
    CATEGORY_LABELS[card.category],
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

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// Library rows: one shelf per category, or rows of a grid once a category is
// picked or a search is typed.
type Row =
  { key: string; kind: 'shelf'; category: Category; cards: Card[] } | { key: string; kind: 'grid'; cards: Card[] };

export default function LibraryScreen() {
  const { cards, error, isLoading, refresh } = useCards();
  const jobs = useOpenJobs();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<Row>>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const thumbs = useFrameUrls(cards.flatMap((c) => (c.frames[0] ? [c.frames[0].path] : [])));

  // Categories ordered by their newest reel, General always last. Each keeps
  // the query's order: pinned first, then newest.
  const groups = useMemo(() => {
    const byCategory = new Map<Category, Card[]>();
    for (const card of cards) byCategory.set(card.category, [...(byCategory.get(card.category) ?? []), card]);
    const newest = (list: Card[]) => Math.max(...list.map((c) => Date.parse(c.created_at)));
    return [...byCategory]
      .sort(([a, x], [b, y]) => Number(a === 'general') - Number(b === 'general') || newest(y) - newest(x))
      .map(([key, list]) => ({ category: key, cards: list }));
  }, [cards]);

  const search = query.trim();
  const filtered = category !== null || search !== '';
  const visible = cards.filter((c) => (!category || c.category === category) && (!search || matches(c, search)));

  const contentWidth = Math.min(width, MaxContentWidth) - Spacing.three * 2;
  const columns = Math.max(2, Math.floor((contentWidth + GRID_GAP) / (GRID_MIN_TILE + GRID_GAP)));
  const tileWidth = (contentWidth - GRID_GAP * (columns - 1)) / columns;

  const rows: Row[] = filtered
    ? Array.from({ length: Math.ceil(visible.length / columns) }, (_, i) => ({
        key: `grid-${i}`,
        kind: 'grid' as const,
        cards: visible.slice(i * columns, (i + 1) * columns),
      }))
    : groups.map((g) => ({ key: g.category, kind: 'shelf' as const, ...g }));

  const selectCategory = (next: Category | null) => {
    setCategory(next);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <FlatList
          ref={listRef}
          data={rows}
          keyExtractor={(row) => row.key}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) =>
            item.kind === 'shelf' ? (
              <CategoryShelf category={item.category} cards={item.cards} thumbs={thumbs} onSeeAll={selectCategory} />
            ) : (
              <View style={styles.gridRow}>
                {item.cards.map((card) => (
                  <ReelTile
                    key={card.id}
                    card={card}
                    width={tileWidth}
                    thumbUrl={card.frames[0] && thumbs[card.frames[0].path]}
                    showCategory={!category}
                  />
                ))}
              </View>
            )
          }
          contentContainerStyle={[styles.list, { gap: filtered ? Spacing.four : Spacing.five }]}
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
                    ? `${plural(cards.length, 'reel', 'reels')} in ${plural(groups.length, 'category', 'categories')}.`
                    : 'Reels you save become notes here.'}
                </ThemedText>
              </View>
              <TextField
                placeholder="Search your reels"
                value={query}
                onChangeText={setQuery}
                clearButtonMode="while-editing"
              />
              {groups.length > 1 && (
                <CategoryChips
                  categories={groups.map((g) => g.category)}
                  selected={category}
                  onSelect={selectCategory}
                />
              )}
              <JobsBanner jobs={jobs} />
              {error && <ThemedText themeColor="warning">{error}</ThemedText>}
              {filtered && visible.length > 0 && (
                <ThemedText type="eyebrow" themeColor="textSecondary">
                  {category ? `${CATEGORY_LABELS[category]} · ` : ''}
                  {plural(visible.length, search ? 'result' : 'reel', search ? 'results' : 'reels')}
                </ThemedText>
              )}
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
  gridRow: {
    flexDirection: 'row',
    gap: GRID_GAP,
  },
  loading: {
    marginTop: Spacing.five,
  },
});
