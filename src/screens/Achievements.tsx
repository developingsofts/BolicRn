import React, { use } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import BasicTopBar from "../components/BasicTopBar";
import { COLORS, DIMENSIONS } from "../config/constants";
import FontWeight from "../hooks/useInterFonts";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { useGetUserAchievementsQuery } from "../services/api";
import { Achievement } from "./HomeScreen";

const Achievements: React.FC = ({ navigation, route }: any) => {
  const { user, isAuthenticated } = useAuth();
  const userId = route?.params?.userId || user?.id;
  const isOwnProfile =
    !route?.params?.userId || route?.params?.userId === user?.id;
  const handleBookSession = () => {
    navigation.navigate("Main", {
      screen: "Find",
      params: {
        screen: "FindMain",
        params: { tab: "FindTrainers" },
      },
    });
  };

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await refetchAchievements();
    setRefreshing(false);
  };
  const {
    data: achievementsData,
    isLoading: achievementsLoading,
    refetch: refetchAchievements,
    error: achievementsError,
  } = useGetUserAchievementsQuery(
    { userId: userId },
    { skip: !isAuthenticated }
  );

  const achievements = React.useMemo(() => {
    if (!achievementsData?.status) return [];
    const items = (achievementsData.data as any[]) ?? [];
    return items.map((achievement: any) => ({
      id: String(
        achievement?.id ??
          achievement?.achivenmentId ??
          achievement?.title ??
          Math.random()
      ),
      icon: achievement?.icon ?? "🏆",
      title: achievement?.title ?? "Achievement unlocked",
      description: achievement?.description ?? "Keep progressing!",
      unlocked: true,
      progress:
        achievement?.progress ??
        achievement?.currentProgress ??
        achievement?.progressValue ??
        null,
      maxProgress:
        achievement?.target ??
        achievement?.maxProgress ??
        achievement?.goal ??
        null,
      type: achievement?.type ?? undefined,
      earnedAt: achievement?.earnedAt ?? achievement?.createdAt ?? null,
    }));
  }, [achievementsData]);

  const getProgressPercentage = (achievement: Achievement) => {
    if (
      achievement.unlocked &&
      (!achievement.maxProgress || !achievement.progress)
    ) {
      return 100;
    }

    if (!achievement.maxProgress || achievement.maxProgress <= 0) {
      return achievement.unlocked ? 100 : 0;
    }

    const progressValue = achievement.progress ?? 0;

    return Math.min((progressValue / achievement.maxProgress) * 100, 100);
  };

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <BasicTopBar
        onBackPress={() => navigation.goBack()}
        title={isOwnProfile ? "Achievements" : "User Achievements"}
        subtitle={
          isOwnProfile ? "Track your achievements" : "View user achievements"
        }
        containerStyle={{
          paddingTop: DIMENSIONS.spacing.xxl,
          paddingBottom: DIMENSIONS.spacing.lg,
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        <TouchableOpacity style={styles.bookButton} onPress={handleBookSession}>
          <Text style={styles.bookButtonText}>Book New Session</Text>
        </TouchableOpacity>
        {achievementsLoading ? (
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text style={{ color: COLORS.textSecondary }}>
              Loading achievements...
            </Text>
          </View>
        ) : achievementsError ? (
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text style={{ color: COLORS.error }}>
              Failed to load achievements.
            </Text>
          </View>
        ) : achievements.length === 0 ? (
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text style={{ color: COLORS.textSecondary }}>
              No achievements yet.
            </Text>
          </View>
        ) : (
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement) => {
              const progressPercentage = getProgressPercentage(achievement);

              return (
                <View key={achievement.id} style={styles.achievementCard}>
                  <View style={styles.iconRow}>
                    <Text style={styles.achievementIcon}>
                      {achievement.icon}
                    </Text>
                    <View style={{ width: 16 }} />
                    <Text style={styles.achievementIcon}>🏅</Text>
                  </View>
                  <Text style={styles.achievementTitle}>
                    {achievement.title}
                  </Text>
                  <Text style={styles.achievementDescription}>
                    {achievement.description}
                  </Text>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${progressPercentage}%`,
                            backgroundColor: achievement.unlocked
                              ? COLORS.success
                              : COLORS.primary,
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
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
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: DIMENSIONS.spacing.lg,
  },
  bookButton: {
    width: "100%",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  bookButtonText: {
    color: COLORS.black,
    fontFamily: FontWeight.Medium,
    fontSize: 14,
    letterSpacing: 0.2,
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  achievementCard: {
    width: "48%",
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    padding: DIMENSIONS.spacing.md,
    marginBottom: DIMENSIONS.spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    position: "relative",
  },
  iconRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: DIMENSIONS.spacing.sm,
    width: "100%",
  },
  achievementIcon: {
    fontSize: 32,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "left",
    alignSelf: "stretch",
    marginBottom: DIMENSIONS.spacing.xs,
  },
  achievementDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "left",
    alignSelf: "stretch",
    marginBottom: DIMENSIONS.spacing.sm,
  },
  progressContainer: {
    width: "100%",
    alignItems: "center",
  },
  progressBar: {
    width: "100%",
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    marginBottom: DIMENSIONS.spacing.xs,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  unlockedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: COLORS.success,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  unlockedText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "bold",
  },
});

export default Achievements;
