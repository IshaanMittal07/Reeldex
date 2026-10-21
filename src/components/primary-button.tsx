import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  title: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  tone?: 'accent' | 'warning';
};

export function PrimaryButton({ title, onPress, busy, disabled, tone = 'accent' }: Props) {
  const theme = useTheme();
  const inactive = busy || disabled;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme[tone] },
        (pressed || inactive) && styles.dim,
      ]}>
      {busy ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.label}>{title}</ThemedText>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  label: {
    color: '#fff',
    fontWeight: 700,
  },
  dim: {
    opacity: 0.6,
  },
});
