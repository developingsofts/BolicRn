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
import { useCreateGroupMutation, useUpdateGroupMutation, useDeleteGroupMutation, useGetGroupMembersQuery } from '../../services/api/groupsApi';
import { Toast } from '../../components/ToastManager';

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

const ManageGroup: React.FC<ManageGroupProps> = ({
  navigation,
  route,
  group: propGroup,
  onClose,
}) => {
  const isEditing = route?.params?.isEditing ?? (propGroup ? true : false);
  const group = route?.params?.group || propGroup;

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

  // API mutations
  const [createGroup, { isLoading: isCreating }] = useCreateGroupMutation();
  const [updateGroup, { isLoading: isUpdating }] = useUpdateGroupMutation();
  const [deleteGroup, { isLoading: isDeleting }] = useDeleteGroupMutation();
  
  // Fetch group members when editing
  const { data: membersData, isLoading: isLoadingMembers } = useGetGroupMembersQuery(
    { groupId: group?.id?.toString() || '', page: 1, limit: 50 },
    { skip: !isEditing || !group?.id }
  );

  const members = (membersData?.status && membersData?.data?.members) ? membersData.data.members : [];

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

  const handleMemberAction = (memberId: string, action: string) => {
    setMemberMenuVisible(null);
    if (action === "remove") {
      Alert.alert(
        "Remove User", 
        "Are you sure you want to remove this user from the group?", 
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Remove", 
            style: "destructive", 
            onPress: () => {
              // TODO: Implement remove member API call
              Toast.info('Remove member feature coming soon');
            } 
          },
        ]
      );
    } else if (action === "profile") {
      // TODO: Navigate to user profile
      Toast.info('View profile feature coming soon');
    }
  };

  const renderMember = ({ item: member }: { item: any }) => {
    const displayName = member.displayName || member.userName || 'Unknown';
    const location = member.userAddress?.city || member.location || 'Unknown location';
    const avatar = displayName.charAt(0).toUpperCase();
    
    return (
      <View style={styles.memberItem}>
        <View style={styles.memberInfo}>
          <View style={styles.memberAvatar}>
            {member.imageUrl ? (
              <Image source={{ uri: member.imageUrl }} style={styles.memberAvatarImage} />
            ) : (
              <Text style={styles.memberAvatarText}>{avatar}</Text>
            )}
          </View>
          <View style={styles.memberDetails}>
            <Text style={styles.memberName}>{displayName}</Text>
            <Text style={styles.memberLocation}>{location}</Text>
          </View>
        </View>
        <Menu
          visible={memberMenuVisible === member.id.toString()}
          contentStyle={{ backgroundColor: COLORS.white }}
          onDismiss={() => setMemberMenuVisible(null)}
          anchor={
            <TouchableOpacity
              style={styles.memberActions}
              onPress={() => setMemberMenuVisible(member.id.toString())}
            >
              <Ionicons name="ellipsis-vertical" size={20} color={COLORS.text} />
            </TouchableOpacity>
          }
        >
          <Menu.Item
            onPress={() => handleMemberAction(member.id.toString(), "profile")}
            titleStyle={{ color: COLORS.app_black }}
            title="View Profile"
          />
          <Menu.Item
            onPress={() => handleMemberAction(member.id.toString(), "remove")}
            title="Remove User"
            titleStyle={{ color: COLORS._EB3434 }}
          />
        </Menu>
      </View>
    );
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
