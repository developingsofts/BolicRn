import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Button, ProgressBar } from "react-native-paper";

const specialties = [
  "Powerlifting",
  "Bodybuilding",
  "Cardio",
  "Strength Training",
  "CrossFit",
  "Yoga",
];

interface UserProfileFormProps {
  onNext?: (data: { location: string; specialties: string[] }) => void;
  onBack?: () => void;
}

const UserProfileForm: React.FC<UserProfileFormProps> = ({ onNext, onBack }) => {
  const [location, setLocation] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ location?: string; specialties?: string }>({});

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(specialty)
        ? prev.filter((s) => s !== specialty)
        : [...prev, specialty]
    );
  };

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!location.trim()) newErrors.location = "Location is required";
    else if (location.length > 200) newErrors.location = "Location must be less than 200 characters";
    if (selectedSpecialties.length === 0) newErrors.specialties = "Please select at least one specialty";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = () => {
    if (validate()) {
      if (onNext) {
        onNext({ location, specialties: selectedSpecialties });
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tell us about yourself</Text>
        <Text style={styles.step}>Step 3 of 4</Text>
      </View>

      {/* Progress Bar */}
      <ProgressBar progress={0.75} style={styles.progress} color="#6366F1" />

      {/* Form */}
      <View style={styles.form}>
        {/* Location Field */}
        <View style={styles.formItem}>
          <Text style={styles.label}>Your location</Text>
          <TextInput
            style={[styles.input, errors.location && styles.inputError]}
            placeholder="e.g. San Francisco, CA"
            value={location}
            onChangeText={setLocation}
            autoCapitalize="words"
          />
          {errors.location && <Text style={styles.error}>{errors.location}</Text>}
        </View>

        {/* Specialty Selection */}
        <View style={styles.formItem}>
          <Text style={styles.label}>Your Specialty (select at least one)</Text>
          <View style={styles.badgeContainer}>
            {specialties.map((specialty) => {
              const selected = selectedSpecialties.includes(specialty);
              return (
                <TouchableOpacity
                  key={specialty}
                  style={[styles.badge, selected ? styles.badgeSelected : styles.badgeUnselected]}
                  onPress={() => toggleSpecialty(specialty)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.badgeText, selected && styles.badgeTextSelected]}>{specialty}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {errors.specialties && <Text style={styles.error}>{errors.specialties}</Text>}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button mode="outlined" style={styles.actionBtn} onPress={onBack}>
            Back
          </Button>
          <Button mode="contained" style={styles.actionBtn} onPress={onSubmit}>
            Next
          </Button>
        </View>
      </View>

      {/* Sign In Link */}
      <View style={styles.signIn}>
        <Text style={styles.signInText}>
          Already have an account?{' '}
          <TouchableOpacity onPress={() => { /* handle sign in navigation */ }}>
            <Text style={styles.signInButton}>Sign In</Text>
          </TouchableOpacity>
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', maxWidth: 400, alignSelf: 'center', padding: 24, flexGrow: 1, justifyContent: 'center' },
  header: { marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '600', color: '#222' },
  step: { fontSize: 14, color: '#888', marginTop: 4 },
  progress: { height: 8, borderRadius: 4, marginBottom: 24 },
  form: { gap: 16 },
  formItem: { marginBottom: 12 },
  label: { fontSize: 15, fontWeight: '500', color: '#222', marginBottom: 6 },
  input: { backgroundColor: '#f3f4f6', borderColor: '#e5e7eb', borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 15 },
  inputError: { borderColor: '#ef4444' },
  error: { color: '#ef4444', fontSize: 13, marginTop: 2 },
  badgeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  badge: { borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, marginRight: 8, marginBottom: 8, borderWidth: 1 },
  badgeUnselected: { backgroundColor: '#fff', borderColor: '#6366F1' },
  badgeSelected: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  badgeText: { fontSize: 14, color: '#6366F1' },
  badgeTextSelected: { color: '#fff' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  actionBtn: { flex: 1 },
  signIn: { alignItems: 'center', marginTop: 24 },
  signInText: { fontSize: 14, color: '#888' },
  signInButton: { color: '#6366F1', fontWeight: '400', textDecorationLine: 'underline' },
});

export default UserProfileForm;
