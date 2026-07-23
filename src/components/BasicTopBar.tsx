
import React, { ReactNode } from "react";
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
import { COLORS, DIMENSIONS } from "../config/constants";
import FontWeight from "../hooks/useInterFonts";
import { LinearGradient } from "expo-linear-gradient";

interface BasicTopBarProps {
  onBackPress?: () => void;
  showBackButton?: boolean;
  backButtonIcon?: ReactNode;

  title?: string;
  subtitle?: string;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;

  startView?: ReactNode;
  endView?: ReactNode;
  bottomView?: ReactNode;

  containerStyle?: ViewStyle;
  contentStyle?: ViewStyle;
  backgroundColor?: string;
}

const BasicTopBar: React.FC<BasicTopBarProps> = ({
  onBackPress,
  showBackButton = true,
  backButtonIcon,
  title,
  subtitle,
  titleStyle,
  subtitleStyle,
  startView,
  endView,
  bottomView,
  containerStyle,
  contentStyle,
  backgroundColor = COLORS.gradient3,
}) => {
  return (
    <LinearGradient
      colors={[COLORS.gradient1, COLORS.gradient2, COLORS.gradient3]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.container, { backgroundColor }, containerStyle]}
    >
      <View style={[styles.contentRow, contentStyle]}>
        {startView ? (
          <View style={styles.startView}>{startView}</View>
        ) : showBackButton && onBackPress ? (
          <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
            {backButtonIcon || (
              <Ionicons name="chevron-back" size={25} color={COLORS.white} />
            )}
          </TouchableOpacity>
        ) : null}

        {(title || subtitle) && (
          <View style={styles.titleContainer}>
            {title && <Text style={[styles.title, titleStyle]}>{title}</Text>}
            {subtitle && (
              <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>
            )}
          </View>
        )}

        {endView && <View style={styles.endView}>{endView}</View>}
      </View>

      {bottomView && <View style={styles.bottomView}>{bottomView}</View>}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: DIMENSIONS.spacing.lg,
  },
  contentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  startView: {
    marginRight: DIMENSIONS.spacing.sm,
  },
  backButton: {
    paddingVertical: 6,
    marginRight: DIMENSIONS.spacing.sm,
    marginTop: DIMENSIONS.spacing.lg,
  },
  titleContainer: {
    flex: 1,
    marginTop: DIMENSIONS.spacing.xs,
  },
  title: {
    fontSize: 24,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.white,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FontWeight.Medium,
    color: COLORS.white,
    marginTop: 4,
  },
  endView: {
    marginLeft: DIMENSIONS.spacing.sm,
  },
  bottomView: {
  },
});

export default BasicTopBar;
