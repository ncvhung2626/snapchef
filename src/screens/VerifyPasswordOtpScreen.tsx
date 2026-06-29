import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { RootStackScreenProps } from '../types/navigation';
import { AuthLayout } from '../components/AuthLayout';
import { PrimaryButton } from '../components/PrimaryButton';
import { OtpInput } from '../components/OtpInput';

export const VerifyPasswordOtpScreen = ({
  route,
  navigation,
}: RootStackScreenProps<'VerifyPasswordOtp'>) => {
  const { email } = route.params;
  const [token, setToken] = useState('');

  const handleNext = () => {
    if (token.length < 8) return;
    // Just navigate to the next screen passing the token
    navigation.navigate('CreateNewPassword', { email, token });
  };

  return (
    <AuthLayout
      title="Nhập mã OTP"
      subtitle={`Mã xác nhận gồm 8 số đã được gửi đến email ${email}. Vui lòng kiểm tra hộp thư của bạn.`}
      onBack={() => navigation.navigate('Login')}
    >
      <OtpInput value={token} onChangeText={setToken} length={8} />

      <PrimaryButton 
        label="Tiếp tục" 
        onPress={handleNext} 
        disabled={token.length < 8} 
        style={{ marginTop: 24 }} 
      />
    </AuthLayout>
  );
};
