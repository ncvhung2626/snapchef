import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export const PlaceholderScreen = ({ route }: any) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Màn hình {route.name}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
});
