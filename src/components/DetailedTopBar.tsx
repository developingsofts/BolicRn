import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../config/constants";
import { r } from "../designing/responsiveDesigns";
import FontWeight from "../hooks/useInterFonts";

interface DetailedTopBarProps {
  // Navigation
  onBackPress?: () => void;
  showBackButton?: boolean;
  backButtonIcon?: keyof typeof Ionicons.glyphMap;
  backButtonColor?: string;

  // Avatar
  avatar?: React.ReactNode;
  avatarText?: string;
  avatarSize?: number;
  avatarBackgroundColor?: string;

  // Title and Subtitle
  title?: string;
  subtitle?: string;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  bioText?: string;
  biostyle?: TextStyle;

  // Custom Views
  startView?: React.ReactNode;
  endView?: React.ReactNode;
  bottomView?: React.ReactNode;

  // Styling
  containerStyle?: ViewStyle;
  contentStyle?: ViewStyle;
  backgroundColor?: string;
}

const DetailedTopBar: React.FC<DetailedTopBarProps> = ({
  onBackPress,
  showBackButton = true,
  backButtonIcon = "arrow-back",
  backButtonColor = COLORS.white,
  avatar,
  avatarText,
  avatarSize = 80,
  avatarBackgroundColor = COLORS.primary,
  title,
  subtitle,
  titleStyle,
  subtitleStyle,
  bioText,
  biostyle,
  startView,
  endView,
  bottomView,
  containerStyle,
  contentStyle,
  backgroundColor = COLORS.gradient1,
}) => {
  return (
    <View style={[styles.container, { backgroundColor }, containerStyle]}>
      {/* Top Row - Back Button and Actions */}
      <View style={[styles.topRow, contentStyle]}>
        {/* Start View or Back Button */}
        {startView ? (
          startView
        ) : showBackButton ? (
          <TouchableOpacity
            onPress={() => onBackPress}
            style={styles.backButton}
          >
            <Ionicons
              name="chevron-down"
              size={24}
              color={COLORS.white}
              style={{ transform: [{ rotate: "90deg" }] }}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButton} />
        )}

        {/* End View */}
        {endView && <View style={styles.endView}>{endView}</View>}
      </View>

      {/* Avatar */}
      {(avatar || avatarText) && (
        <View style={styles.avatarContainer}>
          {avatar ? (
            avatar
          ) : (
            <View
              style={[
                styles.avatar,
                {
                  width: avatarSize,
                  height: avatarSize,
                  borderRadius: avatarSize / 2,
                  backgroundColor: avatarBackgroundColor,
                },
              ]}
            >
              <Text style={[styles.avatarText, { fontSize: avatarSize / 2.5 }]}>
                {avatarText}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Title and Subtitle */}
      {(title || subtitle) && (
        <View style={styles.textContainer}>
          {title && <Text style={[styles.title, titleStyle]}>{title}</Text>}
          {subtitle && (
            <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>
          )}
        </View>
      )}
      <Text style={biostyle}>{bioText}</Text>

      {/* Bottom View */}
      {bottomView && <View style={styles.bottomContainer}>{bottomView}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: r(16),
    paddingBottom: r(24),
    paddingHorizontal: r(16),
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: r(16),
  },
  backButton: {
    padding: r(8),
  },
  endView: {
    flexDirection: "row",
    alignItems: "center",
    gap: r(12),
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: r(16),
  },
  avatar: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  avatarText: {
    color: COLORS.white,
    fontFamily: FontWeight.Bold,
  },
  textContainer: {
    alignItems: "center",
    marginBottom: r(12),
  },
  title: {
    fontSize: 24,
    fontFamily: FontWeight.Bold,
    color: COLORS.white,
    textAlign: "center",
    marginBottom: r(4),
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FontWeight.Regular,
    color: COLORS.white,
    textAlign: "center",
    opacity: 0.9,
  },
  bottomContainer: {
    marginTop: r(16),
  },
});

export default DetailedTopBar;
