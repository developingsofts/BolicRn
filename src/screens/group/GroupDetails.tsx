import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  FlatList,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Menu } from "react-native-paper";
import RefreshableScrollView from "../../components/RefreshableScrollView";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, DIMENSIONS } from "../../config/constants";
import { r, SCALE } from "../../designing/responsiveDesigns";
import { useResponsive } from "../../hooks/responsiveDesignHook";
import FontWeight from "../../hooks/useInterFonts";
import { Divider } from "react-native-paper";
import {
  Add,
  Comment,
  Edit,
  Gym,
  ImageFile,
  Like,
  Location,
  Send,
} from "../../../assets";
import { Group } from "../../types";
import ManageGroup from "./ManageGroup";
import BasicTopBar from "../../components/BasicTopBar";
import {
  useGetGroupByIdQuery,
  useGetGroupMembersQuery,
  useGetGroupPostsQuery,
  useJoinGroupMutation,
  useRequestJoinGroupMutation,
  useDeleteGroupMutation,
} from "../../services/api/groupsApi";
import { useLeaveGroupMutation } from "../../services/api/leaveGroup";
import {
  useToggleLikeMutation,
  useGetPostCommentsQuery,
} from "../../services/api/likesCommentsApi";
import {
  useDeletePostMutation,
  useUpdatePostMutation,
} from "../../services/api/postsApi";
import { useAuth } from "../../contexts/AuthContext";
import { Toast } from "../../components/ToastManager";
import CommentsModal from "../../components/CommentsModal";
import EditPostModal from "../../components/EditPostModal";
import { useFocusEffect } from "@react-navigation/native";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";

interface GroupDetailsProps {
  navigation?: any;
  route?: {
    params: {
      group: Group;
    };
  };
  group?: Group | null;
  onClose?: () => void;
}

