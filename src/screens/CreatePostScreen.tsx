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
import * as ImageManipulator from 'expo-image-manipulator';
import { Feather } from '@expo/vector-icons';
import { AppHeader } from '../components/AppHeader';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';
import { createPost } from '../services/postService';
import { usePostStore } from '../store/postStore';
import { invalidateFeedQueries } from '../utils/invalidateFeed';
import { useUploadQueue } from '../lib/uploadQueue';
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
  const [imageUris, setImageUris] = useState<string[]>([]);
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

  const pickImages = async () => {
    if (imageUris.length >= 10) {
      Alert.alert('Giới hạn', 'Chỉ được chọn tối đa 10 ảnh');
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Cần quyền thư viện ảnh để đăng hình.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 10 - imageUris.length,
      quality: 0.8,
    });
    if (!result.canceled && result.assets) {
      const newUris: string[] = [];
      for (const asset of result.assets) {
        const manipResult = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 1080 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        newUris.push(manipResult.uri);
      }
      setImageUris((prev) => [...prev, ...newUris].slice(0, 10));
    }
  };

  const takePhoto = async () => {
    if (imageUris.length >= 10) {
      Alert.alert('Giới hạn', 'Chỉ được chụp tối đa 10 ảnh');
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Cần quyền máy ảnh để chụp hình.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const manipResult = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 1080 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      setImageUris((prev) => [...prev, manipResult.uri].slice(0, 10));
    }
  };

  const removeImage = (index: number) => {
    setImageUris((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!content.trim()) {
      Alert.alert('Lỗi', 'Nhập nội dung bài viết');
      return;
    }
    
    useUploadQueue.getState().enqueue({
      id: Date.now().toString(),
      type: 'image',
      userId: user._id,
      localUris: imageUris,
      metadata: {
        action: 'create_post',
        content,
        groupId,
        visibility: groupId ? 'group' : 'public',
      }
    });

    setContent('');
    setDraftHint(false);
    await clearDraft();
    navigation.goBack();
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

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionButton} onPress={pickImages}>
              <Feather name="image" size={24} color={colors.primary} />
              <Text style={styles.actionText}>Thư viện ({imageUris.length}/10)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
              <Feather name="camera" size={24} color={colors.primary} />
              <Text style={styles.actionText}>Chụp ảnh</Text>
            </TouchableOpacity>
          </View>

          {imageUris.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
              {imageUris.map((uri, index) => (
                <View key={index} style={styles.imagePreviewContainer}>
                  <Image source={{ uri }} style={styles.previewImage} />
                  <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeImage(index)}>
                    <Feather name="x" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
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
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryContainer,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    gap: spacing.sm,
  },
  actionText: { ...typography.labelMd, color: colors.primary },
  imageScroll: {
    marginBottom: spacing.lg,
  },
  imagePreviewContainer: {
    width: 120,
    height: 120,
    marginRight: spacing.sm,
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: { width: '100%', height: '100%' },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
