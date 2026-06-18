import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Modal,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackScreenProps } from '../types/navigation';
import type { Reel } from '../types/models';
import { useReelsInfiniteQuery, useToggleReelLikeMutation } from '../queries/useReelsQuery';
import { formatCount, recordReelView, toggleReelSave } from '../services/reelService';
import * as reelRepo from '../repositories/reel.repository';
import { followUser, isFollowing } from '../services/friendService';
import { ReportModal } from '../components/ReportModal';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { lightColors } from '../theme/palettes';
import { ReelSkeleton } from '../components/FeedSkeleton';
import { EmptyState, ErrorState } from '../components/StateViews';
import { useFeedStore } from '../store/feedStore';

import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

function extractHashtags(text: string): string[] {
  return [...text.matchAll(/#(\w+)/g)].map((m) => m[1]);
}

function captionWithoutHashtags(text: string): string {
  return text.replace(/#\w+/g, '').trim();
}

interface ReelItemProps {
  item: Reel;
  itemHeight: number;
  isActive: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
  onFollow: () => void;
  following: boolean;
}

const ReelVideo = ({ uri, isActive, reelId }: { uri: string; isActive: boolean; reelId: string }) => {
  const setVideoPosition = useFeedStore((s) => s.setVideoPosition);
  const savedMs = useFeedStore((s) => s.videoPositions[reelId] ?? 0);

  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    if (savedMs > 0) {
      p.currentTime = savedMs / 1000;
    }
  });

  useEffect(() => {
    if (isActive) {
      if (savedMs > 0 && Math.abs(player.currentTime * 1000 - savedMs) > 500) {
        player.currentTime = savedMs / 1000;
      }
      player.play();
    } else {
      player.pause();
      const ms = Math.round(player.currentTime * 1000);
      if (ms > 0) setVideoPosition(reelId, ms);
    }
  }, [isActive, player, reelId, savedMs, setVideoPosition]);

  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      nativeControls={false}
    />
  );
};

