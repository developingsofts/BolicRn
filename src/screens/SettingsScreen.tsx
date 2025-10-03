import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, DIMENSIONS } from "../config/constants";
import STRINGS from "../config/strings";
import { useAuth } from "../contexts/AuthContext";
import { ArrowDown, Close, Deactivate } from "../../assets";
import FontWeight from "../hooks/useInterFonts";

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { logout } = useAuth();
  const [showDebugger, setShowDebugger] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [profileVisibilityEnabled, setProfileVisibilityEnabled] =
    useState(true);
  const [preferencesEnabled, setPreferencesEnabled] = useState(true);
  const preferenceOptions = [
    { label: "Strength" },
    { label: "Cardio" },
    { label: "Flexibility" },
  ];
  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <View>
        <View style={styles.headerActions}>
          <Text style={styles.editProfileTitle}>{STRINGS.SETTINGS.title}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image source={Close} style={styles.iconSize} />
          </TouchableOpacity>
        </View>
        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {STRINGS.SETTINGS.notifications}
          </Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>
              {STRINGS.SETTINGS.enableNotifications}
            </Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={
                notificationsEnabled ? COLORS.white : COLORS.textSecondary
              }
            />
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {STRINGS.SETTINGS.profileVisibility}
          </Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>
              {STRINGS.SETTINGS.enablePublicProfile}
            </Text>
            <Switch
              value={profileVisibilityEnabled}
              onValueChange={setProfileVisibilityEnabled}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={
                profileVisibilityEnabled ? COLORS.white : COLORS.textSecondary
              }
            />
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {STRINGS.SETTINGS.matchingPreferences}
          </Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>
              {STRINGS.SETTINGS.enablePreferences}
            </Text>
            <Switch
              value={preferencesEnabled}
              onValueChange={setPreferencesEnabled}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={
                preferencesEnabled ? COLORS.white : COLORS.textSecondary
              }
            />
          </View>
          <View style={styles.preferenceRow}>
            {preferenceOptions?.map((item) => {
              const isPrimary = item.label === "Strength";
              return (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.preferenceBtn,
                    isPrimary
                      ? styles.preferenceBtnPrimary
                      : styles.preferenceBtnGray,
                  ]}
                  onPress={() =>
                    navigation.navigate("EditProfile", { isGuest: false })
                  }
                >
                  <Text
                    style={
                      isPrimary
                        ? styles.preferenceBtnTextPrimary
                        : styles.preferenceBtnTextGray
                    }
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
      <View>
        <View style={styles.lineSeparator} />

        <TouchableOpacity onPress={handleLogout} style={styles.deactivateBtn}>
          <Image source={Deactivate} style={styles.deactivateIcon} />
          <Text style={styles.logoutText}>
            {STRINGS.SETTINGS.deactivateAccount}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingVertical: DIMENSIONS.spacing.lg,
    justifyContent: "space-between",
  },
  iconSize: {
    width: 24,
    height: 24,
    tintColor: COLORS.black,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 16,
  },
  editProfileTitle: {
    fontFamily: FontWeight.SemiBold,
    fontSize: 24,
    color: COLORS.app_black,
  },
  section: {
    marginBottom: DIMENSIONS.spacing.xl,
    backgroundColor: COLORS.white,
    padding: DIMENSIONS.spacing.md,
    borderRadius: DIMENSIONS.borderRadius,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    color: COLORS.app_black,
    fontFamily: FontWeight.SemiBold,
    marginBottom: DIMENSIONS.spacing.sm,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingLabel: {
    fontSize: 14,
    fontFamily: FontWeight.Medium,
    color: COLORS._5E5E5E,
  },
  logoutText: {
    fontSize: 14,
    color: COLORS._EB3434,
    fontFamily: FontWeight.Medium,
  },
  preferenceRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginTop: DIMENSIONS.spacing.md,
    gap: DIMENSIONS.spacing.sm,
  },
  preferenceBtn: {
    paddingVertical: DIMENSIONS.spacing.sm,
    paddingHorizontal: DIMENSIONS.spacing.md,
    borderRadius: 20,
  },
  preferenceBtnPrimary: {
    backgroundColor: COLORS.primary,
  },
  preferenceBtnGray: {
    backgroundColor: COLORS.buttonGrayBg,
  },
  preferenceBtnTextPrimary: {
    color: COLORS.white,
  },
  preferenceBtnTextGray: {
    color: COLORS.buttonGrayText,
  },
  lineSeparator: {
    height: 1,
    backgroundColor: COLORS._E6E6E7,
    marginBottom: DIMENSIONS.spacing.sm,
  },
  deactivateBtn: {
    marginTop: DIMENSIONS.spacing.lg,
    backgroundColor: COLORS.white,
    padding: 14,
    justifyContent: "center",
    flexDirection: "row",
    gap: DIMENSIONS.spacing.sm,
    alignItems: "center",
    borderRadius: 8,
    elevation: 5,
  },
  deactivateIcon: {
    width: 18,
    height: 18,
    tintColor: COLORS._EB3434,
  },
});

export default SettingsScreen;
