import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DetailedTopBar from "./DetailedTopBar";
import { COLORS } from "../config/constants";
import { r } from "../designing/responsiveDesigns";
import FontWeight from "../hooks/useInterFonts";

export const ProfileTopBar = ({ navigation }: any) => (
  <DetailedTopBar
    onBackPress={() => navigation.goBack()}
    avatarText="D"
    title="Development User"
    subtitle="San Francisco, CA"
    endView={
      <>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="create-outline" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="settings-outline" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </>
    }
    bottomView={
      <Text style={styles.bioText}>
        Fitness enthusiast on a mission to lift heavy and inspire others. Let's
        connect and crush some goals together! 💪
      </Text>
    }
  />
);

export const UserProfileTopBar = ({ navigation }: any) => (
  <DetailedTopBar
    onBackPress={() => navigation.goBack()}
    avatarText="G"
    avatarBackgroundColor={COLORS.primary}
    title="Guest User"
    subtitle="San Francisco, CA"
    endView={
      <TouchableOpacity style={styles.iconButton}>
        <Ionicons name="chatbubble-outline" size={24} color={COLORS.white} />
      </TouchableOpacity>
    }
    bottomView={
      <View style={styles.bottomContent}>
        <Text style={styles.bioText}>
          Fitness enthusiast on a mission to lift heavy and inspire others.
          Let's connect and crush some goals together! 💪
        </Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.followingButton}>
            <Ionicons name="person-outline" size={18} color={COLORS.text} />
            <Text style={styles.followingText}>Following</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="person-add-outline" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
    }
  />
);

export const CustomAvatarTopBar = ({ navigation }: any) => (
  <DetailedTopBar
    onBackPress={() => navigation.goBack()}
    avatar={
      <View style={styles.customAvatar}>
        <Text style={styles.customAvatarText}>D</Text>
      </View>
    }
    title="Development User"
    subtitle="San Francisco, CA"
    endView={
      <TouchableOpacity style={styles.iconButton}>
        <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.white} />
      </TouchableOpacity>
    }
  />
);

export const ProfileWithStatsTopBar = ({ navigation }: any) => (
  <DetailedTopBar
    onBackPress={() => navigation.goBack()}
    avatarText="D"
    title="Development User"
    subtitle="San Francisco, CA"
    endView={
      <TouchableOpacity style={styles.iconButton}>
        <Ionicons name="settings-outline" size={24} color={COLORS.white} />
      </TouchableOpacity>
    }
    bottomView={
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>245</Text>
          <Text style={styles.statLabel}>Workouts</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>1.2K</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>850</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
      </View>
    }
  />
);

export const MinimalTopBar = () => (
  <DetailedTopBar
    showBackButton={false}
    avatarText="D"
    title="Development User"
    subtitle="San Francisco, CA"
  />
);

const styles = StyleSheet.create({
  iconButton: {
    padding: r(8),
  },
  bioText: {
    fontSize: 14,
    fontFamily: FontWeight.Regular,
    color: COLORS.white,
    textAlign: "center",
    lineHeight: 20,
    opacity: 0.9,
  },
  bottomContent: {
    gap: r(16),
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: r(12),
  },
  followingButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    paddingHorizontal: r(24),
    paddingVertical: r(10),
    borderRadius: r(8),
    gap: r(8),
    flex: 1,
    justifyContent: "center",
  },
  followingText: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 44,
    height: 44,
    borderRadius: r(8),
    justifyContent: "center",
    alignItems: "center",
  },
  customAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  customAvatarText: {
    fontSize: 32,
    fontFamily: FontWeight.Bold,
    color: COLORS.white,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: r(12),
    paddingVertical: r(16),
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontFamily: FontWeight.Bold,
    color: COLORS.white,
    marginBottom: r(4),
  },
  statLabel: {
    fontSize: 12,
    fontFamily: FontWeight.Regular,
    color: COLORS.white,
    opacity: 0.8,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
});
