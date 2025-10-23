import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Button } from "react-native-paper";
import OnboardingStepHeader from "./OnboardingStepHeader";
import { Trainer, User3 } from "../../assets";
import { COLORS } from "../config/constants";

type Role = "user" | "trainer" | null;

interface RoleSelectionProps {
  onNext?: (role: Role) => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ onNext }) => {
  const renderCard = ({
    icon,
    name,
    desc,
  }: {
    icon: React.ReactNode;
    name: string;
    desc: string;
  }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => onNext?.(name.toLowerCase() as Role)}
        activeOpacity={0.8}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 8,
            gap: 8,
          }}
        >
          {icon}
          <Text style={styles.cardTitle}>{name}</Text>
        </View>

        <Text style={styles.cardDesc}>{desc}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {renderCard({
        icon: <Image source={User3} style={{ width: 24, height: 24 }} />,
        name: "User",
        desc: "Find partners, join groups, and track progress.",
      })}
      {renderCard({
        icon: <Image source={Trainer} style={{ width: 24, height: 24 }} />,
        name: "Trainer",
        desc: "I want to help others reach their fitness potential.",
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignSelf: "center",
    flex: 1,
    justifyContent: "center",
  },
  // header, title, step, progress styles are now in OnboardingStepHeader
  cards: { gap: 16 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
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
  signInButton: {
    color: "#6366F1",
    fontWeight: "400",
    textDecorationLine: "underline",
  },
});

export default RoleSelection;
