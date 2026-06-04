import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { PostCard } from '../components/PostCard';
import { useAuth } from '../context/AuthContext';
import * as groupService from '../services/groupService';
import type { GroupWithMembership } from '../services/groupService';
import { getPostsByGroupId, toggleLike } from '../services/postService';
import type { Post } from '../types/models';
import { formatRelativeTime } from '../utils/formatTime';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

export const GroupDetailScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const groupId = route.params?.groupId as string;
  const { user } = useAuth();
  const [group, setGroup] = useState<GroupWithMembership | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const load = useCallback(async () => {
    const [g, p] = await Promise.all([
      groupService.getGroupById(groupId, user?._id),
      getPostsByGroupId(groupId, user?._id),
    ]);
    setGroup(g ?? null);
    setPosts(p);
  }, [groupId, user?._id]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const handleJoinToggle = async () => {
    if (!user || !group) return;
    setJoining(true);
    try {
      if (group.isMember) {
        await groupService.leaveGroup(groupId, user._id);
        setGroup({ ...group, isMember: false, myRole: undefined });
      } else {
        const updated = await groupService.joinGroup(groupId, user._id);
        setGroup(updated);
      }
    } catch (e) {
      Alert.alert('Lỗi', e instanceof Error ? e.message : 'Thao tác thất bại');
    } finally {
      setJoining(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    try {
      const result = await toggleLike(postId, user._id);
      setPosts((prev) =>
        prev.map((p) => {
          if (p._id !== postId) return p;
          const likes = result.liked
            ? [...p.likes, user._id]
            : p.likes.filter((id) => id !== user._id);
          return { ...p, likes };
        })
      );
    } catch {
      /* ignore */
    }
  };

  const isAdmin = groupService.canManageGroup(group, user?._id);

  if (loading && !group) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.emptyText}>Không tìm thấy nhóm</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {group.name}
          </Text>
        </View>
        {isAdmin && (
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => navigation.navigate('PostManagement', { groupId })}
          >
            <Feather name="settings" size={22} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <PostCard
            postId={item._id}
            author={item.author.fullname}
            authorAvatar={item.author.avatar}
            time={formatRelativeTime(item.createdAt)}
            content={item.content}
            imageUrl={item.images[0]}
            likesCount={item.likes.length}
            commentsCount={item.commentsCount}
            isLiked={user ? item.likes.includes(user._id) : false}
            onLike={() => handleLike(item._id)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyPosts}>
            {group.isMember ? 'Chưa có bài trong nhóm. Hãy đăng bài đầu tiên!' : 'Tham gia nhóm để xem và đăng bài.'}
          </Text>
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={() => (
          <View style={styles.listHeaderContainer}>
            <View style={styles.coverContainer}>
              {group.coverImage ? (
                <Image source={{ uri: group.coverImage }} style={styles.coverImage} />
              ) : (
                <View style={[styles.coverImage, styles.coverPlaceholder]}>
                  <Feather name="image" size={48} color={colors.onPrimaryFixed} style={{ opacity: 0.5 }} />
                </View>
              )}

              <View style={styles.avatarAndActionsRow}>
                <View style={styles.groupAvatarWrapper}>
                  <View style={styles.groupAvatar}>
                    <Feather name="users" size={36} color={colors.onPrimary} />
                  </View>
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.joinButton, group.isMember && styles.joinButtonActive]}
                    onPress={handleJoinToggle}
                    disabled={joining}
                  >
                    {joining ? (
                      <ActivityIndicator size="small" color={colors.onSurface} />
                    ) : (
                      <>
                        <Feather
                          name={group.isMember ? 'check' : 'plus'}
                          size={16}
                          color={colors.onSurface}
                          style={styles.btnIcon}
                        />
                        <Text style={styles.joinText}>
                          {group.isMember ? 'Đã tham gia' : 'Tham gia'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.groupName}>{group.name}</Text>
              <View style={styles.privacyRow}>
                <Feather
                  name={group.privacy === 'private' ? 'lock' : 'globe'}
                  size={14}
                  color={colors.onSurfaceVariant}
                />
                <Text style={styles.privacyText}>
                  {' '}
                  {group.privacy === 'private' ? 'Nhóm riêng tư' : 'Nhóm công khai'} •{' '}
                  {groupService.formatMemberCount(group.membersCount ?? 0)} thành viên
                </Text>
              </View>
              {group.description ? (
                <Text style={styles.description}>{group.description}</Text>
              ) : null}
              {isAdmin && (
                <View style={styles.adminRow}>
                  <TouchableOpacity
                    style={styles.adminChip}
                    onPress={() => navigation.navigate('MemberManagement', { groupId })}
                  >
                    <Feather name="users" size={14} color={colors.primary} />
                    <Text style={styles.adminChipText}>Quản lý thành viên</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {group.isMember && (
              <View style={styles.createPostContainer}>
                <TouchableOpacity
                  style={styles.createPostInput}
                  onPress={() => navigation.navigate('CreatePost', { groupId })}
                >
                  <Text style={styles.createPostPlaceholder}>Bạn đang nấu gì thế?</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigation.navigate('CreatePost', { groupId })}
                >
                  <Feather name="image" size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { ...typography.bodyLg, color: colors.onSurfaceVariant },
  linkText: { ...typography.labelMd, color: colors.primary, marginTop: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerIcon: { padding: spacing.sm },
  headerTitle: {
    ...typography.headlineMd,
    color: colors.primary,
    marginLeft: spacing.xs,
    flex: 1,
  },
  listContent: { paddingBottom: spacing['2xl'] },
  listHeaderContainer: { backgroundColor: colors.surface, marginBottom: spacing.sm },
  coverContainer: { marginBottom: spacing.xl },
  coverImage: { height: 160, width: '100%' },
  coverPlaceholder: {
    backgroundColor: '#3E5C46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarAndActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    marginTop: -40,
  },
  groupAvatarWrapper: {
    padding: 4,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
  },
  groupAvatar: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    minWidth: 120,
    justifyContent: 'center',
  },
  joinButtonActive: { backgroundColor: colors.surfaceVariant },
  btnIcon: { marginRight: spacing.xs },
  joinText: { ...typography.labelMd, color: colors.onSurface },
  infoContainer: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  groupName: { ...typography.headlineLg, color: colors.onSurface, marginBottom: spacing['2xs'] },
  privacyRow: { flexDirection: 'row', alignItems: 'center' },
  privacyText: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  description: {
    ...typography.bodyMd,
    color: colors.onSurface,
    marginTop: spacing.sm,
  },
  adminRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  adminChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primaryFixed,
    borderRadius: radius.full,
  },
  adminChipText: { ...typography.labelMd, color: colors.onPrimaryFixedVariant },
  createPostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  createPostInput: {
    flex: 1,
    height: 40,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.full,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  createPostPlaceholder: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  emptyPosts: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    margin: spacing.xl,
  },
});
