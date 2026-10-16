import { useShareIntentContext } from 'expo-share-intent';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HintRow } from '@/components/hint-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

// Sprint 0 proof: show exactly what another app hands Reeldex through the share
// sheet (plan Section 4, "test on a real device"). Replaced by the Library in Sprint 3.

function formatBytes(bytes: number | null) {
  return bytes == null ? 'unknown' : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDuration(ms: number | null) {
  return ms == null ? 'unknown' : `${Math.round(ms / 1000)} s`;
}

export default function HomeScreen() {
  const { hasShareIntent, shareIntent, resetShareIntent, error } = useShareIntentContext();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Reeldex
        </ThemedText>

        {!hasShareIntent && (
          <ThemedText style={styles.center}>
            Download a reel, then share it to Reeldex from the share sheet.
          </ThemedText>
        )}

        {hasShareIntent && (
          <ThemedView type="backgroundElement" style={styles.panel}>
            <HintRow title="Type" hint={<ThemedText type="code">{shareIntent.type ?? 'none'}</ThemedText>} />
            {shareIntent.webUrl && <HintRow title="Link" hint={<ThemedText type="small">{shareIntent.webUrl}</ThemedText>} />}
            {shareIntent.text && <HintRow title="Text" hint={<ThemedText type="small">{shareIntent.text}</ThemedText>} />}
            {shareIntent.files?.map((file) => (
              <ThemedView key={file.path} type="backgroundElement" style={styles.file}>
                <HintRow title="File" hint={<ThemedText type="small">{file.fileName}</ThemedText>} />
                <HintRow title="MIME" hint={<ThemedText type="code">{file.mimeType}</ThemedText>} />
                <HintRow title="Size" hint={<ThemedText type="small">{formatBytes(file.size)}</ThemedText>} />
                <HintRow title="Length" hint={<ThemedText type="small">{formatDuration(file.duration)}</ThemedText>} />
              </ThemedView>
            ))}
            <Pressable onPress={() => resetShareIntent()} accessibilityRole="button">
              <ThemedText type="linkPrimary">Clear</ThemedText>
            </Pressable>
          </ThemedView>
        )}

        {error && (
          <ThemedText themeColor="textSecondary" style={styles.center}>
            {error}
          </ThemedText>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  title: {
    textAlign: 'center',
  },
  center: {
    textAlign: 'center',
  },
  panel: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    padding: Spacing.four,
    borderRadius: Spacing.four,
  },
  file: {
    gap: Spacing.two,
  },
});
