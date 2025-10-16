import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import RefreshableScrollView from '../components/RefreshableScrollView';
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../contexts/AuthContext";
import { useAppDispatch } from '../store/hooks';
import { updateUser } from '../store/userSlice';
import { useGetMyProfileQuery, useGetUserProfileQuery } from '../services/api/userApi';
import { COLORS, DIMENSIONS } from "../config/constants";
import STRINGS from "../config/strings";
import { SafeAreaView } from "react-native-safe-area-context";
import TrainerOnboarding from '../components/TrainerOnboarding';
import { useNavigation } from '@react-navigation/native';
import { useState as useLocalState } from 'react';
import { Ionicons } from "@expo/vector-icons";
import {
  Awards,
  CircleComment,
  CircleEdit,
  Comment,
  DeleteUser,
  Exit,
  Fire,
  Following,
  Like,
  Settings,
  Thunder,
  Users,
} from "../../assets";
import FontWeight from "../hooks/useInterFonts";
import { LinearGradient } from "expo-linear-gradient";

interface ProfileScreenProps {
  navigation: any;
  route?: {
    params?: {
      isGuest?: boolean;
      userId?: string;
      bio?: string;
      user?: any;
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
  const { user, logout } = useAuth();
  const dispatch = useAppDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const userId = route?.params?.userId;
  const isOwnProfile = !userId || userId === user?.id;
  const { data: myProfileData, refetch: refetchMyProfile } = useGetMyProfileQuery(undefined, { skip: !isOwnProfile });
  const { data: userProfileData, refetch: refetchUserProfile } = useGetUserProfileQuery(userId || '', { skip: isOwnProfile || !userId });

  const handleRefresh = async () => {
    setRefreshing(true);
    if (isOwnProfile) {
      const result = await refetchMyProfile();
      const apiRes = result?.data;
      if (apiRes && apiRes.status && 'data' in apiRes && apiRes.data) {
        dispatch(updateUser(apiRes.data));
      }
    } else if (userId) {
      await refetchUserProfile();
    }
    setRefreshing(false);
  };
  
  const activityPosts = [
    {
      id: "1",
      content:
        "Great morning run! Feeling energized for the day. Who else got their workout in?",
      timeAgo: "1d ago",
      likes: 341,
      comments: 4,
    },
    {
      id: "2",
      content:
        "Great morning run! Feeling energized for the day. Who else got their workout in?",
      timeAgo: "2d ago",
      likes: 7,
      comments: 2,
    },
  ];

  const workoutHistory = [
    {
      id: "1",
      type: "post",
      content:
        "Great morning run! Feeling energized for the day. Who else got their workout in?",
      timeAgo: "1d ago",
      likes: 241,
      comments: 4,
    },
    {
      id: "2",
      type: "workout",
      title: "Upper Body Power",
      category: "Strength",
      duration: "45 mins",
      difficulty: "Medium",
      completedDate: "Yesterday",
      status: "completed",
    },
    {
      id: "3",
      type: "workout",
      title: "Morning Cardio",
      category: "Cardio",
      duration: "30 mins",
      difficulty: "Easy",
      completedDate: "2 days ago",
      status: "completed",
    },
  ];
  const [activeTab, setActiveTab] = useState<TabType>("activity");
  const [activeSubTab, setActiveSubTab] = useState<
    "posts" | "workouts" | "connections"
  >("posts");
  const [isFollowing, setIsFollowing] = useState(false);

  const isGuest = route?.params?.isGuest || !user;
  // const isOwnProfile =
  //   !route?.params?.userId || route.params.userId === user?.id;
  const navigationNative = useNavigation();
  const [localOnboardingStep, setLocalOnboardingStep] = useLocalState(user?.onboardingStep ?? 0);
  console.log('User role:', user);
  const isTrainer = user?.role == 'trainer';
  const onboardingStep = localOnboardingStep;
  const showTrainerOnboarding = isOwnProfile && isTrainer && onboardingStep !== 2;
  const showOwnProfileFeatures = isOwnProfile && !isGuest && (!isTrainer || onboardingStep === 2);

  // Handler to launch onboarding flow and update onboardingStep after completion
  const handleTrainerOnboarding = () => {
    navigation.navigate('TrainerSetup');
  };
  const profileBio = (() => {
    if (isGuest) {
      return STRINGS.PROFILE.bio;
    }

    const routeBio = route?.params?.bio;
    if (routeBio) {
      const cleanedRouteBio = routeBio.trim();
      if (cleanedRouteBio.length > 0) {
        return cleanedRouteBio;
      }
    }

    const rawUserBio = user?.bio;
    if (rawUserBio) {
      const cleaned = rawUserBio.trim();
      if (cleaned.length > 0) {
        return cleaned;
      }
    }

    return STRINGS.PROFILE.bio;
  })();

  const achievements: Achievement[] = [
    {
      id: "1",
      title: "First Steps",
      description: "Complete your first workout",
      icon: "👟",
      completed: true,
      progress: 10,
      maxProgress: 10,
    },
    {
      id: "2",
      title: "Week Warrior",
      description: "Workout 7 Days in a Row",
      icon: "⚡",
      completed: true,
      progress: 10,
      maxProgress: 10,
    },
    {
      id: "3",
      title: "Week Warrior",
      description: "Workout 7 Days in a Row",
      icon: "⚡",
      completed: false,
      progress: 3,
      maxProgress: 7,
    },
    {
      id: "4",
      title: "Week Warrior",
      description: "Workout 7 Days in a Row",
      icon: "⚡",
      completed: false,
      progress: 4,
      maxProgress: 7,
    },
  ];

  const connections: Connection[] = [
    {
      id: "1",
      name: "Mike",
      location: "Downtown Gym",
      initial: "M",
      color: COLORS.primary,
    },
    {
      id: "2",
      name: "Emma",
      location: "Central Park",
      initial: "E",
      color: COLORS.secondary,
    },
  ];

  const trainerMenuItems = [
    { id: "all-bookings", label: "All Bookings", icon: "calendar-outline" as const },
    { id: "my-availability", label: "My Availability", icon: "time-outline" as const },
    { id: "my-pricing", label: "My Pricing", icon: "pricetag-outline" as const },
    { id: "my-rating", label: "My Rating", icon: "star-outline" as const },
  ];

  const menuItems = isTrainer ? trainerMenuItems : [
    {
      id: "posts",
      label: showOwnProfileFeatures ? "My Posts" : STRINGS.PROFILE.posts,
      icon: "document-text-outline" as const,
    },
    { id: "connections", label: "Connections", icon: "people-outline" as const },
    ...(showOwnProfileFeatures
      ? [
          {
            id: "schedule-session",
            label: "Schedule Sessions",
            icon: "calendar-outline" as const,
          },
          {
            id: "workout-history",
            label: "Workout History",
            icon: "time-outline" as const,
          },
        ]
      : []),
    { id: "achievements", label: STRINGS.PROFILE.achievements, icon: "trophy-outline" as const },
    {
      id: "rating",
      label: showOwnProfileFeatures ? "My Ratings" : "Rating",
      icon: "star-outline" as const,
    },
  ];

  const handleLogout = async () => {
    await logout();
  };

  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
  };

  const handleMessageUser = (userId: string) => {
    // Navigate to chat screen with specific user
    navigation.navigate("Messages", { userId });
  };

  const renderPostView = (post: any) => (
    <View key={post.id} style={styles.postCard}>
      <Text style={styles.postContent}>{post.content}</Text>
      <View style={styles.postActions}>
        <Text style={styles.postTime}>{post.timeAgo}</Text>
        <View
          style={{
            flexDirection: "row",
            gap: 20,
            justifyContent: "flex-end",
            flex: 1,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image source={Like} style={styles.postIconSize} />
            <Text style={styles.postAction}>{post.likes}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image source={Comment} style={styles.postIconSize} />
            <Text style={styles.postAction}>{post.comments}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderWorkoutView = (item: any) => (
    <View key={item.id} style={styles.workoutCard}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.workoutTitle}>{item.title}</Text>
          <View style={styles.workoutDetails}>
            <View style={[styles.workoutTag, styles.strengthTag]}>
              <Text style={styles.workoutTagText}>{item.category}</Text>
            </View>
            <Text style={styles.workoutInfo}>{item.duration}</Text>
            <Text style={styles.workoutInfo}>{item.difficulty}</Text>
          </View>
          <Text style={styles.workoutCompleted}>
            {STRINGS.PROFILE.workoutCompleted} {item.completedDate}
          </Text>
        </View>
        <TouchableOpacity style={styles.postItButton}>
          <Text style={styles.postItButtonText}>
            {STRINGS.PROFILE.buttons.postIt}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderConnections = (connection: any) => (
    <View key={connection.id} style={styles.connectionCard}>
      <View style={[styles.connectionAvatar]}>
        <Text style={styles.connectionAvatarText}>{connection.initial}</Text>
      </View>
      <View style={styles.connectionInfo}>
        <Text style={styles.connectionName}>{connection.name}</Text>
        <Text style={styles.connectionLocation}>{connection.location}</Text>
      </View>
      <TouchableOpacity
        style={styles.postItButton}
        onPress={() => handleMessageUser(connection.id)}
      >
        <Text style={styles.postItButtonText}>
          {STRINGS.PROFILE.buttons.message}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const handleBookTrainer = () => {
    navigation.navigate('BookTrainer', {
      trainerId: route?.params?.userId || user?.id,
      trainerName: user?.displayName || 'Trainer',
    });
  };

  const renderFollowingView = () => {
    return (
      <View style={styles.followingRow}>
        <TouchableOpacity 
          style={styles.followingMainBtn}
          onPress={handleBookTrainer}
        >
          <View style={styles.followingMainBtnContent}>
            <Ionicons name="calendar" size={20} color={COLORS.gradient1} />
            <Text style={styles.followingText}>Book Session</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.followingMainBtn}>
          <View style={styles.followingMainBtnContent}>
            <Image source={Following} style={styles.smallIconSize} />
            <Text style={styles.followingText}>
              {STRINGS.PROFILE.following}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.followingIconBtn}>
          <Image source={DeleteUser} style={styles.smallIconSize} />
        </TouchableOpacity>
      </View>
    );
  };
  const renderProfileAvatar = () => {
    // Prefer user from route params if present (for visiting other profiles)
    const routeUser = route?.params?.user;
    const profileUser = routeUser || user;
    const displayName = profileUser?.displayName || profileUser?.userName || STRINGS.PROFILE.guestUser;
    const initial = displayName?.charAt(0)?.toUpperCase() || "G";
    const location = profileUser?.location || STRINGS.PROFILE.defaultLocation;
    const imageUrl = profileUser?.imageUrl;
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
            <TouchableOpacity onPress={() => {}} style={styles.commentIcon}>
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
          <Text style={styles.locationText}>{location}</Text>
        </View>

        {profileBio ? <Text style={styles.bioText}>{profileBio}</Text> : null}
        {isGuest && renderFollowingView()}
      </LinearGradient>
    );
  };

  const renderStatsRow = () => (
    <View style={styles.statsRow}>
      <View style={styles.statItem}>
        <Image source={Thunder} style={styles.smallIconSize} />
        <Text style={styles.statNumber}>157</Text>
        <Text style={styles.statLabel}>
          {STRINGS.PROFILE.statsLabels.workouts}
        </Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Image source={Fire} style={styles.smallIconSize} />
        <Text style={styles.statNumber}>157</Text>
        <Text style={styles.statLabel}>
          {STRINGS.PROFILE.statsLabels.streak}
        </Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Image source={Users} style={[styles.smallIconSize, { top: 2 }]} />
        <Text style={styles.statNumber}>12</Text>
        <Text style={styles.statLabel}>
          {STRINGS.PROFILE.statsLabels.partners}
        </Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Image source={Awards} style={[styles.smallIconSize, { top: 2 }]} />
        <Text style={styles.statNumber}>8</Text>
        <Text style={styles.statLabel}>
          {STRINGS.PROFILE.statsLabels.awards}
        </Text>
      </View>
    </View>
  );


  const renderActivityTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.subTabContainer}>
        <TouchableOpacity
          style={[
            styles.subTab,
            activeSubTab === "posts" && styles.activeSubTab,
          ]}
          onPress={() => setActiveSubTab("posts")}
        >
          <Text
            style={[
              styles.subTabText,
              activeSubTab === "posts" && styles.activeSubTabText,
            ]}
          >
            {STRINGS.PROFILE.posts}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.subTab,
            activeSubTab === "workouts" && styles.activeSubTab,
          ]}
          onPress={() => setActiveSubTab("workouts")}
        >
          <Text
            style={[
              styles.subTabText,
              activeSubTab === "workouts" && styles.activeSubTabText,
            ]}
          >
            {STRINGS.PROFILE.workouts}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.subTab,
            activeSubTab === "connections" && styles.activeSubTab,
          ]}
          onPress={() => setActiveSubTab("connections")}
        >
          <Text
            style={[
              styles.subTabText,
              activeSubTab === "connections" && styles.activeSubTabText,
            ]}
          >
            Connections
          </Text>
        </TouchableOpacity>
      </View>

      {activeSubTab === "posts" && (
        <View>{activityPosts.map((post) => renderPostView(post))}</View>
      )}

      {activeSubTab === "workouts" && (
        <View>
          {workoutHistory.map((item) => {
            if (item.type === "post") {
              return renderPostView(item);
            } else {
              return renderWorkoutView(item);
            }
          })}
        </View>
      )}

      {activeSubTab === "connections" && (
        <View>
          {connections.map((connection) => renderConnections(connection))}
        </View>
      )}
    </View>
  );

  const renderAchievementsTab = () => (
    <View style={styles.achievementTabContent}>
      <View style={styles.achievementsGrid}>
        {achievements.map((achievement, idx) => (
          <View key={achievement.id} style={styles.achievementCardGrid}>
            <View style={{ width: "100%" }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <View style={styles.achievementIcon}>
                  <Image source={Awards} style={styles.achievementIconText} />
                </View>
                {achievement.completed && (
                  <View style={styles.achievementIcon}>
                    <Image source={Awards} style={styles.achievementIconText} />
                  </View>
                )}
              </View>
              <Text style={styles.achievementTitle}>{achievement.title}</Text>
              {achievement.description && (
                <Text style={styles.achievementDescription}>
                  {achievement.description}
                </Text>
              )}
            </View>
            <View style={styles.achievementProgress}>
              <View style={styles.achievementProgressBar}>
                <View
                  style={[
                    styles.achievementProgressFill,
                    {
                      width: `${
                        achievement.completed
                          ? 100
                          : ((achievement.progress || 0) /
                              (achievement.maxProgress || 1)) *
                            100
                      }%`,
                      backgroundColor: achievement.completed
                        ? COLORS._3FE363
                        : COLORS._F3A455,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "activity":
        return renderActivityTab();
      case "achievements":
        return renderAchievementsTab();
      default:
        return renderActivityTab();
    }
  };



  return (
    <SafeAreaView
      edges={["left", "right"]}
      style={[styles.container, isGuest && styles.guestContainer]}
    >
      {/* <View style={styles.profileHeader} /> */}
      <RefreshableScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      >
        <View>
          {renderProfileAvatar()}
          {showTrainerOnboarding ? <TrainerOnboarding onGetStarted={handleTrainerOnboarding} /> : renderStatsRow()}
        </View>
        {!showTrainerOnboarding && showOwnProfileFeatures && (
          <View style={styles.weeklyActivityCard}>
            <View style={styles.weeklyActivityHeader}>
              <Text style={styles.weeklyActivityTitle}>Weekly Activity</Text>
            </View>
            <View style={styles.weeklyActivityContent}>
              {/* Weekly Goal Section */}
              <View style={styles.weeklyGoalSection}>
                <View style={styles.weeklyGoalHeader}>
                  <Text style={styles.weeklyGoalLabel}>Weekly Goal</Text>
                  <Text style={styles.weeklyGoalValue}>3/5 Workouts</Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBarFill, { width: "60%" }]} />
                </View>
              </View>
              {/* Streak Stats */}
              <View style={styles.streakStatsContainer}>
                <View style={styles.streakStatItem}>
                  <Text style={styles.streakStatLabel}>CURRENT STREAK</Text>
                  <Text style={styles.streakStatValue}>7 Days</Text>
                </View>
                <View style={styles.streakStatItem}>
                  <Text style={styles.streakStatLabel}>LONGEST STREAK</Text>
                  <Text style={styles.streakStatValue}>157 Days</Text>
                </View>
              </View>
              {/* Daily Streak */}
              <View style={styles.dailyStreakSection}>
                <Text style={styles.dailyStreakLabel}>Daily Streak</Text>
                <View style={styles.daysContainer}>
                  {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => {
                    const isCompleted = [
                      true,
                      true,
                      true,
                      true,
                      false,
                      false,
                      false,
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
                            <Ionicons name="checkmark" size={16} color={COLORS.white} />
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
        {/* Menu List Section */}
       {!showTrainerOnboarding&& <View
          style={[
            styles.menuListContainer,
            isGuest && styles.menuListGuestSpacing,
          ]}
        >
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index === 0 && styles.menuItemActive,
              ]}
              onPress={() => {
                if (isTrainer) {
                  if (item.id === "all-bookings") {
                    navigation.navigate("TrainerBookings");
                  } else if (item.id === "my-availability") {
                    navigation.navigate("TrainerAvailability");
                  } else if (item.id === "my-pricing") {
                    navigation.navigate("TrainerPricing");
                  } else if (item.id === "my-rating") {
                    navigation.navigate("TrainerRatings");
                  } else {
                    console.log(`Pressed ${item.label}`);
                  }
                } else {
                  if (item.id === "posts") {
                    navigation.navigate("MyPosts");
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
                  } else {
                    // Handle other menu items as needed
                    console.log(`Pressed ${item.label}`);
                  }
                }
              }}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons
                  name={item.icon as any}
                  size={20}
                  color={COLORS._616888}
                  style={styles.menuItemIcon}
                />
                <Text style={styles.menuItemLabel}>{item.label}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS._616888}
              />
            </TouchableOpacity>
          ))}
        </View>}
  </RefreshableScrollView>
      {isOwnProfile && !isGuest && (
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Image source={Exit} style={styles.smallIconSize} />
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
    backgroundColor: "red",
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  iconSize: {
    width: 35,
    height: 35,
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
  // Profile Header Styles
  profileHeader: {
    backgroundColor: COLORS.gradient3,
    // height: r(260),
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
    // marginTop: 10,
    marginBottom: 16,
  },
  headerIconsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerIconBtn: {
    // padding: 6,
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  guestAvatar: {
    // backgroundColor: "#6c757d",
  },
  avatarText: {
    fontSize: 48,
    fontFamily: FontWeight.SemiBold,
    color: "white",
  },
  displayName: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: "white",
  },
  locationText: {
    fontSize: 12,
    fontFamily: FontWeight.Regular,
    color: COLORS._D9D9D9,
    marginBottom: 8,
  },
  bioText: {
    fontSize: 14,
    color: COLORS.white,
    textAlign: "center",
    marginBottom:20,
    fontFamily: FontWeight.Regular,
    marginHorizontal: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "white",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    width: "90%",
    position: "absolute",
    alignSelf: "center",
    bottom: -40,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  statItem: {
    alignItems: "center",
    // flex: 1,
  },
  statDivider: {
    width: 1,
    height: "70%",
    backgroundColor: COLORS._E6E6E7,
    opacity: 1,
    justifyContent: "center",
    alignSelf: "center",
  },
  statNumber: {
    fontSize: 20,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.app_black,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS._5E5E5E,
    fontFamily: FontWeight.Medium,
    textTransform: "uppercase",
  },

  // Action Buttons Styles
  actionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  followButton: {
    backgroundColor: "#4a90e2",
  },
  followButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  messageButton: {
    backgroundColor: "red",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  messageButtonText: {
    color: "#333",
    fontWeight: "600",
    fontSize: 16,
  },

  // Tab Bar Styles
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

  // Tab Content Styles
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

  // Activity Tab Styles
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
    backgroundColor: COLORS.white,
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
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    color: "#999",
    fontSize: 16,
  },
  postCard: {
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  postContent: {
    fontSize: 14,
    color: COLORS.app_black,
    fontFamily: FontWeight.Regular,
    marginBottom: 10,
  },
  postTime: {
    fontSize: 12,
    fontFamily: FontWeight.Regular,
    color: COLORS._616888,
  },
  postActions: {
    flexDirection: "row",
    gap: 20,
  },
  postAction: {
    fontSize: 12,
    marginLeft: 3,
    fontFamily: FontWeight.Regular,
    color: COLORS._616888,
  },

  // Workout Card Styles
  workoutPostCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#4A90E2",
  },
  workoutPostContent: {
    fontSize: 16,
    color: COLORS.app_black,
    lineHeight: 22,
    marginBottom: 12,
    fontFamily: FontWeight.Regular,
  },
  workoutPostFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  workoutPostTime: {
    fontSize: 14,
    color: COLORS._5E5E5E,
    fontFamily: FontWeight.Regular,
  },
  workoutPostActions: {
    flexDirection: "row",
    gap: 16,
  },
  workoutPostAction: {
    fontSize: 14,
    color: COLORS._5E5E5E,
    fontFamily: FontWeight.Medium,
  },
  workoutCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  workoutHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "red",
  },
  workoutTitle: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.app_black,
    flex: 1,
    marginBottom: 4,
  },
  postItButton: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS._CCCCCC,
    alignSelf: "center",
  },
  postItButtonText: {
    fontSize: 14,
    color: COLORS.app_black,
    fontFamily: FontWeight.Medium,
  },
  workoutDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
    gap: 10,
  },
  workoutTag: {
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  strengthTag: {
    backgroundColor: COLORS._D2E7FF,
  },
  workoutTagText: {
    fontSize: 12,
    color: COLORS._0B80FF,
    fontFamily: FontWeight.Regular,
  },
  workoutInfo: {
    fontSize: 12,
    color: COLORS.app_black,
    fontFamily: FontWeight.Regular,
  },
  workoutCompleted: {
    fontSize: 14,
    color: COLORS._5E5E5E,
    fontFamily: FontWeight.Regular,
  },

  // Achievements Tab Styles
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  achievementCardGrid: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 10,
    width: "48%",
    height: 140,
    marginBottom: 15,
    alignItems: "flex-start",
    justifyContent: "space-between",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },

  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  achievementIconText: {
    width: 25,
    height: 25,
  },
  achievementTitle: {
    fontSize: 16,
    top: -5,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.app_black,
    textAlign: "left",
  },
  achievementDescription: {
    fontSize: 12,
    fontFamily: FontWeight.Regular,
    color: COLORS._5E5E5E,
    textAlign: "left",
  },
  achievementProgress: {
    width: "100%",
    marginTop: "auto",
  },
  achievementProgressBar: {
    height: 3,
    backgroundColor: COLORS._D9D9D9,
    borderRadius: 2,
  },
  achievementProgressFill: {
    height: "100%",
    backgroundColor: "#4a90e2",
    borderRadius: 10,
  },

  // Connections Tab Styles
  connectionCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  connectionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    alignItems: "center",
    marginRight: 15,
  },
  connectionAvatarText: {
    fontSize: 15,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.white,
  },
  connectionInfo: {
    flex: 1,
  },
  connectionName: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.app_black,
    marginBottom: 2,
  },
  connectionLocation: {
    fontSize: 14,
    fontFamily: FontWeight.Regular,
    color: COLORS._5E5E5E,
  },
  messageConnectionButton: {
    backgroundColor: "#4a90e2",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  messageConnectionButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },

  // Logout Section Styles
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
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  logoutButtonText: {
    color: COLORS._EB3434,
    fontSize: 14,
    left: 5,
    fontFamily: FontWeight.Medium,
  },

  // Legacy styles (keeping for compatibility)
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
  // Weekly Activity Styles
  weeklyActivityCard: {
    width: '90%',
    maxWidth: 600,
    alignSelf: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginTop: 60,
    marginBottom: 16,
    shadowColor: '#000',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  weeklyGoalLabel: {
    fontSize: 12,
    fontFamily: FontWeight.Regular,
    color: COLORS._616888,
  },
  weeklyGoalValue: {
    fontSize: 12,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.primary,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: COLORS._E6E6E7,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  streakStatsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 6,
    marginBottom: 12,
  },
  streakStatItem: {
    flex: 1,
  },
  streakStatLabel: {
    fontSize: 9,
    fontFamily: FontWeight.Medium,
    color: COLORS._616888,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  streakStatValue: {
    fontSize: 20,
    fontFamily: FontWeight.Bold,
    color: COLORS.app_black,
  },
  dailyStreakSection: {
    paddingTop: 6,
  },
  dailyStreakLabel: {
    fontSize: 12,
    fontFamily: FontWeight.Regular,
    color: COLORS._616888,
    marginBottom: 10,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
  },
  dayLabel: {
    fontSize: 11,
    fontFamily: FontWeight.Regular,
    color: COLORS._616888,
  },
  dayCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleCompleted: {
    backgroundColor: COLORS.primary,
  },
  dayCircleIncomplete: {
    borderWidth: 2,
    borderColor: COLORS._E6E6E7,
    backgroundColor: 'transparent',
  },
  // Menu List Styles
  menuListContainer: {
    flexDirection: 'column',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 0,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  menuListGuestSpacing: {
    paddingVertical: 70,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS._E6E6E7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItemActive: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemIcon: {
    marginRight: 0,
  },
  menuItemLabel: {
    fontSize: 16,
    fontFamily: FontWeight.Medium,
    color: COLORS.app_black,
  },
});

export default ProfileScreen;
