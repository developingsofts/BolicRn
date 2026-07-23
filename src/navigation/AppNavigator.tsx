import MyRatings from "../screens/MyRatings";
import Achievements from "../screens/Achievements";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../contexts/AuthContext";
import { RootStackParamList, MainTabParamList, FindStackParams, HomeStackParams } from "../types";
import MyPosts from "../screens/MyPosts";
import WorkoutHistory from "../screens/WorkoutHistory";
import Connections from "../screens/Connections";
import ScheduledSessions from "../screens/ScheduledSessions";
import { COLORS, DIMENSIONS, API_CONFIG } from "../config/constants";
import BolicStripeProvider from "../components/stripe-provider";

import AuthScreen from "../screens/AuthScreen";
import HomeScreen from "../screens/HomeScreen";
import FindScreen from "../screens/FindScreen";
import MessagesScreen from "../screens/MessagesScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ChatScreen from "../screens/ChatScreen";
import WorkoutSessionScreen from "../screens/WorkoutSessionScreen";
import SelectWorkoutScreen from "../screens/SelectWorkoutScreen";
import CreatePostScreen from "../screens/CreatePostScreen";
import SettingsScreen from "../screens/SettingsScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import ShareWorkoutScreen from "../screens/ShareWorkoutScreen";
import BookTrainerScreen from "../screens/BookTrainerScreen";
import SelectDateTimeScreen from "../screens/SelectDateTimeScreen";
import BookingConfirmationScreen from "../screens/BookingConfirmationScreen";
import BookingSuccessScreen from "../screens/BookingSuccessScreen";
import TrainerSetup from "../screens/TrainerSetup";
import MyBookingsScreen from "../screens/MyBookingsScreen";
import RescheduleSessionScreen from "../screens/RescheduleSessionScreen";
import TrainerAvailability from "../screens/TrainerAvailability";
import TrainerPricing from "../screens/TrainerPricing";

import LoadingScreen from "../components/LoadingScreen";
import ForgotPassword from "../screens/ForgotPassword";
import GroupsScreen from "../screens/group/GroupsScreen";
import GroupDetails from "../screens/group/GroupDetails";
import ManageGroup from "../screens/group/ManageGroup";
const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const FindStack = createStackNavigator<FindStackParams>();
const HomeStack = createStackNavigator<HomeStackParams>();

const FindStackNavigator: React.FC = () => {
  return (
    <FindStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <FindStack.Screen name="FindMain" component={FindScreen} />
      <FindStack.Screen name="UserProfile" component={ProfileScreen} />

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
      <HomeStack.Screen name="HomeFeed" component={HomeScreen} />
      <HomeStack.Screen name="CreatePost" component={CreatePostScreen} />
      <HomeStack.Screen name="ShareWorkout" component={ShareWorkoutScreen} />

    </HomeStack.Navigator>
  );
};

const MainTabNavigator: React.FC = () => {
  return (
    <SafeAreaView style={{ flex: 1, }} edges={[]}>
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          paddingBottom: 40,
          height: 100,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
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
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Find"
        component={FindStackNavigator}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "search" : "search-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Groups"
        component={GroupsScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "people" : "people-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "chatbubbles" : "chatbubbles-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
    </SafeAreaView>
  );
};

const AppNavigator: React.FC = () => {
  const { isAuthenticated, isBootstrapping } = useAuth();

  const linking = {
    prefixes: ['bolic://', API_CONFIG.baseUrl],
    config: {
      screens: {
        Auth: 'auth',
        ForgotPassword: {
          path: 'reset-password',
          parse: {
            token: (token: string) => token,
          },
        },
        Main: 'main',
      },
    },
  };

  if (isBootstrapping) {
    return <LoadingScreen />;
  }
console.log("API URL:", API_CONFIG.baseUrl,isAuthenticated);
  return (
    <NavigationContainer linking={linking}>
      {isAuthenticated ? (
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="SelectWorkout" component={SelectWorkoutScreen} />
          <Stack.Screen name="WorkoutSession" component={WorkoutSessionScreen} />
          <Stack.Screen name="CreatePost" component={CreatePostScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="GroupDetails" component={GroupDetails} />
          <Stack.Screen name="ManageGroup" component={ManageGroup} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="UserProfile" component={ProfileScreen} />
          <Stack.Screen name="MyPosts" component={MyPosts} />
          <Stack.Screen name="WorkoutHistory" component={WorkoutHistory} />
          <Stack.Screen name="Connections" component={Connections} />
          <Stack.Screen name="ShareWorkout" component={ShareWorkoutScreen} />
          <Stack.Screen name="Achievements" component={Achievements} />
          <Stack.Screen name="MyRatings" component={MyRatings} />
          <Stack.Screen name="ScheduledSessions" component={ScheduledSessions} />
          <Stack.Screen name="BookTrainer" component={BookTrainerScreen} />
          <Stack.Screen name="SelectDateTime" component={SelectDateTimeScreen} />
          <Stack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
          <Stack.Screen name="BookingSuccess" component={BookingSuccessScreen} />
          <Stack.Screen name="TrainerSetup" component={TrainerSetup} />
          <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
          <Stack.Screen name="RescheduleSession" component={RescheduleSessionScreen} />
          <Stack.Screen name="TrainerAvailability" component={TrainerAvailability} />
          <Stack.Screen name="TrainerPricing" component={TrainerPricing} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
