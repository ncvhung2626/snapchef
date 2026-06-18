import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'filled' | 'outline';
  style?: ViewStyle;
}

export const PrimaryButton = ({
  label,
  onPress,
  loading,
  disabled,
  variant = 'filled',
  style,
}: PrimaryButtonProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isOutline = variant === 'outline';
  return (
    <TouchableOpacity
      style={[
        styles.btn,
        isOutline && styles.btnOutline,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.primary : colors.onPrimary} />
      ) : (
        <Text style={[styles.text, isOutline && styles.textOutline]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    btn: {
      height: 52,
      backgroundColor: colors.primary,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.card,
      shadowColor: colors.onSurface,
    },
    btnOutline: {
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    disabled: { opacity: 0.65 },
    text: {
      ...typography.bodyLg,
      color: colors.onPrimary,
      fontWeight: '700',
    },
    textOutline: { color: colors.primary },
  });
}
