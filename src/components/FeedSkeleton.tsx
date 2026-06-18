import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';

function SkeletonBlock({
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
  return <View style={[styles.block, { width, height, backgroundColor: colors.surfaceContainerHigh }, style]} />;
}

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  const { colors } = useTheme();
  const sheet = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={sheet.container}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={sheet.card}>
          <View style={sheet.header}>
            <SkeletonBlock width={44} height={44} colors={colors} style={sheet.avatar} />
            <View style={sheet.headerText}>
              <SkeletonBlock width={120} height={14} colors={colors} />
              <SkeletonBlock width={80} height={12} colors={colors} style={{ marginTop: 6 }} />
            </View>
          </View>
          <SkeletonBlock width="100%" height={14} colors={colors} style={{ marginTop: spacing.md }} />
          <SkeletonBlock width="80%" height={14} colors={colors} style={{ marginTop: 8 }} />
          <SkeletonBlock width="100%" height={180} colors={colors} style={{ marginTop: spacing.md, borderRadius: radius.lg }} />
        </View>
      ))}
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { paddingHorizontal: spacing.lg },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    header: { flexDirection: 'row', alignItems: 'center' },
    avatar: { borderRadius: 22 },
    headerText: { marginLeft: spacing.sm, flex: 1 },
  });
}

const styles = StyleSheet.create({
  block: {
    borderRadius: radius.sm,
    opacity: 0.7,
  },
});

export function ReelSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.reelsBackground }}>
      <View style={{ flex: 1, backgroundColor: colors.surfaceContainerHigh }} />
    </View>
  );
}
