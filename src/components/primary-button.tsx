import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  title: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  tone?: 'accent' | 'warning';
  /** `outline` is a quieter hairline button in the tone's colour. */
  variant?: 'solid' | 'outline';
};

export function PrimaryButton({
  title,
  onPress,
  busy,
  disabled,
  tone = 'accent',
  variant = 'solid',
}: Props) {
  const theme = useTheme();
  const inactive = busy || disabled;
  const solid = variant === 'solid';
  const foreground = solid ? theme.onAccent : theme[tone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!busy }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        solid
          ? { backgroundColor: theme[tone], borderColor: theme[tone] }
          : {
              backgroundColor: pressed
                ? tone === 'warning'
                  ? theme.warningBackground
                  : theme.accentSoft
                : theme.surface,
              borderColor: theme.border,
            },
        pressed && solid && styles.pressed,
        disabled && !busy && styles.disabled,
      ]}>
      {busy ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <ThemedText type="smallBold" style={[styles.label, { color: foreground }]}>
          {title}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 15,
    letterSpacing: 0.1,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.45,
  },
});
