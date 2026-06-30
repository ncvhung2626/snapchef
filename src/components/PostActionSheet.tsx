import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

interface PostActionSheetProps {
  visible: boolean;
  onClose: () => void;
  isOwner: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onReport: () => void;
}

export const PostActionSheet = ({
  visible,
  onClose,
  isOwner,
  onDelete,
  onEdit,
  onReport,
}: PostActionSheetProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.sheet}>
          <View style={styles.dragIndicator} />
          
          {isOwner ? (
            <>
              <TouchableOpacity style={styles.option} onPress={() => { onClose(); onEdit(); }}>
                <Feather name="edit-2" size={24} color={colors.onSurface} />
                <Text style={styles.optionTitle}>Chỉnh sửa bài viết</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.option} onPress={() => { onClose(); onDelete(); }}>
                <Feather name="trash-2" size={24} color={colors.error} />
                <Text style={[styles.optionTitle, { color: colors.error }]}>Chuyển vào thùng rác (Xóa)</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.option} onPress={() => { onClose(); onReport(); }}>
              <Feather name="alert-triangle" size={24} color={colors.error} />
              <Text style={[styles.optionTitle, { color: colors.error }]}>Báo cáo bài viết</Text>
            </TouchableOpacity>
          )}
        </View>
      </Pressable>
    </Modal>
  );
};

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: spacing.lg,
      paddingBottom: spacing['3xl'],
    },
    dragIndicator: {
      width: 40,
      height: 4,
      backgroundColor: colors.surfaceVariant,
      borderRadius: radius.full,
      alignSelf: 'center',
      marginBottom: spacing.md,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
    },
    optionTitle: { ...typography.bodyLg, color: colors.onSurface },
  });
}
