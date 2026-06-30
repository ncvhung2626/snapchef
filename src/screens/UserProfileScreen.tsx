import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Share,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import type { RootStackScreenProps } from '../types/navigation';
import type { Post, Reel, User } from '../types/models';
import { useAuth } from '../context/AuthContext';
import { fetchUserProfile, getExtendedProfileStats, type ExtendedProfileStats } from '../services/profileService';
import {
  isFollowing,
  followUser,
  unfollowUser,
  getMutualFriends,
} from '../services/friendService';
import { getPostsByAuthorId } from '../services/postService';
import { getReelsByUserId } from '../services/reelService';
import { getOrCreateConversation } from '../services/chatService';
import { ContentTabs } from '../components/ContentTabs';
import { PostCard } from '../components/PostCard';
import { ProfileSkeleton } from '../components/ProfileSkeleton';
import { EmptyState, ErrorState } from '../components/StateViews';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';
import { formatRelativeTime } from '../utils/formatTime';
import { getRoleLabel } from '../utils/roleLabel';

const COVER_DEFAULT =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop';

const PROFILE_TABS = [
  { key: 'feed', label: 'Bài viết' },
  { key: 'recipes', label: 'Công thức' },
  { key: 'reels', label: 'Reels' },
  { key: 'saved', label: 'Đã lưu' },
];

const EMPTY_STATS: ExtendedProfileStats = {
  postsCount: 0,
  followersCount: 0,
  followingCount: 0,
  recipesCount: 0,
  reelsCount: 0,
  groupsCount: 0,
};

