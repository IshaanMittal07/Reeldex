import { StyleSheet, View } from 'react-native';

import { Section } from './card-sections';
import { CopyButton } from './copy-button';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import type { CardData } from '@/lib/types';

// Category-specific blocks (plan Section 5.3). Only resume and cold DMs have
// structured fields so far; other categories render from the shared sections.
export function CategorySections({ data }: { data: CardData }) {
  return (
    <>
      {data.resume && <ResumeSection resume={data.resume} />}
      {data.cold_dm && <ColdDmSection coldDm={data.cold_dm} />}
    </>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <Section title={title}>
      {items.map((item, i) => (
        <ThemedText key={i}>• {item}</ThemedText>
      ))}
    </Section>
  );
}

function ResumeSection({ resume }: { resume: NonNullable<CardData['resume']> }) {
  return (
    <>
      <List title="Do" items={resume.do} />
      <List title="Don't" items={resume.dont} />
      {resume.before_after_examples.length > 0 && (
        <Section title="Before → after">
          {resume.before_after_examples.map((ex, i) => (
            <ThemedView key={i} type="backgroundElement" style={styles.box}>
              <ThemedText type="small" themeColor="textSecondary">
                {ex.before}
              </ThemedText>
              <ThemedText>→ {ex.after}</ThemedText>
            </ThemedView>
          ))}
        </Section>
      )}
      <List title="Sections mentioned" items={resume.sections_mentioned} />
      <List title="Tools" items={resume.tools} />
    </>
  );
}

function ColdDmSection({ coldDm }: { coldDm: NonNullable<CardData['cold_dm']> }) {
  return (
    <>
      {coldDm.templates.length > 0 && (
        <Section title="Templates">
          {coldDm.templates.map((t, i) => (
            <ThemedView key={i} type="backgroundElement" style={styles.box}>
              {(t.platform || t.purpose) && (
                <ThemedText type="small" themeColor="textSecondary">
                  {[t.platform, t.purpose].filter(Boolean).join(' · ')}
                </ThemedText>
              )}
              <ThemedText selectable>{t.text}</ThemedText>
              <View style={styles.copyRow}>
                <CopyButton text={t.text} label="Copy template" />
              </View>
            </ThemedView>
          ))}
        </Section>
      )}
      {coldDm.follow_up_rules && (
        <Section title="Follow-up">
          <ThemedText>{coldDm.follow_up_rules}</ThemedText>
        </Section>
      )}
      <List title="Personalize" items={coldDm.personalization_slots} />
    </>
  );
}

const styles = StyleSheet.create({
  box: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  copyRow: {
    alignItems: 'flex-end',
  },
});