const baseStyles = StyleSheet.create({
  loadingContainer: {
    padding: r(40),
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: r(14),
    color: COLORS._5E5E5E,
    textAlign: "center",
  },
  emptyPostsContainer: {
    padding: r(30),
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: r(120), // Extra padding to ensure FAB doesn't overlap content
  },
  heroSection: {
    backgroundColor: COLORS.gradient3,
    paddingTop: DIMENSIONS.spacing.xxl,
    paddingHorizontal: r(16),
    paddingBottom: r(16),
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  backButton: {
    padding: r(8),
  },
  dropdownButton: {
    top: 0,
    padding: r(8),
    marginTop: DIMENSIONS.spacing.lg,
  },
  heroContent: {
    alignItems: "flex-start",
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.white,
    marginBottom: r(5),
  },
  heroTags: {
    flexDirection: "row",
    marginBottom: r(16),
  },
  locationTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: r(12),
    paddingVertical: r(6),
    borderRadius: r(20),
    marginRight: r(8),
  },
  categoryTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: r(12),
    paddingVertical: r(6),
    borderRadius: r(20),
  },
  tagText: {
    fontSize: 12,
    fontFamily: FontWeight.Medium,
    color: COLORS.text,
    marginLeft: r(4),
  },
  heroSubtitle: {
    fontSize: 14,
    fontFamily: FontWeight.Regular,
    color: COLORS.white,
    marginBottom: r(25),
  },
  heroDescription: {
    fontSize: 14,
    fontFamily: FontWeight.Regular,
    color: COLORS.white,
    lineHeight: 20,
    marginBottom: r(20),
    paddingBottom: r(10),
  },
  manageButton: {
    flexDirection: "row",
    alignItems: "center",
    width: "90%",
    alignSelf: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    paddingHorizontal: r(20),
    paddingVertical: r(12),
    borderRadius: r(8),
    marginTop: -25,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  manageButtonText: {
    color: COLORS.gradient1,
    fontSize: 14,
    fontFamily: FontWeight.Medium,
    marginLeft: r(8),
  },
  joinButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  joinButtonText: {
    color: COLORS.white,
  },
  joinButtonDisabled: {
    opacity: 0.7,
  },

  membersCard: {
    backgroundColor: "white",
    marginHorizontal: 18,
    paddingHorizontal: r(16),
    borderRadius: r(12),
    marginTop: 0,
    marginBottom: 16,
    padding: r(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  membersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: r(5),
  },
  membersTitle: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.gradient1,
  },
  membersCount: {
    fontSize: 14,
    fontFamily: FontWeight.Medium,
    color: COLORS.gradient1,
  },
  membersContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  avatarsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  memberAvatarText: {
    color: COLORS.white,
    fontSize: 22,
    fontFamily: FontWeight.SemiBold,
  },
  memberCountAvatar: {
    backgroundColor: COLORS.primary,
  },
  memberCountText: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: FontWeight.SemiBold,
  },
  viewListText: {
    color: COLORS._5E5E5E,
    fontSize: 14,
    textDecorationLine: "underline",
    fontFamily: FontWeight.Medium,
  },
  membersModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: r(16),
  },
  membersModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: r(16),
    width: "100%",
    maxHeight: "85%",
    paddingVertical: r(20),
  },
  membersModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: r(20),
    marginBottom: r(4),
  },
  membersModalTitle: {
    fontSize: 18,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.app_black,
  },
  membersModalSubtitle: {
    fontSize: 14,
    fontFamily: FontWeight.Regular,
    color: COLORS._5E5E5E,
    paddingHorizontal: r(20),
    marginBottom: r(12),
  },
  membersModalCloseButton: {
    width: r(32),
    height: r(32),
    borderRadius: r(16),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
  },
  membersModalList: {
    paddingHorizontal: r(20),
    paddingBottom: r(16),
  },
  membersModalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: r(12),
  },
  membersModalAvatar: {
    width: r(44),
    height: r(44),
    borderRadius: r(22),
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: r(12),
    overflow: "hidden",
  },
  membersModalAvatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  membersModalAvatarText: {
    color: COLORS.white,
    fontSize: 18,
    fontFamily: FontWeight.SemiBold,
  },
  membersModalDetails: {
    flex: 1,
  },
  membersModalName: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.app_black,
  },
  membersModalLocation: {
    fontSize: 13,
    fontFamily: FontWeight.Regular,
    color: COLORS._5E5E5E,
    marginTop: r(2),
  },
  membersModalEmptyContainer: {
    paddingVertical: r(40),
    alignItems: "center",
    justifyContent: "center",
  },
  membersModalEmptyText: {
    fontSize: 14,
    fontFamily: FontWeight.Medium,
    color: COLORS._5E5E5E,
  },
  membersEmptyCardText: {
    fontSize: 14,
    fontFamily: FontWeight.Medium,
    color: COLORS._5E5E5E,
    marginTop: r(8),
  },
  membersModalFooter: {
    paddingVertical: r(16),
  },
  membersModalCloseButtonFull: {
    marginHorizontal: r(20),
    marginTop: r(8),
    paddingVertical: r(12),
    borderRadius: r(8),
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  membersModalCloseButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
  },
  postsSection: {
    minHeight: 200, // Minimum height to show content
  },
  postsTitle: {
    fontSize: 20,
    fontFamily: FontWeight.SemiBold,
    paddingHorizontal: r(16),

    color: COLORS.gradient1,
    marginBottom: r(5),
  },
  postCard: {
    backgroundColor: "white",
    borderRadius: r(12),
    marginHorizontal: r(16),
    padding: r(14),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    paddingBottom: 30,
    marginBottom: 10,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: r(5),
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: r(8),
  },
  authorAvatarText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
  },
  postInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.app_black,
  },
  timeAgo: {
    fontSize: 14,
    color: COLORS._5E5E5E,
    marginTop: r(2),
    fontFamily: FontWeight.Regular,
  },
  postMenuButton: {
    padding: r(8),
  },
  postMenuDots: {
    fontSize: 18,
    color: COLORS.textSecondary,
    fontWeight: "700",
  },
  postContent: {
    fontSize: 14,
    color: COLORS.app_black,
    fontFamily: FontWeight.Regular,
    lineHeight: 20,
    marginBottom: 10,
  },
  postActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: r(10),
  },
  actionIcon: {
    width: 16,
    height: 16,
  },
  actionText: {
    fontSize: 14,
    color: COLORS._5E5E5E,
    fontFamily: FontWeight.Regular,
    marginLeft: r(3),
  },
  messageRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: r(5),
    gap: 0,
    marginBottom: 10,
  },
  messageInputContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: r(8),
    paddingStart: r(10),
    backgroundColor: COLORS.white,
    marginStart: r(16),
    marginEnd: r(10),
    borderTopLeftRadius: 15,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,

    marginBottom: 10,
    marginTop: r(5),
  },
  messageInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: FontWeight.Regular,
    color: COLORS.text,
    paddingVertical: r(8),
  },
  attachButton: {
    padding: r(8),
    marginRight: r(5),
  },
  sendButtonContainer: {
    backgroundColor: COLORS.white,
    borderRadius: r(8),
    marginEnd: r(16),
    top: -1,
    padding: 11,
  },
  sendButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  fab: {
    position: "absolute",
    bottom: r(80),
    right: r(24),
    width: 56,
    height: 56,
    borderRadius: r(28),
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: r(12),
    padding: r(20),
    marginHorizontal: r(20),
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: r(8),
  },
  modalMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: r(20),
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: r(12),
    borderRadius: r(8),
    alignItems: "center",
    marginHorizontal: r(5),
  },
  cancelButton: {
    backgroundColor: COLORS.surface,
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "500",
  },
  deleteButton: {
    backgroundColor: COLORS._EB3434,
  },
  deleteButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "500",
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  deleteModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: r(12),
    padding: r(20),
    marginHorizontal: r(20),
    alignItems: "center",
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: r(8),
  },
  deleteModalMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: r(20),
  },
  deleteModalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  deleteModalCancelButton: {
    flex: 1,
    padding: r(12),
    borderRadius: r(8),
    backgroundColor: COLORS.surface,
    marginRight: r(8),
    alignItems: "center",
  },
  deleteModalCancelText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "500",
  },
  deleteModalDeleteButton: {
    flex: 1,
    padding: r(12),
    borderRadius: r(8),
    backgroundColor: COLORS._EB3434,
    marginLeft: r(8),
    alignItems: "center",
  },
  deleteModalDeleteText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "500",
  },
  postMenuDropdown: {
    position: "absolute",
    top: 35,
    right: 0,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingVertical: r(4),
    minWidth: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  postMenuOption: {
    paddingVertical: r(8),
    paddingHorizontal: r(12),
  },
  postMenuOptionText: {
    fontSize: 14,
    color: "#FF3B30",
    fontWeight: "500",
  },
});

