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
  onBackPress?: () => void;
  showBackButton?: boolean;
  backButtonIcon?: keyof typeof Ionicons.glyphMap;
  backButtonColor?: string;

  avatar?: React.ReactNode;
  avatarText?: string;
  avatarSize?: number;
  avatarBackgroundColor?: string;

  title?: string;
  subtitle?: string;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  bioText?: string;
  biostyle?: TextStyle;

  startView?: React.ReactNode;
  endView?: React.ReactNode;
  bottomView?: React.ReactNode;

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
  avatarBackgroundColor = COLORS.surface,
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
      <View style={[styles.topRow, contentStyle]}>
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

        {endView && <View style={styles.endView}>{endView}</View>}
      </View>

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

      {(title || subtitle) && (
        <View style={styles.textContainer}>
          {title && <Text style={[styles.title, titleStyle]}>{title}</Text>}
          {subtitle && (
            <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>
          )}
        </View>
      )}
      <Text style={biostyle}>{bioText}</Text>

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
