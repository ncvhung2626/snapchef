import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface AppHeaderProps {
  title: string;
  rightAction?: React.ReactNode;
}

export const AppHeader = ({ title, rightAction }: AppHeaderProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.leftGroup}>
        <TouchableOpacity style={styles.iconButton}>
          <Feather name="menu" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
      {rightAction ?? (
        <TouchableOpacity style={styles.iconButton}>
          <Feather name="search" size={24} color={colors.onSurface} />
        </TouchableOpacity>
      )}
    </View>
  );
};

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceVariant,
    },
    leftGroup: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconButton: {
      padding: spacing.xs,
    },
    title: {
      ...typography.headlineLg,
      color: colors.onSurface,
      marginLeft: spacing.md,
    },
  });
}
