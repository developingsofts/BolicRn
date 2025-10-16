
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, DIMENSIONS } from '../config/constants';
import FontWeight from '../hooks/useInterFonts';
import TrainerSetupStep1 from '../components/TrainerSetupStep1';
import TrainerSetupStep2 from '../components/TrainerSetupStep2';

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
      {/* Header */}
      <View style={headerStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={headerStyles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={COLORS.white} />
        </TouchableOpacity>
        <View>
          <Text style={headerStyles.headerTitle}>Trainer Setup</Text>
          <Text style={headerStyles.headerSubtitle}>Manage your sessions and charges</Text>
        </View>
      </View>

      {/* Progress Indicator */}
      <View style={headerStyles.progressSection}>
        <Text style={headerStyles.progressStep}>Step {step} of 2</Text>
        <View style={headerStyles.progressBarBg}>
          <View style={[headerStyles.progressBarFill, { width: step === 1 ? '50%' : '100%' }]} />
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

const headerStyles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: DIMENSIONS.spacing.xxl,
    paddingBottom: 18,
    gap: 10,
  },
  backBtn: {
    marginRight: 8,
    padding: 4,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontFamily: FontWeight.Bold,
    marginBottom: 2,
  },
  headerSubtitle: {
    color: COLORS.white,
    fontSize: 14,
    opacity: 0.8,
    marginLeft: 8,
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
