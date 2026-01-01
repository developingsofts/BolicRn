import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  Alert,
  Linking,
  Pressable,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, DIMENSIONS } from "../config/constants";
import STRINGS from "../config/strings";
import FontWeight from "../hooks/useInterFonts";
import { useResponsive } from "../hooks/responsiveDesignHook";
import { SafeAreaView } from "react-native-safe-area-context";
import { Achievement, Close, Media } from "../../assets";
import { Divider } from "react-native-paper";
import BasicTopBar from "../components/BasicTopBar";
import { useCreatePostMutation } from "../services/api/postsApi";
import { Toast } from "../components/ToastManager";
import type { Achievement as AchievementType } from "../types";
import { useGetUserAchievementsQuery } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

interface CreatePostScreenProps {
  navigation: any;
  route?: {
    params?: {
      groupId?: string | number;
    };
  };
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const CreatePostScreen: React.FC<CreatePostScreenProps> = ({
  navigation,
  route,
}) => {
  const styles = useResponsive(baseStyles);
  const [createPost, { isLoading }] = useCreatePostMutation();
  const groupId = route?.params?.groupId;
  const { user, isAuthenticated } = useAuth();

  const [postText, setPostText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<any>(null);
  const [selectedAchievement, setSelectedAchievement] =
    useState< AchievementType | null>(null);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [showUnlockedModal, setShowUnlockedModal] = useState(false);
  const { data: achievementsData, isLoading: achievementsLoading } =
    useGetUserAchievementsQuery(
      { userId: undefined },
      { skip: !isAuthenticated }
    );

  const achievements: AchievementType[] =
    achievementsData?.status && achievementsData?.data
      ? achievementsData.data
      : [];

  // Mock achievements data
  // const achievements: Achievement[] = [
  //   {
  //     id: "1",
  //     title: "First Steps",
  //     description: "Complete first workout",
  //     icon: "🏃‍♂️",
  //   },
  //   {
  //     id: "2",
  //     title: "Century Club",
  //     description: "Reach the 100 workout",
  //     icon: "💯",
  //   },
  //   {
  //     id: "3",
  //     title: "Community Leader",
  //     description: "Create your first group",
  //     icon: "👥",
  //   },
  // ];

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Fallback to navigate to home
      navigation.navigate("HomeFeed");
    }
  };

  const openDeviceSettings = () => {
    Linking.openSettings().catch(() => {
      Alert.alert(
        STRINGS.COMMON.error,
        STRINGS.CREATE_POST.errors.unableToOpenSettings
      );
    });
  };

  const handleSelectPhoto = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant permission to access your photos to upload media."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);

        // Determine the correct MIME type
        const uriParts = asset.uri.split(".");
        const fileExtension = uriParts[uriParts.length - 1].toLowerCase();
        let mimeType = "image/jpeg";

        if (fileExtension === "png") {
          mimeType = "image/png";
        } else if (fileExtension === "jpg" || fileExtension === "jpeg") {
          mimeType = "image/jpeg";
        } else if (fileExtension === "gif") {
          mimeType = "image/gif";
        } else if (fileExtension === "webp") {
          mimeType = "image/webp";
        }

