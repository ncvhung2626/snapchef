import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { AppHeader } from '../components/AppHeader';
import { ContentTabs } from '../components/ContentTabs';
import { PostCard } from '../components/PostCard';
import { EmptyState } from '../components/StateViews';
import { useAuth } from '../context/AuthContext';
import { getProfileStats, getExtendedProfileStats } from '../services/profileService';
import { getPostsByAuthorId } from '../services/postService';
import { getReelsByUserId } from '../services/reelService';
import type { RootStackParamList } from '../types/navigation';
import type { Post, Reel } from '../types/models';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';
import { formatRelativeTime } from '../utils/formatTime';
import { getRoleLabel } from '../utils/roleLabel';

const COVER_DEFAULT = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop';

const PROFILE_TABS = [
  { key: 'feed', label: 'Bài viết' },
  { key: 'recipes', label: 'Công thức' },
  { key: 'reels', label: 'Reels' },
  { key: 'saved', label: 'Đã lưu' },
];

export const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user, logout, refreshProfile } = useAuth();
  const [postsCount, setPostsCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [recipesCount, setRecipesCount] = useState(0);
  const [reelsCount, setReelsCount] = useState(0);
  const [groupsCount, setGroupsCount] = useState(0);
  const [activeTab, setActiveTab] = useState('feed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshProfile().catch(() => {});
      if (user?._id) {
        getExtendedProfileStats(user._id)
          .then((s) => {
            setPostsCount(s.postsCount);
            setFollowersCount(s.followersCount);
            setFollowingCount(s.followingCount);
            setRecipesCount(s.recipesCount);
            setReelsCount(s.reelsCount);
            setGroupsCount(s.groupsCount);
          })
          .catch(() => {
            setPostsCount(0);
            setFollowersCount(0);
            setFollowingCount(0);
            setRecipesCount(0);
            setReelsCount(0);
            setGroupsCount(0);
          });
        setLoadingPosts(true);
        Promise.all([
          getPostsByAuthorId(user._id, user._id),
          getReelsByUserId(user._id, user._id),
        ])
          .then(([p, r]) => {
            setPosts(p);
            setReels(r);
          })
          .catch(() => {
            setPosts([]);
            setReels([]);
          })
          .finally(() => setLoadingPosts(false));
      }
    }, [refreshProfile, user?._id])
  );

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const followers = followersCount;
  const following = followingCount;
  const feedPosts = posts.filter((p) => !p.isRecipe);
  const recipePosts = posts.filter((p) => p.isRecipe);
  const tabPosts = activeTab === 'recipes' ? recipePosts : activeTab === 'feed' ? feedPosts : [];

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <AppHeader title="Cá nhân" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image source={{ uri: COVER_DEFAULT }} style={styles.cover} />
        <View style={styles.profileHeader}>
          <View style={[styles.avatarContainer, { borderColor: colors.surface, backgroundColor: colors.primaryFixed }]}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <Feather name="user" size={40} color={colors.onPrimaryFixed} />
            )}
          </View>
          <Text style={[styles.name, { color: colors.onSurface }]}>{user?.fullname ?? 'Khách'}</Text>
          {user?.username ? (
            <Text style={[styles.handle, { color: colors.onSurfaceVariant }]}>@{user.username}</Text>
          ) : null}
          <Text style={[styles.bio, { color: colors.onSurfaceVariant }]}>{user?.bio || user?.email || 'SnapChef member'}</Text>
          <View style={[styles.roleBadge, { backgroundColor: colors.primaryContainer }]}>
            <Text style={[styles.roleText, { color: colors.primary }]}>{getRoleLabel(user?.role)}</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
          {[
            { label: 'Theo dõi', value: followers },
            { label: 'Đang theo dõi', value: following },
            { label: 'Bài viết', value: postsCount },
            { label: 'Công thức', value: recipesCount },
            { label: 'Reels', value: reelsCount },
            { label: 'Nhóm', value: groupsCount },
          ].map((item) => (
            <View key={item.label} style={[styles.statChip, { borderColor: colors.outlineVariant, backgroundColor: colors.surface }]}>
              <Text style={[styles.statNumber, { color: colors.onSurface }]}>{item.value}</Text>
              <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>{item.label}</Text>
            </View>
          ))}
        </ScrollView>

        <ContentTabs tabs={PROFILE_TABS} active={activeTab} onChange={setActiveTab} />

        {activeTab === 'saved' ? (
          <EmptyState
            icon="bookmark"
            title="Công thức đã lưu"
            message="Xem tất cả công thức bạn đã lưu"
            actionLabel="Mở danh sách"
            onAction={() => navigation.getParent()?.navigate('SavedRecipes')}
          />
        ) : activeTab === 'reels' ? (
          reels.length === 0 ? (
            <EmptyState icon="film" title="Chưa có Reels" message="Reels bạn đăng sẽ hiển thị tại đây" />
          ) : (
            <View style={styles.reelGrid}>
              {reels.map((reel) => (
                <TouchableOpacity
                  key={reel._id}
                  style={styles.reelCell}
                  onPress={() => navigation.getParent()?.navigate('Reels')}
                >
                  {reel.thumbnailUrl ? (
                    <Image source={{ uri: reel.thumbnailUrl }} style={styles.reelThumb} />
                  ) : (
                    <View style={[styles.reelThumbPh, { backgroundColor: colors.surfaceContainer }]}>
                      <Feather name="film" size={24} color={colors.onSurfaceVariant} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )
        ) : loadingPosts ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />
        ) : tabPosts.length === 0 ? (
          <EmptyState icon="file-text" title="Chưa có bài đăng" message="Hãy chia sẻ món ngon đầu tiên của bạn!" />
        ) : (
          tabPosts.map((post) => (
            <PostCard
              key={post._id}
              postId={post._id}
              author={post.author.fullname}
              authorUsername={post.author.username}
              authorId={post.author._id}
              authorAvatar={post.author.avatar}
              authorRole={post.author.role}
              time={formatRelativeTime(post.createdAt)}
              title={post.title}
              content={post.content}
              hashtags={post.hashtags}
              imageUrl={post.images[0]}
              videoUrl={post.videos[0]}
              likesCount={post.likes.length}
              commentsCount={post.commentsCount}
              sharesCount={post.shares}
            />
          ))
        )}

        <View style={[styles.menuSection, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.outlineVariant }]}
            onPress={() => navigation.getParent()?.navigate('EditProfile')}
          >
            <Feather name="edit-3" size={20} color={colors.primary} />
            <Text style={[styles.menuLabel, { color: colors.onSurface }]}>Chỉnh sửa hồ sơ</Text>
            <Feather name="chevron-right" size={20} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.getParent()?.navigate('SavedRecipes')}
          >
            <Feather name="bookmark" size={20} color={colors.onSurface} />
            <Text style={styles.menuLabel}>Công thức đã lưu</Text>
            <Feather name="chevron-right" size={20} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.getParent()?.navigate('Achievements')}
          >
            <Feather name="award" size={20} color={colors.primary} />
            <Text style={styles.menuLabel}>Thành tích</Text>
            <Feather name="chevron-right" size={20} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.getParent()?.navigate('Friends', { userId: user?._id })}
          >
            <Feather name="users" size={20} color={colors.onSurface} />
            <Text style={styles.menuLabel}>Bạn bè & theo dõi</Text>
            <Feather name="chevron-right" size={20} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.getParent()?.navigate('Settings')}
          >
            <Feather name="settings" size={20} color={colors.onSurface} />
            <Text style={styles.menuLabel}>Cài đặt</Text>
            <Feather name="chevron-right" size={20} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
          {(user?.role === 'admin' || user?.role === 'moderator') && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.getParent()?.navigate('AdminModeration')}
            >
              <Feather name="shield" size={20} color={colors.error} />
              <Text style={styles.menuLabel}>Kiểm duyệt nội dung</Text>
              <Feather name="chevron-right" size={20} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: colors.errorContainer, backgroundColor: colors.surface }]}
          onPress={handleLogout}
        >
          <Feather name="log-out" size={20} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: spacing['2xl'] },
  cover: { width: '100%', height: 140 },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: -44,
    paddingBottom: spacing.lg,
  },
  avatarContainer: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 4,
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  name: { ...typography.headlineMd, marginBottom: spacing['2xs'] },
  handle: { ...typography.labelMd, marginBottom: spacing['2xs'] },
  bio: { ...typography.bodyMd, textAlign: 'center', paddingHorizontal: spacing.md },
  roleBadge: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing['2xs'],
    borderRadius: radius.full,
  },
  roleText: { ...typography.labelMd },
  statsScroll: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: spacing.sm },
  statChip: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    minWidth: 80,
    marginRight: spacing.sm,
  },
  statNumber: { ...typography.headlineMd, marginBottom: spacing['2xs'] },
  statLabel: { ...typography.labelMd, fontSize: 10, textAlign: 'center' },
  reelGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.sm },
  reelCell: { width: '33.33%', aspectRatio: 9 / 16, padding: 2 },
  reelThumb: { width: '100%', height: '100%', borderRadius: radius.md },
  reelThumbPh: {
    flex: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  menuLabel: { ...typography.bodyLg, flex: 1 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  logoutText: { ...typography.bodyLg, fontWeight: '600' },
});
