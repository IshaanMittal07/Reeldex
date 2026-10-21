import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { CopyButton } from './copy-button';
import { TextField } from './text-field';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { reelUrl } from '../../shared/reel-url';

import { Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

type Props = {
  cardId: string;
  url: string | null;
  onChange: (url: string) => void;
};

// The reel's Instagram link: sent by the Shortcut when it can find one, or
// pasted here for cards saved without it.
export function ReelLink({ cardId, url, onChange }: Props) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (url) {
    return (
      <ThemedView type="backgroundElement" style={styles.box}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          REEL
        </ThemedText>
        <Pressable onPress={() => Linking.openURL(url)} accessibilityRole="link">
          <ThemedText type="linkPrimary" numberOfLines={1}>
            {url.replace('https://www.', '')}
          </ThemedText>
        </Pressable>
        <View style={styles.actions}>
          <CopyButton text={url} label="Copy link" />
        </View>
      </ThemedView>
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
    <ThemedView type="backgroundElement" style={styles.box}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        ADD THE REEL LINK
      </ThemedText>
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
      <Pressable onPress={save} disabled={saving || !draft} accessibilityRole="button">
        <ThemedText type="linkPrimary">{saving ? 'Saving…' : 'Save link'}</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  box: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  actions: {
    flexDirection: 'row',
  },
});
