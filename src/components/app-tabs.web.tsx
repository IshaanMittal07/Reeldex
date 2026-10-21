import { TabList, TabSlot, TabTrigger, Tabs, type TabListProps, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { MaxContentWidth, Spacing } from '@/constants/theme';

// Bottom tab bar for the Home Screen web app: thumb-reachable, and padded for
// the iPhone home indicator (env(safe-area-inset-bottom)).
export default function AppTabs() {
  return (
    <Tabs style={styles.tabs}>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <BottomBar>
          <TabTrigger name="index" href="/" asChild>
            <TabButton>Library</TabButton>
          </TabTrigger>
          <TabTrigger name="settings" href="/settings" asChild>
            <TabButton>Settings</TabButton>
          </TabTrigger>
        </BottomBar>
      </TabList>
    </Tabs>
  );
}

function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <ThemedView type={isFocused ? 'backgroundSelected' : 'backgroundElement'} style={styles.buttonInner}>
        <ThemedText type="smallBold" themeColor={isFocused ? 'text' : 'textSecondary'}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

function BottomBar(props: TabListProps) {
  return (
    <ThemedView type="backgroundElement" style={[styles.bar, homeIndicatorPadding]}>
      <View {...props} style={styles.barInner} />
    </ThemedView>
  );
}

// CSS env() is web-only, so it lives outside StyleSheet's native typings.
const homeIndicatorPadding = { paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' } as unknown as ViewStyle;

const styles = StyleSheet.create({
  tabs: {
    flex: 1,
  },
  slot: {
    flex: 1,
  },
  bar: {
    paddingTop: Spacing.two,
    alignItems: 'center',
  },
  barInner: {
    flexDirection: 'row',
    gap: Spacing.two,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
  },
  button: {
    flex: 1,
  },
  buttonInner: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
});
