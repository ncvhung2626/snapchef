import React, { useMemo, useEffect, useState, useRef } from 'react';
import { useTheme } from '../theme/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { RootStackScreenProps } from '../types/navigation';
import type { Post } from '../types/models';
import * as postService from '../services/postService';
import { toggleSaveRecipe, isPostSaved } from '../services/recipeService';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';
import { ReportModal } from '../components/ReportModal';
import { formatRelativeTime } from '../utils/formatTime';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

export const PostDetailScreen = ({
  navigation,
  route,
}: RootStackScreenProps<'PostDetail'>) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { postId, initialImageIndex = 0 } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(initialImageIndex);

  const load = async () => {
    const p = await postService.getPostById(postId, user?._id);
    setPost(p ?? null);
    if (user && p) {
      setSaved(await isPostSaved(user._id, p._id));
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [postId, user?._id]);

  const screenWidth = Dimensions.get('window').width;
  const imageWidth = screenWidth - spacing.lg * 2;

  const isOwner = user && post && post.author._id === user._id;

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

  const handleSave = async () => {
    if (!user || !post) return;
    const nowSaved = await toggleSaveRecipe(user._id, post._id);
    setSaved(nowSaved);
  };

  const handleDelete = () => {
    if (!user || !post) return;
    Alert.alert('Xóa bài viết', 'Bạn có chắc muốn xóa?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await postService.deletePost(post._id, user._id);
            navigation.goBack();
          } catch (err) {
            Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không xóa được');
          }
        },
      },
    ]);
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
        <Text style={styles.headerTitle}>
          {post.isRecipe ? 'Công thức' : 'Chi tiết bài đăng'}
        </Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setMenuOpen(!menuOpen)}>
          <Feather name="more-horizontal" size={24} color={colors.onSurface} />
        </TouchableOpacity>
      </View>

      {menuOpen && (
        <View style={styles.menu}>
          {isOwner && hasPermission(user, 'post.edit_own') && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                navigation.navigate(post.isRecipe ? 'EditRecipe' : 'EditPost', { postId: post._id });
              }}
            >
              <Feather name="edit-2" size={18} color={colors.onSurface} />
              <Text style={styles.menuText}>Chỉnh sửa</Text>
            </TouchableOpacity>
          )}
          {isOwner && hasPermission(user, 'post.delete_own') && (
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); handleDelete(); }}>
              <Feather name="trash-2" size={18} color={colors.error} />
              <Text style={[styles.menuText, { color: colors.error }]}>Xóa</Text>
            </TouchableOpacity>
          )}
          {user && !isOwner && (
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); setReportOpen(true); }}>
              <Feather name="flag" size={18} color={colors.error} />
              <Text style={[styles.menuText, { color: colors.error }]}>Báo cáo</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={styles.authorRow}
          onPress={() => navigation.navigate('UserProfile', { userId: post.author._id })}
        >
          {post.author.avatar ? (
            <Image source={{ uri: post.author.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar} />
          )}
          <View>
            <Text style={styles.authorName}>{post.author.fullname}</Text>
            <Text style={styles.time}>{formatRelativeTime(post.createdAt)}</Text>
          </View>
        </TouchableOpacity>

        {post.title ? <Text style={styles.recipeTitle}>{post.title}</Text> : null}
        <Text style={styles.body}>{post.content}</Text>

        {post.cookTimeMinutes ? (
          <Text style={styles.meta}>⏱ {post.cookTimeMinutes} phút</Text>
        ) : null}

        {post.images.length > 0 ? (
          <View style={styles.carouselContainer}>
            <FlatList
              data={post.images}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={initialImageIndex}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / imageWidth);
                if (index !== currentImageIndex) setCurrentImageIndex(index);
              }}
              getItemLayout={(_, index) => ({
                length: imageWidth,
                offset: imageWidth * index,
                index,
              })}
              renderItem={({ item }) => (
                <View style={{ width: imageWidth }}>
                  <Image source={{ uri: item }} style={styles.image} resizeMode="cover" />
                </View>
              )}
            />
            {post.images.length > 1 && (
              <View style={styles.paginationBadge}>
                <Text style={styles.paginationText}>{currentImageIndex + 1}/{post.images.length}</Text>
              </View>
            )}
          </View>
        ) : null}

        <View style={styles.stats}>
          <Text style={styles.statText}>{post.likes.length} lượt thích</Text>
          <Text style={styles.statText}>{post.commentsCount} bình luận</Text>
        </View>

        {post.ingredients && post.ingredients.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nguyên liệu</Text>
            {post.ingredients.map((ing, i) => (
              <View key={i} style={styles.checkRow}>
                <Feather name="check-circle" size={18} color={colors.primary} />
                <Text style={styles.checkText}>{ing}</Text>
              </View>
            ))}
          </View>
        )}

        {post.steps && post.steps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Các bước</Text>
            {post.steps.map((st, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{st}</Text>
              </View>
            ))}
          </View>
        )}

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
          {user && hasPermission(user, 'recipe.create') && (
            <TouchableOpacity style={styles.actionBtn} onPress={handleSave}>
              <Feather name="bookmark" size={22} color={saved ? colors.primary : colors.onSurfaceVariant} />
              <Text style={styles.actionLabel}>{saved ? 'Đã lưu' : 'Lưu'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {user && (
        <ReportModal
          visible={reportOpen}
          onClose={() => setReportOpen(false)}
          reporterId={user._id}
          targetType="post"
          targetId={post._id}
        />
      )}
    </View>
  );
};

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
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
  menu: {
    position: 'absolute',
    top: 56,
    right: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xs,
    zIndex: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  menuText: { ...typography.bodyMd, color: colors.onSurface },
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
  recipeTitle: { ...typography.headlineLg, color: colors.onSurface, marginBottom: spacing.sm },
  meta: { ...typography.bodyMd, color: colors.primary, marginBottom: spacing.md },
  body: { ...typography.bodyLg, color: colors.onSurface, marginBottom: spacing.md },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.headlineMd, color: colors.onSurface, marginBottom: spacing.sm },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  checkText: { ...typography.bodyMd, color: colors.onSurface, flex: 1 },
  stepRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: { color: colors.onPrimary, fontWeight: '700', fontSize: 14 },
  stepText: { ...typography.bodyMd, color: colors.onSurface, flex: 1 },
  carouselContainer: { marginBottom: spacing.md, position: 'relative' },
  image: { width: '100%', height: 300, borderRadius: radius.lg },
  paginationBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  paginationText: { ...typography.labelMd, color: '#fff', fontSize: 12 },
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
}
