import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CreateActionSheet } from './CreateActionSheet';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getUnreadCount } from '../services/notificationService';
import type { RootStackParamList } from '../types/navigation';
import type { NavigationProp } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { shadows } from '../theme/shadows';

const TAB_CONFIG: Array<{
  name: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  isFab?: boolean;
}> = [
  { name: 'Feed', icon: 'home', label: 'Trang chủ' },
  { name: 'Search', icon: 'search', label: 'Tìm kiếm' },
  { name: 'CreatePost', icon: 'plus', label: 'Tạo', isFab: true },
  { name: 'Inbox', icon: 'bell', label: 'Thông báo' },
  { name: 'Profile', icon: 'user', label: 'Cá nhân' },
];

export const BottomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const rootNav = navigation.getParent<NavigationProp<RootStackParamList>>();

  const refreshUnread = useCallback(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    getUnreadCount(user._id).then(setUnreadCount).catch(() => setUnreadCount(0));
  }, [user?._id]);

  useFocusEffect(
    useCallback(() => {
      refreshUnread();
    }, [refreshUnread])
  );

  useEffect(() => {
    refreshUnread();
  }, [state.index, refreshUnread]);

  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {TAB_CONFIG.map((tab) => {
        if (tab.isFab) {
          return (
            <TouchableOpacity
              key={tab.name}
              activeOpacity={0.8}
              onPress={() => setCreateOpen(true)}
              style={styles.tab}
              accessibilityLabel="Đăng bài"
            >
              <View style={styles.postButtonWrapper}>
                <View style={styles.postButton}>
                  <Feather name="plus" size={28} color={colors.onPrimary} />
                </View>
              </View>
              <Text style={[styles.label, styles.postLabel, { color: colors.primary }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        }

        const routeIndex = state.routes.findIndex((r) => r.name === tab.name);
        if (routeIndex < 0) return null;

        const route = state.routes[routeIndex];
        const { options } = descriptors[route.key];
        const label = (options.tabBarLabel ?? options.title ?? tab.label) as string;
        const isFocused = state.index === routeIndex;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const showBadge = tab.name === 'Inbox' && unreadCount > 0;

        return (
          <TouchableOpacity key={tab.name} onPress={onPress} style={styles.tab} activeOpacity={0.7}>
            <View>
              <Feather
                name={tab.icon}
                size={24}
                color={isFocused ? colors.primary : colors.onSurfaceVariant}
              />
              {showBadge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.label,
                { color: isFocused ? colors.primary : colors.onSurfaceVariant },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
    <CreateActionSheet
      visible={createOpen}
      onClose={() => setCreateOpen(false)}
      onQuickPost={() => rootNav?.navigate('CreatePost')}
      onRecipe={() => rootNav?.navigate('CreateRecipe')}
      onReel={() => rootNav?.navigate('CreateReel')}
    />
    </>
  );
};

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'flex-end',
      paddingTop: spacing.sm,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.surfaceVariant,
    },
    tab: {
      alignItems: 'center',
      justifyContent: 'flex-end',
      flex: 1,
    },
    label: {
      ...typography.labelMd,
      marginTop: spacing.xs,
    },
    postButtonWrapper: {
      marginTop: -spacing.lg,
      marginBottom: spacing.xs,
    },
    postButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      borderWidth: 4,
      borderColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.fab,
      shadowColor: colors.primary,
    },
    postLabel: {
      marginTop: 0,
      fontWeight: '700',
    },
    badge: {
      position: 'absolute',
      top: -4,
      right: -8,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.error,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.onError,
    },
  });
}
