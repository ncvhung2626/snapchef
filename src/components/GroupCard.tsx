import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';

export interface GroupCardProps {
  title: string;
  subtitle: string;
  isJoined?: boolean;
  onPress?: () => void;
}

export const GroupCard = ({ title, subtitle, isJoined = false, onPress }: GroupCardProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.imagePlaceholder}>
        <Feather name="users" size={24} color={colors.onPrimaryFixed} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
      </View>
      <TouchableOpacity style={[styles.actionButton, isJoined ? styles.actionButtonJoined : {}]}>
        <Text style={[styles.actionText, isJoined ? styles.actionTextJoined : {}]}>
          {isJoined ? 'Đã tham gia' : 'Tham gia'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceContainerLowest,
      padding: spacing.md,
      borderRadius: radius.lg,
      marginBottom: spacing.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    imagePlaceholder: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      backgroundColor: colors.primaryFixed,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    content: {
      flex: 1,
      marginRight: spacing.md,
    },
    title: {
      ...typography.headlineMd,
      fontSize: 16,
      color: colors.onSurface,
      marginBottom: spacing['2xs'],
    },
    subtitle: {
      ...typography.bodyMd,
      color: colors.onSurfaceVariant,
    },
    actionButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      backgroundColor: colors.primary,
      borderRadius: radius.full,
    },
    actionButtonJoined: {
      backgroundColor: colors.surfaceContainerHigh,
    },
    actionText: {
      ...typography.labelMd,
      color: colors.onPrimary,
    },
    actionTextJoined: {
      color: colors.onSurfaceVariant,
    },
  });
}
