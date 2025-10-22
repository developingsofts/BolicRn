import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Button } from "react-native-paper";
import OnboardingStepHeader from "./OnboardingStepHeader";

type Role = "user" | "trainer" | null;

interface RoleSelectionProps {
  onNext?: (role: Role) => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ onNext }) => {
  const [selectedRole, setSelectedRole] = useState<Role>(null);

  const handleContinue = () => {
    if (selectedRole && onNext) {
      onNext(selectedRole);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header & Progress */}
      <OnboardingStepHeader title="Join as a..." stepText="Step 1 of 4" progress={0.25} />

      {/* Role Selection Cards */}
      <View style={styles.cards}>
        {/* User Card */}
        <TouchableOpacity
          style={[
            styles.card,
            selectedRole === "user" && styles.cardSelected,
          ]}
          onPress={() => setSelectedRole("user")}
          activeOpacity={0.8}
        >
          <View style={styles.iconCircle}>
            <MaterialIcons name="person" size={28} color="#fff" />
          </View>
          <Text style={styles.cardTitle}>User</Text>
          <Text style={styles.cardDesc}>
            Find partners, join groups, and track progress.
          </Text>
        </TouchableOpacity>

        {/* Trainer Card */}
        <TouchableOpacity
          style={[
            styles.card,
            selectedRole === "trainer" && styles.cardSelected,
          ]}
          onPress={() => setSelectedRole("trainer")}
          activeOpacity={0.8}
        >
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="account-group" size={28} color="#fff" />
          </View>
          <Text style={styles.cardTitle}>Trainer</Text>
          <Text style={styles.cardDesc}>
            Manage clients, schedule sessions, and grow your business.
          </Text>
        </TouchableOpacity>
      </View>

      <Button
        mode="contained"
        style={{ marginTop: 24 }}
        onPress={handleContinue}
        disabled={!selectedRole}
      >
        Continue
      </Button>

      {/* Sign In Link */}
      <View style={styles.signIn}>
        <Text style={styles.signInText}>
          Already have an account?{" "}
          <Button
            mode="text"
            compact
            onPress={() => {/* handle sign in navigation */}}
            labelStyle={styles.signInButton}
          >
            Sign In
          </Button>
        </Text>
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: { width: "100%", maxWidth: 400, alignSelf: "center", padding: 24, flex: 1, justifyContent: "center" },
  // header, title, step, progress styles are now in OnboardingStepHeader
  cards: { gap: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 8,
    elevation: 2,
  },
  cardSelected: {
    borderColor: "#6366F1",
    shadowColor: "#6366F1",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  cardTitle: { fontSize: 18, fontWeight: "600", color: "#222" },
  cardDesc: { fontSize: 14, color: "#888", textAlign: "center", marginTop: 4 },
  signIn: { alignItems: "center", marginTop: 24 },
  signInText: { fontSize: 14, color: "#888" },
  signInButton: { color: "#6366F1", fontWeight: "400", textDecorationLine: "underline" },
});

export default RoleSelection;
