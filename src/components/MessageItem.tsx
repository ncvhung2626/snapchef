import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface MessageItemProps {
  name: string;
  message: string;
  avatarUrl?: string;
  timeAgo?: string;
  onPress?: () => void;
}

export const MessageItem = ({ name, message, avatarUrl, timeAgo, onPress }: MessageItemProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatar}>
          <Feather name="user" size={24} color={colors.onPrimaryFixed} />
        </View>
      )}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {timeAgo ? <Text style={styles.time}>{timeAgo}</Text> : null}
        </View>
        <Text style={styles.message} numberOfLines={1}>
          {message || 'Chưa có tin nhắn'}
        </Text>
      </View>
      <Feather name="chevron-right" size={20} color={colors.onSurfaceVariant} />
    </TouchableOpacity>
  );
};

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceVariant,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primaryFixed,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
      overflow: 'hidden',
    },
    content: {
      flex: 1,
      marginRight: spacing.sm,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing['4xs'],
    },
    name: {
      ...typography.headlineMd,
      fontSize: 16,
      color: colors.onSurface,
      flex: 1,
    },
    time: {
      ...typography.bodyMd,
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginLeft: spacing.sm,
    },
    message: {
      ...typography.bodyMd,
      color: colors.onSurfaceVariant,
    },
  });
}
