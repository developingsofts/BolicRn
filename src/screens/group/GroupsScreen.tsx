import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Dimensions,
  Image,
  FlatList,
  Modal,
} from "react-native";
import { Menu, Button, Divider, FAB } from "react-native-paper";
import { COLORS, DIMENSIONS } from "../../config/constants";
import { SafeAreaView } from "react-native-safe-area-context";
import { Add, ArrowDown } from "../../../assets";
import FontWeight from "../../hooks/useInterFonts";
import { Group } from "../../types";
import { r } from "../../designing/responsiveDesigns";
import GroupDetails from "./GroupDetails";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface GroupsScreenProps {
  navigation: any;
}

const GroupsScreen: React.FC<GroupsScreenProps> = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const [menuVisible, setMenuVisible] = useState(false);
  const categories = ["All", "Gym", "Running", "CrossFit", "Yoga", "Sports"];
  const [showGorupDetails, setShowGorupDetails] = useState(false);

  const mockGroups: Group[] = [
    {
      id: "1",
      name: "Downtown Fitness Club",
      description: "24/7 gym with all equipment",
      memberCount: 156,
      trainingTypes: ["Gym", "Weightlifting"],
      location: "Downtown",
      isMember: true,
      createdAt: new Date("2023-01-15"),
    },
    {
      id: "2",
      name: "Morning Runners",
      description: "Daily morning running group",
      memberCount: 89,
      trainingTypes: ["Running", "Cardio"],
      location: "Central Park",
      isMember: false,
      createdAt: new Date("2023-02-10"),
    },
    {
      id: "3",
      name: "CrossFit Warriors",
      description: "High-intensity functional fitness",
      memberCount: 234,
      trainingTypes: ["CrossFit", "HIIT"],
      location: "West Side",
      isMember: true,
      createdAt: new Date("2023-01-20"),
    },
    {
      id: "4",
      name: "Yoga Flow Studio",
      description: "Mindful yoga and meditation",
      memberCount: 67,
      trainingTypes: ["Yoga", "Meditation"],
      location: "East Village",
      isMember: false,
      createdAt: new Date("2023-03-05"),
    },
  ];

  const renderGroupItem = ({ item: group }: { item: Group }) => (
    <Pressable
      style={styles.groupCard}
      onPress={() => {
        //  navigation.navigate("GroupDetails", { group })
        setSelectedGroup(group);
        setShowGorupDetails(true);
      }}
    >
      <View style={styles.groupHeader}>
        <Text style={styles.groupName}>{group.name}</Text>
        <Text style={styles.memberCount}>{group.memberCount} members</Text>
      </View>
      <Text style={styles.groupCategory}>
        {group.trainingTypes.join(", ")}
        {"  "}•{"  "}
        {group.location}
      </Text>
      <Text style={styles.groupDescription}>{group.description}</Text>
    </Pressable>
  );

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    closeMenu();
  };

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Groups</Text>
        <Text style={styles.subtitle}>Join gym and training groups</Text>

        {/* Category Dropdown */}
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
                    color: selectedCategory ? COLORS.app_black : COLORS._5E5E5E,
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
                    selectedCategory === category && styles.menuItemTextActive,
                  ]}
                />
                {index < categories.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </Menu>
        </View>
      </View>

      {/* Groups */}
      <FlatList
        data={mockGroups}
        renderItem={renderGroupItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.groupsContainer}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity style={styles.fab}>
        <Image source={Add} style={{ width: 16, height: 16 }} />
      </TouchableOpacity>

      <Modal
        visible={showGorupDetails}
        transparent
        navigationBarTranslucent
        statusBarTranslucent
        animationType="slide"
        onRequestClose={() => {
          setShowGorupDetails(false);
          setSelectedGroup(null);
        }}
      >
        <GroupDetails
          navigation={navigation}
          group={selectedGroup}
          onClose={() => {
            setShowGorupDetails(false);
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
});

export default GroupsScreen;
