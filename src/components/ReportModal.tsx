import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { submitReport, type ReportTargetType } from '../services/reportService';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

const REASONS = [
  'Nội dung không phù hợp',
  'Spam hoặc quảng cáo',
  'Quấy rối hoặc bắt nạt',
  'Thông tin sai lệch',
  'Vi phạm bản quyền',
  'Khác',
];

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
}

export function ReportModal({ visible, onClose, reporterId, targetType, targetId }: ReportModalProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const finalReason = reason === 'Khác' ? customReason.trim() : reason;
    if (!finalReason) {
      Alert.alert('Lỗi', 'Vui lòng chọn hoặc nhập lý do báo cáo');
      return;
    }
    setSubmitting(true);
    try {
      await submitReport({ reporterId, targetType, targetId, reason: finalReason });
      Alert.alert('Đã gửi', 'Cảm ơn bạn. Báo cáo sẽ được xem xét sớm.');
      setReason('');
      setCustomReason('');
      onClose();
    } catch (err) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không gửi được báo cáo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Báo cáo nội dung</Text>
          {REASONS.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.reasonRow, reason === r && styles.reasonActive]}
              onPress={() => setReason(r)}
            >
              <Text style={[styles.reasonText, reason === r && styles.reasonTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
          {reason === 'Khác' && (
            <TextInput
              style={styles.input}
              placeholder="Mô tả lý do..."
              placeholderTextColor={colors.onSurfaceVariant}
              value={customReason}
              onChangeText={setCustomReason}
              multiline
            />
          )}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitText}>Gửi báo cáo</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: spacing.lg,
      paddingBottom: spacing['2xl'],
    },
    title: { ...typography.headlineMd, color: colors.onSurface, marginBottom: spacing.md },
    reasonRow: {
      padding: spacing.md,
      borderRadius: radius.lg,
      marginBottom: spacing.xs,
      backgroundColor: colors.surfaceContainer,
    },
    reasonActive: { backgroundColor: colors.primaryContainer },
    reasonText: { ...typography.bodyMd, color: colors.onSurface },
    reasonTextActive: { color: colors.primary, fontWeight: '600' },
    input: {
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: radius.lg,
      padding: spacing.md,
      minHeight: 80,
      marginTop: spacing.sm,
      textAlignVertical: 'top',
      color: colors.onSurface,
    },
    actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
    cancelBtn: {
      flex: 1,
      padding: spacing.md,
      alignItems: 'center',
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    cancelText: { ...typography.labelMd, color: colors.onSurfaceVariant },
    submitBtn: {
      flex: 1,
      padding: spacing.md,
      alignItems: 'center',
      borderRadius: radius.lg,
      backgroundColor: colors.error,
    },
    submitText: { ...typography.labelMd, color: '#fff', fontWeight: '600' },
  });
}