const GroupDetails: React.FC<GroupDetailsProps> = ({
  navigation,
  route,
  group: propGroup,
  onClose,
}) => {
  const styles = useResponsive(baseStyles);
  const { user, isAuthenticated } = useAuth();
  const [membersPage, setMembersPage] = useState(1);
  const [postsPage, setPostsPage] = useState(1);
  const [accumulatedPosts, setAccumulatedPosts] = useState<any[]>([]);
  const [accumulatedMembers, setAccumulatedMembers] = useState<any[]>([]);
  const [membersModalVisible, setMembersModalVisible] = useState(false);
  const [isLoadingMoreMembers, setIsLoadingMoreMembers] = useState(false);
  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [memberMenuVisible, setMemberMenuVisible] = useState<string | null>(
    null
  );
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
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [likingPostId, setLikingPostId] = useState<string | null>(null);

  // Get group from props or route
  const passedGroup = propGroup || route?.params?.group;
  const groupId = passedGroup?.id?.toString();

  // Fetch group details
  const {
    data: groupData,
    isLoading: isLoadingGroup,
    refetch: refetchGroup,
  } = useGetGroupByIdQuery(
    { groupId: groupId! },
    { skip: !groupId || !isAuthenticated }
  );
  // Fetch group members
  const {
    data: membersData,
    isLoading: isLoadingMembers,
    isError: isMembersError,
    error: membersError,
    refetch: refetchMembers,
  } = useGetGroupMembersQuery(
    { groupId: groupId!, page: membersPage, limit: 20 },
    { skip: !groupId || !isAuthenticated }
  );
  // Fetch group posts
  const {
    data: postsData,
    isLoading: isLoadingPosts,
    refetch: refetchPosts,
  } = useGetGroupPostsQuery(
    { groupId: groupId!, page: postsPage, limit: 10 },
    { skip: !groupId || !isAuthenticated }
  );
  // Join group mutation
  const [joinGroup, { isLoading: isJoining }] = useJoinGroupMutation();
  const [requestJoinGroup, { isLoading: isRequestingJoin }] =
    useRequestJoinGroupMutation();
  // Delete group mutation
  const [deleteGroup, { isLoading: isDeleting }] = useDeleteGroupMutation();
  // Like mutation
  const [toggleLike, { isLoading: isLiking }] = useToggleLikeMutation();
  const [deletePost, { isLoading: isDeletingPost }] = useDeletePostMutation();
  const [updatePost, { isLoading: isUpdatingPost }] = useUpdatePostMutation();

  // Use real data or fallback
  const group =
    groupData?.status && groupData?.data ? groupData.data : passedGroup;
  const members =
    membersData?.status && membersData?.data?.members
      ? membersData.data.members
      : [];
  const membersPagination =
    membersData?.status && membersData?.data?.pagination
      ? membersData.data.pagination
      : null;
  const displayedMembers =
    accumulatedMembers.length > 0 ? accumulatedMembers : members;

  const membersCountDisplay = useMemo(() => {
    if (group?.memberCount !== undefined && group?.memberCount !== null) {
      const numericCount = Number(group.memberCount);
      if (!Number.isNaN(numericCount)) {
        return numericCount;
      }
    }

    if (accumulatedMembers.length > 0) {
      return accumulatedMembers.length;
    }

    return members.length;
  }, [group?.memberCount, accumulatedMembers, members]);

  const membersErrorDetails = useMemo(() => {
    if (!isMembersError) {
      return { status: null as number | null, message: null as string | null };
    }

    const fetchError = membersError as FetchBaseQueryError | undefined;

    if (
      fetchError &&
      typeof fetchError === "object" &&
      "status" in fetchError
    ) {
      const statusValue = fetchError.status;
      const status = typeof statusValue === "number" ? statusValue : null;

      const data = fetchError.data as { message?: string } | string | undefined;
      if (typeof data === "string") {
        return { status, message: data };
      }

      if (data && typeof data.message === "string") {
        return { status, message: data.message };
      }

      return { status, message: null };
    }

    const serialized = membersError as SerializedError | undefined;
    if (serialized?.message) {
      return { status: null, message: serialized.message };
    }

    return { status: null as number | null, message: null as string | null };
  }, [isMembersError, membersError]);

  const { status: membersErrorStatus, message: membersErrorMessage } =
    membersErrorDetails;

  const membersListEmptyMessage = useMemo(() => {
    const cleanedMessage =
      membersErrorMessage && membersErrorMessage.trim().length > 0
        ? membersErrorMessage.trim()
        : null;

    if (membersErrorStatus === 404) {
      return cleanedMessage || "No members yet. Invite someone to join!";
    }

    if (cleanedMessage) {
      return cleanedMessage;
    }

    if (isMembersError) {
      return "We couldn't load the members list. Pull to refresh and try again.";
    }

    return "No members yet. Invite someone to join!";
  }, [isMembersError, membersErrorMessage, membersErrorStatus]);

  // Exit group handler
  const [leaveGroup, { isLoading: isLeaving }] = useLeaveGroupMutation();
  const handleExitGroup = async () => {
    if (!group?.id) return;
    try {
      await leaveGroup(group.id.toString()).unwrap();
      Toast.success("You have left the group");
      if (typeof onClose === "function") {
        onClose();
      } else if (navigation && typeof navigation.goBack === "function") {
        navigation.goBack();
      }
    } catch (error: any) {
      Toast.error(error?.data?.message || "Failed to leave group");
    }
  };

  const handleOpenMembersModal = () => {
    setMembersModalVisible(true);
    if (accumulatedMembers.length === 0) {
      refetchMembers();
    }
  };

  const handleCloseMembersModal = () => {
    if (isLoadingMoreMembers) return;
    setMembersModalVisible(false);
  };

  const handleLoadMoreMembers = () => {
    if (
      membersPagination &&
      membersPagination.hasNextPage &&
      !isLoadingMoreMembers
    ) {
      setIsLoadingMoreMembers(true);
      setMembersPage((prev) => prev + 1);
    }
  };

  const handleDeleteGroup = async () => {
    if (!group?.id) return;
    try {
      await deleteGroup({ groupId: group.id.toString() }).unwrap();
      Toast.success("Group deleted successfully");
      if (typeof onClose === "function") {
        onClose();
      } else if (navigation && typeof navigation.goBack === "function") {
        navigation.goBack();
      }
    } catch (error: any) {
      Toast.error(error?.data?.message || "Failed to delete group");
    }
  };

  // Check if current user is the creator
  const isCreator =
    user?.id && group?.creatorId && Number(user.id) === Number(group.creatorId);
  // Check if current user is a member (you may need to add this logic based on your data structure)
  const isMember = group?.isMember || isCreator;

  const joinRequestStatus = (group as any)?.joinRequestStatus ?? null;
  const requiresApproval = Boolean(
    group?.privacy && group.privacy !== "Public"
  );

  const joinButtonState = useMemo<
    "manage" | "member" | "pending" | "request" | "join"
  >(() => {
    if (isCreator) return "manage";
    if (isMember) return "member";
    if (joinRequestStatus === "pending") return "pending";
    if (requiresApproval) return "request";
    return "join";
  }, [isCreator, isMember, joinRequestStatus, requiresApproval]);

  const joinButtonLoading =
    joinButtonState === "request" ? isRequestingJoin : isJoining;
  const joinButtonDisabled = joinButtonState === "pending" || joinButtonLoading;

  const joinButtonLabel = useMemo(() => {
    switch (joinButtonState) {
      case "pending":
        return "Request Pending";
      case "request":
        return joinRequestStatus === "rejected"
          ? "Request Again"
          : "Request to Join";
      default:
        return "Join Group";
    }
  }, [joinButtonState, joinRequestStatus]);

  // Handler for viewing a member's profile
  const handleViewProfile = (member: any) => {
    setMemberMenuVisible(null);
    setMembersModalVisible(false);
    navigation?.navigate("UserProfile", {
      userId: member.id?.toString?.() || member.id,
      isGuest: true,
    });
  };

  const renderMemberListItem = ({ item: member }: { item: any }) => {
    const displayName =
      member.displayName || member.userName || member.name || "Unknown";
    const location =
      member.userAddress?.city || member.location || "Unknown location";
    const imageUrl =
      member.imageUrl || member.avatar || member.profilePhoto || null;
    const initial = (
      member.displayName?.charAt(0) ||
      member.userName?.charAt(0) ||
      member.name?.charAt(0) ||
      "U"
    ).toUpperCase();

    return (
      <TouchableOpacity
        style={styles.membersModalItem}
        onPress={() => handleViewProfile(member)}
      >
        <View style={styles.membersModalAvatar}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.membersModalAvatarImage}
            />
          ) : (
            <Text style={styles.membersModalAvatarText}>{initial}</Text>
          )}
        </View>
        <View style={styles.membersModalDetails}>
          <Text style={styles.membersModalName}>{displayName}</Text>
          <Text style={styles.membersModalLocation}>{location}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Post handlers
  const handleLikePost = async (postId: string) => {
    try {
      setLikingPostId(postId);
      await toggleLike({ postId }).unwrap();
      // Posts will auto-refresh due to cache invalidation
    } catch (error) {
      console.error("Failed to toggle like:", error);
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
      Toast.success("Post updated successfully!");
    } catch (error) {
      console.error("Failed to update post:", error);
      Toast.error("Failed to update post. Please try again.");
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
      Toast.error("Failed to delete post.");
      setShowDeletePostDialog(false);
      setPostToDelete(null);
    }
  };

  const cancelDeletePost = () => {
    setShowDeletePostDialog(false);
    setPostToDelete(null);
  };

  // Posts and pagination
  const posts =
    postsData?.status && postsData?.data?.posts ? postsData.data.posts : [];
  const postsPagination =
    postsData?.status && postsData?.data?.pagination
      ? postsData.data.pagination
      : null;

  useEffect(() => {
    if (membersData?.status) {
      if (membersPage === 1) {
        setAccumulatedMembers(members);
      } else {
        setAccumulatedMembers((prevMembers) => {
          const existingIds = new Set(prevMembers.map((m) => m.id));
          const newEntries = members.filter((m: any) => !existingIds.has(m.id));
          return [...prevMembers, ...newEntries];
        });
      }
    } else if (membersPage === 1 && membersData) {
      setAccumulatedMembers([]);
    }
    setIsLoadingMoreMembers(false);
  }, [membersData, members, membersPage]);

  useEffect(() => {
    if (isMembersError) {
      setIsLoadingMoreMembers(false);
      if (membersPage === 1) {
        setAccumulatedMembers([]);
      }
    }
  }, [isMembersError, membersPage]);

  useEffect(() => {
    setMembersPage(1);
    setAccumulatedMembers([]);
  }, [groupId]);

  // Accumulate posts when new data arrives
  useEffect(() => {
    if (postsData && posts.length > 0) {
      if (postsPage === 1) {
        // First page, replace all posts
        setAccumulatedPosts(posts);
      } else {
        // Subsequent pages, append new posts
        setAccumulatedPosts((prevPosts) => {
          // Avoid duplicates by checking post IDs
          const existingIds = new Set(prevPosts.map((p) => p.id));
          const newPosts = posts.filter((p) => !existingIds.has(p.id));
          return [...prevPosts, ...newPosts];
        });
      }
    }
    setIsLoadingMorePosts(false);
  }, [posts, postsPage, postsData]);

  // Handle join group
  const handleJoinGroup = async () => {
    if (!groupId) return;
    try {
      const response = await joinGroup({ groupId }).unwrap();
      if (response.status) {
        Toast.success("Successfully joined the group!");
        refetchGroup();
        refetchMembers();
      } else {
        Toast.error(response.message || "Failed to join group");
      }
    } catch (error: any) {
      Toast.error(error?.data?.message || "Failed to join group");
    }
  };

  const handleRequestJoinGroup = async () => {
    if (!groupId) return;
    try {
      const response = await requestJoinGroup({ groupId }).unwrap();
      if (response.status) {
        Toast.success(response.message || "Join request submitted");
        refetchGroup();
      } else {
        Toast.error(response.message || "Failed to submit join request");
      }
    } catch (error: any) {
      Toast.error(error?.data?.message || "Failed to submit join request");
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    setMembersPage(1);
    setPostsPage(1);
    // Don't clear accumulatedPosts here - let the useEffect handle it when new data arrives
    await Promise.all([refetchGroup(), refetchMembers(), refetchPosts()]);
    setRefreshing(false);
  };

  // Handle load more posts
  const handleLoadMorePosts = () => {
    if (
      postsPagination &&
      postsPagination.currentPage < postsPagination.totalPages &&
      !isLoadingMorePosts
    ) {
      setIsLoadingMorePosts(true);
      setPostsPage(postsPagination.currentPage + 1);
    }
  };

  // Handle scroll for infinite loading
  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - layoutMeasurement.height - contentOffset.y;

    // Load more when within 100 pixels of bottom
    if (
      distanceFromBottom < 100 &&
      !isLoadingMorePosts &&
      accumulatedPosts.length > 0
    ) {
      handleLoadMorePosts();
    }
  };

  const handleContentSizeChange = (
    contentWidth: number,
    contentHeight: number
  ) => {
    setContentHeight(contentHeight);
  };

  const handleLayout = (event: any) => {
    setScrollViewHeight(event.nativeEvent.layout.height);
  };

  // Refresh posts when screen comes back into focus (e.g., after creating a post)
  useFocusEffect(
    React.useCallback(() => {
      // Refresh posts when returning to this screen
      refetchPosts();
    }, [refetchPosts])
  );

  // Render post
  const renderPost = ({ item: post, index }: { item: any; index: number }) => {
    const authorInitial =
      post.user?.displayName?.charAt(0) ||
      post.user?.userName?.charAt(0) ||
      "U";
    return (
      <View key={post.id || index}>
        <View style={styles.postCard}>
          <View style={styles.postHeader}>
            <View style={styles.authorAvatar}>
              <Text style={styles.authorAvatarText}>
                {authorInitial.toUpperCase()}
              </Text>
            </View>
            <View style={styles.postInfo}>
              <Text style={styles.authorName}>
                {post.user?.displayName || post.user?.userName || "Anonymous"}
              </Text>
              <Text style={styles.timeAgo}>
                {post.createdAt
                  ? new Date(post.createdAt).toLocaleDateString()
                  : "Recently"}
              </Text>
            </View>
            {user?.id === post.userId && (
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
                      onPress={() =>
                        handleEditPostPress(
                          post.id.toString(),
                          post.title || ""
                        )
                      }
                      style={styles.postMenuOption}
                    >
                      <Text
                        style={[
                          styles.postMenuOptionText,
                          { color: COLORS.text },
                        ]}
                      >
                        Edit
                      </Text>
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
          <Text style={styles.postContent}>{post.title}</Text>

          {/* Workout Information */}
          {post.workout && (
            <View style={styles.workoutBadge}>
              <Text style={styles.workoutIcon}>💪</Text>
              <View style={styles.workoutInfo}>
                <Text style={styles.workoutTitle}>{post.workout.title}</Text>
                <Text style={styles.workoutDetails}>
                  {post.workout.totalDuration} min • {post.workout.difficulty}
                </Text>
              </View>
            </View>
          )}

          {/* Achievement Information */}
          {post.achievement && (
            <View style={styles.achievementBadge}>
              <Text style={styles.achievementIcon}>
                {post.achievement.icon || "🏆"}
              </Text>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementTitle}>
                  {post.achievement.title}
                </Text>
                <Text style={styles.achievementDescription}>
                  {post.achievement.description}
                </Text>
              </View>
            </View>
          )}

          {post.mediaUrl && (
            <Image
              source={{ uri: post.mediaUrl }}
              style={styles.postImage}
              resizeMode="cover"
            />
          )}

          <View style={styles.postActions}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => handleLikePost(post.id.toString())}
              disabled={likingPostId === post.id.toString()}
            >
              {likingPostId === post.id.toString() ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <Image
                    source={Like}
                    style={[
                      styles.actionIcon,
                      {
                        tintColor: post.isLikedByUser
                          ? COLORS.primary
                          : COLORS._818181,
                      },
                    ]}
                  />
                  <Text style={styles.actionText}>{post.likeCount || 0}</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => handleOpenComments(post.id.toString())}
            >
              <Image source={Comment} style={styles.actionIcon} />
              <Text style={styles.actionText}>{post.commentCount || 0}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (isLoadingGroup) {
    return (
      <SafeAreaView edges={["left", "right"]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.emptyText, { marginTop: r(10) }]}>
            Loading group details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.container}>
      <RefreshableScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onScroll={handleScroll}
        onContentSizeChange={handleContentSizeChange}
        onLayout={handleLayout}
        scrollEventThrottle={16}
      >
        <BasicTopBar
          showBackButton={false}
          containerStyle={styles.heroSection}
          title={group?.name || ""}
          titleStyle={styles.heroTitle}
          endView={
            <TouchableOpacity style={styles.dropdownButton} onPress={onClose}>
              <Ionicons name="chevron-down" size={24} color={COLORS.white} />
            </TouchableOpacity>
          }
          bottomView={
            <View style={styles.heroContent}>
              <View style={styles.heroTags}>
                <View style={styles.locationTag}>
                  <Image source={Location} style={{ width: 20, height: 20 }} />
                  <Text style={styles.tagText}>{group?.location || ""}</Text>
                </View>
                <View style={styles.categoryTag}>
                  <Image source={Gym} style={{ width: 20, height: 20 }} />
                  <Text style={styles.tagText}>
                    {group?.trainingTypes?.join(", ") ||
                      group?.type ||
                      "General"}
                  </Text>
                </View>
              </View>

              <Text style={styles.heroDescription}>
                {group?.description || ""}
              </Text>
            </View>
          }
        />

        {/* Action Button - Manage Group or Join Group */}
        {joinButtonState === "manage" ? (
          <Pressable
            style={styles.manageButton}
            onPress={() => {
              onClose?.();
              navigation?.navigate("ManageGroup", { group, isEditing: true });
            }}
          >
            <Image source={Edit} style={{ width: 16, height: 16 }} />
            <Text style={styles.manageButtonText}>Manage Group</Text>
          </Pressable>
        ) : joinButtonState === "member" ? (
          <Pressable
            style={[
              styles.manageButton,
              {
                backgroundColor: COLORS.white,
                borderColor: COLORS._EB3434,
                borderWidth: 1,
                marginTop: 10,
              },
            ]}
            onPress={handleExitGroup}
          >
            <Image
              source={require("../../../assets/exit.png")}
              style={{ width: 16, height: 16, tintColor: COLORS._EB3434 }}
            />
            <Text style={[styles.manageButtonText, { color: COLORS._EB3434 }]}>
              Exit Group
            </Text>
          </Pressable>
        ) : (
          <Pressable
            style={[
              styles.manageButton,
              styles.joinButton,
              joinButtonDisabled && styles.joinButtonDisabled,
            ]}
            onPress={
              joinButtonState === "join"
                ? handleJoinGroup
                : joinButtonState === "request"
                ? handleRequestJoinGroup
                : undefined
            }
            disabled={joinButtonDisabled}
          >
            {joinButtonLoading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Image
                  source={Add}
                  style={{
                    width: 16,
                    height: 16,
                    tintColor: COLORS.white,
                  }}
                />
                <Text style={[styles.manageButtonText, styles.joinButtonText]}>
                  {joinButtonLabel}
                </Text>
              </>
            )}
          </Pressable>
        )}

        {/* Members Section */}
        <View style={styles.membersCard}>
          <View style={styles.membersHeader}>
            <Text style={styles.membersTitle}>Members</Text>
            <Text style={styles.membersCount}>
              {membersCountDisplay} Members
            </Text>
          </View>

          <View style={styles.avatarsContainer}>
            {displayedMembers.slice(0, 3).map((member, index) => (
              <Menu
                key={member.id || index}
                visible={
                  memberMenuVisible === (member.id?.toString?.() || member.id)
                }
                onDismiss={() => setMemberMenuVisible(null)}
                anchor={
                  <TouchableOpacity
                    style={[
                      styles.memberAvatar,
                      { backgroundColor: COLORS.primary },
                      index > 0 && { marginLeft: -12 },
                    ]}
                    onPress={() =>
                      setMemberMenuVisible(member.id?.toString?.() || member.id)
                    }
                  >
                    <Text style={styles.memberAvatarText}>
                      {(
                        member.displayName?.charAt(0) ||
                        member.userName?.charAt(0) ||
                        "U"
                      ).toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                }
                contentStyle={{ minWidth: 140 }}
              >
                <Menu.Item
                  onPress={() => handleViewProfile(member)}
                  title="View Profile"
                />
              </Menu>
            ))}
            {membersCountDisplay > 3 && (
              <View
                style={[
                  styles.memberAvatar,
                  styles.memberCountAvatar,
                  { marginLeft: -12 },
                ]}
              >
                <Text style={styles.memberCountText}>
                  +{Math.max(membersCountDisplay - 3, 0)}
                </Text>
              </View>
            )}
          </View>
          {membersCountDisplay === 0 ? (
            <Text style={styles.membersEmptyCardText}>
              {membersListEmptyMessage}
            </Text>
          ) : (
            <TouchableOpacity onPress={handleOpenMembersModal}>
              <Text style={styles.viewListText}>View list</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Recent Posts Section */}
        <View style={styles.postsSection}>
          <Divider
            style={{
              backgroundColor: COLORS._E2E2E2,
              height: 1,
              marginBottom: 10,
              marginHorizontal: r(16),
            }}
          />
          <Text style={styles.postsTitle}>Recent Posts</Text>

          {isLoadingPosts && postsPage === 1 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : accumulatedPosts.length === 0 ? (
            <View style={styles.emptyPostsContainer}>
              <Text style={styles.emptyText}>
                No posts yet. Be the first to post!
              </Text>
            </View>
          ) : (
            <>
              {accumulatedPosts.map((post, index) => (
                <View key={post.id || index}>
                  {renderPost({ item: post, index })}
                </View>
              ))}
              {isLoadingMorePosts && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                </View>
              )}
            </>
          )}
        </View>
      </RefreshableScrollView>

      <Modal
        visible={membersModalVisible}
        animationType="slide"
        transparent
        onRequestClose={handleCloseMembersModal}
      >
        <View style={styles.membersModalOverlay}>
          <View style={styles.membersModalContent}>
            <View style={styles.membersModalHeader}>
              <Text style={styles.membersModalTitle}>Group Members</Text>
              <TouchableOpacity
                style={styles.membersModalCloseButton}
                onPress={handleCloseMembersModal}
                disabled={isLoadingMoreMembers}
              >
                <Ionicons name="close" size={20} color={COLORS._5E5E5E} />
              </TouchableOpacity>
            </View>
            <Text style={styles.membersModalSubtitle}>
              {membersCountDisplay} Members
            </Text>
            <FlatList
              data={accumulatedMembers}
              keyExtractor={(member, index) =>
                member?.id?.toString?.() || `member-${index}`
              }
              renderItem={renderMemberListItem}
              contentContainerStyle={styles.membersModalList}
              showsVerticalScrollIndicator={false}
              onEndReached={handleLoadMoreMembers}
              onEndReachedThreshold={0.2}
              ListEmptyComponent={
                isLoadingMembers ? (
                  <View style={styles.membersModalEmptyContainer}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  </View>
                ) : (
                  <View style={styles.membersModalEmptyContainer}>
                    <Text style={styles.membersModalEmptyText}>
                      {membersListEmptyMessage}
                    </Text>
                  </View>
                )
              }
              ListFooterComponent={
                isLoadingMoreMembers ? (
                  <View style={styles.membersModalFooter}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  </View>
                ) : null
              }
            />
            <TouchableOpacity
              style={styles.membersModalCloseButtonFull}
              onPress={handleCloseMembersModal}
              disabled={isLoadingMoreMembers}
            >
              <Text style={styles.membersModalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {isMember && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            onClose?.();
            navigation?.navigate("CreatePost", { groupId: group?.id });
          }}
        >
          <Image source={Add} style={{ width: 20, height: 20 }} />
        </TouchableOpacity>
      )}

      {/* Comments Modal */}
      {selectedPostId && (
        <CommentsModal
          visible={commentsModalVisible}
          postId={selectedPostId}
          onClose={handleCloseComments}
        />
      )}

      {/* Delete Post Confirmation Dialog */}
      <Modal
        visible={showDeletePostDialog}
        animationType="fade"
        transparent={true}
        onRequestClose={cancelDeletePost}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Post</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete this post? This action cannot be
              undone.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={cancelDeletePost}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={confirmDeletePost}
                disabled={isDeletingPost}
              >
                {isDeletingPost ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Post Modal */}
      <EditPostModal
        visible={editingPost !== null}
        onClose={handleCancelEditPost}
        onSave={handleSaveEditPost}
        editText={editPostText}
        onChangeText={setEditPostText}
        isUpdating={isUpdatingPost}
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
      <Modal
        visible={showDeletePostDialog}
        animationType="fade"
        transparent={true}
        onRequestClose={cancelDeletePost}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <Text style={styles.deleteModalTitle}>Delete Post</Text>
            <Text style={styles.deleteModalMessage}>
              Are you sure you want to delete this post? This action cannot be
              undone.
            </Text>
            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={styles.deleteModalCancelButton}
                onPress={cancelDeletePost}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteModalDeleteButton}
                onPress={confirmDeletePost}
                disabled={isDeletingPost}
              >
                {isDeletingPost ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.deleteModalDeleteText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default GroupDetails;
