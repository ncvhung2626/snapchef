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

export const RegisterScreen = ({ navigation }: RootStackScreenProps<'Register'>) => {
  const { register, isLoading } = useAuth();
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};
    if (!fullname.trim()) next.fullname = 'Nhập họ tên';
    if (!email.trim()) next.email = 'Nhập email';
    else if (!/\S+@\S+\.\S+/.test(email)) next.email = 'Email không hợp lệ';
    if (password.length < 6) next.password = 'Mật khẩu tối thiểu 6 ký tự';
    if (password !== confirm) next.confirm = 'Mật khẩu không khớp';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    try {
      await register(fullname.trim(), email.trim().toLowerCase(), password);
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (e) {
      Alert.alert('Đăng ký', e instanceof Error ? e.message : 'Có lỗi xảy ra');
    }
  };

  return (
    <AuthLayout
      title="Tạo tài khoản"
      subtitle="Tham gia cộng đồng SnapChef — chia sẻ công thức và kết nối đầu bếp."
      onBack={() => navigation.goBack()}
      footer={
        <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLinkText}>Đã có tài khoản? Đăng nhập</Text>
        </TouchableOpacity>
      }
    >
      <AuthTextField
        label="Họ và tên"
        placeholder="Nguyễn Văn A"
        value={fullname}
        onChangeText={setFullname}
        error={errors.fullname}
      />
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
        placeholder="Tối thiểu 6 ký tự"
        isPassword
        value={password}
        onChangeText={setPassword}
        error={errors.password}
      />
      <AuthTextField
        label="Xác nhận mật khẩu"
        placeholder="Nhập lại mật khẩu"
        isPassword
        value={confirm}
        onChangeText={setConfirm}
        error={errors.confirm}
      />

      <TouchableOpacity
        style={[styles.submitBtn, isLoading && styles.submitDisabled]}
        onPress={handleRegister}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={styles.submitText}>Đăng ký</Text>
        )}
      </TouchableOpacity>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  submitBtn: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    ...shadows.card,
  },
  submitDisabled: { opacity: 0.7 },
  submitText: {
    ...typography.bodyLg,
    color: colors.onPrimary,
    fontWeight: '700',
  },
  loginLink: { marginTop: spacing.xl, alignItems: 'center' },
  loginLinkText: {
    ...typography.bodyMd,
    color: colors.primary,
    fontWeight: '700',
  },
});
