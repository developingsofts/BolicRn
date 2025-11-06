import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Menu, Button, Divider } from "react-native-paper";
import { COLORS, DIMENSIONS } from "../../config/constants";
import { r } from "../../designing/responsiveDesigns";
import FontWeight from "../../hooks/useInterFonts";
import { Group } from "../../types";
import { Location, Gym, Close, Trash, Exit, Add } from "../../../assets";
import BasicTopBar from "../../components/BasicTopBar";
import { useCreateGroupMutation, useUpdateGroupMutation, useDeleteGroupMutation, useGetGroupMembersQuery, useGetGroupJoinRequestsQuery, useRespondToJoinRequestMutation } from '../../services/api/groupsApi';
import { Toast } from '../../components/ToastManager';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmDialog from "../../components/ConfirmDialog";

interface ManageGroupProps {
  navigation: any;
  route?: {
    params?: {
      group?: Group;
      isEditing?: boolean;
    };
  };
  group?: Group | null;
  onClose?: () => void;
}

interface Member {
  id: string;
  name: string;
  location: string;
  avatar: string;
}

const MemberAvatar = ({ member, styles }: { member: any; styles: any }) => {
  const [imageError, setImageError] = React.useState(false);
  const imageUrl = member.imageUrl || member.avatar || member.profilePhoto || null;
  const initial = (member.displayName?.charAt(0)
    || member.userName?.charAt(0)
    || member.name?.charAt(0)
    || 'U').toUpperCase();
  return (
    <View style={styles.memberAvatar}>
      {imageUrl && !imageError ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.memberAvatarImage}
          onError={() => setImageError(true)}
        />
      ) : (
        <Text style={styles.memberAvatarText}>{initial}</Text>
      )}
    </View>
  );
};

