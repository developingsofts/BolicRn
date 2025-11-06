import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BasicTopBar from '../components/BasicTopBar';
import { COLORS, DIMENSIONS } from '../config/constants';
import FontWeight from '../hooks/useInterFonts';
import { Like, CommentIcon } from '../../assets';
import { useAuth } from '../contexts/AuthContext';
import {
  useDeletePostMutation,
  useLazyGetPostsQuery,
  useUpdatePostMutation,
} from '../services/api';
import { useToggleLikeMutation } from '../services/api/likesCommentsApi';
import CommentsModal from '../components/CommentsModal';
import ConfirmationDialog from '../components/ConfirmationDialog';
import EditPostModal from '../components/EditPostModal';
interface HomeFeedScreenProps {
  navigation: any;
}

const PAGE_SIZE = 10;

const getTimeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + 'y ago';

  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + 'mo ago';

  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + 'd ago';

  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + 'h ago';

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + 'm ago';

  return 'Just now';
};

const HomeFeedScreen: React.FC<HomeFeedScreenProps> = ({ navigation }) => {
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [openPostMenuId, setOpenPostMenuId] = useState<string | null>(null);
  const [showDeletePostDialog, setShowDeletePostDialog] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<{ id: string; caption: string } | null>(null);
  const [editPostText, setEditPostText] = useState('');
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [likingPostId, setLikingPostId] = useState<string | null>(null);

  const [fetchPosts] = useLazyGetPostsQuery();
  const [deletePost, { isLoading: isDeleting }] = useDeletePostMutation();
  const [updatePost, { isLoading: isUpdating }] = useUpdatePostMutation();
  const [toggleLike] = useToggleLikeMutation();

  const loadPosts = useCallback(
    async (pageToLoad: number = 1, { replace = false, silent = false } = {}) => {
      if (!isAuthenticated) {
        setInitialLoading(false);
        return;
      }

      if (!silent) {
        if (pageToLoad === 1) {
          setRefreshing(true);
        } else {
          setIsLoadingMore(true);
        }
      }

      try {
        const response = await fetchPosts({ page: pageToLoad, limit: PAGE_SIZE }).unwrap();
        if (response?.status && response?.data) {
          const { posts: fetchedPosts = [], pagination } = response.data;

          setPosts((prevPosts) => {
            if (pageToLoad === 1 || replace) {
              return fetchedPosts;
            }

            const existing = new Map<string, any>();
            prevPosts.forEach((post) => {
              existing.set(String(post.id), post);
            });

            fetchedPosts.forEach((post: any) => {
              existing.set(String(post.id), { ...existing.get(String(post.id)), ...post });
            });

            return Array.from(existing.values()).sort((a, b) => {
              const dateA = new Date(a.createdAt ?? a.updatedAt ?? 0).getTime();
              const dateB = new Date(b.createdAt ?? b.updatedAt ?? 0).getTime();
              return dateB - dateA;
            });
          });

          const currentPage = pagination?.currentPage ?? pageToLoad;
          const totalPages = pagination?.totalPages ?? currentPage;
          setPage(currentPage);
          setHasMore(currentPage < totalPages);
        } else if (pageToLoad === 1 || replace) {
          setPosts([]);
          setHasMore(false);
        }
      } catch (error) {
        console.error('Failed to load posts:', error);
        if (pageToLoad === 1 || replace) {
          setPosts([]);
        }
      } finally {
        if (!silent) {
          if (pageToLoad === 1) {
            setRefreshing(false);
          } else {
            setIsLoadingMore(false);
          }
        }
        setInitialLoading(false);
      }
    },
    [fetchPosts, isAuthenticated]
  );

  useEffect(() => {
    loadPosts(1, { replace: true, silent: true });
  }, [loadPosts]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPosts(1, { replace: true });
  }, [loadPosts]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoadingMore && isAuthenticated) {
      loadPosts(page + 1);
    }
  }, [hasMore, isAuthenticated, isLoadingMore, loadPosts, page]);

  const handlePostMenuPress = useCallback((postId: string) => {
    setOpenPostMenuId((current) => (current === postId ? null : postId));
  }, []);

  const handleDeletePostPress = useCallback((postId: string) => {
    setPostToDelete(postId);
    setShowDeletePostDialog(true);
    setOpenPostMenuId(null);
  }, []);

  const handleEditPostPress = useCallback((postId: string, caption: string) => {
    setEditingPost({ id: postId, caption });
    setEditPostText(caption);
    setOpenPostMenuId(null);
  }, []);

  const handleOpenComments = useCallback((postId: string) => {
    setSelectedPostId(postId);
    setCommentsModalVisible(true);
    setOpenPostMenuId(null);
  }, []);

  const handleCloseComments = useCallback(() => {
    setCommentsModalVisible(false);
    setSelectedPostId(null);
    loadPosts(1, { replace: true, silent: true });
  }, [loadPosts]);

  const confirmDeletePost = async () => {
    if (!postToDelete) return;

    try {
      await deletePost({ postId: postToDelete }).unwrap();
      setPosts((prev) => prev.filter((post) => String(post.id) !== postToDelete));
      setShowDeletePostDialog(false);
      setPostToDelete(null);
    } catch (error) {
      console.error('Failed to delete post:', error);
      Alert.alert('Error', 'Failed to delete post. Please try again.');
      setShowDeletePostDialog(false);
      setPostToDelete(null);
    }
  };

  const cancelDeletePost = () => {
    setShowDeletePostDialog(false);
    setPostToDelete(null);
  };

  const handleSaveEditPost = async () => {
    if (!editingPost || !editPostText.trim()) return;

    try {
      await updatePost({ postId: editingPost.id, title: editPostText.trim() }).unwrap();
      setPosts((prev) =>
        prev.map((post) =>
          String(post.id) === editingPost.id
            ? { ...post, title: editPostText.trim() }
            : post
        )
      );
      setEditingPost(null);
      setEditPostText('');
    } catch (error) {
      console.error('Failed to update post:', error);
      Alert.alert('Error', 'Failed to update post. Please try again.');
    }
  };

  const handleCancelEditPost = () => {
    setEditingPost(null);
    setEditPostText('');
  };

  const handleLikePost = useCallback(async (postId: string) => {
    try {
      setLikingPostId(postId);
      const response = await toggleLike(postId).unwrap();

      if (response?.status && response?.data) {
        setPosts((prev) =>
          prev.map((post) => {
            if (String(post.id) !== postId) {
              return post;
            }

            const likeCount = response.data?.likeCount ?? post.likeCount ?? post.likes ?? 0;
            const isLikedByUser = response.data?.liked;

            return {
              ...post,
              likeCount,
              likes: likeCount,
              isLikedByUser,
              likedByCurrentUser: isLikedByUser,
            };
          })
        );
      } else {
        await loadPosts(1, { replace: true, silent: true });
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    } finally {
      setLikingPostId(null);
    }
  }, [loadPosts, toggleLike]);

  const feedData = useMemo(() => posts ?? [], [posts]);

  const renderPost = useCallback(
    ({ item }: { item: any }) => {
      const post = item;
      const postUser = post.user ?? {};
      const userName =
        postUser.displayName ||
        postUser.userName ||
        postUser.email ||
        'Anonymous User';
      const initials = userName
        .split(' ')
        .filter(Boolean)
        .map((part: string) => part[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
      const avatarUri = postUser.imageUrl || null;
      const timeAgo = post.createdAt ? getTimeAgo(new Date(post.createdAt)) : 'Just now';
      const likeCount = post.likeCount ?? post.likes ?? 0;
      const commentCount = post.commentCount ?? post.comments?.length ?? 0;
      const isOwnPost = user?.id != null && Number(user.id) === Number(post.userId);
      const isLiked = Boolean(post.isLikedByUser ?? post.likedByCurrentUser ?? post.isLiked);

      return (
        <View style={styles.socialPost}>
          <View style={styles.socialPostHeader}>
            <View style={styles.socialPostAvatar}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.socialPostAvatarImage} />
              ) : (
                <Text style={styles.socialPostAvatarText}>{initials}</Text>
              )}
            </View>
            <View style={styles.socialPostInfo}>
              <Text style={styles.socialPostName}>{userName}</Text>
              <Text style={styles.socialPostTime}>{timeAgo}</Text>
            </View>
            {isOwnPost && (
              <View>
                <TouchableOpacity
                  style={styles.socialPostMenu}
                  onPress={() => handlePostMenuPress(String(post.id))}
                >
                  <Text style={styles.socialPostMenuText}>⋯</Text>
                </TouchableOpacity>
                {openPostMenuId === String(post.id) && (
                  <View style={styles.postMenuDropdown}>
                    <TouchableOpacity
                      onPress={() => handleEditPostPress(String(post.id), post.title || '')}
                      style={styles.postMenuOption}
                    >
                      <Text style={styles.postMenuOptionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeletePostPress(String(post.id))}
                      style={styles.postMenuOption}
                    >
                      <Text style={styles.postMenuOptionText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>

          {post.title ? <Text style={styles.socialPostContent}>{post.title}</Text> : null}

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

          {post.achievement && (
            <View style={styles.postAchievementBadge}>
              <Text style={styles.postAchievementIcon}>{post.achievement.icon || '🏆'}</Text>
              <View style={styles.postAchievementInfo}>
                <Text style={styles.postAchievementTitle}>{post.achievement.title}</Text>
                <Text style={styles.postAchievementDescription}>{post.achievement.description}</Text>
              </View>
            </View>
          )}

          {post.mediaUrl ? (
            <Image source={{ uri: post.mediaUrl }} style={styles.socialPostImage} resizeMode="cover" />
          ) : null}

          <View style={styles.socialPostActions}>
            <TouchableOpacity
              style={styles.socialPostAction}
              onPress={() => handleLikePost(String(post.id))}
              disabled={likingPostId === String(post.id)}
            >
              <Image
                source={Like}
                style={[
                  styles.socialPostActionIcon,
                  isLiked ? styles.socialPostActionIconActive : null,
                ]}
              />
              <Text
                style={[
                  styles.socialPostActionText,
                  isLiked ? styles.socialPostActionTextActive : null,
                ]}
              >
                {likeCount}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialPostAction}
              onPress={() => handleOpenComments(String(post.id))}
            >
              <Image source={CommentIcon} style={styles.socialPostActionIcon} />
              <Text style={styles.socialPostActionText}>{commentCount}</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [
      handleDeletePostPress,
      handleEditPostPress,
      handleLikePost,
      handleOpenComments,
      handlePostMenuPress,
      likingPostId,
      openPostMenuId,
      user?.id,
    ]
  );

  const listEmptyComponent = useMemo(() => {
    if (initialLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>No posts yet. Be the first to share!</Text>
        <TouchableOpacity
          style={styles.emptyStateButton}
          onPress={() => navigation.navigate('CreatePost')}
        >
          <Text style={styles.emptyStateButtonText}>Create Post</Text>
        </TouchableOpacity>
      </View>
    );
  }, [initialLoading, navigation]);

  const listFooterComponent = useMemo(() => {
    if (!isAuthenticated) {
      return null;
    }

    if (isLoadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      );
    }

    if (!hasMore && feedData.length > 0) {
      return (
        <Text style={styles.endOfFeedText}>You&apos;ve reached the end of the feed.</Text>
      );
    }

    return null;
  }, [feedData.length, hasMore, isAuthenticated, isLoadingMore]);

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <BasicTopBar
        onBackPress={() => navigation.goBack()}
        containerStyle={styles.header}
        title="Community Feed"
        subtitle="See what the community is sharing"
      />

      <View style={styles.content}>
        <FlatList
          data={feedData}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderPost}
          contentContainerStyle={styles.feedContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          onEndReachedThreshold={0.2}
          onEndReached={handleLoadMore}
          ListEmptyComponent={listEmptyComponent}
          ListFooterComponent={listFooterComponent}
          showsVerticalScrollIndicator={false}
        />
      </View>

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

      <EditPostModal
        visible={editingPost !== null}
        onClose={handleCancelEditPost}
        onSave={handleSaveEditPost}
        editText={editPostText}
        onChangeText={setEditPostText}
        isUpdating={isUpdating}
      />

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
    backgroundColor: COLORS.gradient3,
  },
  header: {
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingBottom: DIMENSIONS.spacing.md,
    paddingTop: DIMENSIONS.spacing.xxl,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  feedContent: {
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingVertical: DIMENSIONS.spacing.lg,
    gap: DIMENSIONS.spacing.md,
    paddingBottom: DIMENSIONS.spacing.xxl,
  },
  socialPost: {
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    padding: DIMENSIONS.spacing.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  socialPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DIMENSIONS.spacing.md,
  },
  socialPostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '600',
  },
  socialPostInfo: {
    flex: 1,
  },
  socialPostName: {
    fontSize: 16,
    fontWeight: '600',
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
  socialPostImage: {
    width: '100%',
    height: 200,
    borderRadius: DIMENSIONS.borderRadius,
    marginTop: DIMENSIONS.spacing.sm,
    backgroundColor: COLORS.border,
  },
  socialPostActions: {
    flexDirection: 'row',
    gap: DIMENSIONS.spacing.lg,
    paddingTop: DIMENSIONS.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: DIMENSIONS.spacing.md,
  },
  socialPostAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.spacing.xs,
    paddingVertical: DIMENSIONS.spacing.xs,
  },
  socialPostActionIcon: {
    width: 20,
    height: 20,
  },
  socialPostActionIconActive: {
    tintColor: COLORS.primary,
  },
  socialPostActionText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  socialPostActionTextActive: {
    color: COLORS.primary,
  },
  loadingContainer: {
    paddingVertical: DIMENSIONS.spacing.xl,
    alignItems: 'center',
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
  footerLoader: {
    paddingVertical: DIMENSIONS.spacing.lg,
    alignItems: 'center',
  },
  endOfFeedText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 13,
    marginVertical: DIMENSIONS.spacing.md,
  },
});

export default HomeFeedScreen;
