import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { Comment } from '../types/models';
import { formatRelativeTime } from '../utils/formatTime';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

interface CommentItemProps {
  comment: Comment;
}

export const CommentItem = ({ comment }: CommentItemProps) => {
  return (
    <View style={styles.row}>
      {comment.authorAvatar ? (
        <Image source={{ uri: comment.authorAvatar }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Feather name="user" size={16} color={colors.onSurfaceVariant} />
        </View>
      )}
      <View style={styles.content}>
        <View style={styles.bubble}>
          <Text style={styles.name}>{comment.authorName}</Text>
          <Text style={styles.text}>{comment.content}</Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.time}>{formatRelativeTime(comment.createdAt)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    marginRight: spacing.sm,
  },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  bubble: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignSelf: 'flex-start',
  },
  name: {
    ...typography.labelMd,
    color: colors.onSurface,
    fontWeight: '700',
    marginBottom: spacing['2xs'],
  },
  text: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  time: {
    ...typography.labelMd,
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
});
