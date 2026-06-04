import React, { useState } from 'react';
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
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

export const InboxScreen = () => {
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
      title: c.otherUserName ?? 'Tin nhắn',
    });
  };

  const openNewChat = () => rootNav?.navigate('NewChat');

  const loading = activeTab === 'notifications' ? notifLoading : chatLoading;
  const refreshing = activeTab === 'notifications' ? notifRefreshing : chatRefreshing;
  const onRefresh = activeTab === 'notifications' ? refreshNotif : refreshChat;
  const listData = activeTab === 'notifications' ? notifications : conversations;
  const isEmpty = listData.length === 0;

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>Chưa có dữ liệu</Text>
      <Text style={styles.emptyDesc}>
        {activeTab === 'notifications'
          ? 'Khi có người thích, bình luận hoặc theo dõi bạn, thông báo sẽ hiển thị ở đây.'
          : 'Bắt đầu trò chuyện với bạn bè trong cộng đồng SnapChef.'}
      </Text>
      {activeTab === 'messages' && (
        <TouchableOpacity style={styles.newChatBtn} onPress={openNewChat}>
          <Text style={styles.newChatText}>Tin nhắn mới</Text>
        </TouchableOpacity>
      )}
    </View>
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
      ) : (
        <FlatList
          data={listData as Notification[] | Conversation[]}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => {
            if (activeTab === 'notifications') {
              const n = item as Notification;
              return (
                <NotificationItem
                  title={n.title}
                  description={n.description}
                  type={n.type}
                  isUnread={!n.isRead}
                  timeAgo={formatRelativeTime(n.createdAt)}
                  onPress={() => openNotification(n)}
                />
              );
            }
            const c = item as Conversation;
            return (
              <MessageItem
                name={c.otherUserName ?? 'Người dùng'}
                message={c.lastMessage}
                avatarUrl={c.otherUserAvatar}
                timeAgo={formatRelativeTime(c.updatedAt)}
                onPress={() => openChat(c)}
              />
            );
          }}
          contentContainerStyle={[styles.listContainer, isEmpty && styles.listEmpty]}
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

const styles = StyleSheet.create({
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
