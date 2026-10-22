import { Children, useState, type PropsWithChildren, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CopyButton } from '@/components/copy-button';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { setAppearance, useAppearance, type Appearance } from '@/lib/appearance';
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
          <ThemedText type="subtitle" style={styles.inset}>
            Settings
          </ThemedText>

          <Group label="Account">
            <View style={styles.row}>
              <ThemedText type="small" themeColor="textSecondary">
                Signed in as
              </ThemedText>
              <ThemedText numberOfLines={1}>{session?.user.email}</ThemedText>
            </View>
          </Group>

          <Group label="Appearance">
            <View style={styles.row}>
              <AppearancePicker />
            </View>
          </Group>

          <Group
            label="iPhone Shortcut"
            note="The Reeldex Shortcut posts videos to this address with your token in the x-reeldex-token header.">
            <View style={styles.row}>
              <RowHeader title="Ingest URL" action={<CopyButton text={INGEST_URL} label="Copy URL" />} />
              <CodeBox>{INGEST_URL}</CodeBox>
            </View>
            <View style={styles.row}>
              {token ? (
                <>
                  <RowHeader title="Shortcut token" action={<CopyButton text={token} label="Copy token" />} />
                  <CodeBox>{token}</CodeBox>
                  <ThemedView type="warningBackground" style={styles.notice}>
                    <ThemedText type="small" themeColor="warning">
                      Copy this now. It won&apos;t be shown again.
                    </ThemedText>
                  </ThemedView>
                </>
              ) : (
                <>
                  <RowHeader title="Shortcut token" />
                  <ThemedText type="small" themeColor="textSecondary">
                    Create a token and paste it into the Shortcut. It&apos;s only shown once.
                  </ThemedText>
                  <PrimaryButton title="New Shortcut token" onPress={createToken} busy={busy} />
                </>
              )}
              {error && (
                <ThemedText type="small" themeColor="warning">
                  {error}
                </ThemedText>
              )}
            </View>
          </Group>

          <Group>
            <View style={styles.row}>
              <PrimaryButton title="Sign out" tone="warning" variant="outline" onPress={signOut} />
            </View>
          </Group>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

// A Notion-style group: an eyebrow label, then its rows in one white card split by hairlines.
function Group({ label, note, children }: PropsWithChildren<{ label?: string; note?: string }>) {
  const theme = useTheme();
  return (
    <View style={styles.group}>
      {label && (
        <ThemedText type="eyebrow" themeColor="textTertiary" style={styles.inset}>
          {label}
        </ThemedText>
      )}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {Children.toArray(children).map((row, i) => (
          <View key={i} style={i > 0 && [styles.divided, { borderTopColor: theme.border }]}>
            {row}
          </View>
        ))}
      </View>
      {note && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.inset}>
          {note}
        </ThemedText>
      )}
    </View>
  );
}

const APPEARANCES: { value: Appearance; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

// Segmented control: the selected option sits on a raised paper chip.
function AppearancePicker() {
  const theme = useTheme();
  const appearance = useAppearance();
  return (
    <View style={[styles.segments, { backgroundColor: theme.backgroundElement }]}>
      {APPEARANCES.map(({ value, label }) => {
        const selected = value === appearance;
        return (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => setAppearance(value)}
            style={[styles.segment, selected && { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <ThemedText type="smallBold" themeColor={selected ? 'text' : 'textSecondary'}>
              {label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

function RowHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={styles.rowHeader}>
      <ThemedText type="smallBold">{title}</ThemedText>
      {action}
    </View>
  );
}

function CodeBox({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.codeBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <ThemedText type="code" selectable style={styles.code}>
        {children}
      </ThemedText>
    </View>
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
    gap: Spacing.five,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.five,
  },
  inset: {
    paddingHorizontal: Spacing.one,
  },
  group: {
    gap: Spacing.two,
  },
  card: {
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  divided: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    gap: Spacing.two,
    padding: Spacing.three,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  segments: {
    flexDirection: 'row',
    padding: Spacing.half + 1,
    borderRadius: Radius.medium,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Radius.small + 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  notice: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.small,
  },
  codeBox: {
    paddingVertical: Spacing.two + Spacing.half,
    paddingHorizontal: Spacing.three - Spacing.one,
    borderRadius: Radius.small,
    borderWidth: StyleSheet.hairlineWidth,
  },
  code: {
    fontSize: 13,
    lineHeight: 19,
  },
});
