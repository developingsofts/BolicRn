import React, { useState, useEffect, useMemo, useRef } from "react";
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
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, DIMENSIONS } from "../config/constants";
import { REFRESH_INDICATOR_PROPS } from "../components/RefreshableScrollView";
import STRINGS from "../config/strings";
import { Achievement, ImageFile, LeftArrow, Media, Close } from "../../assets";
import FontWeight from "../hooks/useInterFonts";
import { Divider } from "react-native-paper";
import BasicTopBar from "../components/BasicTopBar";
import * as ImagePicker from "expo-image-picker";
import { Toast } from "../components/ToastManager";
import {
  useGetUserWorkoutsQuery,
  useGetUserAchievementsQuery,
} from "../services/api/workoutApi";
import { useCreatePostMutation } from "../services/api/postsApi";
import { useAuth } from "../contexts/AuthContext";
import type { UserWorkout, Achievement as AchievementType } from "../types";

interface ShareWorkoutScreenProps {
  navigation: any;
}

const ShareWorkoutScreen: React.FC<ShareWorkoutScreenProps> = ({
  navigation,
}) => {
  const [selectedWorkout, setSelectedWorkout] = useState<UserWorkout | null>(
    null,
  );
  const [postText, setPostText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<any>(null);
  const [selectedAchievement, setSelectedAchievement] =
    useState<AchievementType | null>(null);
  const [showAchievementModal, setShowAchievementModal] = useState(false);

  const { user, isAuthenticated } = useAuth();

  const [page, setPage] = useState(1);
  const [allWorkouts, setAllWorkouts] = useState<UserWorkout[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const isInitialMount = useRef(true);

  const {
    data: workoutsData,
    isLoading: workoutsLoading,
    isFetching,
  } = useGetUserWorkoutsQuery({ page, limit: 3 }, { skip: !isAuthenticated });
  const { data: achievementsData, isLoading: achievementsLoading } =
    useGetUserAchievementsQuery(
      { userId: undefined },
      { skip: !isAuthenticated },
    );
  const [createPost, { isLoading: isCreating }] = useCreatePostMutation();

  const currentPageWorkouts = useMemo(
    () =>
      workoutsData?.status && workoutsData?.data?.workouts
        ? workoutsData.data.workouts
        : [],
    [workoutsData],
  );

  useEffect(() => {
    if (isInitialMount.current && page === 1) {
      setAllWorkouts(currentPageWorkouts);
      isInitialMount.current = false;
    } else {
      setAllWorkouts((prevWorkouts) => {
        const existingIds = new Set(prevWorkouts.map((w) => w.id));
        const newWorkouts = currentPageWorkouts.filter(
          (w) => !existingIds.has(w.id),
        );
        return [...prevWorkouts, ...newWorkouts];
      });
    }
  }, [currentPageWorkouts, page]);
  const pagination =
    workoutsData?.status && workoutsData?.data?.pagination
      ? workoutsData.data.pagination
      : null;
  const achievements: AchievementType[] =
    achievementsData?.status && achievementsData?.data
      ? achievementsData.data
      : [];

  const handleLoadMore = () => {
    if (!isFetching && pagination?.hasMore) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setTimeout(() => setRefreshing(false), 300);
  };

  const renderFooter = () => {
    if (!isFetching) return null;
    return (
      <View style={{ padding: 10, alignItems: "center" }}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

  const handleSelectPhoto = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Toast.error("Please grant camera roll permissions to select images");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedImage(asset.uri);

      let mimeType = "image/jpeg";
      if (asset.uri.endsWith(".png")) mimeType = "image/png";
      else if (asset.uri.endsWith(".jpg") || asset.uri.endsWith(".jpeg"))
        mimeType = "image/jpeg";
      else if (asset.uri.endsWith(".gif")) mimeType = "image/gif";
      else if (asset.uri.endsWith(".webp")) mimeType = "image/webp";

      setImageFile({
        uri: asset.uri,
        type: mimeType,
        name: `workout_${Date.now()}.${mimeType.split("/")[1]}`,
      });
    }
  };

  const handleSelectAchievement = () => {
    setShowAchievementModal(true);
  };

  const handleAchievementSelect = (achievement: AchievementType) => {
    setSelectedAchievement(achievement);
    setShowAchievementModal(false);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImageFile(null);
  };

  const removeAchievement = () => {
    setSelectedAchievement(null);
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("HomeFeed");
    }
  };

  const handlePost = async () => {
    if (!selectedWorkout) {
      Toast.error("Please select a workout to share");
      return;
    }

    if (!postText.trim() && !selectedImage) {
      Toast.error("Please add a caption or photo");
      return;
    }

    try {
      const payload: any = {
        title:
          postText.trim() ||
          `Completed ${selectedWorkout.workout?.title || "workout"}!`,
        type: "workout_share",
        workoutId: selectedWorkout.workoutId,
      };

      if (selectedAchievement) {
        payload.achievementId = selectedAchievement.id;
      }

      if (imageFile) {
        payload.mediaFile = imageFile;
      }

      await createPost(payload).unwrap();

      Toast.success("Workout shared successfully!");

      handleBack();
    } catch (error: any) {
      Toast.error(error?.data?.message || "Failed to share workout");
    }
  };

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.background,
        }}
      >
        <BasicTopBar
          containerStyle={styles.topBar}
          showBackButton={true}
          onBackPress={handleBack}
          title={STRINGS.SHARE_WORKOUT.title}
          subtitle={STRINGS.SHARE_WORKOUT.subtitle}
          titleStyle={styles.heading}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.mainScrollView}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                {...REFRESH_INDICATOR_PROPS}
              />
            }
          >
            {workoutsLoading && page === 1 && (
              <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={{ marginTop: 10, color: COLORS._5E5E5E }}>
                  Loading workouts...
                </Text>
              </View>
            )}

            {!workoutsLoading && allWorkouts.length === 0 && (
              <View
                style={{
                  padding: 20,
                  alignItems: "center",
                  marginHorizontal: DIMENSIONS.spacing.lg,
                }}
              >
                <Text style={{ fontSize: 16, color: COLORS._5E5E5E }}>
                  No completed workouts found
                </Text>
              </View>
            )}

            {!workoutsLoading && allWorkouts.length > 0 && (
              <View style={styles.workoutListContainer}>
                {allWorkouts.map((workout: UserWorkout) => (
                  <TouchableOpacity
                    key={workout.id}
                    style={[
                      styles.workoutCard,
                      selectedWorkout?.id === workout.id &&
                        styles.selectedWorkoutCard,
                    ]}
                    onPress={() => setSelectedWorkout(workout)}
                    disabled={isCreating}
                  >
                    <Text style={styles.workoutName}>
                      {workout.workout?.title || "Workout"}
                    </Text>
                    <View style={styles.workoutDetailsRow}>
                      <View
                        style={{
                          backgroundColor: COLORS.surface,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 12,
                          alignSelf: "flex-start",
                        }}
                      >
                        <Text style={styles.workoutType}>
                          {workout.workout?.difficulty || "Medium"}
                        </Text>
                      </View>
                      <Text style={styles.workoutDetail}>
                        {Math.floor(workout.duration / 60)} mins
                      </Text>
                      <Text style={styles.workoutDetail}>
                        {workout.workout?.difficulty || "Medium"}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "400",
                        color: COLORS._5E5E5E,
                        fontFamily: FontWeight.Regular,
                      }}
                    >
                      {STRINGS.SHARE_WORKOUT.completed}{" "}
                      {new Date(workout.createdAt).toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                ))}

                {pagination?.hasMore && !isFetching && (
                  <TouchableOpacity
                    style={styles.loadMoreButton}
                    onPress={handleLoadMore}
                  >
                    <Text style={styles.loadMoreText}>Load More</Text>
                  </TouchableOpacity>
                )}

                {isFetching && page > 1 && (
                  <View style={{ padding: 10, alignItems: "center" }}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  </View>
                )}
              </View>
            )}

            <View style={styles.content}>
              <View style={styles.textInputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder={STRINGS.CREATE_POST.captionPlaceholder}
                  placeholderTextColor={COLORS._5E5E5E}
                  value={postText}
                  onChangeText={setPostText}
                  multiline
                  textAlignVertical="top"
                  editable={!isCreating}
                />
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleSelectPhoto}
                  disabled={isCreating}
                >
                  <Image source={Media} style={styles.actionButtonImage} />
                  <Text style={[styles.actionButtonText, { marginLeft: 5 }]}>
                    {STRINGS.CREATE_POST.photoVideo}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleSelectAchievement}
                  disabled={isCreating}
                >
                  <Image
                    source={Achievement}
                    style={styles.actionButtonImage}
                  />
                  <Text style={[styles.actionButtonText, { marginLeft: 2 }]}>
                    {STRINGS.CREATE_POST.achievement}
                  </Text>
                </TouchableOpacity>
              </View>

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

              <Divider
                style={{ height: 1.5, backgroundColor: COLORS._C9C9C9 }}
              />

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
                    <Pressable onPress={removeImage} disabled={isCreating}>
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

              <TouchableOpacity
                style={[styles.postButton, isCreating && { opacity: 0.6 }]}
                onPress={handlePost}
                disabled={isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator color={COLORS.black} />
                ) : (
                  <Text style={styles.postButtonText}>
                    {STRINGS.CREATE_POST.post}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {
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

                <ScrollView style={{ maxHeight: 300 }}>
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
        }
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mainScrollView: {
    flex: 1,
  },
  workoutListContainer: {
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingTop: DIMENSIONS.spacing.lg,
  },
  workoutList: {
    maxHeight: 400,
  },
  workoutListContent: {
    padding: DIMENSIONS.spacing.lg,
    paddingBottom: DIMENSIONS.spacing.md,
  },
  loadMoreButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  loadMoreText: {
    color: COLORS.black,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: FontWeight.SemiBold,
  },
  topBar: {
    flexDirection: "column",
    alignItems: "flex-start",
    paddingHorizontal: 10,
    paddingTop: DIMENSIONS.spacing.xxl,
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
    backgroundColor: COLORS.surface,
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
    color: COLORS.primary,
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
    backgroundColor: COLORS.surface,
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
    color: COLORS.text,
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
    color: COLORS.black,
    fontWeight: "700",
    fontSize: 16,
  },
  content: {
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 10,
    marginHorizontal: DIMENSIONS.spacing.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    backgroundColor: COLORS.surface,
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
    color: COLORS.text,
  },
  actionButtonImage: {
    width: 25,
    height: 25,
    tintColor: COLORS.white,
  },
  achievementContainer: {
    backgroundColor: COLORS.surface,
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
    color: COLORS.text,
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
    color: COLORS.black,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: "40%",
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
    tintColor: COLORS.white,
  },
});

export default ShareWorkoutScreen;
