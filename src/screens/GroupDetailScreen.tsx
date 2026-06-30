import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { useTheme } from '../theme/ThemeContext';
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
import { ContentTabs } from '../components/ContentTabs';
import { EmptyState, ErrorState } from '../components/StateViews';
import { useAuth } from '../context/AuthContext';
import * as groupService from '../services/groupService';
import type { GroupWithMembership } from '../services/groupService';
import { getOrCreateGroupConversation } from '../services/chatService';
import { getPostsByGroupId, toggleLike } from '../services/postService';
import type { Post } from '../types/models';
import { formatRelativeTime } from '../utils/formatTime';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

export const GroupDetailScreen = ({ navigation, route }: any) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const groupId = route.params?.groupId as string;
  const { user } = useAuth();
  const [group, setGroup] = useState<GroupWithMembership | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [refreshing, setRefreshing] = useState(false);
  const [members, setMembers] = useState<Awaited<ReturnType<typeof groupService.getGroupMembers>>>([]);

  const GROUP_TABS = [
    { key: 'posts', label: 'Bài viết' },
    { key: 'reels', label: 'Reels' },
    { key: 'members', label: 'Thành viên' },
    { key: 'about', label: 'Giới thiệu' },
  ];

  const load = useCallback(async () => {
    setError(null);
    try {
      const [g, p, m] = await Promise.all([
        groupService.getGroupById(groupId, user?._id),
        getPostsByGroupId(groupId, user?._id),
        groupService.getGroupMembers(groupId).catch(() => []),
      ]);
      setGroup(g ?? null);
      setPosts(p);
      setMembers(m);
      if (!g) setError('Không tìm thấy nhóm hoặc bạn không có quyền xem.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được nhóm');
      setGroup(null);
      setPosts([]);
    }
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

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
        <Text style={styles.emptyText}>{error ?? 'Không tìm thấy nhóm'}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleOpenChat = async () => {
    if (!user || !group.isMember) return;
    setOpeningChat(true);
    try {
      const convo = await getOrCreateGroupConversation(groupId, user._id);
      navigation.navigate('Chat', {
        conversationId: convo._id,
        title: convo.groupTitle ?? group.name,
        isGroupChat: true,
      });
    } catch (e) {
      Alert.alert('Lỗi', e instanceof Error ? e.message : 'Không mở được chat nhóm');
    } finally {
      setOpeningChat(false);
    }
  };

  const isAdmin = groupService.canManageGroup(group, user?._id);
  const listData = activeTab === 'posts' ? posts : [];

  const renderTabBody = () => {
    if (activeTab === 'reels') {
      return <EmptyState icon="film" title="Reels nhóm" message="Reels trong nhóm sẽ hiển thị tại đây." />;
    }
    if (activeTab === 'members') {
      const roleLabel = (role: string) => {
        if (role === 'owner') return 'Chủ nhóm';
        if (role === 'admin') return 'Quản trị viên';
        return 'Thành viên';
      };
      return (
        <View style={styles.membersSection}>
          <Text style={styles.membersTitle}>Thành viên ({members.length || (group.membersCount ?? 0)})</Text>
          {members.map((m) => (
            <TouchableOpacity
              key={m.userId}
              style={styles.memberRow}
              onPress={() => navigation.navigate('UserProfile', { userId: m.userId })}
            >
              {m.avatar ? (
                <Image source={{ uri: m.avatar }} style={styles.memberAvatar} />
              ) : (
                <View style={[styles.memberAvatar, styles.memberAvatarPh]}>
                  <Feather name="user" size={16} color={colors.onSurfaceVariant} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>{m.fullname}</Text>
                <Text style={styles.memberRole}>{roleLabel(m.role)}</Text>
              </View>
            </TouchableOpacity>
          ))}
          {group.isMember && isAdmin && (
            <TouchableOpacity
              style={styles.inviteBtn}
              onPress={() => navigation.navigate('Friends', { userId: user?._id })}
            >
              <Feather name="user-plus" size={18} color={colors.onPrimary} />
              <Text style={styles.inviteText}>Mời thành viên</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    if (activeTab === 'about') {
      return (
        <View style={styles.aboutSection}>
          <Text style={styles.aboutTitle}>Giới thiệu</Text>
          <Text style={styles.description}>{group.description || 'Nhóm chưa có mô tả.'}</Text>
          <Text style={styles.privacyText}>
            {group.privacy === 'private' ? '🔒 Nhóm riêng tư' : '🌐 Nhóm công khai'}
          </Text>
        </View>
      );
    }
    return null;
  };

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
            onPress={() => navigation.navigate('EditGroup', { groupId })}
          >
            <Feather name="edit-2" size={22} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={listData}
        keyExtractor={(item) => item._id}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        renderItem={({ item }) => (
          <PostCard
            postId={item._id}
            author={item.author.fullname}
            authorId={item.author._id}
            authorAvatar={item.author.avatar}
            authorRole={item.author.role}
            time={formatRelativeTime(item.createdAt)}
            title={item.title}
            content={item.content}
            hashtags={item.hashtags}
            imageUrls={item.images}
            likesCount={item.likes.length}
            commentsCount={item.commentsCount}
            sharesCount={item.shares}
            isLiked={user ? item.likes.includes(user._id) : false}
            onLike={() => handleLike(item._id)}
          />
        )}
        ListEmptyComponent={
          activeTab === 'posts' ? (
            <Text style={styles.emptyPosts}>
              {group.isMember ? 'Chưa có bài trong nhóm. Hãy đăng bài đầu tiên!' : 'Tham gia nhóm để xem và đăng bài.'}
            </Text>
          ) : null
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
                  <TouchableOpacity
                    style={styles.adminChip}
                    onPress={() => navigation.navigate('PostManagement', { groupId })}
                  >
                    <Feather name="settings" size={14} color={colors.primary} />
                    <Text style={styles.adminChipText}>Quản lý bài viết</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.adminChip}
                    onPress={() => navigation.navigate('EditGroup', { groupId })}
                  >
                    <Feather name="edit-2" size={14} color={colors.primary} />
                    <Text style={styles.adminChipText}>Chỉnh sửa nhóm</Text>
                  </TouchableOpacity>
                </View>
              )}
              {group.isMember && (
                <TouchableOpacity style={styles.chatBtn} onPress={handleOpenChat} disabled={openingChat}>
                  {openingChat ? (
                    <ActivityIndicator size="small" color={colors.onPrimary} />
                  ) : (
                    <>
                      <Feather name="message-circle" size={18} color={colors.onPrimary} />
                      <Text style={styles.chatBtnText}>Chat nhóm</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {group.isMember && (group.memberCanPost !== false || isAdmin) && (
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

            <ContentTabs tabs={GROUP_TABS} active={activeTab} onChange={setActiveTab} />
            {renderTabBody()}
          </View>
        )}
      />
    </View>
  );
};

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
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
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  chatBtnText: { ...typography.labelMd, color: colors.onPrimary },
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
  membersSection: { padding: spacing.lg },
  membersTitle: { ...typography.headlineMd, color: colors.onSurface, marginBottom: spacing.md },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  memberAvatar: { width: 40, height: 40, borderRadius: 20 },
  memberAvatarPh: {
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberName: { ...typography.bodyMd, color: colors.onSurface, fontWeight: '600' },
  memberRole: { ...typography.labelMd, color: colors.onSurfaceVariant },
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  inviteText: { ...typography.labelMd, color: colors.onPrimary, fontWeight: '700' },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  roleLabel: { ...typography.bodyMd, color: colors.onSurface },
  aboutSection: { padding: spacing.lg },
  aboutTitle: { ...typography.headlineMd, color: colors.onSurface, marginBottom: spacing.sm },
});
}
