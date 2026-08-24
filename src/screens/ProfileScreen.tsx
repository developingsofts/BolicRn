import React, { useState, useEffect } from "react";
import StatsRow from "../components/StatsRow";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import RefreshableScrollView from "../components/RefreshableScrollView";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../contexts/AuthContext";
import { useAppDispatch } from "../store/hooks";
import { updateUser } from "../store/userSlice";
import {
  useGetMyProfileQuery,
  useGetUserProfileQuery,
} from "../services/api/userApi";
import {
  useFollowUserMutation,
  useUnfollowUserMutation,
} from "../services/api/followsApi";
import { useGetUserConnectionsQuery } from "../services/api/connectionsApi";
import { useGetUserAchievementsQuery } from "../services/api/workoutApi";
import type { User, UserProfile } from "../types";
import { COLORS, DIMENSIONS } from "../config/constants";
import STRINGS from "../config/strings";
import { SafeAreaView } from "react-native-safe-area-context";
import TrainerOnboarding from "../components/TrainerOnboarding";
import { useNavigation } from "@react-navigation/native";
import { useState as useLocalState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Achievements,
  Availabilituy,
  Awards,
  Calender,
  CircleComment,
  CircleEdit,
  Comment,
  Connections,
  DeleteUser,
  Exit,
  Fire,
  Following,
  Like,
  Posts,
  Price,
  Rating,
  Request,
  RequestBlack,
  Settings,
  Thunder,
  Tick,
  Users,
  Users2,
  Workout,
} from "../../assets";
import FontWeight from "../hooks/useInterFonts";
import { LinearGradient } from "expo-linear-gradient";
import { Calendar } from "react-native-calendars";
import BookingCard from "../components/BookingCard";
import BookingList from "../components/BookingList";
import ScheduleList from "../components/ScheduleList";
import { useDeleteBookingMutation, useUpdateBookingMutation } from "../services/api/bookingApi";
import { Toast } from "../components/ToastManager";
import { ResizeMode } from "expo-av";

interface ProfileScreenProps {
  navigation: any;
  route?: {
    params?: {
      isGuest?: boolean;
      userId?: string;
      user?: any;
      bio?: string;
    };
  };
}

type TabType = "activity" | "achievements";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
  progress?: number;
  maxProgress?: number;
}

