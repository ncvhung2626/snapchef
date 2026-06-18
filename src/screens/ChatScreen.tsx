import React, { useMemo, useRef, useState } from 'react';
import { useTheme } from '../theme/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { RootStackScreenProps } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { useChatMessages } from '../hooks/useChatMessages';
import type { Message } from '../types/models';
import { formatRelativeTime } from '../utils/formatTime';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

export const ChatScreen = ({ navigation, route }: RootStackScreenProps<'Chat'>) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { conversationId, title, isGroupChat } = route.params;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { messages, loading, sending, send, typingUsers, notifyTyping } = useChatMessages(
    conversationId,
    user?._id,
    user?.fullname
  );
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  const handleSend = async () => {
    if (!user || !text.trim()) return;
    const content = text.trim();
    setText('');
    notifyTyping(false);
    try {
      await send(user._id, content);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      setText(content);
    }
  };

  const handleTextChange = (value: string) => {
    setText(value);
    notifyTyping(value.trim().length > 0);
  };

  const renderBubble = ({ item }: { item: Message }) => {
    const isMine = item.sender === user?._id;
    return (
      <View style={[styles.bubbleRow, isMine && styles.bubbleRowMine]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
          {!isMine && isGroupChat ? (
            <Text style={styles.senderName}>{item.senderName}</Text>
          ) : null}
          <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{item.content}</Text>
          <View style={styles.metaRow}>
            <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>
              {formatRelativeTime(item.createdAt)}
            </Text>
            {isMine && item.readByOthers ? (
              <Feather name="check-circle" size={12} color={colors.onPrimary} style={styles.readIcon} />
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title ?? 'Tin nhắn'}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderBubble}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <Text style={styles.empty}>Gửi tin nhắn đầu tiên để bắt đầu trò chuyện.</Text>
          }
        />
      )}

      {typingUsers.length > 0 ? (
        <Text style={styles.typing}>Đang nhập...</Text>
      ) : null}

      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
        <TextInput
          style={styles.input}
          placeholder="Nhập tin nhắn..."
          placeholderTextColor={colors.onSurfaceVariant}
          value={text}
          onChangeText={handleTextChange}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <Feather name="send" size={20} color={colors.onPrimary} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  backBtn: { padding: spacing.xs },
  headerTitle: {
    flex: 1,
    ...typography.headlineMd,
    color: colors.onSurface,
    textAlign: 'center',
  },
  listContent: { padding: spacing.md, paddingBottom: spacing.lg },
  empty: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing['2xl'],
  },
  typing: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    fontStyle: 'italic',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  bubbleRow: { marginBottom: spacing.sm, alignItems: 'flex-start' },
  bubbleRowMine: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '80%',
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  bubbleMine: { backgroundColor: colors.primary },
  bubbleOther: { backgroundColor: colors.surfaceContainerHigh },
  senderName: { ...typography.labelMd, color: colors.primary, marginBottom: 2 },
  bubbleText: { ...typography.bodyLg, color: colors.onSurface },
  bubbleTextMine: { color: colors.onPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing['2xs'] },
  bubbleTime: {
    ...typography.bodyMd,
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  bubbleTimeMine: { color: colors.onPrimary, opacity: 0.85 },
  readIcon: { marginLeft: 4, opacity: 0.9 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceVariant,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    ...typography.bodyLg,
    color: colors.onSurface,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.5 },
});
}
