import React, { useState } from 'react';
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
import { createPost } from '../services/postService';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

export const CreatePostScreen = ({ navigation, route }: any) => {
  const { user } = useAuth();
  const groupId = route.params?.groupId as string | undefined;
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  scrollContent: { padding: spacing.lg },
  title: {
    ...typography.headlineLg,
    color: colors.primary,
    marginBottom: spacing['2xs'],
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xl,
  },
  inputContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 150,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
  },
  textInput: {
    ...typography.bodyLg,
    color: colors.onSurface,
    flex: 1,
    textAlignVertical: 'top',
  },
  imageUpload: {
    minHeight: 160,
    backgroundColor: colors.primaryFixed,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewImage: { width: '100%', height: 200, borderRadius: radius.md },
  uploadText: {
    ...typography.labelMd,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  removeImage: {
    ...typography.bodyMd,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.sm,
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
  submitText: {
    ...typography.labelMd,
    color: colors.onPrimary,
    fontWeight: 'bold',
  },
});
