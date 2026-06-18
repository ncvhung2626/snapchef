import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useTheme } from '../theme/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { PostCard } from '../components/PostCard';
import { CategoryChips } from '../components/CategoryChips';
import { AppMenuModal } from '../components/AppMenuModal';
import { FeedSkeleton } from '../components/FeedSkeleton';
import { EmptyState, ErrorState, OfflineBanner } from '../components/StateViews';
import type { FeedTab } from '../hooks/useFeed';
import { useFeedInfiniteQuery, useToggleLikeMutation } from '../queries/useFeedQuery';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useFeedStore } from '../store/feedStore';
import { useGroups } from '../hooks/useGroups';
import { useAuth } from '../context/AuthContext';
import * as groupService from '../services/groupService';
import { formatRelativeTime } from '../utils/formatTime';
import type { Post } from '../types/models';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

const FEED_TABS: { key: FeedTab; label: string }[] = [
  { key: 'forYou', label: 'Dành cho bạn' },
  { key: 'groups', label: 'Nhóm của bạn' },
  { key: 'discover', label: 'Khám phá' },
];

export const HomeScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const rootNav = navigation.getParent();
  const openGroup = (groupId: string) =>
    rootNav?.navigate('GroupDetail', { groupId });
  const openCreateGroup = () => rootNav?.navigate('CreateGroup');
  const [activeFeedTab, setActiveFeedTab] = useState<FeedTab>('forYou');
  const [category, setCategory] = useState('all');
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const setScrollOffset = useFeedStore((s) => s.setScrollOffset);
  const listRef = useRef<FlatList>(null);
  const scrollRestoredRef = useRef(false);

  useEffect(() => {
    scrollRestoredRef.current = false;
  }, [activeFeedTab]);
  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFeedInfiniteQuery(activeFeedTab, category, user?._id);
  const likeMutation = useToggleLikeMutation();
  const { myGroups, discoverGroups, joinGroup } = useGroups();

  const posts = useMemo(
    () => data?.pages.flatMap((p) => p.posts) ?? [],
    [data]
  );

  const toggleLike = useCallback(
    (postId: string) => {
      if (!user) return;
      likeMutation.mutate({ postId, userId: user._id });
    },
    [user, likeMutation]
  );

  const renderPostItem = useCallback(
    ({ item: post }: { item: Post }) => (
      <PostCard
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
        savesCount={post.isSaved ? 1 : 0}
        sharesCount={post.shares}
        isLiked={user ? post.likes.includes(user._id) : false}
        isSaved={post.isSaved}
        onLike={() => toggleLike(post._id)}
        onSave={() => {
          if (!user) return;
          void import('../services/recipeService').then(({ toggleSaveRecipe }) =>
            toggleSaveRecipe(user._id, post._id).then(() => refetch())
          );
        }}
      />
    ),
    [user, toggleLike, refetch]
  );

  const feedHeader = (
    <>
      <View style={styles.tabsScrollWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
          {FEED_TABS.map((tab) => {
            const active = activeFeedTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={active ? styles.tabActive : styles.tabInactive}
                onPress={() => setActiveFeedTab(tab.key)}
              >
                <Text style={active ? styles.tabTextActive : styles.tabTextInactive}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {activeFeedTab === 'forYou' && (
        <>
          <Text style={styles.sectionTitle}>Khám phá món ngon</Text>
          <CategoryChips active={category} onChange={setCategory} />
        </>
      )}
    </>
  );

  const groupsFooter = (
    <>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionHeaderLeft}>
          <Text style={styles.sectionTitle}>Nhóm bạn đã tham gia</Text>
          <Text style={styles.sectionSubtitle}>Tham gia thảo luận cùng cộng đồng</Text>
        </View>
        <TouchableOpacity style={styles.createGroupBtn} onPress={openCreateGroup}>
          <Feather name="plus-circle" size={16} color={colors.primary} style={{ marginRight: 4 }} />
          <Text style={styles.createGroupText}>Tạo nhóm</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.groupsCard}>
        {myGroups.length === 0 ? (
          <Text style={styles.emptyGroups}>Chưa tham gia nhóm nào. Tạo hoặc khám phá bên dưới!</Text>
        ) : (
          myGroups.slice(0, 5).map((g, index) => (
            <View key={g._id}>
              {index > 0 && <View style={styles.divider} />}
              <TouchableOpacity style={styles.groupListItem} onPress={() => openGroup(g._id)}>
                <View style={[styles.groupAvatar, { backgroundColor: colors.primaryFixed }]}>
                  <Feather name="users" size={22} color={colors.onPrimaryFixed} />
                </View>
                <View style={styles.groupListInfo}>
                  <Text style={styles.groupListTitle}>{g.name}</Text>
                  <Text style={styles.groupListSubtitle}>
                    {g.postsCount > 0 ? `${g.postsCount} bài viết` : 'Chưa có bài viết'}
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <View style={[styles.sectionHeaderRow, { marginTop: spacing.xl }]}>
        <Text style={styles.sectionTitle}>Khám phá cộng đồng</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Feather name="filter" size={20} color={colors.onSurface} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.discoverScrollContent}>
        {discoverGroups.length === 0 ? (
          <Text style={styles.emptyGroups}>Chưa có nhóm khám phá. Tạo nhóm đầu tiên!</Text>
        ) : (
          discoverGroups.slice(0, 10).map((g) => (
            <View key={g._id} style={styles.discoverCard}>
              <TouchableOpacity onPress={() => openGroup(g._id)}>
                <View style={styles.discoverCoverContainer}>
                  {g.coverImage ? (
                    <Image source={{ uri: g.coverImage }} style={styles.discoverCover} />
                  ) : (
                    <View style={[styles.discoverCover, { backgroundColor: colors.primaryFixed }]} />
                  )}
                </View>
              </TouchableOpacity>
              <View style={styles.discoverInfo}>
                <Text style={styles.discoverTitle} numberOfLines={1}>{g.name}</Text>
                <Text style={styles.discoverMembers}>
                  {groupService.formatMemberCount(g.membersCount ?? 0)} thành viên
                </Text>
                <TouchableOpacity
                  style={g.isMember ? styles.joinBtnOutline : styles.joinBtn}
                  onPress={() => (g.isMember ? openGroup(g._id) : joinGroup(g._id))}
                >
                  <Text style={g.isMember ? styles.joinBtnTextOutline : styles.joinBtnText}>
                    {g.isMember ? 'Xem nhóm' : 'Tham gia ngay'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <OfflineBanner visible={!isOnline} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setMenuOpen(true)}>
          <Feather name="menu" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SnapChef</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Search')}>
          <Feather name="search" size={24} color={colors.onSurface} />
        </TouchableOpacity>
      </View>

      <AppMenuModal
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={[
          { icon: 'users', label: 'Nhóm cộng đồng', onPress: () => setActiveFeedTab('groups') },
          { icon: 'bookmark', label: 'Công thức đã lưu', onPress: () => rootNav?.navigate('SavedRecipes') },
          { icon: 'film', label: 'Reels', onPress: () => rootNav?.navigate('Reels') },
          { icon: 'settings', label: 'Cài đặt', onPress: () => rootNav?.navigate('Settings') },
        ]}
      />

      {(activeFeedTab === 'forYou' || activeFeedTab === 'groups') ? (
        <FlatList
          ref={listRef}
          data={posts}
          keyExtractor={(item) => item._id}
          renderItem={renderPostItem}
          initialScrollIndex={undefined}
          onScroll={(e) => setScrollOffset(e.nativeEvent.contentOffset.y)}
          scrollEventThrottle={200}
          onLayout={() => {
            if (scrollRestoredRef.current) return;
            const offset = useFeedStore.getState().scrollOffset;
            if (offset > 0) {
              listRef.current?.scrollToOffset({ offset, animated: false });
              scrollRestoredRef.current = true;
            }
          }}
          ListHeaderComponent={feedHeader}
          ListFooterComponent={
            <>
              {isFetchingNextPage && (
                <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
              )}
              {groupsFooter}
            </>
          }
          ListEmptyComponent={
            isLoading ? (
              <FeedSkeleton count={2} />
            ) : isError ? (
              <ErrorState message="Không tải được bảng tin" onRetry={() => refetch()} />
            ) : (
              <EmptyState
                icon="file-text"
                title="Chưa có bài viết"
                message={
                  activeFeedTab === 'forYou'
                    ? 'Nhấn + để đăng bài đầu tiên!'
                    : 'Chưa có bài trong nhóm.'
                }
              />
            )
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefetching && !isFetchingNextPage}
              onRefresh={() => refetch()}
              tintColor={colors.primary}
            />
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {feedHeader}
          {groupsFooter}
        </ScrollView>
      )}
    </View>
  );
};

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  feedSection: {
    marginBottom: spacing.lg,
  },
  emptyFeed: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  iconBtn: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.headlineMd,
    color: colors.primary,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: spacing['3xl'],
  },
  tabsScrollWrapper: {
    backgroundColor: colors.surface,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    marginBottom: spacing.lg,
  },
  tabsContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  tabActive: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  tabInactive: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  tabTextActive: {
    ...typography.labelMd,
    color: colors.onPrimary,
  },
  tabTextInactive: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionHeaderLeft: {
    flex: 1,
  },
  sectionTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginBottom: 4,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  sectionSubtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  createGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  createGroupText: {
    ...typography.labelMd,
    color: colors.primary,
    fontWeight: 'bold',
  },
  groupsCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    borderRadius: radius.xl,
    paddingVertical: spacing.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  groupListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  groupAvatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  groupAvatar: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceVariant,
  },
  notificationDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  groupListInfo: {
    flex: 1,
  },
  groupListTitle: {
    ...typography.headlineMd,
    fontSize: 16,
    color: colors.onSurface,
    marginBottom: 2,
  },
  groupListSubtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  groupListSubtitleOrange: {
    ...typography.bodyMd,
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.outlineVariant,
    opacity: 0.5,
  },
  viewAllBtn: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  emptyGroups: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    padding: spacing.lg,
    textAlign: 'center',
  },
  discoverScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  discoverCard: {
    width: 260,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  discoverCoverContainer: {
    position: 'relative',
  },
  discoverCover: {
    width: '100%',
    height: 120,
    backgroundColor: colors.surfaceVariant,
  },
  hotBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  hotDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 6,
  },
  hotText: {
    ...typography.labelMd,
    color: '#fff',
    fontWeight: 'bold',
  },
  discoverInfo: {
    padding: spacing.md,
    alignItems: 'center',
  },
  discoverTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginBottom: 4,
  },
  discoverMembers: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.lg,
  },
  joinBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  joinBtnText: {
    ...typography.labelMd,
    color: colors.onPrimary,
    fontWeight: 'bold',
  },
  joinBtnOutline: {
    width: '100%',
    backgroundColor: colors.primaryContainer,
    paddingVertical: 12,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  joinBtnTextOutline: {
    ...typography.labelMd,
    color: colors.onPrimary,
    fontWeight: 'bold',
  },
});
}
