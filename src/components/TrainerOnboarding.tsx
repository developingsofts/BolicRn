import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../config/constants';
import FontWeight from '../hooks/useInterFonts';

interface TrainerOnboardingProps {
  onGetStarted: () => void;
}

const TrainerOnboarding: React.FC<TrainerOnboardingProps> = ({ onGetStarted }) => {
  return (
    <View style={styles.card}>
      <View style={styles.textSection}>
        <Text style={styles.title}>Let's set up your Trainer profile!</Text>
        <Text style={styles.subtitle}>
          Define your session packages, set your weekly availability, and start connecting with clients.
        </Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={onGetStarted}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '90%',
    maxWidth: 400,
    marginTop: -40,
    zIndex: 1,
    alignSelf: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 25,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    marginVertical: 32,
  },
  textSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.app_black,
    marginBottom: 8,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS._5E5E5E,
    fontFamily: FontWeight.Medium,
    lineHeight: 22,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 5,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 5,
  },
  buttonText: {
    color: COLORS.black,
    fontSize: 14,
    fontFamily: FontWeight.Medium,
  },
});

export default TrainerOnboarding;
