import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS, DIMENSIONS } from '../config/constants';
import FontWeight from '../hooks/useInterFonts';
import { Ionicons } from '@expo/vector-icons';

interface TrainerSetupStep1Props {
  onNext: () => void;
}

const TrainerSetupStep1: React.FC<TrainerSetupStep1Props> = ({ onNext }) => {
  const [sessions, setSessions] = useState([
    {
      id: '1',
      name: 'Single Session',
      description: 'One-on-one personalized training session.',
      price: '$75/hr',
    },
    {
      id: '2',
      name: '5-Session Pack',
      description: 'Save 10% with a bundle of 5 sessions.',
      price: '$67.5/hr',
    },
  ]);

  const handleAddSession = () => {
    const newSession = {
      id: Date.now().toString(),
      name: '',
      description: '',
      price: '',
    };
    setSessions([...sessions, newSession]);
  };

  const updateSession = (id: string, field: string, value: string) => {
    setSessions(sessions.map(session => 
      session.id === id ? { ...session, [field]: value } : session
    ));
  };

  const removeSession = (id: string) => {
    if (sessions.length > 1) {
      setSessions(sessions.filter(session => session.id !== id));
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.addSessionBtn} onPress={handleAddSession}>
          <Text style={styles.addSessionText}>Add New Session</Text>
          <Ionicons name="add" size={20} color={"#383838"} style={{ marginRight: 8 }} />
        </TouchableOpacity>
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.sectionTitle}>Set Your Rates</Text>
          <Text style={styles.sectionDesc}>
            Create packages for clients to book. You can add more later.
          </Text>
        </View>
        {sessions.map((session, index) => (
          <View key={session.id} style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <Text style={styles.sessionTitle}>Session {index + 1}</Text>
              {sessions.length > 1 && (
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeSession(session.id)}
                >
                  <Text style={styles.removeBtnText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Session name</Text>
              <TextInput
                style={styles.inputField}
                value={session.name}
                onChangeText={text => updateSession(session.id, 'name', text)}
                placeholder="Session name"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.inputField, { height: 48 }]}
                value={session.description}
                onChangeText={text => updateSession(session.id, 'description', text)}
                placeholder="Description"
                placeholderTextColor={COLORS.textSecondary}
                multiline
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Price per hour</Text>
              <TextInput
                style={styles.inputField}
                value={session.price}
                onChangeText={text => updateSession(session.id, 'price', text)}
                placeholder="$ per hour"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
              />
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.nextBtn} onPress={onNext}>
          <Text style={styles.nextBtnText}>Next</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
    borderRadius: 4,
    paddingVertical: 14,
    paddingHorizontal: 0,
    boxShadow: '0px 0px 12px 0px #76767626',
    marginBottom: 24,
    gap: 8,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
  },
  addSessionText: {
    color: "#383838",
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
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sessionTitle: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
  },
  removeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
  },
  removeBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: FontWeight.Medium,
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
