import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AmbientBackground } from '@/components/AmbientBackground';
import { PillButton } from '@/components/PillButton';
import { useProgressStore } from '@/store/progressStore';
import { useSettingsStore } from '@/store/settingsStore';
import { getAppPalette } from '@/theme/worlds';

export default function HomeScreen() {
  const streakDays = useProgressStore((state) => state.streakDays);
  const bankedHints = useProgressStore((state) => state.bankedHints);
  const appearanceMode = useSettingsStore((state) => state.appearanceMode);
  const palette = getAppPalette(appearanceMode);
  const pulse = useSharedValue(0);
  const ambientColors = appearanceMode === 'dark' ? ['#F0EDE6', '#D3B56A', '#FFFFFF'] : ['#D8C9AE', '#B48C5A', '#F0EDE6'];

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [pulse]);

  const styles = useMemo(() => createStyles(palette), [palette]);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.98 + pulse.value * 0.03 }],
    shadowOpacity: 0.18 + pulse.value * 0.16,
  }));

  return (
    <SafeAreaView style={styles.screen}>
      <AmbientBackground variant="home" colors={ambientColors} />

      <View style={styles.header}>
        <Text style={styles.logo}>Mahjong Relax</Text>
        <Pressable style={styles.settingsButton} onPress={() => router.push('/settings')}>
          <Text style={styles.settingsIcon}>⚙</Text>
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Text style={styles.kicker}>Mahjong Solitaire, reimagined for calm focus.</Text>

        <Animated.View style={[styles.playWrap, pulseStyle]}>
          <PillButton
            label="PLAY"
            subtitle="Resume with World 1"
            onPress={() => router.push('/game/1/1')}
            backgroundColor="#F0EDE6"
            textColor="#0A0F1E"
            shadowColor="#000000"
          />
        </Animated.View>

        <PillButton
          label="Daily Challenge"
          subtitle={`${Math.max(1, streakDays)} day streak ready`}
          icon="🔥"
          onPress={() => router.push('/daily')}
          backgroundColor="#F0EDE6"
          textColor="#0A0F1E"
          shadowColor="#000000"
        />

        <PillButton
          label="World Map"
          subtitle="Choose your scenery"
          onPress={() => router.push('/world-map')}
          backgroundColor="#F0EDE6"
          textColor="#0A0F1E"
          shadowColor="#000000"
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.hintBadge}>
          <Text style={styles.hintBadgeLabel}>Hint Wallet</Text>
          <Text style={styles.hintBadgeValue}>{bankedHints}</Text>
        </View>

        <Pressable style={styles.shopButton} onPress={() => router.push('/shop')}>
          <Text style={styles.shopButtonText}>Shop</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function createStyles(palette: ReturnType<typeof getAppPalette>) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: palette.background,
      paddingHorizontal: 24,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 12,
    },
    logo: {
      color: palette.primaryText,
      fontSize: 38,
      fontWeight: '700',
      fontFamily: 'serif',
      letterSpacing: 1.2,
    },
    settingsButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: appearanceToButtonFill(palette.background),
      borderWidth: 1,
      borderColor: palette.border,
    },
    settingsIcon: {
      color: palette.primaryText,
      fontSize: 18,
    },
    hero: {
      flex: 1,
      justifyContent: 'center',
      gap: 18,
    },
    kicker: {
      color: palette.secondaryText,
      fontSize: 16,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 18,
    },
    playWrap: {
      shadowColor: palette.shadowColor,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 0 },
      elevation: 10,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 24,
    },
    hintBadge: {
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderRadius: 999,
      backgroundColor: appearanceToButtonFill(palette.background),
      borderWidth: 1,
      borderColor: palette.border,
    },
    hintBadgeLabel: {
      color: palette.secondaryText,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1.1,
      textTransform: 'uppercase',
    },
    hintBadgeValue: {
      color: palette.primaryText,
      fontSize: 22,
      fontWeight: '700',
      marginTop: 4,
    },
    shopButton: {
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 999,
      backgroundColor: palette.buttonBackground,
    },
    shopButtonText: {
      color: palette.buttonText,
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
  });
}

function appearanceToButtonFill(backgroundColor: string): string {
  return backgroundColor === '#0A0F1E' ? 'rgba(240,237,230,0.12)' : 'rgba(10,15,30,0.08)';
}
