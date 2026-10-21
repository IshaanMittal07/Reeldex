import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Pressable } from 'react-native';

import { ThemedText } from './themed-text';

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={async () => {
        await Clipboard.setStringAsync(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}>
      <ThemedText type="linkPrimary">{copied ? 'Copied ✓' : label}</ThemedText>
    </Pressable>
  );
}
