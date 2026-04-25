import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useSettingsStore } from '@/store/settingsStore';
import { primeAudioEngine, startMusic, stopMusic } from '@/utils/audio';

export default function RootLayout() {
  const appearanceMode = useSettingsStore((state) => state.appearanceMode);
  const musicEnabled = useSettingsStore((state) => state.musicEnabled);

  // Prime the audio engine once on mount
  useEffect(() => {
    void primeAudioEngine();
  }, []);

  // Update system UI background color when appearance changes
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(appearanceMode === 'dark' ? '#0A0F1E' : '#F5EFE4');
  }, [appearanceMode]);

  // Auto-start or stop ambient music based on user's musicEnabled setting
  useEffect(() => {
    if (musicEnabled) {
      void startMusic('peaceful_koto');
    } else {
      void stopMusic();
    }
  }, [musicEnabled]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style={appearanceMode === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="home" />
          <Stack.Screen name="game/[world]/[level]" />
          <Stack.Screen name="world-map" />
          <Stack.Screen name="daily" />
          <Stack.Screen name="shop" />
          <Stack.Screen name="settings" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
