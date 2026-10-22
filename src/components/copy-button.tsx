import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// A small hairline pill; turns soft green for a moment once copied.
export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={async () => {
        await Clipboard.setStringAsync(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      style={({ pressed }) => [
        styles.pill,
        {
          borderColor: copied ? theme.accentSoft : theme.border,
          backgroundColor: copied ? theme.accentSoft : theme.surface,
        },
        pressed && styles.pressed,
      ]}>
      <ThemedText type="small" themeColor={copied ? 'accent' : 'textSecondary'} style={styles.label}>
        {copied ? 'Copied ✓' : label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three - Spacing.one,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: 500,
  },
  pressed: {
    opacity: 0.6,
  },
});
