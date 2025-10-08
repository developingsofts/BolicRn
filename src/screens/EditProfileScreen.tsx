import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { COLORS, DIMENSIONS } from "../config/constants";
import STRINGS from "../config/strings";
import FontWeight from "../hooks/useInterFonts";
import { useAuth } from "../contexts/AuthContext";
import { Trash, ArrowDown, Close } from "../../assets";
import { LinearGradient } from "expo-linear-gradient";
import { r } from "../designing/responsiveDesigns";
import { useUpdateMyProfileWithImageMutation, useUpdateMyProfileMutation } from "../services/api/userApi";
import { Toast } from "../components/ToastManager";

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
  const { user, updateUser } = useAuth();
  const [updateProfileWithImage, { isLoading: isLoadingWithImage }] = useUpdateMyProfileWithImageMutation();
  const [updateProfile, { isLoading: isLoadingProfile }] = useUpdateMyProfileMutation();
  
  const isLoading = isLoadingWithImage || isLoadingProfile;
  
  const isGuest = route?.params?.isGuest || !user;
  const isOwnProfile =
    !route?.params?.userId || route.params.userId === user?.id;
  
  const [name, setName] = useState(user?.displayName || "");
  const [location, setLocation] = useState(user?.location || "");
  const [bio, setBio] = useState(user?.bio || user?.currentPRs || "");
  const [selectedImage, setSelectedImage] = useState<string | null>(user?.imageUrl || null);
  const [imageFile, setImageFile] = useState<any>(null);
  const [deleteImage, setDeleteImage] = useState(false);

  // Sync local state with user context when user data changes
  useEffect(() => {
    if (user) {
      setName(user.displayName || "");
      setLocation(user.location || "");
      setBio(user.bio || user.currentPRs || "");
      setSelectedImage(user.imageUrl || null);
      setImageFile(null);
      setDeleteImage(false);
    }
  }, [user?.imageUrl, user?.displayName, user?.location, user?.bio, user?.currentPRs]);

  const handleImagePick = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your photos to upload a profile picture.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);
        
        // Determine the correct MIME type
        const uriParts = asset.uri.split('.');
        const fileExtension = uriParts[uriParts.length - 1].toLowerCase();
        let mimeType = 'image/jpeg'; // default
        
        if (fileExtension === 'png') {
          mimeType = 'image/png';
        } else if (fileExtension === 'jpg' || fileExtension === 'jpeg') {
          mimeType = 'image/jpeg';
        } else if (fileExtension === 'gif') {
          mimeType = 'image/gif';
        } else if (fileExtension === 'webp') {
          mimeType = 'image/webp';
        }
        
        setImageFile({
          uri: asset.uri,
          type: mimeType,
          name: asset.fileName || `profile_${Date.now()}.${fileExtension}`,
        });
        setDeleteImage(false); // Reset delete flag when new image is selected
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Toast.error('Failed to pick image');
    }
  };

  const handleDeleteImage = () => {
    setSelectedImage(null);
    setImageFile(null);
    setDeleteImage(true); // Mark that user wants to delete the image
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Toast.error('Please enter your name');
      return;
    }

    try {
      let response;
      
      // If there's an image file, use FormData mutation
      if (imageFile) {
        const payload: any = {
          displayName: name.trim(),
          bio: bio.trim(),
          location: location.trim(),
          imageFile: imageFile,
        };

        response = await updateProfileWithImage(payload).unwrap();
      } else if (deleteImage) {
        // If user wants to delete image, send null/empty imageUrl
        const payload: any = {
          displayName: name.trim(),
          bio: bio.trim(),
          location: location.trim(),
          imageUrl: '', // Send empty string to delete image
        };

        response = await updateProfile(payload).unwrap();
      } else {
        // Otherwise use regular JSON mutation
        const payload: any = {
          displayName: name.trim(),
          bio: bio.trim(),
          location: location.trim(),
        };

        response = await updateProfile(payload).unwrap();
      }

      if (response.status && response.data) {
        // Redux store is automatically updated via onQueryStarted in userApi
        Toast.success('Profile updated successfully');
        navigation.goBack();
      } else {
        Toast.error(response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      Toast.error(error?.data?.message || 'Failed to update profile');
    }
  };
  const renderProfileAvatar = () => {
    const initial = user?.displayName?.charAt(0) || (isGuest ? "G" : "D");
    const displayName = user?.displayName || "";

    return (
      <LinearGradient
        colors={[COLORS.gradient1, COLORS.gradient2, COLORS.gradient3]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.profileHeader}
      >
        <View style={styles.headerActions}>
          <Text style={styles.editProfileTitle}>
            {STRINGS.EDIT_PROFILE.title}
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()} disabled={isLoading}>
            <Image source={Close} style={styles.iconSize} />
          </TouchableOpacity>
        </View>

        <View style={styles.avatarRow}>
          <View style={[styles.avatar, isGuest && styles.guestAvatar]}>
            {selectedImage ? (
              <Image source={{ uri: selectedImage }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initial}</Text>
            )}
          </View>
          <View style={styles.avatarInfoCol}>
            <View>
              <Text style={styles.displayName}>{displayName}</Text>
            </View>
            <View style={styles.avatarActionsRow}>
              <TouchableOpacity 
                style={styles.uploadBtn} 
                onPress={handleImagePick}
                disabled={isLoading}
              >
                <Text style={styles.uploadBtnText}>
                  {STRINGS.EDIT_PROFILE.uploadNew}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.deleteBtn} 
                onPress={handleDeleteImage}
                disabled={isLoading}
              >
                <Image source={Trash} style={styles.deleteIcon} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>
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
          placeholderTextColor={COLORS._5E5E5E}
          editable={!isLoading}
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
          editable={!isLoading}
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
          editable={!isLoading}
        />
      </View>
    </View>
  );
  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <KeyboardAvoidingView behavior={"height"}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          // keyboardShouldPersistTaps="handled"
        >
          {renderProfileAvatar()}
          <View style={styles.formWrapper}>
            {renderProfileForm()}

            <TouchableOpacity 
              style={[styles.saveBtn, isLoading && styles.saveBtnDisabled]} 
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.saveBtnText}>
                  {STRINGS.EDIT_PROFILE.saveChanges}
                </Text>
              )}
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
  },
  profileHeader: {
    backgroundColor: COLORS.gradient3,
    paddingBottom: 60,
    paddingTop: DIMENSIONS.spacing.xl,
    paddingHorizontal: 10,

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
    // alignItems: "center",
    marginTop: 10,
    marginStart: 10,
    justifyContent: "flex-start",
    gap: 20,
  },
  avatar: {
    width: r(140),
    height: r(140),
    borderWidth: 2,
    borderColor: COLORS.white,
    borderRadius: 100,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 10,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
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
    paddingVertical: 10,
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
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    marginBottom: 24,
    color: COLORS.app_black,
  },
  inputGroup: {
    // marginBottom: 18,
  },
  inputLabel: {
    fontSize: 12,
    color: COLORS.app_black,
    fontFamily: FontWeight.Medium,
    marginBottom: 6,
  },
  inputField: {
    height: 45,
    borderRadius: 4,
    paddingRight: 10,
    paddingLeft: 10,
    textAlign: "left",
    justifyContent: "center",
    fontFamily: FontWeight.Medium,
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
    fontFamily: FontWeight.Medium,
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
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: COLORS.white,
    fontFamily: FontWeight.Medium,
    fontSize: 14,
  },
});

export default EditProfileScreen;
