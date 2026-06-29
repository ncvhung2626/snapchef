import React, { useRef, useMemo } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';
import { typography } from '../theme/typography';

interface OtpInputProps {
  value: string;
  onChangeText: (val: string) => void;
  length?: number;
}

export const OtpInput = ({ value, onChangeText, length = 6 }: OtpInputProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const inputRef = useRef<TextInput>(null);

  const handlePress = () => {
    inputRef.current?.focus();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={1} onPress={handlePress} style={styles.boxesContainer}>
        {Array.from({ length }).map((_, i) => {
          const char = value[i] || '';
          const isFocused = value.length === i || (value.length === length && i === length - 1);
          return (
            <View key={i} style={[styles.box, isFocused && styles.boxFocused]}>
              <Text style={styles.boxText}>{char}</Text>
            </View>
          );
        })}
      </TouchableOpacity>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(val) => {
          if (val.length <= length) {
            onChangeText(val.replace(/[^0-9]/g, ''));
          }
        }}
        keyboardType="number-pad"
        style={styles.hiddenInput}
        maxLength={length}
        caretHidden
      />
    </View>
  );
};

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { marginVertical: spacing.lg },
    boxesContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.xs },
    box: {
      flex: 1,
      aspectRatio: 0.8,
      backgroundColor: colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    boxFocused: { borderColor: colors.primary, borderWidth: 2 },
    boxText: { ...typography.headlineMd, color: colors.onSurface, fontWeight: '700' },
    hiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  });
}
