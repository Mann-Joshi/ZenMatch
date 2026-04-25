import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type LanguageCode = 'en' | 'hi';
export type AppearanceMode = 'dark' | 'light';

interface SettingsState {
  appearanceMode: AppearanceMode;
  sfxVolume: number;
  musicVolume: number;
  hapticsEnabled: boolean;
  timerModeEnabled: boolean;
  language: LanguageCode;
  /** Master on/off for all sound effects */
  soundEnabled: boolean;
  /** Master on/off for background music */
  musicEnabled: boolean;

  toggleAppearanceMode: () => void;
  setSfxVolume: (value: number) => void;
  setMusicVolume: (value: number) => void;
  toggleHaptics: () => void;
  toggleTimerMode: () => void;
  setLanguage: (value: LanguageCode) => void;
  toggleSound: () => void;
  toggleMusic: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      appearanceMode: 'dark',
      sfxVolume: 0.75,
      musicVolume: 0.55,
      hapticsEnabled: true,
      timerModeEnabled: false,
      language: 'en',
      soundEnabled: true,
      musicEnabled: false, // off by default — user opts in

      toggleAppearanceMode: () =>
        set((state) => ({
          appearanceMode: state.appearanceMode === 'dark' ? 'light' : 'dark',
        })),
      setSfxVolume: (value) => set({ sfxVolume: Math.max(0, Math.min(1, value)) }),
      setMusicVolume: (value) => set({ musicVolume: Math.max(0, Math.min(1, value)) }),
      toggleHaptics: () => set((state) => ({ hapticsEnabled: !state.hapticsEnabled })),
      toggleTimerMode: () => set((state) => ({ timerModeEnabled: !state.timerModeEnabled })),
      setLanguage: (value) => set({ language: value }),
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      toggleMusic: () => set((state) => ({ musicEnabled: !state.musicEnabled })),
    }),
    {
      name: 'mahjongrelax-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