export const UserProfileScreen = ({ navigation, route }: RootStackScreenProps<'UserProfile'>) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user: currentUser } = useAuth();
  const { userId } = route.params;

  const [profile, setProfile] = useState<User | null>(null);
  const [stats, setStats] = useState<ExtendedProfileStats>(EMPTY_STATS);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [following, setFollowing] = useState(false);
  const [mutualFriends, setMutualFriends] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState('feed');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSelf = currentUser?._id === userId;
  const displayTabs = isSelf ? PROFILE_TABS : PROFILE_TABS.filter((t) => t.key !== 'saved');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [p, s, postList, reelList] = await Promise.all([
        fetchUserProfile(userId),
        getExtendedProfileStats(userId),
        getPostsByAuthorId(userId, currentUser?._id),
        getReelsByUserId(userId, currentUser?._id),
      ]);
      setProfile(p);
      setStats(s);
      setPosts(postList);
      setReels(reelList);

      if (currentUser && currentUser._id !== userId) {
        const [isFol, mutual] = await Promise.all([
          isFollowing(currentUser._id, userId),
          getMutualFriends(currentUser._id, userId),
        ]);
        setFollowing(isFol);
        setMutualFriends(mutual);
      } else {
        setFollowing(false);
        setMutualFriends([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được hồ sơ');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, currentUser]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const onRefresh = () => {
    setRefreshing(true);
    void load(true);
  };

  const handleFollow = async () => {
    if (!currentUser) {
      Alert.alert('Đăng nhập', 'Vui lòng đăng nhập để theo dõi');
      return;
    }
    try {
      if (following) {
        await unfollowUser(currentUser._id, userId);
        setFollowing(false);
        setStats((s) => ({ ...s, followersCount: Math.max(0, s.followersCount - 1) }));
      } else {
        await followUser(currentUser._id, userId);
        setFollowing(true);
        setStats((s) => ({ ...s, followersCount: s.followersCount + 1 }));
      }
    } catch (err) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thực hiện được');
    }
  };

  const handleMessage = async () => {
    if (!currentUser) {
      Alert.alert('Đăng nhập', 'Vui lòng đăng nhập để nhắn tin');
      return;
    }
    try {
      const convo = await getOrCreateConversation(currentUser._id, userId);
      navigation.navigate('Chat', { conversationId: convo._id, title: profile?.fullname });
    } catch (err) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không mở được cuộc trò chuyện');
    }
  };

  const handleShare = async () => {
    if (!profile) return;
    try {
      const handle = profile.username ? `@${profile.username}` : profile.fullname;
      await Share.share({
        message: `Xem hồ sơ ${profile.fullname} (${handle}) trên SnapChef!`,
      });
    } catch {
      /* ignore */
    }
  };

  const feedPosts = posts.filter((p) => !p.isRecipe);
  const recipePosts = posts.filter((p) => p.isRecipe);
  const tabPosts = activeTab === 'recipes' ? recipePosts : activeTab === 'feed' ? feedPosts : [];

  const statItems = [
    { label: 'Theo dõi', value: stats.followersCount, onPress: () => navigation.navigate('Friends', { userId, tab: 'followers' }) },
    { label: 'Đang theo dõi', value: stats.followingCount, onPress: () => navigation.navigate('Friends', { userId, tab: 'following' }) },
    { label: 'Bài viết', value: stats.postsCount },
    { label: 'Công thức', value: stats.recipesCount },
    { label: 'Reels', value: stats.reelsCount },
    { label: 'Nhóm', value: stats.groupsCount },
  ];

  if (loading && !profile) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Feather name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
        </View>
        <ProfileSkeleton />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Feather name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
        </View>
        <ErrorState message={error ?? 'Không tải được hồ sơ'} onRetry={() => void load()} />
      </View>
    );
  }

  const handle = profile.username ? `@${profile.username}` : `@${profile.fullname.toLowerCase().replace(/\s+/g, '_')}`;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Feather name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>{profile.fullname}</Text>
        <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
          <Feather name="share-2" size={22} color={colors.onSurface} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Image source={{ uri: COVER_DEFAULT }} style={styles.cover} />

        <View style={styles.profileHeader}>
          <View style={[styles.avatarWrap, { borderColor: colors.surface, backgroundColor: colors.primaryFixed }]}>
            {profile.avatar ? (
              <Image source={{ uri: profile.avatar }} style={styles.avatar} />
            ) : (
              <Feather name="user" size={40} color={colors.onPrimaryFixed} />
            )}
          </View>
          <Text style={styles.name}>{profile.fullname}</Text>
          <Text style={styles.handle}>{handle}</Text>
          {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{getRoleLabel(profile.role)}</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
          {statItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.statChip}
              onPress={item.onPress}
              disabled={!item.onPress}
            >
              <Text style={styles.statNum}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.actionRow}>
          {isSelf ? (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Feather name="edit-3" size={18} color={colors.onPrimary} />
              <Text style={styles.primaryBtnText}>Chỉnh sửa hồ sơ</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={following ? styles.secondaryBtn : styles.primaryBtn}
                onPress={handleFollow}
              >
                <Feather
                  name={following ? 'user-check' : 'user-plus'}
                  size={18}
                  color={following ? colors.onSurface : colors.onPrimary}
                />
                <Text style={following ? styles.secondaryBtnText : styles.primaryBtnText}>
                  {following ? 'Đang theo dõi' : 'Theo dõi'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={handleMessage}>
                <Feather name="message-circle" size={18} color={colors.onSurface} />
                <Text style={styles.secondaryBtnText}>Nhắn tin</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {mutualFriends.length > 0 && (
          <View style={styles.mutualSection}>
            <Text style={styles.mutualTitle}>{mutualFriends.length} bạn chung</Text>
            <View style={styles.mutualAvatars}>
              {mutualFriends.slice(0, 6).map((f) => (
                <TouchableOpacity key={f._id} onPress={() => navigation.push('UserProfile', { userId: f._id })}>
                  {f.avatar ? (
                    <Image source={{ uri: f.avatar }} style={styles.mutualAvatar} />
                  ) : (
                    <View style={[styles.mutualAvatar, styles.mutualPh]}>
                      <Feather name="user" size={12} color={colors.onSurfaceVariant} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <ContentTabs tabs={displayTabs} active={activeTab} onChange={setActiveTab} />

        {activeTab === 'saved' && isSelf ? (
          <EmptyState
            icon="bookmark"
            title="Công thức đã lưu"
            message="Xem tất cả công thức bạn đã lưu"
            actionLabel="Mở danh sách"
            onAction={() => navigation.navigate('SavedRecipes')}
          />
        ) : activeTab === 'reels' ? (
          reels.length === 0 ? (
            <EmptyState icon="film" title="Chưa có Reels" message="Người dùng chưa đăng Reels nào" />
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
                    <View style={styles.reelThumbPh}>
                      <Feather name="film" size={28} color={colors.onSurfaceVariant} />
                    </View>
                  )}
                  <View style={styles.reelOverlay}>
                    <Feather name="play" size={14} color="#fff" />
                    <Text style={styles.reelViews}>{reel.viewCount}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )
        ) : tabPosts.length === 0 ? (
          <EmptyState
            icon={activeTab === 'recipes' ? 'book-open' : 'file-text'}
            title={activeTab === 'recipes' ? 'Chưa có công thức' : 'Chưa có bài viết'}
            message="Hãy quay lại sau nhé!"
          />
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
              imageUrls={post.images}
              videoUrl={post.videos[0]}
              likesCount={post.likes.length}
              commentsCount={post.commentsCount}
              sharesCount={post.shares}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.outlineVariant,
    },
    iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    topTitle: { ...typography.headlineMd, flex: 1, textAlign: 'center', color: colors.onSurface },
    scroll: { paddingBottom: spacing['2xl'] },
    cover: { width: '100%', height: 160 },
    profileHeader: { alignItems: 'center', marginTop: -48, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
    avatarWrap: {
      width: 96,
      height: 96,
      borderRadius: radius.full,
      borderWidth: 4,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatar: { width: '100%', height: '100%' },
    name: { ...typography.headlineMd, color: colors.onSurface, marginTop: spacing.md },
    handle: { ...typography.labelMd, color: colors.onSurfaceVariant, marginTop: 2 },
    bio: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.sm },
    roleBadge: {
      marginTop: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing['2xs'],
      borderRadius: radius.full,
      backgroundColor: colors.primaryContainer,
    },
    roleText: { ...typography.labelMd, color: colors.primary, fontWeight: '600' },
    statsScroll: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: spacing.sm },
    statChip: {
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      minWidth: 88,
    },
    statNum: { ...typography.headlineMd, color: colors.onSurface, fontWeight: '700' },
    statLabel: { ...typography.labelMd, color: colors.onSurfaceVariant, fontSize: 10, marginTop: 2 },
    actionRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
    },
    primaryBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      backgroundColor: colors.primary,
      paddingVertical: spacing.sm,
      borderRadius: radius.lg,
    },
    primaryBtnText: { ...typography.labelMd, color: colors.onPrimary, fontWeight: '700' },
    secondaryBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      backgroundColor: colors.surface,
      paddingVertical: spacing.sm,
      borderRadius: radius.lg,
    },
    secondaryBtnText: { ...typography.labelMd, color: colors.onSurface, fontWeight: '600' },
    mutualSection: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
    mutualTitle: { ...typography.labelMd, color: colors.onSurfaceVariant, marginBottom: spacing.sm },
    mutualAvatars: { flexDirection: 'row', gap: spacing.xs },
    mutualAvatar: { width: 36, height: 36, borderRadius: 18 },
    mutualPh: {
      backgroundColor: colors.surfaceContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    reelGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: spacing.sm,
    },
    reelCell: { width: '33.33%', aspectRatio: 9 / 16, padding: 2 },
    reelThumb: { width: '100%', height: '100%', borderRadius: radius.md },
    reelThumbPh: {
      flex: 1,
      backgroundColor: colors.surfaceContainer,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    reelOverlay: {
      position: 'absolute',
      bottom: 8,
      left: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    reelViews: { ...typography.labelMd, color: '#fff', fontSize: 11, fontWeight: '600' },
  });
}
