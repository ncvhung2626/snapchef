import React, { useState } from 'react';
import { Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import type { RootStackScreenProps } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/AuthLayout';
import { AuthTextField } from '../components/AuthTextField';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';

export const LoginScreen = ({ navigation }: RootStackScreenProps<'Login'>) => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = 'Nhập email';
    if (!password) next.password = 'Nhập mật khẩu';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      await login(email.trim().toLowerCase(), password);
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (e) {
      Alert.alert('Đăng nhập', e instanceof Error ? e.message : 'Có lỗi xảy ra');
    }
  };

  return (
    <AuthLayout
      title="Chào mừng trở lại 👋"
      subtitle="Đăng nhập để tiếp tục khám phá công thức và cộng đồng nấu ăn."
      onBack={() => navigation.goBack()}
      footer={
        <>
          <TouchableOpacity style={styles.registerRow} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerHint}>Chưa có tài khoản? </Text>
            <Text style={styles.registerLink}>Đăng ký ngay</Text>
          </TouchableOpacity>
          <Text style={styles.demoHint}>Dùng Supabase Auth — tạo tài khoản trong app hoặc Supabase Dashboard</Text>
        </>
      }
    >
      <AuthTextField
        label="Email"
        placeholder="email@snapchef.app"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
      />
      <AuthTextField
        label="Mật khẩu"
        placeholder="Nhập mật khẩu"
        isPassword
        value={password}
        onChangeText={setPassword}
        error={errors.password}
      />

      <TouchableOpacity style={styles.forgotBtn}>
        <Text style={styles.forgotText}>Quên mật khẩu?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.submitBtn, isLoading && styles.submitDisabled]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={styles.submitText}>Đăng nhập</Text>
        )}
      </TouchableOpacity>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  forgotBtn: { alignSelf: 'flex-end', marginBottom: spacing.lg, marginTop: -spacing.sm },
  forgotText: { ...typography.bodyMd, color: colors.primary, fontWeight: '600' },
  submitBtn: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  submitDisabled: { opacity: 0.7 },
  submitText: {
    ...typography.bodyLg,
    color: colors.onPrimary,
    fontWeight: '700',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  registerHint: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  registerLink: { ...typography.bodyMd, color: colors.primary, fontWeight: '700' },
  demoHint: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
