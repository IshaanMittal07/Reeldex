import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ActionItems, KeyPoints, Resources, Warnings } from '@/components/card-sections';
import { CategorySections } from '@/components/category-sections';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useCard } from '@/hooks/use-cards';
import { supabase } from '@/lib/supabase';
import { CATEGORY_LABELS } from '@/lib/types';

// Alert.alert has no buttons on web, so fall back to the browser's confirm().
function confirmDelete(onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm('Delete this card?')) onConfirm();
    return;
  }
  Alert.alert('Delete this card?', undefined, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: onConfirm },
  ]);
}

export default function CardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { card, isLoading } = useCard(id);
  const [deleting, setDeleting] = useState(false);

  if (isLoading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator />
      </ThemedView>
    );
  }
  if (!card) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText themeColor="textSecondary">This card doesn&apos;t exist anymore.</ThemedText>
      </ThemedView>
    );
  }

  const { data } = card;

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ThemedText type="smallBold" themeColor="accent">
            {CATEGORY_LABELS[card.category] ?? card.category}
            {card.creator_handle ? `  ·  ${card.creator_handle}` : ''}
          </ThemedText>
          <ThemedText type="subtitle" style={styles.title}>
            {card.title}
          </ThemedText>
          {card.summary && <ThemedText themeColor="textSecondary">{card.summary}</ThemedText>}
          {!data.is_actionable && (
            <ThemedText type="small" themeColor="warning">
              Reeldex didn&apos;t find concrete advice in this reel.
            </ThemedText>
          )}
        </View>

        <Warnings warnings={data.warnings} />
        <KeyPoints points={data.key_points} />
        <ActionItems items={data.action_items} />
        <CategorySections data={data} />
        <Resources resources={data.resources} />

        <View style={styles.footer}>
          {card.source_url && (
            <Pressable onPress={() => Linking.openURL(card.source_url!)} accessibilityRole="link">
              <ThemedText type="linkPrimary">Open original reel</ThemedText>
            </Pressable>
          )}
          <ThemedText type="small" themeColor="textSecondary">
            Saved {new Date(card.created_at).toLocaleDateString()}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            disabled={deleting}
            onPress={() =>
              confirmDelete(async () => {
                setDeleting(true);
                await supabase.from('cards').delete().eq('id', card.id);
                if (router.canGoBack()) router.back();
                else router.replace('/');
              })
            }>
            <ThemedText type="small" themeColor="warning">
              {deleting ? 'Deleting…' : 'Delete card'}
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    width: '100%',
  },
  content: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.four,
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  header: {
    gap: Spacing.two,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  footer: {
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
});
