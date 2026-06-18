import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { lightColors } from '../theme/palettes';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Feather name="alert-triangle" size={48} color={lightColors.error} />
          <Text style={styles.title}>Đã xảy ra lỗi</Text>
          <Text style={styles.message}>Vui lòng thử lại hoặc khởi động lại ứng dụng.</Text>
          <TouchableOpacity style={styles.btn} onPress={() => this.setState({ hasError: false })}>
            <Text style={styles.btnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: lightColors.background,
  },
  title: { ...typography.headlineMd, color: lightColors.onSurface, marginTop: spacing.md },
  message: {
    ...typography.bodyMd,
    color: lightColors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  btn: {
    marginTop: spacing.lg,
    backgroundColor: lightColors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: 24,
  },
  btnText: { ...typography.labelMd, color: lightColors.onPrimary, fontWeight: '700' },
});
