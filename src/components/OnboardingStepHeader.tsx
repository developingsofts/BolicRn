import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ProgressBar } from "react-native-paper";

interface OnboardingStepHeaderProps {
  title: string;
  stepText: string;
  progress: number; // 0 to 1
}

const OnboardingStepHeader: React.FC<OnboardingStepHeaderProps> = ({ title, stepText, progress }) => (
  <View style={styles.headerContainer}>
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.step}>{stepText}</Text>
    </View>
    <ProgressBar progress={progress} style={styles.progress} color="#6366F1" />
  </View>
);

const styles = StyleSheet.create({
  headerContainer: { width: "100%", marginBottom: 16 },
  header: { marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "600", color: "#222" },
  step: { fontSize: 14, color: "#888", marginTop: 4 },
  progress: { height: 8, borderRadius: 4, marginBottom: 8 },
});

export default OnboardingStepHeader;
