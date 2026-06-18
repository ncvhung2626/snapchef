import React, { useMemo, useCallback, useState } from 'react';
import { useTheme } from '../theme/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import type { RootStackScreenProps } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { canModerate } from '../utils/permissions';
import {
  listPendingReports,
  updateReportStatus,
  type Report,
  type ReportStatus,
} from '../services/reportService';
import { EmptyState, ErrorState } from '../components/StateViews';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

const STATUS_LABELS: Record<ReportStatus, string> = {
  pending: 'Chờ xử lý',
  reviewing: 'Đang xem xét',
  resolved: 'Đã xử lý',
  dismissed: 'Bỏ qua',
};

const TARGET_LABELS: Record<string, string> = {
  post: 'Bài viết',
  comment: 'Bình luận',
  user: 'Người dùng',
  group: 'Nhóm',
  reel: 'Reel',
  message: 'Tin nhắn',
};

function ReportCard({
  report,
  onAction,
}: {
  report: Report;
  onAction: (status: ReportStatus) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{TARGET_LABELS[report.targetType] ?? report.targetType}</Text>
        </View>
        <Text style={styles.status}>{STATUS_LABELS[report.status]}</Text>
      </View>
      <Text style={styles.reason}>{report.reason}</Text>
      <Text style={styles.meta}>
        Báo cáo bởi {report.reporterName ?? 'Ẩn danh'} · {new Date(report.createdAt).toLocaleDateString('vi-VN')}
      </Text>
      {report.status === 'pending' || report.status === 'reviewing' ? (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.resolveBtn} onPress={() => onAction('resolved')}>
            <Feather name="check" size={16} color="#fff" />
            <Text style={styles.resolveText}>Xử lý</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dismissBtn} onPress={() => onAction('dismissed')}>
            <Feather name="x" size={16} color={colors.onSurfaceVariant} />
            <Text style={styles.dismissText}>Bỏ qua</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

export const AdminModerationScreen = ({ navigation }: RootStackScreenProps<'AdminModeration'>) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(false);
      const data = await listPendingReports();
      setReports(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!canModerate(user)) {
        Alert.alert('Không có quyền', 'Bạn không có quyền truy cập trang kiểm duyệt', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
        return;
      }
      setLoading(true);
      void load();
    }, [user, load, navigation])
  );

  const handleAction = async (reportId: string, status: ReportStatus) => {
    if (!user) return;
    try {
      await updateReportStatus(reportId, status, user._id);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (err) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không cập nhật được');
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kiểm duyệt</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : error ? (
        <ErrorState message="Không tải được báo cáo" onRetry={load} />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ReportCard report={item} onAction={(status) => handleAction(item.id, status)} />
          )}
          contentContainerStyle={reports.length === 0 ? styles.emptyContainer : styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); void load(); }}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="shield"
              title="Không có báo cáo"
              message="Hàng đợi kiểm duyệt đang trống"
            />
          }
        />
      )}
    </View>
  );
};

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    backgroundColor: colors.surface,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.headlineLg, color: colors.onSurface },
  listContent: { padding: spacing.lg, gap: spacing.md },
  emptyContainer: { flexGrow: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  badge: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeText: { ...typography.labelMd, color: colors.primary, fontWeight: '600' },
  status: { ...typography.labelMd, color: colors.onSurfaceVariant },
  reason: { ...typography.bodyMd, color: colors.onSurface, marginBottom: spacing.xs },
  meta: { ...typography.bodyMd, color: colors.onSurfaceVariant, fontSize: 12 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  resolveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    gap: spacing.xs,
  },
  resolveText: { ...typography.labelMd, color: '#fff', fontWeight: '600' },
  dismissBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    gap: spacing.xs,
  },
  dismissText: { ...typography.labelMd, color: colors.onSurfaceVariant },
});
}
