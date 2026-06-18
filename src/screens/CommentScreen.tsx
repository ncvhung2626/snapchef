import React, { useMemo, useState } from 'react';
import { useTheme } from '../theme/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { RootStackScreenProps } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { useComments } from '../hooks/useComments';
import { useFeedStore } from '../store/feedStore';
import * as postService from '../services/postService';
import { CommentItem } from '../components/CommentItem';
import { formatRelativeTime } from '../utils/formatTime';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

export const CommentScreen = ({
  navigation,
  route,
}: RootStackScreenProps<'Comment'>) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { postId } = route.params;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const setCommentDraft = useFeedStore((s) => s.setCommentDraft);
  const clearCommentDraft = useFeedStore((s) => s.clearCommentDraft);
  const [post, setPost] = React.useState<Awaited<ReturnType<typeof postService.getPostById>>>(undefined);
  const { comments, replies, loading, submitting, addComment, removeComment, loadReplies } = useComments(postId);

  // Hydrate persisted draft once per post — do not depend on commentDrafts (avoids store↔state loop).
  React.useEffect(() => {
    const saved = useFeedStore.getState().commentDrafts[postId];
    if (saved) setCommentText(saved);
  }, [postId]);

  // One-way sync: local text → store only.
  React.useEffect(() => {
    if (commentText) {
      setCommentDraft(postId, commentText);
    } else {
      clearCommentDraft(postId);
    }
  }, [commentText, postId, setCommentDraft, clearCommentDraft]);

  const quickReactions = ['🤩 Ngon quá!', '🔥 Tuyệt vời', '👏 Hay lắm', '🥗 Eat clean'];

  React.useEffect(() => {
    postService.getPostById(postId, user?._id).then(setPost);
  }, [postId, user?._id]);

  const handleSend = async (text?: string) => {
    const body = (text ?? commentText).trim();
    if (!body || !user) return;
    try {
      await addComment(user._id, body, replyTo?.id);
      setCommentText('');
      clearCommentDraft(postId);
      setReplyTo(null);
      if (post) {
        setPost({ ...post, commentsCount: post.commentsCount + 1 });
      }
    } catch (e) {
      Alert.alert('Lỗi', e instanceof Error ? e.message : 'Không gửi được bình luận');
    }
  };

  const isLiked = user && post ? post.likes.includes(user._id) : false;

  const handleLikePost = async () => {
    if (!user || !post) return;
    try {
      const result = await postService.toggleLike(post._id, user._id);
      setPost({
        ...post,
        likes: result.liked
          ? [...post.likes, user._id]
          : post.likes.filter((id) => id !== user._id),
      });
    } catch {
      /* ignore */
    }
  };

  const ListHeader = () => (
    <>
      {post ? (
        <>
          <View style={styles.postAuthorRow}>
            {post.author.avatar ? (
              <Image source={{ uri: post.author.avatar }} style={styles.postAvatar} />
            ) : (
              <View style={[styles.postAvatar, styles.avatarPh]} />
            )}
            <View>
              <Text style={styles.postAuthorName}>{post.author.fullname}</Text>
              <Text style={styles.postTime}>{formatRelativeTime(post.createdAt)}</Text>
            </View>
          </View>
          <Text style={styles.postText}>{post.content}</Text>
          {post.images[0] ? (
            <Image source={{ uri: post.images[0] }} style={styles.postImage} />
          ) : null}
          <View style={styles.postActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleLikePost}>
              <Feather
                name="heart"
                size={20}
                color={isLiked ? colors.error : colors.primary}
              />
              <Text style={styles.actionText}>{post.likes.length}</Text>
            </TouchableOpacity>
            <View style={styles.actionBtn}>
              <Feather name="message-square" size={20} color={colors.onSurface} />
              <Text style={[styles.actionText, { color: colors.onSurface }]}>
                {post.commentsCount} bình luận
              </Text>
            </View>
          </View>
        </>
      ) : (
        <ActivityIndicator color={colors.primary} style={{ margin: spacing.lg }} />
      )}
      <View style={styles.divider} />
      <Text style={styles.commentsTitle}>Bình luận</Text>
      {loading && <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />}
    </>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bình luận</Text>
        <View style={styles.iconBtn} />
      </View>

      <FlatList
        data={comments}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <>
            <CommentItem
              comment={item}
              currentUserId={user?._id}
              onReply={(c) => {
                setReplyTo({ id: c._id, name: c.authorName });
                void loadReplies(c._id);
              }}
              onDelete={(id) => user && removeComment(id, user._id)}
            />
            {(replies[item._id] ?? []).map((reply) => (
              <CommentItem
                key={reply._id}
                comment={reply}
                currentUserId={user?._id}
                isReply
                onDelete={(id) => user && removeComment(id, user._id)}
              />
            ))}
          </>
        )}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>Chưa có bình luận — hãy là người đầu tiên!</Text>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={[styles.inputSection, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.reactionsScroll}
        >
          {quickReactions.map((reaction) => (
            <TouchableOpacity
              key={reaction}
              style={styles.reactionChip}
              onPress={() => handleSend(reaction)}
            >
              <Text style={styles.reactionText}>{reaction}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.inputRow}>
          {replyTo && (
            <View style={styles.replyBanner}>
              <Text style={styles.replyBannerText}>Trả lời {replyTo.name}</Text>
              <TouchableOpacity onPress={() => setReplyTo(null)}>
                <Feather name="x" size={16} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          )}
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.inputAvatar} />
          ) : (
            <View style={[styles.inputAvatar, styles.avatarPh]} />
          )}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Viết bình luận..."
              placeholderTextColor={colors.onSurfaceVariant}
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, submitting && styles.sendDisabled]}
              onPress={() => handleSend()}
              disabled={submitting || !commentText.trim()}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <Feather name="send" size={16} color={colors.onPrimary} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  iconBtn: { padding: spacing.xs, width: 40 },
  headerTitle: {
    ...typography.headlineMd,
    color: colors.primary,
    flex: 1,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: spacing.md,
  },
  postAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    marginBottom: spacing.sm,
  },
  postAvatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    marginRight: spacing.sm,
  },
  avatarPh: { backgroundColor: colors.surfaceVariant },
  postAuthorName: {
    ...typography.headlineMd,
    fontSize: 16,
    color: colors.onSurface,
  },
  postTime: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  postText: {
    ...typography.bodyLg,
    color: colors.onSurface,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    lineHeight: 24,
  },
  postImage: {
    width: '100%',
    height: 220,
    marginBottom: spacing.sm,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    ...typography.labelMd,
    color: colors.primary,
    marginLeft: spacing.xs,
    fontWeight: '700',
  },
  divider: {
    height: spacing.sm,
    backgroundColor: colors.surfaceContainerLow,
  },
  commentsTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  empty: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  inputSection: {
    backgroundColor: colors.surface,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  reactionsScroll: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  reactionChip: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginRight: spacing.sm,
  },
  reactionText: {
    ...typography.labelMd,
    color: colors.onSurface,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
  },
  inputAvatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    marginRight: spacing.sm,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radius.full,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
    minHeight: 44,
  },
  textInput: {
    flex: 1,
    ...typography.bodyMd,
    color: colors.onSurface,
    maxHeight: 100,
    paddingVertical: spacing.xs,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.6 },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  replyBannerText: { ...typography.labelMd, color: colors.primary },
});
}
