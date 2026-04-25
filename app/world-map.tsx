import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WorldCard } from '@/components/WorldCard';
import { getDifficultyConfig } from '@/game/layoutEngine';
import { useProgressStore } from '@/store/progressStore';
import { useSettingsStore } from '@/store/settingsStore';
import { WORLDS, getAppPalette } from '@/theme/worlds';

function getWorldStars(levelStars: Record<string, number>, world: number): number {
  return Object.entries(levelStars)
    .filter(([key]) => key.startsWith(`${world}-`))
    .reduce((sum, [, value]) => sum + value, 0);
}

export default function WorldMapScreen() {
  const levelStars = useProgressStore((state) => state.levelStars);
  const worldUnlocked = useProgressStore((state) => state.worldUnlocked);
  const hasRemovedAds = useProgressStore((state) => state.hasRemovedAds);
  const appearanceMode = useSettingsStore((state) => state.appearanceMode);
  const palette = getAppPalette(appearanceMode);
  const styles = useMemo(() => createStyles(palette), [palette]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.back}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>World Map</Text>
          <View style={styles.headerSpacer} />
        </View>

        {Object.values(WORLDS).map((world) => {
          const unlocked = worldUnlocked.includes(world.id);
          const worldStars = getWorldStars(levelStars, world.id);

          return (
            <View key={world.id} style={styles.worldSection}>
              <WorldCard
                theme={world}
                starsEarned={worldStars}
                totalStars={63}
                unlocked={unlocked}
                onPress={() => unlocked && router.push(`/game/${world.id}/1`)}
              />

              <View style={styles.levelGrid}>
                {Array.from({ length: 21 }, (_, index) => index + 1).map((level) => {
                  const key = `${world.id}-${level}`;
                  const completedStars = levelStars[key] ?? 0;
                  const chipStyles = createLevelChipStyles(world.accentColor, completedStars > 0, unlocked);

                  return (
                    <Pressable
                      key={key}
                      style={chipStyles.chip}
                      onPress={() => unlocked && router.push(`/game/${world.id}/${level}`)}
                      disabled={!unlocked}
                    >
                      <Text style={chipStyles.levelText}>{level}</Text>
                      <Text style={chipStyles.starText}>{'★'.repeat(completedStars || 1)}</Text>
                      <Text style={chipStyles.diffDot}>
                        {(() => {
                          const tier = getDifficultyConfig(world.id, level).tier;
                          if (tier === 'boss') return '🔥';
                          if (tier === 'hard') return '🟠';
                          if (tier === 'medium') return '🟡';
                          return '🟢';
                        })()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}

        {!hasRemovedAds ? (
          <View style={styles.bannerPlaceholder}>
            <Text style={styles.bannerTitle}>Banner Ad Slot</Text>
            <Text style={styles.bannerCopy}>Reserved for the level select banner placement.</Text>
          </View>
        ) : null}
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
      paddingBottom: 30,
      gap: 22,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
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
    worldSection: {
      gap: 14,
    },
    levelGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    bannerPlaceholder: {
      marginTop: 10,
      borderRadius: 24,
      paddingHorizontal: 20,
      paddingVertical: 20,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.border,
    },
    bannerTitle: {
      color: palette.primaryText,
      fontSize: 14,
      fontWeight: '800',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    bannerCopy: {
      marginTop: 6,
      color: palette.secondaryText,
      fontSize: 13,
      lineHeight: 20,
    },
  });
}

function createLevelChipStyles(accentColor: string, completed: boolean, unlocked: boolean) {
  return StyleSheet.create({
    chip: {
      width: 64,
      borderRadius: 18,
      paddingVertical: 8,
      paddingHorizontal: 8,
      backgroundColor: completed ? accentColor : 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      borderColor: accentColor,
      opacity: unlocked ? 1 : 0.45,
      alignItems: 'center',
      gap: 2,
    },
    levelText: {
      color: completed ? '#FFFFFF' : '#0A0F1E',
      fontSize: 14,
      fontWeight: '800',
    },
    starText: {
      color: completed ? '#FFFFFF' : accentColor,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.4,
    },
    diffDot: {
      fontSize: 9,
    },
  });
}
