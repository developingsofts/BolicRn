import React from "react";
import { View, Text, StyleSheet } from "react-native";

import { COLORS } from "../config/constants";
import { r } from "../designing/responsiveDesigns";
import FontWeight from "../hooks/useInterFonts";

interface InfoCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

const InfoCard: React.FC<InfoCardProps> = ({ label, value, icon }) => {
  return (
    <View style={styles.card}>
      {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: r(16),
    gap: r(12),
    borderRadius: r(16),
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: r(32),
    height: r(32),
    borderRadius: r(16),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: `${COLORS.primary}15`,
  },
  textContainer: {
    flex: 1,
    gap: r(4, "height"),
  },
  label: {
    color: COLORS.textSecondary,
    fontFamily: FontWeight.Medium,
    fontSize: r(11, "font"),
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  value: {
    color: COLORS.text,
    fontFamily: FontWeight.SemiBold,
    fontSize: r(16, "font"),
  },
});

export default InfoCard;
