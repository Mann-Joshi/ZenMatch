import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PillButton } from '@/components/PillButton';
import { StreakBadge } from '@/components/StreakBadge';
import { useGameStore } from '@/store/gameStore';
import { useProgressStore } from '@/store/progressStore';
import { useSettingsStore } from '@/store/settingsStore';
import { getAppPalette } from '@/theme/worlds';

// Daily reward definitions — day index 0-6
const DAILY_REWARDS = [
  { day: 1, label: '+3 Hints', icon: '💡', hints: 3, shuffles: 0 },
  { day: 2, label: '+2 Shuffles', icon: '🔀', hints: 0, shuffles: 2 },
  { day: 3, label: '+5 Hints', icon: '💡', hints: 5, shuffles: 0 },
  { day: 4, label: '+3 Undos\n+3 Hints', icon: '↩️', hints: 3, shuffles: 0 },
  { day: 5, label: '+10 Hints', icon: '💡', hints: 10, shuffles: 0 },
  { day: 6, label: 'No Ads\n24 Hours', icon: '🚫', hints: 0, shuffles: 0 },
  { day: 7, label: '+20 Hints\n+5 Shuffles\n+3 Undos', icon: '🎁', hints: 20, shuffles: 5, jackpot: true },
] as const;

interface DailyChallenge {
  layoutId: string;
  seed: string;
  world: number;
}

function buildFallbackChallenge(dateSeed: string): DailyChallenge {
  return { layoutId: 'turtle', seed: dateSeed, world: 3 };
}

