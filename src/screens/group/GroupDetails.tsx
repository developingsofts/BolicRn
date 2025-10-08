import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  FlatList,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
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
import { useGetGroupByIdQuery, useGetGroupMembersQuery, useGetGroupPostsQuery } from "../../services/api/groupsApi";

interface GroupDetailsProps {
  // Make navigation optional for modal usage
  navigation?: any;
  // Make route optional for modal usage

  route?: {
    params: {
      group: Group;
    };
  };

  // Add direct props for modal usage
  group?: Group | null;
  onClose?: () => void;
}

const GroupDetails: React.FC<GroupDetailsProps> = ({
  navigation,
  route,
  group: propGroup,
  onClose,
}) => {
  const styles = useResponsive(baseStyles);
  const [showManageGroup, setManageGroup] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [membersPage, setMembersPage] = useState(1);
  const [postsPage, setPostsPage] = useState(1);

  // Get group from props or route
  const passedGroup = propGroup || route?.params?.group;
  const groupId = passedGroup?.id?.toString();

  // Fetch group details
  const { data: groupData, isLoading: isLoadingGroup } = useGetGroupByIdQuery(
    { groupId: groupId! },
    { skip: !groupId }
  );
  
  // Fetch group members
  const { data: membersData, isLoading: isLoadingMembers } = useGetGroupMembersQuery(
    { groupId: groupId!, page: membersPage, limit: 20 },
    { skip: !groupId }
  );
  
  // Fetch group posts
  const { data: postsData, isLoading: isLoadingPosts } = useGetGroupPostsQuery(
    { groupId: groupId!, page: postsPage, limit: 10 },
    { skip: !groupId }
  );

  // Use real data or fallback
  const group = (groupData?.status && groupData?.data) ? groupData.data : passedGroup;
  const members = (membersData?.status && membersData?.data?.members) ? membersData.data.members : [];
  const posts = (postsData?.status && postsData?.data?.posts) ? postsData.data.posts : [];
  const postsPagination = (postsData?.status && postsData?.data?.pagination) ? postsData.data.pagination : null;

  if (!group) {
    return (
      <SafeAreaView edges={["left", "right"]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>Group not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleLoadMorePosts = () => {
    if (postsPagination && postsPagination.currentPage < postsPagination.totalPages) {
      setPostsPage(postsPagination.currentPage + 1);
    }
  };

  const renderMemberAvatar = (member: any, index: number) => {
    const initial = member.displayName?.charAt(0) || member.userName?.charAt(0) || 'U';
    return (
      <View
        key={member.id || index}
        style={[styles.memberAvatar, { backgroundColor: COLORS.primary }]}
      >
        <Text style={styles.memberAvatarText}>{initial.toUpperCase()}</Text>
      </View>
    );
  };

  const renderPost = ({ item: post, index }: { item: any; index: number }) => {
    const authorInitial = post.userDisplayName?.charAt(0) || post.User?.displayName?.charAt(0) || 'U';
    
    return (
      <View key={post.id || index}>
        <View style={styles.postCard}>
          <View style={styles.postHeader}>
            <View style={styles.authorAvatar}>
              <Text style={styles.authorAvatarText}>{authorInitial.toUpperCase()}</Text>
            </View>
            <View style={styles.postInfo}>
              <Text style={styles.authorName}>
                {post.userDisplayName || post.User?.displayName || post.User?.userName || 'Anonymous'}
              </Text>
              <Text style={styles.timeAgo}>
                {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Recently'}
              </Text>
            </View>
          </View>

          <Text style={styles.postContent}>{post.content || ''}</Text>

          <View style={styles.postActions}>
            <View style={styles.actionItem}>
              <Image source={Like} style={{ width: 20, height: 20 }} />
              <Text style={styles.actionText}>{post.likes || 0}</Text>
            </View>
            <View style={styles.actionItem}>
              <Image source={Comment} style={{ width: 20, height: 20 }} />
              <Text style={styles.actionText}>{post.comments || 0}</Text>
            </View>
          </View>
        </View>

        <View style={styles.messageRowContainer}>
          <View style={styles.messageInputContainer}>
            <TextInput
              style={styles.messageInput}
              placeholder="Type a message..."
              placeholderTextColor={COLORS._5E5E5E}
            />
            <TouchableOpacity style={styles.attachButton}>
              <Image source={ImageFile} style={{ width: 20, height: 20 }} />
            </TouchableOpacity>
          </View>
          <View style={styles.sendButtonContainer}>
            <TouchableOpacity style={styles.sendButton}>
              <Image source={Send} style={{ width: 20, height: 20 }} />
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
          <Text style={[styles.emptyText, { marginTop: r(10) }]}>Loading group details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <BasicTopBar
          showBackButton={false}
          containerStyle={styles.heroSection}
          title={group.name}
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
                  <Text style={styles.tagText}>{group.location}</Text>
                </View>
                <View style={styles.categoryTag}>
                  <Image source={Gym} style={{ width: 20, height: 20 }} />
                  <Text style={styles.tagText}>
                    {group.trainingTypes?.join(", ") || group.type || "General"}
                  </Text>
                </View>
              </View>

              <Text style={styles.heroDescription}>{group.description}</Text>

              <Text style={styles.heroSubtitle}>
                Lorem ipsum dolor sit amet consectetur. Hac at adipiscing odio
                pretium a posuere pharetra vitae nisi.
              </Text>
            </View>
          }
        />
        
        {/* Manage Group Button - Overlapping */}
        <Pressable
          style={styles.manageButton}
          onPress={() => {
            onClose?.();
            navigation?.navigate("ManageGroup", { group });
          }}
        >
          <Image source={Edit} style={{ width: 16, height: 16 }} />
          <Text style={styles.manageButtonText}>Manage Group</Text>
        </Pressable>

        {/* Members Section */}
        <View style={styles.membersCard}>
          <View style={styles.membersHeader}>
            <Text style={styles.membersTitle}>Members</Text>
            <Text style={styles.membersCount}>{group.memberCount || 0} Members</Text>
          </View>

          <View style={styles.membersContent}>
            <View style={styles.avatarsContainer}>
              {members.slice(0, 3).map((member, index) => (
                <View
                  key={member.id || index}
                  style={[
                    styles.memberAvatar,
                    { backgroundColor: COLORS.primary },
                    index > 0 && { marginLeft: -12 },
                  ]}
                >
                  <Text style={styles.memberAvatarText}>
                    {(member.displayName?.charAt(0) || member.userName?.charAt(0) || 'U').toUpperCase()}
                  </Text>
                </View>
              ))}
              {group.memberCount && group.memberCount > 3 && (
                <View
                  style={[
                    styles.memberAvatar,
                    styles.memberCountAvatar,
                    { marginLeft: -12 },
                  ]}
                >
                  <Text style={styles.memberCountText}>
                    +{group.memberCount - 3}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity>
              <Text style={styles.viewListText}>View list</Text>
            </TouchableOpacity>
          </View>
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
          ) : posts.length === 0 ? (
            <View style={styles.emptyPostsContainer}>
              <Text style={styles.emptyText}>No posts yet. Be the first to post!</Text>
            </View>
          ) : (
            <>
              <FlatList
                data={posts}
                renderItem={renderPost}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
              />
              
              {postsPagination && postsPagination.currentPage < postsPagination.totalPages && (
                <TouchableOpacity 
                  style={styles.loadMoreButton}
                  onPress={handleLoadMorePosts}
                  disabled={isLoadingPosts}
                >
                  {isLoadingPosts ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <Text style={styles.loadMoreText}>Load More Posts</Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab}>
        <Image source={Add} style={{ width: 16, height: 16 }} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const baseStyles = StyleSheet.create({
  loadingContainer: {
    padding: r(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: r(14),
    color: COLORS._5E5E5E,
    textAlign: 'center',
  },
  emptyPostsContainer: {
    padding: r(30),
    alignItems: 'center',
  },
  loadMoreButton: {
    padding: r(15),
    alignItems: 'center',
    marginTop: r(10),
    marginBottom: r(20),
  },
  loadMoreText: {
    fontSize: r(14),
    color: COLORS.primary,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
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
    marginBottom: r(10),
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
  postsSection: {
    paddingBottom: r(100),
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
  postContent: {
    fontSize: 14,
    color: COLORS.app_black,
    fontFamily: FontWeight.Regular,
    lineHeight: 20,
    marginBottom: r(5),
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
    bottom: r(45),
    right: r(24),
    width: 50,
    height: 50,
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
});
export default GroupDetails;
