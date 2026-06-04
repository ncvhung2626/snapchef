import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { createGroup } from '../services/groupService';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

export const CreateGroupScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pickCover = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Cần quyền thư viện ảnh.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setCoverUri(result.assets[0].uri);
    }
  };

  const handleCreate = async () => {
    if (!user) return;
    if (!groupName.trim()) {
      Alert.alert('Lỗi', 'Nhập tên nhóm');
      return;
    }
    setSubmitting(true);
    try {
      const group = await createGroup(user._id, {
        name: groupName,
        description,
        privacy,
        coverImageUri: coverUri ?? undefined,
      });
      Alert.alert('Thành công', 'Đã tạo nhóm', [
        {
          text: 'OK',
          onPress: () =>
            navigation.replace('GroupDetail', { groupId: group._id }),
        },
      ]);
    } catch (e) {
      Alert.alert('Lỗi', e instanceof Error ? e.message : 'Không tạo được nhóm');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tạo Nhóm Mới</Text>
        </View>
        <TouchableOpacity style={styles.startBtn} onPress={handleCreate} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Text style={styles.startBtnText}>Bắt đầu tạo</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.uploadContainer} onPress={pickCover}>
          {coverUri ? (
            <Image source={{ uri: coverUri }} style={styles.coverPreview} />
          ) : (
            <View style={styles.uploadContent}>
              <Feather name="camera" size={32} color={colors.primary} />
              <Text style={styles.uploadText}>Tải lên ảnh bìa nhóm</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.label}>Tên nhóm</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập tên nhóm của bạn..."
            placeholderTextColor={colors.onSurfaceVariant}
            value={groupName}
            onChangeText={setGroupName}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Mô tả nhóm</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Chia sẻ mục tiêu và niềm đam mê nấu nướng của nhóm..."
            placeholderTextColor={colors.onSurfaceVariant}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
          />
        </View>

        <Text style={styles.sectionTitle}>Chế độ riêng tư</Text>

        <TouchableOpacity
          style={[styles.privacyCard, privacy === 'public' && styles.privacyCardActive]}
          onPress={() => setPrivacy('public')}
        >
          <Feather name="globe" size={24} color={privacy === 'public' ? colors.primary : colors.onSurfaceVariant} />
          <View style={styles.privacyTextContainer}>
            <Text style={styles.privacyTitle}>Công khai</Text>
            <Text style={styles.privacyDesc}>Bất kỳ ai cũng có thể thấy và tham gia nhóm.</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.privacyCard, privacy === 'private' && styles.privacyCardActive]}
          onPress={() => setPrivacy('private')}
        >
          <Feather name="lock" size={24} color={privacy === 'private' ? colors.primary : colors.onSurfaceVariant} />
          <View style={styles.privacyTextContainer}>
            <Text style={styles.privacyTitle}>Riêng tư</Text>
            <Text style={styles.privacyDesc}>Chỉ thành viên mới thấy bài viết trong nhóm.</Text>
          </View>
        </TouchableOpacity>
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
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: spacing.xs },
  headerTitle: { ...typography.headlineMd, color: colors.primary, marginLeft: spacing.xs },
  startBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, minWidth: 90, alignItems: 'center' },
  startBtnText: { ...typography.labelMd, color: colors.primary, fontWeight: 'bold' },
  content: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
  uploadContainer: {
    height: 160,
    backgroundColor: colors.surfaceVariant,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    borderStyle: 'dashed',
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  coverPreview: { width: '100%', height: '100%' },
  uploadContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  uploadText: { ...typography.labelMd, color: colors.primary, marginTop: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  label: { ...typography.labelMd, color: colors.onSurface, marginBottom: spacing.sm, fontWeight: 'bold' },
  input: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    ...typography.bodyLg,
    color: colors.onSurface,
  },
  textArea: { height: 100 },
  sectionTitle: { ...typography.headlineMd, fontSize: 18, color: colors.onSurface, marginBottom: spacing.md },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: spacing.md,
  },
  privacyCardActive: { borderColor: colors.primary },
  privacyTextContainer: { flex: 1 },
  privacyTitle: { ...typography.headlineMd, fontSize: 16, color: colors.onSurface, marginBottom: 4 },
  privacyDesc: { ...typography.bodyMd, color: colors.onSurfaceVariant },
});
