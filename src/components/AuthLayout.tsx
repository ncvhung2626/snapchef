import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onBack?: () => void;
  footer?: React.ReactNode;
}

export const AuthLayout = ({ title, subtitle, children, onBack, footer }: AuthLayoutProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {onBack && (
            <TouchableOpacity style={styles.backBtn} onPress={onBack}>
              <Feather name="arrow-left" size={24} color={colors.onSurface} />
            </TouchableOpacity>
          )}

          <View style={styles.brandRow}>
            <View style={styles.logoSmall}>
              <Feather name="coffee" size={22} color={colors.onPrimary} />
            </View>
            <Text style={styles.brand}>SnapChef</Text>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <View style={styles.card}>{children}</View>

          {footer}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing['2xl'],
      paddingTop: spacing.md,
    },
    backBtn: {
      alignSelf: 'flex-start',
      padding: spacing.xs,
      marginBottom: spacing.md,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      marginBottom: spacing.xl,
    },
    logoSmall: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    brand: {
      ...typography.headlineLg,
      color: colors.primary,
      fontWeight: '700',
    },
    title: {
      ...typography.headlineXl,
      color: colors.onSurface,
      marginBottom: spacing.xs,
    },
    subtitle: {
      ...typography.bodyLg,
      color: colors.onSurfaceVariant,
      marginBottom: spacing.xl,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
  });
}
