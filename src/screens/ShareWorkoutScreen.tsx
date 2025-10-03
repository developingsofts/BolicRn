import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Pressable,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, DIMENSIONS } from "../config/constants";
import STRINGS from "../config/strings";
import { Achievement, ImageFile, LeftArrow, Media, Close } from "../../assets";
import FontWeight from "../hooks/useInterFonts";
import { Divider } from "react-native-paper";

type Workout = {
  id: string;
  name: string;
  type: string;
  difficulty: string;
  completedDate: string;
  time: string;
};

const mockWorkouts: Workout[] = [
  {
    id: "1",
    name: "Upper Body Power",
    type: "Strength",
    difficulty: "Medium",
    completedDate: "Yesterday",
    time: "45 mins",
  },
  {
    id: "2",
    name: "Morning Cardio",
    type: "Cardio",
    difficulty: "Easy",
    completedDate: "2 days ago",
    time: "30 mins",
  },
];

interface ShareWorkoutScreenProps {
  navigation: any;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const ShareWorkoutScreen: React.FC<ShareWorkoutScreenProps> = ({
  navigation,
}) => {
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [postText, setPostText] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showAchievementModal, setShowAchievementModal] = useState(false);

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

  const handleSelectPhoto = () => {
    // Mock image selection - in real app, use ImagePicker
    const mockImage = "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400";
    setSelectedImages([mockImage]);
  };

  const handleSelectAchievement = () => {
    setShowAchievementModal(true);
  };

  const handleAchievementSelect = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setShowAchievementModal(false);
  };

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(newImages);
  };

  const removeAchievement = () => {
    setSelectedAchievement(null);
  };

  const handlePost = () => {
    if (!postText.trim() && selectedImages.length === 0 && !selectedWorkout) {
      Alert.alert(STRINGS.COMMON.error, STRINGS.CREATE_POST.errors.addContent);
      return;
    }

    Alert.alert(STRINGS.COMMON.success, STRINGS.CREATE_POST.success.postCreated, [
      { text: STRINGS.COMMON.ok, onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      {/* Top Bar */}
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.background,
        }}
      >
        <View style={styles.topBar}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "flex-start",
              width: "100%",
              gap: 12,
            }}
          >
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
            >
              <Image source={LeftArrow} style={{ width: 35, height: 35, alignSelf:"flex-start" }} />
            </TouchableOpacity>
            <View>
              <Text style={styles.heading}>{STRINGS.SHARE_WORKOUT.title}</Text>
              <Text
                style={{
                  fontSize: 14,
                  color: COLORS.white,
                  marginTop: 8,
                  fontFamily: FontWeight.Medium,
                }}
              >
                {STRINGS.SHARE_WORKOUT.subtitle}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {mockWorkouts.map((workout) => (
            <TouchableOpacity
              key={workout.id}
              style={[
                styles.workoutCard,
                selectedWorkout?.id === workout.id &&
                  styles.selectedWorkoutCard,
              ]}
              onPress={() => setSelectedWorkout(workout)}
            >
              <Text style={styles.workoutName}>{workout.name}</Text>
              <View style={styles.workoutDetailsRow}>
                <View
                  style={{
                    backgroundColor: "rgba(11, 128, 255, 0.1)",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                    alignSelf: "flex-start",
                  }}
                >
                  <Text style={styles.workoutType}>{workout.type}</Text>
                </View>
                <Text style={styles.workoutDetail}>{workout.time}</Text>
                <Text style={styles.workoutDetail}>{workout.difficulty}</Text>
              </View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "400",
                  color: COLORS._5E5E5E,
                  fontFamily: FontWeight.Regular,
                }}
              >
                {STRINGS.SHARE_WORKOUT.completed} {workout.completedDate}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Post Area */}
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
                  {STRINGS.CREATE_POST.photoVideo}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleSelectAchievement}
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
            {selectedImages.length > 0 && (
              <View style={styles.imagesContainer}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={styles.imagesTitle}>{STRINGS.CREATE_POST.uploadedImage}</Text>
                  <Pressable onPress={() => removeImage(0)}>
                    <Text
                      style={[styles.imagesTitle, { color: COLORS._FF1616 }]}
                    >
                      {STRINGS.COMMON.remove}
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
        

          <TouchableOpacity style={styles.postButton} onPress={handlePost}>
            <Text style={styles.postButtonText}>{STRINGS.CREATE_POST.post}</Text>
          </TouchableOpacity>
        </View>

        
        </ScrollView>

        {/* Achievement Selection Modal */}
        <Modal
          visible={showAchievementModal}
          transparent
          statusBarTranslucent
          navigationBarTranslucent
          animationType="slide"
          onRequestClose={() => setShowAchievementModal(false)}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => setShowAchievementModal(false)}
          >
            <Pressable 
              style={styles.modalContent}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{STRINGS.CREATE_POST.selectAchievement}</Text>
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
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gradient3,
  },
  topBar: {
    flexDirection: "column",
    alignItems: "flex-start",
    paddingHorizontal: 10,
    paddingTop: DIMENSIONS.spacing.md,
    paddingBottom: DIMENSIONS.spacing.md,
    backgroundColor: COLORS.gradient3,
  },
  backBtn: {
    padding: 4,
  },
  heading: {
    fontSize: 24,
    fontWeight: 600,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.white,
  },
  scrollContent: {
    padding: DIMENSIONS.spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: COLORS.primary,
  },
  workoutCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    boxShadow: "0px 0px 8px 0px rgba(107, 107, 107, 0.15)",
    borderColor: COLORS._E6E6E7,
  },
  selectedWorkoutCard: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  workoutInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: FontWeight.SemiBold,
    color: COLORS.app_black,
  },
  workoutType: {
    fontSize: 12,
    color: "rgba(11, 128, 255, 1)",
    fontWeight: "400",
    fontFamily: FontWeight.Medium,
  },
  workoutDetailsRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-start",
    alignItems: "center",
    marginVertical: 6,
  },
  workoutDetail: {
    fontSize: 12,
    color: COLORS.app_black,
    fontFamily: FontWeight.Medium,
    fontWeight: "500",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 18,
    marginBottom: 6,
    color: COLORS.app_black,
  },
  textArea: {
    minHeight: 130,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS._D9D9D9,
    backgroundColor: COLORS.white,
    textAlignVertical: "top",
    padding: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    justifyContent: "space-between",
    marginVertical: 18,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
  },
  actionBtnText: {
    marginLeft: 6,
    color: COLORS.black,
    fontWeight: "500",
    fontSize: 14,
  },
  postBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 14,
  },
  postBtnText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 16,
  },
  // Post Area Styles (copied from CreatePostScreen)
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
  actionButtonImage: {
    width: 25,
    height: 25,
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
  closeIcon: {
    width: 25,
    height: 25,
  },
});

export default ShareWorkoutScreen;
