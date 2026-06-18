import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useUploadQueue } from '../lib/uploadQueue';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

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
    <View style={styles.container}>
      {current ? (
        <View style={styles.row}>
          <Feather name="upload-cloud" size={18} color={colors.onPrimary} />
          <View style={styles.info}>
            <Text style={styles.label}>
              {current.status === 'uploading' ? 'Đang tải lên...' : 'Chờ tải lên...'}
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${current.progress}%` }]} />
            </View>
          </View>
          <TouchableOpacity onPress={() => cancel(current.id)}>
            <Feather name="x" size={18} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>
      ) : null}
      {failed.map((t) => (
        <View key={t.id} style={styles.failedRow}>
          <Feather name="alert-circle" size={16} color={colors.error} />
          <Text style={styles.failedText} numberOfLines={1}>{t.error ?? 'Upload thất bại'}</Text>
          <TouchableOpacity onPress={() => retry(t.id)}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    info: { flex: 1 },
    label: { ...typography.labelMd, color: colors.onPrimary, marginBottom: 4 },
    progressBar: {
      height: 4,
      backgroundColor: 'rgba(255,255,255,0.3)',
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressFill: { height: '100%', backgroundColor: colors.onPrimary },
    failedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: spacing.xs,
      backgroundColor: colors.surface,
      padding: spacing.xs,
      borderRadius: 8,
    },
    failedText: { ...typography.labelMd, color: colors.onSurface, flex: 1, fontSize: 12 },
    retryText: { ...typography.labelMd, color: colors.primary, fontWeight: '600' },
  });
}
