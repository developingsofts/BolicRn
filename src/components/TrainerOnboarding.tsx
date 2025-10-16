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
    padding: 32,
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
    fontSize: 22,
    fontFamily: FontWeight.Bold,
    color: COLORS.text,
    marginBottom: 8,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: FontWeight.Medium,
    fontWeight: '500',
  },
});

export default TrainerOnboarding;
