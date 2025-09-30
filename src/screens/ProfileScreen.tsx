import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { COLORS, DIMENSIONS } from "../config/constants";
import RatingStars from "../components/RatingStars";
import { useResponsive } from "../hooks/responsiveDesignHook";
import { SafeAreaView } from "react-native-safe-area-context";
import { r } from "../designing/responsiveDesigns";
import { Ionicons } from "@expo/vector-icons";
import {
  Awards,
  CircleEdit,
  Comment,
  Edit,
  Exit,
  Fire,
  Like,
  Settings,
  Thunder,
  Users,
} from "../../assets";
import FontWeight from "../hooks/useInterFonts";

interface ProfileScreenProps {
  navigation: any;
  route?: {
    params?: {
      isGuest?: boolean;
      userId?: string;
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
  const styles = useResponsive(baseStyles);
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
  const isOwnProfile =
    !route?.params?.userId || route.params.userId === user?.id;

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
            Completed: {item.completedDate}
          </Text>
        </View>
        <TouchableOpacity style={styles.postItButton}>
          <Text style={styles.postItButtonText}>Post it</Text>
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
        <Text style={styles.postItButtonText}>Message</Text>
      </TouchableOpacity>
    </View>
  );

  const renderProfileAvatar = () => {
    const initial = user?.displayName?.charAt(0) || (isGuest ? "G" : "D");
    const displayName =
      user?.displayName || (isGuest ? "Guest User" : "Development User");
    const location = user?.location || "San Francisco, CA";

    return (
      <View style={styles.profileHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="chevron-down"
            size={24}
            color={COLORS.white}
            style={{ transform: [{ rotate: "90deg" }] }}
          />
        </TouchableOpacity>

        {!isGuest && isOwnProfile && (
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerIcon}>
              <Image
                source={CircleEdit}
                resizeMode="contain"
                style={styles.iconSize}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIcon}
              onPress={() => navigation.navigate("Settings")}
            >
              <Image
                source={Settings}
                resizeMode="contain"
                style={styles.iconSize}
              />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, isGuest && styles.guestAvatar]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.locationText}>{location}</Text>
        </View>

        <Text style={styles.bioText}>
          Fitness enthusiast on a mission to lift heavy and inspire others.
          Let's connect and crush some goals together! 🚀
        </Text>
      </View>
    );
  };

  const renderStatsRow = () => (
    <View style={styles.statsRow}>
      <View style={styles.statItem}>
        <Image source={Thunder} style={styles.smallIconSize} />
        <Text style={styles.statNumber}>157</Text>
        <Text style={styles.statLabel}>WORKOUTS</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Image source={Fire} style={styles.smallIconSize} />
        <Text style={styles.statNumber}>157</Text>
        <Text style={styles.statLabel}>STREAK</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Image source={Users} style={[styles.smallIconSize, { top: 2 }]} />
        <Text style={styles.statNumber}>12</Text>
        <Text style={styles.statLabel}>PARTNERS</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Image source={Awards} style={[styles.smallIconSize, { top: 2 }]} />
        <Text style={styles.statNumber}>8</Text>
        <Text style={styles.statLabel}>AWARDS</Text>
      </View>
    </View>
  );

  const renderActionButtons = () => {
    if (isGuest) {
      return (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.followButton]}
            onPress={handleFollowToggle}
          >
            <Text style={styles.followButtonText}>
              {isFollowing ? "👤 Following" : "👤 Following"}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!isOwnProfile) {
      return (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.followButton]}
            onPress={handleFollowToggle}
          >
            <Text style={styles.followButtonText}>
              {isFollowing ? "Following" : "Follow"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.messageButton]}
            onPress={() => handleMessageUser(route?.params?.userId || "")}
          >
            <Text style={styles.messageButtonText}>Message</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === "activity" && styles.activeTab]}
        onPress={() => setActiveTab("activity")}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === "activity" && styles.activeTabText,
          ]}
        >
          Your Activity
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === "achievements" && styles.activeTab]}
        onPress={() => setActiveTab("achievements")}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === "achievements" && styles.activeTabText,
          ]}
        >
          Achievements
        </Text>
      </TouchableOpacity>
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
            Posts
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
            Workouts
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
                <View style={styles.achievementBadgeIcon}>
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
      edges={["top", "left", "right"]}
      style={[styles.container, isGuest && styles.guestContainer]}
    >
      <View style={styles.profileHeader} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderProfileAvatar()}
        {renderStatsRow()}
        {renderActionButtons()}
        {renderTabBar()}
        {renderTabContent()}
      </ScrollView>

      {isOwnProfile && !isGuest && (
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Image source={Exit} style={styles.smallIconSize} />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  guestContainer: {
    backgroundColor: "red",
  },
  scrollView: {
    flex: 1,
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
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
  },

  postIconSize: {
    width: 15,
    height: 15,
  },
  // Profile Header Styles
  profileHeader: {
    backgroundColor: COLORS.gradient3,
    height: r(260),
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
    position: "absolute",
    right: 20,
    top: 45,
    flexDirection: "row",
    gap: 10,
  },
  headerIconText: {
    fontSize: 20,
    color: "white",
  },
  avatarContainer: {
    alignItems: "center",
    marginTop: r(70),
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
  },
  guestAvatar: {
    backgroundColor: "#6c757d",
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
    fontFamily: FontWeight.Regular,
    marginHorizontal: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "white",
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginHorizontal: 20,
    marginTop: -10,
    borderRadius: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    backgroundColor: "#f0f0f0",
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
    marginTop: 20,
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
    marginBottom: 15,
    alignItems: "flex-start",
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
    marginTop: 10,
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
    left:5,
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
});

export default ProfileScreen;
