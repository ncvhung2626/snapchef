import React, { useMemo, useEffect, useState } from 'react';
import { useTheme } from '../theme/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { RootStackScreenProps } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { getUserAchievements, type Achievement } from '../services/achievementService';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

export const AchievementsScreen = ({ navigation }: RootStackScreenProps<'Achievements'>) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?._id) {
      getUserAchievements(user._id)
        .then(setAchievements)
        .finally(() => setLoading(false));
    }
  }, [user?._id]);

  const unlocked = achievements.filter((a) => a.unlocked).length;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thành tích</Text>
        <View style={styles.backBtn} />
      </View>

      <Text style={styles.summary}>
        {unlocked}/{achievements.length} huy hiệu đã mở khóa
      </Text>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={achievements}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.card, !item.unlocked && styles.cardLocked]}>
              <View style={[styles.iconCircle, item.unlocked && styles.iconUnlocked]}>
                <Feather
                  name={item.icon as keyof typeof Feather.glyphMap}
                  size={24}
                  color={item.unlocked ? colors.primary : colors.onSurfaceVariant}
                />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc}>{item.description}</Text>
                {item.target != null && (
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.min(100, ((item.progress ?? 0) / item.target) * 100)}%` },
                      ]}
                    />
                  </View>
                )}
                <Text style={styles.progressText}>
                  {item.progress ?? 0}/{item.target}
                </Text>
              </View>
              {item.unlocked && <Feather name="check-circle" size={22} color={colors.primary} />}
            </View>
          )}
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
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.headlineLg, color: colors.onSurface },
  summary: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    padding: spacing.md,
  },
  list: { padding: spacing.lg, gap: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    gap: spacing.md,
  },
  cardLocked: { opacity: 0.7 },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconUnlocked: { backgroundColor: colors.primaryContainer },
  cardBody: { flex: 1 },
  cardTitle: { ...typography.headlineMd, fontSize: 16, color: colors.onSurface },
  cardDesc: { ...typography.bodyMd, color: colors.onSurfaceVariant, fontSize: 13 },
  progressBar: {
    height: 4,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 2,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.primary },
  progressText: { ...typography.labelMd, color: colors.onSurfaceVariant, fontSize: 11, marginTop: 2 },
});
}
