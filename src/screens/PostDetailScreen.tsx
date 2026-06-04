import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { RootStackScreenProps } from '../types/navigation';
import type { Post } from '../types/models';
import * as postService from '../services/postService';
import { useAuth } from '../context/AuthContext';
import { formatRelativeTime } from '../utils/formatTime';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

export const PostDetailScreen = ({
  navigation,
  route,
}: RootStackScreenProps<'PostDetail'>) => {
  const { postId } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const p = await postService.getPostById(postId, user?._id);
    setPost(p ?? null);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [postId, user?._id]);

  const handleLike = async () => {
    if (!user || !post) return;
    const result = await postService.toggleLike(post._id, user._id);
    setPost({
      ...post,
      likes: result.liked
        ? [...post.likes, user._id]
        : post.likes.filter((id) => id !== user._id),
    });
  };

  const isLiked = user ? post?.likes.includes(user._id) : false;

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Không tìm thấy bài viết</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Feather name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết bài đăng</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.authorRow}>
          {post.author.avatar ? (
            <Image source={{ uri: post.author.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar} />
          )}
          <View>
            <Text style={styles.authorName}>{post.author.fullname}</Text>
            <Text style={styles.time}>{formatRelativeTime(post.createdAt)}</Text>
          </View>
        </View>

        <Text style={styles.body}>{post.content}</Text>

        {post.images[0] ? (
          <Image source={{ uri: post.images[0] }} style={styles.image} resizeMode="cover" />
        ) : null}

        <View style={styles.stats}>
          <Text style={styles.statText}>{post.likes.length} lượt thích</Text>
          <Text style={styles.statText}>{post.commentsCount} bình luận</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
            <Feather name="heart" size={22} color={isLiked ? colors.error : colors.onSurfaceVariant} />
            <Text style={styles.actionLabel}>Thích</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Comment', { postId: post._id })}
          >
            <Feather name="message-circle" size={22} color={colors.onSurfaceVariant} />
            <Text style={styles.actionLabel}>Bình luận</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Feather name="bookmark" size={22} color={colors.onSurfaceVariant} />
            <Text style={styles.actionLabel}>Lưu</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  iconBtn: { padding: spacing.xs, width: 40 },
  headerTitle: { ...typography.headlineMd, color: colors.onSurface },
  content: { padding: spacing.lg, paddingBottom: spacing['2xl'] },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceVariant,
    marginRight: spacing.md,
  },
  authorName: { ...typography.bodyLg, fontWeight: '700', color: colors.onSurface },
  time: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  body: { ...typography.bodyLg, color: colors.onSurface, marginBottom: spacing.md },
  image: { width: '100%', height: 240, borderRadius: radius.lg, marginBottom: spacing.md },
  stats: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.md },
  statText: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceVariant,
    paddingTop: spacing.md,
  },
  actionBtn: { alignItems: 'center', gap: spacing['2xs'] },
  actionLabel: { ...typography.labelMd, color: colors.onSurfaceVariant },
  errorText: { ...typography.bodyLg, color: colors.onSurface },
  link: { ...typography.bodyMd, color: colors.primary, marginTop: spacing.md },
});
