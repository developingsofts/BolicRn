import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { COLORS, DIMENSIONS } from '../config/constants';
import STRINGS from '../config/strings';
import { AppLogo } from '../../assets';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Loading...' }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image source={AppLogo} style={styles.logo} resizeMode="contain" />
        <Text style={styles.brandTagline}>Find your perfect training partner</Text>
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.spinner} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.spacing.lg,
  },
  logo: {
    width: 160,
    height: 80,
    marginBottom: DIMENSIONS.spacing.md,
  },
  brandTagline: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: DIMENSIONS.spacing.xl,
  },
  spinner: {
    marginBottom: DIMENSIONS.spacing.lg,
  },
  message: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default LoadingScreen;

