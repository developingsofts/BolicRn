import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Modal, KeyboardAvoidingView, Platform, TextInput, ActivityIndicator } from 'react-native';
import RefreshableScrollView from '../components/RefreshableScrollView';
import { SafeAreaView } from 'react-native-safe-area-context';
import BasicTopBar from '../components/BasicTopBar';
import { Like, CommentIcon, CommentRemove } from '../../assets';
import { COLORS, DIMENSIONS } from '../config/constants';
import FontWeight from '../hooks/useInterFonts';
import { useAuth } from '../contexts/AuthContext';
import { useGetUserPostsQuery, useDeletePostMutation, useUpdatePostMutation } from '../services/api';
import { useToggleLikeMutation } from '../services/api/likesCommentsApi';
import CommentsModal from '../components/CommentsModal';
import ConfirmationDialog from '../components/ConfirmationDialog';


const MyPosts: React.FC = ({ navigation, route }: any) => {
  const { user } = useAuth();
  // Accept userId from route params (if present)
  const userId = route?.params?.userId || user?.id;
  const isOwnProfile = !route?.params?.userId || route?.params?.userId === user?.id;
  const [refreshing, setRefreshing] = useState(false);
  const [openPostMenuId, setOpenPostMenuId] = useState<string | null>(null);
  const [showDeletePostDialog, setShowDeletePostDialog] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<{ id: string; caption: string } | null>(null);
  const [editPostText, setEditPostText] = useState("");
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  // Fetch posts for the correct user
  const { data: postsData, refetch: refetchPosts, isLoading } = useGetUserPostsQuery({ userId }, { skip: !userId });
  const [deletePost] = useDeletePostMutation();
  const [updatePost, { isLoading: isUpdating }] = useUpdatePostMutation();
  const [toggleLike, { isLoading: isLiking }] = useToggleLikeMutation();
  const [likingPostId, setLikingPostId] = useState<string | null>(null);
  const posts = postsData && postsData.status && 'data' in postsData ? postsData.data.posts : [];

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
      Alert.alert('Error', 'Failed to update post');
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
      Alert.alert('Error', 'Failed to delete post');
    }
  };

  const cancelDeletePost = () => {
    setShowDeletePostDialog(false);
    setPostToDelete(null);
  };

  const handleLikePost = async (postId: string) => {
    try {
      setLikingPostId(postId);
      await toggleLike(postId).unwrap();
      refetchPosts();
    } catch (error) {
      console.error('Failed to toggle like:', error);
    } finally {
      setLikingPostId(null);
    }
  };

  const handleOpenComments = (postId: string) => {
    setSelectedPostId(postId);
    setCommentsModalVisible(true);
  };

  const handleCloseComments = () => {
    setCommentsModalVisible(false);
    setSelectedPostId(null);
    refetchPosts(); // Refresh to update comment counts
  };

  const handlePostAction = (action: string, postId: string) => {
    if (action === 'create') {
      navigation.navigate('CreatePost');
    }
  };

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <BasicTopBar
        onBackPress={() => navigation.goBack()}
        title='Posts'
        subtitle={isOwnProfile ? 'View / Manage your shared posts' : 'Posts shared by this user'}
        containerStyle={{ paddingTop: DIMENSIONS.spacing.xxl, paddingBottom: DIMENSIONS.spacing.lg }}
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
            onPress={() => handlePostAction('create', '')}
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
            <Text style={{ textAlign: 'center', color: COLORS._5E5E5E, marginTop: 32 }}>No posts yet.</Text>
          ) : (
            posts.map((post: any) => (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={styles.avatarContainer}>
                    {post.user?.imageUrl ? (
                      <Image source={{ uri: post.user.imageUrl }} style={styles.avatarImage} />
                    ) : (
                      <Text style={styles.avatarText}>{post.user?.displayName?.charAt(0) || 'U'}</Text>
                    )}
                  </View>
                  <View style={styles.postHeaderInfo}>
                    <Text style={styles.postUserName}>{post.user?.displayName || 'User'}</Text>
                    <Text style={styles.postTimestamp}>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}</Text>
                  </View>
                  {isOwnProfile && (
                    <View>
                      <TouchableOpacity
                        style={styles.postMenuButton}
                        onPress={() => handlePostMenuPress(post.id.toString())}
                      >
                        <Text style={styles.postMenuDots}>⋯</Text>
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

                <Text style={styles.postContent}>{post.title || post.content}</Text>

                {/* Workout Information */}
                {post.workout && (
                  <View style={styles.postWorkoutBadge}>
                    <Text style={styles.postWorkoutIcon}>💪</Text>
                    <View style={styles.postWorkoutInfo}>
                      <Text style={styles.postWorkoutTitle}>{post.workout.title}</Text>
                      <Text style={styles.postWorkoutDetails}>
                        {post.workout.totalDuration} min • {post.workout.difficulty}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Achievement Information */}
                {post.achievement && (
                  <View style={styles.postAchievementBadge}>
                    <Text style={styles.postAchievementIcon}>{post.achievement.icon || '🏆'}</Text>
                    <View style={styles.postAchievementInfo}>
                      <Text style={styles.postAchievementTitle}>{post.achievement.title}</Text>
                      <Text style={styles.postAchievementDescription}>{post.achievement.description}</Text>
                    </View>
                  </View>
                )}

                {post.mediaUrl && (
                  <Image source={{ uri: post.mediaUrl }} style={styles.postImagePlaceholder} resizeMode="cover" />
                )}

                <View style={styles.postMetaRow}>
                  <Text style={styles.postTimestampLeft}>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}</Text>
                  <View style={styles.postMetaIconsRight}>
                    <TouchableOpacity 
                      style={styles.postMetaItem}
                      onPress={() => handleLikePost(post.id.toString())}
                    >
                      <Image source={Like} style={styles.postMetaIconImage} />
                      <Text style={styles.postMetaText}>{post.likeCount || 0}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.postMetaItem}
                      onPress={() => handleOpenComments(post.id.toString())}
                    >
                      <Image source={CommentIcon} style={styles.postMetaIconImage} />
                      <Text style={styles.postMetaText}>{post.commentCount || 0}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </RefreshableScrollView>

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

      {/* Edit Post Modal */}
      <Modal
        visible={editingPost !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelEditPost}
      >
        <KeyboardAvoidingView
          // behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  createPostButtonText: {
    color: COLORS.white,
    fontSize: 16,
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
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: 'cover',
  },
  avatarText: {
    color: COLORS.surface,
    fontSize: 18,
    fontWeight: '600',
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
    padding: 4,
    marginLeft: 8,
  },
  postMenuDots: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
  postContent: {
    fontSize: 15,
    color: COLORS.text,
    fontFamily: FontWeight.Regular,
    marginBottom: 8,
  },
  postImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: COLORS._E2E2E2,
    borderRadius: 12,
    marginBottom: 8,
  },
  postMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  postTimestampLeft: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FontWeight.Regular,
  },
  postMetaIconsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  postMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postMetaIconImage: {
    width: 20,
    height: 20,
    tintColor: COLORS.gradient1,
  },
  postMetaText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: FontWeight.Medium,
  },
  postActions: {
    flexDirection: 'row',
    gap: DIMENSIONS.spacing.lg,
    paddingTop: DIMENSIONS.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 8,
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postActionIcon: {
    width: 20,
    height: 20,
    tintColor: '#888888',
  },
  postActionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: FontWeight.Medium,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  fabIcon: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: '600',
    marginTop: -2,
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
  editPostModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  editPostModalOverlay: {
    flex: 1,
  },
  editPostModalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: DIMENSIONS.spacing.lg,
    maxHeight: '70%',
  },
  editPostModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    textAlignVertical: 'top',
  },
  editPostModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: DIMENSIONS.spacing.lg,
  },
  editPostCancelButton: {
    flex: 1,
    backgroundColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: DIMENSIONS.spacing.md,
    alignItems: 'center',
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
    alignItems: 'center',
    marginLeft: DIMENSIONS.spacing.sm,
  },
  editPostSaveButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  editPostSaveButtonText: {
    fontSize: 16,
    color: COLORS.white,
    fontFamily: FontWeight.Medium,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DIMENSIONS.spacing.xl,
  },
  workoutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
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

export default MyPosts;
