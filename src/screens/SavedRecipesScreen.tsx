import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { useTheme } from '../theme/ThemeContext';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { RootStackScreenProps } from '../types/navigation';
import { PostCard } from '../components/PostCard';
import { getSavedRecipes } from '../services/recipeService';
import { useAuth } from '../context/AuthContext';
import type { Post } from '../types/models';
import { formatRelativeTime } from '../utils/formatTime';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export const SavedRecipesScreen = ({ navigation }: RootStackScreenProps<'SavedRecipes'>) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setPosts(await getSavedRecipes(user._id));
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Công thức đã lưu</Text>
        <View style={{ width: 24 }} />
      </View>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => p._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>Chưa lưu công thức nào. Nhấn bookmark trên món yêu thích!</Text>
          }
          renderItem={({ item }) => (
            <PostCard
              postId={item._id}
              author={item.author.fullname}
              time={formatRelativeTime(item.createdAt)}
              content={item.title ? `${item.title}\n${item.content}` : item.content}
              imageUrls={item.images}
              likesCount={item.likes.length}
              commentsCount={item.commentsCount}
            />
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
  list: { paddingBottom: spacing['2xl'] },
  empty: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing['2xl'],
    paddingHorizontal: spacing.xl,
  },
});
}
