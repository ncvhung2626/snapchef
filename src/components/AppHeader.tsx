import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
}

export const AppHeader = ({ title, showBack = false, onBackPress, rightAction }: AppHeaderProps) => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const hitSlop = { top: 12, bottom: 12, left: 12, right: 12 };

  return (
    <View style={styles.container}>
      <View style={styles.leftGroup}>
        {showBack ? (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={hitSlop}
          >
            <Feather name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.7}
            hitSlop={hitSlop}
            onPress={() => {
              // Placeholder for side menu drawer
            }}
          >
            <Feather name="menu" size={24} color={colors.onSurface} />
          </TouchableOpacity>
        )}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
      {rightAction ?? (
        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.7}
          hitSlop={hitSlop}
          onPress={() => {
            // Search or custom action placeholder
          }}
        >
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
      flex: 1,
      marginRight: spacing.md,
    },
    iconButton: {
      padding: spacing.xs,
    },
    title: {
      ...typography.headlineLg,
      color: colors.onSurface,
      marginLeft: spacing.md,
      flex: 1,
    },
  });
}