interface Connection {
  id: string;
  name: string;
  location: string;
  initial: string;
  color: string;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation, route }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const dispatch = useAppDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const passedUser = route?.params?.user;
  const userId = passedUser?.id || route?.params?.userId;
  const isOwnProfile = !userId && !passedUser;
  const myProfileQuery = useGetMyProfileQuery(undefined, {
    skip: !isOwnProfile || !isAuthenticated,
  });
  const userProfileQuery = useGetUserProfileQuery(userId || "", {
    skip: isOwnProfile || !userId || !isAuthenticated,
  });

  const { data: myProfileData, refetch: refetchMyProfile } = myProfileQuery;
  const { data: userProfileData, refetch: refetchUserProfile } =
    userProfileQuery;

  // Whose stats we are counting: our own id on our own profile, otherwise the
  // profile being viewed.
  const statsUserId = isOwnProfile ? user?.id : userId;

  // The profile endpoint's partnersCount is the platform-wide user total, so
  // count the user's actual connections instead. page/limit match the
  // Connections screen's first page so the cache entry is shared.
  const { data: connectionsData, refetch: refetchConnections } =
    useGetUserConnectionsQuery(
      { userId: statsUserId ?? "", page: 1, limit: 20 },
      { skip: !isAuthenticated || !statsUserId },
    );
  const connectionsPayload =
    connectionsData && connectionsData.status === true
      ? connectionsData.data
      : undefined;
  const partnersCount =
    connectionsPayload?.pagination?.total ??
    connectionsPayload?.users?.length ??
    0;

  // Awards = the achievements this user has actually earned, i.e. exactly the
  // list the Achievements screen renders. Same args as that screen so the cache
  // entry is shared. Falls back to the profile payload's awardsCount only until
  // the list resolves.
  const { data: achievementsData, refetch: refetchAchievements } =
    useGetUserAchievementsQuery(
      { userId: statsUserId },
      { skip: !isAuthenticated || !statsUserId },
    );
  const earnedAchievementsCount =
    achievementsData && achievementsData.status === true
      ? (achievementsData.data ?? []).length
      : undefined;

  useEffect(() => {
    const describe = (
      name: string,
      endpoint: string,
      args: unknown,
      q: {
        isUninitialized: boolean;
        isLoading: boolean;
        isFetching: boolean;
        isError: boolean;
        isSuccess: boolean;
        data?: unknown;
        error?: unknown;
      },
    ) => ({
      name,
      endpoint,
      args,
      skipped: q.isUninitialized,
      state: q.isUninitialized
        ? "skipped"
        : q.isLoading
          ? "loading"
          : q.isFetching
            ? "refetching"
            : q.isError
              ? "error"
              : q.isSuccess
                ? "success"
                : "idle",
      ok: (q.data as any)?.status,
      message: (q.data as any)?.message,
      error: q.error ? JSON.stringify(q.error) : undefined,
    });

    console.log(
      "[ProfileScreen] API calls on visit",
      JSON.stringify(
        {
          viewing: isOwnProfile ? "own profile" : `user ${userId}`,
          queries: [
            describe(
              "getMyProfile",
              "GET /user/get",
              undefined,
              myProfileQuery,
            ),
            describe(
              "getUserProfile",
              `GET /users/${userId}/profile`,
              userId,
              userProfileQuery,
            ),
          ],
          mutationsAvailable: [
            "followUser  POST /follows/follow",
            "unfollowUser  POST /follows/unfollow",
            "deleteBooking  POST /payment/refund-payment",
            "updateBooking  POST /booking/update",
          ],
        },
        null,
        2,
      ),
    );
  }, [
    isOwnProfile,
    userId,
    myProfileQuery.status,
    myProfileQuery.isFetching,
    userProfileQuery.status,
    userProfileQuery.isFetching,
  ]);

  const [followUser] = useFollowUserMutation();
  const [unfollowUser] = useUnfollowUserMutation();
  const [deleteBooking] = useDeleteBookingMutation();
  const [updateBooking] = useUpdateBookingMutation()

  const profileData: User | UserProfile | undefined | null = isOwnProfile
    ? myProfileData && myProfileData.status === true && myProfileData.data
      ? myProfileData.data
      : user
    : userProfileData && userProfileData.status === true && userProfileData.data
      ? userProfileData.data
      : passedUser;

  useEffect(() => {
    if (!isOwnProfile && profileData && "isFollowing" in profileData) {
      setIsFollowing(profileData.isFollowing || false);
    }
  }, [profileData, isOwnProfile]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (isOwnProfile) {
      const result = await refetchMyProfile();
      const apiRes = result?.data;
      if (apiRes && apiRes.status && "data" in apiRes && apiRes.data) {
        dispatch(updateUser(apiRes.data));
      }
    } else if (userId) {
      await refetchUserProfile();
    }
    if (statsUserId) {
      await Promise.all([refetchConnections(), refetchAchievements()]);
    }
    setRefreshing(false);
  };

  const handleFollow = async () => {
    const targetUserId = passedUser?.id || userId;
    if (!targetUserId) return;
    try {
      // unwrap() + status check so a refused request throws — without it the
      // button flipped to "Following" even when the server said no.
      const response = await followUser({
        followUserId: targetUserId,
      }).unwrap();
      if (!response.status) {
        throw new Error(response.message || "Failed to follow this user");
      }
      setIsFollowing(true);
    } catch (error: any) {
      Toast.error(error?.message || "Failed to follow this user");
      console.error("Follow error:", error);
    }
  };

  const handleUnfollow = async () => {
    const targetUserId = passedUser?.id || userId;
    if (!targetUserId) return;
    try {
      const response = await unfollowUser({
        unfollowUserId: targetUserId,
      }).unwrap();
      if (!response.status) {
        throw new Error(response.message || "Failed to unfollow this user");
      }
      setIsFollowing(false);
    } catch (error: any) {
      Toast.error(error?.message || "Failed to unfollow this user");
      console.error("Unfollow error:", error);
    }
  };

  const [activeTab, setActiveTab] = useState<TabType>("activity");
  const [activeSubTab, setActiveSubTab] = useState<
    "posts" | "workouts" | "connections"
  >("posts");
  const [isFollowing, setIsFollowing] = useState(false);

  const isGuest = route?.params?.isGuest || !user;
  const navigationNative = useNavigation();
  const isTrainer = user?.role === "trainer";
  const trainerOnboardingStep = user?.trainerOnboardingStep ?? 0;
  const onboardingStep = isTrainer
    ? trainerOnboardingStep
    : user?.onboardingStep ?? 0;
  const showTrainerOnboarding = isOwnProfile && isTrainer && onboardingStep < 2;
  const showOwnProfileFeatures =
    isOwnProfile && !isGuest && (!isTrainer || onboardingStep >= 2);

  const handleTrainerOnboarding = () => {
    navigation.navigate("TrainerSetup");
  };
  const profileBio = (() => {
    const routeBio = route?.params?.bio;
    if (routeBio) {
      const cleanedRouteBio = routeBio.trim();
      if (cleanedRouteBio.length > 0) {
        return cleanedRouteBio;
      }
    }

    const rawUserBio = profileData?.bio;
    if (rawUserBio) {
      const cleaned = rawUserBio.trim();
      if (cleaned.length > 0) {
        return cleaned;
      }
    }

    return isGuest ? "No bio available" : "";
  })();

  const bookingsData =
    profileData && "booking_request" in profileData
      ? profileData?.booking_request || []
      : [];

  const trainerMenuItems = [
    {
      id: "all-bookings",
      label: "All Bookings",
      icon: RequestBlack,
    },
    {
      id: "my-availability",
      label: "My Availability",
      icon: Availabilituy,
    },
    {
      id: "my-pricing",
      label: "My Pricing",
      icon: Price,
    },
    {
      id: "my-rating",
      label: STRINGS.RATING.myRatingsMenu,
      icon: Rating,
    },
  ];

  const guestMenuItems = [
    {
      id: "posts",
      label: STRINGS.PROFILE.posts,
      icon: Posts,
    },
    {
      id: "connections",
      label: "Connections",
      icon: Connections,
    },
    {
      id: "achievements",
      label: STRINGS.PROFILE.achievements,
      icon: Achievements,
    },
    {
      id: "rating",
      label: STRINGS.RATING.userRatingsMenu,
      icon: Rating,
    },
  ];

  const menuItems = isOwnProfile
    ? isTrainer
      ? trainerMenuItems
      : [
        {
          id: "posts",
          label: showOwnProfileFeatures ? "My Posts" : STRINGS.PROFILE.posts,
          icon: Posts,
        },
        {
          id: "connections",
          label: "Connections",
          icon: Connections,
        },
        ...(showOwnProfileFeatures
          ? [
            {
              id: "schedule-session",
              label: "Schedule Sessions",
              icon: Availabilituy,
            },
            {
              id: "workout-history",
              label: "Workout History",
              icon: Workout,
            },
          ]
          : []),
        {
          id: "achievements",
          label: STRINGS.PROFILE.achievements,
          icon: Achievements,
        },
        {
          id: "rating",
          label: STRINGS.RATING.myRatingsMenu,
          icon: Rating,
        },
      ]
    : guestMenuItems;

  const handleLogout = async () => {
    await logout();
  };

  const handleBookTrainer = () => {
    navigation.navigate("BookTrainer", {
      trainerId: route?.params?.userId || user?.id,
      trainerName: user?.displayName || "Trainer",
    });
  };

  const handleRemove = async (id: number) => {
    if (!id) return;

    try {
      await deleteBooking({ sessionId: id }).unwrap();
      Toast.success("Booking removed successfully");
      await refetchMyProfile();
    } catch (error) {
      Toast.error("Failed to remove booking");
      console.error("Delete booking error:", error);
    }
  };

  const handleAccept = async (id: number) => {
    if (!id) return;

    try {
      await updateBooking({ id, status: "upcomming" }).unwrap();
      Toast.success("Booking updated successfully");
      await refetchMyProfile();
    } catch (error) {
      Toast.error("Failed to update booking");
      console.error("Update booking error:", error);
    }
  };

  const renderFollowingView = () => {
    return (
      <View style={styles.followingRow}>
        <TouchableOpacity
          style={styles.followingMainBtn}
          onPress={isFollowing ? undefined : handleFollow}
        >
          <View style={styles.followingMainBtnContent}>
            <Image source={Following} style={[styles.smallIconSize, { tintColor: COLORS.black }]} />
            <Text style={styles.followingText}>
              {isFollowing ? STRINGS.PROFILE.following : "Follow"}
            </Text>
          </View>
        </TouchableOpacity>
        {isFollowing && (
          <TouchableOpacity
            style={styles.followingIconBtn}
            onPress={handleUnfollow}
          >
            <Image source={DeleteUser} style={[styles.smallIconSize, { tintColor: COLORS.black }]} />
          </TouchableOpacity>
        )}
      </View>
    );
  };
  const renderProfileAvatar = () => {
    const displayName =
      profileData?.displayName ||
      (profileData as any)?.userName ||
      STRINGS.PROFILE.guestUser;
    const initial = displayName?.charAt(0)?.toUpperCase() || "G";
    const location = profileData?.location?.trim() || "";
    const imageUrl =
      (profileData as any)?.imageUrl || (profileData as any)?.profilePicture;
    return (
      <LinearGradient
        colors={[COLORS.gradient1, COLORS.gradient2, COLORS.gradient3]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.profileHeader}
      >
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerIconBtn}
          >
            <Ionicons
              name="chevron-down"
              size={24}
              color={COLORS.white}
              style={{ transform: [{ rotate: "90deg" }] }}
            />
          </TouchableOpacity>
          {isGuest ? (
            <TouchableOpacity
              onPress={() => {
                if (!userId) return;
                navigation.navigate("Chat", {
                  partnerId: String(userId),
                  partnerName: displayName,
                });
              }}
              disabled={!userId}
              style={styles.commentIcon}
            >
              <Image
                source={CircleComment}
                resizeMode="contain"
                style={styles.iconSize}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerIconsContainer}>
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={() => navigation.navigate("EditProfile")}
              >
                <Image
                  source={CircleEdit}
                  resizeMode="contain"
                  style={styles.iconSize}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate("Settings")}
                style={styles.headerIconBtn}
              >
                <Image
                  source={Settings}
                  resizeMode="contain"
                  style={styles.iconSize}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, isGuest && styles.guestAvatar]}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initial}</Text>
            )}
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
          {location ? (
            <Text style={styles.locationText}>{location}</Text>
          ) : null}
        </View>

        {profileBio ? <Text style={styles.bioText}>{profileBio}</Text> : null}
        {isGuest && renderFollowingView()}
      </LinearGradient>
    );
  };

  const statsData = [
    {
      icon: Thunder,
      count: profileData?.totalWorkouts || 0,
      title: STRINGS.PROFILE.statsLabels.workouts,
    },
    {
      icon: Fire,
      count: profileData?.longestStreak || 0,
      title: STRINGS.PROFILE.statsLabels.streak,
    },
    {
      icon: Users,
      count: partnersCount,
      title: STRINGS.PROFILE.statsLabels.partners,
    },
    {
      icon: Awards,
      count: earnedAchievementsCount ?? profileData?.awardsCount ?? 0,
      title: STRINGS.PROFILE.statsLabels.awards,
    },
  ];

  const schedulesData =
    profileData && "today_schedule" in profileData
      ? profileData?.today_schedule || []
      : [];

  const statsDataTrainer = [
    { icon: Request, count: bookingsData?.length || 0, title: "Requests" },
    { icon: Calender, count: schedulesData?.length || 0, title: "Today" },
    { icon: Users2, count: profileData?.clientCount || 0, title: "Clients" },
  ];

  return (
    <SafeAreaView
      edges={["left", "right"]}
      style={[styles.container, isGuest && styles.guestContainer]}
    >
      <RefreshableScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      >
        <View>
          {renderProfileAvatar()}
          {showTrainerOnboarding ? (
            <TrainerOnboarding onGetStarted={handleTrainerOnboarding} />
          ) : (
            <StatsRow
              stats={!isOwnProfile || !isTrainer ? statsData : statsDataTrainer}
            />
          )}
        </View>
        {!showTrainerOnboarding && !isTrainer && showOwnProfileFeatures && (
          <View style={styles.weeklyActivityCard}>
            <View style={styles.weeklyActivityHeader}>
              <Text style={styles.weeklyActivityTitle}>Weekly Activity</Text>
            </View>
            <View style={styles.weeklyActivityContent}>
              <View style={styles.weeklyGoalSection}>
                <View style={styles.weeklyGoalHeader}>
                  <Text style={styles.weeklyGoalLabel}>Weekly Goal</Text>
                  <Text style={styles.weeklyGoalValue}>{`${
                    profileData?.completedWeeklySessions || 0
                  }/${profileData?.totalWeeklySessions || 0} Workouts`}</Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(
                          100,
                          ((profileData?.completedWeeklySessions || 0) /
                            Math.max(
                              profileData?.totalWeeklySessions || 1,
                              1,
                            )) *
                            100,
                        )}%`,
                      },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.streakStatsContainer}>
                <View style={styles.streakStatItem}>
                  <Text style={styles.streakStatLabel}>CURRENT STREAK</Text>
                  <Text style={styles.streakStatValue}>
                    {profileData?.streak || 0} Days
                  </Text>
                </View>
                <View style={styles.streakStatItem}>
                  <Text style={styles.streakStatLabel}>LONGEST STREAK</Text>
                  <Text style={styles.streakStatValue}>
                    {profileData?.longestStreak || 0} Days
                  </Text>
                </View>
              </View>
              <View style={styles.dailyStreakSection}>
                <Text style={styles.dailyStreakLabel}>Daily Streak</Text>
                <View style={styles.daysContainer}>
                  {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => {
                    const isCompleted = [
                      profileData?.weeklyActivity?.Mon || false,
                      profileData?.weeklyActivity?.Tue || false,
                      profileData?.weeklyActivity?.Wed || false,
                      profileData?.weeklyActivity?.Thu || false,
                      profileData?.weeklyActivity?.Fri || false,
                      profileData?.weeklyActivity?.Sat || false,
                      profileData?.weeklyActivity?.Sun || false,
                    ][index];
                    return (
                      <View key={index} style={styles.dayColumn}>
                        <Text style={styles.dayLabel}>{day}</Text>
                        <View
                          style={[
                            styles.dayCircle,
                            isCompleted
                              ? styles.dayCircleCompleted
                              : styles.dayCircleIncomplete,
                          ]}
                        >
                          {isCompleted && (
                            <Image
                              source={Tick}
                              resizeMode={ResizeMode.CONTAIN}
                              style={{
                                width: 15,
                                height: 15,
                                tintColor: COLORS.white,
                              }}
                            />
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>
        )}
        {isOwnProfile && isTrainer && !showTrainerOnboarding && (
          <View style={{ marginTop: 60, width: "90%", margin: "auto" }}>
            <BookingList
              bookings={bookingsData}
              onRemove={handleRemove}
              onAccept={handleAccept}
            />
            <ScheduleList
              schedules={schedulesData}
              onMessage={(user) =>
                navigation.navigate("Chat", {
                  partnerId: user.id.toString(),
                  partnerName: user.name,
                })
              }
              onRemove={handleRemove}
            />
          </View>
        )}

        {!showTrainerOnboarding && (isOwnProfile || isGuest) && (
          <View
            style={[
              styles.menuListContainer,
              isGuest && styles.menuListGuestSpacing,
            ]}
          >
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuItem, index === 0 && styles.menuItemActive]}
                onPress={() => {
                  if (isGuest) {
                    if (item.id === "posts") {
                      navigation.navigate("MyPosts", { userId: userId });
                    } else if (item.id === "connections") {
                      navigation.navigate("Connections", { userId: userId });
                    } else if (item.id === "achievements") {
                      navigation.navigate("Achievements", { userId: userId });
                    } else if (item.id === "rating") {
                      navigation.navigate("MyRatings", {
                        userId: userId,
                        name:
                          (profileData as any)?.displayName ||
                          (profileData as any)?.userName,
                      });
                    }
                    return;
                  }

                  if (isTrainer) {
                    if (item.id === "all-bookings") {
                      navigation.navigate("MyBookings");
                    } else if (item.id === "my-availability") {
                      navigation.navigate("TrainerAvailability");
                    } else if (item.id === "my-pricing") {
                      navigation.navigate("TrainerPricing");
                    } else if (item.id === "my-rating") {
                      navigation.navigate("MyRatings");
                    } else {
                      console.log(`Pressed ${item.label}`);
                    }
                  } else {
                    if (item.id === "posts") {
                      navigation.navigate("MyPosts", { userId });
                    } else if (item.id === "workout-history") {
                      navigation.navigate("WorkoutHistory");
                    } else if (item.id === "connections") {
                      navigation.navigate("Connections");
                    } else if (item.id === "schedule-session") {
                      navigation.navigate("ScheduledSessions");
                    } else if (item.id === "achievements") {
                      navigation.navigate("Achievements");
                    } else if (item.id === "rating") {
                      navigation.navigate("MyRatings");
                    } else if (item.id === "my-bookings") {
                      navigation.navigate("MyBookings");
                    } else {
                      console.log(`Pressed ${item.label}`);
                    }
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <Image source={item.icon} style={styles.menuItemIcon} />
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={COLORS._616888}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </RefreshableScrollView>
      {isOwnProfile && !isGuest && (
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Image
              source={Exit}
              style={[styles.smallIconSize, { tintColor: COLORS.error }]}
            />
            <Text style={styles.logoutButtonText}>
              {STRINGS.PROFILE.logout}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  followingRow: {
    width: "90%",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginVertical: 15,
  },
  followingMainBtn: {
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  followingMainBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3.5,
  },
  followingText: {
    fontSize: 14,
    color: COLORS.gradient1,
    fontFamily: FontWeight.Medium,
  },
  followingIconBtn: {
    backgroundColor: "white",
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.gradient3,
  },
  guestContainer: {
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  iconSize: {
    width: 35,
    height: 35,
    tintColor: COLORS.white,
  },
  smallIconSize: {
    width: 20,
    height: 20,
    marginRight: 5,
  },

  postIconSize: {
    width: 15,
    height: 15,
  },
  profileHeader: {
    backgroundColor: COLORS.gradient3,
    paddingBottom: 40,
    paddingTop: DIMENSIONS.spacing.xl,
    alignItems: "center",
    position: "relative",
    zIndex: 1,
  },
  backButton: {
    position: "absolute",
    left: 20,
    top: 50,
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 24,
    color: "white",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
    paddingTop: 10,
    marginBottom: 16,
    marginTop: DIMENSIONS.spacing.lg,
  },
  headerIconsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerIconBtn: {
  },
  commentIcon: { marginRight: 10 },
  headerIconText: {
    fontSize: 20,
    color: "white",
  },
  avatarContainer: {
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: COLORS.white,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  guestAvatar: {
  },
  avatarText: {
    fontSize: 48,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.black,
  },
  displayName: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: "white",
  },
  locationText: {
    fontSize: 12,
    fontFamily: FontWeight.Regular,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  bioText: {
    fontSize: 14,
    color: COLORS.white,
    textAlign: "center",
    marginBottom: 20,
    fontFamily: FontWeight.Regular,
    marginHorizontal: 20,
  },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 50,
    overflow: "hidden",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS._E2E2E2,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    color: COLORS._5E5E5E,
    fontFamily: FontWeight.Medium,
    fontSize: 16,
  },
  activeTabText: {
    color: COLORS.primary,
    fontFamily: FontWeight.Medium,
    fontSize: 16,
  },

  tabContent: {
    paddingHorizontal: 20,
    marginTop: 20,
    width: "100%",
  },

  achievementTabContent: {
    paddingHorizontal: 20,
    marginTop: 20,
    width: "100%",
  },

  subTabContainer: {
    flexDirection: "row",
    marginBottom: 20,
    borderRadius: 10,
    padding: 3,
    backgroundColor: COLORS._EAEBF4,
    width: "100%",
  },
  subTab: {
    width: "33.33%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
  },
  activeSubTab: {
    backgroundColor: COLORS.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  activeSubTabText: {
    color: COLORS.primary,
    fontSize: 14,
    textAlign: "center",
    fontFamily: FontWeight.SemiBold,
  },
  subTabText: {
    color: COLORS._616888,
    fontSize: 14,
    textAlign: "center",
    fontFamily: FontWeight.Medium,
  },
  logoutSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    bottom: 0,
    position: "absolute",
    width: "100%",
    alignSelf: "center",
    borderTopColor: COLORS._E6E6E7,
  },
  logoutButton: {
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    justifyContent: "center",
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  logoutButtonText: {
    color: COLORS.error,
    fontSize: 14,
    left: 5,
    fontFamily: FontWeight.Medium,
  },

  header: {
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingTop: DIMENSIONS.spacing.sm,
    paddingBottom: DIMENSIONS.spacing.sm,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: DIMENSIONS.spacing.xs,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  profileSection: {
    width: "100%",
    marginBottom: DIMENSIONS.spacing.xl,
  },
  profileInfo: {
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    padding: DIMENSIONS.spacing.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: DIMENSIONS.spacing.xs,
    color: COLORS.text,
  },
  profileEmail: {
    fontSize: 16,
    marginBottom: DIMENSIONS.spacing.xs,
    color: COLORS.textSecondary,
  },
  profileLocation: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statsSection: {
    width: "100%",
    marginBottom: DIMENSIONS.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: DIMENSIONS.spacing.md,
    textAlign: "center",
    color: COLORS.text,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: DIMENSIONS.spacing.sm,
  },
  statCard: {
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    padding: DIMENSIONS.spacing.md,
    width: "45%",
    minWidth: 80,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  ratingSection: {
    width: "100%",
    marginBottom: DIMENSIONS.spacing.xl,
  },
  ratingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    padding: DIMENSIONS.spacing.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  ratingInfo: {
    alignItems: "center",
    marginBottom: DIMENSIONS.spacing.lg,
  },
  ratingCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: DIMENSIONS.spacing.xs,
  },
  ratingBreakdown: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: DIMENSIONS.spacing.md,
  },
  ratingBreakdownTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.sm,
  },
  ratingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: DIMENSIONS.spacing.xs,
  },
  ratingLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  shareRatingButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: DIMENSIONS.borderRadius,
    paddingVertical: DIMENSIONS.spacing.sm,
    paddingHorizontal: DIMENSIONS.spacing.md,
    alignItems: "center",
    marginTop: DIMENSIONS.spacing.md,
  },
  shareRatingButtonText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: "600",
  },
  actionsSection: {
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingVertical: DIMENSIONS.spacing.lg,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: "center",
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
  },
  settingsButton: {
    backgroundColor: COLORS.primary,
    borderRadius: DIMENSIONS.borderRadius,
    paddingVertical: DIMENSIONS.spacing.md,
    paddingHorizontal: DIMENSIONS.spacing.xl,
    alignItems: "center",
    marginBottom: DIMENSIONS.spacing.md,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "600",
  },
  weeklyActivityCard: {
    width: "90%",
    maxWidth: 600,
    alignSelf: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 60,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  weeklyActivityHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  weeklyActivityTitle: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.app_black,
  },
  weeklyActivityContent: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  weeklyGoalSection: {
    marginBottom: 12,
  },
  weeklyGoalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  weeklyGoalLabel: {
    fontSize: 12,
    fontFamily: FontWeight.Medium,
    color: COLORS._5E5E5E,
  },
  weeklyGoalValue: {
    fontSize: 12,
    fontFamily: FontWeight.Medium,
    color: COLORS.primary,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: COLORS._E6E6E7,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS._0DB312,
    borderRadius: 3,
  },
  streakStatsContainer: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 6,
    marginBottom: 12,
  },
  streakStatItem: {
    flex: 1,
  },
  streakStatLabel: {
    fontSize: 12,
    fontFamily: FontWeight.Regular,
    color: COLORS._5E5E5E,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  streakStatValue: {
    fontSize: 16,
    fontFamily: FontWeight.Bold,
    color: COLORS.app_black,
  },
  dailyStreakSection: {
    paddingTop: 6,
  },
  dailyStreakLabel: {
    fontSize: 12,
    fontFamily: FontWeight.Medium,
    color: COLORS._5E5E5E,
    marginBottom: 10,
  },
  daysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayColumn: {
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
  },
  dayLabel: {
    fontSize: 10,
    fontFamily: FontWeight.Regular,
    color: COLORS._5E5E5E,
  },
  dayCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  dayCircleCompleted: {
    backgroundColor: COLORS._0DB312,
  },
  dayCircleIncomplete: {
    borderWidth: 1,
    borderColor: COLORS._D7D7D7,
    backgroundColor: "transparent",
  },
  menuListContainer: {
    flexDirection: "column",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 0,
    maxWidth: 600,
    alignSelf: "center",
    width: "100%",
  },
  menuListGuestSpacing: {
    paddingVertical: 70,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS._E6E6E7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItemActive: {
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuItemIcon: {
    marginRight: 0,
    width: 20,
    height: 20,
    tintColor: COLORS.white,
  },
  menuItemLabel: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
  },
});

export default ProfileScreen;
