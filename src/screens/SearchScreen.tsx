import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { useTheme } from '../theme/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { MainTabScreenProps } from '../types/navigation';
import { CategoryChips } from '../components/CategoryChips';
import { PostCard } from '../components/PostCard';
import { EmptyState } from '../components/StateViews';
import { searchPosts } from '../services/postService';
import { searchUsers } from '../services/friendService';
import { searchReels } from '../services/reelService';
import * as groupService from '../services/groupService';
import { useAuth } from '../context/AuthContext';
import { useSearchStore, type SearchTab } from '../store/searchStore';
import type { Post, User, Group, Reel } from '../types/models';
import { formatRelativeTime } from '../utils/formatTime';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';
import { MOCK_TRENDING_SEARCHES } from '../data/mock';

const SEARCH_TABS: { key: SearchTab; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'users', label: 'Người dùng' },
  { key: 'recipes', label: 'Công thức' },
  { key: 'posts', label: 'Bài viết' },
  { key: 'reels', label: 'Reels' },
  { key: 'communities', label: 'Nhóm' },
];

const TRENDING = MOCK_TRENDING_SEARCHES;

export const SearchScreen = ({ navigation }: MainTabScreenProps<'Search'>) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const rootNav = navigation.getParent();
  const { user } = useAuth();
  const { query, activeTab, recentSearches, setQuery, setActiveTab, addRecentSearch, clearRecentSearches } =
    useSearchStore();

  const [category, setCategory] = useState('all');
  const [postResults, setPostResults] = useState<Post[]>([]);
  const [userResults, setUserResults] = useState<User[]>([]);
  const [groupResults, setGroupResults] = useState<Group[]>([]);
  const [reelResults, setReelResults] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async () => {
    const term = query.trim();
    if (!term) {
      setPostResults([]);
      setUserResults([]);
      setGroupResults([]);
      setReelResults([]);
      return;
    }

    setLoading(true);
    try {
      if (activeTab === 'all') {
        const [posts, users, groups, reels] = await Promise.all([
          searchPosts(term, category, user?._id),
          searchUsers(term),
          groupService.searchGroups(term),
          searchReels(term),
        ]);
        setPostResults(posts);
        setUserResults(users);
        setGroupResults(groups);
        setReelResults(reels.reels);
      } else if (activeTab === 'posts' || activeTab === 'recipes') {
        const data = await searchPosts(term, category, user?._id);
        const filtered =
          activeTab === 'recipes' ? data.filter((p) => p.isRecipe) : data.filter((p) => !p.isRecipe);
        setPostResults(filtered);
        setReelResults([]);
      } else if (activeTab === 'users') {
        setUserResults(await searchUsers(term));
        setPostResults([]);
        setReelResults([]);
      } else if (activeTab === 'reels') {
        const { reels } = await searchReels(term);
        setReelResults(reels);
        setPostResults([]);
      } else if (activeTab === 'communities') {
        const groups = await groupService.searchGroups(term);
        setGroupResults(groups);
        setPostResults([]);
        setReelResults([]);
      }
      addRecentSearch(term);
    } catch {
      setPostResults([]);
      setUserResults([]);
      setGroupResults([]);
      setReelResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, category, user?._id, activeTab, addRecentSearch]);

  useEffect(() => {
    const t = setTimeout(search, 400);
    return () => clearTimeout(t);
  }, [search]);

  const openPost = (postId: string) => {
    rootNav?.navigate('PostDetail', { postId });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Tìm kiếm</Text>
      <View style={styles.searchBar}>
        <Feather name="search" size={20} color={colors.onSurfaceVariant} />
        <TextInput
          style={styles.input}
          placeholder="Món ăn, công thức, người dùng..."
          placeholderTextColor={colors.onSurfaceVariant}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          onSubmitEditing={search}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Feather name="x" size={20} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabs}>
        {SEARCH_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {(activeTab === 'posts' || activeTab === 'recipes') && (
        <CategoryChips active={category} onChange={setCategory} />
      )}

      {!query && (
        <>
          {recentSearches.length > 0 && (
            <View style={styles.recentBlock}>
              <View style={styles.recentHeader}>
                <Text style={styles.sectionLabel}>Tìm gần đây</Text>
                <TouchableOpacity onPress={clearRecentSearches}>
                  <Text style={styles.clearText}>Xóa</Text>
                </TouchableOpacity>
              </View>
              {recentSearches.map((r) => (
                <TouchableOpacity key={r} style={styles.recentRow} onPress={() => setQuery(r)}>
                  <Feather name="clock" size={16} color={colors.onSurfaceVariant} />
                  <Text style={styles.recentText}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={styles.recentBlock}>
            <Text style={styles.sectionLabel}>Xu hướng</Text>
            <View style={styles.trendingRow}>
              {TRENDING.map((t) => (
                <TouchableOpacity key={t} style={styles.trendChip} onPress={() => setQuery(t)}>
                  <Text style={styles.trendText}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </>
      )}

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : activeTab === 'users' ? (
        <FlatList
          data={userResults}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            query ? (
              <EmptyState icon="user" title="Không tìm thấy người dùng" />
            ) : (
              <Text style={styles.empty}>Gõ tên hoặc email để tìm</Text>
            )
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.userRow}
              onPress={() => rootNav?.navigate('UserProfile', { userId: item._id })}
            >
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
              ) : (
                <View style={[styles.userAvatar, styles.avatarPlaceholder]}>
                  <Feather name="user" size={20} color={colors.onSurfaceVariant} />
                </View>
              )}
              <View>
                <Text style={styles.userName}>{item.fullname}</Text>
                <Text style={styles.userEmail}>
                  {item.username ? `@${item.username}` : item.email}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : activeTab === 'reels' ? (
        <FlatList
          data={reelResults}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            query ? (
              <EmptyState icon="film" title="Không tìm thấy Reels" />
            ) : (
              <Text style={styles.empty}>Gõ caption hoặc hashtag để tìm Reels</Text>
            )
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.userRow} onPress={() => rootNav?.navigate('Reels')}>
              {item.thumbnailUrl ? (
                <Image source={{ uri: item.thumbnailUrl }} style={styles.userAvatar} />
              ) : (
                <View style={[styles.userAvatar, styles.avatarPlaceholder]}>
                  <Feather name="film" size={20} color={colors.primary} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{item.authorName}</Text>
                <Text style={styles.userEmail} numberOfLines={2}>{item.description}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : activeTab === 'communities' ? (
        <FlatList
          data={groupResults}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            query ? (
              <EmptyState icon="users" title="Không tìm thấy nhóm" />
            ) : (
              <Text style={styles.empty}>Gõ tên nhóm để tìm</Text>
            )
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.userRow}
              onPress={() => rootNav?.navigate('GroupDetail', { groupId: item._id })}
            >
              <View style={[styles.userAvatar, styles.avatarPlaceholder]}>
                <Feather name="users" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userEmail}>{item.membersCount ?? 0} thành viên</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : activeTab === 'all' && query ? (
        <ScrollView contentContainerStyle={styles.list}>
          {userResults.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>Người dùng</Text>
              {userResults.slice(0, 3).map((item) => (
                <TouchableOpacity
                  key={item._id}
                  style={styles.userRow}
                  onPress={() => rootNav?.navigate('UserProfile', { userId: item._id })}
                >
                  {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
                  ) : (
                    <View style={[styles.userAvatar, styles.avatarPlaceholder]}>
                      <Feather name="user" size={20} color={colors.onSurfaceVariant} />
                    </View>
                  )}
                  <View>
                    <Text style={styles.userName}>{item.fullname}</Text>
                    <Text style={styles.userEmail}>{item.username ? `@${item.username}` : item.email}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {groupResults.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>Nhóm</Text>
              {groupResults.slice(0, 3).map((item) => (
                <TouchableOpacity
                  key={item._id}
                  style={styles.userRow}
                  onPress={() => rootNav?.navigate('GroupDetail', { groupId: item._id })}
                >
                  <View style={[styles.userAvatar, styles.avatarPlaceholder]}>
                    <Feather name="users" size={20} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userEmail}>{item.membersCount ?? 0} thành viên</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {reelResults.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>Reels</Text>
              {reelResults.slice(0, 3).map((item) => (
                <TouchableOpacity key={item._id} style={styles.userRow} onPress={() => rootNav?.navigate('Reels')}>
                  <View style={[styles.userAvatar, styles.avatarPlaceholder]}>
                    <Feather name="film" size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{item.authorName}</Text>
                    <Text style={styles.userEmail} numberOfLines={1}>{item.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {postResults.length > 0 && (
            <Text style={[styles.sectionLabel, { paddingHorizontal: spacing.md, marginBottom: spacing.sm }]}>
              Bài viết & công thức
            </Text>
          )}
          {postResults.map((item) => (
            <TouchableOpacity key={item._id} onPress={() => openPost(item._id)}>
              <PostCard
                postId={item._id}
                author={item.author.fullname}
                authorUsername={item.author.username}
                authorAvatar={item.author.avatar}
                authorRole={item.author.role}
                time={formatRelativeTime(item.createdAt)}
                title={item.title}
                content={item.content}
                hashtags={item.hashtags}
                imageUrls={item.images}
                videoUrl={item.videos[0]}
                likesCount={item.likes.length}
                commentsCount={item.commentsCount}
                isLiked={user ? item.likes.includes(user._id) : false}
              />
            </TouchableOpacity>
          ))}
          {!userResults.length && !groupResults.length && !reelResults.length && !postResults.length && (
            <EmptyState icon="search" title="Không tìm thấy kết quả" />
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={postResults}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            query ? (
              <EmptyState icon="search" title="Không tìm thấy kết quả" />
            ) : (
              <Text style={styles.empty}>Gõ từ khóa để khám phá món ngon</Text>
            )
          }
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => openPost(item._id)}>
              <PostCard
                postId={item._id}
                author={item.author.fullname}
                authorUsername={item.author.username}
                authorAvatar={item.author.avatar}
                authorRole={item.author.role}
                time={formatRelativeTime(item.createdAt)}
                title={item.title}
                content={item.content}
                hashtags={item.hashtags}
                imageUrls={item.images}
                videoUrl={item.videos[0]}
                likesCount={item.likes.length}
                commentsCount={item.commentsCount}
                isLiked={user ? item.likes.includes(user._id) : false}
              />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: {
    ...typography.headlineLg,
    color: colors.onSurface,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  input: { flex: 1, ...typography.bodyLg, color: colors.onSurface },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainer,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { ...typography.labelMd, color: colors.onSurfaceVariant },
  tabTextActive: { color: colors.onPrimary, fontWeight: '600' },
  recentBlock: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  sectionLabel: { ...typography.labelMd, color: colors.onSurfaceVariant },
  clearText: { ...typography.labelMd, color: colors.primary },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  recentText: { ...typography.bodyMd, color: colors.onSurface },
  trendingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  trendChip: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  trendText: { ...typography.labelMd, color: colors.primary },
  list: { paddingBottom: spacing['3xl'] },
  empty: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    gap: spacing.md,
  },
  userAvatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: { ...typography.headlineMd, fontSize: 16, color: colors.onSurface },
  userEmail: { ...typography.bodyMd, color: colors.onSurfaceVariant, fontSize: 13 },
  sectionBlock: { marginBottom: spacing.md },
});
}