const ReelItem = ({ item, itemHeight, isActive, onLike, onComment, onShare, onSave, onFollow, following }: ReelItemProps) => {
  const { colors } = useTheme();
  const [saved, setSaved] = useState(item.savedByMe);
  const [expanded, setExpanded] = useState(false);
  const hashtags = extractHashtags(item.description);
  const caption = captionWithoutHashtags(item.description);

  useEffect(() => { setSaved(item.savedByMe); }, [item.savedByMe]);

  useEffect(() => {
    if (isActive && item._id && !item._id.startsWith('mock')) {
      void recordReelView(item._id);
    }
  }, [isActive, item._id]);

  return (
    <View style={[styles.reelContainer, { height: itemHeight, backgroundColor: colors.reelsBackground }]}>
      {item.videoUrl ? (
        <ReelVideo key={item._id} uri={item.videoUrl} isActive={isActive} reelId={item._id} />
      ) : (
        <View style={[styles.videoPlaceholder, { backgroundColor: colors.surfaceContainerHigh }]}>
          {item.thumbnailUrl ? (
            <Image source={{ uri: item.thumbnailUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : null}
          <Feather name="play-circle" size={64} color={colors.reelsTextMuted} />
        </View>
      )}

      <View style={styles.overlay}>
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.actionButton} onPress={onLike}>
            <Feather name="heart" size={32} color={item.likedByMe ? colors.error : colors.reelsText} />
            <Text style={[styles.actionText, { color: colors.reelsText }]}>{formatCount(item.likesCount)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onComment}>
            <Feather name="message-circle" size={32} color={colors.reelsText} />
            <Text style={[styles.actionText, { color: colors.reelsText }]}>{formatCount(item.commentsCount)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => { setSaved(!saved); onSave(); }}>
            <Feather name="bookmark" size={32} color={saved ? colors.primary : colors.reelsText} />
            <Text style={[styles.actionText, { color: colors.reelsText }]}>{formatCount(item.savesCount)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onShare}>
            <Feather name="share-2" size={32} color={colors.reelsText} />
            <Text style={[styles.actionText, { color: colors.reelsText }]}>Chia sẻ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onFollow}>
            <Feather name={following ? 'user-check' : 'user-plus'} size={28} color={following ? colors.primary : colors.reelsText} />
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <TouchableOpacity style={styles.authorRow} activeOpacity={0.8}>
            {item.authorAvatar ? (
              <Image source={{ uri: item.authorAvatar }} style={styles.reelAvatar} />
            ) : (
              <View style={[styles.reelAvatar, styles.avatarPh]}>
                <Feather name="user" size={16} color={colors.reelsTextMuted} />
              </View>
            )}
            <Text style={[styles.author, { color: colors.reelsText }]}>@{item.authorHandle}</Text>
          </TouchableOpacity>
          {caption ? (
            <TouchableOpacity onPress={() => setExpanded((e) => !e)} activeOpacity={0.9}>
              <Text style={[styles.description, { color: colors.reelsText }]} numberOfLines={expanded ? undefined : 2}>
                {caption}
              </Text>
              <Text style={[styles.expandHint, { color: colors.reelsTextMuted }]}>
                {expanded ? 'Thu gọn' : 'Xem thêm'}
              </Text>
            </TouchableOpacity>
          ) : null}
          {hashtags.length > 0 && (
            <View style={styles.hashtagRow}>
              {hashtags.slice(0, 4).map((tag) => (
                <Text key={tag} style={[styles.hashtag, { color: colors.primary }]}>#{tag}</Text>
              ))}
            </View>
          )}
          {item.viewCount > 0 && (
            <Text style={[styles.views, { color: colors.reelsTextMuted }]}>{formatCount(item.viewCount)} lượt xem</Text>
          )}
        </View>
      </View>
    </View>
  );
};

export const ReelsScreen = ({ navigation }: RootStackScreenProps<'Reels'>) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [listHeight, setListHeight] = useState(Dimensions.get('window').height);
  const setReelsIndex = useFeedStore((s) => s.setReelsIndex);
  const [activeIndex, setActiveIndex] = useState(() => useFeedStore.getState().reelsIndex);
  const [commentReel, setCommentReel] = useState<Reel | null>(null);
  const [commentText, setCommentText] = useState('');
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [reportReelId, setReportReelId] = useState<string | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useReelsInfiniteQuery(user?._id);
  const likeMutation = useToggleReelLikeMutation();

  const reels = data?.pages.flatMap((p) => p.reels) ?? [];

  const handleLike = useCallback(
    (reel: Reel) => {
      if (!user) {
        Alert.alert('Đăng nhập', 'Vui lòng đăng nhập để thích reel');
        return;
      }
      likeMutation.mutate({ reelId: reel._id, userId: user._id });
    },
    [user, likeMutation]
  );

  const handleSave = useCallback(
    async (reel: Reel) => {
      if (!user) return;
      try {
        await toggleReelSave(reel._id, user._id);
      } catch {
        /* ignore */
      }
    },
    [user]
  );

  const handleFollow = useCallback(
    async (reel: Reel) => {
      if (!user) {
        Alert.alert('Đăng nhập', 'Vui lòng đăng nhập để theo dõi');
        return;
      }
      try {
        const already = followingMap[reel.authorId] ?? (await isFollowing(user._id, reel.authorId));
        if (!already) {
          await followUser(user._id, reel.authorId);
          setFollowingMap((m) => ({ ...m, [reel.authorId]: true }));
        } else {
          navigation.navigate('UserProfile', { userId: reel.authorId });
        }
      } catch (err) {
        Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thực hiện được');
      }
    },
    [user, followingMap, navigation]
  );

  const handleSubmitComment = useCallback(async () => {
    if (!user || !commentReel || !commentText.trim()) return;
    setSubmittingComment(true);
    try {
      await reelRepo.addReelComment(commentReel._id, user._id, commentText.trim());
      setCommentReel(null);
      setCommentText('');
      void refetch();
    } catch (err) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không gửi được bình luận');
    } finally {
      setSubmittingComment(false);
    }
  }, [user, commentReel, commentText, refetch]);

  const handleShare = useCallback(async (reel: Reel) => {
    try {
      await Share.share({ message: `${reel.description}\n\nSnapChef Reels` });
    } catch {
      /* ignore */
    }
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
    if (viewableItems[0]?.index != null) {
      setActiveIndex(viewableItems[0].index);
      setReelsIndex(viewableItems[0].index);
    }
  }).current;

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ReelSkeleton />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity style={[styles.backBtn, { top: insets.top + 8 }]} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <ErrorState message="Không tải được Reels" onRetry={() => refetch()} />
      </View>
    );
  }

  if (reels.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <EmptyState icon="film" title="Chưa có Reels" message="Hãy là người đầu tiên đăng reel!" />
      </View>
    );
  }

  return (
    <View
      style={styles.container}
      onLayout={(e) => setListHeight(e.nativeEvent.layout.height)}
    >
      <TouchableOpacity style={[styles.backBtn, { top: insets.top + 8 }]} onPress={() => navigation.goBack()}>
        <Feather name="arrow-left" size={24} color="#fff" />
      </TouchableOpacity>

      <FlatList
        data={reels}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => (
          <ReelItem
            item={item}
            itemHeight={listHeight}
            isActive={index === activeIndex}
            onLike={() => handleLike(item)}
            onComment={() => setCommentReel(item)}
            onShare={() => handleShare(item)}
            onSave={() => handleSave(item)}
            onFollow={() => handleFollow(item)}
            following={followingMap[item.authorId] ?? false}
          />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={listHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? <ActivityIndicator color="#fff" style={{ marginVertical: 16 }} /> : null
        }
      />

      <Modal visible={Boolean(commentReel)} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Bình luận</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Viết bình luận..."
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => { setCommentReel(null); setCommentText(''); }}>
                <Text style={styles.modalCancel}>Đóng</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSubmitComment} disabled={submittingComment}>
                <Text style={styles.modalSend}>{submittingComment ? '...' : 'Gửi'}</Text>
              </TouchableOpacity>
            </View>
            {user && commentReel && (
              <TouchableOpacity onPress={() => { setReportReelId(commentReel._id); setCommentReel(null); }}>
                <Text style={styles.reportLink}>Báo cáo Reel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {user && reportReelId && (
        <ReportModal
          visible={Boolean(reportReelId)}
          onClose={() => setReportReelId(null)}
          reporterId={user._id}
          targetType="reel"
          targetId={reportReelId}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  backBtn: {
    position: 'absolute',
    left: spacing.md,
    zIndex: 10,
    padding: spacing.xs,
  },
  reelContainer: { width: Dimensions.get('window').width, backgroundColor: '#000' },
  videoPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs, gap: spacing.sm },
  reelAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: '#fff' },
  avatarPh: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)' },
  hashtagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  hashtag: { ...typography.labelMd, fontWeight: '700' },
  expandHint: { ...typography.labelMd, fontSize: 12, marginTop: 2 },
  overlay: { ...StyleSheet.absoluteFillObject },
  actionBar: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.xl + 40,
    alignItems: 'center',
  },
  actionButton: { alignItems: 'center', marginBottom: spacing.lg },
  actionText: {
    ...typography.labelMd,
    color: 'white',
    marginTop: spacing['2xs'],
    fontWeight: '600',
  },
  infoSection: {
    position: 'absolute',
    left: spacing.md,
    bottom: spacing.xl + 40,
    right: 80,
  },
  author: { ...typography.headlineMd, color: 'white', marginBottom: spacing.xs },
  description: { ...typography.bodyMd, color: 'white', lineHeight: 20 },
  views: { ...typography.labelMd, color: 'rgba(255,255,255,0.7)', marginTop: spacing.xs },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: lightColors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.lg,
    minHeight: 200,
  },
  modalTitle: { ...typography.headlineMd, color: lightColors.onSurface, marginBottom: spacing.md },
  commentInput: {
    borderWidth: 1,
    borderColor: lightColors.outlineVariant,
    borderRadius: 12,
    padding: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  modalCancel: { ...typography.labelMd, color: lightColors.onSurfaceVariant },
  modalSend: { ...typography.labelMd, color: lightColors.primary, fontWeight: '700' },
  reportLink: { ...typography.labelMd, color: lightColors.error, textAlign: 'center', marginTop: spacing.md },
});
