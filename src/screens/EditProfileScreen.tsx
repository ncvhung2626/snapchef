import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { RootStackScreenProps } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { AuthTextField } from '../components/AuthTextField';
import { updateProfile } from '../services/profileService';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

export const EditProfileScreen = ({
  navigation,
}: RootStackScreenProps<'EditProfile'>) => {
  const insets = useSafeAreaInsets();
  const { user, refreshProfile, setUser } = useAuth();
  const [fullname, setFullname] = useState(user?.fullname ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [avatar, setAvatar] = useState(user?.avatar ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    if (!fullname.trim()) {
      Alert.alert('Lỗi', 'Họ tên không được để trống');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateProfile(user._id, {
        fullname,
        bio,
        avatar: avatar || undefined,
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
        <Text style={styles.hint}>
          Ảnh đại diện: dán URL ảnh (Sprint 2). Upload Storage sẽ bổ sung sau.
        </Text>

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
        <AuthTextField
          label="URL ảnh đại diện (tùy chọn)"
          value={avatar}
          onChangeText={setAvatar}
          placeholder="https://..."
          autoCapitalize="none"
          keyboardType="url"
        />

        <View style={styles.emailBox}>
          <Text style={styles.emailLabel}>Email</Text>
          <Text style={styles.emailValue}>{user?.email}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
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
  hint: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.lg,
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
