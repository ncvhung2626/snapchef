import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import type { RootStackParamList } from '../types/navigation';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';

export interface PostCardProps {
  postId: string;
  author: string;
  authorAvatar?: string;
  time: string;
  content: string;
  imageUrl?: string;
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
  onLike?: () => void;
}

export const PostCard = ({
  postId,
  author,
  authorAvatar,
  time,
  content,
  imageUrl,
  likesCount = 0,
  commentsCount = 0,
  isLiked = false,
  onLike,
}: PostCardProps) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const openDetail = () => navigation.getParent()?.navigate('PostDetail', { postId });

  return (
    <TouchableOpacity activeOpacity={0.95} onPress={openDetail} style={styles.card}>
      <View style={styles.header}>
        {authorAvatar ? (
          <Image source={{ uri: authorAvatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar} />
        )}
        <View style={styles.headerText}>
          <Text style={styles.author}>{author}</Text>
          <Text style={styles.time}>{time}</Text>
        </View>
        <Feather name="more-horizontal" size={20} color={colors.onSurfaceVariant} />
      </View>

      <Text style={styles.content}>{content}</Text>

      {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.image} /> : null}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation?.();
            onLike?.();
          }}
        >
          <Feather
            name="heart"
            size={20}
            color={isLiked ? colors.error : colors.onSurfaceVariant}
          />
          <Text style={[styles.actionText, isLiked && styles.actionTextLiked]}>
            {likesCount > 0 ? `${likesCount} ` : ''}Thích
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.getParent()?.navigate('Comment', { postId })}
        >
          <Feather name="message-circle" size={20} color={colors.onSurfaceVariant} />
          <Text style={styles.actionText}>
            {commentsCount > 0 ? `${commentsCount} ` : ''}Bình luận
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Feather name="share-2" size={20} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginVertical: spacing.sm,
    marginHorizontal: spacing.md,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceVariant,
    marginRight: spacing.sm,
  },
  headerText: { flex: 1 },
  author: {
    ...typography.bodyMd,
    fontWeight: '700',
    color: colors.onSurface,
  },
  time: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  content: {
    ...typography.bodyLg,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceVariant,
    paddingTop: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  actionText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginLeft: spacing.xs,
  },
  actionTextLiked: {
    color: colors.error,
    fontWeight: '600',
  },
});
