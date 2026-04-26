import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { writeSecureValue } from '@/utils/storage';

interface ProgressState {
  currentLevel: number;
  levelStars: Record<string, number>;
  bestScores: Record<string, number>;
  worldUnlocked: number[];
  streakDays: number;
  lastPlayedDate: string;
  hasRemovedAds: boolean;
  bankedHints: number;
  bankedShuffles: number;
  /** 0-6 day index of last claimed daily reward. -1 = never claimed. */
  lastClaimedDay: number;
  /** ISO date string of last daily reward claim (used to prevent double-claiming per day). */
  lastRewardClaimDate: string;
  hydrateCurrentLevel: () => Promise<void>;
  getTotalStars: () => number;
  recordLevelResult: (world: number, level: number, stars: number, score: number) => void;
  completeDailyChallenge: (playedDate: string) => void;
  addHints: (amount: number) => void;
  addShuffles: (amount: number) => void;
  markAdsRemoved: () => void;
  claimDailyReward: (day: number) => void;
}

const worldUnlockThresholds: Record<number, number> = {
  2: 30,
  3: 80,
  4: 150,
  5: 250,
};

function normalizeDate(dateString: string): string {
  return dateString.slice(0, 10);
}

function getPreviousDate(dateString: string): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

const secureStorageAdapter = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const secureValue = await SecureStore.getItemAsync(name);
      if (secureValue !== null) {
        return secureValue;
      }

      // Fallback to AsyncStorage for migration
      const legacyValue = await AsyncStorage.getItem(name);
      if (legacyValue !== null) {
        // Migrate to SecureStore
        await SecureStore.setItemAsync(name, legacyValue);
        // Remove from AsyncStorage
        await AsyncStorage.removeItem(name);
        return legacyValue;
      }

      return null;
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch {
      return;
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
      await AsyncStorage.removeItem(name);
    } catch {
      return;
    }
  },
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      levelStars: {},
      currentLevel: 1,
      bestScores: {},
      worldUnlocked: [1],
      streakDays: 0,
      lastPlayedDate: '',
      hasRemovedAds: false,
      bankedHints: 0,
      bankedShuffles: 0,
      lastClaimedDay: -1,
      lastRewardClaimDate: '',
      hydrateCurrentLevel: async () => {
        const savedLevel = await secureStorageAdapter.getItem('currentLevel');
        const parsedLevel = Number(savedLevel);
        set({ currentLevel: Number.isFinite(parsedLevel) && parsedLevel > 0 ? parsedLevel : 1 });
      },
      getTotalStars: () => Object.values(get().levelStars).reduce((sum, value) => sum + value, 0),
      recordLevelResult: (world, level, stars, score) =>
        set((state) => {
          const key = `${world}-${level}`;
          const nextStars = Math.max(state.levelStars[key] ?? 0, stars);
          const nextScore = Math.max(state.bestScores[key] ?? 0, score);
          const levelStars = { ...state.levelStars, [key]: nextStars };
          const bestScores = { ...state.bestScores, [key]: nextScore };
          const totalStars = Object.values(levelStars).reduce((sum, value) => sum + value, 0);
          const worldUnlocked = [1];

          for (const [worldKey, threshold] of Object.entries(worldUnlockThresholds)) {
            if (totalStars >= threshold) {
              worldUnlocked.push(Number(worldKey));
            }
          }

          const currentLevel = Math.max(state.currentLevel, level + 1);
          void secureStorageAdapter.setItem('currentLevel', String(currentLevel));

          return {
            currentLevel,
            levelStars,
            bestScores,
            worldUnlocked: [...new Set(worldUnlocked)].sort((left, right) => left - right),
          };
        }),
      completeDailyChallenge: (playedDate) =>
        set((state) => {
          const normalizedPlayedDate = normalizeDate(playedDate);
          const yesterday = state.lastPlayedDate ? getPreviousDate(normalizedPlayedDate) : '';
          const streakDays =
            state.lastPlayedDate === normalizedPlayedDate
              ? state.streakDays
              : state.lastPlayedDate === yesterday
                ? state.streakDays + 1
                : 1;

          return {
            streakDays,
            lastPlayedDate: normalizedPlayedDate,
            bankedHints: state.bankedHints + 3,
            bankedShuffles: state.bankedShuffles + 1,
          };
        }),
      addHints: (amount) =>
        set((state) => ({
          bankedHints: state.bankedHints + Math.max(0, amount),
        })),
      addShuffles: (amount) =>
        set((state) => ({
          bankedShuffles: state.bankedShuffles + Math.max(0, amount),
        })),
      markAdsRemoved: () => {
        void writeSecureValue('zenmatch.hasRemovedAds', 'true');
        set({ hasRemovedAds: true });
      },
      claimDailyReward: (day) => {
        const today = new Date().toISOString().slice(0, 10);
        const state = get();
        // Prevent double-claiming same day
        if (state.lastRewardClaimDate === today && state.lastClaimedDay === day) {
          return;
        }
        // Daily reward definitions (0-indexed)
        const REWARDS: Array<{ hints: number; shuffles: number; undos: number }> = [
          { hints: 3, shuffles: 0, undos: 0 },   // Day 1
          { hints: 0, shuffles: 2, undos: 0 },   // Day 2
          { hints: 5, shuffles: 0, undos: 0 },   // Day 3
          { hints: 3, shuffles: 0, undos: 3 },   // Day 4
          { hints: 10, shuffles: 0, undos: 0 },  // Day 5
          { hints: 0, shuffles: 0, undos: 0 },   // Day 6 (remove ads 24h — handled via flag)
          { hints: 20, shuffles: 5, undos: 3 },  // Day 7 (JACKPOT)
        ];
        const reward = REWARDS[day] ?? { hints: 1, shuffles: 0, undos: 0 };
        set((s) => ({
          bankedHints: s.bankedHints + reward.hints,
          bankedShuffles: s.bankedShuffles + reward.shuffles,
          lastClaimedDay: day,
          lastRewardClaimDate: today,
        }));
      },
    }),
    {
      name: 'zenmatch-progress',
      storage: createJSONStorage(() => secureStorageAdapter),
    },
  ),
);
