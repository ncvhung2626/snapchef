import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { RootStackScreenProps } from '../types/navigation';
import { MOCK_POSTS } from '../data/mock';
import { formatRelativeTime } from '../utils/formatTime';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

export const PostManagementScreen = ({
  navigation,
  route,
}: RootStackScreenProps<'PostManagement'>) => {
  const { groupId } = route.params;
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState(MOCK_POSTS.filter((p) => p.groupId === groupId || !p.groupId));

  const handleDelete = (postId: string) => {
    Alert.alert('Xóa bài viết', 'Bạn có chắc muốn xóa bài này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => setPosts((prev) => prev.filter((p) => p._id !== postId)),
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
                {item.content}
              </Text>
              <Text style={styles.rowTime}>{formatRelativeTime(item.createdAt)}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteBtn}>
              <Feather name="trash-2" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
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
    ...{ shadowOpacity: 0.05, elevation: 1 },
  },
  rowBody: { flex: 1 },
  rowAuthor: { ...typography.bodyMd, fontWeight: '700', color: colors.onSurface },
  rowPreview: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginVertical: spacing['2xs'] },
  rowTime: { ...typography.labelMd, color: colors.onSurfaceVariant },
  deleteBtn: { padding: spacing.sm },
  empty: { ...typography.bodyLg, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.xl },
});
