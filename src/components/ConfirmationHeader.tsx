import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { COLORS, DIMENSIONS } from "../config/constants";
import { LeftArrow } from "../../assets";
import FontWeight from "../hooks/useInterFonts";

interface ConfirmationHeaderProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
}

const ConfirmationHeader: React.FC<ConfirmationHeaderProps> = ({
  title = "Confirm Your Session",
  subtitle = "Go through before you finalize",
  onBack,
}) => {
  return (
    <LinearGradient
      colors={[COLORS.gradient1, COLORS.gradient2, COLORS.gradient3]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.topRow}>
          {onBack && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={onBack}
              style={styles.backButton}
            >
              <Image
                source={LeftArrow}
                style={styles.backIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}

          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingTop: DIMENSIONS.spacing.xxl,
    paddingBottom: DIMENSIONS.spacing.xxl,
  },
  content: {
    width: "100%",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: DIMENSIONS.spacing.md,
  },
  backButton: {
    padding: DIMENSIONS.spacing.xs,
    marginLeft: -DIMENSIONS.spacing.xs,
  },
  backIcon: {
    width: 28,
    height: 28,
    tintColor: COLORS.white,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: COLORS.white,
    fontFamily: FontWeight.SemiBold,
    fontSize: 26,
    marginBottom: 4,
  },
  subtitle: {
    color: COLORS.white,
    opacity: 0.9,
    fontFamily: FontWeight.Regular,
    fontSize: 14,
  },
});

export default ConfirmationHeader;
