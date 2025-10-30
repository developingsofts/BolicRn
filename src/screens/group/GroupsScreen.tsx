import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Dimensions,
  Image,
  FlatList,
  Modal,
  ActivityIndicator,
} from "react-native";
import RefreshableScrollView from '../../components/RefreshableScrollView';
import { Menu, Button, Divider, FAB } from "react-native-paper";
import { COLORS, DIMENSIONS } from "../../config/constants";
import { SafeAreaView } from "react-native-safe-area-context";
import { Add, ArrowDown } from "../../../assets";
import FontWeight from "../../hooks/useInterFonts";
import { Group } from "../../types";
import { r } from "../../designing/responsiveDesigns";
import GroupDetails from "./GroupDetails";
import STRINGS from "../../config/strings";
import BasicTopBar from "../../components/BasicTopBar";
import { useGetAllGroupsQuery } from '../../services/api/groupsApi';
import { useAuth } from '../../contexts/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface GroupsScreenProps {
  navigation: any;
}

const GroupsScreen: React.FC<GroupsScreenProps> = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  
  const { isAuthenticated } = useAuth();
  
  const categories = ["All", "Gym", "Running", "Cycling", "Yoga", "Swimming"];
  
  // Fetch all groups (visible to everyone) with pagination and filter
  const { data: groupsData, isLoading, isFetching, refetch } = useGetAllGroupsQuery({ 
    page, 
    limit: 10,
    type: selectedCategory 
  }, { skip: !isAuthenticated });
  const userGroups = (groupsData?.status && groupsData?.data?.groups) ? groupsData.data.groups : [];
  const pagination = (groupsData?.status && groupsData?.data?.pagination) ? groupsData.data.pagination : null;

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1); // Reset to first page
    await refetch();
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!isFetching && pagination?.hasNextPage) {
      setPage(prevPage => prevPage + 1);
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setPage(1); // Reset to page 1 when filter changes
    setMenuVisible(false);
  };

  const renderGroupItem = ({ item: group }: { item: Group }) => (
    <Pressable
      style={styles.groupCard}
      onPress={() => {
        setSelectedGroup(group);
        setShowGroupDetails(true);
      }}
    >
      <View style={styles.groupHeader}>
        <Text style={styles.groupName}>{group.name}</Text>
        <Text style={styles.memberCount}>
          {(group as any).memberCount || 0} members
        </Text>
      </View>
      <Text style={styles.groupCategory}>
        {group.type || 'General'}
        {"  "}•{"  "}
        {group.location}
      </Text>
      <Text style={styles.groupDescription}>{group.description}</Text>
    </Pressable>
  );

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.container}>
      <BasicTopBar
        containerStyle={styles.header}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        title={STRINGS.GROUPS.title}
        subtitle={STRINGS.GROUPS.subtitle}
        titleStyle={styles.title}
        subtitleStyle={styles.subtitle}
        bottomView={
          <View style={styles.dropdownContainer}>
            <Menu
              visible={menuVisible}
              onDismiss={closeMenu}
              anchorPosition="bottom"
              contentStyle={styles.menuContentStyle}
              anchor={
                <Button
                  mode="outlined"
                  onPress={openMenu}
                  icon={() => (
                    <Image
                      source={ArrowDown}
                      style={{ width: 24, height: 24, right: -15 }}
                    />
                  )}
                  contentStyle={styles.buttonContentStyle}
                  style={styles.dropdownButton}
                  labelStyle={[
                    styles.dropdownButtonLabel,
                    {
                      color: selectedCategory
                        ? COLORS.app_black
                        : COLORS._5E5E5E,
                    },
                  ]}
                >
                  {selectedCategory ? selectedCategory : "Filters Dropdown"}
                </Button>
              }
            >
              {categories.map((category, index) => (
                <React.Fragment key={category}>
                  <Menu.Item
                    onPress={() => handleCategorySelect(category)}
                    title={category}
                    style={styles.menuItemStyle}
                    titleStyle={[
                      styles.menuItemText,
                      selectedCategory === category &&
                        styles.menuItemTextActive,
                    ]}
                  />
                  {index < categories.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </Menu>
          </View>
        }
      />

      {/* Groups List */}
      {isLoading && page === 1 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading groups...</Text>
        </View>
      ) : userGroups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Groups Yet</Text>
          <Text style={styles.emptyText}>
            Create your first group to start building your fitness community!
          </Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => navigation.navigate('ManageGroup')}
          >
            <Text style={styles.createButtonText}>Create Group</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <RefreshableScrollView
          style={styles.groupsContainer}
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        >
          {userGroups.map((group) => (
            <React.Fragment key={group.id}>
              {renderGroupItem({ item: group })}
            </React.Fragment>
          ))}
          {isFetching && page > 1 && (
            <View style={{ padding: 10, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          )}
          {pagination?.hasNextPage && !isFetching && (
            <TouchableOpacity 
              style={styles.loadMoreButton}
              onPress={handleLoadMore}
            >
              <Text style={styles.loadMoreText}>Load More</Text>
            </TouchableOpacity>
          )}
        </RefreshableScrollView>
      )}

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('ManageGroup')}
      >
        <Image source={Add} style={{ width: 16, height: 16 }} />
      </TouchableOpacity>

      {/* Group Details Modal */}
      <Modal
        visible={showGroupDetails}
        transparent
        navigationBarTranslucent
        statusBarTranslucent
        animationType="slide"
        onRequestClose={() => {
          setShowGroupDetails(false);
          setSelectedGroup(null);
        }}
      >
        <GroupDetails
          navigation={navigation}
          group={selectedGroup}
          onClose={() => {
            setShowGroupDetails(false);
            setSelectedGroup(null);
          }}
        />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingTop: DIMENSIONS.spacing.xxl,
    backgroundColor: COLORS.gradient3,
  },
  title: {
    fontSize: 24,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.white,
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.white,
  },
  flatListContent: {
    paddingBottom: DIMENSIONS.spacing.lg,
    marginTop: 24,
  },
  dropdownContainer: {
    marginTop: 20,
    marginBottom: DIMENSIONS.spacing.lg,
  },
  dropdownButton: {
    backgroundColor: COLORS.background,
    borderColor: COLORS._818181,
    justifyContent: "center",
    borderRadius: 5,
    height: 48,
    width: "100%",
  },
  buttonContentStyle: {
    width: "100%",
    justifyContent: "space-between",
    flexDirection: "row-reverse",
    left: -10,
  },
  dropdownButtonLabel: {
    fontSize: 14,
    fontFamily: FontWeight.Medium,
    textAlign: "left",
  },
  menuContentStyle: {
    backgroundColor: COLORS.white,
    width: SCREEN_WIDTH - DIMENSIONS.spacing.lg * 2,
  },
  menuItemStyle: {
    width: "100%",
    justifyContent: "center",
  },
  menuItemText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: "left",
  },
  menuItemTextActive: {
    color: COLORS.primary,
    fontWeight: "600",
    textAlign: "left",
  },
  groupsContainer: {
    flex: 1,
    paddingHorizontal: DIMENSIONS.spacing.lg,
  },
  groupCard: {
    borderRadius: 9,
    paddingTop: 10,
    paddingBottom: 14,
    paddingHorizontal: 14,
    marginBottom: DIMENSIONS.spacing.md,
    backgroundColor: COLORS.white,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    overflow: "hidden",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  groupName: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    flex: 1,
  },
  memberCount: {
    fontSize: 14,
    fontFamily: FontWeight.Medium,
  },
  groupCategory: {
    fontSize: 12,
    fontFamily: FontWeight.Regular,
    marginBottom: DIMENSIONS.spacing.xs,
  },
  groupLocation: {
    fontSize: 14,
    marginBottom: DIMENSIONS.spacing.xs,
  },
  groupDescription: {
    fontSize: 14,
    fontFamily: FontWeight.Regular,
    color: COLORS._5E5E5E,
    marginTop: 3,
    lineHeight: 20,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DIMENSIONS.spacing.xl,
  },
  loadingText: {
    marginTop: DIMENSIONS.spacing.md,
    fontSize: 14,
    color: COLORS._5E5E5E,
    fontFamily: FontWeight.Medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DIMENSIONS.spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS._5E5E5E,
    textAlign: 'center',
    marginBottom: DIMENSIONS.spacing.lg,
    fontFamily: FontWeight.Regular,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FontWeight.SemiBold,
  },
  loadMoreButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
    marginHorizontal: DIMENSIONS.spacing.lg,
  },
  loadMoreText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FontWeight.SemiBold,
  },
});

export default GroupsScreen;
