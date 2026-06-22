import React, { useMemo } from 'react';
import { Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { RootStackScreenProps } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/AuthLayout';
import { AuthTextField } from '../components/AuthTextField';
import { PrimaryButton } from '../components/PrimaryButton';
import { registerSchema, type RegisterInput } from '../validation/schemas/auth.schema';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export const RegisterScreen = ({ navigation }: RootStackScreenProps<'Register'>) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { register: registerUser, isLoading } = useAuth();
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullname: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const acceptTerms = watch('acceptTerms');

  const onSubmit = async (values: RegisterInput) => {
    try {
      const email = values.email.trim().toLowerCase();
      const result = await registerUser(values.fullname.trim(), email, values.password);
      if (result.requiresOtp) {
        navigation.navigate('OtpVerification', { email });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      }
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
      <Controller
        control={control}
        name="fullname"
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthTextField
            label="Họ và tên"
            placeholder="Nguyễn Văn A"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.fullname?.message}
          />
        )}
      />
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
            placeholder="Chữ + số, tối thiểu 8 ký tự"
            isPassword
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.password?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthTextField
            label="Xác nhận mật khẩu"
            placeholder="Nhập lại mật khẩu"
            isPassword
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.confirmPassword?.message}
          />
        )}
      />

      <TouchableOpacity
        style={styles.termsRow}
        onPress={() => setValue('acceptTerms', !acceptTerms, { shouldValidate: true })}
        activeOpacity={0.8}
      >
        <Feather
          name={acceptTerms ? 'check-square' : 'square'}
          size={22}
          color={acceptTerms ? colors.primary : colors.onSurfaceVariant}
        />
        <Text style={styles.termsText}>Tôi đồng ý điều khoản & chính sách SnapChef</Text>
      </TouchableOpacity>
      {errors.acceptTerms?.message ? (
        <Text style={styles.termsErr}>{errors.acceptTerms.message}</Text>
      ) : null}

      <PrimaryButton label="Đăng ký" onPress={handleSubmit(onSubmit)} loading={isLoading} />
    </AuthLayout>
  );
};

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    termsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    termsText: { ...typography.bodyMd, color: colors.onSurfaceVariant, flex: 1 },
    termsErr: { ...typography.bodyMd, color: colors.error, marginBottom: spacing.sm },
    loginLink: { marginTop: spacing.xl, alignItems: 'center' },
    loginLinkText: {
      ...typography.bodyMd,
      color: colors.primary,
      fontWeight: '700',
    },
  });
}
