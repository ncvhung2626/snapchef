import React, { useMemo, useState } from 'react';
import { useTheme } from '../theme/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type { RootStackScreenProps } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { AuthTextField } from '../components/AuthTextField';
import { updateProfile } from '../services/profileService';
import { uploadAvatarImage } from '../services/storageService';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

export const EditProfileScreen = ({
  navigation,
}: RootStackScreenProps<'EditProfile'>) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { user, refreshProfile, setUser } = useAuth();
  const [fullname, setFullname] = useState(user?.fullname ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [avatar, setAvatar] = useState(user?.avatar ?? '');
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Bạn cần cấp quyền truy cập thư viện ảnh để đổi ảnh đại diện.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      setLocalAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!fullname.trim()) {
      Alert.alert('Lỗi', 'Họ tên không được để trống');
      return;
    }
    setSaving(true);
    setUploadProgress(0);
    try {
      let finalAvatarUrl = avatar;
      if (localAvatarUri) {
        finalAvatarUrl = await uploadAvatarImage(user._id, localAvatarUri, (progress) => {
          setUploadProgress(progress);
        });
      }

      const updated = await updateProfile(user._id, {
        fullname,
        bio,
        avatar: finalAvatarUrl || undefined,
      });
      setUser(updated);
      await refreshProfile();
      Alert.alert('Thành công', 'Đã cập nhật hồ sơ', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Lỗi', e instanceof Error ? e.message : 'Không lưu được');
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Feather name="x" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.headerBtn}>
          {saving ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Text style={styles.saveText}>Lưu</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickImage} disabled={saving} style={styles.avatarContainer}>
            {localAvatarUri || avatar ? (
              <Image source={{ uri: localAvatarUri || avatar }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
                <Feather name="user" size={40} color={colors.onSurfaceVariant} />
              </View>
            )}
            <View style={styles.editAvatarBadge}>
              <Feather name="camera" size={16} color={colors.onPrimary} />
            </View>
          </TouchableOpacity>
          {uploadProgress > 0 && uploadProgress < 100 && (
            <Text style={styles.progressText}>Đang tải ảnh lên... {uploadProgress}%</Text>
          )}
        </View>

        <AuthTextField
          label="Họ và tên"
          value={fullname}
          onChangeText={setFullname}
          placeholder="Tên hiển thị"
        />
        <AuthTextField
          label="Giới thiệu"
          value={bio}
          onChangeText={setBio}
          placeholder="Mô tả về bạn..."
          multiline
          style={{ minHeight: 88, textAlignVertical: 'top' }}
        />

        <View style={styles.emailBox}>
          <Text style={styles.emailLabel}>Email</Text>
          <Text style={styles.emailValue}>{user?.email}</Text>
        </View>
      </ScrollView>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  headerBtn: { padding: spacing.xs, minWidth: 48 },
  headerTitle: { ...typography.headlineMd, color: colors.onSurface },
  saveText: { ...typography.bodyLg, color: colors.primary, fontWeight: '700' },
  content: { padding: spacing.lg, paddingBottom: spacing['2xl'] },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  progressText: {
    ...typography.labelMd,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  emailBox: {
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  emailLabel: { ...typography.labelMd, color: colors.onSurfaceVariant },
  emailValue: { ...typography.bodyLg, color: colors.onSurface, marginTop: spacing['2xs'] },
});
}
