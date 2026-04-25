import { Pressable, StyleSheet, Text, View } from 'react-native';

interface PillButtonProps {
  label: string;
  subtitle?: string;
  icon?: string;
  onPress: () => void;
  backgroundColor: string;
  textColor: string;
  shadowColor: string;
  borderColor?: string;
  disabled?: boolean;
}

export function PillButton({
  label,
  subtitle,
  icon,
  onPress,
  backgroundColor,
  textColor,
  shadowColor,
  borderColor,
  disabled = false,
}: PillButtonProps) {
  const styles = createStyles(backgroundColor, textColor, shadowColor, borderColor, disabled);

  return (
    <Pressable style={styles.button} onPress={onPress} disabled={disabled}>
      <View style={styles.row}>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <View style={styles.copy}>
          <Text style={styles.label}>{label}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

function createStyles(
  backgroundColor: string,
  textColor: string,
  shadowColor: string,
  borderColor: string | undefined,
  disabled: boolean,
) {
  return StyleSheet.create({
    button: {
      width: '100%',
      borderRadius: 999,
      paddingHorizontal: 22,
      paddingVertical: 18,
      backgroundColor,
      borderWidth: 1,
      borderColor: borderColor ?? 'transparent',
      opacity: disabled ? 0.5 : 1,
      shadowColor,
      shadowOpacity: 0.22,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 6,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    copy: {
      alignItems: 'center',
    },
    icon: {
      color: textColor,
      fontSize: 18,
    },
    label: {
      color: textColor,
      fontSize: 18,
      fontWeight: '700',
      letterSpacing: 1.2,
    },
    subtitle: {
      marginTop: 4,
      color: textColor,
      opacity: 0.72,
      fontSize: 11,
      fontWeight: '500',
      letterSpacing: 0.6,
    },
  });
}
