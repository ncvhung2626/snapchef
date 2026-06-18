import React, { useMemo } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

export const AuthLoadingScreen = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Feather name="coffee" size={40} color={colors.onPrimary} />
      </View>
      <Text style={styles.brand}>SnapChef</Text>
      <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
      <Text style={styles.hint}>Đang tải phiên đăng nhập...</Text>
    </View>
  );
};

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logo: {
      width: 80,
      height: 80,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    brand: {
      ...typography.headlineLg,
      color: colors.primary,
      marginTop: spacing.lg,
      fontWeight: '700',
    },
    hint: {
      ...typography.bodyMd,
      color: colors.onSurfaceVariant,
      marginTop: spacing.md,
    },
  });
}
