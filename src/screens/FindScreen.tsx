import React, { use, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import RefreshableScrollView from "../components/RefreshableScrollView";
import { Menu, Button, Chip } from "react-native-paper";
import { COLORS, DIMENSIONS } from "../config/constants";
import STRINGS from "../config/strings";
import SwipeableCard, {
  TrainingPartner,
  Trainer,
  SwipeableItem,
} from "../components/SwipeableCard";
import RatingModal from "../components/RatingModal";
import { SafeAreaView } from "react-native-safe-area-context";
import BasicTopBar from "../components/BasicTopBar";
import {
  matchingApi,
  useGetPotentialMatchesQuery,
  useGetPotentialTrainersQuery,
  useGetPotentialUsersQuery,
  useSwipeUserMutation,
} from "../services/api/matchingApi";
import {
  useFollowUserMutation,
  useGetFollowingQuery,
  useUnfollowUserMutation,
} from "../services/api/followsApi";
import FontWeight from "../hooks/useInterFonts";

// Helper to map API user to SwipeableItem
function mapToSwipeableItem(item: any): SwipeableItem {
  console.log(
    "mapToSwipeableItem item:",
    item,
    item.name,
    item.imageUrl,
    item.profilePicture
  );
  if (item.role === "user") {
    return {
      id: item.id,
      name: item.displayName || item.name || "",
      age: item.age,
      type: item.trainingTypes?.[0] || "",
      trainingTypes: item.trainingTypes || [],
      distance: item.distance ? String(item.distance) : "",
      compatibility: item.compatibility ?? 0,
      bio: item.bio,
      location: item.location,
      experience: item.experienceLevel || item.experience,
      rating: item.rating,
      totalRatings: item.totalRatings,
      imageUrl: item.profilePicture || item.imageUrl || "",
    } as TrainingPartner;
  } else {
    return {
      id: item.id,
      name: item.displayName || item.name || "",
      age: item.age,
      specialty: item.specialty || item.trainingTypes?.[0] || "",
      trainingTypes: item.trainingTypes || [],
      distance: item.distance ? String(item.distance) : "",
      rating: item.rating,
      hourlyRate: item.hourlyRate || "",
      bio: item.bio,
      location: item.location,
      experience: item.experienceLevel || item.experience,
      certifications: item.certifications || [],
      totalRatings: item.totalRatings,
      imageUrl: item.profilePicture || item.imageUrl || "",
    } as Trainer;
  }
}

interface FindScreenProps {
  navigation: any;
  route: any;
}

const FindScreen: React.FC<FindScreenProps> = ({ navigation, route }) => {
  const [selectedFilters, setSelectedFilters] = useState<string[]>(["All"]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [removedIds, setRemovedIds] = useState<number[]>([]);
  const tab = route?.params?.tab || "FindPartners";
  const [activeTab, setActiveTab] = useState<"partners" | "trainers">(
    tab === "FindTrainers" ? "trainers" : "partners"
  );
  const [menuVisible, setMenuVisible] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedUserForRating, setSelectedUserForRating] = useState<{
    name: string;
    type: "partner" | "trainer";
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [partnersPage, setPartnersPage] = useState(1);
  const [trainersPage, setTrainersPage] = useState(1);

  const [followUser] = useFollowUserMutation();
  const [unfollowUser] = useUnfollowUserMutation();

  // const {
  //   data: potentialData,
  //   refetch,
  //   isLoading,
  //   isFetching,
  //   error,
  // } = useGetPotentialMatchesQuery();

  const {
    data: partners,
    refetch: refetchPartners,
    isLoading: isLoadingPartners,
    isFetching: isFetchingPartners,
  } = useGetPotentialUsersQuery({ page: 1, limit: 10 });

  const {
    data: trainers,
    refetch: refetchTrainers,
    isLoading: isLoadingTrainers,
    isFetching: isFetchingTrainers,
  } = useGetPotentialTrainersQuery({ page: 1, limit: 10 });

  const partnersData = partners?.status === true ? partners?.data?.users : [];

  const trainersData = trainers?.status === true ? trainers?.data?.users : [];

  // const getCurrentData = () => {
  //   if (!potentialData || potentialData.status !== true) return [];
  //   let data = potentialData.data.filter(
  //     (item: any) =>
  //       item && item.id && item.role && !removedIds.includes(item.id)
  //   ); // Filter out invalid items and removed
  //   if (activeTab === "partners") {
  //     data = data.filter((item: any) => item.role === "user");
  //   } else {
  //     data = data.filter((item: any) => item.role === "trainer");
  //   }
  //   if (selectedFilters.includes("All") || selectedFilters.length === 0) {
  //     return data;
  //   }
  //   return data.filter((item: any) => {
  //     const type =
  //       activeTab === "partners"
  //         ? item.trainingTypes?.join(", ")
  //         : item.specialty || item.trainingTypes?.join(", ");
  //     return selectedFilters.some((filter) =>
  //       type?.toLowerCase().includes(filter.toLowerCase())
  //     );
  //   });
  // };

  const getCurrentData = () => {
    // Use the correct data source based on the active tab
    let data: any[] = [];
    if (activeTab === "partners") {
      data = partnersData ?? [];
    } else {
      data = trainersData ?? [];
    }

    // Filter out removed and invalid items
    data = data.filter(
      (item: any) => item && item.id && !removedIds.includes(item.id)
    );

    // Apply filters
    if (selectedFilters.includes("All") || selectedFilters.length === 0) {
      return data;
    }
    return data.filter((item: any) => {
      const type =
        activeTab === "partners"
          ? item.trainingTypes?.join(", ")
          : item.specialty || item.trainingTypes?.join(", ");
      return selectedFilters.some((filter) =>
        type?.toLowerCase().includes(filter.toLowerCase())
      );
    });
  };

  useEffect(() => {
    const currentData = getCurrentData();
    const remainingCards = currentData.length - currentIndex;

    // Fetch more data when we're down to the last 2 cards
    if (remainingCards <= 2 && remainingCards > 0) {
      if (activeTab === "partners" && !isFetchingPartners) {
        setPartnersPage((prev) => prev + 1);
      } else if (activeTab === "trainers" && !isFetchingTrainers) {
        setTrainersPage((prev) => prev + 1);
      }
    }
  }, [currentIndex, activeTab, getCurrentData().length]);

  const handleFollow = async () => {
    const targetUserId = currentItem?.id;
    if (!targetUserId) return;
    try {
      await followUser({ followUserId: targetUserId });
    } catch (error) {
      console.error("Follow error:", error);
    }
  };

  const handleUnfollow = async () => {
    const targetUserId = currentItem?.id;
    if (!targetUserId) return;
    try {
      await unfollowUser({ unfollowUserId: targetUserId });
    } catch (error) {
      console.error("Unfollow error:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setRemovedIds([]);
    if (activeTab === "partners") {
      setPartnersPage(1);
      await refetchPartners();
    } else {
      setTrainersPage(1);
      await refetchTrainers();
    }
    setCurrentIndex(0);
    setRefreshing(false);
  };
  // const handleRefresh = async () => {
  //   setRefreshing(true);
  //   setCurrentIndex(0);
  //   setTimeout(() => setRefreshing(false), 1000);
  // };

  const trainingCategories = [
    "All",
    "Strength Training",
    "Cardio",
    "Yoga",
    "CrossFit",
    "HIIT",
    "Pilates",
    "Running",
    "Cycling",
    "Swimming",
    "Boxing",
    "Martial Arts",
    "Dance",
    "Nearby",
  ];

  const mockPartners: TrainingPartner[] = [
    {
      id: 1,
      name: "Alex",
      age: 28,
      type: "Strength Training",
      distance: "2.3km",
      compatibility: 95,
      location: "Downtown Gym",
      experience: "3 years",
      bio: "Passionate about powerlifting and helping others reach their fitness goals. Looking for a serious training partner!",
      rating: 4.8,
      totalRatings: 24,
    },
    {
      id: 2,
      name: "Sarah",
      age: 25,
      type: "Cardio & HIIT",
      distance: "1.8km",
      compatibility: 87,
      location: "Central Park",
      experience: "2 years",
      bio: "Love running and high-intensity workouts. Always up for a challenge and pushing limits together!",
      rating: 4.6,
      totalRatings: 18,
    },
    {
      id: 3,
      name: "Mike",
      age: 30,
      type: "CrossFit",
      distance: "3.1km",
      compatibility: 92,
      location: "CrossFit Box",
      experience: "4 years",
      bio: "CrossFit enthusiast looking for someone to tackle WODs with. Let's get stronger together!",
      rating: 4.9,
      totalRatings: 31,
    },
    {
      id: 4,
      name: "Emma",
      age: 27,
      type: "Yoga & Pilates",
      distance: "1.2km",
      compatibility: 78,
      location: "Yoga Studio",
      experience: "5 years",
      bio: "Yoga instructor seeking a mindful training partner. Balance strength with flexibility!",
      rating: 4.7,
      totalRatings: 22,
    },
    {
      id: 5,
      name: "David",
      age: 32,
      type: "Mixed Training",
      distance: "4.5km",
      compatibility: 89,
      location: "Fitness Center",
      experience: "6 years",
      bio: "Versatile trainer who enjoys mixing different styles. Let's create the perfect workout routine!",
      rating: 4.5,
      totalRatings: 15,
    },
  ];

  const mockTrainers: Trainer[] = [
    {
      id: 101,
      name: "Coach Maria",
      age: 35,
      specialty: "Strength & Conditioning",
      distance: "1.5km",
      rating: 4.9,
      hourlyRate: "$75/hr",
      location: "Elite Fitness Center",
      experience: "8 years",
      bio: "Certified strength coach specializing in functional training and injury prevention. Let's build strength together!",
      certifications: ["NASM", "ACE", "CrossFit L2"],
      totalRatings: 47,
    },
    {
      id: 102,
      name: "Trainer James",
      age: 29,
      specialty: "HIIT & Cardio",
      distance: "2.1km",
      rating: 4.7,
      hourlyRate: "$65/hr",
      location: "Cardio Studio",
      experience: "5 years",
      bio: "HIIT specialist who loves pushing limits and achieving results. Ready to transform your fitness journey!",
      certifications: ["ACE", "HIIT Specialist"],
      totalRatings: 33,
    },
    {
      id: 103,
      name: "Yoga Master Lisa",
      age: 42,
      specialty: "Yoga & Mindfulness",
      distance: "0.8km",
      rating: 4.8,
      hourlyRate: "$80/hr",
      location: "Zen Yoga Studio",
      experience: "12 years",
      bio: "Experienced yoga instructor focusing on mindfulness, flexibility, and stress relief. Find your inner peace.",
      certifications: ["RYT-500", "Meditation Teacher"],
      totalRatings: 89,
    },
    {
      id: 104,
      name: "CrossFit Pro Tom",
      age: 31,
      specialty: "CrossFit & Olympic Lifting",
      distance: "3.2km",
      rating: 4.6,
      hourlyRate: "$70/hr",
      location: "CrossFit Box",
      experience: "6 years",
      bio: "CrossFit Level 2 trainer passionate about Olympic lifting and functional fitness. Let's crush some WODs!",
      certifications: ["CrossFit L2", "USA Weightlifting"],
      totalRatings: 56,
    },
    {
      id: 105,
      name: "Nutrition Coach Anna",
      age: 28,
      specialty: "Nutrition & Wellness",
      distance: "1.9km",
      rating: 4.9,
      hourlyRate: "$85/hr",
      location: "Wellness Center",
      experience: "4 years",
      bio: "Holistic nutrition coach combining fitness and nutrition for complete wellness transformation.",
      certifications: ["Precision Nutrition", "Wellness Coach"],
      totalRatings: 42,
    },
  ];

  // const handleSwipeLeft = (item: SwipeableItem) => {
  //   const currentData = activeTab === "partners" ? mockPartners : mockTrainers;
  //   setCurrentIndex((prev) => Math.min(prev + 1, currentData.length - 1));
  // };
  const [swipeUser, { isLoading: isSwipingUser }] = useSwipeUserMutation();

  const handleSwipeLeft = async (item: SwipeableItem) => {
    try {
      const response = await swipeUser({
        swipedToId: item.id,
        type: "Disliked",
      });
      if (response?.data?.status === true) {
        setRemovedIds((prev) => [...prev, item.id]);
        setCurrentIndex((prev) => Math.min(prev, getCurrentData().length - 1));
      }
    } catch (error) {
      console.error("Swipe left error:", error);
      // setCurrentIndex((prev) => Math.min(prev + 1, getCurrentData().length - 1));
    }
  };

  const handleSwipeRight = async (item: SwipeableItem) => {
    try {
      const response = await swipeUser({ swipedToId: item.id, type: "Liked" });
      // Only show alert if API call is successful and status is true
      if (response?.data?.status === true) {
        const message =
          activeTab === "partners"
            ? `${STRINGS.FIND.alerts.youAnd} ${item.name} ${STRINGS.FIND.alerts.matchMessage}`
            : `${STRINGS.FIND.alerts.greatChoice} ${item.name} ${STRINGS.FIND.alerts.bookTrainerMessage}`;

        Alert.alert(
          activeTab === "partners"
            ? STRINGS.FIND.alerts.matchTitle
            : STRINGS.FIND.alerts.bookTrainerTitle,
          message,
          [
            {
              text: STRINGS.FIND.alerts.notNow,
              style: "cancel",
              onPress: () => {
                setRemovedIds((prev) => [...prev, item.id]);
                setCurrentIndex((prev) =>
                  Math.min(prev, getCurrentData().length - 1)
                );
              },
            },
            {
              text: STRINGS.FIND.alerts.rateExperience,
              onPress: () => {
                setSelectedUserForRating({
                  name: item.name,
                  type: activeTab === "partners" ? "partner" : "trainer",
                });
                setRatingModalVisible(true);
                setRemovedIds((prev) => [...prev, item.id]);
                setCurrentIndex((prev) =>
                  Math.min(prev, getCurrentData().length - 1)
                );
              },
            },
            {
              text:
                activeTab === "partners"
                  ? STRINGS.FIND.alerts.startChat
                  : STRINGS.FIND.alerts.bookSession,
              onPress: () => {
                if (activeTab === "partners") {
                  navigation.navigate("Chat", {
                    partnerId: item.id.toString(),
                    partnerName: item.name,
                  });
                } else {
                  navigation?.navigate?.("BookTrainer", {
                    trainerId: String(item.id),
                    trainerName: item.name,
                    trainerAddress: item.location || "",
                  });
                  // Handle trainer booking
                  // Alert.alert(
                  //   STRINGS.FIND.alerts.bookingTitle,
                  //   `${STRINGS.FIND.alerts.bookingMessage} ${item.name}`
                  // );
                }
                setRemovedIds((prev) => [...prev, item.id]);
                setCurrentIndex((prev) =>
                  Math.min(prev, getCurrentData().length - 1)
                );
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error("Swipe right error:", error);
      // setCurrentIndex((prev) => Math.min(prev + 1, getCurrentData().length - 1));
    }
  };

  const resetCards = () => {
    setCurrentIndex(0);
  };

  const handleRatingSubmit = (rating: number, comment: string) => {
    if (selectedUserForRating) {
      Alert.alert(
        STRINGS.FIND.alerts.ratingSubmittedTitle,
        `${STRINGS.FIND.alerts.ratingSubmittedMessage} ${selectedUserForRating.name} ${STRINGS.FIND.alerts.withStars} ${rating} ${STRINGS.FIND.alerts.stars}`,
        [{ text: STRINGS.COMMON.ok }]
      );
      // Here you would typically save the rating to your backend
    }
  };

  const handleCategorySelect = (category: string) => {
    if (category === "All") {
      setSelectedFilters(["All"]);
    } else {
      setSelectedFilters((prev) => {
        const newFilters = prev.filter((f) => f !== "All");
        if (newFilters.includes(category)) {
          return newFilters.filter((f) => f !== category);
        } else {
          return [...newFilters, category];
        }
      });
    }
    setCurrentIndex(0);
  };

  const currentData = getCurrentData();
  const currentItem = currentData[currentIndex];
  const hasMoreCards = currentIndex < currentData.length - 1;
  const isLoading = isLoadingPartners || isLoadingTrainers;

  const isFetching = isFetchingPartners || isFetchingTrainers;

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <RefreshableScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      >
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <BasicTopBar
            showBackButton={false}
            title="Find Partners & Trainers"
            subtitle="Swipe to discover"
            containerStyle={{ paddingVertical: DIMENSIONS.spacing.xxl }}
            bottomView={
              <View style={styles.tabContainerWrapper}>
                <View style={styles.tabContainer}>
                  {
                    <TouchableOpacity
                      style={[
                        styles.tabButton,
                        activeTab === "partners" &&
                          styles.tabButtonActivePartners,
                      ]}
                      onPress={() => {
                        setActiveTab("partners");
                        setCurrentIndex(0);
                        setSelectedFilters(["All"]);
                      }}
                    >
                      <Text
                        style={[
                          styles.tabText,
                          activeTab === "partners" && styles.tabTextActive,
                        ]}
                      >
                        {STRINGS.FIND.partners}
                      </Text>
                    </TouchableOpacity>
                  }
                  {
                    <TouchableOpacity
                      style={[
                        styles.tabButton,
                        activeTab === "trainers" &&
                          styles.tabButtonActiveTrainers,
                      ]}
                      onPress={() => {
                        setActiveTab("trainers");
                        setCurrentIndex(0);
                        setSelectedFilters(["All"]);
                      }}
                    >
                      <Text
                        style={[
                          styles.tabText,
                          activeTab === "trainers" && styles.tabTextActive,
                        ]}
                      >
                        {STRINGS.FIND.trainers}
                      </Text>
                    </TouchableOpacity>
                  }
                </View>
              </View>
            }
          />
        </View>

        {/* Cards Section */}
        <View style={styles.cardsSection}>
          {isLoading && currentData.length === 0 ? (
            <View
              style={{
                padding: 20,
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
              }}
            >
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={{ marginTop: 10, color: COLORS.textSecondary }}>
                Finding matches...
              </Text>
            </View>
          ) : currentItem && currentItem.id ? (
            <>
              <SwipeableCard
                partner={mapToSwipeableItem(currentItem)}
                onPress={() =>
                  navigation.navigate("UserProfile", {
                    user: currentItem,
                    isGuest: true,
                  })
                }
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
                onSkip={handleSwipeLeft}
                isFirst={true}
                isFollowing={currentItem.isFollowing}
                navigation={navigation}
                onFollow={handleFollow}
                onUnfollow={handleUnfollow}
              />
              {isFetching && currentData.length - currentIndex <= 3 && (
                <View style={styles.loadingMoreContainer}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.loadingMoreText}>Loading more...</Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.noMoreCards}>
              <Text style={styles.noMoreCardsTitle}>
                {STRINGS.FIND.noMoreCardsTitle}
              </Text>
              <Text style={styles.noMoreCardsText}>
                {STRINGS.FIND.noMoreCardsText} {activeTab}{" "}
                {STRINGS.FIND.forThisFilter}
              </Text>
              {/* <TouchableOpacity style={styles.resetButton} onPress={resetCards}>
                <Text style={styles.resetButtonText}>{STRINGS.FIND.reset}</Text>
              </TouchableOpacity> */}
            </View>
          )}
        </View>
      </RefreshableScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerContainer: {
    marginBottom: DIMENSIONS.spacing.md,
    position: "relative",
    zIndex: 20,
  },
  tabContainerWrapper: {
    // position: "absolute",
    top: 25,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 50,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tabButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderRadius: 50,
    paddingVertical: 13,
    alignItems: "center",
  },
  tabButtonActivePartners: {
    backgroundColor: COLORS.primary,
  },
  tabButtonActiveTrainers: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 16,
    color: COLORS._5E5E5E,
    fontFamily: FontWeight.Medium,
  },
  tabTextActive: {
    color: COLORS.white,
    fontFamily: FontWeight.Medium,
    fontSize: 16,
  },
  filtersSection: {
    paddingHorizontal: DIMENSIONS.spacing.lg,
    marginBottom: DIMENSIONS.spacing.lg,
  },
  dropdownContainer: {
    alignItems: "center",
    marginBottom: DIMENSIONS.spacing.sm,
  },
  chipsWrapper: {
    minHeight: 40,
    justifyContent: "center",
  },
  dropdownButton: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: DIMENSIONS.borderRadius,
    minWidth: 200,
  },
  dropdownButtonContent: {
    paddingVertical: DIMENSIONS.spacing.sm,
  },
  dropdownButtonLabel: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "500",
  },
  menuItemText: {
    fontSize: 14,
    color: COLORS.text,
  },
  menuItemTextActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  selectedChipsContainer: {
    paddingHorizontal: DIMENSIONS.spacing.lg,
    height: 40,
  },
  selectedChip: {
    marginRight: DIMENSIONS.spacing.sm,
    backgroundColor: COLORS.background,
    borderColor: COLORS.primary,
  },
  selectedChipText: {
    fontSize: 12,
    color: COLORS.primary,
  },
  cardsSection: {
    minHeight: 550,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: DIMENSIONS.spacing.lg,
    marginTop: DIMENSIONS.spacing.lg,
  },
  noMoreCards: {
    alignItems: "center",
    justifyContent: "center",
    padding: DIMENSIONS.spacing.xl,
  },
  noMoreCardsTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: DIMENSIONS.spacing.md,
  },
  noMoreCardsText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: DIMENSIONS.spacing.lg,
  },
  resetButton: {
    borderRadius: DIMENSIONS.borderRadius,
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingVertical: DIMENSIONS.spacing.md,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  progressContainer: {
    alignItems: "center",
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingVertical: DIMENSIONS.spacing.md,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "600",
  },
  loadingMoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: DIMENSIONS.spacing.md,
    padding: DIMENSIONS.spacing.sm,
  },
  loadingMoreText: {
    marginLeft: DIMENSIONS.spacing.sm,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});

export default FindScreen;
