import React from "react";
import {  Share, Text,View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../contexts/AuthContext";
import { RootStackParamList, MainTabParamList, FindStackParams, HomeStackParams } from "../types";

// Import screens
import AuthScreen from "../screens/AuthScreen";
import HomeScreen from "../screens/HomeScreen";
import FindScreen from "../screens/FindScreen";
import MessagesScreen from "../screens/MessagesScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ChatScreen from "../screens/ChatScreen";
import WorkoutSessionScreen from "../screens/WorkoutSessionScreen";
import CreatePostScreen from "../screens/CreatePostScreen";
import SettingsScreen from "../screens/SettingsScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import ShareWorkoutScreen from "../screens/ShareWorkoutScreen";

// Import components
import LoadingScreen from "../components/LoadingScreen";
import ForgotPassword from "../screens/ForgotPassword";
import GroupsScreen from "../screens/group/GroupsScreen";
import GroupDetails from "../screens/group/GroupDetails";
import ManageGroup from "../screens/group/ManageGroup";
// Create navigators
const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const FindStack = createStackNavigator<FindStackParams>();
const HomeStack = createStackNavigator<HomeStackParams>();


// Find Stack Navigator
const FindStackNavigator: React.FC = () => {
  return (
    <FindStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <FindStack.Screen name="FindMain" component={FindScreen} />
      <FindStack.Screen name="Profile" component={ProfileScreen} />

      {/* Add more Find-related screens here */}
      {/* Example: <FindStack.Screen name="WorkoutDetails" component={WorkoutDetailsScreen} /> */}
    </FindStack.Navigator>
  );
};

const HomeStackNavigator: React.FC = () => {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="CreatePost" component={CreatePostScreen} />
      <HomeStack.Screen name="ShareWorkout" component={ShareWorkoutScreen} />

      {/* Add more Find-related screens here */}
      {/* Example: <FindStack.Screen name="WorkoutDetails" component={WorkoutDetailsScreen} /> */}
    </HomeStack.Navigator>
  );
};

// Main Tab Navigator
const MainTabNavigator: React.FC = () => {
  return (
    <SafeAreaView  style={{ flex: 1 }} edges={[]}>
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E5E5",
          paddingBottom:40,
          height: 100,
        },
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#8E8E93",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Find"
        component={FindStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>⚡</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Groups"
        component={GroupsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>◉</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>○</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>◎</Text>
          ),
        }}
      />
    </Tab.Navigator>
    </SafeAreaView>
  );
};

// App Navigator
const AppNavigator: React.FC = () => {
  const { isAuthenticated, isBootstrapping } = useAuth();

  // Show loading screen while checking authentication
  if (isBootstrapping) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          
        }}
      >
        {isAuthenticated ? (
          // Authenticated stack
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen
              name="WorkoutSession"
              component={WorkoutSessionScreen}
            />
            <Stack.Screen name="CreatePost" component={CreatePostScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="GroupDetails" component={GroupDetails} />
            <Stack.Screen name="ManageGroup" component={ManageGroup} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="ShareWorkout" component={ShareWorkoutScreen} />

          </>
        ) : (
          // Auth stack
          <>
            <Stack.Screen name="Auth" component={AuthScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
