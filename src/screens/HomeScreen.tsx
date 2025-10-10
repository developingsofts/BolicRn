import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { COLORS, DIMENSIONS } from "../config/constants";
import STRINGS from "../config/strings";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import FontWeight from "../hooks/useInterFonts";
import BasicTopBar from "../components/BasicTopBar";
import { useGetPostsQuery, useDeletePostMutation, useUpdatePostMutation } from '../services/api/postsApi';
import { useToggleLikeMutation } from '../services/api/likesCommentsApi';
import { Like, CommentIcon } from '../../assets';
import CommentsModal from '../components/CommentsModal';
import ConfirmationDialog from '../components/ConfirmationDialog';

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
  const [refreshing, setRefreshing] = useState(false);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [openPostMenuId, setOpenPostMenuId] = useState<string | null>(null);
  const [showDeletePostDialog, setShowDeletePostDialog] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<{ id: string; caption: string } | null>(null);
  const [editPostText, setEditPostText] = useState("");
  
  // Fetch posts for Community Highlights
  const { data: postsData, isLoading: postsLoading, refetch: refetchPosts } = useGetPostsQuery({ page: 1, limit: 5 });
  const communityPosts = (postsData?.status && postsData?.data?.posts) ? postsData.data.posts : [];
  
  // Like mutation
  const [toggleLike] = useToggleLikeMutation();
  const [deletePost, { isLoading: isDeleting }] = useDeletePostMutation();
  const [updatePost, { isLoading: isUpdating }] = useUpdatePostMutation();
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchPosts();
    setRefreshing(false);
  };

  const handleLikePost = async (postId: string) => {
    try {
      await toggleLike(postId).unwrap();
      // Posts will auto-refresh due to cache invalidation
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleOpenComments = (postId: string) => {
    setSelectedPostId(postId);
    setCommentsModalVisible(true);
  };

  const handleCloseComments = () => {
    setCommentsModalVisible(false);
    setSelectedPostId(null);
    refetchPosts(); // Refresh posts to update comment counts
  };

  const handlePostMenuPress = (postId: string) => {
    setOpenPostMenuId(openPostMenuId === postId ? null : postId);
  };

  const handleDeletePostPress = (postId: string) => {
    setOpenPostMenuId(null);
    setPostToDelete(postId);
    setShowDeletePostDialog(true);
  };

  const handleEditPostPress = (postId: string, caption: string) => {
    setOpenPostMenuId(null);
    setEditingPost({ id: postId, caption });
    setEditPostText(caption);
  };

  const handleSaveEditPost = async () => {
    if (!editingPost || !editPostText.trim()) return;

    try {
      await updatePost({
        postId: editingPost.id,
        title: editPostText.trim(),
      }).unwrap();
      
      setEditingPost(null);
      setEditPostText("");
      refetchPosts();
      Alert.alert('Success', 'Post updated successfully!');
    } catch (error) {
      console.error('Failed to update post:', error);
      Alert.alert('Error', 'Failed to update post. Please try again.');
    }
  };

  const handleCancelEditPost = () => {
    setEditingPost(null);
    setEditPostText("");
  };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    
    try {
      await deletePost({ postId: postToDelete }).unwrap();
      refetchPosts();
      setShowDeletePostDialog(false);
      setPostToDelete(null);
    } catch (error) {
      console.error('Failed to delete post:', error);
      Alert.alert('Error', 'Failed to delete post.');
      setShowDeletePostDialog(false);
      setPostToDelete(null);
    }
  };

  const cancelDeletePost = () => {
    setShowDeletePostDialog(false);
    setPostToDelete(null);
  };
  
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
    Alert.alert(STRINGS.HOME.deleteNoteTitle, STRINGS.HOME.deleteNoteMessage, [
      { text: STRINGS.HOME.cancel, style: "cancel" },
      {
        text: STRINGS.COMMON.delete,
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
    navigation.navigate("SelectWorkout");
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    
    return "Just now";
  };

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Header */}
        <BasicTopBar
          showBackButton={false}
          containerStyle={styles.header}
          title={`Good morning, ${user?.displayName}! 👋`}
          subtitle="Ready to crush your goals today?"
          titleStyle={styles.greeting}
          subtitleStyle={styles.subtitle}
          endView={
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => navigation.navigate("Profile")}
            >
              {user?.imageUrl ? (
                <Image 
                  source={{ uri: user.imageUrl }} 
                  style={styles.profileButtonImage}
                />
              ) : (
                <Text style={styles.profileButtonText}>
                  {user?.displayName?.charAt(0) || "U"}
                </Text>
              )}
            </TouchableOpacity>
          }
        />

        <View style={styles.mainContent}>
          {/* Weekly Goal Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{STRINGS.HOME.weeklyGoal}</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
                <Text style={styles.editButton}>{STRINGS.HOME.edit}</Text>
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
                      width: `${
                        (weeklyGoal.current / weeklyGoal.target) * 100
                      }%`,
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
              <Text style={styles.sectionTitle}>
                {STRINGS.HOME.workoutOfDay}
              </Text>
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
                {workoutOfTheDay.exercises
                  .slice(0, 3)
                  .map((exercise, index) => (
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
                      {STRINGS.HOME.startWorkout}
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

          {/* Community Highlights */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🔥 Community Highlights</Text>
              <TouchableOpacity onPress={() => navigation.navigate("HomeFeed")}>
                <Text style={styles.viewAllButton}>{STRINGS.HOME.viewAll}</Text>
              </TouchableOpacity>
            </View>
            
            {postsLoading ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : communityPosts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No posts yet. Be the first to share!</Text>
                <TouchableOpacity 
                  style={styles.emptyStateButton}
                  onPress={() => navigation.navigate('CreatePost')}
                >
                  <Text style={styles.emptyStateButtonText}>Create Post</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                activeOpacity={1} 
                onPress={() => setOpenPostMenuId(null)}
                style={styles.socialFeed}
              >
                {communityPosts.slice(0, 3).map((post: any) => {
                  const postUser = post.user || {};
                  // Use displayName, userName, or email as fallback
                  const userName = postUser.displayName || postUser.userName || postUser.email || 'Anonymous User';
                  const initials = userName !== 'Anonymous User'
                    ? userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)
                    : 'AU';
                  const timeAgo = getTimeAgo(new Date(post.createdAt));
                  
                  return (
                    <View key={post.id} style={styles.socialPost}>
                      <View style={styles.socialPostHeader}>
                        <View style={styles.socialPostAvatar}>
                          {postUser.imageUrl ? (
                            <Image 
                              source={{ uri: postUser.imageUrl }} 
                              style={styles.socialPostAvatarImage}
                            />
                          ) : (
                            <Text style={styles.socialPostAvatarText}>{initials}</Text>
                          )}
                        </View>
                        <View style={styles.socialPostInfo}>
                          <Text style={styles.socialPostName}>
                            {userName}
                          </Text>
                          <Text style={styles.socialPostTime}>{timeAgo}</Text>
                        </View>
                        {user?.id === post.userId && (
                          <View>
                            <TouchableOpacity 
                              style={styles.socialPostMenu}
                              onPress={() => handlePostMenuPress(post.id.toString())}
                            >
                              <Text style={styles.socialPostMenuText}>⋯</Text>
                            </TouchableOpacity>
                            {openPostMenuId === post.id.toString() && (
                              <View style={styles.postMenuDropdown}>
                                <TouchableOpacity 
                                  onPress={() => handleEditPostPress(post.id.toString(), post.title || '')}
                                  style={styles.postMenuOption}
                                >
                                  <Text style={styles.postMenuOptionText}>Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                  onPress={() => handleDeletePostPress(post.id.toString())}
                                  style={styles.postMenuOption}
                                >
                                  <Text style={styles.postMenuOptionText}>Delete</Text>
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                      <Text style={styles.socialPostContent}>
                        {post.title}
                      </Text>
                      {post.mediaUrl && (
                        <Image 
                          source={{ uri: post.mediaUrl }} 
                          style={styles.socialPostImage}
                          resizeMode="cover"
                        />
                      )}
                      <View style={styles.socialPostActions}>
                        <TouchableOpacity 
                          style={styles.socialPostAction}
                          onPress={() => handleLikePost(post.id.toString())}
                        >
                          <Image 
                            source={Like} 
                            style={[
                              styles.socialPostActionIcon,
                              { tintColor: post.isLikedByUser ? COLORS.gradient1 : '#888888' }
                            ]}
                          />
                          <Text style={styles.socialPostActionText}>
                            {post.likeCount || 0}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.socialPostAction}
                          onPress={() => handleOpenComments(post.id.toString())}
                        >
                          <Image 
                            source={CommentIcon} 
                            style={[styles.socialPostActionIcon,]}
                          />
                          <Text style={styles.socialPostActionText}>
                            {post.commentCount || 0}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.socialPostAction}
                        >
                          <Text style={styles.handshakeIcon}>🤝</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </TouchableOpacity>
            )}
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
            <Text style={styles.sectionTitle}>{STRINGS.HOME.quickNotes}</Text>
            <View style={styles.notesCard}>
              <View style={styles.notesInputContainer}>
                <TextInput
                  style={styles.notesInput}
                  placeholder={STRINGS.HOME.addNote}
                  placeholderTextColor={COLORS.placeholder}
                  value={newNote}
                  onChangeText={setNewNote}
                  multiline
                  maxLength={200}
                />
                <TouchableOpacity
                  style={styles.addNoteButton}
                  onPress={saveNote}
                >
                  <Text style={styles.addNoteButtonText}>
                    {STRINGS.COMMON.add}
                  </Text>
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
        </View>
      </ScrollView>

      {/* Comments Modal */}
      {selectedPostId && (
        <CommentsModal
          visible={commentsModalVisible}
          postId={selectedPostId}
          onClose={handleCloseComments}
        />
      )}

      {/* Delete Post Confirmation Dialog */}
      <ConfirmationDialog
        visible={showDeletePostDialog}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDeletePost}
        onCancel={cancelDeletePost}
        loading={isDeleting}
      />

      {/* Edit Post Modal */}
      <Modal
        visible={editingPost !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelEditPost}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.editPostModalContainer}
        >
          <TouchableOpacity 
            style={styles.editPostModalOverlay} 
            activeOpacity={1}
            onPress={handleCancelEditPost}
          />
          <View style={styles.editPostModalContent}>
            <View style={styles.editPostModalHeader}>
              <Text style={styles.editPostModalTitle}>Edit Post</Text>
              <TouchableOpacity onPress={handleCancelEditPost}>
                <Text style={styles.editPostModalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.editPostInput}
              value={editPostText}
              onChangeText={setEditPostText}
              placeholder="What's on your mind?"
              placeholderTextColor={COLORS.textSecondary}
              multiline
              autoFocus
              maxLength={500}
            />
            
            <View style={styles.editPostModalActions}>
              <TouchableOpacity 
                style={styles.editPostCancelButton}
                onPress={handleCancelEditPost}
              >
                <Text style={styles.editPostCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.editPostSaveButton,
                  (!editPostText.trim() || isUpdating) && styles.editPostSaveButtonDisabled
                ]}
                onPress={handleSaveEditPost}
                disabled={!editPostText.trim() || isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.editPostSaveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gradient3,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.gradient3,
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingVertical: DIMENSIONS.spacing.xxl,
    paddingBottom: DIMENSIONS.spacing.md,
  },
  greeting: {
    fontSize: 16,
    fontFamily: FontWeight.Medium,
    color: COLORS.white,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.white,
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
    overflow: 'hidden',
  },
  profileButtonImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profileButtonText: {
    fontSize: 20,
  },
  section: {
    paddingHorizontal: DIMENSIONS.spacing.lg,
    marginBottom: DIMENSIONS.spacing.lg,
  },
  mainContent: {
    backgroundColor: COLORS.background,
    paddingTop: 20,
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
    borderBottomColor: COLORS.border,
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
    overflow: 'hidden',
  },
  socialPostAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  socialPostAvatarText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "600",
  },
  workoutBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  workoutBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  socialPostImage: {
    width: '100%',
    height: 200,
    borderRadius: DIMENSIONS.borderRadius,
    marginTop: DIMENSIONS.spacing.sm,
    backgroundColor: COLORS.border,
  },
  emptyState: {
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    padding: DIMENSIONS.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: DIMENSIONS.spacing.md,
    textAlign: 'center',
  },
  emptyStateButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: DIMENSIONS.borderRadius,
  },
  emptyStateButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
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
    fontWeight: '700',
  },
  postMenuDropdown: {
    position: 'absolute',
    top: 35,
    right: 0,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingVertical: DIMENSIONS.spacing.xs,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  postMenuOption: {
    paddingVertical: DIMENSIONS.spacing.sm,
    paddingHorizontal: DIMENSIONS.spacing.md,
  },
  postMenuOptionText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
  socialPostContent: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: DIMENSIONS.spacing.md,
  },
  socialPostActions: {
    flexDirection: "row",
    gap: DIMENSIONS.spacing.lg,
    paddingTop: DIMENSIONS.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  socialPostAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: DIMENSIONS.spacing.xs,
    paddingVertical: DIMENSIONS.spacing.xs,
  },
  socialPostActionIcon: {
    width: 20,
    height: 20,
  },
  socialPostActionText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "600",
  },
  handshakeIcon: {
    fontSize: 20,
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
  editPostModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  editPostModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  editPostModalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: DIMENSIONS.spacing.lg,
    maxHeight: '80%',
  },
  editPostModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DIMENSIONS.spacing.lg,
  },
  editPostModalTitle: {
    fontSize: 20,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.gradient1,
  },
  editPostModalClose: {
    fontSize: 24,
    color: COLORS._616888,
    fontWeight: 'bold',
  },
  editPostInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: DIMENSIONS.spacing.md,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 120,
    maxHeight: 300,
    textAlignVertical: 'top',
    marginBottom: DIMENSIONS.spacing.lg,
  },
  editPostModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: DIMENSIONS.spacing.md,
  },
  editPostCancelButton: {
    paddingVertical: DIMENSIONS.spacing.md,
    paddingHorizontal: DIMENSIONS.spacing.xl,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  editPostCancelButtonText: {
    fontSize: 16,
    fontFamily: FontWeight.Medium,
    color: COLORS.textSecondary,
  },
  editPostSaveButton: {
    paddingVertical: DIMENSIONS.spacing.md,
    paddingHorizontal: DIMENSIONS.spacing.xl,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  editPostSaveButtonDisabled: {
    opacity: 0.5,
  },
  editPostSaveButtonText: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.white,
  },
});

export default HomeScreen;
