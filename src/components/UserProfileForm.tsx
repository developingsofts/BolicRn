import React, { useState, useImperativeHandle } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Button, ProgressBar } from "react-native-paper";
import { COLORS } from "../config/constants";

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

const UserProfileForm = React.forwardRef<
  {
    submit: () => void;
  },
  UserProfileFormProps
>(({ onNext, onBack }, ref) => {
  const [location, setLocation] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [errors, setErrors] = useState<{
    location?: string;
    specialties?: string;
  }>({});

  useImperativeHandle(ref, () => ({
    submit: onSubmit,
  }));

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
    else if (location.length > 200)
      newErrors.location = "Location must be less than 200 characters";
    if (selectedSpecialties.length === 0)
      newErrors.specialties = "Please select at least one specialty";
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
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
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
          {errors.location && (
            <Text style={styles.error}>{errors.location}</Text>
          )}
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
                  style={[
                    styles.badge,
                    selected ? styles.badgeSelected : styles.badgeUnselected,
                  ]}
                  onPress={() => toggleSpecialty(specialty)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      selected && styles.badgeTextSelected,
                    ]}
                  >
                    {specialty}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {errors.specialties && (
            <Text style={styles.error}>{errors.specialties}</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
});

UserProfileForm.displayName = "UserProfileForm";

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignSelf: "center",
    padding: 20,
    flexGrow: 1,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: "center",
  },
  header: { marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "600", color: "#222" },
  step: { fontSize: 14, color: "#888", marginTop: 4 },
  progress: { height: 8, borderRadius: 4, marginBottom: 24 },
  form: { gap: 16 },
  formItem: { marginBottom: 12 },
  label: { fontSize: 15, fontWeight: "500", color: "#222", marginBottom: 6 },
  input: {
    backgroundColor: "#f3f4f6",
    borderColor: "#e5e7eb",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  inputError: {
    borderColor: "#ef4444",
  },
  error: {
    color: "#ef4444",
    fontSize: 13,
    marginTop: 2,
  },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  badge: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  badgeUnselected: {
    backgroundColor: "#F2F2F7",
  },
  badgeSelected: {
    backgroundColor: "#6366F1",
  },
  badgeTextSelected: {
    fontSize: 14,
    color: COLORS.white,  
  },
  badgeText: {
    fontSize: 14,
    color: COLORS?._5E5E5E,
  },
});

export default UserProfileForm;
