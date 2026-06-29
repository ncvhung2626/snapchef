import React, { useState } from 'react';
import { Alert } from 'react-native';
import type { RootStackScreenProps } from '../types/navigation';
import { AuthLayout } from '../components/AuthLayout';
import { AuthTextField } from '../components/AuthTextField';
import { PrimaryButton } from '../components/PrimaryButton';
import * as authService from '../services/authService';
import { validateEmail, hasErrors } from '../utils/validation';

export const ForgotPasswordScreen = ({
  navigation,
}: RootStackScreenProps<'ForgotPassword'>) => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const e = validateEmail(email);
    const next = e ? { email: e } : {};
    setErrors(next);
    if (hasErrors(next)) return;

    setLoading(true);
    try {
      await authService.requestPasswordReset(email);
      navigation.navigate('VerifyPasswordOtp', { email });
    } catch (err) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không gửi được email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Quên mật khẩu?"
      subtitle="Nhập email đã đăng ký — chúng tôi sẽ gửi mã xác nhận (OTP) để đặt lại mật khẩu."
      onBack={() => navigation.navigate('Login')}
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
      <PrimaryButton label="Gửi link đặt lại" onPress={handleSubmit} loading={loading} />
    </AuthLayout>
  );
};
