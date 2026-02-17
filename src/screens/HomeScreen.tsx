import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
  ScrollView,
  Pressable,
} from "react-native";
import RefreshableScrollView from "../components/RefreshableScrollView";
import { useAuth } from "../contexts/AuthContext";
import { COLORS, DIMENSIONS } from "../config/constants";
import STRINGS from "../config/strings";
import { SafeAreaView } from "react-native-safe-area-context";
import FontWeight from "../hooks/useInterFonts";
import BasicTopBar from "../components/BasicTopBar";
import ReactionSummary from "../components/ReactionSummary";
import ReactionPicker from "../components/ReactionPicker";
import {
  useGetPostsQuery,
  useDeletePostMutation,
  useUpdatePostMutation,
  useGetUserPostsQuery,
} from "../services/api/postsApi";
import { useToggleLikeMutation } from "../services/api/likesCommentsApi";
import {
  useGetWorkoutHistoryQuery,
  useGetWorkoutsQuery,
  useGetUserAchievementsQuery,
  useGetWorkoutByIdQuery,
} from "../services/api/workoutApi";
import { useGetPotentialMatchesQuery } from "../services/api/matchingApi";
import {
  useGetNotesQuery,
  useCreateNoteMutation,
  useDeleteNoteMutation,
} from "../services/api/notesApi";
import { useGetFollowersQuery } from "../services/api/followsApi";
import type { Note as NoteEntity } from "../types";
import type { ReactionType } from "../constants/reactions";
import { Like, CommentRemove, ThreeDots } from "../../assets";
import CommentsModal from "../components/CommentsModal";
import ConfirmationDialog from "../components/ConfirmationDialog";
import EditPostModal from "../components/EditPostModal";
import { r } from "../designing/responsiveDesigns";
import { ResizeMode } from "expo-av";
import SelectWorkoutScreen from "./SelectWorkoutScreen";

interface HomeScreenProps {
  navigation: any;
}

interface UserNoteItem {
  id: string;
  text: string;
  timestamp: Date;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number | null;
  maxProgress?: number | null;
  type?: string;
  earnedAt?: string | Date | null;
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
  type: string;
  duration: number;
  difficulty: string;
  exercises: Array<{
    name: string;
    sets?: number | null;
    reps?: number | null;
    durationSeconds?: number | null;
    weight?: number | null;
    notes?: string | null;
  }>;
  completed: boolean;
}

