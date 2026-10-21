import { StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import type { Job } from '@/lib/types';

export function JobsBanner({ jobs }: { jobs: Job[] }) {
  const running = jobs.filter((j) => j.status === 'queued' || j.status === 'processing');
  const failed = jobs.filter((j) => j.status === 'failed');
  if (!running.length && !failed.length) return null;

  return (
    <ThemedView type="backgroundElement" style={styles.banner}>
      {running.length > 0 && (
        <ThemedText type="small">
          ⏳ {running.length} reel{running.length > 1 ? 's' : ''} processing. Cards appear here when ready.
        </ThemedText>
      )}
      {failed.map((job) => (
        <ThemedText key={job.id} type="small" themeColor="warning">
          ✕ A reel failed: {job.error ?? 'unknown error'}
        </ThemedText>
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  banner: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
});
