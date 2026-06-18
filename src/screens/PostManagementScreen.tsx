import React, { useMemo, useCallback, useState } from 'react';
import { useTheme } from '../theme/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import type { RootStackScreenProps } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { canModerate } from '../utils/permissions';
import * as groupService from '../services/groupService';
import * as postService from '../services/postService';
import { formatRelativeTime } from '../utils/formatTime';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

export const PostManagementScreen = ({
  navigation,
  route,
}: RootStackScreenProps<'PostManagement'>) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { groupId } = route.params;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Awaited<ReturnType<typeof postService.getPostsByGroupId>>>([]);
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, group] = await Promise.all([
        postService.getPostsByGroupId(groupId, user?._id),
        groupService.getGroupById(groupId, user?._id),
      ]);
      setPosts(data);
      setCanManage(groupService.canManageGroup(group ?? null, user?._id));
    } catch {
      setPosts([]);
      setCanManage(false);
    } finally {
      setLoading(false);
    }
  }, [groupId, user?._id]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const handleDelete = (postId: string, authorId: string) => {
    if (!user) return;
    const canDelete = user._id === authorId || canManage || canModerate(user);
    if (!canDelete) {
      Alert.alert('Không có quyền', 'Bạn không thể xóa bài này');
      return;
    }
    Alert.alert('Xóa bài viết', 'Bạn có chắc muốn xóa bài này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            if (user._id === authorId) {
              await postService.deletePost(postId, authorId);
            } else {
              await postService.deletePostForModeration(postId);
            }
            setPosts((prev) => prev.filter((p) => p._id !== postId));
          } catch (err) {
            Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không xóa được');
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.title}>Quản lý bài đăng</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>Chưa có bài viết trong nhóm</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.rowBody}>
                <Text style={styles.rowAuthor}>{item.author.fullname}</Text>
                <Text style={styles.rowPreview} numberOfLines={2}>
                  {item.title ? `${item.title}\n` : ''}{item.content}
                </Text>
                <Text style={styles.rowTime}>{formatRelativeTime(item.createdAt)}</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDelete(item._id, item.author._id)}
                style={styles.deleteBtn}
              >
                <Feather name="trash-2" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
};

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  title: { ...typography.headlineMd, color: colors.onSurface },
  list: { padding: spacing.md, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    elevation: 1,
  },
  rowBody: { flex: 1 },
  rowAuthor: { ...typography.bodyMd, fontWeight: '700', color: colors.onSurface },
  rowPreview: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginVertical: spacing['2xs'] },
  rowTime: { ...typography.labelMd, color: colors.onSurfaceVariant },
  deleteBtn: { padding: spacing.sm },
  empty: { ...typography.bodyLg, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.xl },
});
}
