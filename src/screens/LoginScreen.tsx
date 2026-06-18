import React, { useMemo } from 'react';
import { Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { RootStackScreenProps } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/AuthLayout';
import { AuthTextField } from '../components/AuthTextField';
import { PrimaryButton } from '../components/PrimaryButton';
import { loginSchema, type LoginInput } from '../validation/schemas/auth.schema';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export const LoginScreen = ({ navigation }: RootStackScreenProps<'Login'>) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { login, loginWithGoogle, isLoading, isSupabaseReady } = useAuth();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginInput) => {
    try {
      await login(values.email.trim().toLowerCase(), values.password);
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (e) {
      Alert.alert('Đăng nhập', e instanceof Error ? e.message : 'Có lỗi xảy ra');
    }
  };

  const onGoogle = async () => {
    if (!isSupabaseReady) {
      Alert.alert('Google', 'Chưa cấu hình Supabase');
      return;
    }
    try {
      const ok = await loginWithGoogle();
      if (ok) navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (e) {
      Alert.alert('Google', e instanceof Error ? e.message : 'Lỗi đăng nhập Google');
    }
  };

  return (
    <AuthLayout
      title="Chào mừng trở lại 👋"
      subtitle="Đăng nhập để khám phá công thức và cộng đồng nấu ăn."
      onBack={() => navigation.goBack()}
      footer={
        <>
          <TouchableOpacity style={styles.registerRow} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerHint}>Chưa có tài khoản? </Text>
            <Text style={styles.registerLink}>Đăng ký ngay</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.googleBtn} onPress={onGoogle} disabled={isLoading}>
            <Text style={styles.googleText}>Đăng nhập với Google</Text>
          </TouchableOpacity>
        </>
      }
    >
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthTextField
            label="Email"
            placeholder="email@snapchef.app"
            keyboardType="email-address"
            autoCapitalize="none"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthTextField
            label="Mật khẩu"
            placeholder="Nhập mật khẩu"
            isPassword
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.password?.message}
          />
        )}
      />

      <TouchableOpacity
        style={styles.forgotBtn}
        onPress={() => navigation.navigate('ForgotPassword')}
      >
        <Text style={styles.forgotText}>Quên mật khẩu?</Text>
      </TouchableOpacity>

      <PrimaryButton label="Đăng nhập" onPress={handleSubmit(onSubmit)} loading={isLoading} />
    </AuthLayout>
  );
};

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    forgotBtn: { alignSelf: 'flex-end', marginBottom: spacing.lg, marginTop: -spacing.sm },
    forgotText: { ...typography.bodyMd, color: colors.primary, fontWeight: '600' },
    registerRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: spacing.xl,
    },
    registerHint: { ...typography.bodyMd, color: colors.onSurfaceVariant },
    registerLink: { ...typography.bodyMd, color: colors.primary, fontWeight: '700' },
    googleBtn: {
      marginTop: spacing.md,
      paddingVertical: spacing.md,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      alignItems: 'center',
    },
    googleText: { ...typography.bodyMd, color: colors.onSurface },
  });
}
