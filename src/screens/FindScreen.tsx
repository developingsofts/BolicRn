import React, { use, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
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
  useUnfollowUserMutation,
} from "../services/api/followsApi";
import FontWeight from "../hooks/useInterFonts";

function mapToSwipeableItem(item: any): SwipeableItem {
  console.log(
    "mapToSwipeableItem item:",
    item,
    item.name,
    item.imageUrl,
    item.profilePicture,
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
    tab === "FindTrainers" ? "trainers" : "partners",
  );
  const [menuVisible, setMenuVisible] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedUserForRating, setSelectedUserForRating] = useState<{
    id: string;
    name: string;
    imageUrl?: string | null;
    type: "partner" | "trainer";
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [partnersPage, setPartnersPage] = useState(1);
  const [trainersPage, setTrainersPage] = useState(1);

  const [skippedCount, setSkippedCount] = useState(0);

  const [followUser] = useFollowUserMutation();
  const [unfollowUser] = useUnfollowUserMutation();

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

  useFocusEffect(
    useCallback(() => {
      if (activeTab === "partners") {
        refetchPartners();
      } else {
        refetchTrainers();
      }
    }, [activeTab, refetchPartners, refetchTrainers])
  );

  const getCurrentData = () => {
    let data: any[] = [];
    if (activeTab === "partners") {
      data = partnersData ?? [];
    } else {
      data = trainersData ?? [];
    }

    data = data.filter(
      (item: any) => item && item.id && !removedIds.includes(item.id),
    );

    if (selectedFilters.includes("All") || selectedFilters.length === 0) {
      return data;
    }
    return data.filter((item: any) => {
      const type =
        activeTab === "partners"
          ? item.trainingTypes?.join(", ")
          : item.specialty || item.trainingTypes?.join(", ");
      return selectedFilters.some((filter) =>
        type?.toLowerCase().includes(filter.toLowerCase()),
      );
    });
  };

  useEffect(() => {
    const currentData = getCurrentData();
    const remainingCards = currentData.length - currentIndex;

    if (remainingCards <= 2 && remainingCards > 0) {
      if (activeTab === "partners" && !isFetchingPartners) {
        console.log("useEffect 1 partners");

        setPartnersPage((prev) => prev + 1);
      } else if (activeTab === "trainers" && !isFetchingTrainers) {
        console.log("useEffect 1 trainers");

        setTrainersPage((prev) => prev + 1);
      }
    }
  }, [currentIndex, activeTab, getCurrentData().length]);

  useEffect(() => {
    const currentData = getCurrentData();
    const hasReachedEnd = currentData.length === 0 || !currentItem;

    if (hasReachedEnd && skippedCount > 0) {
      const refetchData = async () => {
        if (activeTab === "partners") {
          console.log("useEffect 2 partners");

          await refetchPartners();
        } else {
          console.log("useEffect 2 trainers");

          await refetchTrainers();
        }
        setRemovedIds([]);
        setCurrentIndex(0);
        setSkippedCount(0);
      };

      refetchData();
    }
  }, [currentIndex, skippedCount, activeTab, getCurrentData().length]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setRemovedIds([]);
    setSkippedCount(0);

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

  const [swipeUser, { isLoading: isSwipingUser }] = useSwipeUserMutation();

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
    }
  };

  const handleSkip = async (item: SwipeableItem) => {
    setSkippedCount((prev) => prev + 1);
    setRemovedIds((prev) => [...prev, item.id]);
    setCurrentIndex((prev) => Math.min(prev, getCurrentData().length - 1));
  };

  const handleSwipeRight = async (item: SwipeableItem) => {
    try {
      const response = await swipeUser({ swipedToId: item.id, type: "Liked" });
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
                  Math.min(prev, getCurrentData().length - 1),
                );
              },
            },
            {
              text: STRINGS.FIND.alerts.rateExperience,
              onPress: () => {
                setSelectedUserForRating({
                  id: String(item.id),
                  name: item.name,
                  imageUrl: item.imageUrl || null,
                  type: activeTab === "partners" ? "partner" : "trainer",
                });
                setRatingModalVisible(true);
                setRemovedIds((prev) => [...prev, item.id]);
                setCurrentIndex((prev) =>
                  Math.min(prev, getCurrentData().length - 1),
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
                }
                setRemovedIds((prev) => [...prev, item.id]);
                setCurrentIndex((prev) =>
                  Math.min(prev, getCurrentData().length - 1),
                );
              },
            },
          ],
        );
      }
    } catch (error) {
      console.error("Swipe right error:", error);
    }
  };

  const resetCards = () => {
    setCurrentIndex(0);
    setSkippedCount(0);
  };

  const closeRatingModal = () => {
    setRatingModalVisible(false);
    setSelectedUserForRating(null);
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
    setSkippedCount(0);
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
                        setSkippedCount(0);
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
                        setSkippedCount(0);
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
                key={currentItem?.id}
                partner={mapToSwipeableItem(currentItem)}
                onPress={() =>
                  navigation.navigate("UserProfile", {
                    user: currentItem,
                    isGuest: true,
                  })
                }
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
                onSkip={handleSkip}
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
            </View>
          )}
        </View>
      </RefreshableScrollView>

      {selectedUserForRating && (
        <RatingModal
          visible={ratingModalVisible}
          onClose={closeRatingModal}
          rateeId={selectedUserForRating.id}
          name={selectedUserForRating.name}
          imageUrl={selectedUserForRating.imageUrl}
          role={selectedUserForRating.type}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    color: COLORS.black,
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
    color: COLORS.text,
  },
  noMoreCardsText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: DIMENSIONS.spacing.lg,
    color: COLORS.textSecondary,
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
