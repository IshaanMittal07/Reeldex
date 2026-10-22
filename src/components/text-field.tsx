import { useState } from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function TextField({ style, onFocus, onBlur, ...props }: TextInputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      placeholderTextColor={theme.textTertiary}
      selectionColor={theme.accent}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      style={[
        styles.input,
        {
          color: theme.text,
          backgroundColor: theme.surface,
          borderColor: focused ? theme.accent : theme.border,
        },
        // A soft accent halo while focused.
        focused && { boxShadow: `0 0 0 3px ${theme.accentSoft}` },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    fontFamily: Fonts.sans,
    // 16px keeps iOS Safari from zooming in on focus.
    fontSize: 16,
    lineHeight: 22,
    paddingVertical: Spacing.two + Spacing.one,
    paddingHorizontal: Spacing.three - Spacing.half,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    // The focus border and halo replace the browser's outline on web.
    outlineWidth: 0,
  },
});
