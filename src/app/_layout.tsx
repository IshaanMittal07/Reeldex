import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { IntroOverlay } from '@/components/intro-overlay';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SessionProvider, useSession } from '@/lib/session';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Web: paint the page behind the app (overscroll, status bar) to match.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const background = Colors[colorScheme === 'dark' ? 'dark' : 'light'].background;
    document.body.style.background = background;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', background);
  }, [colorScheme]);

  return (
    <SessionProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <RootNavigator />
        <IntroOverlay />
      </ThemeProvider>
    </SessionProvider>
  );
}

// Client-side guard only; the real protection is RLS on every table.
function RootNavigator() {
  const { session, isLoading } = useSession();
  if (isLoading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  );
}
