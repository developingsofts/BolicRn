import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ProgressBar } from "react-native-paper";
import { COLORS } from "../config/constants";

interface OnboardingStepHeaderProps {
  title: string;
  stepText: string;
  progress: number;
}

const OnboardingStepHeader: React.FC<OnboardingStepHeaderProps> = ({ title, stepText, progress }) => (
  <View style={styles.headerContainer}>
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.step}>{stepText}</Text>
    </View>
    <ProgressBar progress={progress} style={styles.progress} color={COLORS.primary} />
  </View>
);

const styles = StyleSheet.create({
  headerContainer: { width: "100%", marginBottom: 16 },
  header: { marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "600", color: COLORS.white },
  step: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  progress: { height: 8, borderRadius: 4, marginBottom: 8 },
});

export default OnboardingStepHeader;
