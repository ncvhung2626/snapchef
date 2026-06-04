import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NotificationType as ModelType } from '../types/models';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

export type NotificationType = ModelType | 'default';

interface NotificationItemProps {
  title: string;
  description: string;
  type?: NotificationType;
  onPress?: () => void;
  isUnread?: boolean;
  timeAgo?: string;
}

const getTypeStyles = (type: NotificationType) => {
  switch (type) {
    case 'premium':
    case 'system':
      return {
        icon: 'gift' as const,
        iconColor: colors.primary,
        bgColor: colors.primaryContainer,
      };
    case 'like':
      return {
        icon: 'heart' as const,
        iconColor: colors.error,
        bgColor: colors.errorContainer,
      };
    case 'comment':
      return {
        icon: 'message-circle' as const,
        iconColor: colors.primary,
        bgColor: colors.primaryFixed,
      };
    case 'follow':
      return {
        icon: 'user-plus' as const,
        iconColor: colors.secondary,
        bgColor: colors.secondaryContainer,
      };
    case 'group':
      return {
        icon: 'users' as const,
        iconColor: colors.primary,
        bgColor: colors.surfaceVariant,
      };
    default:
      return {
        icon: 'bell' as const,
        iconColor: colors.primary,
        bgColor: colors.surfaceVariant,
      };
  }
};

export const NotificationItem = ({
  title,
  description,
  type = 'default',
  onPress,
  isUnread = false,
  timeAgo,
}: NotificationItemProps) => {
  const { icon, iconColor, bgColor } = getTypeStyles(type);

  return (
    <TouchableOpacity
      style={[styles.container, isUnread && styles.unreadContainer]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
        <Feather name={icon} size={24} color={iconColor} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
        {timeAgo ? <Text style={styles.time}>{timeAgo}</Text> : null}
      </View>
      {isUnread && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
    alignItems: 'center',
  },
  unreadContainer: {
    backgroundColor: colors.surfaceContainerLow,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  time: {
    ...typography.bodyMd,
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: spacing['2xs'],
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
  },
});
