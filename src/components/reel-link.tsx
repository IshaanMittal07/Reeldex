import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { CopyButton } from './copy-button';
import { TextField } from './text-field';
import { ThemedText } from './themed-text';

import { reelUrl } from '../../shared/reel-url';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

type Props = {
  cardId: string;
  url: string | null;
  onChange: (url: string) => void;
};

// The reel's Instagram link: sent by the Shortcut when it can find one, or
// pasted here for cards saved without it.
export function ReelLink({ cardId, url, onChange }: Props) {
  const theme = useTheme();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (url) {
    return (
      <View style={styles.row}>
        <Pressable
          onPress={() => Linking.openURL(url)}
          accessibilityRole="link"
          style={({ pressed }) => [styles.watch, { backgroundColor: theme.accentSoft, borderColor: theme.accentSoft }, pressed && styles.pressed]}>
          <ThemedText type="small" themeColor="accentStrong" style={styles.watchText}>
            Watch the reel ↗
          </ThemedText>
        </Pressable>
        <CopyButton text={url} label="Copy link" />
      </View>
    );
  }

  async function save() {
    const clean = reelUrl(draft);
    if (!clean) return setError('Paste an instagram.com reel or post link.');
    setSaving(true);
    const { error } = await supabase.from('cards').update({ source_url: clean }).eq('id', cardId);
    setSaving(false);
    if (error) return setError(error.message);
    onChange(clean);
  }

  return (
    <View style={[styles.box, { borderColor: theme.border, backgroundColor: theme.surface }]}>
      <View style={styles.boxHeader}>
        <ThemedText type="eyebrow" themeColor="textSecondary">
          Add the reel link
        </ThemedText>
        <ThemedText type="small" themeColor="textTertiary">
          So you can jump back to the video later.
        </ThemedText>
      </View>
      <TextField
        placeholder="https://www.instagram.com/reel/…"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        value={draft}
        onChangeText={(t) => {
          setDraft(t);
          setError(null);
        }}
        onSubmitEditing={save}
      />
      {error && (
        <ThemedText type="small" themeColor="warning">
          {error}
        </ThemedText>
      )}
      <Pressable
        onPress={save}
        disabled={saving || !draft}
        accessibilityRole="button"
        hitSlop={8}
        style={(!draft || saving) && styles.dim}>
        <ThemedText type="linkPrimary">{saving ? 'Saving…' : 'Save link'}</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  // Same height as the copy pill beside it.
  watch: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three - Spacing.one,
  },
  watchText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: 600,
  },
  pressed: {
    opacity: 0.7,
  },
  box: {
    gap: Spacing.three - Spacing.one,
    padding: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.medium,
  },
  boxHeader: {
    gap: Spacing.half,
  },
  dim: {
    opacity: 0.5,
  },
});
