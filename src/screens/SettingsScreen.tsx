import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Image,
  ActivityIndicator,
  ScrollView,
  AppState,
  Platform,
} from "react-native";
import * as Notifications from "expo-notifications";
import * as Linking from "expo-linking";
import Constants from "expo-constants";
import RefreshableScrollView from "../components/RefreshableScrollView";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  APP_CONFIG,
  COLORS,
  DIMENSIONS,
  FEATURE_FLAGS,
  LEGAL_LINKS,
  TRAINING_TYPES,
} from "../config/constants";
import STRINGS from "../config/strings";
import { useAuth } from "../contexts/AuthContext";
import { useGetMyProfileQuery } from "../services/api/userApi";
import { ArrowDown, Close, Deactivate } from "../../assets";
import FontWeight from "../hooks/useInterFonts";
import {
  useDeleteMyAccountMutation,
  useUpdateMyProfileMutation,
} from "../services/api/userApi";
import { Toast } from "../components/ToastManager";
import { User } from "../types";
import ConfirmationDialog from "../components/ConfirmationDialog";

// The matching chips are the shared training-type taxonomy, not a Settings-local
// list: the same values drive AuthScreen onboarding, the FindScreen filters and
// UserProfileForm, and the server stores them verbatim on User.matchingPreference.
// This annotated assignment is also the compile-time cross-check that
// TRAINING_TYPES and the User.matchingPreference union stay in sync.
type PreferenceValue = NonNullable<User["matchingPreference"]>[number];

const PREFERENCE_OPTIONS: readonly PreferenceValue[] = TRAINING_TYPES;

const isPreferenceValue = (value: unknown): value is PreferenceValue =>
  typeof value === "string" &&
  PREFERENCE_OPTIONS.includes(value as PreferenceValue);

/**
 * Maps a server value onto its canonical `TRAINING_TYPES` entry, matching
 * case-insensitively. The training-type catalogue contains rows that differ only
 * by case ("BodyBuilding" and "Bodybuilding" both exist server-side), so an
 * exact-match filter silently drops the user's real selection.
 */
const toCanonicalPreference = (value: unknown): PreferenceValue | null => {
  if (typeof value !== "string") return null;
  const needle = value.trim().toLowerCase();
  return (
    PREFERENCE_OPTIONS.find((option) => option.toLowerCase() === needle) ?? null
  );
};

