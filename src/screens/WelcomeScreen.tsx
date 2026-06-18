import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { RootStackScreenProps } from '../types/navigation';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';

export const WelcomeScreen = ({ navigation }: RootStackScreenProps<'Welcome'>) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.hero}>
        <View style={styles.logoCircle}>
          <Feather name="coffee" size={48} color={colors.onPrimary} />
        </View>
        <Text style={styles.brand}>SnapChef</Text>
        <Text style={styles.tagline}>CookCircle — Cộng đồng nấu ăn của bạn</Text>
        <Text style={styles.desc}>
          Chia sẻ công thức, Reels nấu ăn, tham gia nhóm và kết nối với những người yêu ẩm thực.
        </Text>
      </View>

      <View style={styles.features}>
        {[
          { icon: 'book-open' as const, label: 'Công thức & bài viết' },
          { icon: 'film' as const, label: 'Reels nấu ăn' },
          { icon: 'users' as const, label: 'Nhóm cộng đồng' },
        ].map((f) => (
          <View key={f.label} style={styles.featureRow}>
            <Feather name={f.icon} size={20} color={colors.primary} />
            <Text style={styles.featureText}>{f.label}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => navigation.replace('Login')}
        activeOpacity={0.85}
      >
        <Text style={styles.primaryBtnText}>Bắt đầu ngay</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.skipText}>Tạo tài khoản mới</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: spacing.sm }}>
        <Text style={styles.loginSecondary}>Đã có tài khoản? Đăng nhập</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: spacing.lg,
      justifyContent: 'center',
    },
    hero: {
      alignItems: 'center',
      marginBottom: spacing['2xl'],
    },
    logoCircle: {
      width: 96,
      height: 96,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
      ...shadows.fab,
      shadowColor: colors.primary,
    },
    brand: {
      ...typography.headlineXl,
      color: colors.primary,
      marginBottom: spacing.xs,
    },
    tagline: {
      ...typography.headlineMd,
      color: colors.onSurface,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    desc: {
      ...typography.bodyLg,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      paddingHorizontal: spacing.md,
    },
    features: {
      marginBottom: spacing['2xl'],
      gap: spacing.md,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    featureText: {
      ...typography.bodyLg,
      color: colors.onSurface,
    },
    primaryBtn: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      borderRadius: radius.full,
      alignItems: 'center',
      marginBottom: spacing.lg,
      ...shadows.card,
      shadowColor: colors.onSurface,
    },
    primaryBtnText: {
      ...typography.bodyLg,
      color: colors.onPrimary,
      fontWeight: '700',
    },
    skipText: {
      ...typography.bodyMd,
      color: colors.primary,
      textAlign: 'center',
      fontWeight: '600',
    },
    loginSecondary: {
      ...typography.bodyMd,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },
  });
}
