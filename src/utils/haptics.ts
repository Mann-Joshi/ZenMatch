import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useSettingsStore } from '@/store/settingsStore';

async function runHaptic(callback: () => Promise<void>): Promise<void> {
  if (Platform.OS === 'web' || !useSettingsStore.getState().hapticsEnabled) {
    return;
  }

  try {
    await callback();
  } catch {
    return;
  }
}

export async function hapticTileSelect(): Promise<void> {
  await runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

export async function hapticTileMatch(): Promise<void> {
  await runHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

export async function hapticNoMatch(): Promise<void> {
  await runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

export async function hapticLevelComplete(): Promise<void> {
  if (Platform.OS === 'web' || !useSettingsStore.getState().hapticsEnabled) {
    return;
  }

  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise((resolve) => setTimeout(resolve, 80));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((resolve) => setTimeout(resolve, 80));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    return;
  }
}

export async function hapticBoardStuck(): Promise<void> {
  await runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
}

export async function hapticHint(): Promise<void> {
  await runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}
