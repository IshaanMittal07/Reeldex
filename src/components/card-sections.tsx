import { useState, type PropsWithChildren, type ReactNode } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { CopyButton } from './copy-button';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { KeyPoint, Resource } from '@/lib/types';

// Plain labelled group (also used by Settings).
export function Section({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <View style={styles.section}>
      <ThemedText type="eyebrow" themeColor="textSecondary">
        {title}
      </ThemedText>
      {children}
    </View>
  );
}

// A section of the card page: hairline rule, serif heading, optional action on
// the right (usually a copy pill).
export function CardSection({
  title,
  action,
  children,
}: PropsWithChildren<{ title: string; action?: ReactNode }>) {
  const theme = useTheme();
  return (
    <View style={[styles.cardSection, { borderTopColor: theme.border }]}>
      <View style={styles.cardSectionHeader}>
        <ThemedText type="heading" style={styles.flex}>
          {title}
        </ThemedText>
        {action}
      </View>
      {children}
    </View>
  );
}

// Soft tinted note with a coloured rule on the left.
export function Callout({
  tone = 'accent',
  label,
  children,
}: PropsWithChildren<{ tone?: 'accent' | 'warning'; label?: string }>) {
  const theme = useTheme();
  const warning = tone === 'warning';
  return (
    <ThemedView
      type={warning ? 'warningBackground' : 'accentSoft'}
      style={[styles.callout, { borderLeftColor: warning ? theme.warning : theme.accent }]}>
      {label && (
        <ThemedText type="eyebrow" themeColor={warning ? 'warning' : 'accent'}>
          {label}
        </ThemedText>
      )}
      {children}
    </ThemedView>
  );
}

export function TimestampPill({ value }: { value: string }) {
  return (
    <ThemedView type="accentSoft" style={styles.pill}>
      <ThemedText type="code" themeColor="accent" style={styles.pillText}>
        {value}
      </ThemedText>
    </ThemedView>
  );
}

function UnclearTag() {
  return (
    <ThemedText type="small" themeColor="warning" style={styles.unclear}>
      {'  '}unclear in video
    </ThemedText>
  );
}

export function Warnings({ warnings }: { warnings: string[] }) {
  if (!warnings.length) return null;
  return (
    <Callout tone="warning" label="Heads up">
      {warnings.map((w) => (
        <ThemedText key={w} type="small" style={styles.calloutText}>
          {w}
        </ThemedText>
      ))}
    </Callout>
  );
}

