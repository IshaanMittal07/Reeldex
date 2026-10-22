import { useColorScheme as useSystemColorScheme } from 'react-native';

import { useAppearance } from '@/lib/appearance';

// The Settings choice wins; "system" follows the phone.
export function useColorScheme() {
  const system = useSystemColorScheme();
  const appearance = useAppearance();
  return appearance === 'system' ? system : appearance;
}
