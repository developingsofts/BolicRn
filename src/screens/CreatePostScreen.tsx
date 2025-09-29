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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, DIMENSIONS } from "../config/constants";
import FontWeight from "../hooks/useInterFonts";
import { useResponsive } from "../hooks/responsiveDesignHook";
import { SafeAreaView } from "react-native-safe-area-context";
import { Achievement, Close, Media } from "../../assets";
import { Divider } from "react-native-paper";
import { SCALE, wp } from "../designing/responsiveDesigns";

interface CreatePostScreenProps {
  navigation: any;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const CreatePostScreen: React.FC<CreatePostScreenProps> = ({ navigation }) => {
  const styles = useResponsive(baseStyles);
  const [postText, setPostText] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedAchievement, setSelectedAchievement] =
    useState<Achievement | null>(null);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [showUnlockedModal, setShowUnlockedModal] = useState(false);

  // Mock achievements data
  const achievements: Achievement[] = [
    {
      id: "1",
      title: "First Steps",
      description: "Complete first workout",
      icon: "🏃‍♂️",
    },
    {
      id: "2",
      title: "Century Club",
      description: "Reach the 100 workout",
      icon: "💯",
    },
    {
      id: "3",
      title: "Community Leader",
      description: "Create your first group",
      icon: "👥",
    },
  ];

  const handleBack = () => {
    navigation.goBack();
  };

  const openDeviceSettings = () => {
    Linking.openSettings().catch(() => {
      Alert.alert("Error", "Unable to open settings");
    });
  };

  const handleSelectPhoto = () => {
    // Mock image selection - in real app, use ImagePicker
    const mockImage =
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400";
    setSelectedImages([mockImage]);
  };

  const [image, setImage] = useState<string | null>(null);

  const handleSelectAchievement = () => {
    setShowAchievementModal(true);
  };

  const handleAchievementSelect = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setShowAchievementModal(false);
    setShowUnlockedModal(true);
  };

  const handlePost = () => {
    if (!postText.trim() && selectedImages.length === 0) {
      Alert.alert("Error", "Please add some content to your post");
      return;
    }

    Alert.alert("Success", "Post created successfully!", [
      { text: "OK", onPress: () => navigation.goBack() },
    ]);
  };

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(newImages);
  };

  const removeAchievement = () => {
    setSelectedAchievement(null);
  };

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
        </View>
        <Text style={styles.subtitle}>Share your workout or achievement</Text>
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        <Pressable style={styles.shareWorkoutCard} onPress={() => {}}>
          <Text style={styles.shareWorkoutText}>Share Workout?</Text>
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
                placeholder="What's on your mind?"
                placeholderTextColor={COLORS._5E5E5E}
                value={postText}
                onChangeText={setPostText}
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleSelectPhoto}
              >
                <Image source={Media} style={styles.actionButtonImage} />
                <Text style={[styles.actionButtonText, { marginLeft: 5 }]}>
                  Photo/Video
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleSelectAchievement}
              >
                <Image source={Achievement} style={styles.actionButtonImage} />
                <Text style={[styles.actionButtonText, { marginLeft: 2 }]}>
                  Achievement
                </Text>
              </TouchableOpacity>
            </View>

            {/* Selected Achievement */}
            {selectedAchievement && (
              <View style={styles.achievementContainer}>
                <View style={styles.achievementHeader}>
                  <Text style={styles.achievementTitle}>
                    ACHIEVEMENT UNLOCKED!
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
            {selectedImages.length > 0 && (
              <View style={styles.imagesContainer}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={styles.imagesTitle}>Uploaded Image</Text>
                  <Pressable onPress={() => removeImage(0)}>
                    <Text
                      style={[styles.imagesTitle, { color: COLORS._FF1616 }]}
                    >
                      Remove
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.imageWrapper}>
                  <Image
                    source={{ uri: selectedImages[0] }}
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
                  <Text style={styles.modalTitle}>Select an Achievement</Text>
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

          <TouchableOpacity style={styles.postButton} onPress={handlePost}>
            <Text style={styles.postButtonText}>Post</Text>
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
    marginLeft: 32, // Align with the title (back button width + margin)
  },
  textInputContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 130,
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
    color: COLORS._5E5E5E,
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
    letterSpacing: 1,
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
});

export default CreatePostScreen;