export default function DailyScreen() {
  const streakDays = useProgressStore((state) => state.streakDays);
  const lastClaimedDay = useProgressStore((state) => state.lastClaimedDay);
  const lastRewardClaimDate = useProgressStore((state) => state.lastRewardClaimDate);
  const claimDailyReward = useProgressStore((state) => state.claimDailyReward);
  const appearanceMode = useSettingsStore((state) => state.appearanceMode);
  const palette = getAppPalette(appearanceMode);
  const styles = useMemo(() => createStyles(palette), [palette]);

  const today = new Date().toISOString().slice(0, 10);
  // Which day in the 7-day cycle the player is currently on (0-indexed)
  const currentDayIndex = Math.min(6, Math.max(0, (streakDays - 1) % 7));
  // Has the player already claimed today?
  const alreadyClaimedToday = lastRewardClaimDate === today;

  function handlePlay(): void {
    const dateSeed = today;
    const challenge = buildFallbackChallenge(dateSeed);
    useGameStore.getState().loadDailyChallenge(challenge.world, challenge.layoutId, challenge.seed);
    router.push({
      pathname: '/game/[world]/[level]',
      params: {
        world: String(challenge.world),
        level: '21',
        daily: '1',
        seed: challenge.seed,
        layoutId: challenge.layoutId,
      },
    });
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.back}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Daily Challenge</Text>
          <View style={styles.headerSpacer} />
        </View>

        <StreakBadge count={Math.max(1, streakDays)} backgroundColor={palette.surface} textColor={palette.primaryText} />

        {/* Play Today card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Today's Puzzle</Text>
          <Text style={styles.heroTitle}>Daily Board</Text>
          <Text style={styles.heroCopy}>Solve today's shared board and earn bonus rewards!</Text>
          <View style={styles.buttonWrap}>
            <PillButton
              label="Play Today"
              subtitle="Complete to advance your streak"
              onPress={handlePlay}
              backgroundColor={palette.buttonBackground}
              textColor={palette.buttonText}
              shadowColor={palette.shadowColor}
            />
          </View>
        </View>

        {/* 7-Day Reward Calendar */}
        <View style={styles.calendarCard}>
          <Text style={styles.sectionTitle}>🗓 Daily Streak Rewards</Text>
          <Text style={styles.calendarSubtitle}>Log in daily for 7 days to claim the jackpot!</Text>

          <View style={styles.daysGrid}>
            {DAILY_REWARDS.map((reward, index) => {
              const isClaimed = alreadyClaimedToday
                ? index <= lastClaimedDay
                : index < lastClaimedDay;
              const isCurrent = index === currentDayIndex;
              const isFuture = index > currentDayIndex;
              const canClaim = isCurrent && !alreadyClaimedToday;

              return (
                <View
                  key={reward.day}
                  style={[
                    styles.dayCard,
                    isClaimed && styles.dayCardClaimed,
                    isCurrent && !alreadyClaimedToday && styles.dayCardCurrent,
                    isFuture && styles.dayCardFuture,
                    'jackpot' in reward && reward.jackpot && styles.dayCardJackpot,
                  ]}
                >
                  <Text style={styles.dayNumber}>Day {reward.day}</Text>
                  <Text style={styles.dayIcon}>{reward.icon}</Text>
                  <Text style={[styles.dayLabel, isClaimed && styles.dayLabelClaimed]}>{reward.label}</Text>

                  {isClaimed ? (
                    <View style={styles.claimedBadge}>
                      <Text style={styles.claimedBadgeText}>✓</Text>
                    </View>
                  ) : canClaim ? (
                    <Pressable style={styles.claimButton} onPress={() => claimDailyReward(index)}>
                      <Text style={styles.claimButtonText}>Claim</Text>
                    </Pressable>
                  ) : (
                    <View style={styles.lockedBadge}>
                      <Text style={styles.lockedText}>{isFuture ? '🔒' : '–'}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(palette: ReturnType<typeof getAppPalette>) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: palette.background,
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 26,
      gap: 18,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    back: {
      color: palette.primaryText,
      fontSize: 15,
      fontWeight: '700',
    },
    title: {
      color: palette.primaryText,
      fontSize: 28,
      fontWeight: '700',
      fontFamily: 'serif',
    },
    headerSpacer: {
      width: 42,
    },
    heroCard: {
      borderRadius: 30,
      paddingHorizontal: 22,
      paddingVertical: 24,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.border,
      gap: 8,
    },
    heroEyebrow: {
      color: palette.secondaryText,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.1,
      textTransform: 'uppercase',
    },
    heroTitle: {
      color: palette.primaryText,
      fontSize: 28,
      fontWeight: '700',
      fontFamily: 'serif',
    },
    heroCopy: {
      color: palette.secondaryText,
      fontSize: 14,
      lineHeight: 22,
    },
    buttonWrap: {
      marginTop: 10,
    },
    calendarCard: {
      borderRadius: 24,
      paddingHorizontal: 18,
      paddingVertical: 20,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.border,
      gap: 14,
    },
    sectionTitle: {
      color: palette.primaryText,
      fontSize: 18,
      fontWeight: '800',
    },
    calendarSubtitle: {
      color: palette.secondaryText,
      fontSize: 13,
      lineHeight: 20,
      marginTop: -8,
    },
    daysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    dayCard: {
      width: '29%',
      borderRadius: 18,
      paddingVertical: 14,
      paddingHorizontal: 10,
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderWidth: 1,
      borderColor: palette.border,
      alignItems: 'center',
      gap: 6,
    },
    dayCardClaimed: {
      backgroundColor: 'rgba(99,184,99,0.18)',
      borderColor: '#4CAF50',
    },
    dayCardCurrent: {
      borderColor: '#FFD700',
      borderWidth: 2,
      backgroundColor: 'rgba(255,215,0,0.1)',
    },
    dayCardFuture: {
      opacity: 0.5,
    },
    dayCardJackpot: {
      width: '100%',
      flexDirection: 'row',
      gap: 12,
      paddingVertical: 16,
    },
    dayNumber: {
      color: palette.secondaryText,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    dayIcon: {
      fontSize: 24,
    },
    dayLabel: {
      color: palette.primaryText,
      fontSize: 11,
      fontWeight: '700',
      textAlign: 'center',
      lineHeight: 16,
    },
    dayLabelClaimed: {
      color: '#4CAF50',
    },
    claimedBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: '#4CAF50',
      alignItems: 'center',
      justifyContent: 'center',
    },
    claimedBadgeText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '900',
    },
    claimButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 99,
      backgroundColor: '#FFD700',
    },
    claimButtonText: {
      color: '#1A1A1A',
      fontSize: 11,
      fontWeight: '900',
    },
    lockedBadge: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    lockedText: {
      fontSize: 16,
    },
  });
}
