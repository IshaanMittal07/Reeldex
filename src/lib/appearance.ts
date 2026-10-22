// Light / dark / system choice from Settings, kept in localStorage (SQLite-backed
// on native) so it survives restarts. Defaults to light.
import 'expo-sqlite/localStorage/install';

import { useSyncExternalStore } from 'react';

export type Appearance = 'system' | 'light' | 'dark';

const KEY = 'reeldex.appearance';
const listeners = new Set<() => void>();

function read(): Appearance {
  try {
    const value = localStorage.getItem(KEY);
    return value === 'system' || value === 'dark' ? value : 'light';
  } catch {
    return 'light';
  }
}

let current = read();

export function setAppearance(value: Appearance) {
  current = value;
  try {
    localStorage.setItem(KEY, value);
  } catch {}
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAppearance() {
  return useSyncExternalStore(subscribe, () => current, () => current);
}