        setImageFile({
          uri: asset.uri,
          type: mimeType,
          name: asset.fileName || `post_${Date.now()}.${fileExtension}`,
        });
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Toast.error("Failed to pick image");
    }
  };

  const [image, setImage] = useState<string | null>(null);

  const handleSelectAchievement = () => {
    setShowAchievementModal(true);
  };

  const handleAchievementSelect = (achievement: AchievementType) => {
    setSelectedAchievement(achievement);
    setShowAchievementModal(false);
    setShowUnlockedModal(true);
  };

  const handlePost = async () => {
    if (!postText.trim() && !selectedImage) {
      Toast.error(
        STRINGS.CREATE_POST.errors.addContent ||
          "Please add some content to your post"
      );
      return;
    }

    try {
      const payload: any = {
        title: postText.trim(),
      };

      // Add achievement ID if selected
      if (selectedAchievement) {
        payload.achievementId = parseInt(selectedAchievement.id.toString());
      }

      // Add media file if selected
      if (imageFile) {
        payload.mediaFile = imageFile;
      }

      // Add group ID if creating post for a group
      if (groupId) {
        payload.groupId = groupId;
      }

      const response = await createPost(payload).unwrap();

      if (response.status) {
        Toast.success(
          STRINGS.CREATE_POST.success.postCreated ||
            "Post created successfully!"
        );

        // If this was a group post, navigate to GroupDetails screen
        if (groupId) {
          navigation.replace("GroupDetails", { group: { id: groupId } });
        } else {
          // Navigate back to previous screen (Home)
          handleBack();
        }
      } else {
        Toast.error(response.message || "Failed to create post");
      }
    } catch (error: any) {
      console.error("Create post error:", error);
      Toast.error(error?.data?.message || "Failed to create post");
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImageFile(null);
  };

  const removeAchievement = () => {
    setSelectedAchievement(null);
  };

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.container}>
      <BasicTopBar
        containerStyle={styles.header}
        showBackButton={true}
        onBackPress={handleBack}
        title={STRINGS.CREATE_POST.title}
        subtitle={groupId ? "Posting to group" : STRINGS.CREATE_POST.subtitle}
        titleStyle={styles.headerTitle}
        subtitleStyle={styles.subtitle}
      />

      <View style={{ paddingHorizontal: 20 }}>
        <Pressable
          style={styles.shareWorkoutCard}
          onPress={() => {
            navigation.navigate("ShareWorkout");
          }}
        >
          <Text style={styles.shareWorkoutText}>
            {STRINGS.CREATE_POST.shareWorkout}
          </Text>
          <Ionicons name="chevron-forward" size={24} color={COLORS.app_black} />
        </Pressable>

        <View style={styles.content}>
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ borderRadius: 10 }}
          >
            {/* Text Input */}
            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder={STRINGS.CREATE_POST.captionPlaceholder}
                placeholderTextColor={COLORS._5E5E5E}
                value={postText}
                onChangeText={setPostText}
                multiline
                textAlignVertical="top"
                editable={!isLoading}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleSelectPhoto}
                disabled={isLoading}
              >
                <Image source={Media} style={styles.actionButtonImage} />
                <Text style={[styles.actionButtonText, { marginLeft: 5 }]}>
                  {STRINGS.CREATE_POST.photoVideo}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleSelectAchievement}
                disabled={isLoading}
              >
                <Image source={Achievement} style={styles.actionButtonImage} />
                <Text style={[styles.actionButtonText, { marginLeft: 2 }]}>
                  {STRINGS.CREATE_POST.achievement}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Selected Achievement */}
            {selectedAchievement && (
              <View style={styles.achievementContainer}>
                <View style={styles.achievementHeader}>
                  <Text style={styles.achievementTitle}>
                    {STRINGS.CREATE_POST.achievementUnlocked}
                  </Text>
                  <TouchableOpacity onPress={removeAchievement}>
                    <Image
                      source={Close}
                      style={styles.closeIcon}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.achievementCard}>
                  <View style={[styles.achievementIcon]}>
                    <Text style={styles.achievementEmoji}>
                      {selectedAchievement.icon}
                    </Text>
                  </View>
                  <View style={styles.achievementDetails}>
                    <Text style={styles.achievementName}>
                      {selectedAchievement.title}
                    </Text>
                    <Text style={styles.achievementDescription}>
                      {selectedAchievement.description}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <Divider style={{ height: 1.5, backgroundColor: COLORS._C9C9C9 }} />

            {/* Selected Images */}
            {selectedImage && (
              <View style={styles.imagesContainer}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={styles.imagesTitle}>
                    {STRINGS.CREATE_POST.uploadedImage}
                  </Text>
                  <Pressable onPress={removeImage}>
                    <Text
                      style={[styles.imagesTitle, { color: COLORS._FF1616 }]}
                    >
                      {STRINGS.COMMON.remove}
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.imageWrapper}>
                  <Image
                    source={{ uri: selectedImage }}
                    resizeMode="cover"
                    style={styles.selectedImage}
                  />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Achievement Selection Modal */}
          <Modal
            visible={showAchievementModal}
            transparent
            navigationBarTranslucent
            statusBarTranslucent
            animationType="slide"
            onRequestClose={() => setShowAchievementModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {STRINGS.CREATE_POST.selectAchievement}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowAchievementModal(false)}
                  >
                    <Image source={Close} style={styles.closeIcon} />
                  </TouchableOpacity>
                </View>
                <Divider
                  style={{
                    height: 1.5,
                    backgroundColor: COLORS._C9C9C9,
                    marginHorizontal: 22,
                    marginBottom: 10,
                  }}
                />

                <ScrollView>
                  {achievements.map((achievement) => (
                    <Pressable
                      key={achievement.id}
                      style={styles.achievementOption}
                      onPress={() => handleAchievementSelect(achievement)}
                    >
                      <View style={[styles.achievementOptionIcon]}>
                        <Text style={styles.achievementOptionEmoji}>
                          {achievement.icon}
                        </Text>
                      </View>
                      <View style={styles.achievementOptionDetails}>
                        <Text style={styles.achievementOptionTitle}>
                          {achievement.title}
                        </Text>
                        <Text style={styles.achievementDescription}>
                          {achievement.description}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>

          <TouchableOpacity
            style={[styles.postButton, isLoading && styles.postButtonDisabled]}
            onPress={handlePost}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.postButtonText}>
                {STRINGS.CREATE_POST.post}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: DIMENSIONS.spacing.xxl,
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: COLORS.gradient3,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  backButton: {
    paddingVertical: 5,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.white,
  },
  placeholder: {
    width: 34,
  },
  content: {
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: COLORS.white,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  scrollView: {
    flexGrow: 1,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FontWeight.Medium,
    color: COLORS.white,
  },
  textInputContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 130,
    paddingTop: 5,
    maxHeight: 130,
    borderWidth: 1,
    borderColor: COLORS._D9D9D9,
  },
  textInput: {
    fontSize: 14,
    fontFamily: FontWeight.Medium,
    color: COLORS._5E5E5E,
    textAlignVertical: "top",
    flex: 1,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: FontWeight.Medium,
    textAlign: "center",
    alignSelf: "center",
    color: COLORS.gradient1,
  },
  achievementContainer: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderColor: COLORS.primary,
    borderRadius: 8,
    marginBottom: 10,
  },
  actionButtonImage: {
    width: 25,
    height: 25,
  },
  achievementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  achievementTitle: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.gradient1,
    letterSpacing: 0,
  },
  achievementCard: {
    flexDirection: "row",
    borderRadius: 10,
    alignItems: "flex-start",
  },
  achievementIcon: {
    width: 30,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  achievementEmoji: {
    fontSize: 20,
  },
  achievementDetails: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontFamily: FontWeight.Medium,
    color: COLORS.app_black,
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 14,
    fontFamily: FontWeight.Regular,
    color: COLORS._5E5E5E,
  },
  imagesContainer: {
    marginTop: 10,
  },
  imagesTitle: {
    fontSize: 14,
    fontFamily: FontWeight.Medium,
    color: COLORS._5E5E5E,
    marginBottom: 10,
  },
  imageWrapper: {
    position: "relative",
    marginRight: 10,
  },
  selectedImage: {
    width: "100%",
    height: 140,
    borderRadius: 10,
  },
  postButton: {
    backgroundColor: COLORS.primary,
    marginTop: 10,
    paddingVertical: 13,
    borderRadius: 5,
    alignItems: "center",
  },
  postButtonText: {
    fontSize: 14,
    fontFamily: FontWeight.Medium,
    color: COLORS.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.app_black,
  },
  achievementOption: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 5,
    paddingVertical: 10,
  },
  achievementOptionIcon: {
    width: 50,
    height: 50,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 5,
  },
  achievementOptionEmoji: {
    fontSize: 20,
  },
  achievementOptionDetails: {
    flex: 1,
  },
  achievementOptionTitle: {
    fontSize: 16,
    fontFamily: FontWeight.Medium,
    color: COLORS.app_black,
    marginBottom: 4,
  },
  unlockedModalContent: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 30,
    alignItems: "center",
    position: "relative",
  },
  closeIcon: {
    width: 25,
    height: 25,
  },
  shareWorkoutCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  shareWorkoutText: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.app_black,
  },
  postButtonDisabled: {
    opacity: 0.6,
  },
});

export default CreatePostScreen;
