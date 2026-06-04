import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

const { width, height } = Dimensions.get('window');

const MOCK_REELS = [
  {
    id: '1',
    author: '@chef_hoainam',
    description: 'Bò bít tết sốt bơ tỏi cực mềm, bí quyết nằm ở thời gian nghỉ của thịt... #SnapChef #Cooking #Steak',
    likes: '12.4K',
    comments: '342',
    saves: '1.2K',
  },
  {
    id: '2',
    author: '@tuyet_trinh_baking',
    description: 'Làm bánh Macaron Pháp không hề khó như bạn nghĩ! Cùng xem nhé 🍰✨ #Baking #Macaron',
    likes: '8.9K',
    comments: '156',
    saves: '4.5K',
  },
];

const ReelItem = ({ item, itemHeight }: { item: typeof MOCK_REELS[0], itemHeight: number }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  return (
    <View style={[styles.reelContainer, { height: itemHeight }]}>
      {/* Video Placeholder Background */}
      <View style={styles.videoPlaceholder}>
        <Feather name="play-circle" size={64} color="rgba(255, 255, 255, 0.3)" />
      </View>

      {/* Overlay Content */}
      <View style={styles.overlay}>
        {/* Right Action Bar */}
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.actionButton} onPress={() => setIsLiked(!isLiked)}>
            <Feather name="heart" size={32} color={isLiked ? '#FF3B30' : 'white'} />
            <Text style={styles.actionText}>{item.likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Feather name="message-circle" size={32} color="white" />
            <Text style={styles.actionText}>{item.comments}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => setIsSaved(!isSaved)}>
            <Feather name="bookmark" size={32} color={isSaved ? colors.primary : 'white'} />
            <Text style={styles.actionText}>{item.saves}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Feather name="share-2" size={32} color="white" />
            <Text style={styles.actionText}>Chia sẻ</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.author}>{item.author}</Text>
          <Text style={styles.description} numberOfLines={3}>{item.description}</Text>
        </View>
      </View>
    </View>
  );
};

export const ReelsScreen = () => {
  const [listHeight, setListHeight] = useState(height);

  return (
    <View 
      style={styles.container}
      onLayout={(e) => setListHeight(e.nativeEvent.layout.height)}
    >
      <FlatList
        data={MOCK_REELS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ReelItem item={item} itemHeight={listHeight} />}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={listHeight}
        snapToAlignment="start"
        decelerationRate="fast"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  reelContainer: {
    width: width,
    backgroundColor: '#1C1C1E',
  },
  videoPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  actionBar: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.xl,
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  actionText: {
    ...typography.labelMd,
    color: 'white',
    marginTop: spacing['2xs'],
    fontWeight: '600',
  },
  infoSection: {
    position: 'absolute',
    left: spacing.md,
    bottom: spacing.xl,
    right: 80, // Leave space for action bar
  },
  author: {
    ...typography.headlineMd,
    color: 'white',
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.bodyMd,
    color: 'white',
    lineHeight: 20,
  },
});
