import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { RootStackScreenProps } from '../types/navigation';
import type { GroupWithMembership } from '../services/groupService';
import * as groupService from '../services/groupService';
import type { GroupMember } from '../services/groupService';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

export const MemberManagementScreen = ({
  navigation,
  route,
}: RootStackScreenProps<'MemberManagement'>) => {
  const { groupId } = route.params;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [group, setGroup] = useState<GroupWithMembership | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [g, m] = await Promise.all([
      groupService.getGroupById(groupId, user?._id),
      groupService.getGroupMembers(groupId),
    ]);
    setGroup(g ?? null);
    setMembers(m);
  }, [groupId, user?._id]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const canManage = groupService.canManageGroup(group, user?._id);

  const removeMember = (memberId: string) => {
    if (!user) return;
    Alert.alert('Xóa thành viên', 'Xóa thành viên khỏi nhóm?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await groupService.removeGroupMember(groupId, user._id, memberId);
            setMembers((prev) => prev.filter((m) => m.userId !== memberId));
          } catch (e) {
            Alert.alert('Lỗi', e instanceof Error ? e.message : 'Không xóa được');
          }
        },
      },
    ]);
  };

  const roleLabel = (role: string) => {
    if (role === 'owner') return 'Chủ nhóm';
    if (role === 'admin') return 'Quản trị';
    return 'Thành viên';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.title}>Quản lý thành viên</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isOwner = item.role === 'owner';
            return (
              <View style={styles.row}>
                {item.avatar ? (
                  <Image source={{ uri: item.avatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatar}>
                    <Feather name="user" size={20} color={colors.onSurfaceVariant} />
                  </View>
                )}
                <View style={styles.rowBody}>
                  <Text style={styles.name}>{item.fullname}</Text>
                  <Text style={styles.role}>{roleLabel(item.role)}</Text>
                </View>
                {canManage && !isOwner && item.userId !== user?._id && (
                  <TouchableOpacity onPress={() => removeMember(item.userId)}>
                    <Feather name="user-minus" size={20} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  title: { ...typography.headlineMd, color: colors.onSurface },
  list: { padding: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceVariant,
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rowBody: { flex: 1 },
  name: { ...typography.bodyLg, fontWeight: '600', color: colors.onSurface },
  role: { ...typography.bodyMd, color: colors.onSurfaceVariant },
});
