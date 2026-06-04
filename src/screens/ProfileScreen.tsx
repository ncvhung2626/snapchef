import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { AppHeader } from '../components/AppHeader';
import { useAuth } from '../context/AuthContext';
import { getProfileStats } from '../services/profileService';
import type { RootStackParamList } from '../types/navigation';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

export const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user, logout, refreshProfile } = useAuth();
  const [postsCount, setPostsCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      refreshProfile().catch(() => {});
      if (user?._id) {
        getProfileStats(user._id)
          .then((s) => setPostsCount(s.postsCount))
          .catch(() => setPostsCount(0));
      }
    }, [refreshProfile, user?._id])
  );

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const followers = user?.followers?.length ?? 0;
  const following = user?.following?.length ?? 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AppHeader title="Cá nhân" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <Feather name="user" size={40} color={colors.onPrimaryFixed} />
            )}
          </View>
          <Text style={styles.name}>{user?.fullname ?? 'Khách'}</Text>
          <Text style={styles.bio}>{user?.bio || user?.email || 'SnapChef member'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role?.toUpperCase() ?? 'USER'}</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{postsCount}</Text>
            <Text style={styles.statLabel}>BÀI ĐÃ ĐĂNG</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{followers}</Text>
            <Text style={styles.statLabel}>NGƯỜI THEO DÕI</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{following}</Text>
            <Text style={styles.statLabel}>ĐANG THEO DÕI</Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.getParent()?.navigate('EditProfile')}
          >
            <Feather name="edit-3" size={20} color={colors.primary} />
            <Text style={styles.menuLabel}>Chỉnh sửa hồ sơ</Text>
            <Feather name="chevron-right" size={20} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Feather name="bookmark" size={20} color={colors.onSurface} />
            <Text style={styles.menuLabel}>Công thức đã lưu</Text>
            <Feather name="chevron-right" size={20} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Feather name="log-out" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyIconCircle}>
            <Feather name="bookmark" size={32} color={colors.onSurfaceVariant} />
          </View>
          <Text style={styles.emptyTitle}>Sổ tay trống!</Text>
          <Text style={styles.emptyDesc}>
            Lưu công thức từ Reels hoặc bảng tin (Sprint 3 — bài viết).
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, paddingBottom: spacing['2xl'] },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  avatarContainer: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 3,
    borderColor: colors.primaryContainer,
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  name: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginBottom: spacing['2xs'],
  },
  bio: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  roleBadge: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing['2xs'],
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radius.full,
  },
  roleText: { ...typography.labelMd, color: colors.primary },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.surfaceVariant,
    marginHorizontal: spacing.lg,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginBottom: spacing['2xs'],
  },
  statLabel: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    fontSize: 10,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.surfaceVariant,
  },
  menuSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
    gap: spacing.md,
  },
  menuLabel: {
    ...typography.bodyLg,
    color: colors.onSurface,
    flex: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.errorContainer,
    backgroundColor: colors.surface,
  },
  logoutText: {
    ...typography.bodyLg,
    color: colors.error,
    fontWeight: '600',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing['2xl'],
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  emptyDesc: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
  },
});
