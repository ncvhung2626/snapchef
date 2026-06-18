import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

export interface MenuItem {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  onPress: () => void;
}

interface AppMenuModalProps {
  visible: boolean;
  onClose: () => void;
  items: MenuItem[];
}

export const AppMenuModal = ({ visible, onClose, items }: AppMenuModalProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Menu</Text>
          {items.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.row}
              onPress={() => {
                onClose();
                item.onPress();
              }}
            >
              <Feather name={item.icon} size={22} color={colors.primary} />
              <Text style={styles.rowText}>{item.label}</Text>
              <Feather name="chevron-right" size={18} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
};

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-start',
      paddingTop: 80,
      paddingHorizontal: spacing.lg,
    },
    panel: {
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      padding: spacing.lg,
    },
    panelTitle: {
      ...typography.headlineMd,
      color: colors.onSurface,
      marginBottom: spacing.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      gap: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceVariant,
    },
    rowText: { flex: 1, ...typography.bodyLg, color: colors.onSurface },
  });
}
