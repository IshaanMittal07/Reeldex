import type { PropsWithChildren } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { CopyButton } from './copy-button';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import type { KeyPoint, Resource } from '@/lib/types';

export function Section({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {title.toUpperCase()}
      </ThemedText>
      {children}
    </View>
  );
}

export function Warnings({ warnings }: { warnings: string[] }) {
  if (!warnings.length) return null;
  return (
    <ThemedView type="warningBackground" style={styles.box}>
      {warnings.map((w) => (
        <ThemedText key={w} type="small" themeColor="warning">
          ⚠️ {w}
        </ThemedText>
      ))}
    </ThemedView>
  );
}

export function KeyPoints({ points }: { points: KeyPoint[] }) {
  if (!points.length) return null;
  return (
    <Section title="Key points">
      {points.map((p, i) => (
        <View key={i} style={styles.pointRow}>
          <ThemedText type="code" themeColor="textSecondary" style={styles.timestamp}>
            {p.timestamp}
          </ThemedText>
          <ThemedText style={styles.flex}>
            {p.text}
            {p.uncertain && <ThemedText themeColor="warning"> (unclear in video)</ThemedText>}
          </ThemedText>
        </View>
      ))}
    </Section>
  );
}

export function ActionItems({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <Section title="Do this">
      {items.map((item, i) => (
        <ThemedText key={i}>
          {i + 1}. {item}
        </ThemedText>
      ))}
      <CopyButton text={items.map((t, i) => `${i + 1}. ${t}`).join('\n')} label="Copy checklist" />
    </Section>
  );
}

export function Resources({ resources }: { resources: Resource[] }) {
  if (!resources.length) return null;
  return (
    <Section title="Resources">
      {resources.map((r) => (
        <View key={r.name} style={styles.pointRow}>
          <ThemedText style={styles.flex}>
            {r.name} <ThemedText themeColor="textSecondary">· {r.type}</ThemedText>
            {r.uncertain && <ThemedText themeColor="warning"> (unclear)</ThemedText>}
          </ThemedText>
          {r.url_if_shown && (
            <Pressable onPress={() => Linking.openURL(r.url_if_shown!)} accessibilityRole="link">
              <ThemedText type="linkPrimary">Open</ThemedText>
            </Pressable>
          )}
        </View>
      ))}
    </Section>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  box: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  pointRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'baseline',
  },
  timestamp: {
    minWidth: 40,
  },
  flex: {
    flex: 1,
  },
});
