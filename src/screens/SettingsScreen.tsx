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
import { useAuth } from "../contexts/AuthContext";
import { ArrowDown, Deactivate } from "../../assets";
import FontWeight from "../hooks/useInterFonts";

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { logout } = useAuth();
  const [showDebugger, setShowDebugger] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [profileVisibilityEnabled, setProfileVisibilityEnabled] = useState(true);
  const [preferencesEnabled, setPreferencesEnabled] = useState(true);
const preferenceOptions = [
  { label: 'Strength' },
  { label: 'Cardio' },
  { label: 'Flexibility' },
];
  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView edges={["top","bottom"]} style={styles.container}>
     <View>
       <View style={styles.headerActions}>
        <Text style={styles.editProfileTitle}>Settings</Text>
        <Image source={ArrowDown} style={styles.iconSize} />
      </View>
      {/* Notification Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Enable Notifications</Text>
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
        <Text style={styles.sectionTitle}>Profile Visiblity</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Enable Public Profile Visibility</Text>
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
        <Text style={styles.sectionTitle}>Matching Preferences</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Enable Preferences?</Text>
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
            const isPrimary = item.label === 'Strength';
            return (
              <TouchableOpacity
                key={item.label}
                style={[styles.preferenceBtn, isPrimary ? styles.preferenceBtnPrimary : styles.preferenceBtnGray]}
                onPress={() => navigation.navigate('EditProfile', { isGuest: false })}
              >
                <Text style={isPrimary ? styles.preferenceBtnTextPrimary : styles.preferenceBtnTextGray}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
     </View>

      <TouchableOpacity onPress={handleLogout} style={styles.deactivateBtn}>  
        <Image source={Deactivate} style={styles.deactivateIcon} />
        <Text style={styles.logoutText}>Deactivate Account?</Text>
      </TouchableOpacity>
    
    
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(242, 242, 247, 1)",
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingVertical: DIMENSIONS.spacing.lg,
    justifyContent: 'space-between',
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
    fontWeight: "600",
    color: COLORS.black,
  },
  section: {
    marginBottom: DIMENSIONS.spacing.xl,
    backgroundColor: COLORS.white,
    padding: DIMENSIONS.spacing.md,
    borderRadius: DIMENSIONS.borderRadius,
    boxShadow: "0px 0px 8px 0px rgba(107, 107, 107, 0.15)",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text,
    fontFamily: FontWeight.SemiBold,
    marginBottom: DIMENSIONS.spacing.md,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    
  },
  settingLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  logoutText: {
    fontSize: 16,
    color: COLORS.error,
    fontWeight: "600",
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
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
  deactivateBtn: {
    marginTop: DIMENSIONS.spacing.lg,
    backgroundColor: COLORS.white,
    padding: DIMENSIONS.spacing.md,
    justifyContent: 'center',
    flexDirection: 'row',
    gap: DIMENSIONS.spacing.sm,
    alignItems: 'center',
    borderRadius: 8,
  },
  deactivateIcon: {
    width: 18,
    height: 18,
    tintColor: COLORS.error,
  },
});

export default SettingsScreen;
