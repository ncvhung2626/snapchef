import React, { useMemo, useState } from 'react';
import { useTheme } from '../theme/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Feather } from '@expo/vector-icons';
import type { RootStackScreenProps } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';
import { uploadReelVideo, validateVideoDuration, MAX_VIDEO_DURATION_SEC } from '../services/reelService';
import * as reelRepo from '../repositories/reel.repository';
import { useUploadQueue } from '../lib/uploadQueue';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

export const CreateReelScreen = ({ navigation }: RootStackScreenProps<'CreateReel'>) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user } = useAuth();
  const enqueue = useUploadQueue((s) => s.enqueue);
  const [caption, setCaption] = useState('');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Cần quyền thư viện để chọn video');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: MAX_VIDEO_DURATION_SEC,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const dur = (asset.duration ?? 0) / 1000;
      if (!validateVideoDuration(dur)) {
        Alert.alert('Lỗi', `Video tối đa ${MAX_VIDEO_DURATION_SEC / 60} phút`);
        return;
      }
      setVideoUri(asset.uri);
      setDuration(dur);

      // Tự động tạo thumbnail từ giây thứ 0 của video
      try {
        const { uri } = await VideoThumbnails.getThumbnailAsync(asset.uri, {
          time: 0,
          quality: 0.7,
        });
        setThumbnailUri(uri);
      } catch (err) {
        console.warn('Không tạo được thumbnail', err);
      }
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Đăng nhập', 'Vui lòng đăng nhập để đăng Reel');
      return;
    }
    if (!hasPermission(user, 'reel.create')) {
      Alert.alert('Không có quyền', 'Bạn không có quyền đăng Reel');
      return;
    }
    if (!videoUri) {
      Alert.alert('Lỗi', 'Chọn video trước khi đăng');
      return;
    }
    
    enqueue({
      id: `reel-${Date.now()}`,
      type: 'video',
      userId: user._id,
      localUri: videoUri,
      metadata: {
        action: 'create_reel',
        caption: caption.trim(),
        durationSeconds: Math.round(duration),
        thumbnailLocalUri: thumbnailUri || undefined,
      },
    });

    Alert.alert('Đang tải lên', 'Video của bạn đang được tải lên trong nền.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="x" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo Reel</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.body}>
        <TouchableOpacity style={styles.videoPicker} onPress={pickVideo}>
          {videoUri ? (
            <>
              {thumbnailUri ? (
                <Image source={{ uri: thumbnailUri }} style={styles.thumbnailPreview} />
              ) : (
                <Feather name="check-circle" size={48} color={colors.primary} />
              )}
              <View style={styles.overlayPickedText}>
                <Text style={styles.pickedTextOnThumbnail}>Video đã chọn ({Math.round(duration)}s)</Text>
              </View>
            </>
          ) : (
            <>
              <Feather name="video" size={48} color={colors.primary} />
              <Text style={styles.pickedText}>Chọn video (tối đa 2 phút)</Text>
            </>
          )}
        </TouchableOpacity>

        <TextInput
          style={styles.captionInput}
          placeholder="Mô tả Reel..."
          value={caption}
          onChangeText={setCaption}
          multiline
          maxLength={500}
        />

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
        >
          <Text style={styles.submitText}>Đăng Reel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  headerTitle: { ...typography.headlineMd, color: colors.onSurface },
  body: { padding: spacing.lg },
  videoPicker: {
    height: 200,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    overflow: 'hidden',
  },
  thumbnailPreview: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlayPickedText: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  pickedTextOnThumbnail: {
    ...typography.bodyMd,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  pickedText: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: spacing.sm },
  captionInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.full,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { ...typography.labelMd, color: colors.onPrimary, fontWeight: '700' },
});
}
