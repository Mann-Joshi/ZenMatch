import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { Platform } from 'react-native';

import { useSettingsStore } from '@/store/settingsStore';

type SfxName =
  | 'tile_select'
  | 'tile_match'
  | 'tile_no_match'
  | 'level_complete'
  | 'board_stuck'
  | 'hint_reveal'
  | 'combo';

type MusicTrack =
  | 'peaceful_koto'
  | 'bamboo_breeze'
  | 'temple_night'
  | 'ocean_calm'
  | 'imperial_gold';

// ─── SFX sources ─────────────────────────────────────────────────────────────
// The actual files the user placed in assets/audio/ use .wav for most sfx.
// We map each logical name to its real asset. If a file is absent the require()
// will still resolve at build time (Metro bundles what it finds), but we guard
// against runtime errors with try/catch in playSource().
const sfxSources: Record<SfxName, number> = {
  tile_select:    require('../../assets/audio/tile_select.wav'),
  tile_match:     require('../../assets/audio/tile_match.wav'),
  tile_no_match:  require('../../assets/audio/tile_no_match.wav'),
  level_complete: require('../../assets/audio/level_complete.mp3'),
  board_stuck:    require('../../assets/audio/dragon-studio-game-over-retro-8bit-sfx-499656.mp3'),
  hint_reveal:    require('../../assets/audio/hint_reveal.wav'),
  combo:          require('../../assets/audio/combo.mp3'),
};

// ─── Music sources ────────────────────────────────────────────────────────────
// The user's background music file (healing frequencies track) is mapped to
// all world music slots so every world plays the single available track.
// When more tracks are added, replace the individual entries.
const BG_MUSIC = require('../../assets/audio/Background music - Triple Healing Frequency 396Hz + 639Hz + 963Hz - MBS Body & Spirit.mp3');

const musicSources: Record<MusicTrack, number> = {
  peaceful_koto:  BG_MUSIC,
  bamboo_breeze:  BG_MUSIC,
  temple_night:   BG_MUSIC,
  ocean_calm:     BG_MUSIC,
  imperial_gold:  BG_MUSIC,
};

let currentMusic: Audio.Sound | null = null;
let currentTrack: MusicTrack | null = null;

export async function primeAudioEngine(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  } catch {
    // Silently ignore — audio will still work on most devices
  }
}

async function playSource(source: number, volume: number, loop = false): Promise<Audio.Sound | null> {
  // Skip on web (no expo-av support) or if volume is zero
  if (Platform.OS === 'web' || volume <= 0) {
    return null;
  }

  try {
    const sound = new Audio.Sound();
    await sound.loadAsync(source);
    await sound.setVolumeAsync(volume);
    await sound.setIsLoopingAsync(loop);
    await sound.playAsync();

    if (!loop) {
      sound.setOnPlaybackStatusUpdate((status) => {
        if ('didJustFinish' in status && status.didJustFinish) {
          void sound.unloadAsync();
        }
      });
    }

    return sound;
  } catch {
    // Gracefully ignore missing or corrupt audio files — no crash
    return null;
  }
}

export async function playSfx(name: SfxName): Promise<void> {
  const settings = useSettingsStore.getState();
  // Respect the soundEnabled toggle — if sound is off, do nothing
  if (!settings.soundEnabled) {
    return;
  }
  const volume = settings.sfxVolume;
  await playSource(sfxSources[name], volume, false);
}

export async function playWorldMusic(track: MusicTrack): Promise<void> {
  const settings = useSettingsStore.getState();
  // Respect the musicEnabled toggle
  if (!settings.musicEnabled || Platform.OS === 'web') {
    return;
  }
  const volume = settings.musicVolume;
  if (volume <= 0) {
    return;
  }

  // Same track already playing at the right volume — just update volume
  if (currentTrack === track && currentMusic) {
    try {
      await currentMusic.setVolumeAsync(volume);
    } catch {
      // Ignore
    }
    return;
  }

  await stopWorldMusic();
  currentTrack = track;
  currentMusic = await playSource(musicSources[track], volume, true);
}

export async function stopWorldMusic(): Promise<void> {
  if (!currentMusic) {
    currentTrack = null;
    return;
  }

  try {
    await currentMusic.stopAsync();
    await currentMusic.unloadAsync();
  } catch {
    // Ignore
  } finally {
    currentMusic = null;
    currentTrack = null;
  }
}

// ─── Convenience helpers (used by audioManager-style callers) ─────────────────
export const playTap   = (): Promise<void> => playSfx('tile_select');
export const playMatch = (): Promise<void> => playSfx('tile_match');
export const playWin   = (): Promise<void> => playSfx('level_complete');
export const startMusic = (track: MusicTrack = 'peaceful_koto'): Promise<void> => playWorldMusic(track);
export const stopMusic  = (): Promise<void> => stopWorldMusic();
