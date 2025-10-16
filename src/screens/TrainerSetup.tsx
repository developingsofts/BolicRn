
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, DIMENSIONS } from '../config/constants';
import FontWeight from '../hooks/useInterFonts';
import TrainerSetupStep1 from '../components/TrainerSetupStep1';
import TrainerSetupStep2 from '../components/TrainerSetupStep2';
import BasicTopBar from '../components/BasicTopBar';

const TrainerSetup: React.FC = ({ navigation }: any) => {
  const [step, setStep] = useState(1);

  // Handlers for step navigation
  const handleNext = () => setStep(2);
  const handleSaveDraft = () => alert('Draft saved. Your availability has been saved as draft.');
  const handleConfirm = () => {
    alert('Profile is live! Your trainer profile is now active.');
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <BasicTopBar
        onBackPress={() => navigation.goBack()}
        title="Trainer Setup"
        subtitle="Manage your sessions and charges"
        containerStyle={{ paddingTop: DIMENSIONS.spacing.xxl, paddingBottom: DIMENSIONS.spacing.lg }}
      />

      {/* Progress Indicator */}
      <View style={styles.progressSection}>
        <Text style={styles.progressStep}>Step {step} of 2</Text>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: step === 1 ? '50%' : '100%' }]} />
        </View>
      </View>

      {/* Step Content */}
      {step === 1 ? (
        <TrainerSetupStep1 onNext={handleNext} />
      ) : (
        <TrainerSetupStep2 onSaveDraft={handleSaveDraft} onConfirm={handleConfirm} />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  profileHeader: {
    backgroundColor: COLORS.gradient3,
    paddingBottom: 40,
    paddingTop: DIMENSIONS.spacing.xl,
    alignItems: "center",
    position: "relative",
    zIndex: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
    paddingTop: 10,
    marginBottom: 16,
  },
  headerIconBtn: {},
  headerTitle: {
    fontFamily: FontWeight.SemiBold,
    fontSize: 24,
    fontWeight: "600",
    color: COLORS.white,
    textAlign: 'center',
    flex: 1,
  },
  headerSubtitle: {
    color: COLORS.white,
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  progressSection: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  progressStep: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: COLORS._E2E2E2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
});

export default TrainerSetup;
