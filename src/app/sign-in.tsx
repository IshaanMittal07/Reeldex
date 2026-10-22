import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { Logo } from '@/components/logo';
import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/lib/session';

// No sign-up screen: Reeldex is single-user. The account is created once in the
// Supabase dashboard (Authentication → Add user).
export default function SignInScreen() {
  const theme = useTheme();
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email || !password) return;
    setBusy(true);
    setError(await signIn(email.trim(), password));
    setBusy(false);
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.column}>
            <View style={styles.header}>
              <Logo size={52} />
              <ThemedText type="subtitle" style={styles.centered}>
                Reeldex
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={[styles.centered, styles.tagline]}>
                Your reels, turned into notes you&apos;ll actually use.
              </ThemedText>
            </View>

            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.field}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  Email
                </ThemedText>
                <TextField
                  placeholder="you@example.com"
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
              <View style={styles.field}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  Password
                </ThemedText>
                <TextField
                  placeholder="Your password"
                  autoComplete="current-password"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  onSubmitEditing={submit}
                />
              </View>
              {error && (
                <ThemedView type="warningBackground" style={styles.error}>
                  <ThemedText type="small" themeColor="warning">
                    {error}
                  </ThemedText>
                </ThemedView>
              )}
              <View style={styles.action}>
                <PrimaryButton title="Sign in" onPress={submit} busy={busy} disabled={!email || !password} />
              </View>
            </View>

            <ThemedText type="small" themeColor="textTertiary" style={styles.centered}>
              A private library, just for you.
            </ThemedText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.five,
  },
  column: {
    width: '100%',
    maxWidth: 400,
    gap: Spacing.four,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  centered: {
    textAlign: 'center',
  },
  tagline: {
    maxWidth: 280,
  },
  card: {
    gap: Spacing.three,
    padding: Spacing.four - Spacing.one,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    boxShadow: '0 1px 2px rgba(16, 24, 18, 0.04), 0 10px 30px rgba(16, 24, 18, 0.05)',
  },
  field: {
    gap: Spacing.one + Spacing.half,
  },
  error: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.small,
  },
  action: {
    marginTop: Spacing.one,
  },
});
