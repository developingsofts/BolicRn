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
        icon: (
          <Image
            source={User3}
            style={{ width: 24, height: 24, tintColor: COLORS.white }}
          />
        ),
        name: "User",
        desc: "Find partners, join groups, and track progress.",
      })}
      {renderCard({
        icon: (
          <Image
            source={Trainer}
            style={{ width: 24, height: 24, tintColor: COLORS.white }}
          />
        ),
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
  cards: { gap: 16 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
    elevation: 2,
  },
  cardSelected: {
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  iconCircle: {
    width: 48,
    height: 48,

    borderRadius: 24,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  cardTitle: { fontSize: 18, fontWeight: "600", color: COLORS.text },
  cardDesc: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center", marginTop: 4 },
  signIn: { alignItems: "center", marginTop: 24 },
  signInText: { fontSize: 14, color: COLORS.textSecondary },
  signInButton: {
    color: COLORS.primary,
    fontWeight: "400",
    textDecorationLine: "underline",
  },
});

export default RoleSelection;
