import { ScrollView, StyleSheet, View } from 'react-native';

import { Section } from './card-sections';
import { CopyButton } from './copy-button';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Visual } from '@/lib/types';

// Drawn by the app from data Gemini pulled out of the reel, so nothing is
// invented (AI image generation isn't on Gemini's free tier, and it makes up text).
export function VisualBlock({ visual }: { visual?: Visual | null }) {
  if (!visual) return null;
  if (visual.kind === 'table' && visual.columns.length && visual.rows.length) return <Table visual={visual} />;
  if (visual.kind === 'flow' && visual.steps.length) return <Flow visual={visual} />;
  return null;
}

function Table({ visual }: { visual: Visual }) {
  const theme = useTheme();
  const asText = [visual.columns, ...visual.rows].map((r) => r.join('\t')).join('\n');
  return (
    <Section title={visual.title}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <ThemedView type="backgroundElement" style={styles.table}>
          {[visual.columns, ...visual.rows].map((row, r) => (
            <View
              key={r}
              style={[styles.tr, r > 0 && { borderTopColor: theme.backgroundSelected, borderTopWidth: 1 }]}>
              {visual.columns.map((_, c) => (
                <ThemedText
                  key={c}
                  type={r === 0 ? 'smallBold' : 'small'}
                  themeColor={r === 0 ? 'textSecondary' : 'text'}
                  style={styles.td}>
                  {row[c] ?? ''}
                </ThemedText>
              ))}
            </View>
          ))}
        </ThemedView>
      </ScrollView>
      <CopyButton text={asText} label="Copy table" />
    </Section>
  );
}

function Flow({ visual }: { visual: Visual }) {
  const theme = useTheme();
  return (
    <Section title={visual.title}>
      {visual.steps.map((step, i) => (
        <View key={i} style={styles.step}>
          <View style={styles.rail}>
            <View style={[styles.dot, { backgroundColor: theme.accent }]}>
              <ThemedText type="smallBold" style={styles.dotText}>
                {i + 1}
              </ThemedText>
            </View>
            {i < visual.steps.length - 1 && <View style={[styles.line, { backgroundColor: theme.backgroundSelected }]} />}
          </View>
          <View style={styles.stepBody}>
            <ThemedText style={styles.stepLabel}>{step.label}</ThemedText>
            {step.detail && (
              <ThemedText type="small" themeColor="textSecondary">
                {step.detail}
              </ThemedText>
            )}
          </View>
        </View>
      ))}
    </Section>
  );
}

const styles = StyleSheet.create({
  table: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.two,
  },
  tr: {
    flexDirection: 'row',
  },
  td: {
    width: 130,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  step: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  rail: {
    alignItems: 'center',
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: {
    color: '#fff',
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: Spacing.three,
  },
  stepBody: {
    flex: 1,
    gap: Spacing.half,
    paddingBottom: Spacing.three,
  },
  stepLabel: {
    fontWeight: 700,
  },
});
