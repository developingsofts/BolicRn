import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, DIMENSIONS } from '../config/constants';
import FontWeight from '../hooks/useInterFonts';
import { Ionicons } from '@expo/vector-icons';

interface TrainerSetupStep1Props {
  onNext: () => void;
}

const TrainerSetupStep1: React.FC<TrainerSetupStep1Props> = ({ onNext }) => {
  const handleAddSession = () => {
    alert('Add session feature coming soon');
  };

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <TouchableOpacity style={styles.addSessionBtn} onPress={handleAddSession}>
        <Ionicons name="add" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
        <Text style={styles.addSessionText}>Add New Session</Text>
      </TouchableOpacity>
      <View style={{ marginBottom: 16 }}>
        <Text style={styles.sectionTitle}>Set Your Rates</Text>
        <Text style={styles.sectionDesc}>
          Create packages for clients to book. You can add more later.
        </Text>
      </View>
      <View style={styles.sessionCard}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Session name</Text>
          <View style={styles.inputField}><Text style={styles.inputText}>Single Session</Text></View>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <View style={[styles.inputField, { height: 48 }]}><Text style={styles.inputText}>One-on-one personalized training session.</Text></View>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Price per hour</Text>
          <View style={styles.inputField}><Text style={styles.inputText}>$75/hr</Text></View>
        </View>
      </View>
      <View style={styles.sessionCard}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Session name</Text>
          <View style={styles.inputField}><Text style={styles.inputText}>5-Session Pack</Text></View>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <View style={[styles.inputField, { height: 48 }]}><Text style={styles.inputText}>Save 10% with a bundle of 5 sessions.</Text></View>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Price per hour</Text>
          <View style={styles.inputField}><Text style={styles.inputText}>$67.5/hr</Text></View>
        </View>
      </View>
      <TouchableOpacity style={styles.nextBtn} onPress={onNext}>
        <Text style={styles.nextBtnText}>Next</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: 16,
  },
  addSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 0,
    marginBottom: 24,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
  },
  addSessionText: {
    color: COLORS.primary,
    fontSize: 16,
    fontFamily: FontWeight.Medium,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
    marginBottom: 2,
  },
  sectionDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  sessionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  inputField: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 36,
    justifyContent: 'center',
  },
  inputText: {
    fontSize: 15,
    color: COLORS.text,
    fontFamily: FontWeight.Medium,
  },
  nextBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  nextBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: FontWeight.Medium,
  },
});

export default TrainerSetupStep1;
