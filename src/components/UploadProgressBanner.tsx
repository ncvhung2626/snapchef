import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useUploadQueue } from '../lib/uploadQueue';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

export function UploadProgressBanner() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tasks = useUploadQueue((s) => s.tasks);
  const retry = useUploadQueue((s) => s.retry);
  const cancel = useUploadQueue((s) => s.cancel);

  const active = tasks.filter((t) => t.status === 'uploading' || t.status === 'pending');
  const failed = tasks.filter((t) => t.status === 'failed');

  if (!active.length && !failed.length) return null;

  const current = active[0];

  return (
    <Modal transparent animationType="fade" visible={true}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {current ? (
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <View style={styles.absoluteCenter}>
                  <Feather name="upload-cloud" size={20} color={colors.primary} />
                </View>
              </View>
              
              <Text style={styles.title}>
                {current.status === 'uploading' ? 'Đang tải lên bài viết...' : 'Chờ tải lên...'}
              </Text>
              <Text style={styles.subtitle}>Vui lòng đợi trong giây lát</Text>

              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${current.progress}%` }]} />
                </View>
                <Text style={styles.progressText}>{Math.round(current.progress)}%</Text>
              </View>

              <TouchableOpacity style={styles.cancelBtn} onPress={() => cancel(current.id)}>
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {failed.map((t) => (
            <View key={t.id} style={styles.failedContent}>
              <Feather name="alert-circle" size={48} color={colors.error} style={{ marginBottom: spacing.sm }} />
              <Text style={styles.title}>Tải lên thất bại</Text>
              <Text style={styles.errorText} numberOfLines={2}>
                {t.error ?? 'Đã có lỗi xảy ra trong quá trình tải.'}
              </Text>
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn, styles.btnOutline]} onPress={() => cancel(t.id)}>
                  <Text style={styles.cancelText}>Hủy bỏ</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.btnPrimary]} onPress={() => retry(t.id)}>
                  <Text style={styles.btnPrimaryText}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    dialog: {
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      width: '100%',
      maxWidth: 340,
      padding: spacing.xl,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
    },
    content: {
      alignItems: 'center',
    },
    failedContent: {
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    iconContainer: {
      width: 64,
      height: 64,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    absoluteCenter: {
      position: 'absolute',
    },
    title: {
      ...typography.headlineMd,
      color: colors.onSurface,
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    subtitle: {
      ...typography.bodyMd,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: spacing.xl,
    },
    progressContainer: {
      width: '100%',
      marginBottom: spacing.xl,
    },
    progressBar: {
      height: 8,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: spacing.xs,
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
    progressText: {
      ...typography.labelMd,
      color: colors.primary,
      textAlign: 'right',
      fontWeight: 'bold',
    },
    cancelBtn: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xl,
    },
    cancelText: {
      ...typography.labelMd,
      color: colors.onSurfaceVariant,
    },
    errorText: {
      ...typography.bodyMd,
      color: colors.error,
      textAlign: 'center',
      marginBottom: spacing.xl,
    },
    actionRow: {
      flexDirection: 'row',
      gap: spacing.md,
      width: '100%',
    },
    actionBtn: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnOutline: {
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    btnPrimary: {
      backgroundColor: colors.primary,
    },
    btnPrimaryText: {
      ...typography.labelMd,
      color: colors.onPrimary,
      fontWeight: 'bold',
    },
  });
}
