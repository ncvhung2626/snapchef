import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

interface CreateActionSheetProps {
  visible: boolean;
  onClose: () => void;
  onQuickPost: () => void;
  onRecipe: () => void;
  onReel?: () => void;
}

export const CreateActionSheet = ({
  visible,
  onClose,
  onQuickPost,
  onRecipe,
  onReel,
}: CreateActionSheetProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Tạo nội dung</Text>
          {onReel && (
            <TouchableOpacity style={styles.option} onPress={() => { onClose(); onReel(); }}>
              <Feather name="film" size={24} color={colors.primary} />
              <View>
                <Text style={styles.optionTitle}>Reels</Text>
                <Text style={styles.optionDesc}>Video ngắn về món ăn</Text>
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.option} onPress={() => { onClose(); onRecipe(); }}>
            <Feather name="book-open" size={24} color={colors.primary} />
            <View>
              <Text style={styles.optionTitle}>Công thức đầy đủ</Text>
              <Text style={styles.optionDesc}>Nguyên liệu, các bước, ảnh món</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.option} onPress={() => { onClose(); onQuickPost(); }}>
            <Feather name="edit-3" size={24} color={colors.primary} />
            <View>
              <Text style={styles.optionTitle}>Đăng bài nhanh</Text>
              <Text style={styles.optionDesc}>Chia sẻ khoảnh khắc nấu ăn</Text>
            </View>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: spacing.lg,
      paddingBottom: spacing['2xl'],
    },
    title: { ...typography.headlineMd, color: colors.onSurface, marginBottom: spacing.lg },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceVariant,
    },
    optionTitle: { ...typography.bodyLg, fontWeight: '600', color: colors.onSurface },
    optionDesc: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  });
}
