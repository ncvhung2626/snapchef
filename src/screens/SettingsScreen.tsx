import React, { useMemo, useEffect } from 'react';
import { useTheme } from '../theme/ThemeContext';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { RootStackScreenProps } from '../types/navigation';
import { useSettingsStore } from '../store/settingsStore';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

type ThemeMode = 'light' | 'dark' | 'system';

const THEME_OPTIONS: { key: ThemeMode; label: string }[] = [
  { key: 'light', label: 'Sáng' },
  { key: 'dark', label: 'Tối' },
  { key: 'system', label: 'Theo hệ thống' },
];

export const SettingsScreen = ({ navigation }: RootStackScreenProps<'Settings'>) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { theme, setTheme, hydrate, hydrated } = useSettingsStore();

  useEffect(() => {
    if (!hydrated) void hydrate();
  }, [hydrated, hydrate]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài đặt</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Giao diện</Text>
        <View style={styles.card}>
          {THEME_OPTIONS.map((opt, i) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.option, i < THEME_OPTIONS.length - 1 && styles.optionBorder]}
              onPress={() => setTheme(opt.key)}
            >
              <Text style={styles.optionLabel}>{opt.label}</Text>
              {theme === opt.key ? (
                <Feather name="check" size={20} color={colors.primary} />
              ) : null}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Thông báo</Text>
        <View style={styles.card}>
          <View style={styles.option}>
            <Text style={styles.optionLabel}>Thích bài viết</Text>
            <Feather name="bell" size={20} color={colors.primary} />
          </View>
          <View style={[styles.option, styles.optionBorder]}>
            <Text style={styles.optionLabel}>Bình luận</Text>
            <Feather name="bell" size={20} color={colors.primary} />
          </View>
          <View style={styles.option}>
            <Text style={styles.optionLabel}>Theo dõi mới</Text>
            <Feather name="bell" size={20} color={colors.primary} />
          </View>
        </View>

        <Text style={styles.hint}>
          Cài đặt được lưu tự động trên thiết bị. Đồng bộ cloud sẽ có khi bảng user_preferences được kích hoạt.
        </Text>
      </ScrollView>
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
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.headlineLg, color: colors.onSurface },
  content: { padding: spacing.lg },
  sectionTitle: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  optionBorder: { borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
  optionLabel: { ...typography.bodyMd, color: colors.onSurface },
  hint: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xl,
    textAlign: 'center',
    fontSize: 13,
  },
});
}
