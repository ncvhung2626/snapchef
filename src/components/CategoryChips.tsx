import React, { useMemo } from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { RECIPE_CATEGORIES } from '../constants/categories';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

interface CategoryChipsProps {
  active: string;
  onChange: (key: string) => void;
}

export const CategoryChips = ({ active, onChange }: CategoryChipsProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {RECIPE_CATEGORIES.map((c) => {
        const selected = active === c.key;
        return (
          <TouchableOpacity
            key={c.key}
            style={[styles.chip, selected && styles.chipActive]}
            onPress={() => onChange(c.key)}
          >
            <Text style={[styles.chipText, selected && styles.chipTextActive]}>{c.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    row: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingVertical: spacing.sm },
    chip: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      backgroundColor: colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: { ...typography.labelMd, color: colors.onSurfaceVariant },
    chipTextActive: { color: colors.onPrimary },
  });
}
