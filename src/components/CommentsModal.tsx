import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { COLORS, DIMENSIONS } from '../config/constants';
import { Close, Send } from '../../assets';
import BasicTopBar from './BasicTopBar';
import ConfirmationDialog from './ConfirmationDialog';
import { useAuth } from '../contexts/AuthContext';
import {
  useGetPostCommentsQuery,
  useCreateCommentMutation,
  useDeleteCommentMutation,
} from '../services/api/likesCommentsApi';

interface CommentsModalProps {
  visible: boolean;
  postId: string;
  onClose: () => void;
}

interface Comment {
  id: number;
  userId: number;
  postId: number;
  content: string;
  parentCommentId: number | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    userName: string;
    displayName: string;
    imageUrl: string | null;
  };
  replies?: Comment[];
}

const CommentsModal: React.FC<CommentsModalProps> = ({ visible, postId, onClose }) => {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: number; name: string } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data: commentsData, isLoading, refetch } = useGetPostCommentsQuery(
    { postId, page: 1, limit: 50 },
    { skip: !visible }
  );

  const [createComment, { isLoading: isCreating }] = useCreateCommentMutation();
  const [deleteComment, { isLoading: isDeleting }] = useDeleteCommentMutation();

  const comments: Comment[] = 
    (commentsData?.status && commentsData?.data?.comments) 
      ? commentsData.data.comments 
      : [];

  const handleSendComment = async () => {
    if (!commentText.trim()) return;

    try {
      await createComment({
        postId,
        content: commentText.trim(),
        parentCommentId: replyingTo?.id,
      }).unwrap();

      setCommentText('');
      setReplyingTo(null);
      refetch();
    } catch (error) {
      console.error('Failed to post comment:', error);
      Alert.alert('Error', 'Failed to post comment. Please try again.');
    }
  };

  const handleMenuPress = (commentId: number) => {
    setOpenMenuId(openMenuId === commentId ? null : commentId);
  };

  const handleDeletePress = (commentId: number) => {
    setOpenMenuId(null);
    setCommentToDelete(commentId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;
    
    try {
      await deleteComment(commentToDelete.toString()).unwrap();
      refetch();
      setShowDeleteDialog(false);
      setCommentToDelete(null);
    } catch (error) {
      console.error('Failed to delete comment:', error);
      Alert.alert('Error', 'Failed to delete comment.');
      setShowDeleteDialog(false);
      setCommentToDelete(null);
    }
  };

  const cancelDeleteComment = () => {
    setShowDeleteDialog(false);
    setCommentToDelete(null);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleReply = (commentId: number, userName: string) => {
    setReplyingTo({ id: commentId, name: userName });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
  };

  const renderComment = ({ item, isReply = false }: { item: Comment; isReply?: boolean }) => {
    const userName = item.user.displayName || item.user.userName || 'Anonymous';
    const initials = userName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    // Add cache busting parameter to force image refresh on pull-to-refresh
    const avatarUri = item.user.imageUrl 
      ? item.user.imageUrl.includes('?') 
        ? item.user.imageUrl 
        : `${item.user.imageUrl}?v=${new Date(item.updatedAt || item.createdAt).getTime()}`
      : null;

    return (
      <View style={[styles.commentContainer, isReply && styles.replyContainer]}>
        <View style={styles.commentAvatar}>
          {avatarUri ? (
            <Image 
              source={{ uri: avatarUri }} 
              style={styles.commentAvatarImage}
            />
          ) : (
            <Text style={styles.commentAvatarText}>{initials}</Text>
          )}
        </View>
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <View style={styles.commentHeaderLeft}>
              <Text style={styles.commentUserName}>{userName}</Text>
              <Text style={styles.commentTime}>{getTimeAgo(item.createdAt)}</Text>
            </View>
            {user?.id && Number(user.id) === item.userId && (
              <View>
                <TouchableOpacity 
                  onPress={() => handleMenuPress(item.id)}
                  style={styles.commentMenuButton}
                >
                  <Text style={styles.commentMenuIcon}>⋯</Text>
                </TouchableOpacity>
                {openMenuId === item.id && (
                  <View style={styles.menuDropdown}>
                    <TouchableOpacity 
                      onPress={() => handleDeletePress(item.id)}
                      style={styles.menuOption}
                    >
                      <Text style={styles.menuOptionText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
          <Text style={styles.commentText}>{item.content}</Text>
          {/* <View style={styles.commentActions}>
            {!isReply && (
              <TouchableOpacity onPress={() => handleReply(item.id, userName)}>
                <Text style={styles.commentActionText}>Reply</Text>
              </TouchableOpacity>
            )}
          </View> */}
          {item.replies && item.replies.length > 0 && (
            <View style={styles.repliesContainer}>
              {item.replies.map((reply) => (
                <View key={reply.id}>{renderComment({ item: reply, isReply: true })}</View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <View style={styles.modalBackground}>
        <SafeAreaView style={styles.container}>
          <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
          >
            <View style={styles.headerContainer}>
              <BasicTopBar
                title="Comments"
                subtitle="Share your thoughts"
                onBackPress={onClose}
                showBackButton={true}
                containerStyle={{ paddingVertical: DIMENSIONS.spacing.md }}
              />
        
            </View>

            {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : comments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No comments yet. Be the first to comment!</Text>
          </View>
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => renderComment({ item })}
            contentContainerStyle={styles.commentsList}
            onScrollBeginDrag={() => setOpenMenuId(null)}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={COLORS.primary}
                colors={[COLORS.primary]}
              />
            }
          />
        )}

        <View style={styles.inputContainer}>
          {replyingTo && (
            <View style={styles.replyingToContainer}>
              <Text style={styles.replyingToText}>Replying to {replyingTo.name}</Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Text style={styles.cancelReplyText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder={replyingTo ? 'Write a reply...' : 'Write a comment...'}
              placeholderTextColor={COLORS.textSecondary}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!commentText.trim() || isCreating) && styles.sendButtonDisabled]}
              onPress={handleSendComment}
              disabled={!commentText.trim() || isCreating}
            >
              {isCreating ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Image source={Send} style={styles.sendIcon} />
              )}
            </TouchableOpacity>
          </View>
        </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>

      <ConfirmationDialog
        visible={showDeleteDialog}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDeleteComment}
        onCancel={cancelDeleteComment}
        loading={isDeleting}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  headerContainer: {

  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: DIMENSIONS.spacing.xl,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  commentsList: {
    padding: DIMENSIONS.spacing.lg,
    paddingBottom: DIMENSIONS.spacing.xl,
    paddingTop: DIMENSIONS.spacing.md,
  },
  commentContainer: {
    flexDirection: 'row',
    marginBottom: DIMENSIONS.spacing.lg,
    backgroundColor: COLORS.surface,
    padding: DIMENSIONS.spacing.md,
    paddingVertical: DIMENSIONS.spacing.lg,
    borderRadius: DIMENSIONS.borderRadius,
  },
  replyContainer: {
    marginLeft: DIMENSIONS.spacing.xl,
    marginTop: DIMENSIONS.spacing.md,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DIMENSIONS.spacing.sm,
  },
  commentAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  commentAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DIMENSIONS.spacing.xs,
  },
  commentHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: DIMENSIONS.spacing.sm,
  },
  commentTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  commentMenuButton: {
    padding: DIMENSIONS.spacing.xs,
    marginLeft: DIMENSIONS.spacing.sm,
  },
  commentMenuIcon: {
    fontSize: 20,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  menuDropdown: {
    position: 'absolute',
    top: 30,
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
  menuOption: {
    paddingVertical: DIMENSIONS.spacing.sm,
    paddingHorizontal: DIMENSIONS.spacing.md,
  },
  menuOptionText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
  commentText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: DIMENSIONS.spacing.xs,
  },
  commentActions: {
    flexDirection: 'row',
    gap: DIMENSIONS.spacing.md,
  },
  commentActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  commentActionDelete: {
    color: COLORS.error,
  },
  repliesContainer: {
    marginTop: DIMENSIONS.spacing.sm,
  },
  inputContainer: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: Platform.OS === 'ios' ? 30 : DIMENSIONS.spacing.md,
  },
  replyingToContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingVertical: DIMENSIONS.spacing.sm,
    backgroundColor: COLORS._E6E6E7,
  },
  replyingToText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  cancelReplyText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingTop: DIMENSIONS.spacing.md,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: DIMENSIONS.spacing.md,
    paddingVertical: DIMENSIONS.spacing.sm,
    fontSize: 14,
    color: COLORS.text,
    maxHeight: 100,
    marginRight: DIMENSIONS.spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  sendIcon: {
    width: 20,
    height: 20,
    tintColor: COLORS.white,
  },
});

export default CommentsModal;
