import React, { useState } from 'react';
import { Alert } from 'react-native';
import type { RootStackScreenProps } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/AuthLayout';
import { AuthTextField } from '../components/AuthTextField';
import { PrimaryButton } from '../components/PrimaryButton';

export const CreateNewPasswordScreen = ({
  route,
  navigation,
}: RootStackScreenProps<'CreateNewPassword'>) => {
  const { email, token } = route.params;
  const { resetPassword } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (password.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email, token, password);
      // Wait, since AuthContext's resetPassword sets user,
      // it will automatically navigate to MainTabs.
      Alert.alert('Thành công', 'Mật khẩu của bạn đã được đặt lại thành công!', [
        { text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] }) }
      ]);
    } catch (e) {
      Alert.alert('Lỗi khôi phục', e instanceof Error ? e.message : 'Mã OTP không hợp lệ hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Tạo mật khẩu mới"
      subtitle="Vui lòng nhập mật khẩu mới cho tài khoản của bạn."
      onBack={() => navigation.navigate('Login')}
    >
      <AuthTextField
        label="Mật khẩu mới"
        placeholder="Nhập ít nhất 6 ký tự"
        isPassword={true}
        value={password}
        onChangeText={setPassword}
      />
      
      <AuthTextField
        label="Xác nhận mật khẩu"
        placeholder="Nhập lại mật khẩu mới"
        isPassword={true}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <PrimaryButton 
        label="Đổi mật khẩu" 
        onPress={handleSubmit} 
        loading={loading}
        style={{ marginTop: 8 }} 
      />
    </AuthLayout>
  );
};
