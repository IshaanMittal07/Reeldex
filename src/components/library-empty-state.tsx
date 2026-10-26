import { StyleSheet, View } from 'react-native';

import { Logo } from './logo';
import { ThemedText } from './themed-text';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const STEPS = ['In Instagram, tap Share on a reel', 'Pick the Reeldex shortcut', 'Your card shows up here, sorted by category'];

export function LibraryEmptyState() {
  const theme = useTheme();
  return (
    <View style={[styles.box, { borderColor: theme.border, backgroundColor: theme.surface }]}>
      <View style={[styles.halo, { backgroundColor: theme.accentSoft }]}>
        <Logo size={48} />
      </View>
      <ThemedText type="heading" style={styles.center}>
        Your library is waiting
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
        Save a reel and Reeldex turns it into notes you can come back to.
      </ThemedText>
      <View style={styles.steps}>
        {STEPS.map((step, i) => (
          <View key={step} style={styles.step}>
            <View style={[styles.number, { borderColor: theme.accent }]}>
              <ThemedText type="eyebrow" themeColor="accent" style={styles.numberText}>
                {i + 1}
              </ThemedText>
            </View>
            <ThemedText type="small" style={styles.stepText}>
              {step}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

export function LibraryNoMatches() {
  return (
    <View style={styles.noMatches}>
      <ThemedText type="heading" style={styles.center}>
        Nothing matches
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
        Try another word or category.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.three,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.large,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  halo: {
    padding: Spacing.three,
    borderRadius: Radius.pill,
    marginBottom: Spacing.two,
  },
  center: {
    textAlign: 'center',
  },
  steps: {
    alignSelf: 'stretch',
    gap: Spacing.two + Spacing.one,
    marginTop: Spacing.three,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - Spacing.one,
  },
  number: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    letterSpacing: 0,
  },
  stepText: {
    flex: 1,
  },
  noMatches: {
    gap: Spacing.one,
    marginTop: Spacing.five,
  },
});
