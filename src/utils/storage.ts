import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export const STORAGE_KEYS = {
  introSeen: 'zenmatch.introSeen',
  launchCount: 'zenmatch.launchCount',
  dailyState: 'zenmatch.dailyState',
  premiumState: 'zenmatch.premiumState',
} as const;

export async function readJsonValue<T>(key: string, fallback: T): Promise<T> {
  const rawValue = await AsyncStorage.getItem(key);
  if (!rawValue) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
}

export async function writeJsonValue<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function readSecureValue(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function writeSecureValue(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    return;
  }
}

export async function hasSeenIntro(): Promise<boolean> {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.introSeen);
  return value === 'true';
}

export async function markIntroSeen(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.introSeen, 'true');
}

export async function incrementLaunchCount(): Promise<number> {
  const rawValue = await AsyncStorage.getItem(STORAGE_KEYS.launchCount);
  const nextCount = Number(rawValue ?? '0') + 1;
  await AsyncStorage.setItem(STORAGE_KEYS.launchCount, String(nextCount));
  return nextCount;
}
