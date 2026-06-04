import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, TextInputProps } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

interface AuthTextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  isPassword?: boolean;
}

export const AuthTextField = ({
  label,
  error,
  isPassword,
  style,
  ...rest
}: AuthTextFieldProps) => {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, error ? styles.inputError : null]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.onSurfaceVariant}
          secureTextEntry={isPassword && !visible}
          {...rest}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setVisible((v) => !v)} style={styles.eyeBtn}>
            <Feather name={visible ? 'eye-off' : 'eye'} size={20} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  label: {
    ...typography.labelMd,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  inputError: { borderColor: colors.error },
  input: {
    flex: 1,
    ...typography.bodyLg,
    color: colors.onSurface,
  },
  eyeBtn: { padding: spacing.xs },
  errorText: {
    ...typography.bodyMd,
    color: colors.error,
    marginTop: spacing['2xs'],
  },
});
