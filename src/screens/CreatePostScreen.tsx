import React, { useMemo, useState, useCallback } from 'react';
import { useTheme } from '../theme/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { AppHeader } from '../components/AppHeader';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';
import { createPost } from '../services/postService';
import { usePostStore } from '../store/postStore';
import { invalidateFeedQueries } from '../utils/invalidateFeed';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

export const CreatePostScreen = ({ navigation, route }: any) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user } = useAuth();
  const groupId = route.params?.groupId as string | undefined;
  const setDraft = usePostStore((s) => s.setDraft);
  const clearDraft = usePostStore((s) => s.clearDraft);
  const loadDraft = usePostStore((s) => s.loadDraft);
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [draftHint, setDraftHint] = useState(false);

  React.useEffect(() => {
    if (!user) {
      Alert.alert('Đăng nhập', 'Vui lòng đăng nhập để đăng bài', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
      return;
    }
    if (!hasPermission(user, 'post.create')) {
      Alert.alert('Không có quyền', 'Bạn không có quyền đăng bài', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
      return;
    }
    void loadDraft().then(() => {
      const d = usePostStore.getState().draft;
      if (d?.content) {
        setContent(d.content);
        setDraftHint(true);
      }
    });
  }, [user, loadDraft, navigation]);

  // One-way sync: local content → store only.
  React.useEffect(() => {
    if (content) {
      setDraft({ content, updatedAt: new Date().toISOString() });
      void usePostStore.getState().persistDraft();
    } else {
      void clearDraft();
    }
  }, [content, setDraft, clearDraft]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Cần quyền thư viện ảnh để đăng hình.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!content.trim()) {
      Alert.alert('Lỗi', 'Nhập nội dung bài viết');
      return;
    }
    setSubmitting(true);
    try {
      await createPost(user._id, {
        content,
        imageUri: imageUri ?? undefined,
        groupId,
        visibility: groupId ? 'group' : 'public',
      });
      setContent('');
      setDraftHint(false);
      await clearDraft();
      invalidateFeedQueries();
      Alert.alert('Thành công', 'Đã đăng bài', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Lỗi', e instanceof Error ? e.message : 'Không đăng được bài');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title={groupId ? 'Đăng bài trong nhóm' : 'Đăng bài'} />
      {draftHint && content.length > 0 && (
        <Text style={styles.draftHint}>Đã khôi phục bản nháp</Text>
      )}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Sáng tạo mỹ vị</Text>
          <Text style={styles.subtitle}>Chia sẻ công thức với cộng đồng SnapChef.</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Bạn đang nấu gì hôm nay?"
              placeholderTextColor={colors.onSurfaceVariant}
              multiline
              value={content}
              onChangeText={setContent}
            />
          </View>

          <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
              <>
                <Feather name="image" size={32} color={colors.primary} />
                <Text style={styles.uploadText}>Thêm ảnh món ăn</Text>
              </>
            )}
          </TouchableOpacity>
          {imageUri && (
            <TouchableOpacity onPress={() => setImageUri(null)}>
              <Text style={styles.removeImage}>Xóa ảnh</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.submitText}>Đăng bài</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  draftHint: {
    ...typography.labelMd,
    color: colors.primary,
    textAlign: 'center',
    paddingVertical: spacing.xs,
    backgroundColor: colors.primaryContainer,
  },
  scrollContent: { padding: spacing.lg },
  title: { ...typography.headlineLg, color: colors.primary, marginBottom: spacing['2xs'] },
  subtitle: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginBottom: spacing.xl },
  inputContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 150,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
  },
  textInput: { ...typography.bodyLg, color: colors.onSurface, flex: 1, textAlignVertical: 'top' },
  imageUpload: {
    minHeight: 160,
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewImage: { width: '100%', height: 200, borderRadius: radius.md },
  uploadText: { ...typography.labelMd, color: colors.primary, marginTop: spacing.sm },
  removeImage: { ...typography.bodyMd, color: colors.error, textAlign: 'center', marginTop: spacing.sm },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceVariant,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { ...typography.labelMd, color: colors.onPrimary, fontWeight: 'bold' },
});
}
