import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { Comment } from '../types/models';
import { formatRelativeTime } from '../utils/formatTime';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  onReply?: (comment: Comment) => void;
  onDelete?: (commentId: string) => void;
  isReply?: boolean;
}

export const CommentItem = ({
  comment,
  currentUserId,
  onReply,
  onDelete,
  isReply,
}: CommentItemProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isOwner = currentUserId === comment.userId;

  const handleLongPress = () => {
    if (!isOwner || !onDelete) return;
    Alert.alert('Xóa bình luận', 'Bạn có chắc muốn xóa?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => onDelete(comment._id) },
    ]);
  };

  return (
    <TouchableOpacity
      style={[styles.row, isReply && styles.replyRow]}
      onLongPress={handleLongPress}
      activeOpacity={0.9}
    >
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
          {onReply && !isReply && (
            <TouchableOpacity onPress={() => onReply(comment)}>
              <Text style={styles.replyBtn}>Trả lời</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    row: { flexDirection: 'row', marginBottom: spacing.lg, paddingHorizontal: spacing.lg },
    replyRow: { marginLeft: spacing.xl, marginBottom: spacing.md },
    avatar: { width: 36, height: 36, borderRadius: radius.full, marginRight: spacing.sm },
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
    name: { ...typography.labelMd, color: colors.onSurface, fontWeight: '700', marginBottom: spacing['2xs'] },
    text: { ...typography.bodyMd, color: colors.onSurfaceVariant, lineHeight: 20 },
    footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs, paddingHorizontal: spacing.xs },
    time: { ...typography.labelMd, fontSize: 12, color: colors.onSurfaceVariant },
    replyBtn: { ...typography.labelMd, fontSize: 12, color: colors.primary, fontWeight: '600' },
  });
}
