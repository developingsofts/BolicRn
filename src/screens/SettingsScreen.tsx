import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Image,
  ActivityIndicator,
} from "react-native";
import RefreshableScrollView from "../components/RefreshableScrollView";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, DIMENSIONS } from "../config/constants";
import STRINGS from "../config/strings";
import { useAuth } from "../contexts/AuthContext";
import { useGetMyProfileQuery } from "../services/api/userApi";
import { Close, Deactivate } from "../../assets";
import FontWeight from "../hooks/useInterFonts";
import {
  useDeleteMyAccountMutation,
  useUpdateMyProfileMutation,
} from "../services/api/userApi";
import { Toast } from "../components/ToastManager";
import { User } from "../types";
import ConfirmationDialog from "../components/ConfirmationDialog";

type PreferenceOption = {
  label: string;
  value: "Strength" | "Cardio" | "CrossFit";
};

const PREFERENCE_OPTIONS: PreferenceOption[] = [
  { label: "Strength", value: "Strength" },
  { label: "Cardio", value: "Cardio" },
  { label: "CrossFit", value: "CrossFit" },
];

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const {
    logout,
    user,
    updateUser: updateAuthUser,
    isAuthenticated,
  } = useAuth();
  const [updateProfile, { isLoading: isSaving }] = useUpdateMyProfileMutation();
  const [deleteAccount, { isLoading: isDeleting }] =
    useDeleteMyAccountMutation();
  const [refreshing, setRefreshing] = useState(false);
  const { refetch: refetchMyProfile } = useGetMyProfileQuery(undefined, {
    skip: !isAuthenticated,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchMyProfile();
    setRefreshing(false);
  };

  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(
    user?.notificationEnabled ?? true
  );
  const [profileVisibilityEnabled, setProfileVisibilityEnabled] =
    useState<boolean>(user?.profileVisibility ?? true);
  const [preferencesEnabled, setPreferencesEnabled] = useState<boolean>(
    user?.matchingEnabled ?? true
  );
  const [selectedPreference, setSelectedPreference] = useState<
    PreferenceOption["value"] | null
  >((user?.matchingPreference as PreferenceOption["value"]) ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    setNotificationsEnabled(user.notificationEnabled ?? true);
    setProfileVisibilityEnabled(user.profileVisibility ?? true);
    setPreferencesEnabled(user.matchingEnabled ?? true);
    setSelectedPreference(
      (user.matchingPreference as PreferenceOption["value"]) ?? null
    );
  }, [user]);

  const syncLocalState = useCallback((nextUser: User) => {
    setNotificationsEnabled(nextUser.notificationEnabled ?? true);
    setProfileVisibilityEnabled(nextUser.profileVisibility ?? true);
    setPreferencesEnabled(nextUser.matchingEnabled ?? true);
    setSelectedPreference(
      (nextUser.matchingPreference as PreferenceOption["value"]) ?? null
    );
  }, []);

  const persistSettings = useCallback(
    async (payload: Partial<User>, rollback: () => void) => {
      try {
        setIsSubmitting(true);
        const response = await updateProfile(payload).unwrap();

        if (!response.status || !response.data) {
          throw new Error(response.message || "Failed to update settings");
        }

        const updatedUser = response.data as User;
        updateAuthUser(updatedUser);
        syncLocalState(updatedUser);
        Toast.success(STRINGS.SETTINGS.updateSuccess);
      } catch (error: any) {
        console.error("Settings update failed", error);
        rollback();
        Toast.error(
          error?.message ??
            STRINGS.SETTINGS.updateError ??
            "Unable to update settings"
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [syncLocalState, updateAuthUser, updateProfile]
  );

  const isBusy = useMemo(
    () => isSaving || isSubmitting || isDeleting,
    [isSaving, isSubmitting, isDeleting]
  );

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation will be handled automatically by the auth state change
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleDeactivatePress = () => {
    setShowDeactivateDialog(true);
  };

  const closeDeactivateDialog = () => {
    if (!isDeleting) {
      setShowDeactivateDialog(false);
    }
  };

  const handleConfirmDeactivate = async () => {
    try {
      const response = await deleteAccount().unwrap();

      if (!response.status) {
        throw new Error(response.message || STRINGS.SETTINGS.deleteError);
      }

      Toast.success(response.message || STRINGS.SETTINGS.deleteSuccess);
      setShowDeactivateDialog(false);
      await logout();
    } catch (error: any) {
      console.error("Account deactivation failed", error);
      Toast.error(error?.message || STRINGS.SETTINGS.deleteError);
      setShowDeactivateDialog(false);
    }
  };

  const handleNotificationsToggle = async (value: boolean) => {
    const previous = notificationsEnabled;
    setNotificationsEnabled(value);
    await persistSettings({ notificationEnabled: value }, () =>
      setNotificationsEnabled(previous)
    );
  };

  const handleProfileVisibilityToggle = async (value: boolean) => {
    const previous = profileVisibilityEnabled;
    setProfileVisibilityEnabled(value);
    await persistSettings({ profileVisibility: value }, () =>
      setProfileVisibilityEnabled(previous)
    );
  };

  const handleMatchingToggle = async (value: boolean) => {
    const previousEnabled = preferencesEnabled;
    const previousPreference = selectedPreference;
    setPreferencesEnabled(value);
    if (!value) {
      setSelectedPreference(null);
    }

    await persistSettings(
      {
        matchingEnabled: value,
        matchingPreference: value ? selectedPreference : null,
      },
      () => {
        setPreferencesEnabled(previousEnabled);
        setSelectedPreference(previousPreference ?? null);
      }
    );
  };

  const handlePreferenceSelect = async (option: PreferenceOption) => {
    if (!preferencesEnabled || selectedPreference === option.value) {
      return;
    }

    const previousPreference = selectedPreference;
    setSelectedPreference(option.value);

    await persistSettings({ matchingPreference: option.value }, () =>
      setSelectedPreference(previousPreference ?? null)
    );
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <View style={styles.headerActions}>
        <Text style={styles.editProfileTitle}>{STRINGS.SETTINGS.title}</Text>
        <View style={styles.headerRight}>
          {isBusy && (
            <View style={styles.savingIndicator}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.savingText}>
                {STRINGS.SETTINGS.saving ?? "Saving"}
              </Text>
            </View>
          )}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            disabled={isBusy}
            style={styles.closeButton}
          >
            <Image source={Close} style={styles.iconSize} />
          </TouchableOpacity>
        </View>
      </View>
      <RefreshableScrollView
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      >
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
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: COLORS.textSecondary, true: COLORS._C9E3FF }}
              thumbColor={notificationsEnabled ? COLORS.primary : COLORS.border}
              disabled={isBusy}
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
              onValueChange={handleProfileVisibilityToggle}
              trackColor={{ false: COLORS.textSecondary, true: COLORS._C9E3FF }}
              thumbColor={
                profileVisibilityEnabled ? COLORS.primary : COLORS.border
              }
              disabled={isBusy}
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
              onValueChange={handleMatchingToggle}
              trackColor={{ false: COLORS.textSecondary, true: COLORS._C9E3FF }}
              thumbColor={preferencesEnabled ? COLORS.primary : COLORS.border}
              disabled={isBusy}
            />
          </View>
          <View style={styles.preferenceRow}>
            {PREFERENCE_OPTIONS.map((item) => {
              const isSelected = selectedPreference === item.value;
              return (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.preferenceBtn,
                    isSelected
                      ? styles.preferenceBtnPrimary
                      : styles.preferenceBtnGray,
                    !preferencesEnabled && styles.preferenceBtnDisabled,
                  ]}
                  disabled={!preferencesEnabled || isBusy}
                  onPress={() => handlePreferenceSelect(item)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={
                      isSelected
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

        <View style={styles.lineSeparator} />

        <TouchableOpacity
          onPress={handleLogout}
          style={styles.deactivateBtn}
          disabled={isBusy}
        >
          <Text style={styles.logoutText}>{STRINGS.SETTINGS.logout}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDeactivatePress}
          style={styles.deactivateBtn}
          disabled={isBusy}
        >
          <Image source={Deactivate} style={styles.deactivateIcon} />
          <Text style={styles.logoutText}>
            {STRINGS.SETTINGS.deactivateAccount}
          </Text>
        </TouchableOpacity>
      </RefreshableScrollView>

      <ConfirmationDialog
        visible={showDeactivateDialog}
        title={STRINGS.SETTINGS.confirmDeactivateTitle}
        message={STRINGS.SETTINGS.confirmDeactivateMessage}
        confirmLabel={STRINGS.SETTINGS.confirmDeactivateConfirm}
        cancelLabel={STRINGS.SETTINGS.confirmDeactivateCancel}
        onConfirm={handleConfirmDeactivate}
        onCancel={closeDeactivateDialog}
        loading={isDeleting}
      />
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: DIMENSIONS.spacing.sm,
  },
  savingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: DIMENSIONS.spacing.sm,
    paddingVertical: 4,
    borderRadius: 20,
    gap: DIMENSIONS.spacing.xs,
  },
  savingText: {
    fontFamily: FontWeight.Medium,
    fontSize: 12,
    color: COLORS.primary,
  },
  closeButton: {
    padding: DIMENSIONS.spacing.xs,
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
  preferenceBtnDisabled: {
    opacity: 0.5,
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
  },
  deactivateIcon: {
    width: 18,
    height: 18,
    tintColor: COLORS._EB3434,
  },
});

export default SettingsScreen;
