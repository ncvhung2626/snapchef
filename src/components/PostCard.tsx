import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Share,
  Alert,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import type { RootStackParamList } from '../types/navigation';
import type { UserRole } from '../types/models';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';
import { getRoleLabel } from '../utils/roleLabel';

export interface PostCardProps {
  postId: string;
  author: string;
  authorUsername?: string;
  authorId?: string;
  authorAvatar?: string;
  authorRole?: UserRole;
  time: string;
  title?: string;
  content: string;
  hashtags?: string[];
  imageUrl?: string;
  videoUrl?: string;
  likesCount?: number;
  commentsCount?: number;
  savesCount?: number;
  sharesCount?: number;
  isLiked?: boolean;
  isSaved?: boolean;
  onLike?: () => void;
  onSave?: () => void;
  style?: StyleProp<ViewStyle>;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export const PostCard = React.memo(function PostCard({
  postId,
  author,
  authorUsername,
  authorId,
  authorAvatar,
  authorRole = 'user',
  time,
  title,
  content,
  hashtags = [],
  imageUrl,
  videoUrl,
  likesCount = 0,
  commentsCount = 0,
  savesCount = 0,
  sharesCount = 0,
  isLiked = false,
  isSaved = false,
  onLike,
  onSave,
  style,
}: PostCardProps) {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const openDetail = () => navigation.getParent()?.navigate('PostDetail', { postId });
  const openAuthor = () => {
    if (authorId) navigation.getParent()?.navigate('UserProfile', { userId: authorId });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${title ? `${title}\n` : ''}${content}\n\n— SnapChef`,
      });
    } catch {
      /* ignore */
    }
  };

  const handleMenu = () => {
    Alert.alert('Tùy chọn', undefined, [
      { text: 'Xem chi tiết', onPress: openDetail },
      { text: 'Báo cáo', style: 'destructive', onPress: () => Alert.alert('Đã ghi nhận', 'Cảm ơn bạn đã báo cáo.') },
      { text: 'Hủy', style: 'cancel' },
    ]);
  };

  const hasStats = likesCount > 0 || commentsCount > 0 || savesCount > 0 || sharesCount > 0;

  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.authorRow} onPress={openAuthor} activeOpacity={0.8}>
          {authorAvatar ? (
            <Image source={{ uri: authorAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPh]}>
              <Feather name="user" size={18} color={colors.onSurfaceVariant} />
            </View>
          )}
          <View style={styles.headerText}>
            <View style={styles.nameRow}>
              <Text style={styles.author} numberOfLines={1}>{author}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{getRoleLabel(authorRole)}</Text>
              </View>
            </View>
            {authorUsername ? (
              <Text style={styles.username}>@{authorUsername}</Text>
            ) : null}
            <Text style={styles.time}>{time}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuBtn} onPress={handleMenu} hitSlop={8}>
          <Feather name="more-horizontal" size={22} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity activeOpacity={0.95} onPress={openDetail}>
        {title ? <Text style={styles.postTitle}>{title}</Text> : null}
        <Text style={styles.content} numberOfLines={6}>{content}</Text>
        {hashtags.length > 0 && (
          <View style={styles.hashtagRow}>
            {hashtags.slice(0, 5).map((tag) => (
              <Text key={tag} style={styles.hashtag}>#{tag}</Text>
            ))}
          </View>
        )}
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : null}
        {videoUrl && !imageUrl ? (
          <View style={styles.videoWrap}>
            <Image source={{ uri: videoUrl }} style={styles.image} resizeMode="cover" />
            <View style={styles.playOverlay}>
              <Feather name="play-circle" size={48} color="#fff" />
            </View>
          </View>
        ) : null}
      </TouchableOpacity>

      {hasStats && (
        <View style={styles.statsRow}>
          {likesCount > 0 && <Text style={styles.statText}>{formatCount(likesCount)} lượt thích</Text>}
          <View style={styles.statsRight}>
            {commentsCount > 0 && <Text style={styles.statText}>{formatCount(commentsCount)} bình luận</Text>}
            {savesCount > 0 && <Text style={[styles.statText, styles.statGap]}>{formatCount(savesCount)} lưu</Text>}
            {sharesCount > 0 && <Text style={[styles.statText, styles.statGap]}>{formatCount(sharesCount)} chia sẻ</Text>}
          </View>
        </View>
      )}

      <View style={styles.divider} />

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={onLike}>
          <Feather name="heart" size={22} color={isLiked ? colors.error : colors.onSurfaceVariant} />
          <Text style={[styles.actionText, isLiked && styles.actionTextLiked]}>Thích</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.getParent()?.navigate('Comment', { postId })}
        >
          <Feather name="message-circle" size={22} color={colors.onSurfaceVariant} />
          <Text style={styles.actionText}>Bình luận</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onSave}>
          <Feather name="bookmark" size={22} color={isSaved ? colors.primary : colors.onSurfaceVariant} />
          <Text style={[styles.actionText, isSaved && styles.actionTextSaved]}>Lưu</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Feather name="share-2" size={22} color={colors.onSurfaceVariant} />
          <Text style={styles.actionText}>Chia sẻ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      marginVertical: spacing.sm,
      marginHorizontal: spacing.md,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      overflow: 'hidden',
      ...shadows.card,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    authorRow: { flexDirection: 'row', flex: 1, alignItems: 'center' },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: radius.full,
      marginRight: spacing.sm,
    },
    avatarPh: {
      backgroundColor: colors.surfaceContainerHigh,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs },
    author: { ...typography.bodyMd, fontWeight: '700', color: colors.onSurface, maxWidth: '70%' },
    roleBadge: {
      backgroundColor: colors.primaryContainer,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.full,
    },
    roleText: { ...typography.labelMd, fontSize: 10, color: colors.onPrimaryContainer, fontWeight: '600' },
    username: { ...typography.labelMd, color: colors.onSurfaceVariant, fontSize: 12 },
    time: { ...typography.labelMd, color: colors.onSurfaceVariant, marginTop: 2 },
    menuBtn: { padding: spacing.xs },
    postTitle: {
      ...typography.headlineMd,
      color: colors.onSurface,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.xs,
    },
    content: {
      ...typography.bodyLg,
      color: colors.onSurface,
      paddingHorizontal: spacing.md,
      lineHeight: 22,
    },
    hashtagRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      marginTop: spacing.sm,
    },
    hashtag: { ...typography.labelMd, color: colors.primary, fontWeight: '600' },
    image: {
      width: '100%',
      height: 220,
      marginTop: spacing.md,
      backgroundColor: colors.surfaceContainerLow,
    },
    videoWrap: { position: 'relative' },
    playOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.25)',
      marginTop: spacing.md,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
    },
    statsRight: { flexDirection: 'row', alignItems: 'center' },
    statText: { ...typography.labelMd, color: colors.onSurfaceVariant, fontSize: 12 },
    statGap: { marginLeft: spacing.sm },
    divider: {
      height: 1,
      backgroundColor: colors.outlineVariant,
      marginHorizontal: spacing.md,
      marginTop: spacing.sm,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.xs,
    },
    actionText: { ...typography.labelMd, color: colors.onSurfaceVariant, fontWeight: '600' },
    actionTextLiked: { color: colors.error },
    actionTextSaved: { color: colors.primary },
  });
}
