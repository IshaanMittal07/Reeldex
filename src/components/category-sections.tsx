import { StyleSheet, View } from 'react-native';

import { CardSection } from './card-sections';
import { CopyButton } from './copy-button';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
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

function List({ title, items, marker = 'text' }: { title: string; items: string[]; marker?: ThemeColor }) {
  const theme = useTheme();
  if (!items.length) return null;
  return (
    <CardSection title={title}>
      <View style={styles.list}>
        {items.map((item, i) => (
          <View key={i} style={styles.bulletRow}>
            <View style={[styles.bullet, { backgroundColor: theme[marker] }]} />
            <ThemedText style={styles.flex}>{item}</ThemedText>
          </View>
        ))}
      </View>
    </CardSection>
  );
}

// Short items (tools, section names, slots) read better as chips than bullets.
function Chips({ title, items }: { title: string; items: string[] }) {
  const theme = useTheme();
  if (!items.length) return null;
  return (
    <CardSection title={title}>
      <View style={styles.chips}>
        {items.map((item, i) => (
          <View key={i} style={[styles.chip, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <ThemedText type="small">{item}</ThemedText>
          </View>
        ))}
      </View>
    </CardSection>
  );
}

function ResumeSection({ resume }: { resume: NonNullable<CardData['resume']> }) {
  const theme = useTheme();
  return (
    <>
      <List title="Do" items={resume.do} marker="accent" />
      <List title="Don't" items={resume.dont} marker="warning" />
      {resume.before_after_examples.length > 0 && (
        <CardSection title="Before → after">
          {resume.before_after_examples.map((ex, i) => (
            <View key={i} style={[styles.card, { borderColor: theme.border, backgroundColor: theme.surface }]}>
              <View style={styles.cardPart}>
                <ThemedText type="eyebrow" themeColor="textTertiary">
                  Before
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {ex.before}
                </ThemedText>
              </View>
              <ThemedView type="accentSoft" style={styles.after}>
                <ThemedText type="eyebrow" themeColor="accent">
                  After
                </ThemedText>
                <ThemedText selectable>{ex.after}</ThemedText>
              </ThemedView>
            </View>
          ))}
        </CardSection>
      )}
      <Chips title="Sections mentioned" items={resume.sections_mentioned} />
      <Chips title="Tools" items={resume.tools} />
    </>
  );
}

function ColdDmSection({ coldDm }: { coldDm: NonNullable<CardData['cold_dm']> }) {
  const theme = useTheme();
  return (
    <>
      {coldDm.templates.length > 0 && (
        <CardSection title={coldDm.templates.length > 1 ? 'Templates' : 'Template'}>
          {coldDm.templates.map((t, i) => (
            <View key={i} style={[styles.card, styles.template, { borderColor: theme.border, backgroundColor: theme.surface }]}>
              <View style={styles.templateHeader}>
                <ThemedText type="eyebrow" themeColor="textTertiary" style={styles.flex}>
                  {[t.platform, t.purpose].filter(Boolean).join(' · ') || `Template ${i + 1}`}
                </ThemedText>
                <CopyButton text={t.text} label="Copy" />
              </View>
              <ThemedText selectable style={styles.templateText}>
                {t.text}
              </ThemedText>
            </View>
          ))}
        </CardSection>
      )}
      {coldDm.follow_up_rules && (
        <CardSection title="Follow-up">
          <ThemedText>{coldDm.follow_up_rules}</ThemedText>
        </CardSection>
      )}
      <Chips title="Personalize" items={coldDm.personalization_slots} />
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.two + Spacing.one,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: Spacing.three - Spacing.one,
  },
  // Centred on the first 25px line of body text.
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 10,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three - Spacing.one,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.medium,
    overflow: 'hidden',
  },
  cardPart: {
    gap: Spacing.one,
    padding: Spacing.three,
  },
  after: {
    gap: Spacing.one,
    padding: Spacing.three,
  },
  template: {
    gap: Spacing.two,
    padding: Spacing.three,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  templateText: {
    lineHeight: 26,
  },
  flex: {
    flex: 1,
  },
});
