import { useSyncExternalStore } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

import { useAppearance } from '@/lib/appearance';

const subscribe = () => () => {};

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  // false during static/server render, true once running on the client
  const hasHydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const system = useSystemColorScheme();
  const appearance = useAppearance();

  if (!hasHydrated) return 'light';
  return appearance === 'system' ? system : appearance;
}
