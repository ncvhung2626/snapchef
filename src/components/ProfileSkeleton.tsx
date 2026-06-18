import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';

function Block({
  width,
  height,
  style,
  colors,
}: {
  width: number | `${number}%`;
  height: number;
  style?: object;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View
      style={[
        { width, height, backgroundColor: colors.surfaceContainerHigh, borderRadius: radius.sm, opacity: 0.7 },
        style,
      ]}
    />
  );
}

export function ProfileSkeleton() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.root}>
      <Block width="100%" height={160} colors={colors} style={{ borderRadius: 0 }} />
      <View style={styles.header}>
        <Block width={96} height={96} colors={colors} style={styles.avatar} />
        <Block width={180} height={20} colors={colors} style={{ marginTop: spacing.md }} />
        <Block width={120} height={14} colors={colors} style={{ marginTop: spacing.sm }} />
        <Block width="80%" height={14} colors={colors} style={{ marginTop: spacing.md }} />
        <Block width={80} height={24} colors={colors} style={{ marginTop: spacing.sm, borderRadius: radius.full }} />
      </View>
      <View style={styles.statsRow}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={styles.stat}>
            <Block width={32} height={18} colors={colors} />
            <Block width={48} height={10} colors={colors} style={{ marginTop: 6 }} />
          </View>
        ))}
      </View>
      <View style={styles.actions}>
        <Block width="48%" height={40} colors={colors} style={{ borderRadius: radius.lg }} />
        <Block width="48%" height={40} colors={colors} style={{ borderRadius: radius.lg }} />
      </View>
      <View style={styles.tabs}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Block key={i} width={72} height={16} colors={colors} style={{ marginRight: spacing.lg }} />
        ))}
      </View>
      <Block width="100%" height={120} colors={colors} style={{ marginTop: spacing.lg, borderRadius: radius.xl }} />
      <Block width="100%" height={120} colors={colors} style={{ marginTop: spacing.md, borderRadius: radius.xl }} />
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: { alignItems: 'center', marginTop: -48, paddingHorizontal: spacing.lg },
    avatar: { borderRadius: 48, borderWidth: 4, borderColor: colors.surface },
    statsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-around',
      paddingHorizontal: spacing.md,
      marginTop: spacing.lg,
    },
    stat: { alignItems: 'center', width: '30%', marginBottom: spacing.md },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      marginTop: spacing.sm,
    },
    tabs: {
      flexDirection: 'row',
      paddingHorizontal: spacing.lg,
      marginTop: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.outlineVariant,
      paddingBottom: spacing.md,
    },
  });
}
