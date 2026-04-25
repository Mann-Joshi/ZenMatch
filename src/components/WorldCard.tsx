import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { WorldTheme } from '@/theme/worlds';

interface WorldCardProps {
  theme: WorldTheme;
  starsEarned: number;
  totalStars: number;
  unlocked: boolean;
  onPress: () => void;
}

export function WorldCard({ theme, starsEarned, totalStars, unlocked, onPress }: WorldCardProps) {
  const styles = createStyles(theme.accentColor, theme.background, theme.tileBackground, unlocked, theme.id === 3 || theme.id === 5);

  return (
    <Pressable style={styles.card} onPress={onPress} disabled={!unlocked}>
      <View style={styles.colorRail} />
      <View style={styles.content}>
        <Text style={styles.name}>{theme.name}</Text>
        <Text style={styles.meta}>{starsEarned} / {totalStars} stars</Text>
      </View>
      <View style={styles.statusPill}>
        <Text style={styles.statusText}>{unlocked ? 'Open' : 'Locked'}</Text>
      </View>
    </Pressable>
  );
}

function createStyles(accentColor: string, background: string, surface: string, unlocked: boolean, darkSurface: boolean) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      borderRadius: 26,
      paddingHorizontal: 18,
      paddingVertical: 18,
      backgroundColor: surface,
      borderWidth: 1,
      borderColor: accentColor,
      opacity: unlocked ? 1 : 0.55,
    },
    colorRail: {
      width: 12,
      height: 56,
      borderRadius: 999,
      backgroundColor: accentColor,
    },
    content: {
      flex: 1,
    },
    name: {
      color: darkSurface ? '#F0EDE6' : '#0A0F1E',
      fontSize: 20,
      fontWeight: '700',
      fontFamily: 'serif',
    },
    meta: {
      marginTop: 4,
      color: darkSurface ? '#C7D0E2' : '#31415E',
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.6,
    },
    statusPill: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: background,
    },
    statusText: {
      color: darkSurface ? '#F0EDE6' : '#0A0F1E',
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
  });
}
