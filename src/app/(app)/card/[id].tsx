import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ActionItems, Callout, KeyPoints, Resources, Warnings } from '@/components/card-sections';
import { FrameViewer } from '@/components/card-frame-viewer';
import { CardHero } from '@/components/card-hero';
import { CategorySections } from '@/components/category-sections';
import { FrameGallery } from '@/components/frame-gallery';
import { ReelLink } from '@/components/reel-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { VisualBlock } from '@/components/visual-block';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useCard } from '@/hooks/use-cards';
import { useFrameUrls } from '@/hooks/use-frame-urls';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

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
  const { card, isLoading, setCard } = useCard(id);
  const theme = useTheme();
  const [deleting, setDeleting] = useState(false);
  const [openedAt] = useState(() => Date.now());
  const [viewing, setViewing] = useState<number | null>(null);
  // One batch of signed URLs shared by the cover, filmstrip and viewer.
  const frames = card?.frames ?? [];
  const urls = useFrameUrls(frames.map((f) => f.path));

  if (isLoading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator color={theme.accent} />
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
  // Frames were requested and the card is recent enough that the job may still be running.
  const framesPending =
    !!data.key_frames?.length && !card.frames.length && openedAt - Date.parse(card.created_at) < 20 * 60_000;

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <CardHero
          card={card}
          coverUrl={frames[0] ? urls[frames[0].path] : undefined}
          framesPending={framesPending}
          onOpenCover={() => setViewing(0)}
        />
        <ReelLink cardId={card.id} url={card.source_url} onChange={(url) => setCard({ ...card, source_url: url })} />

        {!data.is_actionable && (
          <Callout label="Note">
            <ThemedText type="small">Reeldex didn&apos;t find concrete advice in this reel.</ThemedText>
          </Callout>
        )}
        <Warnings warnings={data.warnings} />
        <VisualBlock visual={data.visual} />
        <KeyPoints points={data.key_points} />
        <ActionItems items={data.action_items} />
        <CategorySections data={data} />
        <Resources resources={data.resources} />
        <FrameGallery frames={frames} urls={urls} pending={framesPending} onOpen={setViewing} />

        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <Pressable
            accessibilityRole="button"
            disabled={deleting}
            hitSlop={8}
            style={({ pressed }) => [styles.delete, { borderColor: theme.border }, pressed && styles.pressed]}
            onPress={() =>
              confirmDelete(async () => {
                setDeleting(true);
                await supabase.from('cards').delete().eq('id', card.id);
                if (router.canGoBack()) router.back();
                else router.replace('/');
              })
            }>
            <ThemedText type="small" themeColor="warning" style={styles.deleteText}>
              {deleting ? 'Deleting…' : 'Delete card'}
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>

      <FrameViewer frames={frames} urls={urls} index={viewing} onChange={setViewing} />
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
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.six,
  },
  footer: {
    alignItems: 'flex-start',
    paddingTop: Spacing.four,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  delete: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three - Spacing.one,
  },
  deleteText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: 500,
  },
  pressed: {
    opacity: 0.6,
  },
});
