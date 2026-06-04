import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { RootStackScreenProps } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import * as chatService from '../services/chatService';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

export const NewChatScreen = ({ navigation }: RootStackScreenProps<'NewChat'>) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<Array<{ id: string; fullname: string; avatar?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    chatService
      .searchUsersForChat(user._id, query)
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [user?._id, query]);

  const startChat = async (otherUserId: string, name: string) => {
    if (!user) return;
    setStarting(otherUserId);
    try {
      const convo = await chatService.getOrCreateConversation(user._id, otherUserId);
      navigation.replace('Chat', {
        conversationId: convo._id,
        title: convo.otherUserName ?? name,
      });
    } catch (e) {
      Alert.alert('Lỗi', e instanceof Error ? e.message : 'Không mở được chat');
    } finally {
      setStarting(null);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Tin nhắn mới</Text>
        <View style={{ width: 24 }} />
      </View>

      <TextInput
        style={styles.search}
        placeholder="Tìm theo tên..."
        placeholderTextColor={colors.onSurfaceVariant}
        value={query}
        onChangeText={setQuery}
      />

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => startChat(item.id, item.fullname)}
              disabled={starting === item.id}
            >
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatar}>
                  <Feather name="user" size={22} color={colors.onSurfaceVariant} />
                </View>
              )}
              <Text style={styles.name}>{item.fullname}</Text>
              {starting === item.id ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Feather name="message-circle" size={22} color={colors.primary} />
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Không tìm thấy người dùng.</Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  title: { ...typography.headlineMd, color: colors.onSurface },
  search: {
    margin: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    ...typography.bodyLg,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  list: { paddingHorizontal: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceVariant,
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  name: { flex: 1, ...typography.bodyLg, fontWeight: '600', color: colors.onSurface },
  empty: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
