import { ScrollView, StyleSheet, View } from 'react-native';

import { CardSection } from './card-sections';
import { CopyButton } from './copy-button';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Fonts, Radius, Spacing } from '@/constants/theme';
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
  // Two columns fit a phone screen without scrolling; more scroll sideways.
  const cellWidth = visual.columns.length <= 2 ? 160 : 132;
  return (
    <CardSection title={visual.title} action={<CopyButton text={asText} label="Copy" />}>
      <View style={[styles.tableFrame, { borderColor: theme.border, backgroundColor: theme.surface }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {[visual.columns, ...visual.rows].map((row, r) => (
              <View
                key={r}
                style={[
                  styles.tr,
                  r === 0 && { backgroundColor: theme.backgroundElement },
                  r > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth },
                ]}>
                {visual.columns.map((_, c) => (
                  <ThemedText
                    key={c}
                    type={r === 0 ? 'eyebrow' : 'small'}
                    themeColor={r === 0 ? 'textSecondary' : 'text'}
                    style={[styles.td, { width: cellWidth }, c === 0 && r > 0 && styles.firstCol]}>
                    {row[c] ?? ''}
                  </ThemedText>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </CardSection>
  );
}

function Flow({ visual }: { visual: Visual }) {
  const theme = useTheme();
  return (
    <CardSection title={visual.title}>
      <View>
        {visual.steps.map((step, i) => {
          const last = i === visual.steps.length - 1;
          return (
            <View key={i} style={styles.step}>
              <View style={styles.rail}>
                <ThemedView type="accentSoft" style={[styles.dot, { borderColor: theme.accent }]}>
                  <ThemedText themeColor="accent" style={styles.dotText}>
                    {i + 1}
                  </ThemedText>
                </ThemedView>
                {!last && <View style={[styles.line, { backgroundColor: theme.border }]} />}
              </View>
              <View style={[styles.stepBody, last && styles.stepBodyLast]}>
                <ThemedText style={styles.stepLabel}>{step.label}</ThemedText>
                {step.detail && (
                  <ThemedText type="small" themeColor="textSecondary">
                    {step.detail}
                  </ThemedText>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </CardSection>
  );
}

const styles = StyleSheet.create({
  tableFrame: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.medium,
    overflow: 'hidden',
  },
  tr: {
    flexDirection: 'row',
  },
  td: {
    paddingVertical: Spacing.two + Spacing.one,
    paddingHorizontal: Spacing.three - Spacing.one,
  },
  firstCol: {
    fontWeight: 600,
  },
  step: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  rail: {
    alignItems: 'center',
  },
  // Serif numerals in a pale green ring: the card's "numbered steps" look.
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: {
    fontFamily: Fonts.serif,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: 600,
  },
  line: {
    width: StyleSheet.hairlineWidth * 2,
    flex: 1,
    minHeight: Spacing.three,
    marginVertical: Spacing.one,
  },
  stepBody: {
    flex: 1,
    gap: Spacing.half,
    paddingTop: Spacing.half,
    paddingBottom: Spacing.four,
  },
  stepBodyLast: {
    paddingBottom: 0,
  },
  stepLabel: {
    fontWeight: 600,
  },
});
