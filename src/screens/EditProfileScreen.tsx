import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, DIMENSIONS } from "../config/constants";
import STRINGS from "../config/strings";
import FontWeight from "../hooks/useInterFonts";
import { useAuth } from "../contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Trash, ArrowDown, Close } from "../../assets";

interface EditProfileScreenProps {
  navigation: any;
  route?: {
    params?: {
      isGuest?: boolean;
      userId?: string;
    };
  };
}

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({
  navigation,
  route,
}) => {
  const { user } = useAuth();
  const isGuest = route?.params?.isGuest || !user;
  const isOwnProfile =
    !route?.params?.userId || route.params.userId === user?.id;
  const [name, setName] = useState(user?.displayName || "");
  const [location, setLocation] = useState(user?.location || "");
  const [bio, setBio] = useState(user?.bio || "");

  const handleSave = () => {
    // Save profile changes logic here
  };
  const renderProfileAvatar = () => {
    const initial = user?.displayName?.charAt(0) || (isGuest ? "G" : "D");
    const displayName =
      user?.displayName || (isGuest ? "Guest User" : "Development User");
    const location = user?.location || "San Francisco, CA";

    return (
      <View style={styles.profileHeader}>
      
        <View style={styles.headerActions}>
          <Text style={styles.editProfileTitle}>
            {STRINGS.EDIT_PROFILE.title}
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image source={Close} style={styles.iconSize} />
          </TouchableOpacity>
        </View>

        <View style={styles.avatarRow}>
          <View style={[styles.avatar, isGuest && styles.guestAvatar]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.avatarInfoCol}>
            <View>
              <Text style={styles.displayName}>{displayName}</Text>
            </View>
            <View style={styles.avatarActionsRow}>
              <TouchableOpacity style={styles.uploadBtn}>
                <Text style={styles.uploadBtnText}>
                  {STRINGS.EDIT_PROFILE.uploadNew}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn}>
                <Image source={Trash} style={styles.deleteIcon} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderProfileForm = () => (
    <View style={styles.profileFormContainer}>
      <Text style={styles.profileFormTitle}>
        {STRINGS.EDIT_PROFILE.updateDetails}
      </Text>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{STRINGS.EDIT_PROFILE.name}</Text>
        <TextInput
          style={styles.inputField}
          value={name}
          onChangeText={setName}
          placeholder={STRINGS.EDIT_PROFILE.namePlaceholder}
          placeholderTextColor={COLORS._D9D9D9}
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{STRINGS.EDIT_PROFILE.location}</Text>
        <TextInput
          style={styles.inputField}
          value={location}
          onChangeText={setLocation}
          placeholder={STRINGS.EDIT_PROFILE.locationPlaceholder}
          placeholderTextColor={COLORS._D9D9D9}
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{STRINGS.EDIT_PROFILE.bio}</Text>
        <TextInput
          style={styles.inputFieldBio}
          value={bio}
          onChangeText={setBio}
          placeholder={STRINGS.EDIT_PROFILE.bioPlaceholder}
          placeholderTextColor={COLORS._D9D9D9}
          multiline
          numberOfLines={4}
        />
      </View>
    </View>
  );
  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <KeyboardAvoidingView behavior={"height"}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          // keyboardShouldPersistTaps="handled"
        >
          {renderProfileAvatar()}
          <View style={styles.formWrapper}>
            {renderProfileForm()}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>
                {STRINGS.EDIT_PROFILE.saveChanges}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={{ flex: 1, backgroundColor: COLORS.white }} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: DIMENSIONS.spacing.lg,
    backgroundColor: COLORS.gradient3,
    zIndex: -1,
    position: "relative",
  },
  profileHeader: {
    backgroundColor: COLORS.gradient3,
    paddingBottom: 60,
    paddingHorizontal: 10,
    alignItems: "center",
    position: "relative",
    zIndex: 0,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
    paddingTop: 10,
    marginBottom: 16,
  },
  editProfileTitle: {
    fontFamily: FontWeight.SemiBold,
    fontSize: 24,
    fontWeight: "600",
    color: COLORS.white,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderWidth: 2,
    borderColor: COLORS.white,
    borderRadius: 100,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  guestAvatar: {
    backgroundColor: COLORS.app_black,
  },
  avatarText: {
    fontFamily: FontWeight.SemiBold,
    fontSize: 48,
    color: COLORS.white,
  },
  avatarInfoCol: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 10,
  },
  displayName: {
    fontFamily: FontWeight.SemiBold,
    fontSize: 20,
    color: COLORS.white,
  },
  avatarActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  uploadBtn: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
    borderRadius: 4,
  },
  uploadBtnText: {
    fontFamily: FontWeight.Medium,
    fontSize: 14,
    color: COLORS.black,
  },
  deleteBtn: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 4,
  },
  deleteIcon: {
    width: 20,
    height: 20,
  },
  iconSize: {
    width: 24,
    height: 24,
    tintColor: COLORS.white,
  },
  formWrapper: {
    zIndex: 10,
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    gap: 20,
  },
  profileFormContainer: {
    width: "100%",
    padding: 20,
    alignSelf: "center",
    marginTop: -40,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
    elevation: 4,
  },
  profileFormTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 24,
    color: COLORS.black,
  },
  inputGroup: {
    // marginBottom: 18,
  },
  inputLabel: {
    fontSize: 12,
    color: COLORS.black,
    fontFamily: FontWeight.Medium,
    fontWeight: "500",
    marginBottom: 6,
  },
  inputField: {
    height: 41,
    borderRadius: 4,
    paddingTop: 12,
    paddingRight: 10,
    paddingLeft: 10,
    backgroundColor: COLORS.background,
    opacity: 1,
    fontSize: 16,
    color: COLORS.app_black,
    marginBottom: 10,
  },
  inputFieldBio: {
    minHeight: 120,
    borderRadius: 4,
    paddingTop: 12,
    paddingRight: 10,
    paddingBottom: 12,
    paddingLeft: 10,
    backgroundColor: COLORS.background,
    opacity: 1,
    fontSize: 16,
    color: COLORS.app_black,
    marginBottom: 10,
    textAlignVertical: "top",
  },
  savePostContainer: {},
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
});

export default EditProfileScreen;