// The reel boiled down, fluff removed: the first thing to read on the page.
export function Takeaways({ items }: { items?: string[] }) {
  const theme = useTheme();
  if (!items?.length) return null;
  return (
    <View style={[styles.takeaways, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.cardSectionHeader}>
        <ThemedText type="eyebrow" themeColor="accent" style={styles.flex}>
          Key takeaways
        </ThemedText>
        <CopyButton text={items.map((t) => `• ${t}`).join('\n')} />
      </View>
      <View style={styles.list}>
        {items.map((text, i) => (
          <View key={i} style={styles.takeawayRow}>
            <View style={[styles.takeawayDot, { backgroundColor: theme.accent }]} />
            <ThemedText style={styles.flex}>{text}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

export function KeyPoints({ points }: { points: KeyPoint[] }) {
  if (!points.length) return null;
  return (
    <CardSection title="Key points">
      <View style={styles.list}>
        {points.map((p, i) => (
          <View key={i} style={styles.pointRow}>
            <View style={styles.pointStamp}>
              {p.timestamp ? <TimestampPill value={p.timestamp} /> : null}
            </View>
            <ThemedText style={styles.flex}>
              {p.text}
              {p.uncertain && <UnclearTag />}
            </ThemedText>
          </View>
        ))}
      </View>
    </CardSection>
  );
}

// Ticks are only kept while the page is open; they're for working through the
// list, not saved.
export function ActionItems({ items }: { items: string[] }) {
  const theme = useTheme();
  const [done, setDone] = useState<Set<number>>(() => new Set());
  if (!items.length) return null;

  const toggle = (i: number) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <CardSection
      title="Do this"
      action={<CopyButton text={items.map((t, i) => `${i + 1}. ${t}`).join('\n')} label="Copy" />}>
      <View style={styles.list}>
        {items.map((item, i) => {
          const checked = done.has(i);
          return (
            <Pressable
              key={i}
              onPress={() => toggle(i)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              style={styles.checkRow}>
              <View
                style={[
                  styles.box,
                  checked
                    ? { backgroundColor: theme.accent, borderColor: theme.accent }
                    : { borderColor: theme.textTertiary },
                ]}>
                {checked && (
                  <ThemedText type="smallBold" themeColor="onAccent" style={styles.tick}>
                    ✓
                  </ThemedText>
                )}
              </View>
              <ThemedText
                themeColor={checked ? 'textTertiary' : 'text'}
                style={[styles.flex, checked && styles.struck]}>
                {item}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </CardSection>
  );
}

export function Resources({ resources }: { resources: Resource[] }) {
  const theme = useTheme();
  if (!resources.length) return null;
  return (
    <CardSection title="Resources">
      <View style={[styles.resourceList, { borderColor: theme.border, backgroundColor: theme.surface }]}>
        {resources.map((r, i) => (
          <View
            key={r.name}
            style={[styles.resourceRow, i > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
            <View style={styles.resourceBody}>
              <ThemedText style={styles.resourceName}>
                {r.name}
                {r.uncertain && <UnclearTag />}
              </ThemedText>
              <ThemedText type="eyebrow" themeColor="textTertiary">
                {r.type}
              </ThemedText>
            </View>
            {r.type === 'code' && <CopyButton text={r.name} label="Copy" />}
            {r.url_if_shown && (
              <Pressable
                onPress={() => Linking.openURL(r.url_if_shown!)}
                accessibilityRole="link"
                hitSlop={8}>
                <ThemedText type="linkPrimary">Open ↗</ThemedText>
              </Pressable>
            )}
          </View>
        ))}
      </View>
    </CardSection>
  );
}

const styles = StyleSheet.create({
  takeaways: {
    gap: Spacing.three - Spacing.one,
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
  },
  takeawayRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three - Spacing.one,
  },
  // Centred on the first line of text (lineHeight 25).
  takeawayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 10,
  },
  section: {
    gap: Spacing.two,
  },
  cardSection: {
    gap: Spacing.three,
    paddingTop: Spacing.four,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cardSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  callout: {
    gap: Spacing.one,
    paddingVertical: Spacing.three - Spacing.one,
    paddingHorizontal: Spacing.three,
    borderLeftWidth: 3,
    borderRadius: Radius.small,
  },
  calloutText: {
    lineHeight: 21,
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
  pillText: {
    fontSize: 12,
    lineHeight: 17,
  },
  unclear: {
    fontStyle: 'italic',
  },
  list: {
    gap: Spacing.three,
  },
  pointRow: {
    flexDirection: 'row',
    gap: Spacing.three - Spacing.one,
  },
  // Fixed column so the text lines up whatever the timestamp's width; the
  // margin drops the pill onto the first line of text.
  pointStamp: {
    width: 52,
    marginTop: 3,
  },
  checkRow: {
    flexDirection: 'row',
    gap: Spacing.three - Spacing.one,
  },
  box: {
    width: 20,
    height: 20,
    marginTop: 2,
    borderWidth: 1.5,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: {
    fontSize: 13,
    lineHeight: 16,
  },
  struck: {
    textDecorationLine: 'line-through',
  },
  resourceList: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.medium,
  },
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three - Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  resourceBody: {
    flex: 1,
    gap: Spacing.half,
  },
  resourceName: {
    fontWeight: 500,
  },
  flex: {
    flex: 1,
  },
});
