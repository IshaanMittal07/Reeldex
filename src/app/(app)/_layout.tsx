import { Stack } from 'expo-router';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function AppLayout() {
  const theme = useTheme();
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/* The header melts into the paper page: same colour, no shadow, emerald back button. */}
      <Stack.Screen
        name="card/[id]"
        options={{
          title: '',
          headerBackTitle: 'Library',
          headerTintColor: theme.accent,
          headerStyle: { backgroundColor: theme.background },
          headerShadowVisible: false,
          headerBackTitleStyle: { fontFamily: Fonts.sans },
          contentStyle: { backgroundColor: theme.background },
        }}
      />
    </Stack>
  );
}
