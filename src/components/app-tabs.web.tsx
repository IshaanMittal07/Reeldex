import { TabList, TabSlot, TabTrigger, Tabs, type TabListProps, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from './themed-text';

import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Bottom tab bar for the Home Screen web app: thumb-reachable, and padded for
// the iPhone home indicator (env(safe-area-inset-bottom)).
export default function AppTabs() {
  return (
    <Tabs style={styles.tabs}>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <BottomBar>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon="library">Library</TabButton>
          </TabTrigger>
          <TabTrigger name="settings" href="/settings" asChild>
            <TabButton icon="settings">Settings</TabButton>
          </TabTrigger>
        </BottomBar>
      </TabList>
    </Tabs>
  );
}

// Tiny View-drawn icons so the bar needs no icon font or SVG library.
function TabIcon({ name, color }: { name: 'library' | 'settings'; color: string }) {
  if (name === 'library') {
    return (
      <View style={styles.icon}>
        <View style={[styles.stackBack, { borderColor: color }]} />
        <View style={[styles.stackFront, { borderColor: color }]} />
      </View>
    );
  }
  return (
    <View style={styles.icon}>
      <View style={[styles.ring, { borderColor: color }]}>
        <View style={[styles.ringDot, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

function TabButton({
  children,
  isFocused,
  icon,
  ...props
}: TabTriggerSlotProps & { icon: 'library' | 'settings' }) {
  const theme = useTheme();
  const color = isFocused ? theme.accent : theme.textTertiary;
  return (
    <Pressable {...props} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <View style={[styles.buttonInner, isFocused && { backgroundColor: theme.accentSoft }]}>
        <TabIcon name={icon} color={color} />
        <ThemedText type="smallBold" style={[styles.label, { color }]}>
          {children}
        </ThemedText>
      </View>
    </Pressable>
  );
}

function BottomBar(props: TabListProps) {
  const theme = useTheme();
  return (
    <View
      style={[styles.bar, { backgroundColor: theme.surface, borderTopColor: theme.border }, homeIndicatorPadding]}>
      <View {...props} style={styles.barInner} />
    </View>
  );
}

// CSS env() is web-only, so it lives outside StyleSheet's native typings.
const homeIndicatorPadding = { paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' } as unknown as ViewStyle;

const ICON = 18;

const styles = StyleSheet.create({
  tabs: {
    flex: 1,
  },
  slot: {
    flex: 1,
  },
  bar: {
    paddingTop: Spacing.one + Spacing.half,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  barInner: {
    flexDirection: 'row',
    gap: Spacing.two,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
  },
  button: {
    flex: 1,
  },
  buttonInner: {
    alignItems: 'center',
    gap: Spacing.half,
    paddingVertical: Spacing.one + Spacing.half,
    borderRadius: Radius.medium,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.6,
  },
  icon: {
    width: ICON,
    height: ICON,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Two stacked cards, echoing the logo.
  stackBack: {
    position: 'absolute',
    top: 1,
    width: 10,
    height: 3,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  stackFront: {
    position: 'absolute',
    bottom: 1,
    width: 14,
    height: 12,
    borderWidth: 1.5,
    borderRadius: 3,
  },
  ring: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});
