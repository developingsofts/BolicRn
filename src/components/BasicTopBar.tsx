/**
 * BasicTopBar - A flexible, reusable top bar component
 *
 * USAGE EXAMPLES:
 *
 * 1. Simple back button with title:
 *    <BasicTopBar
 *      onBackPress={() => navigation.goBack()}
 *      title="Groups"
 *      subtitle="Join gym and training groups"
 *    />
 *
 * 2. With custom startView (avatar):
 *    <BasicTopBar
 *      startView={
 *        <View style={styles.avatarContainer}>
 *          <View style={styles.avatar}>
 *            <Text style={styles.avatarText}>A</Text>
 *          </View>
 *        </View>
 *      }
 *      title="Alex"
 *      endView={
 *        <Ionicons name="chevron-down" size={24} color={COLORS.white} />
 *      }
 *    />
 *
 * 3. With custom endView (settings/edit icons):
 *    <BasicTopBar
 *      onBackPress={() => navigation.goBack()}
 *      title="Create Post"
 *      subtitle="Share your workout or achievement"
 *      endView={
 *        <View style={{ flexDirection: 'row', gap: 10 }}>
 *          <TouchableOpacity><Image source={Edit} /></TouchableOpacity>
 *          <TouchableOpacity><Image source={Settings} /></TouchableOpacity>
 *        </View>
 *      }
 *    />
 *
 * 4. With bottomView (filters/tabs):
 *    <BasicTopBar
 *      title="Groups"
 *      subtitle="Join gym and training groups"
 *      bottomView={
 *        <View style={styles.filtersDropdown}>
 *          <Text>Filters Dropdown</Text>
 *        </View>
 *      }
 *    />
 *
 * 5. Custom text styles:
 *    <BasicTopBar
 *      title="Good morning, Development User! 👋"
 *      subtitle="Ready to crush your goals today?"
 *      titleStyle={{ fontSize: 28, fontWeight: '700' }}
 *      subtitleStyle={{ fontSize: 16, color: COLORS._D9D9D9 }}
 *    />
 *
 * 6. No back button (welcome screen):
 *    <BasicTopBar
 *      showBackButton={false}
 *      title="Welcome"
 *      subtitle="Let's get started"
 *    />
 */

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
  // Back button
  onBackPress?: () => void;
  showBackButton?: boolean;
  backButtonIcon?: ReactNode;

  // Title and subtitle
  title?: string;
  subtitle?: string;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;

  // Custom views
  startView?: ReactNode; // Left side view (e.g., avatar, custom button)
  endView?: ReactNode; // Right side view (e.g., settings, edit icons)
  bottomView?: ReactNode; // Below title/subtitle (e.g., filters, tabs)

  // Container styles
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
    <LinearGradient  colors={[COLORS.gradient1, COLORS.gradient2,COLORS.gradient3]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}  style={[styles.container, { backgroundColor }, containerStyle]}>
      {/* Main content row */}
      <View style={[styles.contentRow, contentStyle]}>
        {/* Start view (custom left content or back button) */}
        {startView ? (
          <View style={styles.startView}>{startView}</View>
        ) : showBackButton && onBackPress ? (
          <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
            {backButtonIcon || (
              <Ionicons name="chevron-back" size={25} color={COLORS.white} />
            )}
          </TouchableOpacity>
        ) : null}

        {/* Title and subtitle */}
        {(title || subtitle) && (
          <View style={styles.titleContainer}>
            {title && <Text style={[styles.title, titleStyle]}>{title}</Text>}
            {subtitle && (
              <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>
            )}
          </View>
        )}

        {/* End view (custom right content) */}
        {endView && <View style={styles.endView}>{endView}</View>}
      </View>

      {/* Bottom view (optional additional content below) */}
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
  },
  titleContainer: {
    flex: 1,
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
    // marginTop: DIMENSIONS.spacing.md,
  },
});

export default BasicTopBar;
