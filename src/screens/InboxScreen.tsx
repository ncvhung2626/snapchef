import React, { useMemo, useState } from 'react';
import { useTheme } from '../theme/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { AppHeader } from '../components/AppHeader';
import { NotificationItem } from '../components/NotificationItem';
import { MessageItem } from '../components/MessageItem';
import { useNotifications } from '../hooks/useNotifications';
import { useConversations } from '../hooks/useConversations';
import type { Notification, Conversation } from '../types/models';
import type { RootStackParamList } from '../types/navigation';
import { formatRelativeTime } from '../utils/formatTime';
import { EmptyState } from '../components/StateViews';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

export const InboxScreen = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation();
  const rootNav = navigation.getParent<NavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<'notifications' | 'messages'>('notifications');
  const {
    notifications,
    unreadCount,
    loading: notifLoading,
    refreshing: notifRefreshing,
    refresh: refreshNotif,
    markRead,
    markAllRead,
  } = useNotifications();
  const {
    conversations,
    loading: chatLoading,
    refreshing: chatRefreshing,
    refresh: refreshChat,
  } = useConversations();

  const openNotification = async (n: Notification) => {
    if (!n.isRead) await markRead(n._id);
    if (n.type === 'comment' && n.postId) {
      rootNav?.navigate('Comment', { postId: n.postId });
      return;
    }
    if (n.postId) {
      rootNav?.navigate('PostDetail', { postId: n.postId });
      return;
    }
    if (n.groupId) {
      rootNav?.navigate('GroupDetail', { groupId: n.groupId });
    }
  };

  const openChat = (c: Conversation) => {
    rootNav?.navigate('Chat', {
      conversationId: c._id,
      title: c.isGroupChat ? (c.groupTitle ?? 'Chat nhóm') : (c.otherUserName ?? 'Tin nhắn'),
      isGroupChat: c.isGroupChat,
    });
  };

  const openNewChat = () => rootNav?.navigate('NewChat');

  const loading = activeTab === 'notifications' ? notifLoading : chatLoading;
  const refreshing = activeTab === 'notifications' ? notifRefreshing : chatRefreshing;
  const onRefresh = activeTab === 'notifications' ? refreshNotif : refreshChat;
  const listData = activeTab === 'notifications' ? notifications : conversations;
  const isEmpty = listData.length === 0;

  const renderEmpty = () => (
    <EmptyState
      icon={activeTab === 'notifications' ? 'bell' : 'message-circle'}
      title={activeTab === 'notifications' ? 'Chưa có thông báo' : 'Chưa có tin nhắn'}
      message={
        activeTab === 'notifications'
          ? 'Khi có người thích, bình luận hoặc theo dõi bạn, thông báo sẽ hiển thị ở đây.'
          : 'Bắt đầu trò chuyện với bạn bè trong cộng đồng SnapChef.'
      }
      actionLabel={activeTab === 'messages' ? 'Tin nhắn mới' : undefined}
      onAction={activeTab === 'messages' ? openNewChat : undefined}
    />
  );

  const headerRight =
    activeTab === 'notifications' && unreadCount > 0 ? (
      <TouchableOpacity onPress={markAllRead}>
        <Text style={styles.markAll}>Đọc tất cả</Text>
      </TouchableOpacity>
    ) : activeTab === 'messages' ? (
      <TouchableOpacity onPress={openNewChat}>
        <Text style={styles.markAll}>+ Mới</Text>
      </TouchableOpacity>
    ) : undefined;

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Hộp thư của bạn" rightAction={headerRight} />

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'notifications' && styles.tabButtonActive]}
          onPress={() => setActiveTab('notifications')}
        >
          <Text style={[styles.tabText, activeTab === 'notifications' && styles.tabTextActive]}>
            Thông báo{unreadCount > 0 ? ` (${unreadCount})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'messages' && styles.tabButtonActive]}
          onPress={() => setActiveTab('messages')}
        >
          <Text style={[styles.tabText, activeTab === 'messages' && styles.tabTextActive]}>
            Tin nhắn
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : activeTab === 'notifications' ? (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={({ item: n }) => (
            <NotificationItem
              title={n.title}
              description={n.description}
              type={n.type}
              isUnread={!n.isRead}
              timeAgo={formatRelativeTime(n.createdAt)}
              onPress={() => openNotification(n)}
            />
          )}
          contentContainerStyle={[styles.listContainer, notifications.length === 0 && styles.listEmpty]}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item._id}
          renderItem={({ item: c }) => (
            <MessageItem
              name={c.isGroupChat ? (c.groupTitle ?? 'Chat nhóm') : (c.otherUserName ?? 'Người dùng')}
              message={c.lastMessage}
              avatarUrl={c.isGroupChat ? undefined : c.otherUserAvatar}
              timeAgo={formatRelativeTime(c.updatedAt)}
              onPress={() => openChat(c)}
            />
          )}
          contentContainerStyle={[styles.listContainer, conversations.length === 0 && styles.listEmpty]}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  markAll: {
    ...typography.labelMd,
    color: colors.primary,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingBottom: spacing['2xl'],
  },
  listEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['3xl'],
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
  },
  newChatBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
  },
  newChatText: {
    ...typography.labelMd,
    color: colors.onPrimary,
    fontWeight: 'bold',
  },
});
}
