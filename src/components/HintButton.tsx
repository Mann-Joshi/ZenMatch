import { Text, Pressable, StyleSheet, View } from 'react-native';

interface HintButtonProps {
  label: string;
  count: number;
  onPress: () => void;
  accentColor: string;
  textColor: string;
  disabled?: boolean;
}

export function HintButton({
  label,
  count,
  onPress,
  accentColor,
  textColor,
  disabled = false,
}: HintButtonProps) {
  const styles = createStyles(accentColor, textColor, disabled);

  return (
    <Pressable style={styles.button} onPress={onPress} disabled={disabled}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.countBadge}>
        <Text style={styles.countText}>{count}</Text>
      </View>
    </Pressable>
  );
}

function createStyles(accentColor: string, textColor: string, disabled: boolean) {
  return StyleSheet.create({
    button: {
      minWidth: 86,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: accentColor,
      backgroundColor: disabled ? textColor + '0D' : textColor + '14',
      opacity: disabled ? 0.5 : 1,
    },
    label: {
      color: textColor,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.6,
    },
    countBadge: {
      minWidth: 22,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: accentColor,
    },
    countText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '800',
      textAlign: 'center',
    },
  });
}
