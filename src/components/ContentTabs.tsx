import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

interface Tab {
  key: string;
  label: string;
}

interface ContentTabsProps {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
}

export function ContentTabs({ tabs, active, onChange }: ContentTabsProps) {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              { borderColor: colors.outlineVariant },
              isActive && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => onChange(tab.key)}
          >
            <Text style={[styles.label, { color: isActive ? colors.primary : colors.onSurfaceVariant }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  tab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  label: { ...typography.labelMd, fontWeight: '700' },
});