interface ActivityItem {
  id: string;
  type: "workout" | "achievement" | "post" | "connection";
  icon: string;
  title: string;
  details: string;
  timestamp: Date | null;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user, isAuthenticated } = useAuth();
  const [newNote, setNewNote] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [openPostMenuId, setOpenPostMenuId] = useState<string | null>(null);
  const [showDeletePostDialog, setShowDeletePostDialog] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<{
    id: string;
    caption: string;
  } | null>(null);
  const [editPostText, setEditPostText] = useState("");
  const [showAllWorkoutExercises, setShowAllWorkoutExercises] = useState(false);
  const [noteBeingDeleted, setNoteBeingDeleted] = useState<string | null>(null);
  const [quickActionsExpanded, setQuickActionsExpanded] = useState(false);

  // Fetch posts for Community Highlights - only when authenticated
  const {
    data: postsData,
    isLoading: postsLoading,
    refetch: refetchPosts,
  } = useGetPostsQuery({ page: 1, limit: 5 }, { skip: !isAuthenticated });
  const communityPosts =
    postsData?.status && postsData?.data?.posts ? postsData.data.posts : [];

  const {
    data: workoutHistoryData,
    isLoading: workoutHistoryLoading,
    refetch: refetchWorkoutHistory,
  } = useGetWorkoutHistoryQuery(undefined, { skip: !isAuthenticated });

  const {
    data: workoutsData,
    isLoading: workoutsLoading,
    refetch: refetchWorkouts,
  } = useGetWorkoutsQuery(undefined, { skip: !isAuthenticated });

  const {
    data: achievementsData,
    isLoading: achievementsLoading,
    refetch: refetchAchievements,
    error: achievementsError,
  } = useGetUserAchievementsQuery(
    { userId: undefined },
    { skip: !isAuthenticated },
  );

  const {
    data: potentialMatchesData,
    isLoading: potentialMatchesLoading,
    refetch: refetchPotentialMatches,
  } = useGetPotentialMatchesQuery(
    { page: 1, limit: 10 },
    { skip: !isAuthenticated },
  );

  const {
    data: userPostsData,
    isLoading: userPostsLoading,
    refetch: refetchUserPosts,
  } = useGetUserPostsQuery(
    { userId: String(user?.id ?? "") },
    { skip: !isAuthenticated || !user?.id },
  );

  const {
    data: followersData,
    isLoading: followersLoading,
    isFetching: followersFetching,
    refetch: refetchFollowers,
  } = useGetFollowersQuery(
    { userId: String(user?.id ?? ""), page: 1, limit: 10 },
    { skip: !isAuthenticated || !user?.id },
  );

  const {
    data: notesData,
    isLoading: notesLoading,
    isFetching: notesFetching,
    refetch: refetchNotes,
    error: notesError,
  } = useGetNotesQuery(undefined, { skip: !isAuthenticated });

  const [createNote, { isLoading: isCreatingNote }] = useCreateNoteMutation();
  const [deleteNoteMutation, { isLoading: isDeletingNote }] =
    useDeleteNoteMutation();

  // Debug posts data
  useEffect(() => {
    console.log("Posts data:", postsData);
    console.log("Community posts:", communityPosts);
    if (communityPosts.length > 0) {
      console.log("First post:", communityPosts[0]);
      console.log("First post workout:", communityPosts[0]?.workout);
      console.log("First post achievement:", communityPosts[0]?.achievement);
    }
  }, [postsData, communityPosts]);

  // Post reactions
  const [reactToPost] = useToggleLikeMutation();
  const [deletePost, { isLoading: isDeleting }] = useDeletePostMutation();
  const [updatePost, { isLoading: isUpdating }] = useUpdatePostMutation();
  const [reactingPostId, setReactingPostId] = useState<string | null>(null);
  const [likingPostId, setLikingPostId] = useState<string | null>(null);
  const [reactionPickerPostId, setReactionPickerPostId] = useState<
    string | null
  >(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const refreshers: Array<Promise<any>> = [refetchPosts()];

      if (isAuthenticated) {
        refreshers.push(
          refetchWorkoutHistory(),
          refetchWorkouts(),
          refetchAchievements(),
          refetchPotentialMatches(),
          refetchUserPosts(),
          refetchFollowers(),
          refetchNotes(),
        );

        if (workoutOfTheDayId) {
          refreshers.push(refetchWorkoutDetail());
        }
      }

      await Promise.allSettled(refreshers);
    } finally {
      setRefreshing(false);
    }
  };

  const reactionPickerPost = useMemo(() => {
    if (!reactionPickerPostId) {
      return null;
    }
    return (
      communityPosts.find(
        (post: any) => String(post?.id) === String(reactionPickerPostId),
      ) ?? null
    );
  }, [communityPosts, reactionPickerPostId]);

  const handleReactToPost = async (
    postId: string,
    reactionType: ReactionType,
  ) => {
    try {
      setReactingPostId(postId);
      await reactToPost({ postId, reactionType }).unwrap();
      // Posts will auto-refresh due to cache invalidation
    } catch (error) {
      console.error("Failed to update reaction:", error);
    } finally {
      setReactingPostId(null);
    }
  };

  const handleRemoveReaction = async (
    postId: string,
    currentReaction: ReactionType | null | undefined,
  ) => {
    if (!currentReaction) {
      return;
    }

    await handleReactToPost(postId, currentReaction);
  };

  const handleQuickLike = (postId: string) => {
    setLikingPostId(postId);
    handleReactToPost(postId, "like").finally(() => {
      setLikingPostId(null);
    });
  };

  const handleOpenReactionPicker = (postId: string) => {
    setReactionPickerPostId(postId);
  };

  const handleCloseReactionPicker = () => {
    setReactionPickerPostId(null);
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
      Alert.alert("Success", "Post updated successfully!");
    } catch (error) {
      console.error("Failed to update post:", error);
      Alert.alert("Error", "Failed to update post. Please try again.");
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
      console.error("Failed to delete post:", error);
      Alert.alert("Error", "Failed to delete post.");
      setShowDeletePostDialog(false);
      setPostToDelete(null);
    }
  };

  const cancelDeletePost = () => {
    setShowDeletePostDialog(false);
    setPostToDelete(null);
  };

  const workoutSessions = useMemo(() => {
    if (!workoutHistoryData?.status) {
      return [];
    }
    return workoutHistoryData.data.sessions ?? [];
  }, [workoutHistoryData]);

  const weeklyGoal = useMemo<WeeklyGoal>(() => {
    const targetWorkouts = 4;
    const defaultGoal: WeeklyGoal = {
      id: "current-week",
      title: "Complete 4 Workouts This Week",
      target: targetWorkouts,
      current: 0,
      unit: "workouts",
      type: "workouts",
      completed: false,
    };

    if (workoutSessions.length === 0) {
      return defaultGoal;
    }

    const now = new Date();
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const completedThisWeek = workoutSessions.filter((session: any) => {
      if (session.status !== "completed") {
        return false;
      }

      const completedAt = session.completedAt
        ? new Date(session.completedAt)
        : session.updatedAt
          ? new Date(session.updatedAt)
          : session.startedAt
            ? new Date(session.startedAt)
            : null;

      if (!completedAt || Number.isNaN(completedAt.getTime())) {
        return false;
      }

      return completedAt >= startOfWeek;
    }).length;

    return {
      ...defaultGoal,
      current: completedThisWeek,
      completed: completedThisWeek >= targetWorkouts,
    };
  }, [workoutSessions]);

  const workouts = useMemo(() => {
    if (!workoutsData?.status) {
      return [];
    }

    const rawWorkouts = (workoutsData.data?.workouts as any[]) ?? [];

    return rawWorkouts.map((workout: any) => ({
      ...workout,
      id: String(workout?.id ?? workout?.workoutId ?? Math.random()),
    }));
  }, [workoutsData]);

  const workoutOfTheDayId = useMemo(() => {
    if (workouts.length === 0) {
      return null;
    }

    const today = new Date();
    const index = today.getDate() % workouts.length;
    return String(workouts[index]?.id ?? workouts[0]?.id ?? "");
  }, [workouts]);

  const {
    data: workoutDetailData,
    isLoading: workoutDetailLoading,
    isFetching: workoutDetailFetching,
    refetch: refetchWorkoutDetail,
  } = useGetWorkoutByIdQuery(workoutOfTheDayId ?? "", {
    skip: !workoutOfTheDayId,
  });

  const workoutOfTheDay = useMemo<WorkoutOfTheDay | null>(() => {
    if (!workoutOfTheDayId) {
      return null;
    }

    const baseWorkout = workouts.find(
      (workout: any) => String(workout?.id) === String(workoutOfTheDayId),
    ) as any;

    const detailedWorkout =
      workoutDetailData?.status && workoutDetailData.data
        ? (workoutDetailData.data as any)
        : null;

    const sourceWorkout = detailedWorkout ?? baseWorkout;

    if (!sourceWorkout) {
      return null;
    }

    const rawExercises =
      (detailedWorkout?.workoutExercises as any[]) ??
      (sourceWorkout?.workoutExercises as any[]) ??
      [];

    const exercises = rawExercises
      .slice()
      .sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0))
      .map((workoutExercise: any, index: number) => {
        const exerciseDetails =
          workoutExercise?.exercise ?? workoutExercise?.exerciseDetails ?? {};
        const fallbackName = `Exercise ${
          (workoutExercise?.order ?? index + 1) || index + 1
        }`;
        const name = (
          exerciseDetails?.name ??
          workoutExercise?.name ??
          fallbackName
        ).trim();

        return {
          name,
          sets: workoutExercise?.sets ?? null,
          reps: workoutExercise?.reps ?? null,
          durationSeconds:
            workoutExercise?.duration ?? exerciseDetails?.duration ?? null,
          weight: workoutExercise?.weight ?? null,
          notes: workoutExercise?.notes ?? exerciseDetails?.description ?? null,
        };
      });

    const durationSeconds = Number(
      detailedWorkout?.totalDuration ?? sourceWorkout?.totalDuration ?? 0,
    );
    const durationMinutes = durationSeconds
      ? Math.max(1, Math.round(durationSeconds / 60))
      : Math.max(20, exercises.length * 5);

    const today = new Date();
    const completedToday = workoutSessions.some((session: any) => {
      if (String(session?.workoutId) !== String(sourceWorkout?.id)) {
        return false;
      }

      if (session?.status !== "completed") {
        return false;
      }

      const completionDate = session?.completedAt
        ? new Date(session.completedAt)
        : session?.updatedAt
          ? new Date(session.updatedAt)
          : session?.startedAt
            ? new Date(session.startedAt)
            : null;

      if (!completionDate || Number.isNaN(completionDate.getTime())) {
        return false;
      }

      return (
        completionDate.getFullYear() === today.getFullYear() &&
        completionDate.getMonth() === today.getMonth() &&
        completionDate.getDate() === today.getDate()
      );
    });

    return {
      id: String(sourceWorkout?.id ?? workoutOfTheDayId),
      title: sourceWorkout?.title ?? "Today's Featured Workout",
      description:
        sourceWorkout?.description ??
        "Stay consistent and give your best effort today!",
      type: String(
        sourceWorkout?.type ?? detailedWorkout?.type ?? "mixed",
      ).toLowerCase(),
      duration: durationMinutes,
      difficulty: String(
        sourceWorkout?.difficulty ?? detailedWorkout?.difficulty ?? "medium",
      ).toLowerCase(),
      exercises,
      completed: completedToday,
    };
  }, [workoutOfTheDayId, workouts, workoutDetailData, workoutSessions]);

  useEffect(() => {
    setShowAllWorkoutExercises(false);
  }, [workoutOfTheDay?.id]);

  const achievements = useMemo<Achievement[]>(() => {
    if (!achievementsData?.status) {
      return [];
    }

    const items = (achievementsData.data as any[]) ?? [];

    return items.map((achievement: any) => ({
      id: String(
        achievement?.id ??
          achievement?.achivenmentId ??
          achievement?.title ??
          Math.random(),
      ),
      title: achievement?.title ?? "Achievement unlocked",
      description: achievement?.description ?? "Keep progressing!",
      icon: achievement?.icon ?? "🏆",
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

  const suggestedPartners = useMemo(() => {
    if (!potentialMatchesData?.status) {
      return [];
    }

    const partners = (potentialMatchesData.data?.users as any[]) ?? [];

    return partners.map((partner: any) => {
      const name =
        partner?.displayName ??
        partner?.userName ??
        partner?.email ??
        "Fitness Partner";

      const trainingTypes = Array.isArray(partner?.trainingTypes)
        ? partner.trainingTypes
        : [];

      const location =
        partner?.location ??
        partner?.userAddress?.city ??
        partner?.userAddress?.state ??
        null;

      return {
        id: String(partner?.id ?? name),
        name,
        trainingTypes,
        location,
        experienceLevel: partner?.experienceLevel ?? null,
        imageUrl: partner?.imageUrl ?? partner?.profilePicture ?? null,
      };
    });
  }, [potentialMatchesData]);

  const recentActivities = useMemo<ActivityItem[]>(() => {
    const activities: ActivityItem[] = [];

    workoutSessions.forEach((session: any) => {
      if (session?.status !== "completed") {
        return;
      }

      const completionDateRaw = session?.completedAt
        ? new Date(session.completedAt)
        : session?.updatedAt
          ? new Date(session.updatedAt)
          : session?.startedAt
            ? new Date(session.startedAt)
            : null;

      const completionDate =
        completionDateRaw && !Number.isNaN(completionDateRaw.getTime())
          ? completionDateRaw
          : null;

      const workout = session?.workout ?? {};
      const workoutTitle = workout?.title ?? "Workout completed";

      const durationSeconds =
        session?.totalDuration ?? workout?.totalDuration ?? null;
      const durationMinutes = durationSeconds
        ? Math.max(1, Math.round(Number(durationSeconds) / 60))
        : null;

      const detailParts: string[] = [];
      if (durationMinutes) {
        detailParts.push(`${durationMinutes} min`);
      }
      if (workout?.exerciseCount) {
        detailParts.push(`${workout.exerciseCount} exercises`);
      }
      if (workout?.difficulty) {
        detailParts.push(String(workout.difficulty));
      }

      const details =
        detailParts.join(" • ") || "Great job staying consistent!";

      activities.push({
        id: `workout-${
          session?.id ?? completionDate?.getTime() ?? Math.random()
        }`,
        type: "workout",
        icon: "🏋️",
        title: workoutTitle,
        details,
        timestamp: completionDate,
      });
    });

    achievements
      .filter((achievement) => achievement.unlocked)
      .forEach((achievement) => {
        const earnedAtRaw = achievement.earnedAt
          ? new Date(achievement.earnedAt)
          : null;
        const earnedAt =
          earnedAtRaw && !Number.isNaN(earnedAtRaw.getTime())
            ? earnedAtRaw
            : null;

        activities.push({
          id: `achievement-${achievement.id}`,
          type: "achievement",
          icon: "🏆",
          title: `Achievement unlocked: ${achievement.title}`,
          details: achievement.description,
          timestamp: earnedAt,
        });
      });

    if (userPostsData?.status) {
      const posts = ((userPostsData.data as any)?.posts ?? []) as any[];

      if (Array.isArray(posts) && posts.length > 0) {
        const sortedPosts = posts
          .filter((post) => post)
          .sort((a, b) => {
            const dateA = a?.createdAt ? new Date(a.createdAt) : null;
            const dateB = b?.createdAt ? new Date(b.createdAt) : null;
            const timeA =
              dateA && !Number.isNaN(dateA.getTime()) ? dateA.getTime() : 0;
            const timeB =
              dateB && !Number.isNaN(dateB.getTime()) ? dateB.getTime() : 0;
            return timeB - timeA;
          });

        const workoutPosts = sortedPosts.filter(
          (post) => post?.workout || post?.type === "workout_share",
        );

        const prioritizedPosts = [
          ...workoutPosts,
          ...sortedPosts.filter((post) => !workoutPosts.includes(post)),
        ];

        const uniquePosts: any[] = [];
        const seenPostIds = new Set<string>();

        prioritizedPosts.forEach((post) => {
          const postId = String(post?.id ?? "");
          if (!postId || seenPostIds.has(postId)) {
            return;
          }
          seenPostIds.add(postId);
          uniquePosts.push(post);
        });

        uniquePosts.slice(0, 3).forEach((relevantPost) => {
          const postDateRaw = relevantPost?.createdAt
            ? new Date(relevantPost.createdAt)
            : null;
          const postDate =
            postDateRaw && !Number.isNaN(postDateRaw.getTime())
              ? postDateRaw
              : null;

          const workoutDetails = relevantPost?.workout ?? {};
          const isWorkoutShare = Boolean(
            workoutDetails?.title || workoutDetails?.totalDuration,
          );

          const baseTitle =
            relevantPost?.title ?? workoutDetails?.title ?? "Shared update";

          const postDetailParts: string[] = [];
          if (isWorkoutShare) {
            if (workoutDetails?.totalDuration) {
              postDetailParts.push(`${workoutDetails.totalDuration} min`);
            }
            if (workoutDetails?.difficulty) {
              postDetailParts.push(String(workoutDetails.difficulty));
            }
          }
          if (relevantPost?.likeCount) {
            postDetailParts.push(`${relevantPost.likeCount} likes`);
          }

          if (!postDetailParts.length && relevantPost?.commentCount != null) {
            postDetailParts.push(`${relevantPost.commentCount} comments`);
          }

          const postDetailsText =
            postDetailParts.join(" • ") ||
            (isWorkoutShare
              ? "Shared a new workout with the community."
              : "Shared a new update with followers.");

          activities.push({
            id: `post-${relevantPost.id}`,
            type: "post",
            icon: isWorkoutShare ? "🔥" : "📝",
            title: isWorkoutShare
              ? `Workout shared: ${baseTitle}`
              : `New post: ${baseTitle}`,
            details: postDetailsText,
            timestamp: postDate,
          });
        });
      }
    }

    if (followersData?.status) {
      const followerUsers = ((followersData.data as any)?.users ?? []) as any[];

      if (Array.isArray(followerUsers) && followerUsers.length > 0) {
        followerUsers
          .slice()
          .sort((a: any, b: any) => {
            const dateA = a?.createdAt ? new Date(a.createdAt) : null;
            const dateB = b?.createdAt ? new Date(b.createdAt) : null;
            const timeA =
              dateA && !Number.isNaN(dateA.getTime()) ? dateA.getTime() : 0;
            const timeB =
              dateB && !Number.isNaN(dateB.getTime()) ? dateB.getTime() : 0;
            return timeB - timeA;
          })
          .slice(0, 3)
          .forEach((follower: any, index: number) => {
            const connectionName =
              follower?.displayName ??
              follower?.userName ??
              follower?.email ??
              `New connection ${index + 1}`;

            const connectionDateRaw = follower?.createdAt
              ? new Date(follower.createdAt)
              : null;
            const connectionDate =
              connectionDateRaw && !Number.isNaN(connectionDateRaw.getTime())
                ? connectionDateRaw
                : null;

            activities.push({
              id: `connection-${follower?.id ?? connectionName}-${index}`,
              type: "connection",
              icon: "🤝",
              title: `New connection: ${connectionName}`,
              details: follower?.email
                ? `You connected with ${connectionName}`
                : "You've made a new connection.",
              timestamp: connectionDate,
            });
          });
      }
    }

    return activities
      .sort((a, b) => {
        const timeA = a.timestamp ? a.timestamp.getTime() : 0;
        const timeB = b.timestamp ? b.timestamp.getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, 6);
  }, [workoutSessions, achievements, userPostsData, followersData]);

  const isWorkoutOfTheDayLoading =
    workoutsLoading || workoutDetailLoading || workoutDetailFetching;

  const isActivityLoading =
    workoutHistoryLoading ||
    achievementsLoading ||
    userPostsLoading ||
    followersLoading ||
    followersFetching;
  const notes = useMemo<UserNoteItem[]>(() => {
    if (!notesData?.status) {
      return [];
    }

    const rawNotes = (notesData.data ?? []) as NoteEntity[];

    return rawNotes
      .map((note) => {
        const createdAt = note?.createdAt ? new Date(note.createdAt) : null;
        return {
          id: String(note.id ?? Math.random()),
          text: note.text ?? "",
          timestamp:
            createdAt && !Number.isNaN(createdAt.getTime())
              ? createdAt
              : new Date(),
        } as UserNoteItem;
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [notesData]);

  const hasNotesResponse = Boolean(notesData?.status);
  const isNotesInitialLoading = notesLoading && !hasNotesResponse;
  const isNotesRefetching = notesFetching && hasNotesResponse;
  const notesErrorMessage =
    Boolean(notesError) || (notesData && notesData.status === false)
      ? "We couldn't load your notes right now."
      : null;

  const workoutOfTheDayExercises = useMemo(() => {
    if (!workoutOfTheDay) {
      return {
        visible: [],
        hiddenCount: 0,
        totalCount: 0,
      };
    }

    const allExercises = workoutOfTheDay.exercises ?? [];
    const hiddenCount = Math.max(allExercises.length - 3, 0);
    const visible = showAllWorkoutExercises
      ? allExercises
      : allExercises.slice(0, 3);

    return {
      visible,
      hiddenCount,
      totalCount: allExercises.length,
    };
  }, [workoutOfTheDay, showAllWorkoutExercises]);

  const saveNote = async () => {
    const text = newNote.trim();
    if (!text) {
      return;
    }

    if (!isAuthenticated) {
      Alert.alert("Sign in required", "Please log in to save quick notes.");
      return;
    }

    try {
      await createNote({ text }).unwrap();
      setNewNote("");
    } catch (error) {
      console.error("Error saving note:", error);
      Alert.alert("Error", "We couldn't save your note. Please try again.");
    }
  };

  const deleteNote = (noteId: string) => {
    if (!isAuthenticated) {
      Alert.alert("Sign in required", "Please log in to manage your notes.");
      return;
    }

    Alert.alert(STRINGS.HOME.deleteNoteTitle, STRINGS.HOME.deleteNoteMessage, [
      { text: STRINGS.HOME.cancel, style: "cancel" },
      {
        text: STRINGS.COMMON.delete,
        style: "destructive",
        onPress: async () => {
          try {
            setNoteBeingDeleted(noteId);
            await deleteNoteMutation({ noteId }).unwrap();
          } catch (error) {
            console.error("Error deleting note:", error);
            Alert.alert(
              "Error",
              "We couldn't delete the note. Please try again.",
            );
          } finally {
            setNoteBeingDeleted(null);
          }
        },
      },
    ]);
  };

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

  const formatExerciseDetails = (
    exercise: WorkoutOfTheDay["exercises"][number],
  ) => {
    const detailParts: string[] = [];

    if (exercise.sets !== null && exercise.sets !== undefined) {
      detailParts.push(`${exercise.sets} sets`);
    }

    if (exercise.reps !== null && exercise.reps !== undefined) {
      detailParts.push(`${exercise.reps} reps`);
    }

    if (
      exercise.durationSeconds !== null &&
      exercise.durationSeconds !== undefined
    ) {
      const minutes = Math.round(exercise.durationSeconds / 60);
      if (minutes >= 1) {
        detailParts.push(`${minutes} min`);
      } else if (exercise.durationSeconds > 0) {
        detailParts.push(`${exercise.durationSeconds} sec`);
      }
    }

    if (exercise.weight !== null && exercise.weight !== undefined) {
      detailParts.push(`@ ${exercise.weight}lbs`);
    }

    if (detailParts.length === 0) {
      if (exercise.notes) {
        detailParts.push(exercise.notes);
      } else {
        detailParts.push("Stay focused!");
      }
    }

    return detailParts.join(" • ");
  };

  const startWorkoutOfTheDay = () => {
    navigation.navigate("SelectWorkout");
  };
  const handleBookSession = () => {
    navigation.navigate("Main", {
      screen: "Find",
      params: {
        screen: "FindMain",
        params: { tab: "FindTrainers" },
      },
    });
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
      <RefreshableScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
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
                <View style={styles.weeklyGoalProgressContainer}>
                  {workoutHistoryLoading && (
                    <ActivityIndicator
                      size="small"
                      color={COLORS.primary}
                      style={styles.weeklyGoalLoader}
                    />
                  )}
                  <Text style={styles.weeklyGoalProgress}>
                    {weeklyGoal.current}/{weeklyGoal.target} {weeklyGoal.unit}
                  </Text>
                </View>
              </View>
              <View style={styles.weeklyGoalBar}>
                <View
                  style={[
                    styles.weeklyGoalFill,
                    {
                      width: `${
                        weeklyGoal.target
                          ? Math.min(
                              (weeklyGoal.current / weeklyGoal.target) * 100,
                              100,
                            )
                          : 0
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
            {isWorkoutOfTheDayLoading ? (
              <View style={styles.sectionLoader}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : !workoutOfTheDay ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No workouts available right now. Check back later or browse
                  all workouts.
                </Text>
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={() => navigation.navigate("SelectWorkout")}
                >
                  <Text style={styles.emptyStateButtonText}>
                    Browse Workouts
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
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
                    Exercises ({workoutOfTheDayExercises.totalCount})
                  </Text>
                  {workoutOfTheDayExercises.totalCount === 0 ? (
                    <Text style={styles.workoutOfTheDayExerciseDetails}>
                      Workout details will appear once exercises are added.
                    </Text>
                  ) : (
                    <>
                      {workoutOfTheDayExercises.visible.map(
                        (exercise, index) => (
                          <View
                            key={`${exercise.name}-${index}`}
                            style={styles.workoutOfTheDayExercise}
                          >
                            <Text style={styles.workoutOfTheDayExerciseName}>
                              {exercise.name}
                            </Text>
                            <Text style={styles.workoutOfTheDayExerciseDetails}>
                              {formatExerciseDetails(exercise)}
                            </Text>
                          </View>
                        ),
                      )}
                      {workoutOfTheDayExercises.hiddenCount > 0 && (
                        <TouchableOpacity
                          onPress={() =>
                            setShowAllWorkoutExercises((prev) => !prev)
                          }
                          style={styles.workoutOfTheDayToggle}
                        >
                          <Text style={styles.workoutOfTheDayMoreExercises}>
                            {showAllWorkoutExercises
                              ? "Show fewer exercises"
                              : `+${workoutOfTheDayExercises.hiddenCount} more exercises`}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </>
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
            )}
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
              <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : communityPosts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No posts yet. Be the first to share!
                </Text>
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={() => navigation.navigate("CreatePost")}
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
                  console.log(
                    "Rendering post:",
                    post?.id,
                    "workout:",
                    post?.workout,
                    "achievement:",
                    post?.achievement,
                  );

                  const postUser = post.user || {};
                  // Use displayName, userName, or email as fallback
                  const userName =
                    postUser.displayName ||
                    postUser.userName ||
                    postUser.email ||
                    "Anonymous User";
                  const initials =
                    userName !== "Anonymous User"
                      ? userName
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()
                          .substring(0, 2)
                      : "AU";
                  const timeAgo = getTimeAgo(new Date(post.createdAt));
                  const postId = post.id?.toString?.() ?? String(post.id);
                  const currentReaction = (post.currentUserReaction ??
                    null) as ReactionType | null;
                  const reactionSummary = (post.reactionSummary ??
                    undefined) as Record<ReactionType, number> | undefined;
                  const nonLikeReactionTotal = reactionSummary
                    ? Object.entries(reactionSummary).reduce(
                        (acc, [type, count]) => {
                          if (type === "like") {
                            return acc;
                          }
                          const safeCount =
                            typeof count === "number" ? count : 0;
                          return acc + safeCount;
                        },
                        0,
                      )
                    : 0;
                  const userHasNonLikeReaction =
                    currentReaction != null && currentReaction !== "like";
                  const shouldShowReactions =
                    (reactingPostId === postId && likingPostId !== postId) ||
                    nonLikeReactionTotal > 0 ||
                    userHasNonLikeReaction;

                  return (
                    <Pressable
                      key={post.id}
                      style={styles.socialPost}
                      onLongPress={() => handleOpenReactionPicker(postId)}
                      delayLongPress={250}
                    >
                      <View style={styles.socialPostHeader}>
                        <View style={styles.socialPostAvatar}>
                          {postUser.imageUrl ? (
                            <Image
                              source={{ uri: postUser.imageUrl }}
                              style={styles.socialPostAvatarImage}
                            />
                          ) : (
                            <Text style={styles.socialPostAvatarText}>
                              {initials}
                            </Text>
                          )}
                        </View>
                        <View style={styles.socialPostInfo}>
                          <Text style={styles.socialPostName}>{userName}</Text>
                          <Text style={styles.socialPostTime}>{timeAgo}</Text>
                        </View>
                        {user?.id === post.userId && (
                          <View>
                            <TouchableOpacity
                              style={styles.socialPostMenu}
                              onPress={() => handlePostMenuPress(postId)}
                            >
                              <Image
                                source={ThreeDots}
                                style={{ width: 20, height: 20 }}
                                resizeMode={ResizeMode.CONTAIN}
                              />
                            </TouchableOpacity>
                            {openPostMenuId === postId && (
                              <View style={styles.postMenuDropdown}>
                                <TouchableOpacity
                                  onPress={() =>
                                    handleEditPostPress(
                                      postId,
                                      post.title || "",
                                    )
                                  }
                                  style={styles.postMenuOption}
                                >
                                  <Text style={styles.postMenuOptionText}>
                                    Edit
                                  </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() => handleDeletePostPress(postId)}
                                  style={styles.postMenuOption}
                                >
                                  <Text style={styles.postMenuOptionText}>
                                    Delete
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                      <Text style={styles.socialPostContent}>{post.title}</Text>

                      {/* Workout Information */}
                      {post.workout && (
                        <View style={styles.postWorkoutBadge}>
                          <Text style={styles.postWorkoutIcon}>💪</Text>
                          <View style={styles.postWorkoutInfo}>
                            <Text style={styles.postWorkoutTitle}>
                              {post.workout.title}
                            </Text>
                            <Text style={styles.postWorkoutDetails}>
                              {post.workout.totalDuration} min •{" "}
                              {post.workout.difficulty}
                            </Text>
                          </View>
                        </View>
                      )}

                      {/* Achievement Information */}
                      {post.achievement && (
                        <View style={styles.postAchievementBadge}>
                          <Text style={styles.postAchievementIcon}>
                            {post.achievement.icon || "🏆"}
                          </Text>
                          <View style={styles.postAchievementInfo}>
                            <Text style={styles.postAchievementTitle}>
                              {post.achievement.title}
                            </Text>
                            <Text style={styles.postAchievementDescription}>
                              {post.achievement.description}
                            </Text>
                          </View>
                        </View>
                      )}

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
                          onPress={() => handleQuickLike(postId)}
                          disabled={likingPostId === postId}
                        >
                          {likingPostId === postId ? (
                            <ActivityIndicator
                              size="small"
                              color={COLORS.primary}
                            />
                          ) : (
                            <>
                              <Image
                                source={Like}
                                style={[
                                  styles.socialPostActionIcon,
                                  {
                                    tintColor: COLORS.gradient1,
                                  },
                                ]}
                              />
                              <Text style={styles.socialPostActionText}>
                                {post.likeCount || 0}
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.socialPostAction}
                          onPress={() => handleOpenComments(postId)}
                        >
                          <Image
                            source={CommentRemove}
                            style={[styles.socialPostActionIcon]}
                          />
                          <Text style={styles.socialPostActionText}>
                            {post.commentCount || 0}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.socialPostAction}>
                          {/* <Text style={styles.handshakeIcon}>🤝</Text> */}
                        </TouchableOpacity>
                      </View>
                      {shouldShowReactions && (
                        <View style={styles.socialPostReactionsRow}>
                          {reactingPostId === postId &&
                          likingPostId !== postId ? (
                            <ActivityIndicator
                              size="small"
                              color={COLORS.primary}
                            />
                          ) : (
                            <ReactionSummary
                              summary={reactionSummary}
                              currentReaction={currentReaction}
                              onPress={() => handleOpenReactionPicker(postId)}
                            />
                          )}
                        </View>
                      )}
                    </Pressable>
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
            {potentialMatchesLoading ? (
              <View style={styles.sectionLoader}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : suggestedPartners.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No partner suggestions yet. Update your profile or start
                  matching to see recommendations.
                </Text>
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={() => navigation.navigate("Find")}
                >
                  <Text style={styles.emptyStateButtonText}>
                    Explore Partners
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.friendSuggestions}
                contentContainerStyle={{ paddingRight: r(30) }} // Add this line
              >
                {suggestedPartners.slice(0, 6).map((partner) => {
                  const initials = partner.name
                    .split(" ")
                    .map((part: string) => part.charAt(0))
                    .join("")
                    .toUpperCase()
                    .substring(0, 2);

                  const detailParts: string[] = [];

                  if (
                    partner.trainingTypes &&
                    partner.trainingTypes.length > 0
                  ) {
                    detailParts.push(partner.trainingTypes[0]);
                  }

                  if (partner.location) {
                    detailParts.push(partner.location);
                  } else if (partner.experienceLevel) {
                    detailParts.push(partner.experienceLevel);
                  }

                  const detailText =
                    detailParts.join(" • ") || "Ready to train";
                  {
                    console.log("Rendering suggested partner:", partner);
                  }
                  return (
                    <View key={partner.id} style={styles.friendSuggestionCard}>
                      <View style={styles.friendSuggestionAvatar}>
                        {partner.imageUrl ? (
                          <Image
                            source={{ uri: partner.imageUrl }}
                            style={styles.friendSuggestionAvatarImage}
                          />
                        ) : (
                          <Text style={styles.friendSuggestionAvatarText}>
                            {initials}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.friendSuggestionName}>
                        {partner.name}
                      </Text>
                      <Text style={styles.friendSuggestionDetails}>
                        {detailText}
                      </Text>
                      <TouchableOpacity
                        style={styles.friendSuggestionButton}
                        onPress={() => navigation.navigate("Find")}
                      >
                        <Text style={styles.friendSuggestionButtonText}>
                          Connect
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitleWithSideText}>Quick Actions</Text>
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

              {quickActionsExpanded && (
                <>
                  <TouchableOpacity
                    style={styles.quickActionCard}
                    onPress={handleBookSession}
                  >
                    <Text style={styles.quickActionIcon}>🗓️</Text>
                    <Text style={styles.quickActionTitle}>Schedule Chat</Text>
                    <Text style={styles.quickActionSubtitle}>
                      Plan a session with your coach
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quickActionCard}
                    onPress={startWorkoutOfTheDay}
                  >
                    <Text style={styles.quickActionIcon}>💪</Text>
                    <Text style={styles.quickActionTitle}>Browse Workouts</Text>
                    <Text style={styles.quickActionSubtitle}>
                      Explore new training plans
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
            <TouchableOpacity
              style={styles.quickActionToggle}
              onPress={() => setQuickActionsExpanded((prev) => !prev)}
            >
              <Text style={styles.quickActionToggleText}>
                {quickActionsExpanded
                  ? "Show fewer actions"
                  : "Show more actions"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Notes Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitleWithSideText}>
              {STRINGS.HOME.quickNotes}
            </Text>
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
                  style={[
                    styles.addNoteButton,
                    (isCreatingNote || !newNote.trim()) && { opacity: 0.6 },
                  ]}
                  onPress={saveNote}
                  disabled={isCreatingNote || !newNote.trim()}
                >
                  {isCreatingNote ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.addNoteButtonText}>
                      {STRINGS.COMMON.add}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {isNotesInitialLoading ? (
                <View style={styles.notesLoadingContainer}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                </View>
              ) : notesErrorMessage ? (
                <Text style={styles.notesStatusText}>{notesErrorMessage}</Text>
              ) : notes.length === 0 ? (
                <Text style={styles.notesStatusText}>
                  {isAuthenticated
                    ? "No quick notes yet. Add one to track your thoughts."
                    : "Sign in to start saving your quick notes."}
                </Text>
              ) : (
                <View style={styles.notesList}>
                  {isNotesRefetching && (
                    <View style={styles.notesRefreshingIndicator}>
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    </View>
                  )}
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
                          disabled={
                            noteBeingDeleted === note.id || isDeletingNote
                          }
                        >
                          {noteBeingDeleted === note.id ? (
                            <ActivityIndicator
                              size="small"
                              color={COLORS.primary}
                            />
                          ) : (
                            <Text style={styles.deleteNoteText}>🗑️</Text>
                          )}
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
            <Text style={styles.sectionTitleWithSideText}>🏆 Achievements</Text>
            {achievementsLoading ? (
              <View style={styles.sectionLoader}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : achievements.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  {achievementsError
                    ? "We couldn't load your achievements right now."
                    : "Complete workouts to unlock your first achievement!"}
                </Text>
              </View>
            ) : (
              <View style={styles.achievementsGrid}>
                {achievements.slice(0, 4).map((achievement) => {
                  const progressPercentage = getProgressPercentage(achievement);
                  const showFraction =
                    achievement.progress !== null &&
                    achievement.progress !== undefined &&
                    achievement.maxProgress !== null &&
                    achievement.maxProgress !== undefined;
                  const progressLabel = showFraction
                    ? `${achievement.progress}/${achievement.maxProgress}`
                    : achievement.unlocked
                      ? "Unlocked"
                      : `${Math.round(progressPercentage)}%`;

                  return (
                    <View key={achievement.id} style={styles.achievementCard}>
                      <Text style={styles.achievementIcon}>
                        {achievement.icon}
                      </Text>
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
                        <Text style={styles.progressText}>{progressLabel}</Text>
                      </View>
                      {achievement.unlocked && (
                        <View style={styles.unlockedBadge}>
                          <Text style={styles.unlockedText}>✓ Unlocked</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitleWithSideText}>Recent Activity</Text>
            {isActivityLoading ? (
              <View style={styles.sectionLoader}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : recentActivities.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  Your latest workouts and achievements will appear here once
                  you start logging sessions.
                </Text>
              </View>
            ) : (
              <View style={styles.activityList}>
                {recentActivities.map((activity) => (
                  <View key={activity.id} style={styles.activityItem}>
                    <Text style={styles.activityIcon}>{activity.icon}</Text>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{activity.title}</Text>
                      <Text style={styles.activityDetails}>
                        {activity.details}
                      </Text>
                    </View>
                    <Text style={styles.activityTime}>
                      {activity.timestamp
                        ? getTimeAgo(activity.timestamp)
                        : "Recently"}
                    </Text>
                  </View>
                ))}
              </View>
            )}
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
      </RefreshableScrollView>

      <ReactionPicker
        visible={Boolean(reactionPickerPostId)}
        currentReaction={
          (reactionPickerPost?.currentUserReaction ??
            null) as ReactionType | null
        }
        onSelect={(reaction) => {
          if (!reactionPickerPostId) {
            return;
          }
          handleReactToPost(reactionPickerPostId, reaction);
        }}
        onClose={handleCloseReactionPicker}
        onRemoveReaction={() => {
          const activePostId =
            reactionPickerPostId ??
            (reactionPickerPost?.id ? String(reactionPickerPost.id) : null);
          const activeReaction = (reactionPickerPost?.currentUserReaction ??
            null) as ReactionType | null;

          if (!activePostId || !activeReaction) {
            return;
          }

          handleRemoveReaction(activePostId, activeReaction);
        }}
      />

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
      <EditPostModal
        visible={editingPost !== null}
        onClose={handleCancelEditPost}
        onSave={handleSaveEditPost}
        editText={editPostText}
        onChangeText={setEditPostText}
        isUpdating={isUpdating}
      />
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
    overflow: "hidden",
    marginTop: DIMENSIONS.spacing.lg,
  },
  profileButtonImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
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
    fontFamily: FontWeight.SemiBold,
    color: COLORS.gradient1,
    // marginBottom: DIMENSIONS.spacing.md,
  },

  sectionTitleWithSideText: {
    fontSize: 20,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.gradient1,
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
    color: COLORS.white,
    fontFamily: FontWeight.Medium,
    fontSize: 14,
  },
  notesList: {
    padding: DIMENSIONS.spacing.md,
  },
  notesLoadingContainer: {
    padding: DIMENSIONS.spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  notesRefreshingIndicator: {
    alignItems: "center",
    marginBottom: DIMENSIONS.spacing.sm,
  },
  notesStatusText: {
    paddingHorizontal: DIMENSIONS.spacing.md,
    paddingBottom: DIMENSIONS.spacing.md,
    color: COLORS._5E5E5E,
    fontSize: 14,
    fontFamily: FontWeight.Medium,
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
    color: COLORS.app_black,
    fontFamily: FontWeight.Medium,
  },
  noteFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  noteTime: {
    fontSize: 12,
    color: COLORS._5E5E5E,
    fontFamily: FontWeight.Medium,
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
    fontFamily: FontWeight.Medium,
    color: COLORS.app_black,
    textAlign: "center",
    marginBottom: DIMENSIONS.spacing.xs,
  },
  achievementDescription: {
    fontSize: 12,
    color: COLORS._5E5E5E,
    textAlign: "center",
    fontFamily: FontWeight.Regular,
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
    color: COLORS._5E5E5E,
    fontFamily: FontWeight.Medium,
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
    color: COLORS.white,
    fontFamily: FontWeight.Medium,
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
    // borderBottomWidth: 1,
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
    fontFamily: FontWeight.SemiBold,
    color: COLORS.app_black,
    marginBottom: DIMENSIONS.spacing.xs,
  },
  activityDetails: {
    fontSize: 12,
    color: COLORS._5E5E5E,
    fontFamily: FontWeight.Medium,
  },
  activityTime: {
    fontSize: 12,
    color: COLORS._5E5E5E,
    fontFamily: FontWeight.Medium,
  },
  createPostButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 5,
    padding: 14,
    justifyContent: "center",
  },
  createPostIcon: {
    fontSize: 20,
    marginRight: DIMENSIONS.spacing.sm,
  },
  createPostText: {
    fontSize: 14,
    fontFamily: FontWeight.Medium,
    color: COLORS.white,
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
    fontFamily: FontWeight.Medium,
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
    fontFamily: FontWeight.Medium,
    color: COLORS.app_black,
    flex: 1,
  },
  weeklyGoalProgressContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  weeklyGoalProgress: {
    fontSize: 14,
    fontFamily: FontWeight.Medium,
    color: COLORS.primary,
  },
  weeklyGoalLoader: {
    marginRight: DIMENSIONS.spacing.xs,
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
    color: COLORS._5E5E5E,
    fontFamily: FontWeight.Medium,
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
    fontFamily: FontWeight.SemiBold,
    color: COLORS.app_black,
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
    fontFamily: FontWeight.Medium,
    textTransform: "capitalize",
  },
  workoutOfTheDayDuration: {
    fontSize: 12,
    color: COLORS._5E5E5E,
    fontFamily: FontWeight.Medium,
  },
  workoutOfTheDayDifficulty: {
    fontSize: 12,
    color: COLORS._5E5E5E,
    fontFamily: FontWeight.Medium,
    textTransform: "capitalize",
  },
  workoutOfTheDayDescription: {
    fontSize: 14,
    color: COLORS._5E5E5E,
    fontFamily: FontWeight.Medium,
    lineHeight: 20,
    marginBottom: DIMENSIONS.spacing.lg,
  },
  workoutOfTheDayExercises: {
    marginBottom: DIMENSIONS.spacing.lg,
  },
  workoutOfTheDayExercisesTitle: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.app_black,
  },
  workoutOfTheDayExercise: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: DIMENSIONS.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  workoutOfTheDayToggle: {
    paddingVertical: DIMENSIONS.spacing.sm,
  },
  workoutOfTheDayExerciseName: {
    fontSize: 14,
    fontFamily: FontWeight.Medium,
    color: COLORS.app_black,
    flex: 1,
  },
  workoutOfTheDayExerciseDetails: {
    fontSize: 12,
    color: COLORS._5E5E5E,
    fontFamily: FontWeight.Medium,
  },
  workoutOfTheDayMoreExercises: {
    fontSize: 12,
    color: COLORS.primary,
    fontFamily: FontWeight.Medium,
    textAlign: "center",
    paddingTop: DIMENSIONS.spacing.sm,
  },
  workoutOfTheDayActions: {
    alignItems: "center",
  },
  startWorkoutButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: DIMENSIONS.spacing.xl,
    paddingVertical: 14,
    borderRadius: 5,
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
    fontFamily: FontWeight.SemiBold,
    color: COLORS.surface,
  },
  viewAllButton: {
    fontSize: 14,
    color: COLORS.primary,
    fontFamily: FontWeight.Medium,
  },
  sectionLoader: {
    paddingVertical: DIMENSIONS.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
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
    overflow: "hidden",
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
  socialPostImage: {
    width: "100%",
    height: 200,
    borderRadius: DIMENSIONS.borderRadius,
    marginTop: DIMENSIONS.spacing.sm,
    backgroundColor: COLORS.border,
  },
  emptyState: {
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    padding: DIMENSIONS.spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: FontWeight.Medium,
    color: COLORS._5E5E5E,
    marginBottom: DIMENSIONS.spacing.md,
    textAlign: "center",
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
    fontFamily: FontWeight.Medium,
  },
  socialPostInitials: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "600",
  },
  socialPostInfo: {
    flex: 1,
  },
  socialPostName: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.app_black,
    marginBottom: 2,
  },
  socialPostTime: {
    fontSize: 12,
    color: COLORS._5E5E5E,
    fontFamily: FontWeight.Medium,
  },
  socialPostMenu: {
    padding: DIMENSIONS.spacing.sm,
  },
  socialPostMenuText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    fontWeight: "700",
  },
  postMenuDropdown: {
    position: "absolute",
    top: 35,
    right: 0,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingVertical: DIMENSIONS.spacing.xs,
    minWidth: 120,
    shadowColor: "#000",
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
    color: "#FF3B30",
    fontWeight: "500",
  },
  socialPostContent: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    fontFamily: FontWeight.Medium,
    marginBottom: DIMENSIONS.spacing.md,
  },
  socialPostActions: {
    flexDirection: "row",
    gap: DIMENSIONS.spacing.lg,
    paddingTop: DIMENSIONS.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  socialPostReactionWrapper: {
    justifyContent: "center",
    paddingVertical: DIMENSIONS.spacing.xs,
  },
  socialPostReactionsRow: {
    marginTop: DIMENSIONS.spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: DIMENSIONS.spacing.sm,
  },
  reactionsLabel: {
    fontFamily: FontWeight.Medium,
    fontSize: 13,
    color: COLORS.textSecondary,
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
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: DIMENSIONS.spacing.sm,
    overflow: "hidden",
  },
  friendSuggestionAvatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 25,
  },
  friendSuggestionAvatarText: {
    color: COLORS.surface,
    fontSize: 18,
    fontWeight: "600",
  },
  friendSuggestionName: {
    fontSize: 14,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.app_black,
    textAlign: "center",
    marginBottom: DIMENSIONS.spacing.xs,
  },
  friendSuggestionDetails: {
    fontSize: 12,
    fontFamily: FontWeight.Regular,
    color: COLORS._5E5E5E,
    textAlign: "center",
    marginBottom: DIMENSIONS.spacing.md,
    lineHeight: 16,
  },
  friendSuggestionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: DIMENSIONS.spacing.md,
    paddingVertical: DIMENSIONS.spacing.sm,
    borderRadius: 5,
    minWidth: 80,
    alignItems: "center",
  },
  friendSuggestionButtonText: {
    fontSize: 12,
    fontFamily: FontWeight.Medium,
    color: COLORS.white,
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
    fontFamily: FontWeight.Medium,
    color: COLORS.app_black,
    marginBottom: DIMENSIONS.spacing.xs,
    textAlign: "center",
  },
  quickActionToggle: {
    marginTop: DIMENSIONS.spacing.sm,
    alignItems: "center",
  },
  quickActionToggleText: {
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: FontWeight.Medium,
  },
  quickActionSubtitle: {
    fontSize: 12,
    fontFamily: FontWeight.Regular,
    color: COLORS._5E5E5E,
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
    fontFamily: FontWeight.Medium,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    marginRight: DIMENSIONS.spacing.sm,
  },
  workoutBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS._D2E7FF,
    borderRadius: 12,
    padding: DIMENSIONS.spacing.md,
    marginTop: DIMENSIONS.spacing.sm,
  },
  workoutIcon: {
    fontSize: 20,
    marginRight: DIMENSIONS.spacing.sm,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: 14,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.primary,
    marginBottom: 2,
  },
  workoutDetails: {
    fontSize: 12,
    fontFamily: FontWeight.Regular,
    color: COLORS._616888,
  },
  achievementBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS._FFF5E9,
    borderRadius: 12,
    padding: DIMENSIONS.spacing.md,
    marginTop: DIMENSIONS.spacing.sm,
  },
  postWorkoutBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS._D2E7FF,
    borderRadius: 12,
    padding: DIMENSIONS.spacing.md,
    marginTop: DIMENSIONS.spacing.sm,
  },
  postWorkoutIcon: {
    fontSize: 20,
    marginRight: DIMENSIONS.spacing.sm,
  },
  postWorkoutInfo: {
    flex: 1,
  },
  postWorkoutTitle: {
    fontSize: 14,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.primary,
    marginBottom: 2,
  },
  postWorkoutDetails: {
    fontSize: 12,
    fontFamily: FontWeight.Regular,
    color: COLORS._616888,
  },
  postAchievementBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS._FFF5E9,
    borderRadius: 12,
    padding: DIMENSIONS.spacing.md,
    marginTop: DIMENSIONS.spacing.sm,
  },
  postAchievementIcon: {
    fontSize: 20,
    marginRight: DIMENSIONS.spacing.sm,
  },
  postAchievementInfo: {
    flex: 1,
  },
  postAchievementTitle: {
    fontSize: 14,
    fontFamily: FontWeight.SemiBold,
    color: COLORS._B9780E,
    marginBottom: 2,
  },
  postAchievementDescription: {
    fontSize: 12,
    fontFamily: FontWeight.Regular,
    color: COLORS._616888,
  },
});

export default HomeScreen;
