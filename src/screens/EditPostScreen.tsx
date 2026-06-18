import React, { useMemo, useEffect, useState } from 'react';
import { useTheme } from '../theme/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { RootStackScreenProps } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import * as postService from '../services/postService';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

export const EditPostScreen = ({ navigation, route }: RootStackScreenProps<'EditPost'>) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { postId } = route.params;
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    postService.getPostById(postId, user?._id).then((p) => {
      if (p) {
        setTitle(p.title ?? '');
        setContent(p.content);
      }
      setLoading(false);
    });
  }, [postId, user?._id]);

  const handleSave = async () => {
    if (!user || !content.trim()) return;
    setSubmitting(true);
    try {
      await postService.updatePost(postId, user._id, { title, content });
      Alert.alert('Thành công', 'Đã cập nhật bài viết', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không cập nhật được');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="x" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa bài</Text>
        <TouchableOpacity onPress={handleSave} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Text style={styles.saveText}>Lưu</Text>
          )}
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <TextInput
          style={styles.titleInput}
          placeholder="Tiêu đề (tùy chọn)"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={styles.contentInput}
          placeholder="Nội dung bài viết"
          value={content}
          onChangeText={setContent}
          multiline
        />
      </ScrollView>
    </SafeAreaView>
  );
};

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  headerTitle: { ...typography.headlineMd, color: colors.onSurface },
  saveText: { ...typography.labelMd, color: colors.primary, fontWeight: '700' },
  content: { padding: spacing.lg },
  titleInput: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    paddingBottom: spacing.sm,
  },
  contentInput: {
    ...typography.bodyLg,
    color: colors.onSurface,
    minHeight: 200,
    textAlignVertical: 'top',
  },
});
}
