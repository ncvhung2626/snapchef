import React, { useMemo, useCallback, useState } from 'react';
import { useTheme } from '../theme/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import type { RootStackScreenProps } from '../types/navigation';
import type { User } from '../types/models';
import { useAuth } from '../context/AuthContext';
import {
  getFollowers,
  getFollowing,
  getSuggestedFriends,
  followUser,
  unfollowUser,
  isFollowing,
} from '../services/friendService';
import {
  getPendingRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  type FriendRequest,
} from '../services/friendRequestService';
import { EmptyState } from '../components/StateViews';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

type Tab = 'followers' | 'following' | 'suggested' | 'requests';

function UserRow({
  user,
  currentUserId,
  onPress,
  onFollowToggle,
  following,
}: {
  user: User;
  currentUserId?: string;
  onPress: () => void;
  onFollowToggle: (userId: string, isFollowing: boolean) => void;
  following: boolean;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isSelf = user._id === currentUserId;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      {user.avatar ? (
        <Image source={{ uri: user.avatar }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Feather name="user" size={22} color={colors.onSurfaceVariant} />
        </View>
      )}
      <View style={styles.rowInfo}>
        <Text style={styles.name}>{user.fullname}</Text>
        {user.bio ? <Text style={styles.bio} numberOfLines={1}>{user.bio}</Text> : null}
      </View>
      {!isSelf && currentUserId ? (
        <TouchableOpacity
          style={following ? styles.followingBtn : styles.followBtn}
          onPress={() => onFollowToggle(user._id, following)}
        >
          <Text style={following ? styles.followingText : styles.followText}>
            {following ? 'Đang theo dõi' : 'Theo dõi'}
          </Text>
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
}

export const FriendsScreen = ({ navigation, route }: RootStackScreenProps<'Friends'>) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const userId = route.params?.userId ?? user?._id;
  const initialTab = route.params?.tab ?? 'followers';

  const [tab, setTab] = useState<Tab>(initialTab);
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      if (tab === 'requests') {
        if (user?._id) {
          setRequests(await getPendingRequests(user._id));
        }
        setUsers([]);
        return;
      }
      let list: User[] = [];
      if (tab === 'followers') list = await getFollowers(userId);
      else if (tab === 'following') list = await getFollowing(userId);
      else list = await getSuggestedFriends(userId);

      setUsers(list);

      if (user && tab !== 'followers') {
        const checks = await Promise.all(list.map((u) => isFollowing(user._id, u._id)));
        setFollowingSet(new Set(list.filter((_, i) => checks[i]).map((u) => u._id)));
      }
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [userId, tab, user]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const handleFollowToggle = async (targetId: string, currentlyFollowing: boolean) => {
    if (!user) return;
    try {
      if (currentlyFollowing) {
        await unfollowUser(user._id, targetId);
        setFollowingSet((s) => { const n = new Set(s); n.delete(targetId); return n; });
      } else {
        await followUser(user._id, targetId);
        setFollowingSet((s) => new Set(s).add(targetId));
      }
    } catch (err) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thực hiện được');
    }
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: 'requests', label: 'Lời mời' },
    { key: 'followers', label: 'Theo dõi' },
    { key: 'following', label: 'Đang theo dõi' },
    { key: 'suggested', label: 'Gợi ý' },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bạn bè</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : tab === 'requests' ? (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.row}>
              {item.sender?.avatar ? (
                <Image source={{ uri: item.sender.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Feather name="user" size={22} color={colors.onSurfaceVariant} />
                </View>
              )}
              <View style={styles.rowInfo}>
                <Text style={styles.name}>{item.sender?.fullname ?? 'Người dùng'}</Text>
                <Text style={styles.bio}>Muốn kết bạn với bạn</Text>
              </View>
              <TouchableOpacity
                style={styles.followBtn}
                onPress={async () => {
                  if (!user) return;
                  await acceptFriendRequest(item.id, user._id);
                  setRequests((prev) => prev.filter((r) => r.id !== item.id));
                }}
              >
                <Text style={styles.followText}>Chấp nhận</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.followingBtn}
                onPress={async () => {
                  if (!user) return;
                  await rejectFriendRequest(item.id, user._id);
                  setRequests((prev) => prev.filter((r) => r.id !== item.id));
                }}
              >
                <Text style={styles.followingText}>Từ chối</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState icon="users" title="Không có lời mời" message="Lời mời kết bạn sẽ hiển thị ở đây" />
          }
        />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <UserRow
              user={item}
              currentUserId={user?._id}
              following={followingSet.has(item._id)}
              onPress={() => navigation.navigate('UserProfile', { userId: item._id })}
              onFollowToggle={handleFollowToggle}
            />
          )}
          ListEmptyComponent={
            <EmptyState icon="users" title="Chưa có ai" message="Danh sách trống" />
          }
        />
      )}
    </View>
  );
};

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
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
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.headlineLg, color: colors.onSurface },
  tabs: { flexDirection: 'row', padding: spacing.sm, gap: spacing.xs },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainer,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { ...typography.labelMd, color: colors.onSurfaceVariant },
  tabTextActive: { color: colors.onPrimary, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: { flex: 1, marginLeft: spacing.md },
  name: { ...typography.headlineMd, fontSize: 16, color: colors.onSurface },
  bio: { ...typography.bodyMd, color: colors.onSurfaceVariant, fontSize: 13 },
  followBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  followText: { ...typography.labelMd, color: colors.onPrimary, fontWeight: '600' },
  followingBtn: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  followingText: { ...typography.labelMd, color: colors.onSurfaceVariant },
});
}
