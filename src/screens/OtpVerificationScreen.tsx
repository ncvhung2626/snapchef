import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/AuthLayout';
import { AuthTextField } from '../components/AuthTextField';
import { PrimaryButton } from '../components/PrimaryButton';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import type { RootStackScreenProps } from '../types/navigation';

export const OtpVerificationScreen = ({ route, navigation }: RootStackScreenProps<'OtpVerification'>) => {
  const { email } = route.params;
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { verifyOtp, isLoading } = useAuth();
  
  const [token, setToken] = useState('');

  const onSubmit = async () => {
    if (!token || token.length < 6) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã xác thực gồm 6 chữ số');
      return;
    }
    try {
      await verifyOtp(email, token);
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (e) {
      Alert.alert('Xác thực thất bại', e instanceof Error ? e.message : 'Có lỗi xảy ra');
    }
  };

  return (
    <AuthLayout
      title="Xác thực Email"
      subtitle={`Mã xác nhận (OTP) đã được gửi đến email ${email}. Vui lòng kiểm tra hộp thư (và thư rác) để hoàn tất đăng ký.`}
      onBack={() => navigation.goBack()}
    >
      <AuthTextField
        label="Mã OTP"
        placeholder="Nhập mã 6 số"
        keyboardType="number-pad"
        value={token}
        onChangeText={setToken}
        maxLength={6}
      />

      <PrimaryButton 
        label="Xác thực" 
        onPress={onSubmit} 
        loading={isLoading} 
        style={{ marginTop: spacing.lg }} 
      />
      
      <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.loginLinkText}>Quay lại Đăng nhập</Text>
      </TouchableOpacity>
    </AuthLayout>
  );
};

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    loginLink: { marginTop: spacing.xl, alignItems: 'center' },
    loginLinkText: {
      ...typography.bodyMd,
      color: colors.primary,
      fontWeight: '700',
    },
  });
}