const parseMatchingPreference = (pref: unknown): PreferenceValue[] => {
  const raw: unknown[] = Array.isArray(pref)
    ? pref
    : typeof pref === "string" && pref
      ? (() => {
          try {
            const parsed = JSON.parse(pref);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
      : [];

  const seen = new Set<PreferenceValue>();
  raw.forEach((entry) => {
    const canonical = toCanonicalPreference(entry);
    if (canonical) seen.add(canonical);
  });
  return PREFERENCE_OPTIONS.filter((option) => seen.has(option));
};

// Tolerant boolean read — a SQL-backed API may echo booleans as 1/0 or "1"/"0",
// which must not be mistaken for a failed save.
const asBoolean = (value: unknown): boolean =>
  value === true || value === 1 || value === "1" || value === "true";

// Which of the keys we just sent did the server NOT persist? Empty means it all
// round-tripped. Used to keep the toggles honest about what actually saved.
const findUnsavedKeys = (payload: Partial<User>, saved: User): string[] =>
  Object.entries(payload)
    .filter(([key, sent]) => {
      const stored = (saved as unknown as Record<string, unknown>)[key];
      if (key === "trainingTypes") {
        // The catalogue has case-duplicate rows, so the server legitimately
        // echoes back MORE entries than we sent (sending "BodyBuilding" also
        // matches "Bodybuilding"). Treat it as saved when everything we asked
        // for is present and nothing we removed came back.
        const sentList = parseMatchingPreference(sent);
        const storedList = parseMatchingPreference(stored);
        const missing = sentList.some((value) => !storedList.includes(value));
        const unexpected = storedList.some((value) => !sentList.includes(value));
        return missing || unexpected;
      }
      if (key === "matchingPreference") {
        // The server sends this back as an array or as a JSON string, and an
        // empty selection can come back as null — all three are equivalent.
        const sentList = parseMatchingPreference(sent).slice().sort();
        const storedList = parseMatchingPreference(stored).slice().sort();
        return (
          sentList.length !== storedList.length ||
          sentList.some((value, index) => value !== storedList[index])
        );
      }
      if (stored === undefined || stored === null) {
        return true;
      }
      if (typeof sent === "boolean") {
        return asBoolean(stored) !== sent;
      }
      return stored !== sent;
    })
    .map(([key]) => key);

const APP_VERSION_LABEL = (() => {
  const version = Constants.expoConfig?.version ?? APP_CONFIG.version;
  const build =
    Platform.OS === "ios"
      ? Constants.expoConfig?.ios?.buildNumber
      : Constants.expoConfig?.android?.versionCode?.toString();
  return build ? `${version} (${build})` : version;
})();

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

  const [selectedPreferences, setSelectedPreferences] = useState<
    PreferenceValue[]
  >(parseMatchingPreference(user?.trainingTypes));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  // OS-level permission — the only part of notification delivery that actually
  // exists today (see the delivery note rendered under the switch).
  const [permissionStatus, setPermissionStatus] = useState<
    Notifications.PermissionStatus | null
  >(null);

  const refreshPermissionStatus = useCallback(async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
    } catch (error) {
      console.warn("Unable to read notification permission", error);
      setPermissionStatus(null);
    }
  }, []);

  useEffect(() => {
    // The notification section is hidden (FEATURE_FLAGS.notificationsSection):
    // read no OS permission and register no listener while it is not shown, so a
    // hidden feature can never trigger a system permission prompt.
    if (!FEATURE_FLAGS.notificationsSection) {
      return;
    }
    refreshPermissionStatus();
    // Re-read on resume so returning from the system settings app updates the row.
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refreshPermissionStatus();
      }
    });
    return () => subscription.remove();
  }, [refreshPermissionStatus]);

  useEffect(() => {
    if (!user) {
      return;
    }

    setNotificationsEnabled(user.notificationEnabled ?? true);
    setProfileVisibilityEnabled(user.profileVisibility ?? true);
    setPreferencesEnabled(user.matchingEnabled ?? true);
    setSelectedPreferences(parseMatchingPreference(user.trainingTypes));
  }, [user]);

  const syncLocalState = useCallback((nextUser: User) => {
    setNotificationsEnabled(nextUser.notificationEnabled ?? true);
    setProfileVisibilityEnabled(nextUser.profileVisibility ?? true);
    setPreferencesEnabled(nextUser.matchingEnabled ?? true);
    setSelectedPreferences(parseMatchingPreference(nextUser.trainingTypes));
  }, []);

  const persistSettings = useCallback(
    async (payload: Partial<User>, rollback: () => void) => {
      try {
        setIsSubmitting(true);
        console.log("📤 Sending payload to API:", JSON.stringify(payload, null, 2));
        const response = await updateProfile(payload).unwrap();

        if (!response.status || !response.data) {
          throw new Error(response.message || "Failed to update settings");
        }

        const updatedUser = response.data as User;

        // Don't claim a save the server didn't make: /user/update echoes the
        // whole user, so every key we sent must come back with the value we
        // sent. A silently ignored / whitelisted-out field would otherwise show
        // as "Settings updated" while nothing changed.
        const unsaved = findUnsavedKeys(payload, updatedUser);
        if (unsaved.length > 0) {
          console.warn("Settings not echoed back by the server:", unsaved);
          rollback();
          Toast.error(STRINGS.SETTINGS.updateNotPersisted);
          return;
        }

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

  // Returns true when the OS will let this device show notifications.
  // `null` from a thrown call means "unknown" — we don't block the toggle on it.
  const ensureSystemPermission = useCallback(async (): Promise<boolean> => {
    try {
      const current = await Notifications.getPermissionsAsync();
      if (current.granted) {
        setPermissionStatus(current.status);
        return true;
      }
      if (!current.canAskAgain) {
        setPermissionStatus(current.status);
        return false;
      }
      const next = await Notifications.requestPermissionsAsync();
      setPermissionStatus(next.status);
      return next.granted;
    } catch (error) {
      console.warn("Notification permission request failed", error);
      setPermissionStatus(null);
      return true;
    }
  }, []);

  const handleNotificationsToggle = async (value: boolean) => {
    const previous = notificationsEnabled;
    setNotificationsEnabled(value);

    if (value) {
      const granted = await ensureSystemPermission();
      if (!granted) {
        // Don't persist an "on" flag the device will never honour.
        setNotificationsEnabled(previous);
        Toast.error(STRINGS.SETTINGS.notificationsPermissionRequired);
        return;
      }
    }

    await persistSettings({ notificationEnabled: value }, () =>
      setNotificationsEnabled(previous)
    );
  };

  const openSystemSettings = useCallback(async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.warn("Unable to open system settings", error);
      Toast.error(STRINGS.SETTINGS.linkOpenError);
    }
  }, []);

  const openExternalUrl = useCallback(async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.warn("Unable to open url", url, error);
      Toast.error(STRINGS.SETTINGS.linkOpenError);
    }
  }, []);

  const handleProfileVisibilityToggle = async (value: boolean) => {
    const previous = profileVisibilityEnabled;
    setProfileVisibilityEnabled(value);
    await persistSettings({ profileVisibility: value }, () =>
      setProfileVisibilityEnabled(previous)
    );
  };

  const handleMatchingToggle = async (value: boolean) => {
    const previousEnabled = preferencesEnabled;
    setPreferencesEnabled(value);

    // Only the flag moves. The chips are the user's `trainingTypes` — real
    // profile data also shown on their profile and used by matching — so
    // switching matching off must not delete them.
    await persistSettings({ matchingEnabled: value }, () =>
      setPreferencesEnabled(previousEnabled)
    );
  };

  const handlePreferenceSelect = async (option: PreferenceValue) => {
    if (!preferencesEnabled) {
      return;
    }

    const previousPreferences = selectedPreferences;
    let newPreferences: PreferenceValue[];

    if (selectedPreferences.includes(option)) {
      newPreferences = selectedPreferences.filter(p => p !== option);
    } else {
      newPreferences = [...selectedPreferences, option];
    }

    // The server ignores `trainingTypes: []`, so clearing the last style cannot
    // be persisted. Say so instead of showing a change that will not survive.
    if (newPreferences.length === 0) {
      Toast.info(STRINGS.SETTINGS.keepOneTrainingStyle);
      return;
    }

    setSelectedPreferences(newPreferences);

    await persistSettings({ trainingTypes: newPreferences }, () =>
      setSelectedPreferences(previousPreferences)
    );
  };

  // A destination row renders ONLY when a real URL / mailbox is configured in
  // LEGAL_LINKS (src/config/constants.ts). Privacy Policy, Terms and Support have
  // no destinations yet, so those rows are hidden rather than shown as dead or
  // "unavailable" entries. This is self-healing: fill in the string in
  // LEGAL_LINKS and the row appears, tappable, with no other code change.
  const renderDestinationRow = (label: string, target: string) => {
    if (!target) {
      return null;
    }

    return (
      <TouchableOpacity
        key={label}
        style={styles.linkRow}
        onPress={() => openExternalUrl(target)}
        activeOpacity={0.8}
      >
        <Text style={styles.linkLabel}>{label}</Text>
        <Image source={ArrowDown} style={styles.linkChevronRight} />
      </TouchableOpacity>
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
        {/* Hidden: push notifications are out of scope for this project and no
            delivery path exists. Kept intact behind FEATURE_FLAGS.notificationsSection
            so it can be restored if that changes; see constants.ts. */}
        {FEATURE_FLAGS.notificationsSection && (
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
                trackColor={{
                  false: COLORS.textSecondary,
                  true: COLORS._C9E3FF,
                }}
                thumbColor={
                  notificationsEnabled ? COLORS.primary : COLORS.border
                }
                disabled={isBusy}
              />
            </View>
            {permissionStatus === Notifications.PermissionStatus.DENIED && (
              <TouchableOpacity
                style={styles.permissionRow}
                onPress={openSystemSettings}
                activeOpacity={0.8}
              >
                <Text style={styles.rowNote}>
                  {STRINGS.SETTINGS.notificationsBlocked}
                </Text>
                <Text style={styles.rowAction}>
                  {STRINGS.SETTINGS.openSystemSettings}
                </Text>
              </TouchableOpacity>
            )}
            <Text style={styles.rowNote}>
              {STRINGS.SETTINGS.notificationsDeliveryNote}
            </Text>
          </View>
        )}
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.preferenceScrollView}
            contentContainerStyle={styles.preferenceRow}
          >
            {PREFERENCE_OPTIONS.map((item) => {
              const isSelected = selectedPreferences.includes(item);
              return (
                <TouchableOpacity
                  key={item}
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
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <Text style={styles.rowNote}>
            {STRINGS.SETTINGS.matchingPreferencesHint}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{STRINGS.SETTINGS.about}</Text>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => setAboutExpanded((previous) => !previous)}
            activeOpacity={0.8}
          >
            <Text style={styles.linkLabel}>{STRINGS.SETTINGS.aboutApp}</Text>
            <Image
              source={ArrowDown}
              style={[
                styles.linkChevron,
                aboutExpanded && styles.linkChevronOpen,
              ]}
            />
          </TouchableOpacity>
          {aboutExpanded && (
            <Text style={styles.rowDetail}>{APP_CONFIG.description}</Text>
          )}

          <View style={styles.linkRow}>
            <Text style={styles.linkLabel}>{STRINGS.SETTINGS.appVersion}</Text>
            <Text style={styles.linkValue}>{APP_VERSION_LABEL}</Text>
          </View>

          {renderDestinationRow(
            STRINGS.SETTINGS.help,
            LEGAL_LINKS.supportEmail
              ? `mailto:${LEGAL_LINKS.supportEmail}`
              : ""
          )}
          {renderDestinationRow(
            STRINGS.SETTINGS.privacyPolicy,
            LEGAL_LINKS.privacyPolicyUrl
          )}
          {renderDestinationRow(
            STRINGS.SETTINGS.termsOfService,
            LEGAL_LINKS.termsOfServiceUrl
          )}
        </View>

        <View style={styles.lineSeparator} />

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
    tintColor: COLORS.text,
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
    backgroundColor: COLORS.surface,
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
    backgroundColor: COLORS.surface,
    padding: DIMENSIONS.spacing.md,
    borderRadius: DIMENSIONS.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.border,
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
  rowNote: {
    fontSize: 12,
    fontFamily: FontWeight.Regular,
    color: COLORS.textSecondary,
    marginTop: DIMENSIONS.spacing.sm,
  },
  rowAction: {
    fontSize: 12,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.primary,
    marginTop: DIMENSIONS.spacing.xs,
  },
  rowDetail: {
    fontSize: 13,
    fontFamily: FontWeight.Regular,
    color: COLORS.textSecondary,
    paddingBottom: DIMENSIONS.spacing.sm,
  },
  permissionRow: {
    marginTop: DIMENSIONS.spacing.xs,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  linkLabel: {
    fontSize: 14,
    fontFamily: FontWeight.Medium,
    color: COLORS._5E5E5E,
  },
  linkLabelMuted: {
    fontSize: 14,
    fontFamily: FontWeight.Medium,
    color: COLORS.textSecondary,
  },
  linkValue: {
    fontSize: 14,
    fontFamily: FontWeight.Regular,
    color: COLORS.textSecondary,
  },
  linkValueMuted: {
    fontSize: 12,
    fontFamily: FontWeight.Regular,
    color: COLORS.textSecondary,
  },
  linkChevron: {
    width: 16,
    height: 16,
    tintColor: COLORS.textSecondary,
  },
  linkChevronOpen: {
    transform: [{ rotate: "180deg" }],
  },
  linkChevronRight: {
    width: 16,
    height: 16,
    tintColor: COLORS.textSecondary,
    transform: [{ rotate: "-90deg" }],
  },
  preferenceScrollView: {
    marginTop: DIMENSIONS.spacing.md,
  },
  preferenceRow: {
    flexDirection: "row",
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
    color: COLORS.black,
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
    backgroundColor: COLORS.surface,
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
