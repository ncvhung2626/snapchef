import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { PrimaryButton } from './PrimaryButton';

interface EmptyStateProps {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = 'inbox', title, message, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Feather name={icon} size={48} color={colors.onSurfaceVariant} />
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <PrimaryButton label={actionLabel} onPress={onAction} style={styles.btn} />
      ) : null}
    </View>
  );
}

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Không tải được dữ liệu', onRetry }: ErrorStateProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Feather name="alert-circle" size={48} color={colors.error} />
      <Text style={styles.title}>{message}</Text>
      {onRetry ? (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
          <Feather name="refresh-cw" size={18} color={colors.primary} />
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function OfflineBanner({ visible }: { visible: boolean }) {
  const { colors } = useTheme();
  if (!visible) return null;
  return (
    <View style={[offlineStyles.banner, { backgroundColor: colors.error }]}>
      <Feather name="wifi-off" size={16} color={colors.onError} />
      <Text style={[offlineStyles.text, { color: colors.onError }]}>Không có kết nối mạng</Text>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
      marginVertical: spacing.lg,
    },
    title: {
      ...typography.headlineMd,
      color: colors.onSurface,
      marginTop: spacing.md,
      textAlign: 'center',
    },
    message: {
      ...typography.bodyMd,
      color: colors.onSurfaceVariant,
      marginTop: spacing.xs,
      textAlign: 'center',
    },
    btn: { marginTop: spacing.lg, minWidth: 160 },
    retryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.md,
      gap: spacing.xs,
    },
    retryText: {
      ...typography.labelMd,
      color: colors.primary,
      fontWeight: '600',
    },
  });
}

const offlineStyles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  text: {
    ...typography.labelMd,
  },
});