const ManageGroup: React.FC<ManageGroupProps> = ({
  navigation,
  route,
  group: propGroup,
  onClose,
}) => {
  const { isAuthenticated, user } = useAuth();
  const isEditing = route?.params?.isEditing ?? (propGroup ? true : false);
  const group = route?.params?.group || propGroup;
  const isCreator = user?.id && group?.creatorId && Number(user.id) === Number(group.creatorId);

  const [groupName, setGroupName] = useState(isEditing && group ? group.name : "");
  const [groupDescription, setGroupDescription] = useState(
    isEditing && group ? group.description : ""
  );
  const [location, setLocation] = useState(
    isEditing && group ? group.location : "Downtown"
  );
  const [groupType, setGroupType] = useState(
    isEditing && group ? (group.type || "Gym") : "Gym"
  );
  const [privacy, setPrivacy] = useState(
    isEditing && group ? (group.privacy || "Public") : "Public"
  );
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);

  const [locationMenuVisible, setLocationMenuVisible] = useState(false);
  const [groupTypeMenuVisible, setGroupTypeMenuVisible] = useState(false);
  const [privacyMenuVisible, setPrivacyMenuVisible] = useState(false);
  const [memberMenuVisible, setMemberMenuVisible] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [removeDialogVisible, setRemoveDialogVisible] = useState(false);
  const [memberPendingRemoval, setMemberPendingRemoval] = useState<any | null>(null);
  const [respondingRequestId, setRespondingRequestId] = useState<string | null>(null);
  const pendingRemovalName = memberPendingRemoval
    ? memberPendingRemoval.displayName || memberPendingRemoval.userName || memberPendingRemoval.name || "this user"
    : "this user";

  // API mutations
  const [createGroup, { isLoading: isCreating }] = useCreateGroupMutation();
  const [updateGroup, { isLoading: isUpdating }] = useUpdateGroupMutation();
  const [deleteGroup, { isLoading: isDeleting }] = useDeleteGroupMutation();
  
  // Fetch group members when editing
  const { data: membersData, isLoading: isLoadingMembers, refetch: refetchMembers } = useGetGroupMembersQuery(
    { groupId: group?.id?.toString() || '', page: 1, limit: 50 },
    { skip: !isEditing || !group?.id || !isAuthenticated }
  );
  const { data: joinRequestsData, isLoading: isLoadingJoinRequests, refetch: refetchJoinRequests } = useGetGroupJoinRequestsQuery(
    { groupId: group?.id?.toString() || '' },
    { skip: !isEditing || !group?.id || !isAuthenticated || !isCreator }
  );
  const [respondToJoinRequest] = useRespondToJoinRequestMutation();

  const members = (membersData?.status && membersData?.data?.members) ? membersData.data.members : [];
  const joinRequests = (joinRequestsData?.status && Array.isArray(joinRequestsData?.data)) ? joinRequestsData.data : [];

  const locationOptions = ["Downtown", "Uptown", "Midtown", "Suburbs"];
  const groupTypeOptions = ["Gym", "Running", "Cycling", "Swimming", "Yoga"];
  const privacyOptions = ["Public", "Private", "Invite Only"];

  const handleSave = async () => {
    if (!groupName.trim()) {
      Alert.alert("Error", "Please enter a group name");
      return;
    }

    if (!groupDescription.trim()) {
      Alert.alert("Error", "Please enter a group description");
      return;
    }

    try {
      if (isEditing && group) {
        // Update existing group
        await updateGroup({
          groupId: group.id.toString(),
          name: groupName.trim(),
          description: groupDescription.trim(),
          type: groupType,
          location: location,
          privacy: privacy,
        }).unwrap();

        Toast.success('Group updated successfully!');
      } else {
        // Create new group
        await createGroup({
          name: groupName.trim(),
          description: groupDescription.trim(),
          type: groupType,
          location: location,
          privacy: privacy,
          memberIds: selectedMemberIds,
        }).unwrap();

        Toast.success('Group created successfully!');
      }

      // Navigate back or close modal
      if (onClose) {
        onClose();
      } else {
        navigation.goBack();
      }
    } catch (error: any) {
      Toast.error(error?.data?.message || 'Failed to save group');
    }
  };

  const handleDeleteGroup = async () => {
    Alert.alert(
      "Delete Group",
      "Are you sure you want to delete this group? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!group) return;
            
            try {
              await deleteGroup({ groupId: group.id.toString() }).unwrap();
              Toast.success('Group deleted successfully');
              
              if (onClose) {
                onClose();
              } else {
                navigation.goBack();
              }
            } catch (error: any) {
              Toast.error(error?.data?.message || 'Failed to delete group');
            }
          },
        },
      ]
    );
  };

  const handleExitGroup = () => {
    Alert.alert("Exit Group", "Are you sure you want to exit this group?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Exit",
        style: "destructive",
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  const handleRemoveMember = (member: any) => {
    if (!group?.id) {
      Toast.error('Group not found');
      return;
    }

    const memberId = member.id?.toString?.() || String(member.id);
    const isSelf = user?.id && Number(user.id) === Number(member.id);

    if (isSelf) {
      Toast.error('You cannot remove yourself from your group');
      return;
    }

    setMemberPendingRemoval(member);
    setRemoveDialogVisible(true);
  };

  const confirmRemoveMember = async () => {
    if (!group?.id || !memberPendingRemoval || removingMemberId) {
      return;
    }

    const memberId = memberPendingRemoval.id?.toString?.() || String(memberPendingRemoval.id);
    const memberIdNumber = Number(memberId);
    if (!Number.isFinite(memberIdNumber)) {
      Toast.error('Invalid member selected');
      return;
    }

    try {
      setRemovingMemberId(memberId);
      await updateGroup({
        groupId: group.id.toString(),
        removeIds: [memberIdNumber],
      }).unwrap();
      Toast.success('Member removed successfully');
      await refetchMembers();
    } catch (error: any) {
      Toast.error(error?.data?.message || 'Failed to remove member');
    } finally {
      setRemovingMemberId(null);
      setRemoveDialogVisible(false);
      setMemberPendingRemoval(null);
    }
  };

  const cancelRemoveMember = () => {
    if (removingMemberId) return;
    setRemoveDialogVisible(false);
    setMemberPendingRemoval(null);
  };

  const handleMemberAction = (member: any, action: string) => {
    setMemberMenuVisible(null);
    if (action === "remove") {
      handleRemoveMember(member);
    } else if (action === "profile") {
      const memberId = member.id?.toString?.() || String(member.id);
      const isSelf = user?.id && Number(user.id) === Number(member.id);

      if (isSelf) {
        if (onClose) {
          onClose();
        }
        navigation?.navigate?.('Profile');
        return;
      }

      if (memberId) {
        navigation.navigate('UserProfile', { userId: memberId, isGuest: true });
      } else {
        Toast.error('User not found');
      }
    }
  };

  const renderMember = ({ item: member }: { item: any }) => {
    const displayName = member.displayName || member.userName || member.name || 'Unknown';
    const location = member.userAddress?.city || member.location || 'Unknown location';
    const memberId = member.id?.toString?.() || String(member.id);
    const isSelf = user?.id && Number(user.id) === Number(member.id);
    return (
      <View style={styles.memberItem}>
        <View style={styles.memberInfo}>
          <MemberAvatar member={member} styles={styles} />
          <View style={styles.memberDetails}>
            <Text style={styles.memberName}>{displayName}</Text>
            <Text style={styles.memberLocation}>{location}</Text>
          </View>
        </View>
        <Menu
          visible={memberMenuVisible === memberId}
          contentStyle={{ backgroundColor: COLORS.white }}
          onDismiss={() => setMemberMenuVisible(null)}
          anchor={
            <TouchableOpacity
              style={styles.memberActions}
              onPress={() => setMemberMenuVisible(memberId)}
            >
              <Ionicons name="ellipsis-vertical" size={20} color={COLORS.text} />
            </TouchableOpacity>
          }
        >
          <Menu.Item
            onPress={() => handleMemberAction(member, "profile")}
            titleStyle={{ color: COLORS.app_black }}
            title="View Profile"
          />
          {!isSelf && (
            <Menu.Item
              onPress={() => handleMemberAction(member, "remove")}
              title="Remove User"
              disabled={removingMemberId === memberId}
              titleStyle={{
                color: COLORS._EB3434,
                opacity: removingMemberId === memberId ? 0.5 : 1,
              }}
            />
          )}
        </Menu>
      </View>
    );
  };

  const handleRespondToRequest = async (requestId: string, action: "approve" | "reject") => {
    if (!group?.id || respondingRequestId) return;

    try {
      setRespondingRequestId(requestId);
      const response = await respondToJoinRequest({ requestId, action }).unwrap();
      Toast.success(response?.message || `Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      await Promise.all([refetchJoinRequests(), refetchMembers()]);
    } catch (error: any) {
      Toast.error(error?.data?.message || `Failed to ${action} request`);
    } finally {
      setRespondingRequestId(null);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.container}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: r(100) }}
      >
        <BasicTopBar
          showBackButton={false}
          containerStyle={styles.heroSection}
          title={isEditing ? "Manage Group" : "Add Group"}
          titleStyle={styles.heroTitle}
          endView={
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
            >
              <Image
                source={Close}
                style={{ width: 24, height: 24 }}
                tintColor={COLORS.white}
              />
            </TouchableOpacity>
          }
          bottomView={
            <View style={styles.heroTags}>
              <View style={styles.locationTag}>
                <Image source={Location} style={{ width: 16, height: 16 }} />
                <Text style={styles.tagText}>{location}</Text>
              </View>
              <View style={styles.categoryTag}>
                <Image source={Gym} style={{ width: 16, height: 16 }} />
                <Text style={styles.tagText}>{groupType}</Text>
              </View>
            </View>
          }
        />

        <View style={styles.heroHeader}>
          {/* Group Info Card */}
          <View style={styles.groupInfoCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.textInput}
                value={groupName}
                onChangeText={setGroupName}
                placeholder="Development User"
                placeholderTextColor={COLORS._5E5E5E}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={groupDescription}
                onChangeText={setGroupDescription}
                placeholder="24/7 gym with all equipment"
                placeholderTextColor={COLORS._5E5E5E}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.dropdownRow}>
              <View style={styles.dropdownItem}>
                <Text style={styles.inputLabel}>Change Location</Text>
                <Menu
                  visible={locationMenuVisible}
                  contentStyle={{
                    backgroundColor: COLORS.white,
                    width: "100%",
                  }}
                  style={{ width: "40%" }}
                  onDismiss={() => setLocationMenuVisible(false)}
                  anchorPosition="bottom"
                  anchor={
                    <TouchableOpacity
                      style={styles.dropdown}
                      onPress={() => setLocationMenuVisible(true)}
                    >
                      <Text style={styles.dropdownText}>
                        {location ? location : "Select Location"}
                      </Text>
                      <Ionicons
                        name="chevron-down"
                        size={16}
                        color={COLORS.primary}
                      />
                    </TouchableOpacity>
                  }
                >
                  {locationOptions.map((option) => (
                    <Menu.Item
                      key={option}
                      style={{ width: "100%" }}
                      titleStyle={{ color: COLORS.gradient1 }}
                      onPress={() => {
                        setLocation(option);
                        setLocationMenuVisible(false);
                      }}
                      title={option}
                    />
                  ))}
                </Menu>
              </View>

              <View style={styles.dropdownItem}>
                <Text style={styles.inputLabel}>Group Type</Text>
                <Menu
                  visible={groupTypeMenuVisible}
                  contentStyle={{
                    backgroundColor: COLORS.white,
                    width: "100%",
                  }}
                  style={{ width: "40%" }}
                  onDismiss={() => setGroupTypeMenuVisible(false)}
                  anchorPosition="bottom"
                  anchor={
                    <TouchableOpacity
                      style={styles.dropdown}
                      onPress={() => setGroupTypeMenuVisible(true)}
                    >
                      <Text style={styles.dropdownText}>
                        {groupType ? groupType : "Select Group Type"}
                      </Text>
                      <Ionicons
                        name="chevron-down"
                        size={16}
                        color={COLORS.primary}
                      />
                    </TouchableOpacity>
                  }
                >
                  {groupTypeOptions.map((option) => (
                    <Menu.Item
                      key={option}
                      titleStyle={{ color: COLORS.gradient1 }}
                      onPress={() => {
                        setGroupType(option);
                        setGroupTypeMenuVisible(false);
                      }}
                      title={option}
                    />
                  ))}
                </Menu>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.inputGroup,
              {
                backgroundColor: COLORS.white,
                marginTop: r(15),
                padding: r(16),
                borderRadius: r(8),
              },
            ]}
          >
            <Text style={styles.inputLabel}>Group Privacy</Text>
            <Menu
              visible={privacyMenuVisible}
              anchorPosition="bottom"
              contentStyle={{ backgroundColor: COLORS.white, width: "100%" }}
              style={{ width: "82.5%" }}
              onDismiss={() => setPrivacyMenuVisible(false)}
              anchor={
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setPrivacyMenuVisible(true)}
                >
                  <Text style={styles.dropdownText}>
                    {privacy ? privacy : "Select Privacy"}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
              }
            >
              {privacyOptions.map((option) => (
                <Menu.Item
                  key={option}
                  titleStyle={{ color: COLORS.gradient1 }}
                  onPress={() => {
                    setPrivacy(option);
                    setPrivacyMenuVisible(false);
                  }}
                  title={option}
                />
              ))}
            </Menu>
          </View>
          {/* Members Section - Only show when editing */}
          {isEditing && (
            <View style={styles.groupInfoCard}>
              <View style={styles.membersHeader}>
                <Text style={styles.membersTitle}>Members</Text>
                <Text style={styles.membersCount}>
                  {group?.memberCount || members.length || 0} Members
                </Text>
              </View>

              {isLoadingMembers ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.loadingText}>Loading members...</Text>
                </View>
              ) : members.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No members in this group yet</Text>
                </View>
              ) : (
                <FlatList
                  data={members}
                  renderItem={renderMember}
                  keyExtractor={(item) => item.id.toString()}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => (
                    <View style={styles.memberSeparator} />
                  )}
                />
              )}
            </View>
          )}

          {isEditing && isCreator && (
            <View style={styles.groupInfoCard}>
              <View style={styles.membersHeader}>
                <Text style={styles.membersTitle}>Join Requests</Text>
                {isLoadingJoinRequests ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Text style={styles.membersCount}>
                    {joinRequests.length} Pending
                  </Text>
                )}
              </View>

              {isLoadingJoinRequests ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.loadingText}>Loading join requests...</Text>
                </View>
              ) : joinRequests.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No pending requests right now</Text>
                </View>
              ) : (
                <FlatList
                  data={joinRequests}
                  scrollEnabled={false}
                  keyExtractor={(item: any) => item.id?.toString?.() || String(item.id)}
                  ItemSeparatorComponent={() => <View style={styles.memberSeparator} />}
                  renderItem={({ item }) => {
                    const requestUser = item.user || {};
                    const displayName = requestUser.displayName || requestUser.userName || 'Unknown';
                    const location = requestUser.userAddress?.city || requestUser.location || 'Unknown location';
                    const avatar = requestUser.imageUrl;
                    const requestId = item.id?.toString?.() || String(item.id);
                    const isProcessing = respondingRequestId === requestId;

                    return (
                      <View style={styles.requestItem}>
                        <View style={styles.memberInfo}>
                          <View style={styles.memberAvatar}>
                            {avatar ? (
                              <Image source={{ uri: avatar }} style={styles.memberAvatarImage} />
                            ) : (
                              <Text style={styles.memberAvatarText}>
                                {(displayName.charAt(0) || 'U').toUpperCase()}
                              </Text>
                            )}
                          </View>
                          <View style={styles.memberDetails}>
                            <Text style={styles.memberName}>{displayName}</Text>
                            <Text style={styles.memberLocation}>{location}</Text>
                          </View>
                        </View>
                        <View style={styles.requestActions}>
                          <TouchableOpacity
                            style={[styles.requestButton, styles.approveButton]}
                            onPress={() => handleRespondToRequest(requestId, 'approve')}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <ActivityIndicator size="small" color={COLORS.white} />
                            ) : (
                              <Text style={styles.requestButtonText}>Approve</Text>
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.requestButton, styles.rejectButton]}
                            onPress={() => handleRespondToRequest(requestId, 'reject')}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <ActivityIndicator size="small" color={COLORS.white} />
                            ) : (
                              <Text style={styles.requestButtonText}>Reject</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  }}
                />
              )}
            </View>
          )}

          {/* Action Buttons */}
          {isEditing ? (
            <>
              <TouchableOpacity
                style={[styles.deleteButton, isDeleting && styles.buttonDisabled]}
                onPress={handleDeleteGroup}
                disabled={isDeleting || isUpdating}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color={COLORS.error} />
                ) : (
                  <>
                    <Image source={Trash} style={{ width: 20, height: 20 }} />
                    <Text style={styles.deleteButtonText}>Delete Group</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteButton, isUpdating && styles.buttonDisabled]}
                onPress={handleExitGroup}
                disabled={isDeleting || isUpdating}
              >
                <Image source={Exit} style={{ width: 20, height: 20 }} />
                <Text style={styles.deleteButtonText}>Exit Group</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.createButton, isUpdating && styles.buttonDisabled]} 
                onPress={handleSave}
                disabled={isDeleting || isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.createButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={[styles.createButton, isCreating && styles.buttonDisabled]} 
              onPress={handleSave}
              disabled={isCreating}
            >
              {isCreating ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.createButtonText}>Create Group</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      <ConfirmDialog
        visible={removeDialogVisible}
        onClose={cancelRemoveMember}
        onConfirm={confirmRemoveMember}
        title="Remove member"
        description={`Are you sure you want to remove ${pendingRemovalName} from this group?`}
        confirmText="Remove"
        cancelText="Cancel"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  heroSection: {
    paddingTop: DIMENSIONS.spacing.xxl,
    paddingBottom: r(74),
    minHeight: r(180),
  },
  heroHeader: {
    marginTop: r(-90),
    paddingHorizontal: r(16),
    paddingTop: r(16),
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.white,
  },
  closeButton: {
    padding: r(8),
  },
  heroTags: {
    flexDirection: "row",
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
    color: COLORS.gradient1,
    marginLeft: r(4),
  },
  content: {
    flex: 1,
  },
  groupInfoCard: {
    backgroundColor: "white",
    borderRadius: r(12),
    padding: r(16),
    marginTop: r(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: r(10),
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: FontWeight.Medium,
    color: COLORS.gradient1,
    marginBottom: r(4),
  },
  textInput: {
    borderRadius: r(8),
    padding: r(12),
    fontSize: 16,
    color: COLORS.gradient1,
    backgroundColor: COLORS.background,
  },
  textArea: {
    height: r(80),
    textAlignVertical: "top",
  },
  dropdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: r(16),
    gap: r(12),
  },
  dropdownItem: {
    flex: 1,
  },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: r(8),
    padding: r(12),
    backgroundColor: COLORS.background,
  },
  dropdownText: {
    fontSize: 14,
    color: COLORS.primary,
    fontFamily: FontWeight.Medium,
  },
  membersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: r(16),
  },
  membersTitle: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.gradient1,
  },
  membersCount: {
    fontSize: 14,
    color: COLORS.gradient1,
    fontFamily: FontWeight.Medium,
  },
  memberItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: r(8),
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: r(12),
    overflow: 'hidden',
  },
  memberAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  memberAvatarText: {
    color: "white",
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.gradient1,
  },
  memberLocation: {
    fontSize: 14,
    fontFamily: FontWeight.Regular,
    color: COLORS._5E5E5E,
  },
  memberActions: {
    padding: r(8),
  },
  memberSeparator: {
    height: 1,
    backgroundColor: COLORS._E2E2E2,
    marginVertical: r(8),
  },
  requestItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: r(8),
  },
  requestActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: r(8),
  },
  requestButton: {
    borderRadius: r(8),
    paddingVertical: r(8),
    paddingHorizontal: r(14),
    minWidth: r(90),
    alignItems: "center",
    justifyContent: "center",
  },
  approveButton: {
    backgroundColor: COLORS.primary,
  },
  rejectButton: {
    backgroundColor: COLORS._EB3434,
  },
  requestButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: FontWeight.Medium,
  },
  deleteButton: {
    backgroundColor: COLORS.white,
    borderRadius: r(8),
    paddingVertical: r(12),
    paddingHorizontal: r(16),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: r(16),
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  deleteButtonText: {
    color: COLORS._EB3434,
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    marginLeft: r(8),
  },
  createButton: {
    backgroundColor: COLORS.primary,
    borderRadius: r(8),
    paddingVertical: r(12),
    paddingHorizontal: r(16),
    justifyContent: "center",
    alignItems: "center",
    marginTop: r(16),
    marginBottom: r(100),
  },
  createButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    padding: r(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: r(8),
    fontSize: 14,
    color: COLORS._5E5E5E,
    fontFamily: FontWeight.Regular,
  },
  emptyContainer: {
    padding: r(30),
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS._5E5E5E,
    fontFamily: FontWeight.Regular,
    textAlign: 'center',
  },
  fab: {
    position: "absolute",
    bottom: r(24),
    right: r(24),
    width: 60,
    height: 60,
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

export default ManageGroup;
