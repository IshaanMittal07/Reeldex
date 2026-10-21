import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function TextField({ style, ...props }: TextInputProps) {
  const theme = useTheme();
  return (
    <TextInput
      placeholderTextColor={theme.textSecondary}
      style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    fontSize: 16,
    paddingVertical: Spacing.two + Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
});
