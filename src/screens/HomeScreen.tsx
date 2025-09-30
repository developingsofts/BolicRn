import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { COLORS, DIMENSIONS } from "../config/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

interface HomeScreenProps {
  navigation: any;
}

interface Note {
  id: string;
  text: string;
  timestamp: Date;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

interface WeeklyGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  type: "workouts" | "calories" | "minutes" | "strength" | "cardio";
  completed: boolean;
}

interface WorkoutOfTheDay {
  id: string;
  title: string;
  description: string;
  type: "strength" | "cardio" | "flexibility" | "mixed";
  duration: number;
  difficulty: "easy" | "medium" | "hard";
  exercises: Array<{
    name: string;
    sets: number;
    reps: number;
    weight?: number;
    notes?: string;
  }>;
  completed: boolean;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [weeklyGoal, setWeeklyGoal] = useState<WeeklyGoal>({
    id: "1",
    title: "Complete 4 Workouts This Week",
    target: 4,
    current: 2,
    unit: "workouts",
    type: "workouts",
    completed: false,
  });
  const [workoutOfTheDay, setWorkoutOfTheDay] = useState<WorkoutOfTheDay>({
    id: "1",
    title: "Upper Body Power",
    description:
      "Focus on chest, shoulders, and triceps with compound movements",
    type: "strength",
    duration: 45,
    difficulty: "medium",
    exercises: [
      {
        name: "Bench Press",
        sets: 4,
        reps: 8,
        weight: 135,
        notes: "Focus on form",
      },
      {
        name: "Overhead Press",
        sets: 3,
        reps: 10,
        weight: 95,
        notes: "Control the movement",
      },
      {
        name: "Dumbbell Rows",
        sets: 3,
        reps: 12,
        weight: 45,
        notes: "Squeeze shoulder blades",
      },
      {
        name: "Tricep Dips",
        sets: 3,
        reps: 15,
        notes: "Body weight or assisted",
      },
      { name: "Push-ups", sets: 3, reps: 20, notes: "Full range of motion" },
    ],
    completed: false,
  });
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: "1",
      title: "First Steps",
      description: "Complete your first workout",
      icon: "👟",
      unlocked: true,
      progress: 1,
      maxProgress: 1,
    },
    {
      id: "2",
      title: "Week Warrior",
      description: "Workout 7 days in a row",
      icon: "🔥",
      unlocked: false,
      progress: 3,
      maxProgress: 7,
    },
    {
      id: "3",
      title: "Social Butterfly",
      description: "Connect with 5 training partners",
      icon: "🦋",
      unlocked: false,
      progress: 2,
      maxProgress: 5,
    },
    {
      id: "4",
      title: "Strength Master",
      description: "Complete 50 strength workouts",
      icon: "💪",
      unlocked: false,
      progress: 12,
      maxProgress: 50,
    },
  ]);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const savedNotes = await AsyncStorage.getItem("userNotes");
      if (savedNotes) {
        const parsedNotes = JSON.parse(savedNotes).map((note: any) => ({
          ...note,
          timestamp: new Date(note.timestamp),
        }));
        setNotes(parsedNotes);
      }
    } catch (error) {
      console.error("Error loading notes:", error);
    }
  };

  const saveNote = async () => {
    if (newNote.trim()) {
      const note: Note = {
        id: Date.now().toString(),
        text: newNote.trim(),
        timestamp: new Date(),
      };

      const updatedNotes = [note, ...notes];
      setNotes(updatedNotes);
      setNewNote("");

      try {
        await AsyncStorage.setItem("userNotes", JSON.stringify(updatedNotes));
      } catch (error) {
        console.error("Error saving note:", error);
      }
    }
  };

  const deleteNote = async (noteId: string) => {
    Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const updatedNotes = notes.filter((note) => note.id !== noteId);
          setNotes(updatedNotes);
          try {
            await AsyncStorage.setItem(
              "userNotes",
              JSON.stringify(updatedNotes)
            );
          } catch (error) {
            console.error("Error deleting note:", error);
          }
        },
      },
    ]);
  };

  const getProgressPercentage = (achievement: Achievement) => {
    return Math.min(
      (achievement.progress / achievement.maxProgress) * 100,
      100
    );
  };

  const updateWeeklyGoalProgress = () => {
    const newProgress = Math.min(weeklyGoal.current + 1, weeklyGoal.target);
    setWeeklyGoal((prev) => ({
      ...prev,
      current: newProgress,
      completed: newProgress >= prev.target,
    }));
  };

  const completeWorkoutOfTheDay = () => {
    setWorkoutOfTheDay((prev) => ({ ...prev, completed: true }));
    updateWeeklyGoalProgress();
  };

  const startWorkoutOfTheDay = () => {
    navigation.navigate("WorkoutSession", {
      sessionId: workoutOfTheDay.id,
      workoutData: workoutOfTheDay,
    });
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Good morning, {user?.displayName || "Fitness Buddy"}! 👋
            </Text>
            <Text style={styles.subtitle}>
              Ready to crush your goals today?
            </Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate("Profile")}
          >
            <Text style={styles.profileButtonText}>
              {user?.displayName?.charAt(0) || "U"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Weekly Goal Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎯 Weekly Goal</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.weeklyGoalCard}>
            <View style={styles.weeklyGoalHeader}>
              <Text style={styles.weeklyGoalTitle}>{weeklyGoal.title}</Text>
              <Text style={styles.weeklyGoalProgress}>
                {weeklyGoal.current}/{weeklyGoal.target} {weeklyGoal.unit}
              </Text>
            </View>
            <View style={styles.weeklyGoalBar}>
              <View
                style={[
                  styles.weeklyGoalFill,
                  {
                    width: `${(weeklyGoal.current / weeklyGoal.target) * 100}%`,
                  },
                ]}
              />
            </View>
            {weeklyGoal.completed && (
              <View style={styles.weeklyGoalCompleted}>
                <Text style={styles.weeklyGoalCompletedText}>
                  🎉 Goal Completed!
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Workout of the Day */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔥 Workout of the Day</Text>
            <Text style={styles.workoutDate}>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </Text>
          </View>
          <View style={styles.workoutOfTheDayCard}>
            <View style={styles.workoutOfTheDayHeader}>
              <Text style={styles.workoutOfTheDayTitle}>
                {workoutOfTheDay.title}
              </Text>
              <View style={styles.workoutOfTheDayMeta}>
                <Text style={styles.workoutOfTheDayType}>
                  {workoutOfTheDay.type}
                </Text>
                <Text style={styles.workoutOfTheDayDuration}>
                  {workoutOfTheDay.duration} min
                </Text>
                <Text style={styles.workoutOfTheDayDifficulty}>
                  {workoutOfTheDay.difficulty}
                </Text>
              </View>
            </View>
            <Text style={styles.workoutOfTheDayDescription}>
              {workoutOfTheDay.description}
            </Text>

            <View style={styles.workoutOfTheDayExercises}>
              <Text style={styles.workoutOfTheDayExercisesTitle}>
                Exercises ({workoutOfTheDay.exercises.length})
              </Text>
              {workoutOfTheDay.exercises.slice(0, 3).map((exercise, index) => (
                <View key={index} style={styles.workoutOfTheDayExercise}>
                  <Text style={styles.workoutOfTheDayExerciseName}>
                    {exercise.name}
                  </Text>
                  <Text style={styles.workoutOfTheDayExerciseDetails}>
                    {exercise.sets} sets × {exercise.reps} reps
                    {exercise.weight && ` @ ${exercise.weight}lbs`}
                  </Text>
                </View>
              ))}
              {workoutOfTheDay.exercises.length > 3 && (
                <Text style={styles.workoutOfTheDayMoreExercises}>
                  +{workoutOfTheDay.exercises.length - 3} more exercises
                </Text>
              )}
            </View>

            <View style={styles.workoutOfTheDayActions}>
              {!workoutOfTheDay.completed ? (
                <TouchableOpacity
                  style={styles.startWorkoutButton}
                  onPress={startWorkoutOfTheDay}
                >
                  <Text style={styles.startWorkoutButtonText}>
                    Start Workout
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.workoutCompleted}>
                  <Text style={styles.workoutCompletedText}>
                    ✅ Completed Today
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Social Feed */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔥 Community Highlights</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Messages")}>
              <Text style={styles.viewAllButton}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.socialFeed}>
            <View style={styles.socialPost}>
              <View style={styles.socialPostHeader}>
                <View style={styles.socialPostAvatar}>
                  <Text style={styles.socialPostAvatarText}>MJ</Text>
                </View>
                <View style={styles.socialPostInfo}>
                  <Text style={styles.socialPostName}>Mike Johnson</Text>
                  <Text style={styles.socialPostTime}>2h ago</Text>
                </View>
                <TouchableOpacity style={styles.socialPostMenu}>
                  <Text style={styles.socialPostMenuText}>⋯</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.socialPostContent}>
                Just crushed my PR on deadlifts! 💪 315lbs for 3 reps. The grind
                never stops! Who's hitting the gym today?
              </Text>
              <View style={styles.socialPostStats}>
                <View style={styles.socialPostStat}>
                  <Text style={styles.socialPostStatIcon}>❤️</Text>
                  <Text style={styles.socialPostStatText}>24</Text>
                </View>
                <View style={styles.socialPostStat}>
                  <Text style={styles.socialPostStatIcon}>💬</Text>
                  <Text style={styles.socialPostStatText}>8</Text>
                </View>
                <View style={styles.socialPostStat}>
                  <Text style={styles.socialPostStatIcon}>🤝</Text>
                  <Text style={styles.socialPostStatText}>3</Text>
                </View>
              </View>
            </View>

            <View style={styles.socialPost}>
              <View style={styles.socialPostHeader}>
                <View style={styles.socialPostAvatar}>
                  <Text style={styles.socialPostAvatarText}>SL</Text>
                </View>
                <View style={styles.socialPostInfo}>
                  <Text style={styles.socialPostName}>Sarah Lee</Text>
                  <Text style={styles.socialPostTime}>4h ago</Text>
                </View>
                <TouchableOpacity style={styles.socialPostMenu}>
                  <Text style={styles.socialPostMenuText}>⋯</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.socialPostContent}>
                Morning cardio session complete! 🏃‍♀️ 5 miles in 42 minutes.
                Looking for a running buddy for tomorrow's long run!
              </Text>
              <View style={styles.socialPostStats}>
                <View style={styles.socialPostStat}>
                  <Text style={styles.socialPostStatIcon}>❤️</Text>
                  <Text style={styles.socialPostStatText}>18</Text>
                </View>
                <View style={styles.socialPostStat}>
                  <Text style={styles.socialPostStatIcon}>💬</Text>
                  <Text style={styles.socialPostStatText}>5</Text>
                </View>
                <View style={styles.socialPostStat}>
                  <Text style={styles.socialPostStatIcon}>🤝</Text>
                  <Text style={styles.socialPostStatText}>2</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Friend Suggestions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>👥 Suggested Partners</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Find")}>
              <Text style={styles.viewAllButton}>Find More</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.friendSuggestions}
          >
            <View style={styles.friendSuggestionCard}>
              <View style={styles.friendSuggestionAvatar}>
                <Text style={styles.friendSuggestionAvatarText}>DJ</Text>
              </View>
              <Text style={styles.friendSuggestionName}>David Kim</Text>
              <Text style={styles.friendSuggestionDetails}>
                Strength Training • 2.3 miles away
              </Text>
              <TouchableOpacity style={styles.friendSuggestionButton}>
                <Text style={styles.friendSuggestionButtonText}>Connect</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.friendSuggestionCard}>
              <View style={styles.friendSuggestionAvatar}>
                <Text style={styles.friendSuggestionAvatarText}>EM</Text>
              </View>
              <Text style={styles.friendSuggestionName}>Emma Martinez</Text>
              <Text style={styles.friendSuggestionDetails}>
                Cardio • 1.8 miles away
              </Text>
              <TouchableOpacity style={styles.friendSuggestionButton}>
                <Text style={styles.friendSuggestionButtonText}>Connect</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.friendSuggestionCard}>
              <View style={styles.friendSuggestionAvatar}>
                <Text style={styles.friendSuggestionAvatarText}>CW</Text>
              </View>
              <Text style={styles.friendSuggestionName}>Chris Wilson</Text>
              <Text style={styles.friendSuggestionDetails}>
                CrossFit • 3.1 miles away
              </Text>
              <TouchableOpacity style={styles.friendSuggestionButton}>
                <Text style={styles.friendSuggestionButtonText}>Connect</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate("Groups")}
            >
              <Text style={styles.quickActionIcon}>👥</Text>
              <Text style={styles.quickActionTitle}>Find Groups</Text>
              <Text style={styles.quickActionSubtitle}>
                Join training communities
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate("Find")}
            >
              <Text style={styles.quickActionIcon}>🤝</Text>
              <Text style={styles.quickActionTitle}>Find Partners</Text>
              <Text style={styles.quickActionSubtitle}>
                Connect with fitness buddies
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate("CreatePost")}
            >
              <Text style={styles.quickActionIcon}>📝</Text>
              <Text style={styles.quickActionTitle}>Share Progress</Text>
              <Text style={styles.quickActionSubtitle}>
                Post your achievements
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate("Profile")}
            >
              <Text style={styles.quickActionIcon}>📊</Text>
              <Text style={styles.quickActionTitle}>View Stats</Text>
              <Text style={styles.quickActionSubtitle}>
                Check your progress
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Quick Notes</Text>
          <View style={styles.notesCard}>
            <View style={styles.notesInputContainer}>
              <TextInput
                style={styles.notesInput}
                placeholder="Add a quick note..."
                placeholderTextColor={COLORS.placeholder}
                value={newNote}
                onChangeText={setNewNote}
                multiline
                maxLength={200}
              />
              <TouchableOpacity style={styles.addNoteButton} onPress={saveNote}>
                <Text style={styles.addNoteButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            {notes.length > 0 && (
              <View style={styles.notesList}>
                {notes.slice(0, 3).map((note) => (
                  <View key={note.id} style={styles.noteItem}>
                    <Text style={styles.noteText} numberOfLines={2}>
                      {note.text}
                    </Text>
                    <View style={styles.noteFooter}>
                      <Text style={styles.noteTime}>
                        {note.timestamp.toLocaleDateString()}
                      </Text>
                      <TouchableOpacity
                        onPress={() => deleteNote(note.id)}
                        style={styles.deleteNoteButton}
                      >
                        <Text style={styles.deleteNoteText}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                {notes.length > 3 && (
                  <TouchableOpacity style={styles.viewAllNotesButton}>
                    <Text style={styles.viewAllNotesText}>
                      View all {notes.length} notes
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Gamification - Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Achievements</Text>
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement) => (
              <View key={achievement.id} style={styles.achievementCard}>
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementDescription}>
                  {achievement.description}
                </Text>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${getProgressPercentage(achievement)}%`,
                          backgroundColor: achievement.unlocked
                            ? COLORS.success
                            : COLORS.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {achievement.progress}/{achievement.maxProgress}
                  </Text>
                </View>
                {achievement.unlocked && (
                  <View style={styles.unlockedBadge}>
                    <Text style={styles.unlockedText}>✓ Unlocked</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            <View style={styles.activityItem}>
              <Text style={styles.activityIcon}>🏋️</Text>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Leg Day</Text>
                <Text style={styles.activityDetails}>
                  1h 15m • 6 exercises • 14,320 lbs
                </Text>
              </View>
              <Text style={styles.activityTime}>Today</Text>
            </View>

            <View style={styles.activityItem}>
              <Text style={styles.activityIcon}>🤝</Text>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>New Match!</Text>
                <Text style={styles.activityDetails}>
                  You matched with Alex Johnson
                </Text>
              </View>
              <Text style={styles.activityTime}>2h ago</Text>
            </View>

            <View style={styles.activityItem}>
              <Text style={styles.activityIcon}>🏆</Text>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Achievement Unlocked</Text>
                <Text style={styles.activityDetails}>
                  Week Warrior - 7 day streak!
                </Text>
              </View>
              <Text style={styles.activityTime}>Yesterday</Text>
            </View>
          </View>
        </View>

        {/* Create Post */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.createPostButton}
            // onPress={() => navigation.navigate("CreatePost")}
              onPress={() => navigation.navigate("ShareWorkout")}
          >
            <Text style={styles.createPostIcon}>✏️</Text>
            <Text style={styles.createPostText}>Share your workout</Text>
          </TouchableOpacity>
        </View>
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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingVertical: DIMENSIONS.spacing.lg,
  },
  greeting: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileButtonText: {
    fontSize: 20,
  },
  section: {
    paddingHorizontal: DIMENSIONS.spacing.lg,
    marginBottom: DIMENSIONS.spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.md,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionCard: {
    flex: 1,
    borderRadius: DIMENSIONS.borderRadius,
    padding: DIMENSIONS.spacing.lg,
    marginHorizontal: DIMENSIONS.spacing.xs,
    alignItems: "center",
    borderWidth: 1,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: DIMENSIONS.spacing.sm,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: DIMENSIONS.spacing.xs,
  },
  actionSubtitle: {
    fontSize: 12,
    textAlign: "center",
  },

  // Notepad Styles
  notepadContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  noteInputContainer: {
    flexDirection: "row",
    padding: DIMENSIONS.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor:COLORS.border,
  },
  noteInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: DIMENSIONS.spacing.sm,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    marginRight: DIMENSIONS.spacing.sm,
  },
  addNoteButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: DIMENSIONS.spacing.md,
    paddingVertical: DIMENSIONS.spacing.sm,
    borderRadius: 8,
    justifyContent: "center",
  },
  addNoteButtonText: {
    color: COLORS.surface,
    fontWeight: "600",
    fontSize: 14,
  },
  notesList: {
    padding: DIMENSIONS.spacing.md,
  },
  noteItem: {
    marginBottom: DIMENSIONS.spacing.md,
    padding: DIMENSIONS.spacing.md,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noteText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.sm,
  },
  noteFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  noteTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  deleteNoteButton: {
    padding: 4,
  },
  deleteNoteText: {
    fontSize: 16,
  },
  viewAllNotesButton: {
    alignItems: "center",
    padding: DIMENSIONS.spacing.sm,
  },
  viewAllNotesText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "500",
  },

  // Achievements Styles
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
  achievementIcon: {
    fontSize: 32,
    marginBottom: DIMENSIONS.spacing.sm,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: DIMENSIONS.spacing.xs,
  },
  achievementDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: DIMENSIONS.spacing.sm,
  },
  progressContainer: {
    width: "100%",
    alignItems: "center",
  },
  progressBar: {
    width: "100%",
    height: 6,
    backgroundColor: "#E5E7EB",
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
    top: DIMENSIONS.spacing.xs,
    right: DIMENSIONS.spacing.xs,
    backgroundColor: "#10B981",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unlockedText: {
    fontSize: 10,
    color: COLORS.surface,
    fontWeight: "600",
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    padding: DIMENSIONS.spacing.lg,
    marginBottom: DIMENSIONS.spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: DIMENSIONS.spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  activityList: {
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: DIMENSIONS.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  activityIcon: {
    fontSize: 24,
    marginRight: DIMENSIONS.spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.xs,
  },
  activityDetails: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  activityTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  createPostButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: DIMENSIONS.borderRadius,
    padding: DIMENSIONS.spacing.lg,
    justifyContent: "center",
  },
  createPostIcon: {
    fontSize: 20,
    marginRight: DIMENSIONS.spacing.sm,
  },
  createPostText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.surface,
  },

  // Weekly Goal and Workout of the Day styles
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: DIMENSIONS.spacing.md,
  },
  editButton: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
  },
  weeklyGoalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    padding: DIMENSIONS.spacing.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  weeklyGoalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: DIMENSIONS.spacing.md,
  },
  weeklyGoalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    flex: 1,
  },
  weeklyGoalProgress: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },
  weeklyGoalBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: DIMENSIONS.spacing.sm,
  },
  weeklyGoalFill: {
    height: "100%",
    backgroundColor: COLORS.success,
    borderRadius: 4,
  },
  weeklyGoalCompleted: {
    alignItems: "center",
    padding: DIMENSIONS.spacing.sm,
    backgroundColor: COLORS.success,
    borderRadius: 8,
  },
  weeklyGoalCompletedText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.surface,
  },
  workoutDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  workoutOfTheDayCard: {
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    padding: DIMENSIONS.spacing.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  workoutOfTheDayHeader: {
    marginBottom: DIMENSIONS.spacing.md,
  },
  workoutOfTheDayTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.sm,
  },
  workoutOfTheDayMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: DIMENSIONS.spacing.md,
  },
  workoutOfTheDayType: {
    fontSize: 12,
    color: COLORS.primary,
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  workoutOfTheDayDuration: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  workoutOfTheDayDifficulty: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  workoutOfTheDayDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: DIMENSIONS.spacing.lg,
  },
  workoutOfTheDayExercises: {
    marginBottom: DIMENSIONS.spacing.lg,
  },
  workoutOfTheDayExercisesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.md,
  },
  workoutOfTheDayExercise: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: DIMENSIONS.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  workoutOfTheDayExerciseName: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text,
    flex: 1,
  },
  workoutOfTheDayExerciseDetails: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  workoutOfTheDayMoreExercises: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "500",
    textAlign: "center",
    paddingTop: DIMENSIONS.spacing.sm,
  },
  workoutOfTheDayActions: {
    alignItems: "center",
  },
  startWorkoutButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: DIMENSIONS.spacing.xl,
    paddingVertical: DIMENSIONS.spacing.md,
    borderRadius: DIMENSIONS.borderRadius,
    minWidth: 200,
    alignItems: "center",
  },
  startWorkoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.surface,
  },
  workoutCompleted: {
    backgroundColor: COLORS.success,
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingVertical: DIMENSIONS.spacing.md,
    borderRadius: DIMENSIONS.borderRadius,
    alignItems: "center",
  },
  workoutCompletedText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.surface,
  },
  viewAllButton: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
  },
  socialFeed: {
    gap: DIMENSIONS.spacing.md,
  },
  socialPost: {
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    padding: DIMENSIONS.spacing.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  socialPostHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: DIMENSIONS.spacing.md,
  },
  socialPostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: DIMENSIONS.spacing.md,
  },
  socialPostAvatarText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "600",
  },
  socialPostInfo: {
    flex: 1,
  },
  socialPostName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 2,
  },
  socialPostTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  socialPostMenu: {
    padding: DIMENSIONS.spacing.sm,
  },
  socialPostMenuText: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
  socialPostContent: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: DIMENSIONS.spacing.md,
  },
  socialPostStats: {
    flexDirection: "row",
    gap: DIMENSIONS.spacing.lg,
  },
  socialPostStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: DIMENSIONS.spacing.xs,
  },
  socialPostStatIcon: {
    fontSize: 16,
  },
  socialPostStatText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  friendSuggestions: {
    marginHorizontal: -DIMENSIONS.spacing.lg,
    paddingHorizontal: DIMENSIONS.spacing.lg,
  },
  friendSuggestionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    padding: DIMENSIONS.spacing.lg,
    marginRight: DIMENSIONS.spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 140,
  },
  friendSuggestionAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: DIMENSIONS.spacing.sm,
  },
  friendSuggestionAvatarText: {
    color: COLORS.surface,
    fontSize: 18,
    fontWeight: "600",
  },
  friendSuggestionName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: DIMENSIONS.spacing.xs,
  },
  friendSuggestionDetails: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: DIMENSIONS.spacing.md,
    lineHeight: 16,
  },
  friendSuggestionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: DIMENSIONS.spacing.md,
    paddingVertical: DIMENSIONS.spacing.sm,
    borderRadius: DIMENSIONS.borderRadius,
    minWidth: 80,
    alignItems: "center",
  },
  friendSuggestionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.surface,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickActionCard: {
    width: "48%",
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    padding: DIMENSIONS.spacing.lg,
    marginBottom: DIMENSIONS.spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: DIMENSIONS.spacing.sm,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.xs,
    textAlign: "center",
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  notesCard: {
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  notesInputContainer: {
    flexDirection: "row",
    padding: DIMENSIONS.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  notesInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: DIMENSIONS.spacing.sm,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    marginRight: DIMENSIONS.spacing.sm,
  },
  addNoteButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: DIMENSIONS.spacing.md,
    paddingVertical: DIMENSIONS.spacing.sm,
    justifyContent: "center",
  },
  addNoteButtonText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: "600",
  },
  notesList: {
    padding: DIMENSIONS.spacing.md,
  },
  noteItem: {
    marginBottom: DIMENSIONS.spacing.md,
    paddingBottom: DIMENSIONS.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  noteText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.sm,
  },
  noteFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  noteTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  deleteNoteButton: {
    padding: DIMENSIONS.spacing.xs,
  },
  deleteNoteText: {
    fontSize: 16,
  },
  viewAllNotesButton: {
    alignItems: "center",
    paddingTop: DIMENSIONS.spacing.sm,
  },
  viewAllNotesText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
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
    padding: DIMENSIONS.spacing.lg,
    marginBottom: DIMENSIONS.spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: DIMENSIONS.spacing.sm,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.xs,
    textAlign: "center",
  },
  achievementDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: DIMENSIONS.spacing.md,
  },
  progressContainer: {
    width: "100%",
    marginBottom: DIMENSIONS.spacing.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: DIMENSIONS.spacing.xs,
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  unlockedBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: DIMENSIONS.spacing.sm,
    paddingVertical: DIMENSIONS.spacing.xs,
    borderRadius: 12,
  },
  unlockedText: {
    fontSize: 10,
    color: COLORS.surface,
    fontWeight: "600",
  },
});

export default HomeScreen;
