import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSettingsStore } from '@/store/settingsStore';
import { startMusic, stopMusic } from '@/utils/audio';
import { getAppPalette } from '@/theme/worlds';

// ── Reusable toggle row ──────────────────────────────────────────────────────
function ToggleRow({
  label,
  description,
  value,
  onPress,
  textColor,
  accentColor,
}: {
  label: string;
  description?: string;
  value: boolean;
  onPress: () => void;
  textColor: string;
  accentColor: string;
}) {
  const styles = useMemo(
    () => createToggleStyles(textColor, accentColor, value),
    [accentColor, textColor, value],
  );

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.labelWrap}>
        <Text style={styles.label}>{label}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <View style={styles.track}>
        <View style={styles.thumb} />
      </View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const appearanceMode     = useSettingsStore((state) => state.appearanceMode);
  const sfxVolume          = useSettingsStore((state) => state.sfxVolume);
  const musicVolume        = useSettingsStore((state) => state.musicVolume);
  const hapticsEnabled     = useSettingsStore((state) => state.hapticsEnabled);
  const timerModeEnabled   = useSettingsStore((state) => state.timerModeEnabled);
  const soundEnabled       = useSettingsStore((state) => state.soundEnabled);
  const musicEnabled       = useSettingsStore((state) => state.musicEnabled);
  const language           = useSettingsStore((state) => state.language);

  const toggleAppearanceMode = useSettingsStore((state) => state.toggleAppearanceMode);
  const setSfxVolume         = useSettingsStore((state) => state.setSfxVolume);
  const setMusicVolume       = useSettingsStore((state) => state.setMusicVolume);
  const toggleHaptics        = useSettingsStore((state) => state.toggleHaptics);
  const toggleTimerMode      = useSettingsStore((state) => state.toggleTimerMode);
  const toggleSound          = useSettingsStore((state) => state.toggleSound);
  const toggleMusic          = useSettingsStore((state) => state.toggleMusic);
  const setLanguage          = useSettingsStore((state) => state.setLanguage);

  const palette = getAppPalette(appearanceMode);
  const styles  = useMemo(() => createStyles(palette), [palette]);

  function handleToggleMusic() {
    const next = !musicEnabled;
    toggleMusic();
    if (next) {
      void startMusic('peaceful_koto');
    } else {
      void stopMusic();
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.back}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* ── Audio section ───────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔊 Audio</Text>

          <ToggleRow
            label={`Sound Effects: ${soundEnabled ? 'ON' : 'OFF'}`}
            description="Tile taps, matches and combos"
            value={soundEnabled}
            onPress={toggleSound}
            textColor={palette.primaryText}
            accentColor={palette.buttonText}
          />

          <ToggleRow
            label={`Background Music: ${musicEnabled ? 'ON' : 'OFF'}`}
            description="Ambient healing music"
            value={musicEnabled}
            onPress={handleToggleMusic}
            textColor={palette.primaryText}
            accentColor={palette.buttonText}
          />

          <View>
            <Text style={styles.sliderLabel}>SFX Volume</Text>
            <Slider
              value={sfxVolume}
              onValueChange={setSfxVolume}
              minimumValue={0}
              maximumValue={1}
              minimumTrackTintColor={palette.buttonText}
              maximumTrackTintColor={palette.border}
              thumbTintColor={palette.buttonText}
            />
          </View>

          <View>
            <Text style={styles.sliderLabel}>Music Volume</Text>
            <Slider
              value={musicVolume}
              onValueChange={async (val) => {
                setMusicVolume(val);
                // Live-update the currently playing track volume
                if (musicEnabled) {
                  await startMusic('peaceful_koto');
                }
              }}
              minimumValue={0}
              maximumValue={1}
              minimumTrackTintColor={palette.buttonText}
              maximumTrackTintColor={palette.border}
              thumbTintColor={palette.buttonText}
            />
          </View>
        </View>

        {/* ── Display section ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎨 Display</Text>

          <ToggleRow
            label={`Theme: ${appearanceMode === 'dark' ? 'Dark' : 'Light'}`}
            value={appearanceMode === 'dark'}
            onPress={toggleAppearanceMode}
            textColor={palette.primaryText}
            accentColor={palette.buttonText}
          />

          <ToggleRow
            label={`Haptics: ${hapticsEnabled ? 'ON' : 'OFF'}`}
            description="Vibration feedback on tile press"
            value={hapticsEnabled}
            onPress={toggleHaptics}
            textColor={palette.primaryText}
            accentColor={palette.buttonText}
          />

          <ToggleRow
            label={`Timer HUD: ${timerModeEnabled ? 'ON' : 'OFF'}`}
            description="Show countdown timer during play"
            value={timerModeEnabled}
            onPress={toggleTimerMode}
            textColor={palette.primaryText}
            accentColor={palette.buttonText}
          />
        </View>

        {/* ── Language section ────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌐 Language</Text>
          <View style={styles.languageRow}>
            <Pressable
              style={language === 'en' ? styles.languageActive : styles.languageChip}
              onPress={() => setLanguage('en')}
            >
              <Text style={language === 'en' ? styles.languageActiveText : styles.languageText}>
                English
              </Text>
            </Pressable>
            <Pressable
              style={language === 'hi' ? styles.languageActive : styles.languageChip}
              onPress={() => setLanguage('hi')}
            >
              <Text style={language === 'hi' ? styles.languageActiveText : styles.languageText}>
                हिन्दी
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ── About / links section ───────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ About</Text>

          <Pressable style={styles.linkRow} onPress={() => Linking.openURL('https://mahjongrelax.app/rate')}>
            <Text style={styles.linkText}>⭐ Rate the app</Text>
          </Pressable>

          <Pressable style={styles.linkRow} onPress={() => Linking.openURL('https://mahjongrelax.app/privacy')}>
            <Text style={styles.linkText}>🔒 Privacy Policy</Text>
          </Pressable>

          <Pressable style={styles.linkRow} onPress={() => Linking.openURL('mailto:support@mahjongrelax.app')}>
            <Text style={styles.linkText}>✉️ Contact Support</Text>
          </Pressable>

          <Text style={styles.version}>
            Mahjong Relax · v{Constants.expoConfig?.version ?? '1.0.0'}
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
function createStyles(palette: ReturnType<typeof getAppPalette>) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: palette.background,
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 32,
      gap: 18,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 4,
    },
    back: {
      color: palette.primaryText,
      fontSize: 15,
      fontWeight: '700',
    },
    title: {
      color: palette.primaryText,
      fontSize: 30,
      fontWeight: '700',
      fontFamily: 'serif',
    },
    headerSpacer: {
      width: 42,
    },
    section: {
      borderRadius: 24,
      paddingHorizontal: 18,
      paddingVertical: 18,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.border,
      gap: 18,
    },
    sectionTitle: {
      color: palette.primaryText,
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: 0.4,
    },
    sliderLabel: {
      color: palette.secondaryText,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginBottom: 2,
    },
    languageRow: {
      flexDirection: 'row',
      gap: 10,
    },
    languageChip: {
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: palette.border,
    },
    languageActive: {
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: palette.buttonText,
      backgroundColor: palette.buttonBackground,
    },
    languageText: {
      color: palette.primaryText,
      fontSize: 14,
      fontWeight: '700',
    },
    languageActiveText: {
      color: palette.buttonText,
      fontSize: 14,
      fontWeight: '800',
    },
    linkRow: {
      paddingVertical: 4,
    },
    linkText: {
      color: palette.primaryText,
      fontSize: 15,
      fontWeight: '700',
    },
    version: {
      color: palette.secondaryText,
      fontSize: 12,
      fontWeight: '600',
      marginTop: 4,
    },
  });
}

function createToggleStyles(textColor: string, accentColor: string, value: boolean) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    labelWrap: {
      flex: 1,
      gap: 2,
      paddingRight: 12,
    },
    label: {
      color: textColor,
      fontSize: 15,
      fontWeight: '700',
    },
    description: {
      color: textColor,
      fontSize: 12,
      opacity: 0.55,
    },
    track: {
      width: 52,
      height: 30,
      borderRadius: 999,
      backgroundColor: value ? accentColor : 'rgba(255,255,255,0.16)',
      justifyContent: 'center',
      paddingHorizontal: 4,
      alignItems: value ? 'flex-end' : 'flex-start',
    },
    thumb: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: '#FFFFFF',
    },
  });
}
