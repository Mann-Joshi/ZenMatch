import { StyleSheet, Text, View } from 'react-native';

interface StreakBadgeProps {
  count: number;
  backgroundColor: string;
  textColor: string;
}

export function StreakBadge({ count, backgroundColor, textColor }: StreakBadgeProps) {
  const styles = createStyles(backgroundColor, textColor);

  return (
    <View style={styles.badge}>
      <Text style={styles.icon}>🔥</Text>
      <Text style={styles.text}>{count} day streak</Text>
    </View>
  );
}

function createStyles(backgroundColor: string, textColor: string) {
  return StyleSheet.create({
    badge: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor,
    },
    icon: {
      fontSize: 14,
    },
    text: {
      color: textColor,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.4,
    },
  });
}
