import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import RefreshableScrollView from "../components/RefreshableScrollView";
import { SafeAreaView } from "react-native-safe-area-context";
import BasicTopBar from "../components/BasicTopBar";
import ReactionSummary from "../components/ReactionSummary";
import ReactionPicker from "../components/ReactionPicker";
import { Like, CommentIcon, ThreeDots } from "../../assets";
import {
  COLORS,
  DIMENSIONS,
  formatWorkoutDurationMinutes,
} from "../config/constants";
import FontWeight from "../hooks/useInterFonts";
import { useAuth } from "../contexts/AuthContext";
import {
  useGetUserPostsQuery,
  useDeletePostMutation,
  useUpdatePostMutation,
} from "../services/api";
import { useToggleLikeMutation } from "../services/api/likesCommentsApi";
import CommentsModal from "../components/CommentsModal";
import ConfirmationDialog from "../components/ConfirmationDialog";
import type { ReactionType } from "../constants/reactions";
import { useAndroidNavBar } from "../hooks/useAndroidNavBar";

const MyPosts: React.FC = ({ navigation, route }: any) => {
  const { user } = useAuth();
  const { height: navBarHeight } = useAndroidNavBar();
  const userId = route?.params?.userId || user?.id;
  const isOwnProfile =
    !route?.params?.userId || route?.params?.userId === user?.id;
  const [refreshing, setRefreshing] = useState(false);
  const [openPostMenuId, setOpenPostMenuId] = useState<string | null>(null);
  const [showDeletePostDialog, setShowDeletePostDialog] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<{
    id: string;
    caption: string;
  } | null>(null);
  const [editPostText, setEditPostText] = useState("");
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const {
    data: postsData,
    refetch: refetchPosts,
    isLoading,
  } = useGetUserPostsQuery({ userId }, { skip: !userId });
  const [deletePost] = useDeletePostMutation();
  const [updatePost, { isLoading: isUpdating }] = useUpdatePostMutation();
  const [reactToPost] = useToggleLikeMutation();
  const [reactingPostId, setReactingPostId] = useState<string | null>(null);
  const [likingPostId, setLikingPostId] = useState<string | null>(null);
  const [reactionPickerPostId, setReactionPickerPostId] = useState<
    string | null
  >(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShow = Keyboard.addListener(
      Platform.OS === "android" ? "keyboardDidShow" : "keyboardWillShow",
      () => setIsKeyboardVisible(true),
    );
    const keyboardDidHide = Keyboard.addListener(
      Platform.OS === "android" ? "keyboardDidHide" : "keyboardWillHide",
      () => setIsKeyboardVisible(false),
    );

    return () => {
      keyboardDidShow.remove();
      keyboardDidHide.remove();
    };
  }, []);

  const posts =
    postsData && postsData.status && "data" in postsData
      ? postsData.data.posts
      : [];

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchPosts();
    setRefreshing(false);
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
      });
      setEditingPost(null);
      setEditPostText("");
      refetchPosts();
    } catch (error) {
      Alert.alert("Error", "Failed to update post");
    }
  };

  const handleCancelEditPost = () => {
    setEditingPost(null);
    setEditPostText("");
  };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;

    try {
      await deletePost({ postId: postToDelete });
      setShowDeletePostDialog(false);
      setPostToDelete(null);
      refetchPosts();
    } catch (error) {
      Alert.alert("Error", "Failed to delete post");
    }
  };

  const cancelDeletePost = () => {
    setShowDeletePostDialog(false);
    setPostToDelete(null);
  };

  const reactionPickerPost = useMemo(() => {
    if (!reactionPickerPostId) {
      return null;
    }

    return (
      posts.find(
        (post: any) => String(post?.id) === String(reactionPickerPostId)
      ) ?? null
    );
  }, [posts, reactionPickerPostId]);

  const handleReactToPost = async (
    postId: string,
    reactionType: ReactionType
  ) => {
    try {
      setReactingPostId(postId);
      await reactToPost({ postId, reactionType }).unwrap();
      refetchPosts();
    } catch (error) {
      console.error("Failed to update reaction:", error);
    } finally {
      setReactingPostId(null);
    }
  };

  const handleRemoveReaction = async (
    postId: string,
    currentReaction: ReactionType | null | undefined
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
    refetchPosts();
  };

  const handlePostAction = (action: string, postId: string) => {
    if (action === "create") {
      navigation.navigate("CreatePost");
    }
  };

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <BasicTopBar
        onBackPress={() => navigation.goBack()}
        title="Posts"
        subtitle={
          isOwnProfile
            ? "View / Manage your shared posts"
            : "Posts shared by this user"
        }
        containerStyle={{
          paddingTop: DIMENSIONS.spacing.xxl,
          paddingBottom: DIMENSIONS.spacing.lg,
        }}
      />

      <RefreshableScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      >
        {isOwnProfile && (
          <TouchableOpacity
            style={styles.createPostButton}
            onPress={() => handlePostAction("create", "")}
          >
            <Text style={styles.createPostButtonText}>Create New Post</Text>
          </TouchableOpacity>
        )}

        <View style={[styles.postsList, !isOwnProfile && { marginTop: 16 }]}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : posts.length === 0 ? (
            <Text
              style={{
                textAlign: "center",
                color: COLORS._5E5E5E,
                marginTop: 32,
              }}
            >
              No posts yet.
            </Text>
          ) : (
            posts.map((post: any) => {
              const postId = post.id?.toString?.() ?? String(post.id);
              const currentReaction = (post.currentUserReaction ??
                null) as ReactionType | null;
              const reactionSummary = (post.reactionSummary ?? undefined) as
                | Record<ReactionType, number>
                | undefined;
              const totalReactions = post.totalReactions ?? post.likeCount ?? 0;

              return (
                <View key={post.id} style={styles.postCard}>
                  <View style={styles.postHeader}>
                    <View style={{ flex: 1 }} />
                    {isOwnProfile && (
                      <TouchableOpacity
                        style={styles.postMenuButton}
                        onPress={() => handlePostMenuPress(postId)}
                      >
                        <Image source={ThreeDots} style={styles.postMenuDots} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {isOwnProfile && openPostMenuId === postId && (
                    <View style={styles.postMenuDropdown}>
                      <TouchableOpacity
                        onPress={() =>
                          handleEditPostPress(postId, post.title || "")
                        }
                        style={styles.postMenuOption}
                      >
                        <Text style={styles.postMenuOptionText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeletePostPress(postId)}
                        style={styles.postMenuOption}
                      >
                        <Text style={styles.postMenuOptionText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {post.workout && (
                    <View style={styles.postWorkoutBadge}>
                      <Text style={styles.postWorkoutIcon}>💪</Text>
                      <View style={styles.postWorkoutInfo}>
                        <Text style={styles.postWorkoutTitle}>
                          {post.workout.title}
                        </Text>
                        <Text style={styles.postWorkoutDetails}>
                          {[
                            formatWorkoutDurationMinutes(
                              post.workout.totalDuration
                            ),
                            post.workout.difficulty,
                          ]
                            .filter(Boolean)
                            .join("  •  ")}
                        </Text>
                      </View>
                    </View>
                  )}

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
                  {console.log("Post media URL:", post.mediaUrl)}

                  {post.mediaUrl && (
                    <Image
                      source={{ uri: post.mediaUrl }}
                      style={styles.postImagePlaceholder}
                      resizeMode="cover"
                    />
                  )}

                  <Text style={styles.postContent}>
                    {post.title || post.content}
                  </Text>

                  <View style={styles.postMetaRow}>
                    <Text style={styles.postTimestampLeft}>
                      {post.createdAt
                        ? new Date(post.createdAt).toLocaleDateString()
                        : ""}
                    </Text>
                    <View style={styles.postMetaIconsRight}>
                      <TouchableOpacity
                        style={styles.postMetaItem}
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
                                styles.postMetaIconImage,
                                {
                                  tintColor: COLORS.text,
                                },
                              ]}
                            />
                            <Text style={styles.postMetaText}>
                              {post.likeCount || 0}
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.postMetaItem}
                        onPress={() => handleOpenComments(postId)}
                      >
                        <Image
                          source={CommentIcon}
                          style={[
                            styles.postMetaIconImage,
                            {
                              tintColor: COLORS.text,
                            },
                          ]}
                        />
                        <Text style={styles.postMetaText}>
                          {post.commentCount || 0}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
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

      <ConfirmationDialog
        visible={showDeletePostDialog}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDeletePost}
        onCancel={cancelDeletePost}
        loading={false}
      />

      <Modal
        visible={editingPost !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelEditPost}
      >
        <KeyboardAvoidingView
          behavior={isKeyboardVisible ? (Platform.OS === "ios" ? "padding" : "height") : undefined}
          style={styles.editPostModalContainer}
          enabled={isKeyboardVisible}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.editPostModalOverlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.editPostModalContent, { paddingBottom: !isKeyboardVisible ? DIMENSIONS.spacing.lg + navBarHeight : DIMENSIONS.spacing.lg }]}>
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
                        (!editPostText.trim() || isUpdating) &&
                          styles.editPostSaveButtonDisabled,
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
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {selectedPostId && (
        <CommentsModal
          visible={commentsModalVisible}
          postId={selectedPostId}
          onClose={handleCloseComments}
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
  header: {
    paddingTop: 0,
    paddingBottom: 8,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: DIMENSIONS.spacing.lg,
  },
  createPostButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  createPostButtonText: {
    color: COLORS.black,
    fontSize: 14,
    fontFamily: FontWeight.Medium,
  },
  postsList: {
    gap: 16,
  },
  postCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    overflow: "visible",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: "cover",
  },
  avatarText: {
    color: COLORS.surface,
    fontSize: 18,
    fontWeight: "600",
  },
  postHeaderInfo: {
    flex: 1,
  },
  postUserName: {
    fontSize: 15,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
  },
  postTimestamp: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FontWeight.Regular,
  },
  postMenuButton: {
    position: "relative",
    overflow: "visible",
  },
  postMenuDots: {
    width: 20,
    height: 20,
    top: 2,
    position: "absolute",
    end: -15,
    tintColor: COLORS._5E5E5E,
  },
  postContent: {
    fontSize: 15,
    color: COLORS.text,
    fontFamily: FontWeight.Regular,
    marginBottom: 8,
    zIndex: 1,
  },
  postImagePlaceholder: {
    width: "100%",
    height: 120,
    backgroundColor: COLORS._E2E2E2,
    borderRadius: 12,
    marginBottom: 8,
  },
  postMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  postTimestampLeft: {
    fontSize: 12,
    color: COLORS._616888,
    fontFamily: FontWeight.Regular,
  },
  postMetaIconsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  postReactionWrapper: {
    justifyContent: "center",
  },
  postReactionsRow: {
    marginTop: DIMENSIONS.spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: DIMENSIONS.spacing.sm,
  },
  postReactionsLabel: {
    fontFamily: FontWeight.Medium,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  postMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  postMetaIconImage: {
    width: 20,
    height: 20,
    tintColor: COLORS.text,
  },
  postMetaText: {
    fontSize: 12,
    color: COLORS._616888,
    fontFamily: FontWeight.Regular,
  },
  postActions: {
    flexDirection: "row",
    gap: DIMENSIONS.spacing.lg,
    paddingTop: DIMENSIONS.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 8,
  },
  postAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  postActionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: FontWeight.Medium,
  },
  fab: {
    position: "absolute",
    bottom: 32,
    right: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  fabIcon: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: "600",
    marginTop: -2,
  },
  postMenuDropdown: {
    position: "absolute",
    top: 50,
    right: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingVertical: DIMENSIONS.spacing.xs,
    minWidth: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 999,
    zIndex: 9999,
  },
  postMenuOption: {
    paddingVertical: DIMENSIONS.spacing.sm,
    paddingHorizontal: DIMENSIONS.spacing.md,
  },
  postMenuOptionText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: "500",
  },
  editPostModalContainer: {
    flex: 1,
  },
  editPostModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  editPostModalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: DIMENSIONS.spacing.lg,
    maxHeight: "70%",
    paddingBottom: DIMENSIONS.spacing.lg,
  },
  editPostModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: DIMENSIONS.spacing.lg,
  },
  editPostModalTitle: {
    fontSize: 18,
    fontFamily: FontWeight.Bold,
    color: COLORS.text,
  },
  editPostModalClose: {
    fontSize: 18,
    color: COLORS.textSecondary,
    padding: DIMENSIONS.spacing.xs,
  },
  editPostInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: DIMENSIONS.spacing.md,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 120,
    textAlignVertical: "top",
  },
  editPostModalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: DIMENSIONS.spacing.lg,
  },
  editPostCancelButton: {
    flex: 1,
    backgroundColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: DIMENSIONS.spacing.md,
    alignItems: "center",
    marginRight: DIMENSIONS.spacing.sm,
  },
  editPostCancelButtonText: {
    fontSize: 16,
    color: COLORS.text,
    fontFamily: FontWeight.Medium,
  },
  editPostSaveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: DIMENSIONS.spacing.md,
    alignItems: "center",
    marginLeft: DIMENSIONS.spacing.sm,
  },
  editPostSaveButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  editPostSaveButtonText: {
    fontSize: 16,
    color: COLORS.black,
    fontFamily: FontWeight.Medium,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: DIMENSIONS.spacing.xl,
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
  achievementIcon: {
    fontSize: 20,
    marginRight: DIMENSIONS.spacing.sm,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontFamily: FontWeight.SemiBold,
    color: COLORS._B9780E,
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 12,
    fontFamily: FontWeight.Regular,
    color: COLORS._616888,
  },
  postWorkoutBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS._D2E7FF,
    borderRadius: 12,
    marginRight: 5,

    padding: DIMENSIONS.spacing.md,
    marginBottom: 10,
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
    marginRight: 5,
    marginBottom: 10,
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

export default MyPosts;
