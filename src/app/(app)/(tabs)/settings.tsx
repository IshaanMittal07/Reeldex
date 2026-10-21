import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Section } from '@/components/card-sections';
import { CopyButton } from '@/components/copy-button';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';

const INGEST_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/ingest`;

export default function SettingsScreen() {
  const { session, signOut } = useSession();
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function createToken() {
    setBusy(true);
    const { data, error } = await supabase.rpc('create_ingest_token', { label: 'iPhone Shortcut' });
    setBusy(false);
    setError(error?.message ?? null);
    setToken((data as string | null) ?? null);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle">Settings</ThemedText>

          <Section title="Account">
            <ThemedText>{session?.user.email}</ThemedText>
          </Section>

          <Section title="iPhone Shortcut">
            <ThemedText themeColor="textSecondary">
              The Reeldex Shortcut posts videos to this address with your token in the
              x-reeldex-token header.
            </ThemedText>
            <ThemedView type="backgroundElement" style={styles.box}>
              <ThemedText type="code" selectable>
                {INGEST_URL}
              </ThemedText>
              <CopyButton text={INGEST_URL} label="Copy URL" />
            </ThemedView>

            {token ? (
              <ThemedView type="backgroundElement" style={styles.box}>
                <ThemedText type="small" themeColor="warning">
                  Copy this now. It won&apos;t be shown again.
                </ThemedText>
                <ThemedText type="code" selectable>
                  {token}
                </ThemedText>
                <CopyButton text={token} label="Copy token" />
              </ThemedView>
            ) : (
              <PrimaryButton title="New Shortcut token" onPress={createToken} busy={busy} />
            )}
            {error && <ThemedText themeColor="warning">{error}</ThemedText>}
          </Section>

          <View style={styles.signOut}>
            <PrimaryButton title="Sign out" tone="warning" onPress={signOut} />
          </View>
        </ScrollView>
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
  content: {
    gap: Spacing.four,
    padding: Spacing.three,
  },
  box: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  signOut: {
    marginTop: Spacing.four,
  },
});
