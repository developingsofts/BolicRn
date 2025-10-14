import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { COLORS, DIMENSIONS, LOCATION_CONFIG } from "../config/constants";
import STRINGS from "../config/strings";
import FontWeight from "../hooks/useInterFonts";
import { useAuth } from "../contexts/AuthContext";
import { Trash, Close } from "../../assets";
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

type Suggestion = {
  text?: string;
  magicKey?: string;
};

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
  const [isLocationFocused, setIsLocationFocused] = useState(false);
  const [isBioFocused, setIsBioFocused] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSelectingSuggestionRef = useRef(false);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const bioInputRef = useRef<any>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

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

  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const keyboardDidShow = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });

    const keyboardDidHide = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      // Blur the bio input when keyboard is hidden so it can be focused again
      bioInputRef.current?.blur();
    });

    return () => {
      keyboardDidShow.remove();
      keyboardDidHide.remove();
    };
  }, []);

  const handleBioFocus = () => {
    setIsBioFocused(true);
    // Measure the bio input position and scroll to it
    console.log("Bio field focused");
    setTimeout(() => {
      bioInputRef.current?.measureLayout(
        scrollViewRef.current,
        (x: number, y: number, width: number, height: number) => {
          scrollViewRef.current?.scrollTo({
            y: y - 50, // Scroll to position with some offset
            animated: true,
          });
        },
        () => {
          // Fallback to scrollToEnd if measure fails
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }
      );
    }, 100);
  };

  const handleBioBlur = () => {
    setIsBioFocused(false);
  };

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

  const fetchSuggestions = useCallback(async (query: string) => {
    const trimmed = query.trim();

    if (!trimmed || trimmed.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `${LOCATION_CONFIG.geocodeSuggestUrl}?text=${encodeURIComponent(
          trimmed
        )}&f=json`
      );
      const data = await response.json();

      if (data?.suggestions) {
        setSuggestions(data.suggestions);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    }
  }, []);

  const handleSelectSuggestion = (text: string) => {
    isSelectingSuggestionRef.current = true;
    setLocation(text);
    setSuggestions([]);
    setIsLocationFocused(false);
    Keyboard.dismiss();
    setTimeout(() => {
      isSelectingSuggestionRef.current = false;
    }, 150);
  };

  const handleLocationChange = (text: string) => {
    setLocation(text);

    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(text);
    }, 300);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Toast.error('Please enter your name');
      return;
    }

    if (bio.trim().length > 500) {
      Toast.error('Bio cannot exceed 500 characters');
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
          placeholder={isNameFocused ? "" : STRINGS.EDIT_PROFILE.namePlaceholder}
          placeholderTextColor={COLORS._D9D9D9}
          editable={!isLoading}
          onFocus={() => setIsNameFocused(true)}
          onBlur={() => setIsNameFocused(false)}
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{STRINGS.EDIT_PROFILE.location}</Text>
        <TextInput
          style={styles.inputField}
          value={location}
          onChangeText={handleLocationChange}
          placeholder={
            isLocationFocused ? "" : STRINGS.EDIT_PROFILE.locationPlaceholder
          }
          placeholderTextColor={COLORS._D9D9D9}
          editable={!isLoading}
          onFocus={() => {
            setIsLocationFocused(true);
            if (location.trim().length >= 3) {
              fetchSuggestions(location);
            }
          }}
          onBlur={() => {
            setIsLocationFocused(false);
            if (!isSelectingSuggestionRef.current) {
              setSuggestions([]);
            }
          }}
        />
        {isLocationFocused && suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <ScrollView
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {suggestions.map((item, index) => (
                <TouchableOpacity
                  key={item?.magicKey || `${item?.text || "suggestion"}-${index}`}
                  style={styles.suggestionItem}
                  onPress={() => handleSelectSuggestion(item?.text || "")}
                >
                  <Text style={styles.suggestionText}>{item?.text}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{STRINGS.EDIT_PROFILE.bio}</Text>
        <TextInput
          ref={bioInputRef}
          style={styles.inputFieldBio}
          value={bio}
          onChangeText={setBio}
          placeholder={isBioFocused ? "" : STRINGS.EDIT_PROFILE.bioPlaceholder}
          placeholderTextColor={COLORS._D9D9D9}
          multiline
          maxLength={500}
          editable={!isLoading}
          onFocus={handleBioFocus}
          onBlur={handleBioBlur}
        />
        <Text style={styles.characterCount}>{bio.length}/500</Text>
      </View>
    </View>
  );
  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: keyboardVisible ? 180 : 0 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 0,
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
  suggestionsContainer: {
    position: "absolute",
    top: 70,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS._E6E6E7,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 20,
    maxHeight: 200,
  },
  suggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  suggestionText: {
    fontSize: 14,
    color: COLORS._616888,
    fontFamily: FontWeight.Medium,
  },
  inputFieldBio: {
    height: 120,
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
    marginBottom: 5,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: COLORS._616888,
    textAlign: 'right',
    marginBottom: 10,
    fontFamily: FontWeight.Medium,
  },
  savePostContainer: {},
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    zIndex: 10,
    marginTop: 16,

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
