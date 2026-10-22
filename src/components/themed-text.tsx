import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'title'
    | 'subtitle'
    | 'heading'
    | 'eyebrow'
    | 'small'
    | 'smallBold'
    | 'link'
    | 'linkPrimary'
    | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? (type === 'linkPrimary' ? 'accent' : 'text')] },
        styles.base,
        styles[type],
        style,
      ]}
      {...rest}
    />
  );
}

// Serif for titles (reads like a document), Inter for everything else.
const styles = StyleSheet.create({
  base: {
    fontFamily: Fonts.sans,
  },
  default: {
    fontSize: 16,
    lineHeight: 25,
    fontWeight: 400,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 40,
    lineHeight: 46,
    fontWeight: 600,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontFamily: Fonts.serif,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: 600,
    letterSpacing: -0.4,
  },
  heading: {
    fontFamily: Fonts.serif,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: 600,
    letterSpacing: -0.2,
  },
  eyebrow: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: 600,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 400,
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 600,
  },
  link: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 500,
  },
  linkPrimary: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 600,
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});
